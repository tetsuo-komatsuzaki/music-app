# ArcoResultOverlay に祝い階層 (段2-5) を実装する
import io

p = "app/components/ArcoResultOverlay.tsx"
s = io.open(p, encoding="utf-8").read()

old = '''import { useDragToDismiss } from "@/app/_hooks/useDragToDismiss"
import styles from "./ArcoResultOverlay.module.css"'''
new = '''import { useDragToDismiss } from "@/app/_hooks/useDragToDismiss"
import Coin from "./Coin"
import { ScrollFace, TreasureFaceStyles } from "@/app/[userId]/_gallery/TreasureFaces"
import styles from "./ArcoResultOverlay.module.css"'''
assert old in s, "import"
s = s.replace(old, new)

old = '''export default function ArcoResultOverlay({
  scoreId, userId, perf, onClose,
}: {
  scoreId: string
  userId: string
  perf: { id: string; pitchAccuracy: number | null; timingAccuracy: number | null }
  onClose: () => void
}) {'''
new = '''export default function ArcoResultOverlay({
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
}) {'''
assert old in s, "props"
s = s.replace(old, new)

old = '''  if (!mounted) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} ref={drag.ref} {...drag.handlers} onClick={(e) => e.stopPropagation()}>'''
new = '''  if (!mounted) return null

  // 祝い階層 (2026-08-31 genspark Museum Edition v3 移植): 段が上がるほど金が増える
  const hasBest = events.includes("personal_best")
  const hasAchieve = events.includes("achieve")
  const hasMaster = events.includes("master")
  const hasRankUp = events.includes("rank_up")
  const elevated = hasBest || hasAchieve || hasMaster || hasRankUp
  const sheetTier = hasRankUp ? "aroApex" : hasMaster ? "aroMaster" : ""

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.sheet} ${sheetTier}`} ref={drag.ref} {...drag.handlers} onClick={(e) => e.stopPropagation()}>'''
assert old in s, "sheet"
s = s.replace(old, new)

old = '''        <div className={styles.scoreRow}>
          <div className={styles.big}>
            <span className={styles.bigNum}>{overall}</span>
            <span className={styles.bigUnit}>点</span>
          </div>
          <div className={styles.side}>
            <span className={`${styles.rank} ${styles["r" + rankOf(overall)]}`}>{rankOf(overall)}</span>
          </div>
        </div>
'''
new = '''        <div className={styles.scoreRow}>
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
'''
assert old in s, "scoreRow"
s = s.replace(old, new)

css = """
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
.aroAchvCoin { position:relative; margin-top:11px; animation:aroBob 2.4s ease-in-out infinite; }
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
"""
anchor = "        {/* シェア: マスター済みなら🏆マスターカード、通常は🎵きょうの演奏カード */}"
assert anchor in s, "anchor"
style_block = "        {/* 祝い階層CSS (genspark Museum Edition v3 移植・aro接頭辞) */}\n        <style>{`" + css + "        `}</style>\n\n" + anchor
s = s.replace(anchor, style_block)
io.open(p, "w", encoding="utf-8").write(s)
print("overlay patched")
