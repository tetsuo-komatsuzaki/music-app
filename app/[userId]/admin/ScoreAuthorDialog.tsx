"use client"
// 自作スコア登録のダイアログ (2026-09-06 Tetsuo確定 ・ admin)。
// 1 並べる (調 ・ 種類 ・ オクターブ ・ 型から自動生成、弦と指も自動) → 2 五線譜の上で音を上下させて直す → 3 名前を付けて作る。
// 指板と文字入力は置かない (Tetsuo指示)。作ると MusicXML を組み立て、従来のファイル登録と同じ道に流す。
import { useEffect, useMemo, useState } from "react"
import { createAuthoredItem } from "@/app/actions/createAuthoredItem"
import {
  AUTHOR_ARTS, LENGTHS, MODE_DEF, PRESETS, STRINGS, TONICS,
  generateSequence, makeNote, noteName, parseShorthand, refitToString, stepInKey, totalBeats, usesFlats, withPitch, OPEN_MIDI,
  type AuthorCategory, type AuthorMode, type AuthorNote, type StringId, VIOLIN_LOW, VIOLIN_HIGH,
} from "@/app/_libs/scoreAuthor"
import { STANDARD_ARTICULATIONS } from "@/app/_libs/articulationPatterns"
import AuthorStaff from "./AuthorStaff"

const CATS: { id: AuthorCategory; label: string }[] = [
  { id: "scale", label: "音階" }, { id: "arpeggio", label: "アルペジオ" }, { id: "bowing", label: "ボーイング" }, { id: "fingering", label: "フィンガリング" },
]

