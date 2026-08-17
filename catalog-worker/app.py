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
import io
import json
import os
import re
import tempfile
import time
import traceback
from datetime import datetime, timezone

import requests
from flask import Flask, request, jsonify

import catalog_import as ci  # shared extraction pipeline (copied into the image)

SUPABASE_URL = os.environ.get("SUPABASE_URL", ci.DEFAULT_SUPABASE_URL).rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
# Defaults to flash (reliable + generous free tier). Set GEMINI_MODEL /
# GEMINI_OUTLINE_MODEL = gemini-2.5-pro in Cloud Run to opt into pro (needs a
# billing-enabled key — pro fails on the free tier).
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_OUTLINE_MODEL = os.environ.get("GEMINI_OUTLINE_MODEL", "gemini-2.5-flash")
CHUNK_PAGES = int(os.environ.get("CHUNK_PAGES", "80"))
# Curated mode: global cap on the representative highlight-reel (see curate_products).
CURATED_MAX = int(os.environ.get("CURATED_MAX", str(ci.CURATED_MAX)))

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
        f"?id=eq.{import_id}&select=id,source_pdf_path,original_filename,status,import_notes,extraction_mode",
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
            model=GEMINI_MODEL, outline_model=GEMINI_OUTLINE_MODEL, chunk_pages=CHUNK_PAGES,
            log=lambda *a: print(*a, flush=True),
            progress=progress,
            hint=row.get("import_notes"),  # optional per-catalog admin guidance
            mode=(row.get("extraction_mode") or "curated"),  # 'curated' | 'full'
            curated_max=CURATED_MAX,
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


# ── Gemini assist (per-field suggestions + ask-about-this-factory) ───────────
_BILINGUAL = {"type": "object",
              "properties": {"ar": {"type": "string"}, "en": {"type": "string"}},
              "required": ["ar", "en"]}

FIELD_WANT = {
    "product_name":  "a short, specific product NAME (type + 1-2 key visual traits, e.g. 'Modern 3-seater leather sofa')",
    "description":   "a concise 1-2 sentence product DESCRIPTION (style, material, use)",
    "specifications": "key SPECIFICATIONS (materials, dimensions, capacity, and the variant range if grouped)",
    "name_en":       "an English company/brand name or transliteration",
    "description_ar": "a concise 2-3 sentence FACTORY description (what it makes + capabilities)",
    "description_en": "a concise 2-3 sentence FACTORY description (what it makes + capabilities)",
    # Factory-profile fields for the console's per-field AI-assist:
    "address": "a clean, presentable business ADDRESS line for a company profile — district / city / province / country, e.g. 'Houjie Town, Dongguan, Guangdong, China'. Compose it from the city/country in the context; if only the country is known, give a professional province/city-level line. Do NOT invent a specific street number or building.",
    "export_markets": "a short EXPORT MARKETS line for a supplier profile — e.g. '30+ countries' or 'Middle East, Europe, Southeast Asia'. Base it on the context; keep it concise and professional.",
    "moq": "a short MOQ (minimum order) statement for a supplier profile — e.g. 'MOQ negotiable' or a typical minimum for this product category. Keep it one short line.",
}


def _gemini(prompt, image_bytes=None, json_schema=None, max_tokens=1024):
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    parts = []
    if image_bytes:
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
    parts.append(prompt)
    cfg = types.GenerateContentConfig(temperature=0.3, max_output_tokens=max_tokens)
    if json_schema:
        cfg.response_mime_type = "application/json"
        cfg.response_schema = json_schema
    resp = client.models.generate_content(model=GEMINI_MODEL, contents=parts, config=cfg)
    return resp.text or ""


