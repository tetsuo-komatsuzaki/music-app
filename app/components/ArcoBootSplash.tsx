// アプリ起動待ちスプラッシュ (2026-08-23 Tetsuo指示: Webの待機画面と同一デザインへ刷新)。
// 二重金枠リング+回転アーク+アルコ(05A 弓を両手で構える)+「音を調えています…」。
// サーバー描画されるため、JSバンドルの読み込み・ハイドレーションを待つ間も動く (CSSアニメのみ)。
// 表示条件: html[data-native-app] のみ。消灯: NativeChrome がハイドレーション完了後に除去。
// 変更したら npx tsx scripts/gen-native-splash.tsx で splash.html を再生成し、Mac側で再同梱する。

export default function ArcoBootSplash() {
  return (
    <div id="arco-boot" aria-hidden>
      <div className="abRing">
        <span className="abArc" />
        <span className="abDisc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arco/05A.jpg" alt="" />
        </span>
      </div>
      <div className="abTitle">
        音を調えています<span className="abD">・</span><span className="abD">・</span><span className="abD">・</span>
      </div>
      <div className="abLogo">Arcoda</div>
    </div>
  )
}
