import { describe, it, expect } from "vitest"
import { deflateRawSync, inflateRawSync } from "node:zlib"
import { detectKeyFromMusicXmlText, detectKeyFromMusicXml, fifthsToTonic } from "./musicxmlKey"

const nodeInflate = async (d: Uint8Array) => new Uint8Array(inflateRawSync(d))

function xmlWithKey(inner: string) {
  return `<?xml version="1.0"?><score-partwise><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key>${inner}</key><time><beats>4</beats><beat-type>4</beat-type></time></attributes></measure></part></score-partwise>`
}

/** テスト用の最小 zip 書き出し (local header + central directory + EOCD) */
function makeZip(files: { name: string; data: Uint8Array; deflate?: boolean }[]): Uint8Array {
  const enc = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const body = f.deflate ? new Uint8Array(deflateRawSync(f.data)) : f.data
    const method = f.deflate ? 8 : 0
    const lh = new Uint8Array(30 + name.length + body.length)
    const ldv = new DataView(lh.buffer)
    ldv.setUint32(0, 0x04034b50, true); ldv.setUint16(8, method, true)
    ldv.setUint32(18, body.length, true); ldv.setUint32(22, f.data.length, true)
    ldv.setUint16(26, name.length, true); ldv.setUint16(28, 0, true)
    lh.set(name, 30); lh.set(body, 30 + name.length)
    const ch = new Uint8Array(46 + name.length)
    const cdv = new DataView(ch.buffer)
    cdv.setUint32(0, 0x02014b50, true); cdv.setUint16(10, method, true)
    cdv.setUint32(20, body.length, true); cdv.setUint32(24, f.data.length, true)
    cdv.setUint16(28, name.length, true); cdv.setUint32(42, offset, true)
    ch.set(name, 46)
    locals.push(lh); centrals.push(ch); offset += lh.length
  }
  const cdSize = centrals.reduce((n, c) => n + c.length, 0)
  const eocd = new Uint8Array(22)
  const edv = new DataView(eocd.buffer)
  edv.setUint32(0, 0x06054b50, true); edv.setUint16(8, files.length, true); edv.setUint16(10, files.length, true)
  edv.setUint32(12, cdSize, true); edv.setUint32(16, offset, true)
  const total = offset + cdSize + 22
  const out = new Uint8Array(total)
  let p = 0
  for (const l of locals) { out.set(l, p); p += l.length }
  for (const c of centrals) { out.set(c, p); p += c.length }
  out.set(eocd, p)
  return out
}

describe("detectKeyFromMusicXmlText", () => {
  it("fifths だけなら長調", () => {
    expect(detectKeyFromMusicXmlText(xmlWithKey("<fifths>1</fifths>"))).toMatchObject({ keyTonic: "G", keyMode: "major", modeGiven: false })
    expect(detectKeyFromMusicXmlText(xmlWithKey("<fifths>-2</fifths>"))).toMatchObject({ keyTonic: "Bb", keyMode: "major" })
  })
  it("mode minor を読む", () => {
    expect(detectKeyFromMusicXmlText(xmlWithKey("<fifths>-3</fifths><mode>minor</mode>"))).toMatchObject({ keyTonic: "C", keyMode: "minor", modeGiven: true })
    expect(detectKeyFromMusicXmlText(xmlWithKey("<fifths>0</fifths><mode>minor</mode>"))).toMatchObject({ keyTonic: "A", keyMode: "minor" })
  })
  it("<key> が無ければ null", () => {
    expect(detectKeyFromMusicXmlText("<score-partwise><part><measure><attributes/></measure></part></score-partwise>")).toBeNull()
  })
  it("選択肢に無い異名同音は選択肢側へ寄せる", () => {
    expect(fifthsToTonic(-7, "major")).toBe("B")
    expect(fifthsToTonic(5, "minor")).toBe("Ab")
  })
})

describe("detectKeyFromMusicXml (.mxl)", () => {
  const enc = new TextEncoder()
  it("生 XML", async () => {
    const r = await detectKeyFromMusicXml(enc.encode(xmlWithKey("<fifths>2</fifths>")), nodeInflate)
    expect(r).toMatchObject({ keyTonic: "D", keyMode: "major" })
  })
  it("zip: container.xml の rootfile を読む (deflate)", async () => {
    const zip = makeZip([
      { name: "META-INF/container.xml", data: enc.encode('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>') },
      { name: "other.xml", data: enc.encode(xmlWithKey("<fifths>0</fifths>")), deflate: true },
      { name: "score.xml", data: enc.encode(xmlWithKey("<fifths>3</fifths>")), deflate: true },
    ])
    const r = await detectKeyFromMusicXml(zip, nodeInflate)
    expect(r).toMatchObject({ keyTonic: "A", keyMode: "major" })
  })
  it("zip: container.xml が無ければ最初の xml (store)", async () => {
    const zip = makeZip([{ name: "x.musicxml", data: enc.encode(xmlWithKey("<fifths>-1</fifths>")) }])
    const r = await detectKeyFromMusicXml(zip, nodeInflate)
    expect(r).toMatchObject({ keyTonic: "F", keyMode: "major" })
  })
})
