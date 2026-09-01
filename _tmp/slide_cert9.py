# クエスト9件を認定証へスライド (2026-08-31 Tetsuo全採用)
# 099/102/105/106/113/114/138/140/145 に grade:"cert" を付与し、券面文言を追加
import io
import re

p = "app/_libs/treasureCatalog.ts"
s = io.open(p, encoding="utf-8").read()

SLIDE = ["master_20", "score_100", "rec_1000", "basics_250", "streak_200", "streak_365", "master_30", "days_365", "cards_all"]
for qid in SLIDE:
    pat = re.compile(r'(\{ no: \d+, questId: "' + qid + r'", title: "[^"]+", sub: "[^"]+", category: "[^"]+", type: "counter", )')
    m = pat.search(s)
    assert m, qid
    assert 'grade: "cert"' not in s[m.start():m.start() + 250], qid + " already cert"
    s = pat.sub(r'\1grade: "cert", ', s, count=1)
    print("cert:", qid)

faces = '''  master_20: {
    big: "20 MASTERS",
    kindLine: "栄光の認定証",
    body1: "20曲をマスターしたことを ここに認定します",
    body2: "きみの音楽は 立派な財産です",
  },
  master_30: {
    big: "30 MASTERS",
    kindLine: "伝説の認定証",
    body1: "30曲をマスターしたことを ここに認定します",
    body2: "その歩みは もう伝説です",
  },
  rec_1000: {
    big: "1000 TAKES",
    kindLine: "鍛錬の認定証",
    body1: "1000回の録音を かさねたことを ここに認定します",
    body2: "積み重ねの力を わたしは知っています",
  },
  basics_250: {
    big: "250 DRILLS",
    kindLine: "土台の認定証",
    body1: "基礎練を250回 かさねたことを ここに認定します",
    body2: "ゆるがない土台が きみの音を支えます",
  },
  streak_200: {
    big: "200 DAYS",
    kindLine: "不屈の認定証",
    body1: "200日つづけて練習したことを ここに認定します",
    body2: "続いた日々そのものが 誇りです",
  },
  streak_365: {
    big: "365 DAYS",
    kindLine: "1年の認定証",
    body1: "365日つづけて練習したことを ここに認定します",
    body2: "音楽が きみの毎日になりました",
  },
  days_365: {
    big: "365 TOTAL",
    kindLine: "歩みの認定証",
    body1: "のべ365日の練習を ここに認定します",
    body2: "1年ぶんの音が きみの中にあります",
  },
  score_100: {
    big: "PERFECT 100",
    kindLine: "満点の認定証",
    body1: "100点の演奏を ここに認定します",
    body2: "完璧な瞬間に 立ち会えました",
  },
  cards_all: {
    big: "ALL CARDS",
    kindLine: "完集の認定証",
    body1: "すべてのカードを あつめたことを ここに認定します",
    body2: "きみの旅の すべてが ここにあります",
  },
}'''
old = """  cert_3: {
    big: "3 CERTIFICATES","""
# cert_3 は削除済みのため streak_100 の閉じに追記する
anchor = '''  streak_100: {
    big: "100 DAYS",
    kindLine: "継続の認定証",
    body1: "100日つづけて練習したことを ここに認定します",
    body2: "続ける力は いちばんの才能です",
  },
}'''
assert anchor in s
s = s.replace(anchor, anchor[:-1] + faces)

s = s.replace("cert=アルコの認定証 (最難関4件)", "cert=アルコの認定証 (最難関13件)")
s = s.replace("最難関4件=認定証", "最難関13件=認定証")
io.open(p, "w", encoding="utf-8").write(s)
print("catalog ok")

# thresholdOf: cards_all 自身が認定証になったため -1 の自己除外を廃止
p2 = "app/_libs/treasureEngine.ts"
s2 = io.open(p2, encoding="utf-8").read()
old2 = """  // カード全制覇: カード格 (認定証以外) のクエスト数 - 1 (自分のカードは達成後に出るため除く)
  if (q.counter?.metric === "cards_all") {
    return QUESTS.filter((x) => x.grade !== "cert").length - 1
  }"""
new2 = """  // カード全制覇: カード格 (認定証以外) のクエスト数。cards_all自身は認定証になったため自己除外は不要
  if (q.counter?.metric === "cards_all") {
    return QUESTS.filter((x) => x.grade !== "cert").length
  }"""
assert old2 in s2
io.open(p2, "w", encoding="utf-8").write(s2.replace(old2, new2))
print("threshold ok")

# テスト: 認定証13件
p3 = "app/_libs/treasureCatalog.test.ts"
s3 = io.open(p3, encoding="utf-8").read()
old3 = '''  it("認定証は最難関4件のみ", () => {
    expect(QUESTS.filter((q) => q.grade === "cert").map((q) => q.no).sort((a, b) => a - b))
      .toEqual([30, 39, 45, 51])
  })'''
new3 = '''  it("認定証は最難関13件のみ (2026-08-31 スライド9件を全採用)", () => {
    expect(QUESTS.filter((q) => q.grade === "cert").map((q) => q.no).sort((a, b) => a - b))
      .toEqual([30, 39, 45, 51, 99, 102, 105, 106, 113, 114, 138, 140, 145])
  })'''
assert old3 in s3
io.open(p3, "w", encoding="utf-8").write(s3.replace(old3, new3))
print("test ok")
