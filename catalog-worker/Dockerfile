# Catalog Import worker for Cloud Run.
#
# BUILD CONTEXT = the repository ROOT (not this folder), because the image reuses
# the shared extraction pipeline in catalog-poc/catalog_import.py. In Cloud Run's
# "Deploy from GitHub" setup, set:
#     Build type    : Dockerfile
#     Source location: /catalog-worker/Dockerfile
#     (build context stays the repo root — the default)
#
# Locally:  docker build -f catalog-worker/Dockerfile -t catalog-worker .
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

COPY catalog-worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Shared extraction pipeline + the HTTP wrapper.
COPY catalog-poc/catalog_import.py ./catalog_import.py
COPY catalog-worker/app.py ./app.py

# One worker, many threads; a long timeout because extraction can take minutes.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 3600 app:app
