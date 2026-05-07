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
# v3.2.2 Commit C / 8a: score_full.py + lib/ + loop_engine_runner.py を追加
COPY score_full.py loop_engine_runner.py ./
COPY lib ./lib

CMD ["python", "entrypoint.py"]
