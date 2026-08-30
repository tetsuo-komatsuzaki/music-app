"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import ArcoMotion from "./ArcoMotion"
import { Palette, Trophy, Share2, Ear } from "lucide-react"
import ShareSheet from "./ShareSheet"
import { createListenRequest } from "@/app/actions/listenRequests"
import { useDragToDismiss } from "@/app/_hooks/useDragToDismiss"
import Coin from "./Coin"
import { ScrollFace, TreasureFaceStyles } from "@/app/[userId]/_gallery/TreasureFaces"
import styles from "./ArcoResultOverlay.module.css"

type Ach = {
  lessons: { total: number; cleared: number; nextLessonId?: string | null }
  etude: { required: boolean; id?: string; title?: string; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null; threshold: number; scoredCount: number; requiredCount: number }
  achieved: boolean
  mastered: boolean
}
import type { Praise } from "@/app/_libs/praiseFeedback"

function headline(score: number, mastered: boolean): string {
  if (mastered) return "この曲、マスター達成〜！"
  if (score >= 90) return "すごい！演奏マスター級だね"
  if (score >= 75) return "いい演奏！あと少しで完璧"
  if (score >= 60) return "その調子！ここを直すともっと良くなるよ"
  return "だいじょうぶ、いっしょに練習していこう"
}

function rankOf(score: number): string {
  return score >= 90 ? "S" : score >= 75 ? "A" : score >= 60 ? "B" : "C"
}

