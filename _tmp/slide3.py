# 追加スライド3件 (144 宝物100個 / 143 メダル5個全部 / 120 週5日8週連続) → 認定証16件に
import io
import re

p = "app/_libs/treasureCatalog.ts"
s = io.open(p, encoding="utf-8").read()

for qid in ["treasures_100", "medals_5", "week5_8"]:
    pat = re.compile(r'(\{ no: \d+, questId: "' + qid + r'", title: "[^"]+", sub: "[^"]+", category: "[^"]+", type: "counter", )')
    m = pat.search(s)
    assert m, qid
    s = pat.sub(r'\1grade: "cert", ', s, count=1)
    print("cert:", qid)

faces = '''  week5_8: {
    big: "8 WEEKS",
    kindLine: "習慣の認定証",
    body1: "週5日の練習を 8週つづけたことを ここに認定します",
    body2: "習慣の力が きみを育てています",
  },
  medals_5: {
    big: "5 MEDALS",
    kindLine: "制覇の認定証",
    body1: "すべてのメダルを あつめたことを ここに認定します",
    body2: "節目のひとつひとつを 乗りこえました",
  },
  treasures_100: {
    big: "100 TREASURES",
    kindLine: "宝物の認定証",
    body1: "100個の宝物を あつめたことを ここに認定します",
    body2: "ギャラリーは きみの歩みの美術館です",
  },
}'''
anchor = '''  cards_all: {
    big: "ALL CARDS",
    kindLine: "完集の認定証",
    body1: "すべてのカードを あつめたことを ここに認定します",
    body2: "きみの旅の すべてが ここにあります",
  },
}'''
assert anchor in s
s = s.replace(anchor, anchor[:-1] + faces)
s = s.replace("cert=アルコの認定証 (最難関13件)", "cert=アルコの認定証 (最難関16件)")
s = s.replace("最難関13件=認定証", "最難関16件=認定証")
io.open(p, "w", encoding="utf-8").write(s)
print("catalog ok")

p3 = "app/_libs/treasureCatalog.test.ts"
s3 = io.open(p3, encoding="utf-8").read()
old3 = '''  it("認定証は最難関13件のみ (2026-08-31 スライド9件を全採用)", () => {
    expect(QUESTS.filter((q) => q.grade === "cert").map((q) => q.no).sort((a, b) => a - b))
      .toEqual([30, 39, 45, 51, 99, 102, 105, 106, 113, 114, 138, 140, 145])
  })'''
new3 = '''  it("認定証は最難関16件のみ (2026-08-31 スライド9+3件を採用)", () => {
    expect(QUESTS.filter((q) => q.grade === "cert").map((q) => q.no).sort((a, b) => a - b))
      .toEqual([30, 39, 45, 51, 99, 102, 105, 106, 113, 114, 120, 138, 140, 143, 144, 145])
  })'''
assert old3 in s3
io.open(p3, "w", encoding="utf-8").write(s3.replace(old3, new3))
print("test ok")
