// LPビジュアルモックv3生成 (2026-08-16・承認までの一時スクリプト)。
// 絵文字全廃 → 実物ArcoChan SVG + ラインアイコンで構成 (Tetsuo指定)。
// 実行: npx tsx scripts/gen-lp-mock.tsx <出力パス>
import { writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ArcoChan, POSES } from "../app/components/ArcoChan"

// v5: Tetsuo生成のAI画像7枚 (紺×金の共通スタイル) を組み込む
const IMG_DIR = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/d5799227-b10f-4b5e-b215-b4cfcee76df3/scratchpad/lpimg"
const img = (n: string) => `data:image/jpeg;base64,${readFileSync(join(IMG_DIR, n)).toString("base64")}`
const IMG_HERO = img("mat10.jpg")  // 光を浴びて立つバイオリン・左に広い余白 (v5.2差し替え)
const IMG_NIGHT = img("img7.jpg")  // 夜のひとり練習 (縦)
const IMG_STAGE = img("mat27.jpg") // お辞儀と満場の喝采 (v5.3差し替え)
const IMG_ATELIER = img("img1.jpg") // 工房の静物
const IMG_CTA = img("mat7.jpg")    // 駒から立ちのぼる光 (v5.1差し替え)
const IMG_SOUND = img("mat8.jpg")  // 弦の上の光点 = 1音ずつの可視化 (v5.1差し替え)
const IMG_CHILD = img("scene_child.jpg")   // v8: 子どもの練習シーン
const IMG_ADULT = img("scene_adult.jpg")   // v8: 大人の練習シーン
const UI_SCORE = img("ui-score-w.jpg")     // v8: 採点結果UI
const UI_GROWTH = img("ui-growth-w.jpg")   // v8: 上達のようすUI
const UI_PRACTICE = img("ui-practice-w.jpg") // v8: 今日の練習UI
const IMG_FHOLE = img("mat4.jpg")  // f字孔クローズアップ (v5.1: 区切り帯)

const pose = (id: string) => (POSES as { id: string }[]).find((p) => p.id === id)
const arcoPlay = renderToStaticMarkup(React.createElement(ArcoChan as React.FC<{ pose: unknown }>, { pose: pose("03B") })) // 弓を振る
const arcoCalm = renderToStaticMarkup(React.createElement(ArcoChan as React.FC<{ pose: unknown }>, { pose: pose("05A") })) // 構えて呼吸

// ラインアイコン (stroke=currentColor)
const ic = {
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.2" r="3.6"/><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"/></svg>',
}

