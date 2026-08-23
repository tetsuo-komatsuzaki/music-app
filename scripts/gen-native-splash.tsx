// アプリ殻(iOS)同梱用スプラッシュHTMLの生成 (2026-08-23 刷新)。
// Webの待機画面 (音を調えています リング) と同一デザインを、ポスター画像込みの
// 自己完結HTML 1ファイルに書き出す。Mac側は Xcode バンドルに入れて
// WKWebView のオーバーレイで表示する (docs/native-splash-mac-instructions.md 参照)。
//
// 実行: npx tsx scripts/gen-native-splash.tsx
// 出力: native/ios-splash/splash.html
// 見た目の正は app/components/ArcoBootSplash.tsx + globals.css (#arco-boot)。
import { mkdirSync, writeFileSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const poster = readFileSync(join(root, "public", "arco", "05A.jpg")).toString("base64")

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
  html, body { margin: 0; height: 100%; background: #0a1122; overflow: hidden; }
  .boot { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: -apple-system, "Hiragino Sans", sans-serif; }
  .abRing { position: relative; width: 176px; height: 176px; border-radius: 50%;
    border: 2px solid rgba(188,161,96,.4); outline: 1px solid rgba(217,169,60,.18); outline-offset: 5px; }
  .abArc { position: absolute; inset: -2px; border-radius: 50%;
    background: conic-gradient(#d4af37 18%, transparent 0);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
    filter: drop-shadow(0 0 4px rgba(217,169,60,.4));
    animation: abSpin 1.1s linear infinite; }
  .abDisc { position: absolute; inset: 10px; border-radius: 50%; overflow: hidden; background: #faf9f6;
    animation: abBob 2.4s ease-in-out infinite; }
  .abDisc img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .abTitle { margin-top: 30px; font-size: 17px; font-weight: 800; letter-spacing: .08em; color: #fffae8; }
  .abTitle span { animation: abDotBlink .9s ease-in-out infinite; }
  .abTitle span:nth-child(2) { animation-delay: .3s; }
  .abTitle span:nth-child(3) { animation-delay: .6s; }
  .abLogo { margin-top: 26px; font-size: 12px; font-weight: 700; letter-spacing: .3em; color: #6b7488; }
  @keyframes abSpin { to { transform: rotate(360deg); } }
  @keyframes abBob { 0%, 100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-5px) rotate(1.5deg); } }
  @keyframes abDotBlink { 0%, 100% { opacity: .2; } 50% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .abArc, .abDisc, .abTitle span { animation: none; } }
</style>
</head>
<body>
  <div class="boot" aria-hidden="true">
    <div class="abRing">
      <span class="abArc"></span>
      <span class="abDisc"><img src="data:image/jpeg;base64,${poster}" alt=""></span>
    </div>
    <div class="abTitle">音を調えています<span>・</span><span>・</span><span>・</span></div>
    <div class="abLogo">Arcoda</div>
  </div>
</body>
</html>
`

const outDir = join(root, "native", "ios-splash")
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, "splash.html")
writeFileSync(outPath, html, "utf8")
console.log(`generated: ${outPath} (${html.length} bytes)`)
