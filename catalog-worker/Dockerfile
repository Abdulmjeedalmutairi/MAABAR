# Catalog Import worker for Cloud Run.
#
# SELF-CONTAINED: the build context is THIS folder (Cloud Run uses the Dockerfile's
# own directory as the context). In "Deploy from GitHub":
#     Build type     : Dockerfile
#     Source location : /catalog-worker/Dockerfile
#
# Locally:  docker build -t catalog-worker catalog-worker/
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Extraction pipeline + the HTTP wrapper.
COPY catalog_import.py ./catalog_import.py
COPY app.py ./app.py

# One worker, many threads; a long timeout because extraction can take minutes.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 3600 app:app
