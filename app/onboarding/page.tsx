"use client"

// ============================================================
// /onboarding — 画面ルーター (C2・2026-07-11)
// フロー = 指示書 §0-3 を 1:1 でコード化:
//   SCR-01 → 02 → 03 → 04(Q2)
//    ├ これから始める → ★1確定・ラダースキップ → SCR-07
//    └ 経験者 → L_G1..G5(+G3補足) → SCR-07
//   SCR-07以降(Q3〜完了)は C3/C4 で実装。
// 検証証跡: ラダー確定時に ★/PROVISIONALフラグを console に出力。
// ============================================================

import styles from "./onboarding.module.css"
import { OnboardingProvider, useOnboarding, type ScreenId } from "./_lib/store"
import { toProvisionalFlags, type JudgeResult } from "./_lib/logic"
import { ArcoChan } from "./_components/ArcoChan"
import AvatarBubble from "./_components/AvatarBubble"
import OptionCard from "./_components/OptionCard"
import CtaButton from "./_components/CtaButton"
import ProgressBar from "./_components/ProgressBar"
import { YesNoGate, MultiGate } from "./_screens/gates"

function Header({ bar = true }: { bar?: boolean }) {
  const s = useOnboarding()
  return (
    <div className={styles.hdr}>
      <button className={styles.back} onClick={s.back} aria-label="戻る">
        ←
      </button>
      {bar && <ProgressBar seg={s.seg} />}
    </div>
  )
}

/* ── SCR-01 エントリー(登録直後表示・ボタンは「スタート」のみ) ── */
function Scr01() {
  const s = useOnboarding()
  return (
    <div className={styles.centerScr}>
      <div className={`${styles.bigChar} ${styles.arcoEnter}`} style={{ marginTop: "22%" }}>
        <ArcoChan poseKey="entry" />
      </div>
      <div className={styles.wordmark} style={{ marginTop: "6%" }}>arcoda</div>
      <div className={styles.tagline} style={{ marginTop: "2%" }}>きみの音を、きみの曲に。</div>
      <CtaButton label="スタート" onClick={() => s.go("SCR02")} />
    </div>
  )
}

/* ── SCR-02 挨拶(ぺこりお辞儀) ── */
function Scr02() {
  const s = useOnboarding()
  return (
    <>
      <Header bar={false} />
      <div className={styles.centerScr}>
        <div className={`${styles.bigChar} ${styles.arcoEnter}`} style={{ marginTop: "13%" }}>
          <ArcoChan poseKey="greet" />
        </div>
        <div style={{ marginTop: "3%", display: "flex", width: "100%" }}>
          <AvatarBubble variant="center" tail="up">こんにちは!アルコだよ!</AvatarBubble>
        </div>
      </div>
      <CtaButton label="次へ" onClick={() => s.go("SCR03")} />
    </>
  )
}

/* ── SCR-03 予告「7つのかんたんなステップ(約1分)」 ── */
function Scr03() {
  const s = useOnboarding()
  return (
    <>
      <Header bar={false} />
      <div className={styles.centerScr}>
        <div className={`${styles.bigChar} ${styles.arcoEnter}`} style={{ marginTop: "13%" }}>
          <ArcoChan poseKey="explain" />
        </div>
        <div style={{ marginTop: "3%", display: "flex", width: "100%" }}>
          <AvatarBubble variant="center" tail="up">
            最初の練習をはじめる前に、<b>7つのかんたんなステップ</b>に答えてね!(約1分)
          </AvatarBubble>
        </div>
      </div>
      <CtaButton label="次へ" onClick={() => s.go("SCR04")} />
    </>
  )
}

/* ── ラダー確定の共通処理(検証証跡つき) ── */
function useFinalize() {
  const s = useOnboarding()
  return (patch?: Parameters<typeof s.finalizeLadder>[0]): JudgeResult => {
    const result = s.finalizeLadder(patch)
    // 指示書C2検証: ★/フラグのコンソール証跡
    console.log("[onboarding] ★判定確定:", result.star, result)
    console.log("[onboarding] PROVISIONALフラグ:", toProvisionalFlags(result))
    return result
  }
}

/* ── SCR-04 Q2 バイオリン歴 ── */
function Scr04() {
  const s = useOnboarding()
  const finalize = useFinalize()
  const OPTS = ["これから始める", "1年未満", "1〜3年", "3年以上", "昔やっていて再開"]
  const confirm = () => {
    s.setSeg("Q2", 1)
    if (s.ans.q2 === "これから始める") {
      finalize() // ★1確定・ラダースキップ(バー総量は不変=ladderセグメントも満了)
      s.go("SCR07")
    } else {
      s.go("L_G1")
    }
  }
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">バイオリンはどのくらい弾いてる?</AvatarBubble>
      <div className={styles.list}>
        {OPTS.map((o) => (
          <OptionCard key={o} label={o} selected={s.ans.q2 === o} onClick={() => s.setAns({ q2: o })} />
        ))}
      </div>
      <CtaButton label="次へ" disabled={!s.ans.q2} divider onClick={confirm} />
    </>
  )
}

