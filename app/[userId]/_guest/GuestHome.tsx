/**
 * ゲストホーム (2026-09-06 Tetsuo確定)。未ログインの訪問者が最初に見る画面。
 * 3 段: これは何か (一言と登録ボタン) → できること (3 行) → 本物のホームのカード 2 枚を見本として。
 * 見本のカードはボタンもタブも押せる。押すと遷移先 (曲の詳細 ・ 教材の詳細) へ進み、その画面の上でゲートが出る。
 * おすすめ練習は見本データで 4 タブとも中身を入れ、空の状態を出さない。
 */
import Link from "next/link"
import ds from "@/app/components/ds.module.css"
import PracticeFocusCard from "@/app/components/PracticeFocusCard"
import PersonalRecoCard from "@/app/components/PersonalRecoCard"
import { GUEST_ID } from "@/app/_libs/viewer"
import { buildSampleAchievement, buildSampleReco, pickFeaturedScore, guestHref } from "./sample"
import ReturningHome from "./ReturningHome"
import { KNOWN_USER_BOOT_SCRIPT } from "@/app/_libs/knownUser"
import GateSheet from "@/app/components/guest/GateSheet"
import { GATE_TEXT } from "@/app/components/guest/gateText"
import { safeReturnPath } from "@/app/_libs/returnTo"
import styles from "./guestHome.module.css"

const SIGNUP = `/signUp?returnTo=${encodeURIComponent(`/${GUEST_ID}`)}`
const LOGIN = `/login?returnTo=${encodeURIComponent(`/${GUEST_ID}`)}`

/** gate: 未ログインでログインが要る画面を開いた人が戻されてきたとき、この上にシートを出す (2026-09-06 Tetsuo確定) */
export default async function GuestHome({ gate = false, returnTo = null }: { gate?: boolean; returnTo?: string | null } = {}) {
  const [featured, ach, reco] = await Promise.all([pickFeaturedScore(), buildSampleAchievement(), buildSampleReco()])
  const pieces = featured
    ? [{ id: featured.id, title: featured.title, star: featured.star, cover: featured.cover, latest: 82, recentAvg: 78, badge: null, href: guestHref(`/scores/${featured.id}`) }]
    : []

  return (
    <div data-guest-home>
      {gate && <GateSheet title={GATE_TEXT.generic.title} items={[...GATE_TEXT.generic.items]} laterMode="hide" returnTo={safeReturnPath(returnTo) ?? `/${GUEST_ID}`} />}
      {/* 案B (2026-09-06): 端末に記録がある人には、未登録者向けの中身 (.unregistered) を隠し、おかえりなさい画面を出す */}
      <script dangerouslySetInnerHTML={{ __html: KNOWN_USER_BOOT_SCRIPT }} />
      <ReturningHome />
      <div className={styles.unregistered}>
      <div className={`${ds.card} ${styles.hero}`}>
        <div className={styles.eyebrow}>ARCODA</div>
        <div className={styles.lead}>バイオリンの練習を録音すると、<br />音程とリズムをその場で採点。</div>
        <div className={styles.sub}>先生がいなくても、弾くたびに何が良くなったかが残ります。</div>
        <div className={styles.heroActions}>
          <Link href={SIGNUP} className={styles.cta}>無料で登録して始める</Link>
          <Link href={LOGIN} className={styles.linkline}>アカウントがある人はログイン</Link>
        </div>
      </div>

      <div className={ds.card}>
        <div className={ds.lab}>できること</div>
        <div className={ds.row} style={{ marginTop: 10 }}>
          <span className={`${styles.rowIcon} ${styles.gold}`} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </span>
          <div className={ds.rowMain}><b>録音して採点</b><span>音程とリズムを1音ずつ見る</span></div>
        </div>
        <div className={ds.row} style={{ marginTop: 10 }}>
          <span className={`${styles.rowIcon} ${styles.teal}`} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h7" /></svg>
          </span>
          <div className={ds.rowMain}><b>毎日の基礎練</b><span>苦手に合わせて4枚を毎日組む</span></div>
        </div>
        <div className={ds.row} style={{ marginTop: 10 }}>
          <span className={`${styles.rowIcon} ${styles.green}`} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 19V5M4 19h16M8 15l4-6 4 4 4-7" /></svg>
          </span>
          <div className={ds.rowMain}><b>成長カルテ</b><span>回数ではなく、変化が主役</span></div>
        </div>
      </div>

      {pieces.length > 0 && (
        <div className={styles.samplebox}>
          <div className={styles.samplehead}><span className={styles.samplechip}>見本</span><span>登録すると、ここにあなたのいま練習している曲が入ります</span></div>
          <div className={styles.sampleBody}>
            <PracticeFocusCard pieces={pieces} basics={[]} userId={GUEST_ID} preset={ach} />
            <div className={styles.watermark} aria-hidden>見本</div>
          </div>
        </div>
      )}

      <div className={styles.samplebox}>
        <div className={styles.samplehead}><span className={styles.samplechip}>見本</span><span>登録すると、ここにあなたのおすすめ練習が入ります</span></div>
        <div className={styles.sampleBody}>
          <PersonalRecoCard userId={GUEST_ID} reco={reco} />
          <div className={styles.watermark} aria-hidden>見本</div>
        </div>
      </div>

      <div className={styles.hint}>見本の曲・教材・タブは押せます。押すと遷移先の画面でご案内が出ます</div>
      </div>
    </div>
  )
}
