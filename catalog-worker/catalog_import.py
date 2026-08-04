#!/usr/bin/env python3
r"""
Catalog Import — extraction job (Phase 1, local CLI, admin-operated).

Evolves poc_catalog.py into the real importer: extracts a factory catalog PDF
into the STAGING tables (factory_catalog_imports + factory_catalog_import_products)
and uploads product/profile images to Supabase Storage, using the SERVICE-ROLE
key (bypasses RLS). The admin panel then reviews + approves staged rows into the
live factory_directory / factory_products tables.

Differences from the POC:
  • bilingual ar/en only (no zh)
  • factory name_original (kept verbatim, for contacting) + name_en (only if the
    catalog prints one, else not_found)
  • chunking + page-remap for catalogs too large for one Gemini request (413)
  • uploads matched product images + the flagged profile/logo image to Storage
  • per-product confidence score
  • prefills factory contact fields from factories-reference.csv (matched by folder\file)
  • writes staging rows via the Supabase REST API (service role)

Environment:
  GEMINI_API_KEY                 (required)
  SUPABASE_SERVICE_ROLE_KEY      (required unless --dry-run)
  SUPABASE_URL                   (optional; default = Maabar prod)

Usage (PowerShell):
  $env:GEMINI_API_KEY = "..."
  $env:SUPABASE_SERVICE_ROLE_KEY = "..."
  python catalog_import.py --pdf "...\Catalog\Furniture\Rainbow_Furniture_Beds.pdf" --dry-run
  python catalog_import.py --pdf "...\Catalog\Furniture\Rainbow_Furniture_Beds.pdf"          # real import
  python catalog_import.py --pdf "...\big-catalog.pdf" --chunk-pages 120                     # large PDF
"""
from __future__ import annotations
import argparse
import io
import json
import os
import sys
import time
import uuid
from pathlib import Path

import fitz  # PyMuPDF
try:
    import requests
except ImportError:
    requests = None

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa
    pass

DEFAULT_SUPABASE_URL = "https://utzalmszfqfcofywfetv.supabase.co"
DEFAULT_CSV = r"C:\Users\mje_0\OneDrive - Northumbria University - Production Azure AD\Catalog\factories-reference.csv"


class CancelledError(Exception):
    """Raised when the admin cancels a running extraction (cooperative abort)."""

# ── Structured schema (bilingual ar/en) ─────────────────────────────────────
_BI = {"type": "object",
       "properties": {"ar": {"type": "string"}, "en": {"type": "string"}},
       "required": ["ar", "en"]}

SCHEMA = {
    "type": "object",
    "properties": {
        "factory": {
            "type": "object",
            "properties": {
                "name_original": {"type": "string"},   # verbatim, source script — used to contact the factory
                "name_en": {"type": "string"},         # only if the catalog prints one; else "not_found"
                "founded_year": {"type": "string"},    # e.g. "2012"; "not_found" if absent
                "export_markets": {"type": "string"},  # e.g. "30+ countries"; "not_found" if absent
                "moq": {"type": "string"},             # general MOQ, e.g. "from 100 pcs"; "not_found" if absent
                "private_label": {"type": "string"},   # "yes"|"no" — OEM/ODM/private-label capability
                "email": {"type": "string"},           # contact email; "not_found" if absent
                "phone": {"type": "string"},           # phone / mobile / WhatsApp; "not_found" if absent
                "address": {"type": "string"},         # full factory address as printed; "not_found" if absent
                "city": {"type": "string"},            # city; "not_found" if absent
            },
            "required": ["name_original", "name_en", "founded_year", "export_markets",
                         "moq", "private_label", "email", "phone", "address", "city"],
        },
        "profile_images": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "page_number": {"type": "integer"},
                    "position": {"type": "string"},
                    "kind": {"type": "string"},        # logo | cover | company_profile
                    "description": {"type": "string"},
                },
                "required": ["page_number", "position", "kind", "description"],
            },
        },
        "products": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "product_name": _BI,
                    "description": _BI,
                    "specifications": _BI,
                    "moq": {"type": "string"},
                    "customization_options": {"type": "array", "items": _BI},
                    "ref_code": {"type": "string"},
                    "page_number": {"type": "integer"},
                },
                "required": ["product_name", "description", "specifications", "moq",
                             "customization_options", "ref_code", "page_number"],
            },
        },
    },
    "required": ["factory", "profile_images", "products"],
}

