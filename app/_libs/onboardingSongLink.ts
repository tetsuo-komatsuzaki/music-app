// オンボーディング目標曲カタログ(OnboardingSong)と楽譜(Score)の名前照合・結線。
// カタログ名は「チャルダッシュ(モンティ)」のように括弧書きで出典/作曲者を含むが、
// Score.title は管理者の自由入力(作曲者は composer 列)のため、正規化して照合する。

import { prisma } from "@/app/_libs/prisma"

/** 括弧書き(全角/半角)と空白を除去して照合キー化 */
export function normalizeSongName(s: string): string {
  return s
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase()
}

/**
 * アップロードされた Score をカタログの目標曲へ自動結線する。
 * 誤リンク防止のため「未結線のアクティブ曲に正規化名が一意一致」した場合のみ更新。
 * 共有曲(isShared)以外は目標曲の導線対象にしないため呼び出し側で制御する。
 * @returns 結線した OnboardingSong の名前一覧(0件=一致なし or 曖昧)
 */
export async function autoLinkOnboardingSongs(
  scoreId: string,
  scoreTitle: string,
): Promise<string[]> {
  const key = normalizeSongName(scoreTitle)
  if (!key) return []
  const candidates = await prisma.onboardingSong.findMany({
    where: { isActive: true, scoreId: null },
    select: { id: true, name: true, category: true },
  })
  const matched = candidates.filter((c) => normalizeSongName(c.name) === key)
  // 同名曲が複数カテゴリに載ることは正当(例: 映画とクラシック双方)なので
  // カテゴリ違いの同名一致はすべて結線する。名前レベルで別曲が衝突した場合のみ見送り
  const distinctNames = new Set(matched.map((m) => normalizeSongName(m.name)))
  if (matched.length === 0 || distinctNames.size !== 1) return []
  await prisma.onboardingSong.updateMany({
    where: { id: { in: matched.map((m) => m.id) } },
    data: { scoreId },
  })
  return matched.map((m) => m.name)
}
