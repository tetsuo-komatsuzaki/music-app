"use client"

// ============================================================
// /onboarding — 画面ルーター (2026-08-02 登録star整合版)
// フロー:
//   SCR-01 → 02 → 03 → 04(Q2)
//    ├ これから始める → ★1確定・ラダースキップ → SCR-07
//    └ 経験者 → L_G1..G6(+G3補足) → SCR-07
//   各関門 Gn = ★n帯の代表技術 (正本: docs/arcoda-design-spec.md §2-2b)。
// 検証証跡: ラダー確定時に ★/PROVISIONALフラグを console に出力。
// ============================================================

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HelpCircle, Music, Mic, Users, Sparkles, Coffee, Clapperboard, TreePine } from "lucide-react"
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
import { clearReturnToCookie, mapReturnToForUser, readReturnToCookie } from "@/app/_libs/returnTo"

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

/* ── SCR-03 予告 ──
   2026-08-26: 「7つのかんたんなステップ(約1分)」から変更。7問は初心者パスのみ正しく、
   「これから始める」以外は★判定ラダーG1〜G6が挟まって最大14問になるため件数を出さない。 */
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
            最初の練習をはじめる前に、<b>かんたんな質問</b>に答えてね!
            <br />
            1〜2分くらいで終わるよ
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

/* ── ★判定ラダー G1〜G6 (2026-08-02 登録star整合版・§2-2b)
     各関門 Gn = ★n帯の代表技術。欠けがあれば★nで確定 (選択分は仮習得)。 ── */
