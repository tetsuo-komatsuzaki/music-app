// アップロード音声のサーバー側検証 (2026-08-08 システム部監査 P1)。
//
// 録音は署名URLで Storage に直PUTされるため、ブラウザの自己申告MIMEしか通っていない。
// 解析(Cloud Run)を起動する前に、実ファイルの先頭バイト(magic number)とサイズを検証し、
// 音声でない/巨大なファイルを弾く → 解析コストの無駄・アナライザのクラッシュ・ストレージ肥大を防ぐ。

/** 録音の最大バイト数 (実利用は数MB。30MBで十分な余裕・巨大ファイルは拒否) */
export const MAX_AUDIO_BYTES = 30 * 1024 * 1024

const ascii = (b: Uint8Array, start: number, s: string): boolean => {
  for (let i = 0; i < s.length; i++) if (b[start + i] !== s.charCodeAt(i)) return false
  return true
}

/**
 * 先頭バイトから対応音声フォーマットか判定 (純関数・テスト対象)。
 * 対応: WebM/Matroska(EBML) / Ogg / MP4(ftyp) / WAV(RIFF..WAVE)。
 * getSignedUploadUrl の ALLOWED_MIME (webm/ogg/mp4) + 変換後WAV を網羅。
 */
export function isKnownAudioMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  // WebM / Matroska: EBML header 0x1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return true
  // Ogg: "OggS"
  if (ascii(bytes, 0, "OggS")) return true
  // MP4/M4A: 先頭4バイトはboxサイズ、offset4に "ftyp"
  if (ascii(bytes, 4, "ftyp")) return true
  // WAV: "RIFF"...."WAVE"
  if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WAVE")) return true
  return false
}

export type AudioCheck = { ok: true } | { ok: false; reason: "too_large" | "not_audio"; detail: string }

/** サイズ + magic-byte をまとめて検証。 */
export function checkAudioFile(bytes: Uint8Array): AudioCheck {
  if (bytes.length > MAX_AUDIO_BYTES) {
    return { ok: false, reason: "too_large", detail: `${bytes.length} bytes > ${MAX_AUDIO_BYTES}` }
  }
  if (!isKnownAudioMagic(bytes)) {
    return { ok: false, reason: "not_audio", detail: "unknown magic bytes" }
  }
  return { ok: true }
}
