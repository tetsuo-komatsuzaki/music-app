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

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./onboarding.module.css"
import {
  OnboardingProvider,
  useOnboarding,
  type OnboardingPublicState,
  type ScreenId,
} from "./_lib/store"
import {
  estimatePeriod,
  toAcquisitionFlags,
  toProvisionalFlags,
  visibleSongs,
  type JudgeResult,
  type SongEntry,
} from "./_lib/logic"
import type { CatalogCategory } from "./_lib/catalog"
import { completeOnboarding } from "./_lib/actions"
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

/* ── SCR-07 Q3 先生に習っているか(分岐なし・属性保存のみ。先生コード入力は削除済) ── */
function Scr07() {
  const s = useOnboarding()
  const isFirst = s.history[s.history.length - 1] !== "SCR07" && !s.ans.q3
  return (
    <>
      <Header />
      <AvatarBubble poseKey={isFirst ? "praise" : "question"}>
        {/* ラダー完了マイクロ演出(§27-9・過剰演出禁止): 初回表示のみ一言 */}
        {isFirst && (
          <>
            なるほど、君のレベルがわかったよ!
            <br />
          </>
        )}
        いま、先生に習ってる?
      </AvatarBubble>
      <div className={styles.list}>
        {["習っている", "独学", "先生を探し中"].map((o) => (
          <OptionCard key={o} label={o} selected={s.ans.q3 === o} onClick={() => s.setAns({ q3: o })} />
        ))}
      </div>
      <CtaButton
        label="次へ"
        disabled={!s.ans.q3}
        divider
        onClick={() => {
          s.setSeg("Q3", 1)
          s.go("SCR08A")
        }}
      />
    </>
  )
}

/* ── SCR-08a Q4 カテゴリ選択 ── */
function Scr08A() {
  const s = useOnboarding()
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">どんな曲が弾けるようになりたい?</AvatarBubble>
      <div className={styles.list}>
        {Object.entries(s.catalog).map(([key, c]) => (
          <OptionCard
            key={key}
            icon={c.ico}
            label={c.label}
            selected={s.ans.q4cat === key}
            onClick={() => s.setAns({ q4cat: key })}
          />
        ))}
        <OptionCard
          icon="🤔"
          label="まだ決まってない"
          selected={s.ans.q4cat === "undecided"}
          onClick={() => s.setAns({ q4cat: "undecided" })}
        />
      </div>
      <CtaButton label="次へ" disabled={!s.ans.q4cat} divider onClick={() => s.go("SCR08B")} />
    </>
  )
}

/* ── SCR-08b 曲選択(★同ランク/1つ上のみ表示・未収録自由入力なし §27-8) ── */
function Scr08B() {
  const s = useOnboarding()
  const star = s.result?.star ?? 1
  const undecided = s.ans.q4cat === "undecided"
  // 「まだ決まってない」= 全カテゴリの同ランク/1つ上から3曲(§27-8)
  const allSongs: SongEntry[] = Object.values(s.catalog).flatMap((c) => c.songs)
  const songs = undecided
    ? visibleSongs(allSongs, star).slice(0, 3)
    : visibleSongs(s.catalog[s.ans.q4cat ?? "classic"]?.songs ?? [], star)
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">
        {undecided
          ? `きみ(★${star})にぴったりの3曲だよ。1曲えらんでね!`
          : `きみ(★${star})にちょうどいい曲だよ。1曲えらんでね!`}
      </AvatarBubble>
      <div className={styles.list}>
        {songs.map(([name, st]) => (
          <OptionCard
            key={name}
            icon="🎵"
            label={name}
            sub={`⭐︎${st}`}
            selected={s.ans.q4song === name}
            onClick={() => s.setAns({ q4song: name, q4star: st })}
          />
        ))}
      </div>
      <CtaButton label="次へ" disabled={!s.ans.q4song} divider onClick={() => s.go("SCR10")} />
    </>
  )
}

