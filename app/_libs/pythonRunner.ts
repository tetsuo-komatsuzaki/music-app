// app/_libs/pythonRunner.ts
import "server-only"
import { spawn } from "child_process"

/**
 * Python 解析の実行制御。
 *
 * 環境変数の2段階制御:
 * - ENABLE_PYTHON_ANALYSIS=false  → 明示的スキップ（Vercel 本番想定）
 * - ENABLE_PYTHON_ANALYSIS=true + PYTHON_PATH 未設定 → throw（設定漏れ検知）
 * - ENABLE_PYTHON_ANALYSIS=true + PYTHON_PATH 設定   → spawn 実行
 *
 * コード内にフォールバックパスを持たない。誤設定は即エラーで気づく設計。
 */

export type PythonRunResult =
  | { status: "executed"; code: number | null }
  | { status: "skipped"; reason: string }

export async function runPythonScript(
  scriptPath: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {}
): Promise<PythonRunResult> {
  if (process.env.ENABLE_PYTHON_ANALYSIS !== "true") {
    console.log(
      `[pythonRunner] skipped: ENABLE_PYTHON_ANALYSIS is not "true" (script=${scriptPath})`
    )
    return { status: "skipped", reason: "disabled" }
  }

  const pythonPath = process.env.PYTHON_PATH
  if (!pythonPath) {
    throw new Error(
      "[pythonRunner] ENABLE_PYTHON_ANALYSIS=true requires PYTHON_PATH env var. " +
      "Configure PYTHON_PATH in .env.local (dev) or Vercel env (prod)."
    )
  }

  return new Promise<PythonRunResult>((resolve, reject) => {
    const timeoutMs = options.timeoutMs ?? 60_000
    // shell: false (既定) により、args はシェルメタ文字として解釈されない
    // → コマンドインジェクション不可
    const child = spawn(pythonPath, [scriptPath, ...args], {
      cwd: options.cwd,
      shell: false,
    })

    let killed = false
    const timer = setTimeout(() => {
      killed = true
      child.kill("SIGTERM")
    }, timeoutMs)

    child.stdout?.on("data", (chunk) => process.stdout.write(chunk))
    child.stderr?.on("data", (chunk) => process.stderr.write(chunk))

    child.on("error", (err) => {
      clearTimeout(timer)
      reject(new Error(`[pythonRunner] spawn failed: ${err.message}`))
    })

    child.on("close", (code) => {
      clearTimeout(timer)
      if (killed) {
        reject(new Error(`[pythonRunner] timeout after ${timeoutMs}ms (script=${scriptPath})`))
        return
      }
      if (code !== 0) {
        reject(new Error(`[pythonRunner] exit code ${code} (script=${scriptPath})`))
        return
      }
      resolve({ status: "executed", code })
    })
  })
}

/**
 * Fire-and-forget 実行。バックグラウンド処理用で呼び出し元を block しない。
 * skipped の場合もログのみで resolve する。
 */
export function runPythonScriptFireAndForget(
  scriptPath: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {}
): void {
  runPythonScript(scriptPath, args, options).catch((err) => {
    console.error(
      "[pythonRunner] fire-and-forget failed:",
      err instanceof Error ? err.message : err
    )
  })
}