PROMPT = """You are an expert B2B product-catalog CURATOR building a concise supplier profile for Saudi importers. Fields are BILINGUAL: Arabic + English only (NO Chinese). Read the ENTIRE document page by page.

Return ONE JSON object with keys: "factory", "profile_images", "products".

YOUR GOAL — a CURATED supplier profile, NOT a full catalog dump. The buyer should understand what this factory specializes in, its strongest categories, and its best representative products WITHOUT wading through hundreds of near-identical items. Maximize information density, minimize repetition. Think like a product manager, not an OCR tool. (If a buyer wants the complete range, the factory sends its full catalog later — your job is the highlight reel.)

CURATION RULES (products) — this is the most important part:
  1. Do NOT list every product. SELECT the strongest, most representative products that best show the factory's range and manufacturing capability.
  2. GROUP variants (colours / sizes / capacities / minor changes) into ONE product, and put the range in specifications — e.g. "Available sizes: 8/10/12/16 oz" / "المقاسات المتوفّرة: ٨/١٠/١٢/١٦ أونصة". Never a separate product per size/colour.
  3. When many items share a category, create ONE representative entry per meaningful category — not one per item.
  4. SKIP purely decorative / marketing / cover pages, and certificate pages (unless a certification materially affects a purchasing decision).
  5. Remove duplicate pages and repeated products.
  6. Decision rule — ask "does this add NEW information, or is it just another variation?" If it is only a variation, MERGE it into an existing product; do NOT create a new one.
  7. For a large catalog (hundreds of items), include only enough representative products to convey the full range — typically ~15-40, never every variant.

THE "not_found" RULE (absolute): NEVER invent. If a field is not clearly present, use the literal string "not_found" (or [] for empty lists). Curation means SELECTING and GROUPING what IS there — it NEVER means fabricating specs, MOQ, materials, or capabilities that are not shown.

TRANSLATION: For descriptive content (product names, descriptions, specifications, customization options) fill BOTH {ar, en} — translate faithfully into Arabic and English. If you cannot translate a value confidently, put "not_found" for that language. Do NOT translate — copy VERBATIM: model/ref/item/OE codes, and (in factory.name_original) the company name. Codes embedded in a spec ("M8×20", "1200×600mm") stay identical in both languages.

FIELDS:
  factory.name_original — company/factory name EXACTLY as printed (original script, e.g. Chinese); "not_found" if none. Used to CONTACT the factory, so keep it verbatim.
  factory.name_en — an English company name/transliteration ONLY if one appears anywhere in the catalog; otherwise "not_found". Do NOT invent or transliterate one yourself.
  factory.founded_year — year founded/established, from the cover or About page ("Established time: 2012.08.06" → "2012"; "since 1991" → "1991"). 4-digit year, digits only. "not_found" if not stated. Do NOT guess from other dates.
  factory.export_markets — export reach as printed ("sold in over 50 countries" → "50+ countries"). Short, English. "not_found" if not stated.
  factory.moq — a GENERAL factory-wide minimum-order statement if stated ("MOQ: 100 pcs" → "from 100 pcs"). Short, English. "not_found" if absent.
  factory.private_label — "yes" if the catalog mentions OEM, ODM, private label, custom branding, "your logo", or "customized brand" anywhere; else "no". Never "not_found".
  factory.email — the factory's CONTACT EMAIL as printed (cover / contact / back page), verbatim (e.g. "sales@huahang.com"). "not_found" if none. ADMIN-ONLY — extract it whenever present.
  factory.phone — the factory's phone / mobile / WhatsApp number as printed, verbatim with country code if shown (e.g. "+86 138 0000 0000"). "not_found" if none. ADMIN-ONLY.
  factory.address — the factory's full ADDRESS as printed (street / district / city / province), verbatim; e.g. "No. 12 Xingye Rd, Shunde District, Foshan, Guangdong, China". "not_found" if none. Shown to buyers.
  factory.city — the factory's city only (e.g. "Foshan"). "not_found" if not stated.
  profile_images[] — flag which images are the factory LOGO / COVER / company-profile image (NOT product photos): page_number (1-based), position, kind ("logo"|"cover"|"company_profile"), description. [] if none.
  products[] — one per REPRESENTATIVE product / grouped family (curated, per the rules above):
    product_name — {ar, en}. Printed name if present; else a short accurate descriptive name FROM THE PHOTO (type + 1-2 key traits, e.g. "Modern 3-seater leather sofa" / "أريكة جلد عصرية ٣ مقاعد"). Never a bare model code.
    description — {ar, en}. Brief 1-2 sentences (style, material, use); "not_found" only if truly indiscernible.
    specifications — {ar, en}. Key specs AND, when grouped, the variant range (sizes/colours/materials/capacities). Preserve material, dimensions, packaging. "not_found" if none.
    moq — as printed; NOT translated; "not_found" if absent.
    customization_options — array of {ar, en} (OEM/ODM, logo, colours, sizes…); [] if none.
    ref_code — a representative model/item number as printed; NOT translated; "not_found" if absent.
    page_number — 1-based page of the REPRESENTATIVE photo for this product.

PRESERVE commercial value (materials, key specs, OEM/ODM, MOQ, packaging, customization) — these drive purchasing. DROP repetition and decoration. The result should read like a professionally curated supplier profile, not a shortened catalog.
"""

