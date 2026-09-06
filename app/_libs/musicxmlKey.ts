/**
 * MusicXML から調 (keyTonic / keyMode) を自動認識する (2026-09-06 Tetsuo: 教材登録で調を手で選ばない)。
 *
 * 方針は解析器 (analyze_musicxml.py) と同じ: 最初の <key><fifths> を正とし、<mode> が無ければ長調。
 * 表記は Arcoda 標準 ('Bb' / 'F#')。管理画面の選択肢に無い異名同音 (Cb, G#, D#, A#) は選択肢側に寄せる。
 *
 * サーバー (Node) でもブラウザでも動くよう、zip の展開 (deflate) だけ外から渡す。
 *   .mxl は zip 容器: META-INF/container.xml の rootfile → 本体 XML。
 */
export type DetectedKey = { keyTonic: string; keyMode: "major" | "minor"; fifths: number; modeGiven: boolean }

const MAJOR: Record<number, string> = { [-7]: "B", [-6]: "Gb", [-5]: "Db", [-4]: "Ab", [-3]: "Eb", [-2]: "Bb", [-1]: "F", 0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#" }
const MINOR: Record<number, string> = { [-7]: "Ab", [-6]: "Eb", [-5]: "Bb", [-4]: "F", [-3]: "C", [-2]: "G", [-1]: "D", 0: "A", 1: "E", 2: "B", 3: "F#", 4: "C#", 5: "Ab", 6: "Eb", 7: "Bb" }

export function fifthsToTonic(fifths: number, mode: "major" | "minor"): string | null {
  return (mode === "minor" ? MINOR : MAJOR)[fifths] ?? null
}

/** XML 文字列から調を読む。<key> が無ければ null */
export function detectKeyFromMusicXmlText(xml: string): DetectedKey | null {
  const key = /<key\b[^>]*>([\s\S]*?)<\/key>/i.exec(xml)
  if (!key) return null
  const f = /<fifths>\s*(-?\d+)\s*<\/fifths>/i.exec(key[1])
  if (!f) return null
  const fifths = parseInt(f[1], 10)
  const m = /<mode>\s*([a-z]+)\s*<\/mode>/i.exec(key[1])
  const modeGiven = !!m
  const keyMode: "major" | "minor" = m && m[1].toLowerCase() === "minor" ? "minor" : "major"
  const keyTonic = fifthsToTonic(fifths, keyMode)
  if (!keyTonic) return null
  return { keyTonic, keyMode, fifths, modeGiven }
}

export type Inflate = (deflated: Uint8Array) => Promise<Uint8Array>

/** ファイルの中身 (生 XML でも .mxl の zip でも) から調を読む */
export async function detectKeyFromMusicXml(bytes: Uint8Array, inflate: Inflate): Promise<DetectedKey | null> {
  const xml = await musicXmlTextOf(bytes, inflate)
  return xml ? detectKeyFromMusicXmlText(xml) : null
}

/** 生 XML ならそのまま、zip (.mxl) なら本体 XML を取り出して文字列にする */
export async function musicXmlTextOf(bytes: Uint8Array, inflate: Inflate): Promise<string | null> {
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const entries = readZipEntries(bytes)
    if (entries.length === 0) return null
    const container = entries.find((e) => e.name === "META-INF/container.xml")
    let target: ZipEntry | undefined
    if (container) {
      const cxml = new TextDecoder().decode(await entryBytes(bytes, container, inflate))
      const root = /<rootfile\b[^>]*full-path="([^"]+)"/i.exec(cxml)?.[1]
      if (root) target = entries.find((e) => e.name === root)
    }
    if (!target) target = entries.find((e) => !e.name.startsWith("META-INF/") && /\.(xml|musicxml)$/i.test(e.name))
    if (!target) return null
    return new TextDecoder().decode(await entryBytes(bytes, target, inflate))
  }
  return new TextDecoder().decode(bytes)
}

type ZipEntry = { name: string; method: number; compSize: number; localOffset: number }

function readZipEntries(b: Uint8Array): ZipEntry[] {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  // End of central directory (PK\x05\x06) を末尾から探す
  let eocd = -1
  for (let i = b.length - 22; i >= 0 && i >= b.length - 22 - 65536; i--) {
    if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 0x05 && b[i + 3] === 0x06) { eocd = i; break }
  }
  if (eocd < 0) return []
  const count = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const out: ZipEntry[] = []
  for (let i = 0; i < count && p + 46 <= b.length; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break
    const method = dv.getUint16(p + 10, true)
    const compSize = dv.getUint32(p + 20, true)
    const nameLen = dv.getUint16(p + 28, true)
    const extraLen = dv.getUint16(p + 30, true)
    const commentLen = dv.getUint16(p + 32, true)
    const localOffset = dv.getUint32(p + 42, true)
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen))
    out.push({ name, method, compSize, localOffset })
    p += 46 + nameLen + extraLen + commentLen
  }
  return out
}

async function entryBytes(b: Uint8Array, e: ZipEntry, inflate: Inflate): Promise<Uint8Array> {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  if (dv.getUint32(e.localOffset, true) !== 0x04034b50) throw new Error("zip: local header not found")
  const nameLen = dv.getUint16(e.localOffset + 26, true)
  const extraLen = dv.getUint16(e.localOffset + 28, true)
  const start = e.localOffset + 30 + nameLen + extraLen
  const data = b.subarray(start, start + e.compSize)
  if (e.method === 0) return data
  if (e.method === 8) return inflate(data)
  throw new Error(`zip: unsupported method ${e.method}`)
}

/** ブラウザ用の deflate 展開 (DecompressionStream)。古いブラウザでは例外 → 呼び手で手動選択に倒す */
export async function browserInflate(deflated: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw")
  const buf = await new Response(new Blob([deflated as BlobPart]).stream().pipeThrough(ds)).arrayBuffer()
  return new Uint8Array(buf)
}
