import { describe, expect, it } from "vitest"
import { checkAudioFile, isKnownAudioMagic, MAX_AUDIO_BYTES } from "./audioValidation"

const withHeader = (header: number[], totalLen = 32): Uint8Array => {
  const b = new Uint8Array(totalLen)
  b.set(header, 0)
  return b
}
const str = (s: string): number[] => [...s].map((c) => c.charCodeAt(0))

describe("isKnownAudioMagic", () => {
  it("WebM (EBML 1A45DFA3) を認識", () => {
    expect(isKnownAudioMagic(withHeader([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true)
  })
  it("Ogg (OggS) を認識", () => {
    expect(isKnownAudioMagic(withHeader(str("OggS")))).toBe(true)
  })
  it("MP4 (offset4 ftyp) を認識", () => {
    expect(isKnownAudioMagic(withHeader([0, 0, 0, 0x20, ...str("ftyp")]))).toBe(true)
  })
  it("WAV (RIFF..WAVE) を認識", () => {
    expect(isKnownAudioMagic(withHeader([...str("RIFF"), 0, 0, 0, 0, ...str("WAVE")]))).toBe(true)
  })
  it("FLAC (fLaC) を認識", () => {
    expect(isKnownAudioMagic(withHeader(str("fLaC")))).toBe(true)
  })
  it("非音声(実行ファイル MZ / PNG)は拒否", () => {
    expect(isKnownAudioMagic(withHeader(str("MZ")))).toBe(false)
    expect(isKnownAudioMagic(withHeader([0x89, 0x50, 0x4e, 0x47]))).toBe(false)
  })
  it("短すぎるファイルは拒否", () => {
    expect(isKnownAudioMagic(new Uint8Array([0x1a, 0x45]))).toBe(false)
  })
})

describe("checkAudioFile", () => {
  it("正常な音声は ok", () => {
    expect(checkAudioFile(withHeader(str("OggS")))).toEqual({ ok: true })
  })
  it("サイズ超過は too_large", () => {
    const big = new Uint8Array(MAX_AUDIO_BYTES + 1)
    big.set(str("OggS"), 0)
    const r = checkAudioFile(big)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("too_large")
  })
  it("非音声は not_audio", () => {
    const r = checkAudioFile(withHeader(str("MZ")))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("not_audio")
  })
})