const html = `<title>Arcoda LP モック</title>
<style>
  *{ box-sizing:border-box; }
  body{ margin:0; background:#0b1228; color:#0f1b38; font-family:"Hiragino Sans","Yu Gothic UI",Meiryo,sans-serif; line-height:1.7; -webkit-font-smoothing:antialiased; }
  .wrap{ max-width:760px; margin:0 auto; overflow:hidden; }
  section{ padding:100px 28px; }
  .inner{ max-width:560px; margin:0 auto; }
  .eyebrow{ display:inline-flex; align-items:center; gap:10px; font-size:11px; font-weight:700; letter-spacing:.3em; color:#b8934a; margin-bottom:22px; }
  .eyebrow::before{ content:""; width:30px; height:1px; background:linear-gradient(90deg,#b8934a,#e0c07a); }
  /* v4: 見出しはセリフ体 (Carnegie Hall/Steinwayの2書体戦略。伝統=明朝 × 現代UI=ゴシック) */
  h2{ font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif; font-size:clamp(25px,5.8vw,33px); font-weight:600; line-height:1.6; letter-spacing:.05em; margin:0 0 18px; color:#0f1b38; text-wrap:balance; }
  .sub{ font-size:14.5px; color:#5b6b8c; margin:0; }

  .field{ display:flex; gap:10px; }
  .field input{ flex:1; min-width:0; border-radius:12px; border:1px solid rgba(120,140,190,.35); padding:15px 16px; font-size:14px; background:rgba(255,255,255,.94); color:#0f1b38; outline:none; }
  .field input:focus{ border-color:#7a9be8; box-shadow:0 0 0 3px rgba(122,155,232,.25); }
  .btnGold{ border:none; border-radius:12px; padding:15px 22px; font-size:13.5px; font-weight:800; cursor:pointer; white-space:nowrap; letter-spacing:.08em;
    background:linear-gradient(135deg,#f0c25c,#d9a93c 55%,#c99427); color:#1c2a4a;
    box-shadow:0 8px 22px rgba(217,169,60,.35), inset 0 1px 0 rgba(255,255,255,.45); }
  .btnGold:hover{ filter:brightness(1.05); }
  .formNote{ font-size:11.5px; margin-top:10px; letter-spacing:.02em; }

  /* ========= 1 ヒーロー ========= */
  /* v5: ヒーロー背景 = 光を浴びるバイオリンの実画像 (左に文字の余白がある構図) */
  .hero{ position:relative; color:#eef2fc; padding:60px 28px 100px;
    background:
      linear-gradient(92deg, rgba(11,18,40,.82) 0%, rgba(11,18,40,.45) 45%, rgba(11,18,40,.18) 100%),
      url(${IMG_HERO}) center right / cover no-repeat,
      #0b1228; }
  .nav{ display:flex; justify-content:space-between; align-items:center; margin-bottom:70px; }
  .brand{ display:inline-flex; align-items:baseline; gap:2px; font-size:16px; font-weight:900; letter-spacing:.22em; }
  .brand i{ font-style:normal; color:#d9a93c; }
  .navBadge{ font-size:11px; font-weight:800; letter-spacing:.1em; color:#f0c25c; border:1px solid rgba(217,169,60,.5); background:rgba(217,169,60,.07); border-radius:999px; padding:6px 15px; }
  .hero h1{ font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif; font-size:clamp(33px,8vw,46px); font-weight:600; line-height:1.5; letter-spacing:.05em; margin:0 0 16px; text-wrap:balance; }
  .hero h1 em{ font-style:normal; background:linear-gradient(92deg,#8fb0f5,#d9a93c); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .heroReassure{ font-size:13px; font-weight:800; color:#d9a93c; letter-spacing:.14em; margin:0 0 10px; }
  .hero .lead{ font-size:15px; color:#9fb0d6; margin:0; max-width:420px; }
  .heroGrid{ display:flex; gap:18px; align-items:flex-end; }
  .heroLeft{ flex:1; min-width:0; }
  .heroArco{ width:150px; flex:none; margin-bottom:-26px; filter:drop-shadow(0 16px 30px rgba(4,10,28,.55)); }

  .phone{ flex:none; width:190px; border-radius:32px; padding:9px; background:linear-gradient(160deg,#3a4a72,#141d38);
    box-shadow:0 34px 70px rgba(4,10,28,.6), 0 6px 18px rgba(4,10,28,.4), inset 0 1px 0 rgba(255,255,255,.14);
    transform:rotate(4deg); animation:float 5.5s ease-in-out infinite; }
  @keyframes float{ 0%,100%{ transform:rotate(4deg) translateY(0) } 50%{ transform:rotate(4deg) translateY(-10px) } }
  .screenApp{ border-radius:24px; overflow:hidden; background:#f6f8fc; }
  .appBar{ background:#16294f; color:#e7edfb; font-size:9px; font-weight:900; padding:10px 12px 8px; letter-spacing:.22em; }
  .appBody{ padding:12px 12px 14px; }
  .appScore{ background:#fff; border-radius:14px; padding:12px; box-shadow:0 3px 10px rgba(22,41,79,.08); }
  .appScore .n{ display:flex; align-items:baseline; gap:3px; justify-content:center; }
  .appScore .n b{ font-size:30px; font-weight:900; color:#0f1b38; font-variant-numeric:tabular-nums; }
  .appScore .n span{ font-size:10px; color:#5b6b8c; font-weight:700; }
  .appScore .rk{ background:linear-gradient(120deg,#E7B24A,#C98A1F); color:#fff; font-weight:900; font-size:10px; border-radius:6px; padding:1px 7px; margin-left:6px; align-self:center; }
  .abar{ display:flex; align-items:center; gap:6px; font-size:8.5px; font-weight:800; color:#5b6b8c; margin-top:8px; }
  .abar .t{ flex:1; height:6px; border-radius:4px; background:#e9edf5; overflow:hidden; }
  .abar .t i{ display:block; height:100%; border-radius:4px; }
  .appAdvice{ margin-top:10px; display:flex; align-items:center; justify-content:center; gap:5px; background:#eef8f1; color:#1e6b42; border-radius:9px; padding:7px 9px; font-size:8.5px; font-weight:800; }
  .appAdvice::before{ content:""; width:6px; height:6px; border-radius:50%; background:#2e8b57; flex:none; }
  .appGraph{ margin-top:10px; background:#fff; border-radius:14px; padding:10px 12px; box-shadow:0 3px 10px rgba(22,41,79,.08); }
  .appGraph .cap{ font-size:8.5px; font-weight:800; color:#5b6b8c; margin-bottom:4px; }

  .notes span{ position:absolute; color:rgba(190,208,246,.32); animation:drift 7s ease-in-out infinite; font-size:20px; }
  .notes span:nth-child(1){ top:130px; right:36px; }
  .notes span:nth-child(2){ top:220px; right:120px; font-size:14px; animation-delay:1.6s; color:rgba(217,169,60,.45); }
  .notes span:nth-child(3){ top:340px; right:28px; font-size:16px; animation-delay:3.2s; }
  @keyframes drift{ 0%,100%{ transform:translateY(0) rotate(-6deg); opacity:.5 } 50%{ transform:translateY(-16px) rotate(8deg); opacity:1 } }

  .heroForm{ margin-top:48px; background:rgba(16,28,61,.6); border:1px solid rgba(122,155,232,.28); border-radius:20px; padding:19px;
    -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); box-shadow:0 18px 44px rgba(4,10,28,.45); }
  .heroForm .t{ font-size:13px; font-weight:900; margin-bottom:11px; color:#eef2fc; letter-spacing:.02em; }
  .hero .formNote{ color:#7f92bd; }
  /* v4: 不安除去の3点帯 (Splice型) */
  .trustRow{ display:flex; align-items:center; justify-content:center; gap:10px; margin-top:11px; font-size:11px; font-weight:700; color:#7f92bd; letter-spacing:.04em; }
  .trustRow i{ width:3px; height:3px; border-radius:50%; background:#4d5f8c; }

  /* ========= 2 悩み ========= */
  .pain{ background:#f7f9fd; }
  .chat{ display:flex; gap:12px; margin-bottom:16px; align-items:flex-end; }
  .chat.r{ flex-direction:row-reverse; }
  .avatar{ flex:none; width:36px; height:36px; border-radius:50%; display:grid; place-items:center; color:#8b9cc4;
    background:#fff; border:1px solid #d5ddef; }
  .avatar svg{ width:17px; height:17px; }
  .balloon{ background:#fff; border-radius:16px; border:1px solid #e6ebf5; padding:13px 17px; font-size:13.5px; color:#37476b; font-weight:600;
    box-shadow:0 6px 18px rgba(22,41,79,.07); max-width:82%; }
  .chat .balloon{ border-bottom-left-radius:5px; }
  .chat.r .balloon{ border-bottom-right-radius:5px; }
  .painImg{ display:block; width:min(100%,340px); margin:32px auto 0; background:#fff; padding:10px; border:1px solid rgba(184,147,74,.5); border-radius:8px; box-shadow:0 18px 44px rgba(22,41,79,.18); box-sizing:border-box; }
  .painClose{ margin-top:36px; text-align:center; font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif; font-size:clamp(18px,4.6vw,22px); font-weight:600; letter-spacing:.05em; color:#0f1b38; }
  .painClose b{ background:linear-gradient(92deg,#2b5bc4,#7a9be8); -webkit-background-clip:text; background-clip:text; color:transparent; }

  /* ========= 3 解決 ========= */
  .solve{ background:#fff; }
  .solveCard{ position:relative; margin-top:36px; border-radius:26px; padding:28px 24px;
    background:linear-gradient(160deg,#f8faff,#eef3fc); box-shadow:0 24px 60px rgba(22,41,79,.12); }
  .solveCard::before{ content:""; position:absolute; inset:-1px; border-radius:27px; padding:1px;
    background:linear-gradient(140deg,rgba(122,155,232,.65),rgba(217,169,60,.4),transparent 70%);
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; }
  .solveCard .n{ display:flex; align-items:baseline; gap:5px; justify-content:center; }
  .solveCard .n b{ font-size:56px; font-weight:900; letter-spacing:-.02em; font-variant-numeric:tabular-nums;
    background:linear-gradient(160deg,#16294f,#2b5bc4); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .solveCard .n span{ font-size:14px; color:#5b6b8c; font-weight:700; }
  .solveCard .rk{ background:linear-gradient(120deg,#E7B24A,#C98A1F); color:#fff; font-weight:900; font-size:15px; border-radius:9px; padding:3px 12px; margin-left:8px; align-self:center; box-shadow:0 6px 14px rgba(201,138,31,.35); }
  .sbar{ display:flex; align-items:center; gap:10px; font-size:12px; font-weight:800; color:#5b6b8c; margin-top:14px; }
  .sbar .t{ flex:1; height:9px; border-radius:6px; background:#e4e9f4; overflow:hidden; }
  .sbar .t i{ display:block; height:100%; border-radius:6px; }
  .sbar b{ width:24px; text-align:right; font-variant-numeric:tabular-nums; color:#0f1b38; }
  .solveCard .adv{ margin-top:14px; display:flex; align-items:center; justify-content:center; gap:7px; background:#eef8f1; color:#1e6b42; border-radius:12px; padding:11px 14px; font-size:12.5px; font-weight:800; }
  .solveCard .adv::before{ content:""; width:7px; height:7px; border-radius:50%; background:#2e8b57; flex:none; }
  /* v4: 1音ずつ色づく解析ビジュアル (iZotope型: 解析の見た目自体が精度の証明) */
  .noteStrip{ margin-top:16px; border-radius:14px; padding:12px 14px 10px;
    background: linear-gradient(rgba(10,16,35,.72), rgba(10,16,35,.72)), url(${IMG_SOUND}) center / cover no-repeat, #0f1b38; }
  .noteStrip .cap{ font-size:11px; font-weight:800; color:#9fb0d6; letter-spacing:.06em; margin-bottom:6px; }
  .noteStrip .legend{ display:flex; align-items:center; gap:5px; font-size:10px; font-weight:700; color:#7f92bd; margin-top:5px; }
  .noteStrip .legend span{ width:8px; height:8px; border-radius:3px; display:inline-block; }
  .noteStrip .legend .g{ background:#2e8b57; }
  .noteStrip .legend .o{ background:#e0872b; }

  /* ========= 4 機能 ========= */
  .feats{ background:#f7f9fd; }
  .featList{ display:flex; flex-direction:column; gap:16px; margin-top:26px; }
  .feat{ background:#fff; border-radius:22px; padding:24px; display:flex; gap:18px; align-items:flex-start; box-shadow:0 10px 30px rgba(22,41,79,.07); }
  .feat .ic{ flex:none; width:50px; height:50px; border-radius:16px; display:grid; place-items:center; color:#fff;
    background:linear-gradient(150deg,#2b5bc4,#16294f); box-shadow:0 8px 18px rgba(43,91,196,.35); }
  .feat .ic svg{ width:23px; height:23px; }
  .feat h3{ font-size:16px; margin:0 0 6px; color:#0f1b38; font-weight:900; }
  .feat p{ font-size:13px; color:#5b6b8c; margin:0; }

  /* v8: UI画面ショーケース (実UIで信憑性を担保・iZotope型) */
  .uiShow{ display:flex; gap:14px; margin-top:34px; overflow-x:auto; padding-bottom:6px; scroll-snap-type:x mandatory; }
  .uiShow figure{ margin:0; flex:none; width:186px; scroll-snap-align:center; }
  .uiShow img{ display:block; width:100%; border-radius:18px; box-shadow:0 18px 44px rgba(22,41,79,.18); border:1px solid rgba(184,147,74,.35); }
  .uiShow figcaption{ margin-top:10px; text-align:center; font-size:11.5px; font-weight:700; letter-spacing:.1em; color:#8b97b3; }
  .laneImg{ display:block; width:100%; height:132px; object-fit:cover; object-position:center 30%; border-radius:14px; margin-bottom:16px; }

  /* ========= 5 2レーン ========= */
  .lanes{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:26px; }
  @media (max-width:560px){ .lanes{ grid-template-columns:1fr; } }
  .lane{ border-radius:22px; padding:26px 22px; }
  .lane.parent{ background:linear-gradient(165deg,#1a2c55,#101c3d); color:#e7edfb; box-shadow:0 18px 44px rgba(11,18,40,.35); }
  .lane.adult{ background:#fff; color:#0f1b38; box-shadow:0 10px 30px rgba(22,41,79,.09); }
  .lane .tag{ display:inline-block; font-size:10.5px; font-weight:900; letter-spacing:.18em; border-radius:999px; padding:5px 14px; margin-bottom:14px; }
  .lane.parent .tag{ color:#f0c25c; border:1px solid rgba(217,169,60,.5); }
  .lane.adult .tag{ color:#2b5bc4; background:#e9effb; }
  .lane h3{ font-size:16.5px; margin:0 0 12px; font-weight:900; line-height:1.5; }
  .lane ul{ margin:0; padding:0; list-style:none; font-size:13px; line-height:2.15; }
  .lane.parent ul{ color:#b9c6e4; }
  .lane.adult ul{ color:#5b6b8c; }
  .lane li{ display:flex; align-items:baseline; gap:9px; }
  .lane li::before{ content:""; flex:none; width:5px; height:5px; border-radius:50%; transform:translateY(-2px); }
  .lane.parent li::before{ background:#d9a93c; }
  .lane.adult li::before{ background:#2b5bc4; }

  /* ========= 6 3ステップ ========= */
  .stepRow{ display:flex; margin-top:34px; position:relative; }
  .stepRow::before{ content:""; position:absolute; top:25px; left:17%; right:17%; height:1.5px;
    background:linear-gradient(90deg,#c9d6f0,#7a9be8,#c9d6f0); }
  .step{ flex:1; text-align:center; position:relative; }
  .step .n{ width:50px; height:50px; margin:0 auto 13px; border-radius:50%; display:grid; place-items:center;
    background:#fff; box-shadow:0 8px 22px rgba(22,41,79,.13); position:relative; z-index:1;
    font-size:15px; font-weight:900; color:#2b5bc4; font-variant-numeric:tabular-nums; letter-spacing:.04em; }
  .step p{ font-size:13.5px; font-weight:900; color:#0f1b38; margin:0; }
  .step small{ font-size:11px; color:#8b97b3; font-weight:600; }
  /* v5: アルコは明るいセクションに1箇所だけ (絵画セクションとの世界観衝突を避ける) */
  .stepsArco{ width:130px; height:124px; margin:34px auto 4px; }
  .stepsArco svg{ display:block; width:100%; height:100%; }
  .stepsArcoCap{ text-align:center; font-size:12px; font-weight:800; color:#5b6b8c; }

  /* v5.1: f字孔の金の区切り帯 (Steinway文法の質感リズム) */
  .divider{ height:190px; border-top:1px solid rgba(184,147,74,.4); border-bottom:1px solid rgba(184,147,74,.4); background: url(${IMG_FHOLE}) center 42% / cover no-repeat, #0b1228; }

  /* ========= v5: THE STAGE (出口提示型・ホールの喝采) ========= */
  .stage{ position:relative; color:#f3ecdd; text-align:center; padding:130px 28px;
    background:
      linear-gradient(rgba(9,12,26,.5), rgba(9,12,26,.62)),
      url(${IMG_STAGE}) center 30% / cover no-repeat, #0b1228; }
  .stage .stageEyebrow{ font-size:11.5px; font-weight:800; letter-spacing:.3em; color:#f0c25c; margin-bottom:18px; }
  .stage .stageH{ color:#fdf7ea; text-shadow:0 2px 24px rgba(0,0,0,.55); }
  .stage .stageSub{ font-size:14px; color:#e4d9c2; margin:0; text-shadow:0 1px 12px rgba(0,0,0,.6); }

  /* ========= 7 想い ========= */
  .voice{ background:#f7f9fd; }
  .storyImg{ display:block; width:100%; background:#fff; padding:10px 10px 0; border:1px solid rgba(184,147,74,.5); border-bottom:none; border-radius:8px 8px 0 0; box-sizing:border-box; }
  /* v4: 金の罫線 (Steinway文法: 黒×金×セリフ) */
  .quote{ position:relative; background:#fff; border:1px solid rgba(184,147,74,.5); border-top:1px solid rgba(184,147,74,.35); border-radius:0 0 8px 8px; padding:34px 28px 26px; box-shadow:0 10px 30px rgba(22,41,79,.07); }
  .quote::before{ content:"\\201C"; position:absolute; top:-4px; left:18px; font-size:86px; line-height:1;
    font-family:Georgia,serif; background:linear-gradient(160deg,#7a9be8,#2b5bc4); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .quote p{ font-size:14px; color:#37476b; line-height:2.1; margin:0; font-family:"Hiragino Mincho ProN","Yu Mincho",serif; }
  .quote .who{ margin-top:16px; font-size:11.5px; color:#8b97b3; font-weight:700; letter-spacing:.08em; }

  /* ========= 8 CTA ========= */
  /* v5: CTA背景 = 渦巻きと光の実画像 */
  .cta{ position:relative; color:#eef2fc; text-align:center; padding:110px 28px;
    background:
      linear-gradient(rgba(9,14,32,.42), rgba(9,14,32,.6)),
      url(${IMG_CTA}) center / cover no-repeat, #0b1228; }
  .cta h2{ color:#eef2fc; font-size:clamp(24px,6vw,32px); }
  .cta .sub{ color:#9fb0d6; margin-bottom:36px; }
  .ctaArco{ width:120px; margin:0 auto 6px; filter:drop-shadow(0 12px 26px rgba(217,169,60,.28)); }
  .cta .formNote{ color:#7f92bd; }

  footer{ background:#0b1228; color:#5f6f96; font-size:11px; text-align:center; padding:30px 20px 44px; letter-spacing:.08em; border-top:1px solid rgba(184,147,74,.28); }
  footer a{ color:#8b9cc4; }

  /* ============ 動的演出 v7 (別AI版v2から採用・紺×金の範囲内) ============ */
  html{ scroll-behavior:smooth; }
  body::after{ content:""; position:fixed; inset:0; z-index:60; pointer-events:none; opacity:.045; mix-blend-mode:overlay;
    background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="240" height="240" filter="url(%23n)"/></svg>'); }
  .hero h1 em{ background-size:220% auto; animation:sheen 7s linear infinite; }
  @keyframes sheen{ to{ background-position:220% 0; } }
  .btnGold{ position:relative; overflow:hidden; }
  .btnGold::after{ content:""; position:absolute; top:-10%; bottom:-10%; left:-65%; width:45%;
    background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent); transform:skewX(-18deg); }
  .btnGold:hover::after{ animation:sweep .85s ease; }
  @keyframes sweep{ to{ left:135%; } }
  .abar .t i, .sbar .t i{ transform:scaleX(0); transform-origin:left; transition:transform 1.3s cubic-bezier(.2,.7,.2,1) .35s; }
  .solveCard.is-in .sbar .t i{ transform:scaleX(1); }
  .noteStrip{ position:relative; overflow:hidden; }
  .noteStrip::after{ content:""; position:absolute; top:8px; bottom:8px; left:-3%; width:2px; border-radius:2px;
    background:linear-gradient(rgba(240,194,92,0),#F0C25C 30%,#F0C25C 70%,rgba(240,194,92,0));
    box-shadow:0 0 14px rgba(240,194,92,.85); animation:scan 3.8s linear infinite; }
  @keyframes scan{ to{ left:103%; } }
  /* 解決カード: 金のグローが呼吸する (スマホモックはv5で撤去のためこちらに移設) */
  .solveCard{ animation:glowPulse 6s ease-in-out infinite; }
  @keyframes glowPulse{
    0%,100%{ box-shadow:0 24px 60px rgba(22,41,79,.12); }
    50%{ box-shadow:0 24px 60px rgba(22,41,79,.12), 0 0 44px rgba(217,169,60,.16); } }
  .scrollCue{ position:absolute; bottom:22px; left:50%; transform:translateX(-50%); z-index:3; display:flex; flex-direction:column; align-items:center; gap:9px; color:#93A5CE; font-size:9px; font-weight:700; letter-spacing:.42em; }
  .scrollCue::after{ content:""; width:1px; height:36px; background:linear-gradient(#D9A93C,transparent); transform-origin:top; animation:cue 2s ease-in-out infinite; }
  @keyframes cue{ 0%{ transform:scaleY(0); opacity:1 } 60%{ transform:scaleY(1); opacity:1 } 100%{ transform:scaleY(1); opacity:0 } }
  [data-reveal]{ opacity:0; transform:translateY(18px); transition:opacity .7s ease, transform .7s ease; }
  [data-reveal].is-in{ opacity:1; transform:none; }
  .chat[data-reveal]{ transition-timing-function:cubic-bezier(.3,1.35,.45,1); }
  .stepRow::before{ transform:scaleX(0); transform-origin:left; transition:transform 1.1s ease .25s; }
  .stepRow.is-in::before{ transform:scaleX(1); }
  @keyframes popIn{ 0%{ transform:scale(.55); opacity:0 } 100%{ transform:scale(1); opacity:1 } }
  .stepRow.is-in .step .n{ animation:popIn .55s cubic-bezier(.34,1.56,.64,1) backwards; }
  .stepRow.is-in .step:nth-child(1) .n{ animation-delay:.4s }
  .stepRow.is-in .step:nth-child(2) .n{ animation-delay:.62s }
  .stepRow.is-in .step:nth-child(3) .n{ animation-delay:.84s }
  .feat .ic{ transition:transform .35s cubic-bezier(.34,1.56,.64,1); }
  .feat:hover .ic{ transform:rotate(-6deg) scale(1.07); }
  .lane.parent:hover{ box-shadow:0 22px 52px rgba(11,18,40,.42), 0 0 40px rgba(217,169,60,.13); }
  @media (prefers-reduced-motion: reduce){
    [data-reveal]{ opacity:1 !important; transform:none !important; }
    .abar .t i, .sbar .t i{ transform:scaleX(1) !important; }
    .stepRow::before{ transform:scaleX(1) !important; }
  }
  @media (prefers-reduced-motion: reduce){ *{ animation:none !important } }
</style>

<div class="wrap">

  <div class="hero">
    <div class="notes" aria-hidden><span>♪</span><span>♫</span><span>♪</span></div>
    <div class="inner">
      <div class="nav">
        <div class="brand">ARC<i>O</i>DA</div>
        <div class="navBadge">近日リリース</div>
      </div>
      <div class="heroGrid">
        <div class="heroLeft">
          <div class="heroReassure">何歳からでも、どこからでも。</div>
          <h1>バイオリンの練習が、<br><em>毎日たのしくなる。</em></h1>
          <p class="lead">録音するだけでAIが採点。伸びが見えるから、自分から練習したくなる。</p>
        </div>
      </div>
      <div class="scrollCue" aria-hidden="true">SCROLL</div>
      <div class="heroForm">
        <div class="t">リリース時に、いちばんにお知らせします</div>
        <div class="field"><input placeholder="メールアドレス"><button class="btnGold">通知を受け取る</button></div>
        <div class="trustRow"><span>登録は無料</span><i></i><span>ご案内は1通だけ</span><i></i><span>いつでも解除</span></div>
      </div>
    </div>
  </div>

  <section class="pain">
    <div class="inner">
      <div class="eyebrow">PROBLEM</div>
      <h2>こんな毎日、ありませんか。</h2>
      <div style="height:24px"></div>
      <div class="chat" data-reveal><div class="avatar">${ic.user}</div><div class="balloon">「練習しなさい」って言うのに、もう疲れた…</div></div>
      <div class="chat r" data-reveal><div class="avatar">${ic.user}</div><div class="balloon">一人で練習してても、何を直せばいいのかわからない</div></div>
      <div class="chat" data-reveal><div class="avatar">${ic.user}</div><div class="balloon">レッスンで直ったのに、次の週にはもとに戻ってる</div></div>
      <div class="chat r" data-reveal><div class="avatar">${ic.user}</div><div class="balloon">がんばってるのに、上手くなってる実感がない</div></div>
      <img class="painImg" data-reveal src="${IMG_NIGHT}" alt="夜、ひとりでバイオリンを練習する人">
      <div class="painClose">その1週間のひとり練習を、<b>Arcodaが変えます。</b></div>
    </div>
  </section>

  <section class="solve">
    <div class="inner">
      <div class="eyebrow">SOLUTION</div>
      <h2>録音するだけ。<br>AIが採点して、<br>今日の練習メニューまで。</h2>
      <p class="sub">音程・リズムを1音ずつ解析。どこが良くて、どこを直すべきかが、演奏のたびにわかります。</p>
      <div class="solveCard" data-reveal>
        <div class="n"><b data-count="93">0</b><span>点</span><span class="rk">S</span></div>
        <div class="sbar"><span style="width:40px;">音程</span><span class="t"><i style="width:91%;background:linear-gradient(90deg,#f0a95c,#e0872b);"></i></span><b>91</b></div>
        <div class="sbar"><span style="width:40px;">リズム</span><span class="t"><i style="width:95%;background:linear-gradient(90deg,#57c08a,#2e8b57);"></i></span><b>95</b></div>
        <div class="noteStrip">
          <div class="cap">1音ずつ、良し悪しが見える</div>
          <svg width="100%" height="52" viewBox="0 0 300 52" preserveAspectRatio="none" aria-hidden="true">
            ${Array.from({ length: 28 }, (_, i) => {
              const off = [5, 11, 19, 24].includes(i)
              const h = 14 + Math.abs(((i * 37) % 23) - 11) * 2.4
              const y = 46 - h
              return `<rect x="${4 + i * 10.5}" y="${y.toFixed(1)}" width="6.5" height="${h.toFixed(1)}" rx="3" fill="${off ? "#e0872b" : "#2e8b57"}" opacity="${off ? "1" : "0.88"}"/>`
            }).join("")}
          </svg>
          <div class="legend"><span class="g"></span>いい音<span class="o" style="margin-left:12px;"></span>おしい音</div>
        </div>
        <div class="adv">今日はA線の音、よく取れてたね</div>
      </div>
    </div>
  </section>

  <section class="feats">
    <div class="inner">
      <div class="eyebrow">FEATURES</div>
      <h2>迷わず続くための、<br>3つの仕組み。</h2>
      <div class="featList">
        <div class="feat" data-reveal><div class="ic">${ic.target}</div><div><h3>AI採点</h3><p>録音した演奏を音程・リズムの両面から1音ずつ解析。100点満点とランクで、今日の出来がすぐわかる。</p></div></div>
        <div class="feat" data-reveal><div class="ic">${ic.chart}</div><div><h3>成長が見えるカルテ</h3><p>演奏はぜんぶ記録され、上達がグラフになる。「先週の自分」と比べられるから、続けたくなる。</p></div></div>
        <div class="feat" data-reveal><div class="ic">${ic.compass}</div><div><h3>きみ専用の基礎練メニュー</h3><p>苦手な音・ポジション・弓の技をAIが見つけて、今日やるべき基礎練を毎日組んでくれる。</p></div></div>
      </div>
      <div class="uiShow">
        <figure><img src="${UI_SCORE}" alt="採点結果の画面"><figcaption>採点結果</figcaption></figure>
        <figure><img src="${UI_GROWTH}" alt="上達のようすの画面"><figcaption>上達のようす</figcaption></figure>
        <figure><img src="${UI_PRACTICE}" alt="今日の練習の画面"><figcaption>今日の練習</figcaption></figure>
      </div>
    </div>
  </section>

  <div class="divider" role="presentation"></div>

  <section style="background:#fff;">
    <div class="inner">
      <div class="eyebrow">FOR YOU</div>
      <h2>あなたには、<br>こう役立ちます。</h2>
      <div class="lanes">
        <div class="lane parent" data-reveal>
          <img class="laneImg" src="${IMG_CHILD}" alt="スマホに向かって練習する子ども">
          <span class="tag">FOR PARENTS</span>
          <h3>お子さんの<br>保護者の方へ</h3>
          <ul>
            <li>親は「見守るだけ」でいい</li>
            <li>練習内容はアプリが提示</li>
            <li>先生の代わりではなく、先生とつながる</li>
            <li>子どもが安全に使える設計</li>
          </ul>
        </div>
        <div class="lane adult" data-reveal>
          <img class="laneImg" src="${IMG_ADULT}" alt="夜に練習する大人">
          <span class="tag">FOR LEARNERS</span>
          <h3>大人の<br>学習者の方へ</h3>
          <ul>
            <li>独学でも方向が定まる</li>
            <li>データで弱点が見える</li>
            <li>自分のペースで積み上がる</li>
            <li>1日1回の録音から</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="stage">
    <div class="inner">
      <div class="stageEyebrow">THE STAGE</div>
      <h2 class="stageH">つぎの発表会が、<br>いちばんの演奏になる。</h2>
      <p class="stageSub">本番までの毎日を、記録と採点で積み上げる。舞台に立つ日の自信は、日々の練習から。</p>
    </div>
  </section>

  <section class="pain">
    <div class="inner">
      <div class="eyebrow">HOW IT WORKS</div>
      <h2>やることは、これだけ。</h2>
      <div class="stepRow" data-reveal>
        <div class="step"><div class="n">01</div><p>弾いて録音</p><small>いつもの練習のまま</small></div>
        <div class="step"><div class="n">02</div><p>AIが採点</p><small>数分で結果が届く</small></div>
        <div class="step"><div class="n">03</div><p>伸びていく</p><small>記録が力になる</small></div>
      </div>
      <div class="stepsArco" aria-hidden>${arcoPlay}</div>
      <div class="stepsArcoCap">相棒のアルコが、毎日いっしょに練習するよ</div>
    </div>
  </section>

  <section style="background:#fff;">
    <div class="inner">
      <div class="eyebrow">STORY</div>
      <img class="storyImg" src="${IMG_ATELIER}" alt="工房の光に置かれたバイオリン">
      <div class="quote" data-reveal>
        <p>バイオリンは、続けた人だけが上手くなる楽器です。でも「続ける」がいちばん難しい。毎日の練習に小さな手応えとよろこびを返してくれる相棒がいれば、それは変えられる——そう信じて、ひとりで開発しています。</p>
        <div class="who">— Arcoda 開発者</div>
      </div>
    </div>
  </section>

  <section class="cta">
    <div class="inner">
      <h2>リリースしたら、<br>いちばんにお知らせします。</h2>
      <p class="sub">登録は無料。リリースのご案内を1通だけお送りします。</p>
      <div class="field" style="max-width:440px;margin:0 auto;"><input placeholder="メールアドレス"><button class="btnGold">通知を受け取る</button></div>
      <div class="trustRow"><span>登録は無料</span><i></i><span>ご案内は1通だけ</span><i></i><span>いつでも解除</span></div>
    </div>
  </section>

  <footer>
    Arcoda（アルコーダ）｜運営者: ○○○○<br>
    <a href="#">プライバシーポリシー</a> ・ contact@arcodaviolin.com<br><br>
    © 2026 Arcoda
  </footer>

</div>

<script>
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold:.15 });
  document.querySelectorAll('[data-reveal], .stepRow, .solveCard').forEach(function(el){ io.observe(el); });
  document.querySelectorAll('[data-count]').forEach(function(el){
    var target = +el.dataset.count;
    if (reduce) { el.textContent = target; return; }
    var io2 = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        io2.disconnect();
        var dur = 1400, start = performance.now();
        (function step(now){
          var pr = Math.min(1, (now - start)/dur), q = 1 - Math.pow(1 - pr, 3);
          el.textContent = Math.round(target * q);
          if (pr < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold:.4 });
    io2.observe(el);
  });
  if (!reduce) {
    var hero = document.querySelector('.hero');
    addEventListener('scroll', function(){
      var y = scrollY;
      if (y < innerHeight * 1.2) hero.style.backgroundPositionY = 'calc(50% + ' + (y * .18) + 'px)';
    }, { passive:true });
  }
})();
</script>
`

const out = process.argv[2]
if (!out) throw new Error("出力パスを指定してください")
writeFileSync(out, html, "utf8")
console.log(`generated: ${out} (${html.length} bytes)`)