# ── FULL prompt — extract EVERY distinct product (admin opts in per catalog) ──
# Same schema + fields + translation + "not_found" rules as PROMPT; the ONLY
# difference is the product-selection policy: keep everything, no curation.
FULL_PROMPT = """You are an expert B2B product-catalog EXTRACTOR building a COMPLETE supplier catalog for Saudi importers. Fields are BILINGUAL: Arabic + English only (NO Chinese). Read the ENTIRE document page by page.

Return ONE JSON object with keys: "factory", "profile_images", "products".

YOUR GOAL — a COMPLETE catalog, NOT a curated highlight reel. Extract EVERY distinct product the catalog prints. Do NOT select, drop, or summarize away products. The buyer wants the full range.

EXTRACTION RULES (products) — this is the most important part:
  1. Extract EVERY distinct product / SKU / model shown in the catalog. Do NOT limit the count.
  2. Do NOT group different variants into one when the catalog lists them as separate products: a different size, colour, capacity, or model number that the catalog presents as its own item = its own product entry. (You MAY note the variant in specifications too, but still emit the separate product.)
  3. The ONLY things you MERGE into one product are: the SAME physical item shown from multiple angles, the same item repeated on another page, or a single photo/collage showing one item several times. Those are ONE product — never emit literal duplicates of the identical item.
  4. SKIP only pure cover / marketing / decorative pages and certificate pages that carry no product. Everything that IS a product must appear.
  5. Ask "is this a distinct product the buyer could order, or just another photo of one I already captured?" Emit it unless it is the same item again.

THE "not_found" RULE (absolute): NEVER invent. If a field is not clearly present, use the literal string "not_found" (or [] for empty lists). Completeness means capturing every product that IS there — it NEVER means fabricating specs, MOQ, materials, or capabilities that are not shown.

TRANSLATION: For descriptive content (product names, descriptions, specifications, customization options) fill BOTH {ar, en} — translate faithfully into Arabic and English. If you cannot translate a value confidently, put "not_found" for that language. Do NOT translate — copy VERBATIM: model/ref/item/OE codes, and (in factory.name_original) the company name. Codes embedded in a spec ("M8×20", "1200×600mm") stay identical in both languages.

FIELDS:
  factory.name_original — company/factory name EXACTLY as printed (original script, e.g. Chinese); "not_found" if none. Used to CONTACT the factory, so keep it verbatim.
  factory.name_en — an English company name/transliteration ONLY if one appears anywhere in the catalog; otherwise "not_found". Do NOT invent or transliterate one yourself.
  factory.founded_year — year founded/established, from the cover or About page ("Established time: 2012.08.06" → "2012"; "since 1991" → "1991"). 4-digit year, digits only. "not_found" if not stated. Do NOT guess from other dates.
  factory.export_markets — export reach as printed ("sold in over 50 countries" → "50+ countries"). Short, English. "not_found" if not stated.
  factory.moq — a GENERAL factory-wide minimum-order statement if stated ("MOQ: 100 pcs" → "from 100 pcs"). Short, English. "not_found" if absent.
  factory.private_label — "yes" if the catalog mentions OEM, ODM, private label, custom branding, "your logo", or "customized brand" anywhere; else "no". Never "not_found".
  factory.email — the factory's CONTACT EMAIL as printed (cover / contact / back page), verbatim (e.g. "sales@huahang.com"). "not_found" if none. ADMIN-ONLY — extract it whenever present.
  factory.phone — the factory's phone / mobile / WhatsApp number as printed, verbatim with country code if shown (e.g. "+86 138 0000 0000"). "not_found" if none. ADMIN-ONLY.
  factory.address — the factory's full ADDRESS as printed (street / district / city / province), verbatim; e.g. "No. 12 Xingye Rd, Shunde District, Foshan, Guangdong, China". "not_found" if none. Shown to buyers.
  factory.city — the factory's city only (e.g. "Foshan"). "not_found" if not stated.
  profile_images[] — flag which images are the factory LOGO / COVER / company-profile image (NOT product photos): page_number (1-based), position, kind ("logo"|"cover"|"company_profile"), description. [] if none.
  products[] — one per DISTINCT product (complete, per the rules above):
    product_name — {ar, en}. Printed name if present; else a short accurate descriptive name FROM THE PHOTO (type + 1-2 key traits, e.g. "Modern 3-seater leather sofa" / "أريكة جلد عصرية ٣ مقاعد"). Never a bare model code.
    description — {ar, en}. Brief 1-2 sentences (style, material, use); "not_found" only if truly indiscernible.
    specifications — {ar, en}. Key specs (material, dimensions, capacity, packaging). "not_found" if none.
    moq — as printed; NOT translated; "not_found" if absent.
    customization_options — array of {ar, en} (OEM/ODM, logo, colours, sizes…); [] if none.
    ref_code — the model/item number as printed; NOT translated; "not_found" if absent.
    page_number — 1-based page of the REPRESENTATIVE photo for this product.

PRESERVE commercial value (materials, key specs, OEM/ODM, MOQ, packaging, customization). The result should be the COMPLETE product list — every distinct item, nothing curated away.
"""


# ── PyMuPDF: extract embedded images with page + bbox + dims + bytes ─────────
def extract_images(doc, min_dim: int):
    out = []
    for pno in range(len(doc)):
        page = doc[pno]
        seen = set()
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen:
                continue
            seen.add(xref)
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            w, h = base.get("width", 0), base.get("height", 0)
            if min_dim and (w < min_dim or h < min_dim):
                continue
            try:
                rects = page.get_image_rects(xref)
                bbox = [round(v, 1) for v in rects[0]] if rects else None
            except Exception:
                bbox = None
            out.append({"page": pno + 1, "xref": xref, "width": w, "height": h,
                        "area": w * h, "ext": base.get("ext", "png"), "bytes": base["image"],
                        "bbox": bbox})
    return out


