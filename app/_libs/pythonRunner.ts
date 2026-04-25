// app/_libs/pythonRunner.ts
import "server-only"

/**
 * 解析ジョブを Cloud Run Jobs 経由で非同期起動する。
 *
 * 2段階環境変数:
 * - ENABLE_PYTHON_ANALYSIS=false → 明示スキップ (Phase 1 互換)
 * - ENABLE_PYTHON_ANALYSIS=true + RELAY_URL/RELAY_API_KEY 未設定 → throw
 * - ENABLE_PYTHON_ANALYSIS=true + 両方設定済み → Relay へ POST
 *
 * Relay Service が Cloud Run Jobs を起動するので Server Action は即 return できる。
 */

export type InvokeMode =
  | "score_full"
  | "analyze_musicxml"
  | "build_score"
  | "analyze_performance"

export type InvokeAnalysisParams = {
  mode: InvokeMode
  idempotencyKey: string
  userId?: string
  scoreId?: string
  practiceItemId?: string
  performanceId?: string
  isPractice?: boolean
  recordingBpm?: number
}

export type InvokeAnalysisResult =
  | { status: "started" | "exists"; executionId: string; retryCount?: number }
  | { status: "skipped"; reason: string }

const RELAY_TIMEOUT_MS = 10_000

export async function invokeAnalysis(
  params: InvokeAnalysisParams
): Promise<InvokeAnalysisResult> {
  if (process.env.ENABLE_PYTHON_ANALYSIS !== "true") {
    console.log(
      `[invokeAnalysis] skipped: ENABLE_PYTHON_ANALYSIS is not "true" (mode=${params.mode})`
    )
    return { status: "skipped", reason: "disabled" }
  }

  const relayUrl = process.env.RELAY_URL
  const apiKey = process.env.RELAY_API_KEY
  if (!relayUrl || !apiKey) {
    throw new Error(
      "[invokeAnalysis] ENABLE_PYTHON_ANALYSIS=true requires RELAY_URL and RELAY_API_KEY"
    )
  }

  const body = {
    mode: params.mode,
    idempotency_key: params.idempotencyKey,
    user_id: params.userId,
    score_id: params.scoreId,
    practice_item_id: params.practiceItemId,
    performance_id: params.performanceId,
    is_practice: params.isPractice ?? false,
    recording_bpm: params.recordingBpm,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS)

  try {
    const res = await fetch(`${relayUrl}/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(
        `[invokeAnalysis] Relay ${res.status}: ${text.slice(0, 300)}`
      )
    }

    const data = (await res.json()) as {
      execution_id: string
      status: "started" | "exists"
      retry_count?: number
    }
    return {
      status: data.status,
      executionId: data.execution_id,
      retryCount: data.retry_count,
    }
  } finally {
    clearTimeout(timer)
  }
}
