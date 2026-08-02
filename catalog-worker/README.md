# Catalog Import worker (Cloud Run)

Runs the Python catalog extraction (PyMuPDF + Gemini) that the Supabase edge
runtime can't (no Python, too long). The admin dashboard uploads a PDF, then
calls this service to extract it into the staging tables. The admin reviews and
approves in the panel as before.

```
Admin panel ──upload PDF──► factory-catalogs bucket + 'queued' import row
Admin panel ──POST /extract { import_id }──►  this service
                                              ├ verifies caller is an admin (their Supabase token)
                                              ├ downloads the PDF (service role)
                                              ├ PyMuPDF + Gemini → products + images
                                              ├ uploads images → factory-images bucket
                                              └ import row → 'extracted' (or 'failed')
Admin panel ──polls status──►  review + approve
```

The image reuses `catalog-poc/catalog_import.py` (the shared pipeline), so the
Docker build context is the **repo root**, and the Dockerfile lives at
`catalog-worker/Dockerfile`.

## Deploy from GitHub (continuous deployment)

1. **Cloud Run → Create Service → Continuously deploy from a repository →
   Set up with Cloud Build.**
2. Pick this GitHub repo + branch. Build configuration:
   - **Build type:** Dockerfile
   - **Source location:** `/catalog-worker/Dockerfile`
   - (leave the build context at the repo root — the default)
3. Service settings:
   - **Authentication:** Allow unauthenticated invocations
     (the service does its own admin check on the Supabase token).
   - **Request timeout:** `3600` seconds (extraction can take minutes).
   - **Memory:** `2 GiB` (4 GiB for very large catalogs). **CPU:** `2`.
   - **Min instances:** `0` (scales to zero when idle).
4. **Variables & Secrets** — set:
   | Name | Value |
   |------|-------|
   | `SUPABASE_SERVICE_ROLE_KEY` | *(secret)* the project's service-role key |
   | `GEMINI_API_KEY` | *(secret)* |
   | `SUPABASE_URL` | `https://utzalmszfqfcofywfetv.supabase.co` (optional; this is the default) |
   | `ALLOWED_ORIGIN` | your app origin, e.g. `https://maabar.io` (optional; default `*`) |
   | `GEMINI_MODEL` | optional, default `gemini-2.5-flash` |
   | `CHUNK_PAGES` | optional, default `80` |

   Keep the two keys as **Secret Manager** references, never plain env text.
5. Deploy. Copy the service URL (e.g. `https://catalog-worker-xxxx.run.app`).

Every push to the branch now rebuilds + redeploys automatically.

## Point the admin app at it

Set the build-time env var for the React app and rebuild the frontend:

```
REACT_APP_CATALOG_WORKER_URL=https://catalog-worker-xxxx.run.app
```

(Create React App bakes `REACT_APP_*` at build time — set it wherever the
frontend is built/deployed, then rebuild.) Until it's set, uploads still work and
the import waits at `queued` with a "Start extraction" button that reports the
worker isn't configured.

## Health check

`GET /` → `{ "service": "catalog-worker", "ok": true, "configured": true }`
(`configured` is true when both the service-role key and the Gemini key are set).

## Local run

```
docker build -f catalog-worker/Dockerfile -t catalog-worker .
docker run -p 8080:8080 \
  -e SUPABASE_SERVICE_ROLE_KEY=... -e GEMINI_API_KEY=... catalog-worker
```

The local CLI (`catalog-poc/catalog_import.py --pdf ...`) still works for
one-off/offline imports and shares the exact same extraction code.