/* ── ★判定ラダー G1〜G5 (§27-3) ── */
function GateG1() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <YesNoGate
        question="1stポジションで、4の指まで使って弾ける?"
        yesLabel="はい、弾ける"
        onAnswer={(v) => {
          s.setLadder({ g1: v })
          s.setSeg("ladder", 0.2)
          if (!v) {
            finalize({ g1: v })
            s.go("SCR07")
          } else s.go("L_G2")
        }}
      />
    </>
  )
}

function GateG2() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <MultiGate
        question="この中で、できるものをぜんぶ選んで!"
        options={[
          { value: "トリル", desc: "2つの音をすばやく交互に弾く" },
          { value: "スタッカート", desc: "音を短く切って弾く" },
          { value: "スピッカート", desc: "弓を弦の上で跳ねさせる" },
        ]}
        noneLabel="どれもまだできない"
        onConfirm={(sel) => {
          s.setLadder({ g2: sel })
          s.setSeg("ladder", 0.4)
          if (sel.length < 3) {
            finalize({ g2: sel })
            s.go("SCR07")
          } else s.go("L_G3")
        }}
      />
    </>
  )
}

function GateG3() {
  const s = useOnboarding()
  return (
    <>
      <Header />
      <YesNoGate
        question="ビブラートはできる?"
        onAnswer={(v) => {
          s.setLadder({ g3: v })
          s.setSeg("ladder", 0.6)
          if (!v) s.go("L_G3S")
          else s.go("L_G4")
        }}
      />
    </>
  )
}

/* G3停止者への補足質問(★判定に不使用・習得フラグのみ) */
function GateG3S() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <YesNoGate
        question="ポジション移動はできる?"
        onAnswer={(v) => {
          s.setLadder({ g3sup: v })
          finalize({ g3sup: v })
          s.go("SCR07")
        }}
      />
    </>
  )
}

function GateG4() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <MultiGate
        question="できるポジションをぜんぶ選んで!"
        options={[
          { value: "2nd" },
          { value: "3rd" },
          { value: "4th" },
          { value: "5th" },
          { value: "6th+", desc: "6thポジション以上" },
        ]}
        noneLabel="ポジション移動はまだ"
        onConfirm={(sel) => {
          s.setLadder({ g4: sel })
          s.setSeg("ladder", 0.8)
          const has = (p: string) => sel.includes(p)
          const stopsAt4 =
            sel.length === 0 || (!has("2nd") && !has("4th") && !has("5th") && !has("6th+"))
          if (stopsAt4) {
            finalize({ g4: sel })
            s.go("SCR07")
          } else s.go("L_G5")
        }}
      />
    </>
  )
}

function GateG5() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <YesNoGate
        question="重音の音階(2本の弦を同時に)は弾ける?"
        yesLabel="はい、弾ける"
        onAnswer={(v) => {
          s.setLadder({ g5: v })
          finalize({ g5: v })
          s.go("SCR07")
        }}
      />
    </>
  )
}

/* ── SCR-07 (C3で本実装。ラダー完了マイクロ演出 §27-9 + 判定証跡表示) ── */
function Scr07Stub() {
  const s = useOnboarding()
  return (
    <>
      <Header />
      <AvatarBubble poseKey="praise">
        なるほど、君のレベルがわかったよ!
        {s.result && (
          <>
            <br />
            <span style={{ fontSize: "80%", color: "#777" }}>
              (判定: ★{s.result.star} / 仮習得 {s.result.tags.length}タグ
              {s.result.doubleStops.length > 0 && ` / 重音 ${s.result.doubleStops.join("・")}`})
            </span>
          </>
        )}
      </AvatarBubble>
      <div className={styles.list}>
        <div style={{ fontSize: "min(1.9cqh,16px)", color: "#777", fontWeight: 400 }}>
          ここから先(Q3 先生〜完了画面)は C3 で実装します。
        </div>
      </div>
      <CtaButton label="次へ(C3で実装)" disabled divider />
    </>
  )
}

const SCREENS: Record<ScreenId, () => React.ReactElement> = {
  SCR01: Scr01,
  SCR02: Scr02,
  SCR03: Scr03,
  SCR04: Scr04,
  L_G1: GateG1,
  L_G2: GateG2,
  L_G3: GateG3,
  L_G3S: GateG3S,
  L_G4: GateG4,
  L_G5: GateG5,
  SCR07: Scr07Stub,
  // C3以降のプレースホルダ(ルーター型の完全性のため定義)
  SCR08A: Scr07Stub, SCR08B: Scr07Stub, SCR10: Scr07Stub, SCR08C: Scr07Stub,
  SCR09: Scr07Stub, SCR11: Scr07Stub, SCR11B: Scr07Stub, SCR11C: Scr07Stub,
  SCR12: Scr07Stub,
}

function Router() {
  const s = useOnboarding()
  const Screen = SCREENS[s.screen] ?? Scr01
  return <Screen />
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <Router />
    </OnboardingProvider>
  )
}
