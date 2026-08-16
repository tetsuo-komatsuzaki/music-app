// アプリ起動待ちスプラッシュ 案2「演奏するアルコ」(2026-08-16 Tetsuo承認)。
// サーバー描画されるため、JSバンドルの読み込み・ハイドレーションを待つ間もアルコが動く。
// 表示条件: html[data-native-app] のみ (layout.tsx冒頭のインラインscriptが起動直後に立てる。Web版は非表示)。
// 消灯: NativeChrome がハイドレーション完了後にフェードアウトして DOM から除去する。
import { ArcoChan, POSES } from "./ArcoChan"

const PLAYING_POSE = (POSES as { id: string }[]).find((p) => p.id === "03B") // 弓を振って応援 (弓を振るwaveアニメ内蔵)

export default function ArcoBootSplash() {
  if (!PLAYING_POSE) return null
  return (
    <div id="arco-boot" aria-hidden>
      <div className="abStage">
        <div className="abArco"><ArcoChan pose={PLAYING_POSE} /></div>
        <div className="abNotes"><span>♪</span><span>♫</span><span>♪</span></div>
      </div>
      <div className="abLogo">Arcoda</div>
      {/* ローディング中と明確にわかる表示 (2026-08-16 Tetsuo指定): 文字+跳ねるドット */}
      <div className="abTag">よみこみ中<span className="abDots"><i /><i /><i /></span></div>
    </div>
  )
}
