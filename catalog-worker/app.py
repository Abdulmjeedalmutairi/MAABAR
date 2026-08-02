#!/usr/bin/env python3
"""Catalog Import worker — Cloud Run HTTP service.

Wraps the shared extraction pipeline (catalog_import.run_extraction) so the admin
dashboard can run a catalog import end-to-end with no local tooling:

  admin uploads PDF -> factory-catalogs bucket + a 'queued' import row
  admin hits "Start extraction" -> POST /extract { import_id }
    -> this service verifies the caller is an admin (their Supabase access token)
    -> downloads the PDF, runs PyMuPDF + Gemini, uploads images, writes staging
    -> flips the import row to 'extracted' (or 'failed' with an error)
  admin reviews + approves in the existing panel.

The heavy lifting can take several minutes, so Cloud Run must be deployed with a
long request timeout (see README). The browser fires this request and then polls
the import status, so it does not block on the response.

Environment (Cloud Run):
  SUPABASE_SERVICE_ROLE_KEY   (required) — service-role key; bypasses RLS
  SUPABASE_URL                (optional) — defaults to the Maabar prod project
  GEMINI_API_KEY              (required) — passed through to the extractor
  ALLOWED_ORIGIN              (optional) — CORS origin for the admin app (default *)
  GEMINI_MODEL / CHUNK_PAGES  (optional) — extraction tuning
"""
import os
import tempfile
import time
import traceback

import requests
from flask import Flask, request, jsonify

import catalog_import as ci  # shared extraction pipeline (copied into the image)

SUPABASE_URL = os.environ.get("SUPABASE_URL", ci.DEFAULT_SUPABASE_URL).rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
CHUNK_PAGES = int(os.environ.get("CHUNK_PAGES", "80"))

SR_HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}

app = Flask(__name__)


@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    resp.headers["Access-Control-Allow-Headers"] = "authorization, content-type"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Vary"] = "Origin"
    return resp


# Admin roles — MUST mirror the DB's is_admin_user() gate, which accepts both.
ADMIN_ROLES = {"admin", "super_admin"}


def _is_admin(token: str) -> bool:
    """The caller must present their own Supabase access token, and their profile
    role must be an admin role — the same rule as the DB's is_admin_user()."""
    if not token or not SERVICE_KEY:
        return False
    try:
        u = requests.get(f"{SUPABASE_URL}/auth/v1/user",
                         headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {token}"}, timeout=15)
        if not u.ok:
            return False
        uid = (u.json() or {}).get("id")
        if not uid:
            return False
        p = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}&select=role",
                         headers=SR_HEADERS, timeout=15)
        rows = p.json() if p.ok else []
        return bool(rows) and str(rows[0].get("role", "")).lower() in ADMIN_ROLES
    except requests.RequestException:
        return False


@app.get("/")
def health():
    return jsonify({"service": "catalog-worker", "ok": True,
                    "configured": bool(SERVICE_KEY and os.environ.get("GEMINI_API_KEY"))}), 200


@app.route("/extract", methods=["POST", "OPTIONS"])
def extract():
    if request.method == "OPTIONS":
        return ("", 204)

    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not _is_admin(token):
        return jsonify({"error": "forbidden"}), 403

    body = request.get_json(silent=True) or {}
    import_id = str(body.get("import_id") or "").strip()
    if not import_id:
        return jsonify({"error": "import_id required"}), 400

    # Look up the queued import row for its uploaded source PDF + admin notes.
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/factory_catalog_imports"
        f"?id=eq.{import_id}&select=id,source_pdf_path,original_filename,status,import_notes",
        headers=SR_HEADERS, timeout=15)
    rows = r.json() if r.ok else []
    if not rows:
        return jsonify({"error": "import not found"}), 404
    row = rows[0]
    src = row.get("source_pdf_path")
    if not src:
        return jsonify({"error": "import has no source_pdf_path"}), 400

    supa = ci.Supa(SUPABASE_URL, SERVICE_KEY)

    # Throttled progress writer — updates the row's `progress` at most every ~1.5s
    # (plus on every stage change). Best-effort: never fails the extraction.
    _last = {"t": 0.0, "stage": None}

    def progress(stage, pct, note=None):
        now = time.time()
        if stage != _last["stage"] or (now - _last["t"]) > 1.5:
            _last["t"] = now
            _last["stage"] = stage
            try:
                supa.update("factory_catalog_imports", import_id,
                            {"progress": {"stage": stage, "pct": pct, "note": note}})
            except Exception:  # noqa: BLE001
                pass

    # Cancellation check — the admin sets status='cancelled'; the extractor polls
    # this at each milestone (cached ~2s to avoid hammering the DB).
    _cancel = {"t": 0.0, "v": False}

    def should_cancel():
        now = time.time()
        if not _cancel["v"] and (now - _cancel["t"]) > 2.0:
            _cancel["t"] = now
            try:
                q = requests.get(
                    f"{SUPABASE_URL}/rest/v1/factory_catalog_imports?id=eq.{import_id}&select=status",
                    headers=SR_HEADERS, timeout=10)
                rows = q.json() if q.ok else []
                _cancel["v"] = bool(rows) and rows[0].get("status") == "cancelled"
            except requests.RequestException:
                pass
        return _cancel["v"]

    tmp = None
    try:
        supa.update("factory_catalog_imports", import_id,
                    {"status": "extracting", "error": None,
                     "progress": {"stage": "downloading", "pct": 3, "note": None}})
        pdf_bytes = supa.download("factory-catalogs", src)
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
            tf.write(pdf_bytes)
            tmp = tf.name
        summary = ci.run_extraction(
            tmp, supa=supa, import_id=import_id,
            original_filename=row.get("original_filename"),
            csv_path=None,                 # no local CSV in the cloud — admin fills contact in review
            model=GEMINI_MODEL, chunk_pages=CHUNK_PAGES,
            log=lambda *a: print(*a, flush=True),
            progress=progress,
            hint=row.get("import_notes"),  # optional per-catalog admin guidance
            should_cancel=should_cancel,
        )
        return jsonify({"ok": True, **summary}), 200
    except ci.CancelledError:
        # Admin cancelled — leave the row 'cancelled' (already set by the UI).
        try:
            supa.update("factory_catalog_imports", import_id,
                        {"status": "cancelled", "progress": None})
        except Exception:  # noqa: BLE001
            pass
        return jsonify({"cancelled": True}), 200
    except Exception as e:  # noqa: BLE001 — record any failure on the row
        traceback.print_exc()
        try:
            supa.update("factory_catalog_imports", import_id, {"status": "failed", "error": str(e)[:1000]})
        except Exception:  # noqa: BLE001
            pass
        return jsonify({"error": str(e)[:500]}), 500
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
