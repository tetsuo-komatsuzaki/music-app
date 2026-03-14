// scripts/seed-technique-tags.ts
// Usage: npx ts-node scripts/seed-technique-tags.ts

import { config } from "dotenv"
config()

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

const techniques = [
  // 弓方向
  { category: "弓方向", name: "Down-bow / Up-bow", nameEn: "down-bow/up-bow", xmlTags: ["<up-bow>", "<down-bow>"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "弓方向", name: "弓の使用部位", nameEn: "bow-position", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装不要" },
  // 弓法-滑奏
  { category: "弓法-滑奏", name: "デタシェ", nameEn: "detache", xmlTags: ["articulations"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-滑奏", name: "レガート", nameEn: "legato", xmlTags: ["<slur>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-滑奏", name: "テヌート", nameEn: "tenuto", xmlTags: ["<tenuto>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-滑奏", name: "ポルタート", nameEn: "portato", xmlTags: ["portato"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-滑奏", name: "ルーレ", nameEn: "loure", xmlTags: ["portato"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-滑奏", name: "ソン・フィレ", nameEn: "son-file", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-滑奏", name: "ブラッシュ・ストローク", nameEn: "brush-stroke", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  // 弓法-強奏
  { category: "弓法-強奏", name: "スタッカート", nameEn: "staccato", xmlTags: ["<staccato>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-強奏", name: "スタッカーティシモ", nameEn: "staccatissimo", xmlTags: ["<staccatissimo>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-強奏", name: "ボウ・スタッカート", nameEn: "bow-staccato", xmlTags: ["staccato"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-強奏", name: "マルテレ", nameEn: "martele", xmlTags: ["accent"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-強奏", name: "サステインド・マルテレ", nameEn: "sustained-martele", xmlTags: ["accent"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-強奏", name: "スピッカート", nameEn: "spiccato", xmlTags: ["staccato"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-強奏", name: "フライング・スタッカート", nameEn: "flying-staccato", xmlTags: ["staccato"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-強奏", name: "フライング・スピッカート", nameEn: "flying-spiccato", xmlTags: ["staccato"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "弓法-強奏", name: "リコシェ", nameEn: "ricochet", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-強奏", name: "コレ", nameEn: "colle", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-強奏", name: "ソティエ", nameEn: "sautille", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-強奏", name: "フエッテ", nameEn: "fouette", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-強奏", name: "ジュテ", nameEn: "jete", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-強奏", name: "チョップス", nameEn: "chops", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-強奏", name: "ピチカート", nameEn: "pizzicato", xmlTags: ["<pizzicato>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-強奏", name: "マルカート", nameEn: "marcato", xmlTags: ["marcato"], isAnalyzable: "Partial", implementStatus: "実装" },
  // 弓法-管弦楽
  { category: "弓法-管弦楽", name: "トレモロ", nameEn: "tremolo", xmlTags: ["<tremolo>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-管弦楽", name: "メジャード・トレモロ", nameEn: "measured-tremolo", xmlTags: ["<tremolo>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-管弦楽", name: "アンメジャード・トレモロ", nameEn: "unmeasured-tremolo", xmlTags: ["<tremolo>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "弓法-管弦楽", name: "サーキュラー・ボウイング", nameEn: "circular-bowing", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "弓法-管弦楽", name: "ポンティチェロ", nameEn: "ponticello", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-管弦楽", name: "タスト", nameEn: "tasto", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-管弦楽", name: "フラウタート", nameEn: "flautato", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "弓法-管弦楽", name: "コル・レーニョ（バットゥート）", nameEn: "col-legno-battuto", xmlTags: ["<col-legno>"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "弓法-管弦楽", name: "コル・レーニョ（トラット）", nameEn: "col-legno-tratto", xmlTags: ["<col-legno>"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "弓法-管弦楽", name: "オ・タロン", nameEn: "au-talon", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  // 左手
  { category: "左手", name: "ビブラート", nameEn: "vibrato", xmlTags: ["ornaments"], isAnalyzable: "No", implementStatus: "実装" },
  { category: "左手", name: "ノン・ビブラート", nameEn: "non-vibrato", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "左手", name: "トリル", nameEn: "trill", xmlTags: ["<trill-mark>"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "左手", name: "モルデント", nameEn: "mordent", xmlTags: ["<mordent>"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "左手", name: "ターン", nameEn: "turn", xmlTags: ["<turn>"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "左手", name: "グリッサンド", nameEn: "glissando", xmlTags: ["<glissando>"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "左手", name: "ポルタメント", nameEn: "portamento", xmlTags: ["<slide>"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "左手", name: "ナチュラル・ハーモニクス", nameEn: "natural-harmonics", xmlTags: ["<harmonic>"], isAnalyzable: "Partial", implementStatus: "実装" },
  { category: "左手", name: "アーティフィシャル・ハーモニクス", nameEn: "artificial-harmonics", xmlTags: ["<harmonic>"], isAnalyzable: "Partial", implementStatus: "将来、実装検討" },
  { category: "左手", name: "左手ピチカート", nameEn: "left-hand-pizzicato", xmlTags: ["<pizzicato>"], isAnalyzable: "Yes", implementStatus: "実装不要" },
  // アーティキュレーション
  { category: "アーティキュレーション", name: "アクセント", nameEn: "accent", xmlTags: ["<accent>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "アーティキュレーション", name: "ブレスマーク / チェズーラ", nameEn: "breath-mark", xmlTags: ["<breath-mark>", "<caesura>"], isAnalyzable: "No", implementStatus: "将来、実装検討" },
  { category: "アーティキュレーション", name: "フェルマータ", nameEn: "fermata", xmlTags: ["<fermata>"], isAnalyzable: "No", implementStatus: "将来、実装検討" },
  // 弦指定
  { category: "弦指定", name: "G/D/A/E弦指定", nameEn: "string-indication", xmlTags: ["technical string"], isAnalyzable: "No", implementStatus: "実装不要" },
  // 音色
  { category: "音色", name: "オルディナリオ", nameEn: "ordinario", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "音色", name: "コン・ソルディーノ", nameEn: "con-sordino", xmlTags: ["<mute>"], isAnalyzable: "No", implementStatus: "将来、実装検討" },
  { category: "音色", name: "センツァ・ソルディーノ", nameEn: "senza-sordino", xmlTags: ["<mute>"], isAnalyzable: "No", implementStatus: "実装不要" },
  // ダイナミクス
  { category: "ダイナミクス", name: "ppp〜fff", nameEn: "dynamics", xmlTags: ["<dynamics>"], isAnalyzable: "Partial", implementStatus: "将来、実装検討" },
  { category: "ダイナミクス", name: "クレッシェンド / ディミヌエンド", nameEn: "crescendo-diminuendo", xmlTags: ["<crescendo>", "<diminuendo>"], isAnalyzable: "No", implementStatus: "将来、実装検討" },
  { category: "ダイナミクス", name: "スフォルツァンド", nameEn: "sforzando", xmlTags: ["<sfz>"], isAnalyzable: "Partial", implementStatus: "将来、実装検討" },
  // フレーズ
  { category: "フレーズ", name: "タイ", nameEn: "tie", xmlTags: ["<tie>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "フレーズ", name: "ルバート", nameEn: "rubato", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "将来、実装検討" },
  // 重音
  { category: "重音", name: "ダブルストップ", nameEn: "double-stop", xmlTags: ["multiple notes"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "重音", name: "トリプル/クアドラプルストップ", nameEn: "triple-quadruple-stop", xmlTags: ["multiple notes"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "重音", name: "アルペジオ / 分散和音", nameEn: "arpeggiate", xmlTags: ["<arpeggiate>"], isAnalyzable: "Yes", implementStatus: "実装" },
  { category: "重音", name: "バリオラージュ", nameEn: "bariolage", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装" },
  // 特殊
  { category: "特殊", name: "バルトーク・ピチカート", nameEn: "bartok-pizzicato", xmlTags: ["snap-pizzicato"], isAnalyzable: "No", implementStatus: "将来、実装検討" },
  { category: "特殊", name: "スクラッチ・トーン", nameEn: "scratch-tone", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "特殊", name: "ウィスパー・トーン", nameEn: "whisper-tone", xmlTags: ["text-direction"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "特殊", name: "ハーモニック・グリッサンド", nameEn: "harmonic-glissando", xmlTags: ["harmonic+gliss"], isAnalyzable: "No", implementStatus: "実装不要" },
  { category: "特殊", name: "ポンティチェロ・トレモロ", nameEn: "ponticello-tremolo", xmlTags: ["tremolo"], isAnalyzable: "Partial", implementStatus: "実装" },
  // 演奏ミス
  { category: "演奏ミス", name: "C0. ミスなく演奏", nameEn: "no-error", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C1. 音程の間違い", nameEn: "pitch-error", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C2. リズムの間違い", nameEn: "rhythm-error", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C3. かすれ/出し損ね", nameEn: "scratchy-sound", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C4. 弦の間違い", nameEn: "wrong-string", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C5. 弓の震え/不安定", nameEn: "bow-trembling", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C6. 開放弦の共振", nameEn: "sympathetic-resonance", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
  { category: "演奏ミス", name: "C7. 途中でやめる", nameEn: "stopped-midway", xmlTags: [], isAnalyzable: "-", implementStatus: "実装" },
]

async function main() {
  console.log(`Seeding ${techniques.length} technique tags...`)

  for (const t of techniques) {
    await prisma.techniqueTag.upsert({
      where: { category_name: { category: t.category, name: t.name } },
      update: {
        nameEn: t.nameEn,
        xmlTags: t.xmlTags,
        isAnalyzable: t.isAnalyzable,
        implementStatus: t.implementStatus,
      },
      create: {
        category: t.category,
        name: t.name,
        nameEn: t.nameEn,
        xmlTags: t.xmlTags,
        isAnalyzable: t.isAnalyzable,
        implementStatus: t.implementStatus,
      },
    })
  }

  const count = await prisma.techniqueTag.count()
  console.log(`Done. ${count} technique tags in DB.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