def _loads_lenient(raw):
    """Parse the model's JSON, tolerating code fences and MAX_TOKENS truncation.
    A bilingual description can be long; if the JSON is cut off mid-string we still
    pull out whatever ar/en values are present, so the admin gets a partial
    suggestion instead of a 500 from json.loads on an unterminated string."""
    if not raw:
        return {}
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?|```$", "", s, flags=re.I).strip()
    try:
        return json.loads(s)
    except Exception:  # noqa: BLE001 — truncated/partial JSON: salvage the fields
        out = {}
        for k in ("ar", "en"):
            # a properly closed value first; else an unterminated (truncated) tail
            m = (re.search(r'"%s"\s*:\s*"((?:[^"\\]|\\.)*)"' % k, s)
                 or re.search(r'"%s"\s*:\s*"((?:[^"\\]|\\.)*)$' % k, s))
            if m:
                try:
                    out[k] = json.loads('"' + m.group(1) + '"')
                except Exception:  # noqa: BLE001
                    out[k] = m.group(1)
        return out


@app.route("/assist", methods=["POST", "OPTIONS"])
def assist():
    if request.method == "OPTIONS":
        return ("", 204)
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not _is_admin(token):
        return jsonify({"error": "forbidden"}), 403
    body = request.get_json(silent=True) or {}
    mode = body.get("mode")
    try:
        if mode == "field":
            want = FIELD_WANT.get(str(body.get("field", "")), "the requested value")
            context = body.get("context", {})
            img = None
            url = body.get("image_url")
            if url:
                try:
                    r = requests.get(url, timeout=20)
                    img = r.content if r.ok else None
                except requests.RequestException:
                    img = None
            prompt = (
                "You help curate a B2B factory supplier profile for Saudi buyers. "
                f"Suggest {want}, in BOTH Arabic and English. You MAY phrase and compose the value professionally "
                "from the context (e.g. a clean address line from a known city/country, or a polished description) "
                "so it reads well on a public profile — just do NOT fabricate hard facts (an exact street number, "
                "certifications, or numbers not implied by the context). Keep it concise and professional. Only if "
                "the context is truly empty, return empty strings.\n\nCONTEXT:\n" + json.dumps(context, ensure_ascii=False)[:4000])
            raw = _gemini(prompt, image_bytes=img, json_schema=_BILINGUAL, max_tokens=2048)
            data = _loads_lenient(raw)
            return jsonify({"ar": data.get("ar", ""), "en": data.get("en", "")}), 200

        if mode == "ask":
            question = str(body.get("question", ""))[:2000]
            context = body.get("context", {})
            prompt = (
                "You are an assistant helping an admin curate a factory's supplier profile. Answer the question "
                "CONCISELY, based ONLY on the provided factory/catalog data. If the data does not contain the answer, "
                "say so plainly. Reply in the SAME language as the question.\n\nDATA:\n"
                + json.dumps(context, ensure_ascii=False)[:12000] + "\n\nQUESTION: " + question)
            raw = _gemini(prompt, max_tokens=1024)
            return jsonify({"answer": raw.strip()}), 200

        return jsonify({"error": "bad mode"}), 400
    except Exception as e:  # noqa: BLE001
        traceback.print_exc()
        return jsonify({"error": str(e)[:300]}), 500


# ── Separate price file → match to the extracted products ────────────────────
# Some factories send prices in a SEPARATE file (a price list PDF / Excel / image)
# rather than on the catalog itself. The admin uploads that file (stored on the
# import row's price_file_path); this endpoint feeds it to Gemini alongside the
# already-extracted product list and writes each matched price/currency back into
# the staging row's extracted_json (which the admin then reviews before approving).
MATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "matches": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "idx": {"type": "integer"},
                    "price": {"type": "string"},
                    "currency": {"type": "string"},
                },
                "required": ["idx", "price", "currency"],
            },
        }
    },
    "required": ["matches"],
}

_IMG_MIME = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


def _gemini_doc(prompt, file_bytes=None, mime_type=None, json_schema=None, max_tokens=2048):
    """Like _gemini but accepts an arbitrary document part (PDF / image) by mime."""
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    parts = []
    if file_bytes and mime_type:
        parts.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))
    parts.append(prompt)
    cfg = types.GenerateContentConfig(temperature=0.1, max_output_tokens=max_tokens)
    if json_schema:
        cfg.response_mime_type = "application/json"
        cfg.response_schema = json_schema
    resp = client.models.generate_content(model=GEMINI_MODEL, contents=parts, config=cfg)
    return resp.text or ""


def _spreadsheet_to_text(data, ext):
    """Flatten a CSV/Excel price file into tab-separated text for the prompt —
    Gemini does not parse .xlsx natively, so we hand it the cell grid as text."""
    if ext == "csv":
        return data.decode("utf-8", errors="replace")[:60000]
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=True)
    lines = []
    for ws in wb.worksheets:
        lines.append(f"# Sheet: {ws.title}")
        for row in ws.iter_rows(values_only=True):
            cells = ["" if c is None else str(c) for c in row]
            if any(c.strip() for c in cells):
                lines.append("\t".join(cells))
    return "\n".join(lines)[:60000]


def _salvage_matches(raw):
    """Extract {idx,price,currency} objects even if the JSON was truncated."""
    out = []
    for m in re.finditer(
            r'\{[^{}]*?"idx"\s*:\s*(\d+)[^{}]*?"price"\s*:\s*"((?:[^"\\]|\\.)*)"'
            r'(?:[^{}]*?"currency"\s*:\s*"((?:[^"\\]|\\.)*)")?[^{}]*?\}', raw or ""):
        out.append({"idx": int(m.group(1)), "price": m.group(2), "currency": m.group(3) or ""})
    return out


@app.route("/match-prices", methods=["POST", "OPTIONS"])
def match_prices():
    if request.method == "OPTIONS":
        return ("", 204)
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not _is_admin(token):
        return jsonify({"error": "forbidden"}), 403

    body = request.get_json(silent=True) or {}
    import_id = str(body.get("import_id") or "").strip()
    if not import_id:
        return jsonify({"error": "import_id required"}), 400

    # Import row → the uploaded price file path.
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/factory_catalog_imports?id=eq.{import_id}&select=id,price_file_path",
        headers=SR_HEADERS, timeout=15)
    rows = r.json() if r.ok else []
    if not rows:
        return jsonify({"error": "import not found"}), 404
    price_path = rows[0].get("price_file_path")
    if not price_path:
        return jsonify({"error": "no price_file_path on import"}), 400

    # Staged products (id + name + ref) in display order.
    pr = requests.get(
        f"{SUPABASE_URL}/rest/v1/factory_catalog_import_products"
        f"?import_id=eq.{import_id}&select=id,extracted_json,sort_order&order=sort_order",
        headers=SR_HEADERS, timeout=30)
    prods = pr.json() if pr.ok else []
    if not prods:
        return jsonify({"error": "no products to match"}), 400

    def _name(ej):
        n = (ej or {}).get("product_name") or {}
        if isinstance(n, dict):
            return n.get("en") or n.get("ar") or ""
        return str(n or "")

    catalog = [{"idx": i, "name": _name(p.get("extracted_json")),
                "ref": ((p.get("extracted_json") or {}).get("ref_code") or "")}
               for i, p in enumerate(prods)]

    supa = ci.Supa(SUPABASE_URL, SERVICE_KEY)
    try:
        data = supa.download("factory-catalogs", price_path)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": f"could not download price file: {str(e)[:200]}"}), 400

    ext = price_path.rsplit(".", 1)[-1].lower() if "." in price_path else ""

    prompt = (
        "You are matching a factory PRICE LIST to a list of already-extracted PRODUCTS. "
        "For EACH product in PRODUCTS, find its price in the attached price list and return it. Rules:\n"
        "- Match by model/ref_code FIRST (strongest signal), then by product name.\n"
        "- Return the price VERBATIM as printed, keeping any unit or range (e.g. '12.50', '$12-15/pc', 'USD 8/set').\n"
        "- currency: the ISO code if determinable (USD, CNY, SAR, EUR, ...), else ''.\n"
        "- If you cannot CONFIDENTLY match a product, OMIT it (do NOT guess a price).\n"
        "- Use each product's idx exactly as given.\n\n"
        "PRODUCTS:\n" + json.dumps(catalog, ensure_ascii=False)[:20000]
    )

    try:
        if ext in _IMG_MIME:
            raw = _gemini_doc(prompt, file_bytes=data, mime_type=_IMG_MIME[ext],
                              json_schema=MATCH_SCHEMA, max_tokens=32768)
        elif ext in ("xlsx", "xlsm", "xls", "csv"):
            text = _spreadsheet_to_text(data, ext)
            raw = _gemini_doc(prompt + "\n\nPRICE LIST (spreadsheet cells):\n" + text,
                              json_schema=MATCH_SCHEMA, max_tokens=32768)
        else:  # pdf (and any other document) — Gemini reads PDFs natively
            raw = _gemini_doc(prompt, file_bytes=data, mime_type="application/pdf",
                              json_schema=MATCH_SCHEMA, max_tokens=32768)
    except Exception as e:  # noqa: BLE001
        traceback.print_exc()
        return jsonify({"error": f"matching failed: {str(e)[:300]}"}), 500

    try:
        matches = (json.loads((raw or "").strip() or "{}") or {}).get("matches") or []
    except Exception:  # noqa: BLE001 — truncated JSON: salvage what we can
        matches = _salvage_matches(raw)

    matched = 0
    for m in matches:
        try:
            i = int(m.get("idx"))
        except (TypeError, ValueError):
            continue
        if not (0 <= i < len(prods)):
            continue
        price = str(m.get("price") or "").strip()
        if not price:
            continue
        currency = str(m.get("currency") or "").strip()
        row = prods[i]
        ej = dict(row.get("extracted_json") or {})
        ej["price"] = price
        if currency:
            ej["currency"] = currency
        try:
            supa.update("factory_catalog_import_products", row["id"], {"extracted_json": ej})
            matched += 1
        except Exception:  # noqa: BLE001
            traceback.print_exc()

    try:
        supa.update("factory_catalog_imports", import_id,
                    {"price_matched_at": datetime.now(timezone.utc).isoformat()})
    except Exception:  # noqa: BLE001
        pass

    return jsonify({"ok": True, "matched": matched, "total": len(prods),
                    "unmatched": len(prods) - matched}), 200


# ── Match a FREE-TEXT price list to a caller-supplied product list ────────────
# Stateless: the caller sends products [{idx,name,ref}] + price_text (e.g. pasted
# from a WhatsApp message), Gemini matches by ref/name, and we return the matches
# by idx. The CALLER applies them (to a staging import OR to live factory_products),
# so one endpoint serves both the import flow and the supplier-file flow.
@app.route("/match-prices-text", methods=["POST", "OPTIONS"])
def match_prices_text():
    if request.method == "OPTIONS":
        return ("", 204)
    token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not _is_admin(token):
        return jsonify({"error": "forbidden"}), 403

    body = request.get_json(silent=True) or {}
    products = body.get("products") or []
    price_text = str(body.get("price_text") or "").strip()
    if not products:
        return jsonify({"error": "products required"}), 400
    if not price_text:
        return jsonify({"error": "price_text required"}), 400

    catalog = [{"idx": int(p.get("idx", i)),
                "name": str(p.get("name") or "")[:200],
                "ref": str(p.get("ref") or "")[:80]}
               for i, p in enumerate(products)]

    prompt = (
        "You are matching a factory PRICE LIST to a list of PRODUCTS. "
        "For EACH product in PRODUCTS, find its price in the PRICE LIST below and return it. Rules:\n"
        "- Match by model/ref_code FIRST (strongest signal), then by product name (fuzzy is fine).\n"
        "- Return the price VERBATIM as written, keeping any unit or range (e.g. '12.50', '$4-$6.5', 'USD 8/set').\n"
        "- currency: the ISO code if determinable (USD, CNY, SAR, EUR, ...), else ''.\n"
        "- If you cannot CONFIDENTLY match a product, OMIT it (do NOT guess).\n"
        "- Use each product's idx exactly as given.\n\n"
        "PRODUCTS:\n" + json.dumps(catalog, ensure_ascii=False)[:20000] +
        "\n\nPRICE LIST (text):\n" + price_text[:8000]
    )

    try:
        raw = _gemini(prompt, json_schema=MATCH_SCHEMA, max_tokens=32768)
    except Exception as e:  # noqa: BLE001
        traceback.print_exc()
        return jsonify({"error": f"matching failed: {str(e)[:300]}"}), 500

    try:
        matches = (json.loads((raw or "").strip() or "{}") or {}).get("matches") or []
    except Exception:  # noqa: BLE001 — truncated JSON: salvage what we can
        matches = _salvage_matches(raw)

    valid_idx = {c["idx"] for c in catalog}
    out, seen = [], set()
    for m in matches:
        try:
            i = int(m.get("idx"))
        except (TypeError, ValueError):
            continue
        if i not in valid_idx or i in seen:
            continue
        price = str(m.get("price") or "").strip()
        if not price:
            continue
        seen.add(i)
        out.append({"idx": i, "price": price, "currency": str(m.get("currency") or "").strip()})

    return jsonify({"ok": True, "matches": out, "matched": len(out), "total": len(catalog)}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