# ── Browser-safe image bytes (decode JPEG-2000 / other to JPEG) ─────────────
# Embedded catalog images are frequently .jpx/.jp2 (JPEG 2000), which browsers
# CANNOT render. Uploading raw bytes would leave broken images in the admin
# review AND on the public factory/product pages, so decode non-web formats.
WEB_EXT = {"jpeg", "jpg", "png", "gif", "webp", "bmp"}
CONTENT_TYPE = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "gif": "image/gif", "webp": "image/webp", "bmp": "image/bmp"}


def web_safe(doc, im):
    """Return (bytes, ext) a browser can render. Passes web formats through;
       decodes anything else (jpx/jp2/tiff/...) to JPEG via the xref."""
    ext = (im.get("ext") or "png").lower()
    if ext in WEB_EXT:
        return im["bytes"], ("jpg" if ext == "jpeg" else ext)
    try:
        pix = fitz.Pixmap(doc, im["xref"])
        if pix.alpha or pix.n > 3:  # drop alpha / CMYK -> RGB
            pix = fitz.Pixmap(fitz.csRGB, pix)
        return pix.tobytes("jpeg"), "jpg"
    except Exception:  # noqa — fallback: raw bytes (rare)
        return im["bytes"], ext


# ── One Gemini request (with retry on transient/network errors) ─────────────
def gemini_call(client, types, pdf_path: Path, model: str, retries: int = 3, prompt: str = PROMPT):
    """One Gemini request on a PDF file. Returns (status, data, tokens):
         'ok'        -> parsed JSON in `data`
         'truncated' -> hit MAX_TOKENS / unparseable output; `data` usually None
         'failed'    -> transient/network error after all retries; `data` None
       A network hiccup on one call therefore never crashes the run — the caller
       retries (here), splits (on 'truncated'), or skips the slice (on 'failed')."""
    for attempt in range(1, retries + 1):
        try:
            uploaded = client.files.upload(file=str(pdf_path))
            waited = 0
            while getattr(uploaded.state, "name", str(uploaded.state)) == "PROCESSING":
                time.sleep(2); waited += 2
                uploaded = client.files.get(name=uploaded.name)
                if waited > 300:
                    raise RuntimeError("file stuck in PROCESSING > 5 min")
            if getattr(uploaded.state, "name", str(uploaded.state)) == "FAILED":
                raise RuntimeError("Gemini failed to process the file")

            resp = client.models.generate_content(
                model=model, contents=[uploaded, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json", response_schema=SCHEMA,
                    temperature=0, max_output_tokens=65536),
            )
            um = getattr(resp, "usage_metadata", None)
            tokens = getattr(um, "total_token_count", None) or 0
            finish = ""
            try:
                finish = str(resp.candidates[0].finish_reason)
            except Exception:  # noqa
                pass
            try:
                raw = resp.text or ""
            except Exception:  # noqa
                raw = ""
            if "MAX_TOKENS" in finish:
                try: return "truncated", json.loads(raw), tokens
                except Exception: return "truncated", None, tokens  # noqa
            try:
                return "ok", json.loads(raw), tokens
            except json.JSONDecodeError:
                return "truncated", None, tokens
        except Exception as e:  # noqa — transient: httpx.ReadError, ConnectError, timeouts, 5xx, ...
            if attempt < retries:
                wait = 4 * attempt
                print(f"      transient error (attempt {attempt}/{retries}): {type(e).__name__}: {str(e)[:120]} — retry in {wait}s", file=sys.stderr)
                time.sleep(wait)
            else:
                print(f"      FAILED after {retries} attempts: {type(e).__name__}: {str(e)[:160]}", file=sys.stderr)
    return "failed", None, 0


