/**
 * Replicate + Flux(dev) で画像を1枚生成する薄いクライアント（依存ライブラリ不要・fetchのみ）。
 *
 * API: POST https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions
 *      Header  Authorization: Bearer $REPLICATE_API_TOKEN / Prefer: wait
 *      Body    { input: { prompt, aspect_ratio, output_format, ... } }
 *      Output  prediction.output = ["https://...画像URL"]
 *
 * ⚠️ REPLICATE_API_TOKEN を環境変数に設定すること（.env / Cloud Run のシークレット）。
 */

const MODEL = "black-forest-labs/flux-dev"
const ENDPOINT = `https://api.replicate.com/v1/models/${MODEL}/predictions`

export interface FluxOptions {
  /** "1:1" | "4:3" | "16:9" など。カバーは "1:1" */
  aspectRatio?: string
  /** "webp" | "jpeg" | "png" */
  outputFormat?: string
  /** 生成解像度(百万画素)。1 で 1024px相当 */
  megapixels?: string
  /** 高速モード（安く速い。品質重視なら false で flux 本来の精度） */
  goFast?: boolean
  /** 出力品質(jpeg/webp) 0-100 */
  outputQuality?: number
  /**
   * 乱数シード。同じ seed + 同じ prompt は同じ絵になる（再現性）。
   * ⚠️ 棚の統一感は「固定スタイル+固定パレット」で作る。seed を全教材で同一にすると
   *    構図まで似すぎるので、通常は未指定(毎回ランダム)。再現・検証時だけ固定する。
   */
  seed?: number
}

interface Prediction {
  id?: string
  status: string
  output?: string[] | string | null
  error?: string | null
  urls?: { get?: string }
}

/** Flux で1枚生成し、生成画像の URL を返す */
export async function generateFluxImage(prompt: string, opts: FluxOptions = {}): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error("REPLICATE_API_TOKEN が未設定です（.env などに設定してください）")

  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: opts.aspectRatio ?? "1:1",
    output_format: opts.outputFormat ?? "webp",
    megapixels: opts.megapixels ?? "1",
    num_outputs: 1,
    go_fast: opts.goFast ?? true,
    output_quality: opts.outputQuality ?? 90,
  }
  if (opts.seed != null) input.seed = opts.seed

  // 作成リクエスト。429(レート制限)は retry_after 待ちで数回リトライ(無料枠対策)。
  let res: Response
  let attempt = 0
  for (;;) {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait", // 最大60秒サーバ側で完了を待つ
      },
      body: JSON.stringify({ input }),
    })
    if (res.status !== 429 || attempt >= 6) break
    attempt += 1
    const txt = await res.text()
    let wait = Number(res.headers.get("retry-after"))
    if (!wait || Number.isNaN(wait)) {
      const m = txt.match(/resets in ~(\d+)s/) ?? txt.match(/"retry_after":\s*(\d+)/)
      wait = m ? Number(m[1]) : 5
    }
    await new Promise((r) => setTimeout(r, (wait + 1) * 1000))
  }

  if (!res.ok) {
    throw new Error(`Replicate API エラー ${res.status}: ${await res.text()}`)
  }

  let pred = (await res.json()) as Prediction

  // Prefer:wait でも未完了(starting/processing)で返る場合があるためポーリングで完成を待つ。
  // 無料枠(支払い方法未登録)ではキュー待ちが発生しやすいので粘る。
  let tries = 0
  while ((pred.status === "starting" || pred.status === "processing") && tries < 60) {
    await new Promise((r) => setTimeout(r, 2000))
    tries += 1
    // urls.get が無い場合は prediction id から取得URLを組み立てる
    const getUrl = pred.urls?.get ?? (pred.id ? `https://api.replicate.com/v1/predictions/${pred.id}` : null)
    if (!getUrl) break
    const p = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } })
    if (!p.ok) throw new Error(`Replicate ポーリング失敗 ${p.status}: ${await p.text()}`)
    pred = (await p.json()) as Prediction
  }

  if (pred.status === "failed" || pred.error) {
    throw new Error(`生成失敗: ${pred.error ?? "unknown"}`)
  }
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output
  if (!url) throw new Error(`出力URLがありません（status=${pred.status}）`)
  return url
}
