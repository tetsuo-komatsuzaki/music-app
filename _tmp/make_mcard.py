# MasterCardAwardMotion を TitleAwardMotion から生成 (結晶リグ共通・金族+マスター券面)
import io
import re

s = io.open("app/[userId]/_coin/TitleAwardMotion.tsx", encoding="utf-8").read()

# 接頭辞とコンポーネント名
s = s.replace("TitleAwardMotion", "MasterCardAwardMotion").replace("TitleFace", "MasterCardFace")
s = re.sub(r"\bti([A-Z])", r"mc\1", s)
s = s.replace('"tiStage', '"mcStage').replace("ti-${phase}", "mc-${phase}")
s = s.replace(".ti-", ".mc-").replace(" ti-", " mc-")
s = s.replace('className="ti', 'className="mc')
s = s.replace(".tiStage", ".mcStage")  # 念のため

# ヘッダコメント
s = s.replace(
    """// 称号カード 授与モーション (肉付け・2026-08-31 Tetsuo承認 genspark「結晶」パターンの移植)。
// 正本: treasure-handoff/title-card-approved-crystal.html (5案中パターンA=光の結晶化)。""",
    """// マスター記念カード 授与モーション (肉付け・2026-08-31 Tetsuo承認 genspark「結晶」パターンの移植)。
// 正本: treasure-handoff/master-card-approved-crystal.html (称号と同じ結晶リグの金族)。""",
)
s = s.replace(
    """// 券面: クリーム+金縁のカード族に青の差し色 (称号=青の格式)。
// 青メダリオン紋章+★ / 金箔の★列 / ランク名 / 日付。ホロとサンバースト。""",
    """// 券面: クリーム+金縁のカード族・金の差し色 (マスター=金の成果)。
// 月桂樹リース+★ / MASTER箔 / 曲名 / 蝋封+Arco署名 / 日付。ホロとサンバースト。""",
)

# Face 型
s = s.replace(
    """export type MasterCardFace = {
  /** 新しい★ */
  star: number
  /** 新しいランク名 (rankCard.ts の rankName) */
  rankName: string
  /** 授与日 (YYYY.MM.DD) */
  date: string
}""",
    """export type MasterCardFace = {
  /** マスターした曲名 */
  song: string
  /** 授与日 (YYYY.MM.DD) */
  date: string
}""",
)
s = s.replace("""  const stars = "★".repeat(Math.min(Math.max(face.star, 1), 5))

""", "")

# 券面マークアップ差し替え (紋章/★列/ランク名 → リース/MASTER/曲名/蝋封)
s = s.replace(
    """            <div className="mcWrap">
              <div className="mcKlabel">称号カード</div>
              <i className="mcKrule" />
              <div className="mcEmblem"><i className="mcEmedal" /><span className="mcEstar">★</span></div>
              <div className="mcKstars mcFoil">{stars}</div>
              <div className="mcKrank">{face.rankName}</div>
              <div className="mcKtitle">ランクアップの称号</div>
              <div className="mcKdate">{face.date}</div>
            </div>""",
    """            <div className="mcWrap">
              <div className="mcKlabel">記念カード</div>
              <i className="mcKrule" />
              <div className="mcWreath">
                <i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" />
                <i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" /><i className="mcLeaf" />
                <span className="mcWstar mcFoil">★</span>
              </div>
              <div className="mcMword mcFoil">MASTER</div>
              <div className="mcMpiece">{face.song}</div>
              <div className="mcSealrow">
                <span className="mcSeal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/arco/05B.jpg" alt="" />
                </span>
                <span className="mcSign">Arco</span>
              </div>
              <div className="mcKdate">{face.date}</div>
            </div>""",
)

# CSS: 青→金 (正本diffのとおり)
s = s.replace("background:linear-gradient(135deg,#7a9ade,#3d5da8 60%,#25406e);\n  clip-path:polygon(0 0,100% 0,100% 16%,16% 16%,16% 100%,0 100%); }",
              "background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a);\n  clip-path:polygon(0 0,100% 0,100% 16%,16% 16%,16% 100%,0 100%); }")
s = s.replace(".mcKlabel { font-size:2.6cqw; font-weight:900; letter-spacing:.4em; text-indent:.4em; color:#3d5da8;",
              ".mcKlabel { font-size:2.6cqw; font-weight:900; letter-spacing:.4em; text-indent:.4em; color:#7a5c22;")
s = s.replace("border-top:1.4px solid rgba(61,93,168,.85); }", "border-top:1.4px solid rgba(178,134,44,.85); }")
s = s.replace("border-top:.7px solid rgba(61,93,168,.6); }", "border-top:.7px solid rgba(178,134,44,.65); }")
s = s.replace("""  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,#7a9ade,#3d5da8 60%,#25406e); }""",
              """  transform:translateX(-50%) rotate(45deg);
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a); box-shadow:0 0 5px rgba(232,178,60,.5); }""")
s = s.replace("background:radial-gradient(circle, rgba(255,252,240,.98), rgba(190,212,255,.5) 36%, transparent 66%);",
              "background:radial-gradient(circle, rgba(255,252,240,.98), rgba(255,230,160,.5) 36%, transparent 66%);")
