import "dotenv/config"
import { prisma } from "../app/_libs/prisma"

// 既存 isShared 曲へのジャンル一括分類 (2026-07-18、AI分類=Tetsuo承認)。冪等。
// title 基準 (重複タイトルは全て同一ジャンルなので安全)。新規曲は admin 手動指定。
const TITLES_OF: Record<string, string[]> = {
  warabe: [
    "アルプス一万尺", "かっこう", "きらきら星", "しゃぼん玉", "せいくらべ", "ちょうちょ",
    "ぶんぶんぶん", "むすんでひらいて", "ロンドン橋", "七つの子", "子守歌",
    "歌をわすれたカナリア", "証城寺のたぬきばやし",
  ],
  shouka: [
    "おぼろ月夜", "さくらさくら", "ふるさと", "ほたるの光", "もみじ", "早春賦",
    "春がきた", "春の小川", "花", "赤とんぼ", "野ばら",
  ],
  classic: [
    "☆2_ホフマンの舟唄", "G線上のアリア", "アマリリス", "ヴァイオリン協奏曲", "オーゼの死",
    "ガボット", "ガボット「ミニヨンより」", "トルコ行進曲", "ノクターン「夏の夜の夢」",
    "ふたりのてきだん兵", "ホフマンの舟唄", "ポルカ", "メヌエット", "メヌエット_ト長調",
    "メヌエット（「ドン・ジョバンニ」より）", "ユレモスク", "ワルツ No.15", "古いフランスの曲",
    "家路", "楽しい農夫", "歓喜の歌", "狩人の合唱", "見よ、勇者はかえる",
    "驚愕シンフォニー", "魔女のおどりのテーマ",
  ],
  folk: [
    "アメイジング・グレイス", "ヴォルガの舟うた", "オーラ・リー", "オールドブラックジョー",
    "おおスザンナ", "グリーンスリーブス", "ジャスミン", "とうげのわが家",
    "なつかしきケンタッキーのわが家", "ファニタ", "ホーム・スウィート・ホーム",
    "ホルディリディア", "ロングロングアゴー", "主人は冷たい土の中に", "草けいば",
  ],
}

async function main() {
  let updated = 0
  for (const [genre, titles] of Object.entries(TITLES_OF)) {
    const r = await prisma.score.updateMany({
      where: { isShared: true, deletedAt: null, title: { in: titles } },
      data: { genre },
    })
    console.log(`${genre.padEnd(8)}: ${r.count} 行更新 (${titles.length} タイトル)`)
    updated += r.count
  }
  console.log(`--- 合計 ${updated} 行更新 ---`)

  const missing = await prisma.score.findMany({
    where: { isShared: true, deletedAt: null, genre: null },
    select: { title: true, composer: true },
  })
  if (missing.length) {
    console.log(`⚠ 未分類 ${missing.length} 件:`)
    for (const m of missing) console.log(`   - ${m.title} (${m.composer ?? ""})`)
  } else {
    console.log("✅ 未分類 0 件")
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
