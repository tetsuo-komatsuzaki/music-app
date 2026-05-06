# Doフェーズ 強化ルール

## 修正制約（全て必須）
- 1回の修正は1仮説のみ（複数仮説を同時に修正しない）
- 閾値を変更する場合は変更理由をコメントに必ず記載
- 大規模リファクタリング禁止（通常サイクルでは）

## 悪化判定基準

**評価ケース < 10件の場合:**
既存ケースが1件でも悪化したら即 `git revert`

**評価ケース >= 10件の場合:**
- 悪化ケース数 <= 改善ケース数の半数 **かつ**
- 全体メトリクスが改善している場合のみマージ可
- それ以外は `git revert`

**p95 が悪化した場合は件数に関わらず再検討する。**

---

## 統合リファクタリングセッションのトリガー

以下のいずれかを満たした時点で統合リファクタリングセッションを実施する:

**トリガーA:** CHANGELOG.md に同一タグの修正が3件以上たまった
> 例: `cursor_overshoot` タグの修正が3件 → cursor管理ロジックを統合
> 類似した局所修正が重複している可能性が高い

**トリガーB:** 1つの関数にIMPROVEMENTコメントが4行以上になった
> 例: `_match_note()` にIMPROVEMENTコメントが4行 → 関数の再設計を検討
> 関数が複数の仮説修正を抱えてスパゲッティ化している

**トリガーC:** 新しい仮説を実装しようとしたが既存コードと干渉した
> 干渉した時点でリファクタリングが必要なサインと判断する

### 統合リファクタリングセッションでやること
1. `improvement_plan.md` を読んで実装済みの仮説を整理する
2. `CHANGELOG.md` の同一タグ修正をまとめて1つのロジックに統合する
3. 重複した閾値定義・似た条件分岐を削除する
4. 統合後に `benchmark_runner.py` を実行して全ケースが維持されることを確認する
5. `CHANGELOG.md` に「統合リファクタリング」として記録する

### 統合リファクタリングセッションで禁止すること
- 新しい仮説の実装（このセッションは整理のみ）
- アルゴリズムの根本的な変更
- `expected.json` の更新（コードの整理とは分離する）

---

## コードコメント必須フォーマット
```python
# IMPROVEMENT [tag]: reason — YYYY-MM-DD
```
例:
```python
# IMPROVEMENT cursor_overshoot: use expected_duration for medium match — 2025-04-01
```

---

## Checkフェーズ出力（必須 — 毎回全項目を報告すること）

```
## Check結果
- 仮説: 支持 / 部分支持 / 棄却
- 改善ケース: case_xxx（detection +X%）, ...
- 悪化ケース: なし / case_xxx（pitch -X%）
- p95変化: onset_p95 XX→XXms / pitch_p95 XX→XXcent
- train/eval差: train XX% / eval XX%（過学習なし / 要注意）
- 新規失敗タグ: なし / [タグ名]
- リファクタリングトリガー確認:
    同一タグ3件以上: あり（[タグ名] N件） / なし
    関数内IMPROVEMENT 4行以上: あり（[関数名]） / なし
- 判定: マージ / revert（理由: ...）
- 次アクション: 仮説継続 / ケース追加 / 別仮説 / リファクタリングセッション
```

---

## CHANGELOG.md追記フォーマット

```markdown
## [YYYY-MM-DD] — [tag]
- 仮説: ...
- 修正箇所: [関数名]
- Before: detection XX% / pitch XX% / onset_mae XXms / onset_p95 XXms / cascade N件
- After:  detection XX% / pitch XX% / onset_mae XXms / onset_p95 XXms / cascade N件
- 次の課題: ...
```
