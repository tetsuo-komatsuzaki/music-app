import { NextRequest, NextResponse } from "next/server"
import { writeFile, unlink, readFile, mkdir } from "fs/promises"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { randomUUID } from "crypto"
import { requireAuthApi } from "@/app/_libs/requireAuth"

const execAsync = promisify(exec)

// 50MB（音声録音の実用上十分な値・DoS対策）
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

// 許容する入力 Content-Type（Recorder.tsx の MediaRecorder 出力 + Safari/iOS fallback）
const ALLOWED_CONTENT_TYPES = new Set<string>([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",    // Safari/iOS 対応（Recorder.tsx で使用確認済）
])

// TODO(Phase 1-2): マジックバイト検証を追加（Content-Type 偽装対策）
//   - file-type パッケージで先頭バイトを確認し、宣言と一致するか検証
//   - 不一致なら 415 Unsupported Media Type
// TODO(Phase 1-6): レート制限を追加（FFmpeg 実行を保護）
//   - 認証ユーザーあたり N req / M min（Upstash or Supabase テーブル）
//   - Vercel の関数実行時間課金への DoS 対策

function getFfmpegPath(): string {
  const cwdPath = join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe")
  try {
    const { existsSync } = require("fs")
    if (existsSync(cwdPath)) return cwdPath
  } catch { /* ignore */ }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static")
    return typeof ffmpegStatic === "string" ? ffmpegStatic : (ffmpegStatic.default ?? ffmpegStatic)
  } catch {
    return "ffmpeg"
  }
}

export async function POST(request: NextRequest) {
  // 認証
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const formData = await request.formData()
  const audioEntry = formData.get("audio")

  // Blob 型確認
  if (!(audioEntry instanceof Blob)) {
    return NextResponse.json({ error: "No audio" }, { status: 400 })
  }

  // サイズ検証
  if (audioEntry.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 })
  }
  if (audioEntry.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_UPLOAD_BYTES} bytes)` },
      { status: 413 }
    )
  }

  // Content-Type 検証（ホワイトリスト）
  // 注: File.type はブラウザが設定する値。マジックバイト検証は TODO(Phase 1-2)
  const contentType = audioEntry.type.toLowerCase().split(";")[0].trim()
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported audio type: ${contentType || "unknown"}` },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await audioEntry.arrayBuffer())
  const tempId = randomUUID()
  const tempDir = join(process.cwd(), "tmp")
  await mkdir(tempDir, { recursive: true })

  const inputPath = join(tempDir, `${tempId}.webm`)
  const outputPath = join(tempDir, `${tempId}.wav`)

  try {
    await writeFile(inputPath, buffer)

    const ffmpegPath = getFfmpegPath()
    await execAsync(
      `"${ffmpegPath}" -y -i "${inputPath}" -ar 44100 -ac 1 -sample_fmt s16 "${outputPath}"`,
      { timeout: 30000 }
    )

    const wavBuffer = await readFile(outputPath)
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ])

    return new NextResponse(wavBuffer, { headers: { "Content-Type": "audio/wav" } })
  } catch (err: any) {
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ])
    const detail = err.stderr || err.message || String(err)
    return NextResponse.json({ error: detail }, { status: 500 })
  }
}