export default function ArcoResultOverlay({
  scoreId, userId, perf, onClose, events = [], rewardLit = false, songTitle,
}: {
  scoreId: string
  userId: string
  perf: { id: string; pitchAccuracy: number | null; timingAccuracy: number | null }
  onClose: () => void
  /** この演奏で起きた節目 (achieve/master/rank_up/personal_best・祝い階層 2026-08-31) */
  events?: string[]
  /** 報酬体系キルスイッチ (宝物予告の文言用) */
  rewardLit?: boolean
  /** マスター認定の券面に出す曲名 */
  songTitle?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [ach, setAch] = useState<Ach | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [praise, setPraise] = useState<Praise | null>(null)
  const [strengthCount, setStrengthCount] = useState(0)
  const [hasTeacher, setHasTeacher] = useState(false)
  const [listenState, setListenState] = useState<"idle" | "sending" | "done" | "error">("idle")
  // 下スワイプで閉じる (シート上部/ハンドル、または一番上までスクロール時のみ)
  const drag = useDragToDismiss(onClose)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    let aborted = false
    Promise.all([
      fetch(`/api/scores/${scoreId}/achievement-status`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/performances/${perf.id}/growth-line`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([a, g]) => { if (!aborted) { setAch(a); setPraise(g?.praise ?? null); setStrengthCount(g?.strengthCount ?? 0); setHasTeacher(!!g?.hasTeacher) } })
    return () => { aborted = true }
  }, [scoreId, perf.id])

  const pitch = perf.pitchAccuracy ?? 0
  const timing = perf.timingAccuracy ?? 0
  const overall = Math.round((pitch + timing) / 2)
  const avg = ach?.master?.recentAvg != null ? Math.round(ach.master.recentAvg) : null

  // 条件チップ (点数以外の達成条件。案2: ゲージ+チップ構成 2026-08-02)。
  // 未クリアで行き先があるチップはタップでそのまま飛べる (行き止まり解消)
  const chips: { done: boolean; label: string; href?: string | null }[] = []
  if (ach) {
    if (ach.etude.required) chips.push({
      done: !!ach.etude.achieved,
      label: ach.etude.achieved ? "エチュード ✓" : "エチュード 未",
      href: ach.etude.id ? `/${userId}/practice/etude/${ach.etude.id}?from=${scoreId}` : null,
    })
  }

  if (!mounted) return null

  // 祝い階層 (2026-08-31 genspark Museum Edition v3 移植): 段が上がるほど金が増える
  const hasBest = events.includes("personal_best")
  const hasAchieve = events.includes("achieve")
  const hasMaster = events.includes("master")
  const hasRankUp = events.includes("rank_up")
  const elevated = hasBest || hasAchieve || hasMaster || hasRankUp
  const sheetTier = hasRankUp ? "aroApex" : hasMaster ? "aroMaster" : ""

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.sheet} ${sheetTier}`} ref={drag.ref} {...drag.handlers} onClick={(e) => e.stopPropagation()}>
        <div
          data-drag-handle
          aria-hidden
          style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 3, width: 40, height: 5, borderRadius: 3, background: "rgba(10,17,32,.35)", cursor: "grab", touchAction: "none" }}
        />
        <button type="button" className={styles.close} aria-label="閉じる" onClick={onClose}>✕</button>

        {/* 水彩ヒーロー (原本 №3): 紙吹雪 + 拍手アルコ 06A */}
        <div className={styles.hero}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={styles.confetti} aria-hidden
              style={{ left: `${4 + (i * 92) / 11}%`, animationDuration: `${4 + (i % 5)}s`, animationDelay: `${(i * 0.45) % 6}s` }} />
          ))}
          <ArcoMotion kit="06A" label="拍手するアルコ" className={styles.heroArco} />
        </div>

        <div className={styles.body}>
        <span className={styles.scorePill}>今日の採点</span>

        {/* 点数行 (原本: 白88px + 点 ・ 右にランクバッジ) */}
        <div className={styles.scoreRow}>
          <div className={styles.big}>
            <span className={`${styles.bigNum} ${elevated ? "aroGoldNum" : ""}`}>{overall}</span>
            <span className={styles.bigUnit}>点</span>
          </div>
          <div className={styles.side}>
            <span className={`${styles.rank} ${styles["r" + rankOf(overall)]}`}>{rankOf(overall)}</span>
          </div>
        </div>

        {/* ── 祝い階層 (段2〜5)。宝物の造形は実装部品 (Coin / ScrollFace) を使う ── */}
        {hasBest && (
          <div className="aroBand"><span className="aroBandL">自己ベスト更新</span><span className="aroBandS">これまでの最高を こえたよ</span></div>
        )}
        {hasAchieve && (
          <div className="aroAchv">
            <div className="aroAchvT">達成</div>
            <div className="aroAchvRule" />
            <div className="aroAchvS">この曲の すべての条件が そろったよ</div>
            <div className="aroAchvCoin"><Coin size={46} /></div>
            <div className="aroAchvN">ホームに かえると 達成コインが まっているよ</div>
          </div>
        )}
        {hasMaster && (
          <div className="aroMst">
            <TreasureFaceStyles />
            <div className="aroMstT">マスター認定</div>
            <div className="aroMstS">直近5回の平均が 90点を こえたよ</div>
            <div className="aroMstScroll"><ScrollFace variant="gold" piece={songTitle ?? "この曲"} height={120} /></div>
            {rewardLit && <div className="aroMstN">ホームに かえると マスター証明書が まっているよ</div>}
          </div>
        )}
        {hasRankUp && (
          <div className="aroRup">
            <div className="aroRupK">RANK UP</div>
            <div className="aroRupRow"><span className="aroRupStar">★</span></div>
            <div className="aroRupS">きみの格が ひとつ あがったよ</div>
            {rewardLit && <div className="aroRupN">ホームに かえると 称号カードが まっているよ</div>}
          </div>
        )}

        {/* 内訳メーター (原本: 金グラデ+発光) */}
        <div className={styles.meters}>
          <div className={styles.meter}>
            <div className={styles.meterHead}><span>音程</span><b>{Math.round(pitch)}</b></div>
            <div className={styles.meterTrack}><i className={styles.meterFill} style={{ ["--value" as string]: `${Math.round(pitch)}%` }} /></div>
          </div>
          <div className={styles.meter}>
            <div className={styles.meterHead}><span>リズム</span><b>{Math.round(timing)}</b></div>
            <div className={styles.meterTrack}><i className={styles.meterFill} style={{ ["--value" as string]: `${Math.round(timing)}%` }} /></div>
          </div>
        </div>

        {/* アルコの手紙 (原本: 紙カード)。ほめフィードバックがあればその文、無ければ点数帯の見出し */}
        <div className={styles.letter}>
          <p>{praise?.text ?? headline(overall, !!ach?.mastered)}</p>
          <div className={styles.sign}>―― アルコ</div>
        </div>

        {/* 💪 先生の強みリンク (案5・2026-08-03): 入口だけ置き、詳細はカルテの表現セクションへ */}
        {strengthCount > 0 && (
          <div style={{ margin: "6px 4px 0", fontSize: "var(--fs-caption)", fontWeight: 800 }}>
            <Link href={`/${userId}/progress`} onClick={onClose} style={{ color: "var(--text-link)", textDecoration: "underline" }}>
              <Palette size={13} style={{ verticalAlign: -2 }} /> 先生が認定したきみの表現・{strengthCount}個を見る →
            </Link>
          </div>
        )}

        {/* 🏆 マスターまで (案2: 点数ゲージ+90点ライン+条件チップ・2026-08-02確定) */}
        <div className={styles.sec}>
          <div className={styles.secH} style={{ display: "flex", alignItems: "center", gap: 6 }}><Trophy size={15} color="var(--gold)" /> マスターまで</div>
          {!ach ? (
            <div className={styles.muted}>集計してるよ…</div>
          ) : ach.mastered ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-good)", padding: "6px 0" }}>
              <Trophy size={15} color="var(--gold)" /> この曲はマスター済み！{avg != null ? ` いまの平均 ${avg}点` : ""}
            </div>
          ) : (
            <div>
              <style>{`@keyframes aroHop { 0%,100%{ transform:translate(-50%,0) } 50%{ transform:translate(-50%,-4px) } }`}</style>
              {avg != null ? (
                <>
                  {/* ゲージ: 直近5回平均 vs 90点ライン */}
                  <div style={{ position: "relative", height: 14, borderRadius: 7, background: "rgba(150,175,225,.16)", margin: "26px 4px 6px" }}>
                    <span style={{ position: "absolute", inset: "0 auto 0 0", width: `${Math.min(avg, 100)}%`, borderRadius: 7, background: "linear-gradient(90deg,#7a9be0,#2b5bc4)" }} />
                    <span style={{ position: "absolute", top: -7, bottom: -7, left: "90%", width: 3, borderRadius: 2, background: "var(--gold)" }}>
                      <span style={{ position: "absolute", top: -19, right: -4, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-master)", whiteSpace: "nowrap" }}>90点</span>
                    </span>
                    <span style={{ position: "absolute", top: -24, left: `${Math.min(avg, 100)}%`, transform: "translateX(-50%)", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-sub)", whiteSpace: "nowrap", animation: "aroHop 1.2s ease-in-out infinite" }}>
                      きみ {avg}点
                      <span style={{ display: "block", textAlign: "center", fontSize: "var(--fs-label)" }}>▼</span>
                    </span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: "var(--fs-body)", fontWeight: 900, marginTop: 10 }}>
                    {avg >= 90
                      ? <>90点ラインを超えてるよ！</>
                      : <>あと <b style={{ color: "var(--text-error)", fontSize: "var(--fs-subhead)" }}>{Math.max(1, Math.ceil(90 - avg))}点</b> で90点ライン！</>}
                  </div>
                  {ach.master.scoredCount < ach.master.requiredCount && (
                    <div style={{ textAlign: "center", fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 3 }}>
                      ※ 直近{ach.master.requiredCount}回の平均で判定・いま{ach.master.scoredCount}回
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.muted}>採点済みの演奏がたまると、90点ラインまでの距離が出るよ</div>
              )}
              {chips.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9, justifyContent: "center" }}>
                  {chips.map((c) => (
                    !c.done && c.href ? (
                      <Link key={c.label} href={c.href} onClick={onClose}
                        style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: "1px solid transparent", color: "#9db8e8", background: "rgba(43,91,196,.22)", textDecoration: "none" }}>
                        {c.label} →
                      </Link>
                    ) : (
                      <span key={c.label} style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.done ? "rgba(168,201,127,.35)" : "rgba(150,175,225,.16)"}`, color: c.done ? "#a8c97f" : "var(--text-sub)", background: c.done ? "rgba(168,201,127,.13)" : "transparent" }}>
                        {c.label}
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link href={`/${userId}/progress`} onClick={onClose} className={styles.ghost} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>カルテで成長記録をみる</Link>
          <button type="button" className={styles.ghost} onClick={() => setShareOpen(true)}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Share2 size={13} /> シェア</span></button>
          {/* 👂 先生に聴いてもらう (2026-08-06 案1簡素版): ワンタップ送信・シート無し */}
          {hasTeacher && (
            <button type="button" className={styles.ghost} disabled={listenState === "sending" || listenState === "done"}
              onClick={async () => {
                setListenState("sending")
                try {
                  const r = await createListenRequest(perf.id)
                  setListenState(r.ok ? "done" : "error")
                } catch {
                  setListenState("error")
                }
              }}>
              {listenState === "done" ? "✓ 先生に届けたよ" : listenState === "sending" ? "送信中…" : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Ear size={13} /> {listenState === "error" ? "もう一度" : "先生に聴いてもらう"}</span>
              )}
            </button>
          )}
        </div>

        </div>

        {/* 祝い階層CSS (genspark Museum Edition v3 移植・aro接頭辞) */}
        <style>{`
.aroGoldNum { background:linear-gradient(180deg,#fff8e0,#f0cd7c 52%,#c99a35);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  animation:aroGlow 2.6s ease-in-out 1s infinite; }
@keyframes aroGlow { 0%,100% { filter:drop-shadow(0 0 6px rgba(212,175,55,.35)); }
  50% { filter:drop-shadow(0 0 18px rgba(212,175,55,.8)); } }
.aroBand { display:flex; align-items:center; gap:10px; margin-top:13px; padding:10px 15px; border-radius:8px; position:relative; overflow:hidden;
  background:linear-gradient(90deg, rgba(212,175,55,.2), rgba(212,175,55,.05));
  border:1px solid rgba(212,175,55,.5); border-left:4px solid #d4af37;
  box-shadow:0 4px 12px rgba(0,0,0,.35), inset 0 1px 0 rgba(245,217,140,.25);
  animation:aroIn .5s cubic-bezier(.3,1.3,.5,1) .35s both; }
.aroBand::after { content:""; position:absolute; top:-40%; left:-60%; width:36%; height:180%;
  background:linear-gradient(100deg, transparent, rgba(255,248,225,.35) 50%, transparent);
  transform:skewX(-16deg); animation:aroSheen 3.4s ease-in-out 1s infinite; }
@keyframes aroSheen { 0%,60% { left:-60%; } 85%,100% { left:150%; } }
@keyframes aroIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
.aroBandL { font-size:var(--fs-caption); font-weight:900; color:#e8ca84; letter-spacing:.1em; }
.aroBandS { font-size:var(--fs-label); color:#a89d85; margin-left:auto; font-weight:700; }
.aroAchv { margin-top:15px; border-radius:10px; padding:16px; text-align:center; position:relative; overflow:hidden;
  background:linear-gradient(160deg,#1a2745,#0e1730); border:1px solid rgba(212,175,55,.55);
  box-shadow:0 10px 22px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06), inset 0 0 30px rgba(212,175,55,.06);
  animation:aroIn .5s cubic-bezier(.3,1.3,.5,1) .45s both; }
.aroAchv::before { content:""; position:absolute; inset:0;
  background:radial-gradient(ellipse 70% 90% at 50% -30%, rgba(232,202,132,.2), transparent 65%);
  animation:aroBreath 4s ease-in-out infinite; }
@keyframes aroBreath { 0%,100% { opacity:.6; } 50% { opacity:1; } }
.aroAchvT { position:relative; font-size:var(--fs-subhead); font-weight:900; letter-spacing:.3em; text-indent:.3em; color:#e8ca84; }
.aroAchvRule { position:relative; margin:8px auto 0; width:60px; height:1px;
  background:linear-gradient(90deg,transparent,#d4af37,transparent); }
.aroAchvS { position:relative; margin-top:8px; font-size:var(--fs-caption); color:#e3dac9; line-height:1.9; }
.aroAchvCoin { position:relative; margin-top:11px; display:flex; justify-content:center; animation:aroBob 2.4s ease-in-out infinite; }
@keyframes aroBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
.aroAchvN { position:relative; margin-top:8px; font-size:var(--fs-label); color:#a89d85; letter-spacing:.08em; }
.aroMst { margin-top:15px; border-radius:10px; padding:17px 16px; text-align:center; position:relative; overflow:hidden;
  background:linear-gradient(160deg,#2b2210,#181206); border:1.5px solid rgba(212,175,55,.75);
  box-shadow:0 12px 26px rgba(0,0,0,.5), inset 0 0 34px rgba(212,175,55,.12);
  animation:aroIn .55s cubic-bezier(.3,1.3,.5,1) .55s both; }
.aroMst::before { content:""; position:absolute; left:50%; top:-40px; width:70%; height:100px; transform:translateX(-50%);
  background:linear-gradient(180deg, rgba(255,236,190,.14), transparent);
  clip-path:polygon(40% 0,60% 0,100% 100%,0 100%); filter:blur(4px); }
.aroMstT { position:relative; z-index:2; font-size:var(--fs-subhead); font-weight:900; letter-spacing:.24em; text-indent:.24em;
  background:linear-gradient(180deg,#fff3cf,#e8ca84 55%,#c99a35); -webkit-background-clip:text; background-clip:text; color:transparent; }
.aroMstS { position:relative; z-index:2; margin-top:7px; font-size:var(--fs-caption); color:#e3dac9; line-height:1.9; }
.aroMstScroll { position:relative; z-index:2; margin-top:11px; animation:aroBob 3.6s ease-in-out infinite; }
.aroMstN { position:relative; z-index:2; margin-top:9px; font-size:var(--fs-label); color:#d4af37; letter-spacing:.1em; font-weight:800; }
.aroRup { margin-top:15px; border-radius:12px; padding:19px 16px; text-align:center; position:relative; overflow:hidden;
  background:linear-gradient(160deg,#241d08,#120e04); border:2px solid rgba(232,202,132,.9);
  box-shadow:0 14px 30px rgba(0,0,0,.55), inset 0 0 44px rgba(212,175,55,.16);
  animation:aroIn .55s cubic-bezier(.3,1.3,.5,1) .65s both; }
.aroRup::before { content:""; position:absolute; left:-40%; top:0; width:34%; height:200%;
  background:linear-gradient(100deg, transparent, rgba(255,244,205,.22) 50%, transparent);
  transform:skewX(-16deg); animation:aroRupSheen 3.6s ease-in-out .6s infinite; }
@keyframes aroRupSheen { 0% { left:-40%; } 55%, 100% { left:130%; } }
.aroRupK { position:relative; font-size:var(--fs-label); font-weight:800; color:#a89d85; letter-spacing:.4em; text-indent:.4em; }
.aroRupRow { position:relative; margin-top:10px; display:flex; align-items:center; justify-content:center; }
.aroRupStar { display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%;
  font-size:26px; font-weight:900; border:2px solid #e8ca84; color:#e8ca84;
  background:radial-gradient(circle at 38% 30%, rgba(232,202,132,.4), rgba(212,175,55,.08));
  box-shadow:0 0 26px rgba(212,175,55,.6), inset 0 1px 1px rgba(255,244,205,.5);
  animation:aroPulse 2.4s ease-in-out infinite; }
@keyframes aroPulse { 0%,100% { box-shadow:0 0 18px rgba(212,175,55,.5); } 50% { box-shadow:0 0 34px rgba(212,175,55,.85); } }
.aroRupS { position:relative; margin-top:11px; font-size:var(--fs-caption); color:#e3dac9; line-height:1.9; }
.aroRupN { position:relative; margin-top:9px; font-size:var(--fs-label); color:#d4af37; letter-spacing:.1em; font-weight:800; }
.aroMaster { border-color:rgba(212,175,55,.8) !important;
  box-shadow:0 26px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(212,175,55,.3), 0 0 46px rgba(212,175,55,.14) !important; }
.aroApex { border-color:rgba(232,202,132,.95) !important;
  box-shadow:0 28px 72px rgba(0,0,0,.62), 0 0 0 1.5px rgba(232,202,132,.45), 0 0 64px rgba(212,175,55,.24) !important; }
@media (prefers-reduced-motion: reduce) {
  .aroGoldNum, .aroBand, .aroBand::after, .aroAchv, .aroAchv::before, .aroAchvCoin,
  .aroMst, .aroMstScroll, .aroRup, .aroRup::before, .aroRupStar { animation:none !important; }
}
        `}</style>

        {/* シェア: マスター済みなら🏆マスターカード、通常は🎵きょうの演奏カード */}
        {shareOpen && (
          <ShareSheet
            kind={ach?.mastered ? "master" : "daily"}
            refId={ach?.mastered ? scoreId : perf.id}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}