/* ── SCR-10 Q6 練習時間(曲選択直後・曲名入り文言 2026-07-11改訂) ── */
function Scr10() {
  const s = useOnboarding()
  const OPTS: Array<[string, string]> = [
    ["5分 / 日", "まずは気軽に"],
    ["15分 / 日", "しっかり"],
    ["30分 / 日", "本気"],
    ["それ以上", "情熱的"],
  ]
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">
        「{s.ans.q4song}」のために、1日どのくらい練習できそう?
      </AvatarBubble>
      <div className={styles.list}>
        {OPTS.map(([label, sub]) => (
          <OptionCard
            key={label}
            label={label}
            sub={sub}
            selected={s.ans.q6 === label}
            onClick={() => s.setAns({ q6: label })}
          />
        ))}
      </div>
      <CtaButton
        label="次へ"
        disabled={!s.ans.q6}
        divider
        onClick={() => {
          s.setSeg("Q6", 1)
          s.go("SCR08C")
        }}
      />
    </>
  )
}

/* ── SCR-08c 到達予測(専用1画面・Q6実回答で確定計算 承認⑤) ── */
function Scr08C() {
  const s = useOnboarding()
  const period = estimatePeriod(s.result?.star ?? 1, s.ans.q4star ?? 1, s.ans.q6 ?? "").label
  return (
    <>
      <Header />
      <div className={styles.centerScr}>
        <div className={`${styles.bigCharSm} ${styles.arcoEnter}`} style={{ marginTop: "15%" }}>
          <ArcoChan poseKey="predict" />
        </div>
        <div className={styles.predictBody} style={{ marginTop: "8%" }}>
          「{s.ans.q4song}」⭐︎{s.ans.q4star}なら、
          <br />
          毎日{s.ans.q6}の練習で<b>{period}</b>で弾けるようになるよ!
        </div>
      </div>
      <CtaButton
        label="次へ"
        onClick={() => {
          s.setSeg("Q4", 1)
          s.go("SCR09")
        }}
      />
    </>
  )
}

/* ── SCR-09 Q5 楽譜は読めるか ── */
function Scr09() {
  const s = useOnboarding()
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">楽譜は読める?</AvatarBubble>
      <div className={styles.list}>
        {["すらすら読める", "ゆっくりなら読める", "読めない"].map((o) => (
          <OptionCard key={o} label={o} selected={s.ans.q5 === o} onClick={() => s.setAns({ q5: o })} />
        ))}
      </div>
      <CtaButton
        label="次へ"
        disabled={!s.ans.q5}
        divider
        onClick={() => {
          s.setSeg("Q5", 1)
          s.go("SCR11")
        }}
      />
    </>
  )
}

/* ── SCR-11 Q8 最終ゴール Epic Win(§27-7-2 5択) ── */
function Scr11() {
  const s = useOnboarding()
  const OPTS: Array<[string, string]> = [
    ["人前で演奏したい", "🎤"],
    ["家族や友人に聴かせたい", "👨‍👩‍👧"],
    ["憧れのあの曲を完璧に弾きたい", "🌟"],
    ["オーケストラ・アンサンブルに参加したい", "🎻"],
    ["趣味として長く楽しみたい", "☕"],
  ]
  const confirm = () => {
    if (s.ans.q8 === "人前で演奏したい") s.go("SCR11B")
    else if (s.ans.q8 === "憧れのあの曲を完璧に弾きたい") s.go("SCR11C")
    else {
      s.setSeg("goal", 1)
      s.go("SCR12")
    }
  }
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">最後に、いちばん大きな夢を教えて!</AvatarBubble>
      <div className={styles.list}>
        {OPTS.map(([label, ico]) => (
          <OptionCard
            key={label}
            icon={ico}
            label={label}
            selected={s.ans.q8 === label}
            onClick={() => s.setAns({ q8: label })}
          />
        ))}
      </div>
      <CtaButton label="次へ" disabled={!s.ans.q8} divider onClick={confirm} />
    </>
  )
}

