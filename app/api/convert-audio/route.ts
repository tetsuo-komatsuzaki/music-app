import { NextRequest, NextResponse } from "next/server"
import { writeFile, unlink, readFile, mkdir } from "fs/promises"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { randomUUID } from "crypto"

const execAsync = promisify(exec)

// ffmpeg-static のパスを解決
function getFfmpegPath(): string {
  // Turbopack環境ではrequireのパスが壊れるため、process.cwdベースで直接解決
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
  const formData = await request.formData()
  const audioBlob = formData.get("audio") as Blob
  if (!audioBlob) return NextResponse.json({ error: "No audio" }, { status: 400 })

  const buffer = Buffer.from(await audioBlob.arrayBuffer())
  const tempId = randomUUID()
  const tempDir = join(process.cwd(), "tmp")
  await mkdir(tempDir, { recursive: true })

  const inputPath  = join(tempDir, `${tempId}.webm`)
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