# ── Extract one page range, splitting adaptively on truncation ──────────────
def extract_range(client, types, pdf_path: Path, doc, a: int, b: int, model: str, min_pages: int, total: dict, prompt: str = PROMPT):
    """Extract ORIGINAL pages [a,b] (0-based inclusive). If the response truncates,
       halve the range and recurse (down to `min_pages`); if the call fails after
       retries, skip the slice. Returns (products, profile_images, factory) with
       page numbers already remapped to the ORIGINAL PDF."""
    n = len(doc)
    if a == 0 and b == n - 1:
        target, cleanup = pdf_path, None            # whole doc — no re-save
    else:
        sub = fitz.open(); sub.insert_pdf(doc, from_page=a, to_page=b)
        tmp = Path(os.environ.get("TEMP", ".")) / f"_ci_chunk_{uuid.uuid4().hex}.pdf"
        sub.save(str(tmp)); sub.close(); target, cleanup = tmp, tmp
    try:
        status, data, tokens = gemini_call(client, types, target, model, prompt=prompt)
    finally:
        if cleanup is not None:
            try: cleanup.unlink()
            except Exception: pass  # noqa
    total["tokens"] += tokens
    npages = b - a + 1

    if status == "failed":
        print(f"    ! pages {a+1}-{b+1}: skipped after retries (0 products from this slice)", file=sys.stderr)
        return [], [], {}

    if status == "truncated" and npages > min_pages:
        mid = a + (npages // 2) - 1
        print(f"    pages {a+1}-{b+1} truncated -> splitting into {a+1}-{mid+1} + {mid+2}-{b+1}", file=sys.stderr)
        p1, f1, fac1 = extract_range(client, types, pdf_path, doc, a, mid, model, min_pages, total, prompt)
        p2, f2, fac2 = extract_range(client, types, pdf_path, doc, mid + 1, b, model, min_pages, total, prompt)
        fac = fac1 if (fac1.get("name_original") not in (None, "not_found")) else fac2
        return p1 + p2, f1 + f2, fac

    if data is None:  # truncated at the floor, or unparseable
        print(f"    ! pages {a+1}-{b+1}: still truncated at min chunk size ({npages}p) — 0 products from this slice", file=sys.stderr)
        return [], [], {}

    prods = data.get("products") or []
    profs = data.get("profile_images") or []
    for p in prods:  p["page_number"]  = int(p.get("page_number")  or 1) + a
    for pf in profs: pf["page_number"] = int(pf.get("page_number") or 1) + a
    return prods, profs, (data.get("factory") or {})


def run_gemini(pdf_path: Path, doc, model: str, chunk_pages: int, min_pages: int, hint: str = None, should_cancel=None, mode: str = "curated"):
    """Top-level chunking (each chunk extracted via extract_range, which splits
       further on truncation). Merges products/profile_images/factory.
       `hint` = optional admin guidance for THIS catalog, appended to the prompt.
       `mode` = 'curated' (default, representative highlight reel) or 'full'
                (every distinct product — swaps the base prompt).
       `should_cancel` = optional callable; checked between chunks for a co-op abort."""
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    base = FULL_PROMPT if mode == "full" else PROMPT
    print(f"  extraction mode: {mode}")
    prompt = base
    if hint and hint.strip():
        prompt = (base + "\n\nADMIN GUIDANCE FOR THIS SPECIFIC CATALOG (apply it, but the "
                  "\"not_found\" rule still holds — never invent):\n" + hint.strip())
        print(f"  admin guidance applied ({len(hint.strip())} chars)")

    n = len(doc)
    ranges = [(a, min(a + chunk_pages, n) - 1) for a in range(0, n, chunk_pages)]
    if len(ranges) == 1:
        print(f"  Gemini: single request ({n} pages, adaptive split on truncation) ...")
    else:
        print(f"  Gemini: {len(ranges)} chunks of <= {chunk_pages} pages (adaptive split on truncation, page-remapped) ...")

    merged = {"factory": {}, "profile_images": [], "products": []}
    total = {"tokens": 0}
    for ci, (a, b) in enumerate(ranges):
        if should_cancel and should_cancel():
            raise CancelledError()
        if len(ranges) > 1:
            print(f"    chunk {ci+1}/{len(ranges)}: original pages {a+1}-{b+1}")
        prods, profs, fac = extract_range(client, types, pdf_path, doc, a, b, model, min_pages, total, prompt)
        merged["products"] += prods
        merged["profile_images"] += profs
        mf = merged["factory"]
        if (not mf.get("name_original") or mf.get("name_original") == "not_found") \
           and fac.get("name_original") and fac.get("name_original") != "not_found":
            merged["factory"] = mf = fac
        # Fill profile facts from whichever chunk carries them (cover details may
        # land in a different slice than the name).
        for k in ("name_en", "founded_year", "export_markets"):
            if (not mf.get(k) or mf.get(k) == "not_found") \
               and fac.get(k) and fac.get(k) != "not_found":
                mf[k] = fac[k]
    return merged, total["tokens"]


# ── Match images to products + resolve profile images ───────────────────────
def _filled(v):
    if isinstance(v, dict):
        return any(v.get(k) and v.get(k) != "not_found" for k in ("ar", "en"))
    return bool(v) and v != "not_found"


def _norm_name(pr):
    n = pr.get("product_name") or {}
    return str(n.get("en") or n.get("ar") or "").strip().lower()


def _ref(pr):
    v = pr.get("ref_code")
    return str(v).strip().lower() if _filled(v) else ""


def _fill_missing(tgt, src):
    """Fill empty fields on tgt from a duplicate src, and union customization."""
    for k in ("moq", "ref_code"):
        if not _filled(tgt.get(k)) and _filled(src.get(k)):
            tgt[k] = src[k]
    for k in ("product_name", "description", "specifications"):
        to, so = dict(tgt.get(k) or {}), src.get(k) or {}
        for lang in ("ar", "en"):
            if not _filled(to.get(lang)) and _filled(so.get(lang)):
                to[lang] = so[lang]
        tgt[k] = to
    a = list(tgt.get("customization_options") or [])
    seen = {(str(x.get("ar")), str(x.get("en"))) for x in a if isinstance(x, dict)}
    for x in (src.get("customization_options") or []):
        if isinstance(x, dict):
            k = (str(x.get("ar")), str(x.get("en")))
            if k not in seen:
                a.append(x); seen.add(k)
    tgt["customization_options"] = a


def merge_duplicate_products(products):
    """Collapse over-split entries so the SAME item (multiple angles / a set /
       a composite image) becomes ONE product. Merge by ref_code; else by
       (page + identical name). Order preserved."""
    out, seen = [], {}
    for pr in products:
        rc = _ref(pr)
        if rc:
            key = ("ref", rc)
        else:
            nm = _norm_name(pr)
            key = ("pn", int(pr.get("page_number") or 0), nm) if nm else None
        if key is not None and key in seen:
            _fill_missing(out[seen[key]], pr)
            continue
        out.append(pr)
        if key is not None:
            seen[key] = len(out) - 1
    return out


def match_and_score(products, images, profile_flags):
    imgs_by_page = {}
    for im in images:
        imgs_by_page.setdefault(im["page"], []).append(im)
    for lst in imgs_by_page.values():
        lst.sort(key=lambda x: x["area"], reverse=True)

    # Resolve profile images: largest image on each flagged page.
    profile_imgs, profile_xrefs = [], set()
    for pf in profile_flags:
        pg = int(pf.get("page_number") or 0)
        cands = imgs_by_page.get(pg, [])
        if cands:
            im = cands[0]
            if im["xref"] not in profile_xrefs:
                profile_xrefs.add(im["xref"])
                profile_imgs.append({**im, "flag": pf})

    # Group products by page (preserve extraction order) and assign images.
    prods_by_page = {}
    for pr in products:
        prods_by_page.setdefault(int(pr.get("page_number") or 0), []).append(pr)

    for pg, prods in prods_by_page.items():
        cands = [im for im in imgs_by_page.get(pg, []) if im["xref"] not in profile_xrefs]
        ambiguous = len(prods) > 1
        for i, pr in enumerate(prods):
            im = cands[i] if i < len(cands) else (cands[0] if cands else None)
            pr["_image"] = im
            pr["_has_image"] = im is not None
            pr["_ambiguous"] = ambiguous and len(cands) > 1

    for pr in products:
        s = 0.0
        if _filled(pr.get("product_name")):   s += 0.35
        if pr.get("_has_image"):              s += 0.25
        if _filled(pr.get("ref_code")):       s += 0.20
        if _filled(pr.get("specifications")): s += 0.20
        if pr.get("_ambiguous"):              s -= 0.15
        pr["_confidence"] = round(max(0.0, min(1.0, s)), 3)
    return profile_imgs


# ── factories-reference.csv prefill (match by "Folder\filename") ────────────
def _nf(v):
    v = (v or "").strip()
    return "not_found" if (not v or v.lower() == "not found") else v


def csv_prefill(csv_path: str, pdf_path: Path):
    import csv as csvmod
    if not csv_path or not Path(csv_path).exists():
        return {}
    rel = f"{pdf_path.parent.name}\\{pdf_path.name}".lower()
    fname = pdf_path.name.lower()
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        for row in csvmod.DictReader(f):
            entries = [x.strip().lower() for x in (row.get("Catalog Filename", "") or "").split(",")]
            if rel in entries or fname in [Path(e).name for e in entries]:
                return {
                    "name_en": _nf(row.get("Factory Name")),
                    "email": _nf(row.get("Contact Email")),
                    "phone": _nf(row.get("Contact Phone/WhatsApp")),
                    "category_hint": (row.get("Category") or "").strip(),
                }
    return {}


# ── Supabase (service-role) REST + Storage ──────────────────────────────────
class Supa:
    def __init__(self, url, key):
        if requests is None:
            raise RuntimeError("`requests` not installed — run: pip install -r requirements.txt")
        self.url = url.rstrip("/")
        self.h = {"apikey": key, "Authorization": f"Bearer {key}"}

    def upload(self, bucket, path, data, content_type):
        r = requests.post(f"{self.url}/storage/v1/object/{bucket}/{path}", data=data,
                          headers={**self.h, "Content-Type": content_type, "x-upsert": "true"}, timeout=120)
        r.raise_for_status()
        return path  # object path within the bucket

    def public_url(self, bucket, path):
        return f"{self.url}/storage/v1/object/public/{bucket}/{path}"

    def download(self, bucket, path):
        r = requests.get(f"{self.url}/storage/v1/object/{bucket}/{path}", headers=self.h, timeout=180)
        r.raise_for_status()
        return r.content

    def insert(self, table, rows):
        r = requests.post(f"{self.url}/rest/v1/{table}", json=rows,
                          headers={**self.h, "Content-Type": "application/json", "Prefer": "return=minimal"}, timeout=60)
        if not r.ok:
            raise RuntimeError(f"insert {table} failed: {r.status_code} {r.text[:300]}")

    def update(self, table, id_, patch):
        r = requests.patch(f"{self.url}/rest/v1/{table}?id=eq.{id_}", json=patch,
                           headers={**self.h, "Content-Type": "application/json", "Prefer": "return=minimal"}, timeout=60)
        if not r.ok:
            raise RuntimeError(f"update {table} failed: {r.status_code} {r.text[:300]}")

    def delete(self, table, filt):
        r = requests.delete(f"{self.url}/rest/v1/{table}?{filt}",
                            headers={**self.h, "Prefer": "return=minimal"}, timeout=60)
        if not r.ok:
            raise RuntimeError(f"delete {table} failed: {r.status_code} {r.text[:300]}")


def run_extraction(pdf_path, *, model="gemini-2.5-flash", chunk_pages=80, min_pages=15,
                   min_dim=40, csv_path=DEFAULT_CSV, dry_run=False, out_dir="import_out",
                   supa=None, import_id=None, original_filename=None, log=print, progress=None, hint=None,
                   should_cancel=None, mode="curated"):
    """Extract a catalog PDF into the staging tables. Shared by the CLI and the
    Cloud Run worker.

      dry_run=True        → write import_preview.json, NO uploads/DB writes.
      import_id is None   → create a NEW import row (CLI: uploads the source PDF).
      import_id provided  → UPDATE that existing row (worker: the admin UI already
                            uploaded the PDF + created the 'queued' row).
      progress            → optional callable(stage, pct, note=None) for a live
                            progress bar in the admin panel (best-effort).

    Returns a summary dict. Raises on failure (the worker records it as 'failed').
    """
    def _ck():
        if should_cancel and should_cancel():
            raise CancelledError()

    def _p(stage, pct, note=None):
        _ck()   # cancellation checkpoint (raises to abort; NOT swallowed like progress)
        if progress:
            try:
                progress(stage, pct, note)
            except Exception:  # noqa: BLE001 — progress is best-effort, never fatal
                pass

    pdf_path = Path(pdf_path)
    doc = fitz.open(str(pdf_path))
    try:
        page_count = len(doc)
        log(f"PDF: {pdf_path.name}  ({page_count} pages)")

        _p("images", 8, "reading images")
        log("[1/4] PyMuPDF image extraction")
        images = extract_images(doc, min_dim)
        log(f"  {len(images)} embedded images (>= {min_dim}px)")

        _p("analyzing", 15, "reading the catalog")
        log("[2/4] Gemini extraction")
        gem, tokens = run_gemini(pdf_path, doc, model, chunk_pages, min_pages, hint=hint, should_cancel=should_cancel, mode=mode)
        products = gem.get("products") or []
        _before = len(products)
        products = merge_duplicate_products(products)
        if _before != len(products):
            log(f"  merged over-split: {_before} -> {len(products)} products")
        log(f"  {len(products)} products, {tokens} tokens")

        _p("matching", 60, "matching images")
        log("[3/4] Image matching + confidence")
        profile_imgs = match_and_score(products, images, gem.get("profile_images") or [])
        csv_fields = csv_prefill(csv_path, pdf_path) if csv_path else {}
        gfac = gem.get("factory") or {}
        factory_fields = {
            "name_original": gfac.get("name_original") or "not_found",
            "name_en": gfac.get("name_en") if _filled(gfac.get("name_en")) else csv_fields.get("name_en", "not_found"),
            "founded_year": gfac.get("founded_year") if _filled(gfac.get("founded_year")) else "not_found",
            "export_markets": gfac.get("export_markets") if _filled(gfac.get("export_markets")) else "not_found",
            "moq": gfac.get("moq") if _filled(gfac.get("moq")) else "not_found",
            "private_label": "yes" if str(gfac.get("private_label", "")).strip().lower() in ("yes", "true", "1") else "no",
            # Contact — Gemini-extracted (falls back to the CSV when running locally). ADMIN-ONLY.
            "email": gfac.get("email") if _filled(gfac.get("email")) else csv_fields.get("email", "not_found"),
            "phone": gfac.get("phone") if _filled(gfac.get("phone")) else csv_fields.get("phone", "not_found"),
            # Address is buyer-visible; city feeds the location line.
            "address": gfac.get("address") if _filled(gfac.get("address")) else "not_found",
            "city": gfac.get("city") if _filled(gfac.get("city")) else csv_fields.get("city", "not_found"),
            "category_hint": csv_fields.get("category_hint", ""),
        }
        hi = sum(1 for p in products if p.get("_confidence", 0) >= 0.7)
        log(f"  factory: {factory_fields['name_original']}  (en: {factory_fields['name_en']})")
        log(f"  csv match: {'yes' if csv_fields else 'no'}   profile images flagged: {len(profile_imgs)}")
        log(f"  confidence: {hi} high (>=0.7) / {len(products)-hi} to review")

        def product_row(pr, sort_i, image_url):
            ej = {k: pr.get(k) for k in ("product_name", "description", "specifications",
                                         "customization_options", "moq", "ref_code")}
            return {"page_no": pr.get("page_number"), "image_path": image_url,
                    "extracted_json": ej, "confidence_score": pr.get("_confidence"),
                    "status": "pending", "sort_order": sort_i}

        if dry_run:
            out = Path(out_dir); out.mkdir(exist_ok=True)
            preview = {
                "import": {"original_filename": pdf_path.name, "page_count": page_count,
                           "model": model, "tokens_used": tokens, "factory_fields": factory_fields,
                           "profile_images": [{"page": pi["page"], "kind": pi["flag"].get("kind"),
                                               "position": pi["flag"].get("position"),
                                               "w": pi["width"], "h": pi["height"]} for pi in profile_imgs]},
                "products": [product_row(pr, i, (pr["_image"] and f'(local page {pr["_image"]["page"]} {pr["_image"]["width"]}x{pr["_image"]["height"]})'))
                             for i, pr in enumerate(products)],
            }
            (out / "import_preview.json").write_text(json.dumps(preview, ensure_ascii=False, indent=2), encoding="utf-8")
            log(f"\n[DRY RUN] wrote {out/'import_preview.json'} — NO uploads or DB writes.")
            return {"dry_run": True, "products": len(products), "page_count": page_count}

        # ── Real import: upload to Storage + write staging rows (service role) ──
        if supa is None:
            raise RuntimeError("supa (service-role client) is required for a real import")
        creating = import_id is None
        if creating:
            import_id = str(uuid.uuid4())
        log(f"[4/4] Uploading + writing (import {import_id})")

        src_path = None
        if creating:
            # CLI path: upload the source PDF. (Worker path: the admin UI already did.)
            src_path = supa.upload("factory-catalogs", f"{import_id}/source.pdf", pdf_path.read_bytes(), "application/pdf")

        def put_image(im, name_stem):
            data, ext = web_safe(doc, im)
            pth = supa.upload("factory-images", f"{import_id}/{name_stem}.{ext}", data, CONTENT_TYPE.get(ext, "image/jpeg"))
            return supa.public_url("factory-images", pth)

        # profile images -> public bucket: upload ALL flagged candidates; first is
        # the default, the rest go in factory_fields.profile_candidates for choice.
        _p("uploading", 65, "uploading images")
        profile_urls = [put_image(pi, f"profile_p{pi['page']}_{pi['xref']}") for pi in profile_imgs]
        profile_url = profile_urls[0] if profile_urls else None
        factory_fields["profile_candidates"] = profile_urls

        # product images -> public bucket (only matched ones, browser-safe)
        total = len(products)
        rows, uploaded = [], 0
        for i, pr in enumerate(products):
            image_url = None
            im = pr.get("_image")
            if im is not None:
                image_url = put_image(im, f"p{im['page']}_{im['xref']}"); uploaded += 1
            rows.append(product_row(pr, i, image_url))
            if total and (i % 10 == 0 or i == total - 1):
                _p("uploading", 65 + int(32 * (i + 1) / total), f"{i + 1}/{total}")   # also a cancel checkpoint

        imp = {
            "status": "extracted", "factory_fields": factory_fields, "profile_image_path": profile_url,
            "page_count": page_count, "model": model, "tokens_used": tokens, "error": None,
        }
        for r in rows:
            r["import_id"] = import_id
        if creating:
            # The import row must exist before its products (FK) — insert it first.
            imp.update({"id": import_id, "source_pdf_path": src_path,
                        "original_filename": original_filename or pdf_path.name})
            supa.insert("factory_catalog_imports", [imp])
            for k in range(0, len(rows), 100):
                supa.insert("factory_catalog_import_products", rows[k:k + 100])
        else:
            # Worker retry: insert products FIRST, then flip status to 'extracted'
            # LAST — so the UI never sees 'extracted' with a half-inserted catalog.
            supa.delete("factory_catalog_import_products", f"import_id=eq.{import_id}")
            for k in range(0, len(rows), 100):
                supa.insert("factory_catalog_import_products", rows[k:k + 100])
            _p("done", 100, "finalizing")
            supa.update("factory_catalog_imports", import_id, imp)

        log(f"  uploaded {uploaded} product images + {'1 profile' if profile_url else 'no profile'} image")
        log(f"  wrote {len(rows)} product rows ({'created' if creating else 'updated'} import {import_id})")
        return {"import_id": import_id, "products": len(rows), "images": uploaded,
                "page_count": page_count, "tokens_used": tokens, "status": "extracted"}
    finally:
        doc.close()


def main():
    ap = argparse.ArgumentParser(description="Catalog Import extraction job (Gemini + PyMuPDF -> Supabase staging).")
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--model", default="gemini-2.5-flash")
    ap.add_argument("--chunk-pages", type=int, default=80, help="max pages per Gemini request (chunk larger PDFs)")
    ap.add_argument("--min-chunk-pages", type=int, default=15, help="floor for the adaptive split when a chunk truncates")
    ap.add_argument("--min-dim", type=int, default=40, help="ignore embedded images smaller than N px")
    ap.add_argument("--csv", default=DEFAULT_CSV, help="factories-reference.csv for contact prefill")
    ap.add_argument("--dry-run", action="store_true", help="extract + score + write import_preview.json; NO uploads/DB writes")
    ap.add_argument("--out", default="import_out", help="local output dir for --dry-run")
    ap.add_argument("--notes", default=None, help="optional per-catalog guidance appended to the Gemini prompt")
    ap.add_argument("--mode", default="curated", choices=["curated", "full"],
                    help="'curated' (representative highlight reel) or 'full' (every distinct product)")
    args = ap.parse_args()

    pdf_path = Path(args.pdf).expanduser()
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr); sys.exit(1)
    if "GEMINI_API_KEY" not in os.environ:
        print("! GEMINI_API_KEY not set", file=sys.stderr); sys.exit(1)

    supa = None
    if not args.dry_run:
        if "SUPABASE_SERVICE_ROLE_KEY" not in os.environ:
            print("! SUPABASE_SERVICE_ROLE_KEY not set (needed for a real import; use --dry-run to test)", file=sys.stderr)
            sys.exit(1)
        supa = Supa(os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL), os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    res = run_extraction(pdf_path, model=args.model, chunk_pages=args.chunk_pages,
                         min_pages=args.min_chunk_pages, min_dim=args.min_dim, csv_path=args.csv,
                         dry_run=args.dry_run, out_dir=args.out, supa=supa, hint=args.notes, mode=args.mode)
    if not args.dry_run:
        print(f"\nDone. import_id = {res['import_id']}  (status: extracted) — review it in the admin panel.")


if __name__ == "__main__":
    main()