/* ── SCR-11b 発表会の日付(スキップ可) ── */
function Scr11B() {
  const s = useOnboarding()
  const [date, setDate] = useState(s.ans.goalDate ?? "")
  const done = (d: string | null) => {
    s.setAns({ goalDate: d })
    s.setSeg("goal", 1)
    s.go("SCR12")
  }
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">発表会の日は決まってる?</AvatarBubble>
      <div className={styles.list}>
        <input
          className={styles.input}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="発表会の日付"
        />
        <button className={styles.linkbtn} onClick={() => done(null)}>
          まだ決まってない
        </button>
      </div>
      <CtaButton label="次へ" divider onClick={() => done(date || null)} />
    </>
  )
}

/* ── SCR-11c 憧れの曲名(未収録そのまま登録可・リクエスト記録 §27-8・到達予測なし) ── */
function Scr11C() {
  const s = useOnboarding()
  const [song, setSong] = useState(s.ans.goalSong ?? "")
  return (
    <>
      <Header />
      <AvatarBubble poseKey="question">その曲の名前を教えて!(なんでもOK)</AvatarBubble>
      <div className={styles.list}>
        <input
          className={styles.input}
          placeholder="曲名を入力"
          value={song}
          onChange={(e) => setSong(e.target.value)}
          aria-label="曲名"
        />
      </div>
      <CtaButton
        label="次へ"
        divider
        onClick={() => {
          const name = song.trim() || null
          s.setAns({ goalSong: name })
          s.setSongRequest(name)
          s.setSeg("goal", 1)
          s.go("SCR12")
        }}
      />
    </>
  )
}

/* ── SCR-12 完了画面「旅の地図 + あなたの練習プラン」(C4・モック承認済 v0.4§B) ──
   いま🎻 ─ 目標曲⭐︎(予測) ─ 星を積み上げる ─ 🏆最終ゴール を登りパスで接続。
   アルコ2体: 「いま」右下=構え(ready) / ゴール左上=紙吹雪ブラボー(bravo)。
   CTAの保存接続(サーバー)は C5。ここではペイロードをコンソール証跡出力。 */
const Q6_LABEL: Record<string, string> = {
  "5分 / 日": "まずは気軽に",
  "15分 / 日": "しっかり",
  "30分 / 日": "本気",
  "それ以上": "情熱的",
}

