# 券面調整 (2026-08-31 Tetsuo指示):
# ①主役テキストの1行フィット ②称号/記念カードの縦を約半分 ③「ランクアップの称号」削除
# ④★列は1行5つ・6以上は2段・中央揃え
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

FIT = '''
/** 主役テキストを1行に収めるフォント倍率 (2026-08-31 仕様: 2行に分かれない) */
function fitScale(text: string): number {
  const n = [...text].length
  if (n <= 8) return 1
  if (n <= 12) return 0.8
  if (n <= 16) return 0.64
  return 0.52
}
'''

# ── カード v3: 題名1行フィット ──
sub("app/[userId]/_coin/CardAwardMotion.tsx",
    '              <div className="caTitle">{face.title}</div>',
    '              <div className="caTitle" style={{ fontSize: Math.round(16 * fitScale(face.title)), whiteSpace: "nowrap" }}>{face.title}</div>',
    "card title fit")
sub("app/[userId]/_coin/CardAwardMotion.tsx",
    'type Phase = ', FIT + '\ntype Phase = ', "card fit fn")

# ── 証明書 v6: 曲名1行フィット ──
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    '                <div className="cePiece">{face.song}</div>',
    '                <div className="cePiece" style={{ fontSize: `${(5 * fitScale(face.song)).toFixed(2)}cqw`, whiteSpace: "nowrap", maxWidth: "none" }}>{face.song}</div>',
    "cert piece fit")
sub("app/[userId]/_coin/CertAwardMotion.tsx",
    'type Phase = ', FIT + '\ntype Phase = ', "cert fit fn")

# ── 認定証 v8: 大見出し1行フィット ──
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    '                <div className="niPiece">{face.big}</div>',
    '                <div className="niPiece" style={{ fontSize: `${(6.4 * fitScale(face.big)).toFixed(2)}cqw`, whiteSpace: "nowrap", maxWidth: "none" }}>{face.big}</div>',
    "nintei big fit")
sub("app/[userId]/_coin/NinteiAwardMotion.tsx",
    'type Phase = ', FIT + '\ntype Phase = ', "nintei fit fn")

# ── 称号カード: ランク名1行フィット+縦半分+そえ書き削除+★2段 ──
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    'type Phase = ', FIT + '\ntype Phase = ', "title fit fn")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '  const stars = "★".repeat(Math.min(Math.max(face.star, 1), 5))',
    '''  // ★列: 所属★を1行5つまで・6以上は2段 (2026-08-31 仕様)
  const starN = Math.min(Math.max(face.star, 1), 10)
  const starRow1 = "★".repeat(Math.min(starN, 5))
  const starRow2 = starN > 5 ? "★".repeat(starN - 5) : ""''',
    "title stars calc")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '''              <div className="tiKstars tiFoil">{stars}</div>
              <div className="tiKrank">{face.rankName}</div>
              <div className="tiKtitle">ランクアップの称号</div>
              <div className="tiKdate">{face.date}</div>''',
    '''              <div className="tiKstars tiFoil"><span>{starRow1}</span>{starRow2 && <span className="tiKstars2">{starRow2}</span>}</div>
              <div className="tiKrank" style={{ fontSize: `${(6.2 * fitScale(face.rankName)).toFixed(2)}cqw`, whiteSpace: "nowrap" }}>{face.rankName}</div>
              <div className="tiKdate">{face.date}</div>''',
    "title face trim")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiScene { position:absolute; left:50%; top:46%; z-index:6; width:64cqw; height:62cqh;',
    '.tiScene { position:absolute; left:50%; top:46%; z-index:6; width:64cqw; height:36cqh;',
    "title height")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiWrap { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center;\n  padding:9.5% 8% 7.5%; text-align:center; }',
    '.tiWrap { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center;\n  padding:6.5% 8% 5.5%; text-align:center; }',
    "title padding")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiEmblem { position:relative; margin-top:5%; width:27cqw; height:27cqw; }',
    '.tiEmblem { position:relative; margin-top:3.4%; width:19cqw; height:19cqw; }',
    "title emblem size")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiEstar { position:absolute; inset:0; display:grid; place-items:center; z-index:2;\n  font-size:11.5cqw;',
    '.tiEstar { position:absolute; inset:0; display:grid; place-items:center; z-index:2;\n  font-size:8.4cqw;',
    "title estar size")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiKstars { margin-top:4.5%; font-size:7.6cqw; line-height:1; letter-spacing:.14em; text-indent:.14em; }',
    '''.tiKstars { margin-top:3.2%; font-size:6.4cqw; line-height:1.15; letter-spacing:.14em; text-align:center; }
.tiKstars span { display:block; text-indent:.14em; }
.tiKstars2 { margin-top:.4cqh; }''',
    "title stars css")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiKrank { margin-top:3.4%;',
    '.tiKrank { margin-top:2.6%;',
    "title rank margin")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '''.tiKtitle { margin-top:2.2%; font-size:3cqw; font-weight:700; letter-spacing:.3em; text-indent:.3em;
  color:#6b6455; text-shadow:0 1px 0 rgba(255,252,240,.7); }
''', "", "title ktitle css removed")
sub("app/[userId]/_coin/TitleAwardMotion.tsx",
    '.tiSunburst { position:absolute; left:50%; top:33%;',
    '.tiSunburst { position:absolute; left:50%; top:40%;',
    "title sunburst")

# ── マスター記念カード: 曲名1行フィット+縦半分 ──
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    'type Phase = ', FIT + '\ntype Phase = ', "mcard fit fn")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '              <div className="mcMpiece">{face.song}</div>',
    '              <div className="mcMpiece" style={{ fontSize: `${(5.4 * fitScale(face.song)).toFixed(2)}cqw`, whiteSpace: "nowrap" }}>{face.song}</div>',
    "mcard piece fit")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcScene { position:absolute; left:50%; top:46%; z-index:6; width:64cqw; height:62cqh;',
    '.mcScene { position:absolute; left:50%; top:46%; z-index:6; width:64cqw; height:36cqh;',
    "mcard height")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '  padding:9.5% 8% 7.5%; text-align:center; }',
    '  padding:6.5% 8% 5.5%; text-align:center; }',
    "mcard padding")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcWreath { position:relative; margin-top:4.5%; width:30cqw; height:20cqw; }',
    '.mcWreath { position:relative; margin-top:3%; width:24cqw; height:15cqw; }',
    "mcard wreath size")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcLeaf { position:absolute; display:block; width:4.6cqw; height:1.7cqw;',
    '.mcLeaf { position:absolute; display:block; width:3.7cqw; height:1.4cqw;',
    "mcard leaf size")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcWstar { position:absolute; left:50%; top:-4%; transform:translateX(-50%); z-index:2; font-size:7cqw;',
    '.mcWstar { position:absolute; left:50%; top:-4%; transform:translateX(-50%); z-index:2; font-size:5.4cqw;',
    "mcard wstar size")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcMword { margin-top:1%; font-size:8.8cqw;',
    '.mcMword { margin-top:.6%; font-size:7cqw;',
    "mcard mword size")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcSealrow { margin-top:3.2%;',
    '.mcSealrow { margin-top:2.2%;',
    "mcard sealrow margin")
sub("app/[userId]/_coin/MasterCardAwardMotion.tsx",
    '.mcSunburst { position:absolute; left:50%; top:33%;',
    '.mcSunburst { position:absolute; left:50%; top:40%;',
    "mcard sunburst")
