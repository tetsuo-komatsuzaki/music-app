"""
Relay Service: Vercel から Cloud Run Jobs を非同期起動する中継 API。
"""
from __future__ import annotations

import os
from typing import Annotated, Optional

import psycopg2
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, field_validator
from google.cloud import run_v2

app = FastAPI()

DATABASE_URL = os.environ["DATABASE_URL"]
API_KEY = os.environ["API_KEY"]
GCP_PROJECT = os.environ["GCP_PROJECT"]
GCP_REGION = os.environ["GCP_REGION"]
JOB_NAME = os.environ["JOB_NAME"]

MAX_RETRY = 3
WATCHDOG_STALE_MIN = 10
VALID_MODES = ("score_full", "analyze_musicxml", "build_score", "analyze_performance")

TARGET_TABLES = ("Score", "PracticeItem", "Performance", "PracticePerformance")


def _auth(authorization: Optional[str]) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    if authorization[len("Bearer "):] != API_KEY:
        raise HTTPException(status_code=403, detail="invalid api key")


def _db():
    return psycopg2.connect(DATABASE_URL)


class InvokeRequest(BaseModel):
    mode: str
    idempotency_key: str
    user_id: Optional[str] = None
    score_id: Optional[str] = None
    practice_item_id: Optional[str] = None
    performance_id: Optional[str] = None
    is_practice: bool = False
    recording_bpm: Optional[float] = None

    @field_validator("mode")
    @classmethod
    def _check_mode(cls, v: str) -> str:
        if v not in VALID_MODES:
            raise ValueError(f"mode must be one of {VALID_MODES}")
        return v


def _target(req: InvokeRequest) -> tuple[str, str]:
    """
    (table_name, row_id) を返す。
    """
    if req.mode == "analyze_performance":
        table = "PracticePerformance" if req.is_practice else "Performance"
        if not req.performance_id:
            raise HTTPException(400, "performance_id required")
        return table, req.performance_id
    # analyze_musicxml / build_score
    if req.practice_item_id:
        return "PracticeItem", req.practice_item_id
    if req.score_id:
        return "Score", req.score_id
    raise HTTPException(400, "score_id or practice_item_id required")


def _env_for_job(req: InvokeRequest) -> dict[str, str]:
    env = {"MODE": req.mode}
    if req.user_id:
        env["USER_ID"] = req.user_id
    if req.score_id:
        env["SCORE_ID"] = req.score_id
    if req.practice_item_id:
        env["PRACTICE_ITEM_ID"] = req.practice_item_id
    if req.performance_id:
        env["PERFORMANCE_ID"] = req.performance_id
    if req.is_practice:
        env["IS_PRACTICE"] = "true"
    if req.recording_bpm is not None:
        env["RECORDING_BPM"] = str(req.recording_bpm)
    return env