function Scr12() {
  const s = useOnboarding()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const star = s.result?.star ?? 1
  const period = estimatePeriod(star, s.ans.q4star ?? 1, s.ans.q6 ?? "").label
  const goalLbl = s.ans.goalSong || s.ans.q8 || "最終ゴール"

  // C5: サーバー保存(冪等)→ ドラフト破棄 → ホームへ
  const finish = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    const result = s.result ?? { star, tags: [], doubleStops: [], notes: [] }
    console.log("[onboarding] 登録:", { star, flags: toProvisionalFlags(result) })
    const res = await completeOnboarding({
      answers: s.ans as Record<string, unknown>,
      ladder: s.ladder as Record<string, unknown>,
      screen: "SCR12",
      seg: s.seg,
      star,
      flags: toAcquisitionFlags(result),
      songRequest: s.songRequest,
    }).catch(() => ({ ok: false as const, error: "通信に失敗しました" }))
    if (res.ok) {
      s.resetDraft()
      router.push(("homePath" in res && res.homePath) || s.homePath)
    } else {
      setSaving(false)
      setError("error" in res ? (res.error ?? "保存に失敗しました") : "保存に失敗しました")
    }
  }

  return (
    <>
      <div className={styles.planHead}>あなたの練習プラン</div>

      {/* 旅の地図(登りパス: 破線グレー→最初の一歩のみ緑・描画アニメ) */}
      <div className={styles.mapArea}>
        <svg className={styles.mapSvg} viewBox="0 0 370 254" fill="none">
          <path
            d="M 36 200 C 100 205, 110 130, 150 122 S 240 105, 262 78 S 312 55, 328 44"
            stroke="#E5E5E5"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="1 14"
          />
          <path
            className={styles.mapStep}
            d="M 36 200 C 60 202, 72 190, 82 178"
            stroke="#58CC02"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        <div className={`${styles.mapArco}`} style={{ left: "28%", top: "90%", width: "16%", aspectRatio: 1 }}>
          <ArcoChan poseKey="ready" />
        </div>
        <div className={`${styles.mapArco}`} style={{ left: "74%", top: "8%", width: "13%", aspectRatio: 1 }}>
          <ArcoChan poseKey="bravo" />
        </div>
        <div className={`${styles.mapNode} ${styles.mapNodeNow}`} style={{ left: "9.7%", top: "79%" }}>
          <div className={styles.mapCircle}>🎻</div>
          <div className={styles.mapLbl}>いま ★{star}</div>
        </div>
        <div className={styles.mapNode} style={{ left: "40.5%", top: "48%" }}>
          <div className={styles.mapCircle}>⭐️</div>
          <div className={styles.mapLbl}>
            {s.ans.q4song ?? "目標曲"} ⭐︎{s.ans.q4star ?? ""}
          </div>
          <div className={styles.mapSub}>
            <b>{period}</b>で到達
          </div>
        </div>
        <div className={styles.mapNode} style={{ left: "70.8%", top: "31%" }}>
          <div className={styles.mapCircle}>✨</div>
          <div className={styles.mapLbl}>星を積み上げる</div>
        </div>
        <div className={`${styles.mapNode} ${styles.mapNodeGoal}`} style={{ left: "88.5%", top: "16.5%" }}>
          <div className={styles.mapCircle}>🏆</div>
          <div className={styles.mapLbl}>{goalLbl}</div>
        </div>
      </div>

      {/* プランサマリー3枚(c型流用・実回答バインド。予測はSCR-08cと同値=同一関数) */}
      <div className={styles.plan}>
        <div className={styles.card}>
          <span className={styles.cardIco}>🎻</span>
          <span className={styles.cardMain}>
            {s.ans.q4song}{" "}
            <span style={{ color: "var(--primary)", fontSize: "0.8em" }}>⭐︎{s.ans.q4star}</span>
          </span>
          <span className={styles.cardSub}>{period}で到達</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIco}>⏱️</span>
          <span className={styles.cardMain}>{s.ans.q6}</span>
          <span className={styles.cardSub}>{Q6_LABEL[s.ans.q6 ?? ""] ?? ""}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIco}>🏆</span>
          <span className={styles.cardMain}>{s.ans.q8}</span>
          <span className={styles.cardSub}>{s.ans.goalDate ?? ""}</span>
        </div>
      </div>

      {error && <div className={styles.doneNote} style={{ color: "#b91c1c" }}>{error}</div>}
      <CtaButton
        label={saving ? "保存中…" : "さっそくスタートする"}
        disabled={saving}
        divider
        onClick={finish}
      />
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
  SCR07: Scr07,
  SCR08A: Scr08A,
  SCR08B: Scr08B,
  SCR10: Scr10,
  SCR08C: Scr08C,
  SCR09: Scr09,
  SCR11: Scr11,
  SCR11B: Scr11B,
  SCR11C: Scr11C,
  SCR12: Scr12,
}

function Router() {
  const s = useOnboarding()
  const Screen = SCREENS[s.screen] ?? Scr01

  // キーボード操作 (v0.3 §4): Enter = CTA / ↑↓ = 選択肢フォーカス移動
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "BUTTON" || tag === "INPUT") return // フォーカス中の要素を優先
        const cta = document.querySelector<HTMLButtonElement>(
          `.${styles.cta}:not(:disabled)`,
        )
        cta?.click()
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const cards = [
          ...document.querySelectorAll<HTMLButtonElement>(`.${styles.card}`),
        ]
        if (cards.length === 0) return
        e.preventDefault()
        const idx = cards.findIndex((c) => c === document.activeElement)
        const next =
          e.key === "ArrowDown"
            ? cards[Math.min(cards.length - 1, idx + 1)]
            : cards[Math.max(0, idx - 1)]
        next?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return <Screen />
}

export default function OnboardingClient({
  catalog,
  homePath,
  serverDraft,
}: {
  catalog: Record<string, CatalogCategory>
  homePath: string
  serverDraft: Partial<OnboardingPublicState> | null
}) {
  return (
    <OnboardingProvider catalog={catalog} homePath={homePath} serverDraft={serverDraft}>
      <Router />
    </OnboardingProvider>
  )
}
