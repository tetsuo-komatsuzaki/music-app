# SCOPE_REPORT_B3: difficulty → star リネームの影響範囲調査

**作成日**: 2026-05-10
**対象**: Phase 1 修正指示書 v1.3 の B-3 (`Score.difficulty` / `PracticeItem.difficulty` を `star` にリネーム統一)
**結論**: ⚠ **修正中止 (件数超過)、Phase 4 もしくは別 PR で実施を推奨**

---

## 1. 件数集計 (粒度別)

| 種別 | 件数 | 内容 |
|------|------|------|
| **schema.prisma** | 4 行 | Score.difficulty (1) / PracticeItem.difficulty (1) + コメント (1) + index (1) |
| **TS/TSX `.difficulty` 参照** (property access) | **37 行** | `score.difficulty` / `practiceItem.difficulty` / `item.difficulty` 等 |
| **TS/TSX `difficulty:` (object literal)** | **64 行** | Prisma where/data/select/orderBy 句、DTO type 定義など |
| **Python `.difficulty` / `difficulty:`** | **11 行** | analyze_performance / loop_engine_runner / extract_skill_info 系 |
| **既存 migration SQL** | 2 ファイル | 旧 migration の ADD COLUMN/INDEX (変更不要、履歴温存) |
| **その他** (local var / UI label / formData / styles class / function 名) | 143 行 | `difficultyStars` / `cardDifficulty` / `difficultyRaw` / styles.difficulty / formData.get("difficulty") |

### クリティカルな修正対象 (Critical)

`schema 依存で必ず変更必須` のもの: **schema 4 + TS/TSX 37 + 64 + Python 11 = 116 件**

### 任意 (semantic 整合のため変更が望ましい)

- formData input name (`difficulty` → `star`): UI 側のフォームフィールド名同期が必要
- 関数名 `difficultyStars` (UI コンポーネントの内部関数): リネーム任意

### **変更不要** (UI 表示文言)

- 「難易度」「難易度別」「難しすぎる」など UI 日本語ラベル → そのまま維持
- styles.difficulty などの CSS クラス → そのまま維持 (別途整理)

---

## 2. 件数閾値判定 (指示書 Step 2)

| 範囲 | 判断 | 該当 |
|------|------|------|
| 0–30 件 | そのまま続行 | ❌ |
| 31–80 件 | Tetsuo に共有・判断仰ぐ | ❌ |
| **81 件以上** | ⚠ **修正中止、Phase 4 で行うべきか確認** | ✅ **該当** (116 件) |

→ **指示書通り、B-3 修正は中止**。

---

## 3. 主な参照箇所 (代表例)

### TS/TSX

```
app/[userId]/page.tsx                                — ホーム ☆ 進捗計算 (multiple .difficulty access)
app/[userId]/practice/[category]/page.tsx            — 教材一覧の難易度フィルタ
app/[userId]/practice/[category]/practiceLIst.tsx    — UI 表示
app/[userId]/admin/practice/page.tsx                 — admin 管理画面
app/[userId]/admin/adminPractice.tsx                 — admin upload UI
app/_libs/recommendations.ts                         — 推薦エンジン (GRADE_DIFFICULTY_RANGE 等)
app/components/RecommendationItem.tsx                — 「次のチャレンジ」カード (difficultyStars 関数)
app/components/GradeProgressBar.tsx                  — グレード進捗バー
app/components/GradeDetailModal.tsx                  — グレード詳細モーダル
app/api/users/[userId]/skill-task-cards/route.ts     — Prisma where 句
app/actions/uploadScore.ts                           — formData / Prisma create
app/actions/uploadPracticeItem.ts                    — 同上
app/actions/updateScoreTags.ts                       — 同上
app/actions/updatePracticeItemTags.ts                — 同上
app/lib/practice/getRecommendations.ts               — 推薦ロジック
```

### Python (music-analyzer)

```
music-analyzer/loop_engine_runner.py     — practiceItem.difficulty access (多数)
music-analyzer/lib/recommendations.py?   — (要確認)
music-analyzer/scripts/*.py              — backfill / verify scripts
```

### Prisma migrations (履歴温存)

- `20260506095800_add_skill_loop_engine_v3_2/migration.sql` (旧 ALTER TABLE で difficulty 追加)
- `20260509155944_add_score_loop_engine_fields/migration.sql` (Score.difficulty 追加)

→ 既存 migration は履歴として温存(改変厳禁、追加 migration で `RENAME COLUMN` する)

---

## 4. 推奨される対応 (案)

### 案 A: Phase 4 で一括リネーム (推奨)

**理由**:
- B-3 の影響は **app/ + music-analyzer/ + 関連 Server Action/API 全域** に及ぶ
- Phase 4 で UI を仕様準拠に上書き書き換えする予定 (R6=B) ⇒ そのタイミングで一括リネームが効率的
- 116 件の variable rename は 1 セッション内で完結可能だが、TypeScript 型エラーが波及するためテスト時間が必要
- 現状でも `difficulty` のセマンティクスは保てる(セマンティクス的に「難易度」=「☆」で同一概念)

**実施方法**:
- 別 PR で `git mv` 相当のリネーム migration を 1 つだけ作成
- TS/TSX/Python 側は `.difficulty` → `.star` の global replace
- formData input name も同期更新
- migration: `RENAME COLUMN "difficulty" TO "star"` (Score, PracticeItem)

### 案 B: 仕様書の用語を `difficulty` に揃える (代替案)

**理由**:
- 現状コード基盤に `difficulty` で広範に浸透
- 仕様 §6-1 を逆方向に修正 (star → difficulty) する判断
- 互換性影響ゼロ

**実施方法**:
- 仕様書 v1.3 §6-1 を更新: `star: Int` → `difficulty: Int`
- `MissingPracticeItemFlag.star` も `MissingPracticeItemFlag.difficulty` にリネーム
- 本 PR で B-1, B-2 のみ適用、B-3 は不要に

---

## 5. 推奨判断

**推奨: 案 A (Phase 4 で一括リネーム)**

理由:
- 仕様書の意図 (★1〜10 = 1〜10 段階) を尊重すべき
- 「difficulty」と「★」は厳密には別概念 (難易度値 vs 進捗マイルストーン)
- Phase 4 の UI 書き換えと同時に行う方が変更単位として綺麗

ただし、もし Tetsuo が Phase 4 まで待つのを避けたい / 案 B の用語統一が好ましい場合は、本 PR で確定し別タスクで実装可。

---

## 6. 本 PR (Phase 1 修正) で適用したもの

- ✅ B-1: `UserGradeProgress.currentGrade` を `GradeLevel` enum 化
- ✅ B-2: `TaskCategory` / `AssignedCategory` enum 追加 + 該当 2 カラムを enum 化
- ❌ **B-3: 中止** (本レポートで Tetsuo 判断仰ぐ)

---

**作成完了 — 2026-05-10**

Tetsuo の判断後、別 PR/Phase で B-3 を扱う。
