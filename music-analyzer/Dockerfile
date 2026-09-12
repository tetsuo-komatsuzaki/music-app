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

# numba の JIT コンパイル結果をイメージに焼き込む (2026-09-12)。
# Cloud Run Jobs は実行ごとに新しいコンテナで起動するため、キャッシュが無いと
# librosa.yin の初回コンパイルを毎回やり直す。本番イメージ上の実測で 22.1s → 1.6s (92.6%減)。
# NUMBA_CPU_NAME=generic は必須: キャッシュ鍵に CPU 指定が入るため、ビルド時と実行時で
# 食い違うとキャッシュを読まない。Cloud Run は載る CPU が変わりうるので generic に固定する。
# ENV は実行時のコンテナにも継承されるので、Cloud Run 側の環境変数設定は不要。
# pip install の直後に置くことで、アプリコードを変更してもこの層は再ビルドされない。
ENV NUMBA_CACHE_DIR=/app/.numba_cache \
    NUMBA_CPU_NAME=generic \
    NUMBA_CPU_FEATURES=""
COPY warm_numba.py ./
RUN python warm_numba.py

COPY analyze_musicxml.py build_score.py analyze_performance.py entrypoint.py ./
# C-6b (2026-07-11): score_full.py → bowing_score.py (弓採点のみに改名・スリム化)
COPY bowing_score.py loop_engine_runner.py ./
COPY lib ./lib

CMD ["python", "entrypoint.py"]