s = s.replace("""  border:2px solid rgba(190,212,255,.95);
  box-shadow:0 0 26px rgba(90,140,255,.7), inset 0 0 22px rgba(90,140,255,.4);""",
              """  border:2px solid rgba(255,240,200,.95);
  box-shadow:0 0 26px rgba(232,178,60,.75), inset 0 0 22px rgba(232,178,60,.45);""")
s = s.replace("background:radial-gradient(circle, #eaf1ff, #5b84e0 62%, transparent);",
              "background:radial-gradient(circle, #fff6d8, #e8b23c 62%, transparent);")

# 紋章系CSSをリース/MASTER/蝋封CSSに差し替え
old_css = """.mcEmblem { position:relative; margin-top:5%; width:27cqw; height:27cqw; }"""
assert old_css in s
wreath_css = """.mcWreath { position:relative; margin-top:4.5%; width:30cqw; height:20cqw; }
.mcLeaf { position:absolute; display:block; width:4.6cqw; height:1.7cqw; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
  background:linear-gradient(135deg,#f2d48c,#c99a35 60%,#8a6a1a);
  box-shadow:0 1px 1px rgba(90,62,10,.4), inset 0 1px 0 rgba(255,244,205,.6); }
.mcWreath .mcLeaf:nth-of-type(1) { left:8%; bottom:6%; transform:rotate(52deg); }
.mcWreath .mcLeaf:nth-of-type(2) { left:6%; bottom:24%; transform:rotate(34deg); }
.mcWreath .mcLeaf:nth-of-type(3) { left:9%; bottom:44%; transform:rotate(16deg); }
.mcWreath .mcLeaf:nth-of-type(4) { left:16%; bottom:62%; transform:rotate(-2deg); }
.mcWreath .mcLeaf:nth-of-type(5) { left:26%; bottom:74%; transform:rotate(-18deg); }
.mcWreath .mcLeaf:nth-of-type(6) { right:8%; bottom:6%; transform:scaleX(-1) rotate(52deg); }
.mcWreath .mcLeaf:nth-of-type(7) { right:6%; bottom:24%; transform:scaleX(-1) rotate(34deg); }
.mcWreath .mcLeaf:nth-of-type(8) { right:9%; bottom:44%; transform:scaleX(-1) rotate(16deg); }
.mcWreath .mcLeaf:nth-of-type(9) { right:16%; bottom:62%; transform:scaleX(-1) rotate(-2deg); }
.mcWreath .mcLeaf:nth-of-type(10) { right:26%; bottom:74%; transform:scaleX(-1) rotate(-18deg); }
.mcWstar { position:absolute; left:50%; top:-4%; transform:translateX(-50%); z-index:2; font-size:7cqw;
  animation:mcWstarK 2.8s ease-in-out infinite; }
@keyframes mcWstarK { 0%,100% { filter:drop-shadow(0 0 6px rgba(232,178,60,.5)); } 50% { filter:drop-shadow(0 0 16px rgba(232,178,60,.95)); } }
.mcMword { margin-top:1%; font-size:8.8cqw; font-weight:900; letter-spacing:.18em; text-indent:.18em; }
.mcMpiece { margin-top:2.4%; font-size:5.4cqw; font-weight:900; color:#33260a; letter-spacing:.12em; text-indent:.12em;
  text-shadow:0 1px 0 rgba(255,252,240,.95), 0 -1px 1px rgba(90,70,30,.45); }
.mcSealrow { margin-top:3.2%; display:flex; align-items:center; gap:3cqw; }
.mcSeal { width:9cqw; height:9cqw; border-radius:50%; position:relative; display:grid; place-items:center;
  background:radial-gradient(circle at 36% 30%, #a83232, #7e1c1c 55%, #541010 90%);
  box-shadow:0 2px 5px rgba(60,20,10,.45), inset 0 1px 1px rgba(255,180,160,.4), inset 0 -2px 3px rgba(40,8,8,.5); }
.mcSeal img { width:76%; height:76%; border-radius:50%; object-fit:cover; filter:sepia(.3) saturate(.9);
  box-shadow:inset 0 1px 2px rgba(60,20,10,.5); }
.mcSign { font-size:3.6cqw; font-weight:700; color:#4e3a12; font-style:italic;
  font-family:"Snell Roundhand","Brush Script MT","Zen Kaku Gothic New",cursive;
  text-shadow:0 1px 0 rgba(255,252,240,.85); transform:rotate(-2.5deg); }
.mcEmblem { position:relative; margin-top:5%; width:27cqw; height:27cqw; }"""
s = s.replace(old_css, wreath_css)

io.open("app/[userId]/_coin/MasterCardAwardMotion.tsx", "w", encoding="utf-8").write(s)
print("MasterCardAwardMotion written", len(s))
