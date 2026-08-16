// アプリ起動待ちスプラッシュ (2026-08-16 Tetsuo承認: 案2ベース→全ポーズランダム化)。
// サーバー描画されるため、JSバンドルの読み込み・ハイドレーションを待つ間もアルコが動く。
// 表示条件: html[data-native-app] のみ (layout.tsx冒頭のインラインscriptが起動直後に立てる。Web版は非表示)。
// 消灯: NativeChrome がハイドレーション完了後にフェードアウトして DOM から除去する。
//
// ポーズと文言は起動のたびにランダム (2026-08-16 Tetsuo指定)。
// BOOT_POSE_IDS / BOOT_MESSAGES はネイティブ同梱版 (scripts/gen-native-splash.tsx) と共有の正。
// 変更したら npx tsx scripts/gen-native-splash.tsx で splash.html を再生成し、Mac側で再同梱する。
import { ArcoChan, POSES } from "./ArcoChan"

export const BOOT_POSE_IDS = [
  "03B", // 弓を振って応援
  "08C", // リズムにのる
  "02A", // 両手上げジャンプ
  "05A", // 弓を両手で構える
  "09B", // 手をふって挨拶
  "01C", // 真上を掲げて指す
  "06B", // 紙吹雪ブラボー
  "10C", // 音符をぎゅっ
  "09C", // ジャンプ登場
  "08B", // 座ってうっとり
] as const

// ワクワク感・もうすぐ弾ける感のある文言 (2026-08-16 Tetsuo指定・UI括弧禁止ルール準拠)
export const BOOT_MESSAGES = [
  "もうすぐはじまるよ！",
  "アルコがまってるよ！",
  "きょうもいっしょにひこう！",
  "じゅんびはもうすぐ！",
  "すぐにひけるよ！",
] as const

const BOOT_POSES = BOOT_POSE_IDS
  .map((id) => (POSES as { id: string }[]).find((p) => p.id === id))
  .filter(Boolean)

export default function ArcoBootSplash() {
  if (!BOOT_POSES.length) return null
  // サーバーがリクエストごとに抽選する (起動=フルロードのたびに変わる)
  const pose = BOOT_POSES[Math.floor(Math.random() * BOOT_POSES.length)]
  const message = BOOT_MESSAGES[Math.floor(Math.random() * BOOT_MESSAGES.length)]
  return (
    <div id="arco-boot" aria-hidden>
      <div className="abStage">
        <div className="abArco"><ArcoChan pose={pose} /></div>
        <div className="abNotes"><span>♪</span><span>♫</span><span>♪</span></div>
      </div>
      <div className="abLogo">Arcoda</div>
      <div className="abTag">{message}<span className="abDots"><i /><i /><i /></span></div>
    </div>
  )
}