export default function ScoreAuthorDialog({ onClose, onCreated }: { onClose: () => void; onCreated?: (itemId: string) => void }) {
  const [cat, setCat] = useState<AuthorCategory>("scale")
  const [tonic, setTonic] = useState("G")
  const [mode, setMode] = useState<AuthorMode>("major")
  const [octaves, setOctaves] = useState(2)
  const [shape, setShape] = useState<"updown" | "up">("updown")
  const [preset, setPreset] = useState("open")
  const [ql, setQl] = useState(0.5)
  const [beats, setBeats] = useState(4)
  const [notes, setNotes] = useState<AuthorNote[]>([])
  const [sel, setSel] = useState(-1)
  const [name, setName] = useState("")
  const [star, setStar] = useState(2)
  const [expandAllKeys, setExpandAllKeys] = useState(false)
  const [stdArts, setStdArts] = useState(false)
  const [artIds, setArtIds] = useState<Set<string>>(new Set(STANDARD_ARTICULATIONS.map((a) => a.id)))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [warn, setWarn] = useState<string | null>(null)

  const isScale = cat === "scale" || cat === "arpeggio"
  const modes = useMemo(() => (Object.keys(MODE_DEF) as AuthorMode[]).filter((m) => MODE_DEF[m].categories.includes(cat)), [cat])
  useEffect(() => { if (!modes.includes(mode)) setMode(modes[0] ?? "major") }, [modes, mode])
  useEffect(() => { setPreset(PRESETS[cat === "bowing" ? "bowing" : "fingering"][0].id) }, [cat])
  const keyMode = MODE_DEF[mode].keyMode
  const flats = usesFlats(tonic, keyMode)
  const total = totalBeats(notes)
  const fit = notes.length > 0 && Math.abs(total / beats - Math.round(total / beats)) < 1e-6

  const generate = () => {
    if (isScale) {
      setNotes(generateSequence({ tonic, mode, octaves, shape, ql }))
      setName(`${tonic} ${MODE_DEF[mode].label} ${cat === "scale" ? "音階" : "アルペジオ"} ${octaves} オクターブ`)
    } else {
      const list = PRESETS[cat === "bowing" ? "bowing" : "fingering"]
      const p = list.find((x) => x.id === preset) ?? list[0]
      setNotes(parseShorthand(p.text, ql))
      setName(`${cat === "bowing" ? "ボーイング" : "フィンガリング"} ${p.label}`)
    }
    setSel(-1); setWarn(null)
  }
  const update = (i: number, f: (n: AuthorNote) => AuthorNote) => setNotes((prev) => prev.map((n, k) => (k === i ? f(n) : n)))
  const movePitch = (i: number, steps: number) => update(i, (n) => withPitch(n, stepInKey(n.midi, steps, tonic, mode)))
  const semitone = (i: number, d: number) => update(i, (n) => withPitch(n, Math.max(VIOLIN_LOW, Math.min(VIOLIN_HIGH, n.midi + d))))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel < 0 || (e.target as HTMLElement)?.tagName === "INPUT") return
      if (e.key === "ArrowUp") { movePitch(sel, 1); e.preventDefault() }
      if (e.key === "ArrowDown") { movePitch(sel, -1); e.preventDefault() }
      if (e.key === "ArrowLeft" && sel > 0) { setSel(sel - 1); e.preventDefault() }
      if (e.key === "ArrowRight" && sel < notes.length - 1) { setSel(sel + 1); e.preventDefault() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, notes.length, tonic, mode])

  const submit = async () => {
    setBusy(true); setMsg(null)
    const r = await createAuthoredItem({
      title: name, category: cat, keyTonic: tonic, keyMode, beats, star, notes,
      expandAllKeys: isScale || cat === "fingering" ? expandAllKeys && keyMode === "major" : false,
      standardArticulations: stdArts, articulationIds: [...artIds],
    })
    setBusy(false)
    if (r.ok) { setMsg("登録して解析を始めました。続けて別の教材も作れます。"); onCreated?.(r.itemId) }
    else setMsg(r.error)
  }

  const S = {
    box: { position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,10,22,.62)" } as React.CSSProperties,
    sheet: { width: "min(760px, 96vw)", maxHeight: "90vh", overflowY: "auto", background: "var(--card-in)", border: "1px solid rgba(150,175,225,.25)", borderRadius: 16, padding: "18px 20px 20px" } as React.CSSProperties,
    label: { fontSize: "var(--fs-caption)", color: "var(--text-sub)", margin: "14px 0 6px", fontWeight: 700 } as React.CSSProperties,
    row: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } as React.CSSProperties,
    k: { fontSize: "var(--fs-caption)", color: "var(--text-sub)", minWidth: 64, fontWeight: 700 } as React.CSSProperties,
  }
  const btn = (on: boolean, disabled = false): React.CSSProperties => ({
    padding: "6px 11px", borderRadius: 9, fontSize: "var(--fs-caption)", fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
    border: on ? "1px solid #d9a93c" : "1px solid rgba(150,175,225,.28)",
    background: on ? "rgba(217,169,60,.18)" : "rgba(150,175,225,.08)", color: "var(--text-body)",
  })
  const n = notes[sel]

  return (
    <div style={S.box} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>スコアを自分で作る</b>
          <button type="button" onClick={onClose}>とじる</button>
        </div>

        <div style={S.label}>1 ・ 何を作るか</div>
        <div style={S.row}><span style={S.k}>分類</span>{CATS.map((c) => <button key={c.id} type="button" style={btn(cat === c.id)} onClick={() => { setCat(c.id); setNotes([]); setSel(-1) }}>{c.label}</button>)}</div>
        {isScale ? (
          <>
            <div style={{ ...S.row, marginTop: 6 }}><span style={S.k}>調</span>{TONICS.map((t) => <button key={t} type="button" style={btn(tonic === t)} onClick={() => setTonic(t)}>{t}</button>)}</div>
            <div style={{ ...S.row, marginTop: 6 }}><span style={S.k}>種類</span>{modes.map((m) => <button key={m} type="button" style={btn(mode === m)} onClick={() => setMode(m)}>{MODE_DEF[m].label}</button>)}</div>
            <div style={{ ...S.row, marginTop: 6 }}>
              <span style={S.k}>オクターブ</span>{[1, 2, 3].map((o) => <button key={o} type="button" style={btn(octaves === o)} onClick={() => setOctaves(o)}>{o}</button>)}
              <span style={{ ...S.k, marginLeft: 10 }}>型</span>
              <button type="button" style={btn(shape === "updown")} onClick={() => setShape("updown")}>上って下りる</button>
              <button type="button" style={btn(shape === "up")} onClick={() => setShape("up")}>上るだけ</button>
            </div>
          </>
        ) : (
          <div style={{ ...S.row, marginTop: 6 }}>
            <span style={S.k}>型</span>
            {PRESETS[cat === "bowing" ? "bowing" : "fingering"].map((p) => <button key={p.id} type="button" style={btn(preset === p.id)} onClick={() => setPreset(p.id)}>{p.label}</button>)}
            <span style={{ ...S.k, marginLeft: 10 }}>調</span>{TONICS.map((t) => <button key={t} type="button" style={btn(tonic === t)} onClick={() => setTonic(t)}>{t}</button>)}
          </div>
        )}
        <div style={{ ...S.row, marginTop: 6 }}>
          <span style={S.k}>長さ</span>{LENGTHS.map((l) => <button key={l.ql} type="button" style={btn(ql === l.ql)} onClick={() => setQl(l.ql)}>{l.label}</button>)}
          <span style={{ ...S.k, marginLeft: 10 }}>拍子</span>{[4, 3, 2].map((b) => <button key={b} type="button" style={btn(beats === b)} onClick={() => setBeats(b)}>{b}/4</button>)}
        </div>
        <div style={{ ...S.row, marginTop: 10 }}>
          <button type="button" onClick={generate} style={{ padding: "8px 18px", borderRadius: 999, fontWeight: 800, border: "none", cursor: "pointer", background: "#2b5bc4", color: "#fff" }}>並べる ・ 弦と指も自動で付ける</button>
          <button type="button" onClick={() => { setNotes([makeNote(OPEN_MIDI.D, ql)]); setSel(0) }} style={btn(false)}>空から作る</button>
        </div>

        <div style={S.label}>2 ・ 五線譜で直す ・ 音を押して選び、上下に動かすか矢印キーで高さを変える</div>
        {notes.length === 0
          ? <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>上の「並べる」を押すと、ここに五線譜が出ます</p>
          : <AuthorStaff notes={notes} beats={beats} flats={flats} selected={sel} onSelect={setSel} onDrag={movePitch} />}
        <div style={{ ...S.row, marginTop: 5, fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
          <span>音符の上 = 弦 (G D A E) ・ 下 = 指 ・ 薄い黄色 = 選んでいる音</span>
          <span style={{ marginLeft: "auto", fontWeight: 700, color: fit ? "#8FD3B0" : "var(--text-sub)" }}>{notes.length} 音 ・ {(total / beats).toFixed(2).replace(/\.00$/, "")} 小節{fit ? " ・ 作成できます" : notes.length ? " ・ 小節がぴったり埋まると作成できます" : ""}</span>
        </div>

        {n && (
          <div style={{ background: "rgba(11,18,32,.5)", border: "1px solid rgba(150,175,225,.2)", borderRadius: 12, padding: "10px 12px", marginTop: 8 }}>
            <div style={S.row}>
              <b style={{ fontSize: "var(--fs-caption)", minWidth: 90 }}>{sel + 1} 番目 {noteName(n.midi, flats)}</b>
              <button type="button" style={btn(false, sel <= 0)} onClick={() => setSel(Math.max(0, sel - 1))}>←</button>
              <button type="button" style={btn(false, sel >= notes.length - 1)} onClick={() => setSel(Math.min(notes.length - 1, sel + 1))}>→</button>
              <button type="button" style={btn(false)} onClick={() => { setNotes(notes.filter((_, k) => k !== sel)); setSel(Math.min(sel, notes.length - 2)) }}>この音を消す</button>
              <button type="button" style={btn(false)} onClick={() => { const c = [...notes]; c.splice(sel + 1, 0, { ...n }); setNotes(c); setSel(sel + 1) }}>この音の後ろに 1 音足す</button>
            </div>
            <div style={{ ...S.row, marginTop: 6 }}>
              <span style={S.k}>高さ</span>
              <button type="button" style={btn(false)} onClick={() => movePitch(sel, -1)}>↓ 下げる</button>
              <button type="button" style={btn(false)} onClick={() => movePitch(sel, 1)}>↑ 上げる</button>
              <button type="button" style={btn(false)} onClick={() => semitone(sel, -1)}>♭ 半音下</button>
              <button type="button" style={btn(false)} onClick={() => semitone(sel, 1)}>♯ 半音上</button>
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>調の音をたどって動く ・ 弦と指は自動で付け直し</span>
            </div>
            <div style={{ ...S.row, marginTop: 6 }}>
              <span style={S.k}>弦</span>
              {STRINGS.map((s: StringId) => <button key={s} type="button" style={btn(n.str === s)} onClick={() => { const r = refitToString(n.midi, s); if (!r) { setWarn(`${noteName(n.midi, flats)} は ${s} 弦では取れません`); return } setWarn(null); update(sel, (x) => ({ ...x, ...r })) }}>{s} 弦</button>)}
              <span style={{ ...S.k, marginLeft: 10, minWidth: 0 }}>指</span>
              {[0, 1, 2, 3, 4].map((f) => <button key={f} type="button" style={btn(n.fin === f)} onClick={() => { setWarn(f === 0 && n.midi !== OPEN_MIDI[n.str] ? "開放弦の高さと違います" : null); update(sel, (x) => ({ ...x, fin: f })) }}>{f}</button>)}
              <span style={{ ...S.k, marginLeft: 10, minWidth: 0 }}>ポジション</span>
              {[1, 2, 3, 4, 5].map((p) => <button key={p} type="button" style={btn(n.pos === p)} onClick={() => update(sel, (x) => ({ ...x, pos: p }))}>{p}</button>)}
            </div>
            <div style={{ ...S.row, marginTop: 6 }}>
              <span style={S.k}>長さ</span>{LENGTHS.map((l) => <button key={l.ql} type="button" style={btn(n.ql === l.ql)} onClick={() => update(sel, (x) => ({ ...x, ql: l.ql }))}>{l.label}</button>)}
              <span style={{ ...S.k, marginLeft: 10, minWidth: 0 }}>弾き方</span>{AUTHOR_ARTS.map((a) => <button key={a.id} type="button" style={btn(n.art === a.id)} onClick={() => update(sel, (x) => ({ ...x, art: a.id }))}>{a.label}</button>)}
            </div>
            {warn && <p style={{ fontSize: "var(--fs-caption)", color: "#E79999", marginTop: 6 }}>{warn}</p>}
          </div>
        )}

        <div style={S.label}>3 ・ 名前を付けて作る</div>
        <div style={S.row}>
          <span style={S.k}>難易度 ★</span>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => <button key={s} type="button" style={btn(star === s)} onClick={() => setStar(s)}>{s}</button>)}
        </div>
        {(isScale || cat === "fingering") && (
          <div style={{ ...S.row, marginTop: 6 }}>
            <label style={{ fontSize: "var(--fs-caption)", display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={expandAllKeys} disabled={keyMode !== "major"} onChange={(e) => setExpandAllKeys(e.target.checked)} />
              全調で自動生成 (長調のときだけ)
            </label>
          </div>
        )}
        <div style={{ ...S.row, marginTop: 6 }}>
          <label style={{ fontSize: "var(--fs-caption)", display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={stdArts} onChange={(e) => setStdArts(e.target.checked)} />
            奏法パターンを一括生成
          </label>
          {stdArts && STANDARD_ARTICULATIONS.map((a) => (
            <button key={a.id} type="button" style={btn(artIds.has(a.id))} onClick={() => setArtIds((prev) => { const s = new Set(prev); if (s.has(a.id)) s.delete(a.id); else s.add(a.id); return s })}>{a.label}</button>
          ))}
        </div>
        <div style={{ ...S.row, marginTop: 10 }}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="教材名 ・ 例: G 長調 音階 2 オクターブ" style={{ flex: "1 1 260px", minWidth: 0, padding: "8px 10px" }} />
          <button type="button" disabled={busy || !fit || !name.trim()} onClick={submit}
            style={{ padding: "9px 20px", borderRadius: 999, fontWeight: 800, border: "none", cursor: "pointer",
              background: !fit || !name.trim() ? "rgba(150,175,225,.2)" : "linear-gradient(180deg,#F0D48A,#D9A93C)", color: !fit || !name.trim() ? "var(--text-sub)" : "#0B1220" }}>
            {busy ? "作成中…" : "MusicXML を作って登録"}
          </button>
        </div>
        {msg && <p style={{ fontSize: "var(--fs-caption)", marginTop: 8 }}>{msg}</p>}
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 6 }}>
          作ると MusicXML を組み立て、これまでのファイル登録と同じ道 (解析 → 譜面 → 必要なら全調 ・ 奏法パターン) に流します。弦と指は譜面にも音ごとの記録にも残ります。
        </p>
      </div>
    </div>
  )
}
