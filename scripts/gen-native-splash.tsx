// アプリ殻(iOS)同梱用スプラッシュHTMLの生成 (2026-08-16)。
// Web側の起動スプラッシュ (ArcoBootSplash) と完全に同じ見た目・同じ抽選仕様を
// 1ファイルの自己完結HTMLに書き出す。Mac側はこれを Xcode バンドルに入れて
// WKWebView のオーバーレイで表示する (docs/native-splash-mac-instructions.md 参照)。
//
// 実行: npx tsx scripts/gen-native-splash.tsx
// 出力: native/ios-splash/splash.html
// ポーズ・文言の正は ArcoBootSplash.tsx (BOOT_POSE_IDS / BOOT_MESSAGES)。
// 変更したら再実行して Mac 側で再同梱する。
//
// 抽選仕様 (2026-08-16 Tetsuo指定): 全ポーズ・全文言を同梱し、表示のたびにJSでランダムに1つ選ぶ。
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ArcoChan, POSES } from "../app/components/ArcoChan"
import { BOOT_MESSAGES, BOOT_POSE_IDS } from "../app/components/ArcoBootSplash"

const poseSvgs = BOOT_POSE_IDS.map((id) => {
  const pose = (POSES as { id: string }[]).find((p) => p.id === id)
  if (!pose) throw new Error(`pose ${id} not found`)
  return renderToStaticMarkup(React.createElement(ArcoChan as React.FC<{ pose: unknown }>, { pose }))
})

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
  html, body { margin: 0; height: 100%; background: #16294f; overflow: hidden; }
  .boot {
    position: fixed; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  }
  .abStage { position: relative; width: 172px; height: 172px; }
  .abArco { width: 100%; height: 100%; }
  .abArco .poseOpt { display: none; width: 100%; height: 100%; }
  .abNotes { position: absolute; left: 2px; top: 26px; }
  .abNotes span {
    position: absolute; left: 0; top: 0; font-size: 22px; color: #e7edfb; opacity: 0;
    font-family: -apple-system, "Hiragino Sans", sans-serif;
    animation: abNoteUp 2.4s linear infinite;
  }
  .abNotes span:nth-child(2) { left: 18px; top: 10px; font-size: 17px; color: #8fa3cf; animation-delay: .8s; }
  .abNotes span:nth-child(3) { left: -12px; top: 16px; font-size: 15px; animation-delay: 1.6s; }
  @keyframes abNoteUp {
    0%   { opacity: 0; transform: translate(0, 0); }
    12%  { opacity: 1; }
    70%  { opacity: 1; }
    100% { opacity: 0; transform: translate(-12px, -54px); }
  }
  .abLogo { font-size: 21px; font-weight: 900; letter-spacing: .14em; color: #e7edfb; font-family: -apple-system, "Hiragino Sans", sans-serif; }
  .abTag {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 700; color: #c6d2ea; letter-spacing: .08em;
    font-family: -apple-system, "Hiragino Sans", sans-serif;
  }
  .abDots { display: inline-flex; gap: 5px; }
  .abDots i {
    width: 6px; height: 6px; border-radius: 50%; background: #8fa3cf;
    animation: abDot 1.2s ease-in-out infinite;
  }
  .abDots i:nth-child(2) { animation-delay: .15s; }
  .abDots i:nth-child(3) { animation-delay: .3s; }
  @keyframes abDot {
    0%, 100% { opacity: .35; transform: translateY(0); }
    50%      { opacity: 1;   transform: translateY(-4px); }
  }
  @media (prefers-reduced-motion: reduce) { .abNotes span, .abDots i { animation: none; opacity: .8; } }
</style>
</head>
<body>
  <div class="boot" aria-hidden="true">
    <div class="abStage">
      <div class="abArco">
${poseSvgs.map((svg) => `        <div class="poseOpt">${svg}</div>`).join("\n")}
      </div>
      <div class="abNotes"><span>♪</span><span>♫</span><span>♪</span></div>
    </div>
    <div class="abLogo">Arcoda</div>
    <div class="abTag"><span id="bootMsg"></span><span class="abDots"><i></i><i></i><i></i></span></div>
  </div>
  <script>
    (function () {
      var poses = document.querySelectorAll(".poseOpt");
      poses[Math.floor(Math.random() * poses.length)].style.display = "block";
      var msgs = ${JSON.stringify([...BOOT_MESSAGES])};
      document.getElementById("bootMsg").textContent = msgs[Math.floor(Math.random() * msgs.length)];
    })();
  </script>
</body>
</html>
`

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "native", "ios-splash")
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, "splash.html")
writeFileSync(outPath, html, "utf8")
console.log(`generated: ${outPath} (${html.length} bytes, poses=${poseSvgs.length}, messages=${BOOT_MESSAGES.length})`)
