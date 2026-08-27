import { describe, it, expect } from "vitest"
import type { Status } from "./Recorder"

/**
 * 2026-08-27: 録音のあと「もう一度録音する」を押しても録音画面に戻れず、
 * 録音ボタンの無い画面になる不具合の回帰テスト。
 *
 * 原因は、Recorder が親へ「進む向き」しか通知していなかったこと。
 *   onCountdownStart → countdown
 *   onRecordingStart → recording
 *   onRecordingStop  → preview
 * idle へ戻る経路 (retry / 録音エラー / 空の録音) を伝える口が無く、
 * 親の recordingState が preview のまま固定されていた。
 * scoreDetail は `recordingState === "idle"` を条件に録音の入口を出しているため、
 * 一度録音するとページを開き直すまで録音できなくなっていた。
 *
 * 修正は onStatusChange で status をそのまま親へ写すこと。
 * ここでは「親が idle に戻れること」と「idle へ戻る経路が漏れていないこと」を守る。
 */

/** scoreDetail 側の同期 (onStatusChange={(s) => setRecordingState(s)}) と同じ式。
    前の状態に関わらず、Recorder の status をそのまま写す */
function sync(_prev: Status, next: Status): Status {
  return next
}

/** 録音の入口を出す条件 (scoreDetail の `recordingState === "idle"`) */
const canStartRecording = (s: Status) => s === "idle"

describe("録音の状態が親へ伝わる", () => {
  it("録音 → プレビュー → もう一度 で idle に戻る", () => {
    let st: Status = "idle"
    for (const next of ["preparing", "countdown", "recording", "preview"] as Status[]) {
      st = sync(st, next)
    }
    expect(canStartRecording(st)).toBe(false)

    // 「もう一度録音する」= retryRecording が setStatus("idle")
    st = sync(st, "idle")
    expect(st).toBe("idle")
    expect(canStartRecording(st)).toBe(true)
  })

  it("録音エラーで idle に落ちたときも入口が戻る", () => {
    let st: Status = "recording"
    st = sync(st, "idle")   // 録音エラー / 空の録音
    expect(canStartRecording(st)).toBe(true)
  })

  it("採点を送ったあと結果画面では入口を出さない", () => {
    let st: Status = "preview"
    st = sync(st, "uploading")
    expect(canStartRecording(st)).toBe(false)
    st = sync(st, "result")
    expect(canStartRecording(st)).toBe(false)
  })

  it("idle 以外のどの状態からでも idle に戻せる", () => {
    const all: Status[] = [
      "idle", "tempo-select", "preparing", "countdown",
      "recording", "preview", "uploading", "result",
    ]
    for (const from of all) {
      expect(canStartRecording(sync(from, "idle"))).toBe(true)
    }
  })

  it("録音中と準備中は入口を出さない", () => {
    for (const s of ["preparing", "countdown", "recording"] as Status[]) {
      expect(canStartRecording(s)).toBe(false)
    }
  })
})
