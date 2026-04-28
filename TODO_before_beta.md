# TODO before β release

β リリース前に着手したい技術タスク。MVP 動作には影響しないが、コード品質 / 保守性 / セキュリティ深層防御に効くもの。

優先度は (P1 高 / P2 中 / P3 低)。

---

## P1: Phase B' — getUserIdsFromParams を既存正常系にも展開

**現状**: `app/_libs/getUserIdsFromParams.ts` は Phase B (commit `fdaae51`) で `/practice/*` 系の bug fix のために導入。同じ「URL `[userId]` 受領 + dbUser 解決」パターンを使っている既存の正常系 page.tsx は、まだ helper を使っていない。

**対象 (要 grep 確認)**:
- `app/[userId]/page.tsx` (top)
- `app/[userId]/scores/page.tsx`
- `app/[userId]/scores/[scoreId]/page.tsx`
- `app/[userId]/scores/upload/page.tsx`
- 他 `[userId]/*` 配下で `params.userId` から dbUser を解決している箇所

**理由**: 統一すれば bug の入り込み余地が減り (URL UUID と cuid の混同)、middleware bypass 時の二重防御も全 page で揃う。Phase B では bug fix と refactor を混ぜないため意図的に対象外とした。

**実施基準**: 各 page で
```ts
const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: ... } })
```
が手書きされている → helper 呼び出しに置換。bug fix ではないので必ずしも β ブロッカーではないが、β 後の機能追加で混乱の元になる前に潰したい。

---

## P2: 開発初期の dead code 削除

`app/top/[scoreId]/` 配下に旧スコア詳細 page が残っている (Phase B 事前確認時に発見)。`/[userId]/scores/[scoreId]` に統合済みで参照なし。

**実施**: `app/top/` ディレクトリごと削除 + ルーティング確認 (next build) を 1 commit で。

---

## P3: root layout のメタデータ整備

`app/layout.tsx` (root) は最小構成。`title` / `description` / `viewport` / `og:*` などのメタが未設定。SEO/SNS シェア時の体験に影響。

**実施**: `export const metadata` で title/description/og を設定。専用 commit 1 つで完結。

---

## P3: scoreDetail.tsx 内の vestigial query 削除

`app/[userId]/scores/[scoreId]/scoreDetail.tsx` (or 同名 client component) に、現在は表示で使っていない古い query / state が残存している可能性あり。Phase B 事前監査で指摘あり、本 Phase からは scope 外とした。

**実施**: 未使用検出 → 削除。tsc + UI smoke check で完結。

---

## 後で確認: 5 分 / 10 分 録音の上限検証

3 分録音は production で正常動作確認済 (Phase A)。5 分 / 10 分 (より長い) 録音で:
- Vercel 4.5MB body limit 回避が引き続き効くか
- Cloud Run Job timeout (1800s) 内に解析が収まるか
- analysis.json サイズ / メモリ使用量

を β 前に 1 度確認する。

---

## 後で確認: Storage バケットの Public/Private SQL チェック

Tetsuo が後ほど SQL で確認予定:
- `performances` バケットが Private 設定であること
- RLS policy が auth.uid() ベース (Path B 前提) で適用されていること

---

## 参考: Path B / RLS 完全移行

旧スコア (auth.uid() ベースでない path) のデータ移行 + RLS policy 再設計は MVP+scale 計画 (v4.0 master plan) で別途扱う。Phase B のスコープ外。