function GateG1() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <YesNoGate
        question="スラー・2つの音を1弓でつなげるはできる?"
        yesLabel="はい、できる"
        onAnswer={(v) => {
          s.setLadder({ g1: v })
          s.setSeg("ladder", 0.15)
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
          { value: "スタッカート", desc: "音を短く切って弾く" },
          { value: "ピチカート", desc: "指で弦をはじく" },
          { value: "トレモロ", desc: "同じ音を細かくくり返す" },
        ]}
        noneLabel="どれもまだできない"
        onConfirm={(sel) => {
          s.setLadder({ g2: sel })
          s.setSeg("ladder", 0.3)
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
      <MultiGate
        question="この中で、できるものをぜんぶ選んで!"
        options={[
          { value: "スピッカート", desc: "弓を弦の上で跳ねさせる" },
          { value: "トリル", desc: "2つの音をすばやく交互に弾く" },
        ]}
        noneLabel="どれもまだできない"
        onConfirm={(sel) => {
          s.setLadder({ g3: sel })
          s.setSeg("ladder", 0.45)
          if (sel.length < 2) s.go("L_G3S")
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
        question="ポジション移動・3rdはできる?"
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
        question="この中で、できるものをぜんぶ選んで!"
        options={[
          { value: "ビブラート", desc: "音をゆらして響かせる" },
          { value: "3rd", desc: "3rdポジションへの移動" },
        ]}
        noneLabel="どちらもまだできない"
        onConfirm={(sel) => {
          s.setLadder({ g4: sel })
          s.setSeg("ladder", 0.6)
          if (sel.length < 2) {
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
      <MultiGate
        question="この中で、できるものをぜんぶ選んで!"
        options={[
          { value: "5th", desc: "5thポジションへの移動" },
          { value: "グリッサンド", desc: "指を滑らせて音をつなぐ" },
          { value: "ハーモニクス", desc: "弦に軽く触れて澄んだ音を出す" },
        ]}
        noneLabel="どれもまだできない"
        onConfirm={(sel) => {
          s.setLadder({ g5: sel })
          s.setSeg("ladder", 0.8)
          if (sel.length < 3) {
            finalize({ g5: sel })
            s.go("SCR07")
          } else s.go("L_G6")
        }}
      />
    </>
  )
}

function GateG6() {
  const s = useOnboarding()
  const finalize = useFinalize()
  return (
    <>
      <Header />
      <MultiGate
        question="さいごに!この中で、できるものをぜんぶ選んで!"
        options={[
          { value: "2nd", desc: "2ndポジション" },
          { value: "4th", desc: "4thポジション" },
          { value: "6th+", desc: "6thポジション以上" },
          { value: "連続重音", desc: "重音・2本の弦を同時にをつづけて弾く" },
        ]}
        noneLabel="どれもまだできない"
        onConfirm={(sel) => {
          s.setLadder({ g6: sel })
          s.setSeg("ladder", 0.95)
          finalize({ g6: sel })
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
            なるほど、きみのレベルがわかったよ!
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
            icon={key === "movie" ? <Clapperboard size={20} /> : key === "season" ? <TreePine size={20} /> : <Music size={20} />}
            label={c.label}
            selected={s.ans.q4cat === key}
            onClick={() => s.setAns({ q4cat: key })}
          />
        ))}
        <OptionCard
          icon={<HelpCircle size={20} />}
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
          ? `★${star}のきみにぴったりの3曲だよ。1曲えらんでね!`
          : `★${star}のきみにちょうどいい曲だよ。1曲えらんでね!`}
      </AvatarBubble>
      <div className={styles.list}>
        {songs.map(([name, st]) => (
          <OptionCard
            key={name}
            icon={<Music size={20} />}
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
          {/* q6の値は「15分 / 日」形式。「毎日」と重なるので表示では「 / 日」を落とす (2026-08-29 Tetsuo指摘) */}
          毎日{(s.ans.q6 ?? "").replace(" / 日", "")}の練習で<b>{period}</b>で弾けるようになるよ!
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
  const OPTS: Array<[string, React.ReactNode]> = [
    ["人前で演奏したい", <Mic key="i" size={20} />],
    ["家族や友人に聴かせたい", <Users key="i" size={20} />],
    ["憧れのあの曲を完璧に弾きたい", <Sparkles key="i" size={20} />],
    ["オーケストラ・アンサンブルに参加したい", <Music key="i" size={20} />],
    ["趣味として長く楽しみたい", <Coffee key="i" size={20} />],
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
      <AvatarBubble poseKey="question">
        その曲の名前を教えて!
        <br />
        なんでもOK
      </AvatarBubble>
      <div className={styles.list}>
        <input
          className={styles.input}
          placeholder="曲名を入力"
          value={song}
          onChange={(e) => setSong(e.target.value)}
          maxLength={100}
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

/* ── SCR-12 完了画面「はじまりの1枚」(2026-08-29 Tetsuo確定: パターン2) ──
   旅の地図+サマリー3枚は廃止 (載る物の種類がバラバラで地図として読めず、
   ここ一回きりの使い捨て世界観だった)。演奏姿のアルコ (08C・29キット中
   唯一バイオリンを左肩に構えるポーズ) を大きく置き、文言と開始ボタンだけ。
   CTAの保存接続(サーバー・冪等)は従来どおり C5。 */
function Scr12() {
  const s = useOnboarding()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const star = s.result?.star ?? 1

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
      const home = ("homePath" in res && res.homePath) || s.homePath
      // ゲスト閲覧 (2026-09-06): ゲートから登録した人は、止められた場所へ戻す (cookie の /guest/... を本人の URL に)
      const rt = readReturnToCookie()
      clearReturnToCookie()
      const uid = home.split("/")[1] ?? ""
      router.push(rt && uid ? mapReturnToForUser(rt, uid) : home)
    } else {
      setSaving(false)
      setError("error" in res ? (res.error ?? "保存に失敗しました") : "保存に失敗しました")
    }
  }

  return (
    <>
      <div className={styles.centerScr}>
        <div className={styles.finStage}>
          <div className={styles.finGlow} aria-hidden />
          <ArcoChan poseKey="play" />
        </div>
        <div className={styles.finCopy}>
          あの憧れの曲へ、
          <br />
          <b>きょうの一歩</b>から
        </div>
      </div>
      {error && <div className={styles.doneNote} style={{ color: "#b91c1c" }}>{error}</div>}
      <CtaButton label={saving ? "保存中…" : "はじめよう"} disabled={saving} onClick={finish} />
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
  L_G6: GateG6,
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