def _execute_job(env_vars: dict[str, str]) -> str:
    client = run_v2.JobsClient()
    job_path = client.job_path(GCP_PROJECT, GCP_REGION, JOB_NAME)
    overrides = run_v2.RunJobRequest.Overrides(
        container_overrides=[
            run_v2.RunJobRequest.Overrides.ContainerOverride(
                env=[run_v2.EnvVar(name=k, value=v) for k, v in env_vars.items()]
            )
        ]
    )
    operation = client.run_job(
        request=run_v2.RunJobRequest(name=job_path, overrides=overrides)
    )
    # operation.metadata.name is the full execution resource name
    return operation.metadata.name


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/invoke")
def invoke(
    req: InvokeRequest,
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    _auth(authorization)
    table, row_id = _target(req)

    with _db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT "idempotencyKey", "executionId", "retryCount", "analysisStatus" '
                f'FROM "{table}" WHERE "id" = %s',
                (row_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, f"{table} {row_id} not found")

            existing_key, existing_exec, retry_count, status = row

            # 既存 idempotency_key と一致かつ execution 済み → そのまま返す
            if existing_key == req.idempotency_key and existing_exec:
                return {"execution_id": existing_exec, "status": "exists", "previous_status": status}

            # リトライ上限
            if retry_count >= MAX_RETRY:
                raise HTTPException(422, f"retry_count {retry_count} >= {MAX_RETRY}")

            # queued / failed / retrying / error からのみ processing へ遷移
            # (既に processing なら競合の可能性 → 409)
            cur.execute(
                f'UPDATE "{table}" '
                f'SET "analysisStatus" = \'processing\'::\"JobStatus\", '
                f'"lastAttemptedAt" = now(), '
                f'"idempotencyKey" = %s, '
                f'"retryCount" = "retryCount" + 1, '
                f'"errorMessage" = NULL '
                f'WHERE "id" = %s '
                f'AND "analysisStatus" IN (\'queued\',\'retrying\',\'error\',\'done\') '
                f'RETURNING "retryCount"',
                (req.idempotency_key, row_id),
            )
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(409, "row currently processing (race)")
            conn.commit()

        # Job 起動 (DB トランザクション外で実行)
        try:
            execution_name = _execute_job(_env_for_job(req))
        except Exception as e:
            # 起動失敗 → status を failed に戻す
            with conn.cursor() as cur:
                cur.execute(
                    f'UPDATE "{table}" '
                    f'SET "analysisStatus" = \'error\'::\"JobStatus\", '
                    f'"errorMessage" = %s '
                    f'WHERE "id" = %s',
                    (f"Job invoke failed: {str(e)[:300]}", row_id),
                )
                conn.commit()
            raise HTTPException(500, f"job invoke failed: {str(e)[:200]}")

        with conn.cursor() as cur:
            cur.execute(
                f'UPDATE "{table}" SET "executionId" = %s WHERE "id" = %s',
                (execution_name, row_id),
            )
            conn.commit()

    return {
        "execution_id": execution_name,
        "status": "started",
        "retry_count": updated[0],
    }


@app.post("/watchdog")
def watchdog(
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    _auth(authorization)
    results: list[dict] = []
    executions_client = run_v2.ExecutionsClient()

    with _db() as conn:
        for table in TARGET_TABLES:
            with conn.cursor() as cur:
                cur.execute(
                    f'SELECT "id", "executionId" FROM "{table}" '
                    f"WHERE \"analysisStatus\" = 'processing' "
                    f"AND \"lastAttemptedAt\" < now() - interval '%s minutes' "
                    f'AND "executionId" IS NOT NULL',
                    (WATCHDOG_STALE_MIN,),
                )
                stale = cur.fetchall()

            for row_id, exec_name in stale:
                results.append(_sync_one(conn, table, row_id, exec_name, executions_client))
    return {"processed": results}


def _sync_one(conn, table: str, row_id: str, exec_name: str, executions_client) -> dict:
    try:
        execution = executions_client.get_execution(name=exec_name)
    except Exception as e:
        with conn.cursor() as cur:
            cur.execute(
                f'UPDATE "{table}" '
                f'SET "analysisStatus" = \'error\'::\"JobStatus\", '
                f'"errorMessage" = %s '
                f'WHERE "id" = %s AND "analysisStatus" = \'processing\'',
                (f"watchdog: execution lookup failed: {str(e)[:200]}", row_id),
            )
            conn.commit()
        return {"table": table, "id": row_id, "action": "marked error (lookup failed)"}

    # completion_time.seconds が 0 でなければ完了済み (proto-plus の default は seconds=0)
    if execution.completion_time.seconds > 0:
        if execution.succeeded_count >= 1:
            # Job は成功したが Python が DB 更新する前に死んだ可能性 → error 扱いで再実行を促す
            with conn.cursor() as cur:
                cur.execute(
                    f'UPDATE "{table}" '
                    f'SET "analysisStatus" = \'error\'::\"JobStatus\", '
                    f'"errorMessage" = %s '
                    f'WHERE "id" = %s AND "analysisStatus" = \'processing\'',
                    ("watchdog: job succeeded but DB still processing", row_id),
                )
                conn.commit()
            return {"table": table, "id": row_id, "action": "succeeded but unsynced -> error"}
        with conn.cursor() as cur:
            cur.execute(
                f'UPDATE "{table}" '
                f'SET "analysisStatus" = \'error\'::\"JobStatus\", '
                f'"errorMessage" = %s '
                f'WHERE "id" = %s AND "analysisStatus" = \'processing\'',
                ("watchdog: job execution failed", row_id),
            )
            conn.commit()
        return {"table": table, "id": row_id, "action": "synced to error"}

    # まだ実行中: last_attempted_at を更新して再延命
    with conn.cursor() as cur:
        cur.execute(
            f'UPDATE "{table}" SET "lastAttemptedAt" = now() WHERE "id" = %s',
            (row_id,),
        )
        conn.commit()
    return {"table": table, "id": row_id, "action": "still running"}
