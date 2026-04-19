// app/_libs/validators.ts
//
// 軽量バリデーター集約。DBクエリ前の早期弾き用。
// 完全な型安全は Prisma とビジネスロジック層で担保する。

// Prisma @default(cuid()) が生成する v1 形式: c + 24文字 base36 = 計25文字
// 例: cmmm46xn40000jgjytot9eobc
const CUID_V1_RE = /^c[a-z0-9]{24}$/

/**
 * cuid v1 形式であることを確認（25文字固定、上限なしによるDoSを排除）。
 * 外部入力の id を Prisma クエリに渡す前に必ず通す。
 */
export function isValidCuid(id: unknown): id is string {
  return typeof id === "string" && CUID_V1_RE.test(id)
}
