FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY analyze_musicxml.py build_score.py analyze_performance.py entrypoint.py ./
# C-6b (2026-07-11): score_full.py → bowing_score.py (弓採点のみに改名・スリム化)
COPY bowing_score.py loop_engine_runner.py ./
COPY lib ./lib

CMD ["python", "entrypoint.py"]
