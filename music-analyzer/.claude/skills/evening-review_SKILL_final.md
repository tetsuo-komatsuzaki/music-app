---
name: evening-review
description: >
  帰宅後・1日の作業終了時に実行するスキル。本日の全変更を確認し、テストを通過した上でmainへのマージを安全に行う。
  「今日の作業を終わりにしたい」「mainにマージしたい」「夜のレビューをして」「帰宅した」などのフレーズで必ずこのスキルを使うこと。
---

# Evening Review スキル

## 目的

1日の作業を安全に締めくくる。「何が変わったかを目視確認する」「ガードレールの事後検証を通過する」「mainに安全にマージする」「翌日につなぐ」の4つを順番に実施する。

---

## ⚠️ 前提：ガードレールスキルのロード（必須）

このスキルの実行前に、必ず以下を読み込むこと。
Step 3の事後検証はガードレールスキルのCheck 1〜9に従って実施する。

```
.claude/skills/arcoda-dev-guardrails/SKILL.md
```

---

## 実行ステップ（順番厳守・各ステップで確認を取ること）

### Step 1：本日ブランチの確認

```bash
# 現在いるブランチをそのまま使う（日付ハードコードによる不整合を防ぐ）
BRANCH=$(git branch --show-current)
```

ブランチが `main` または `dev/` で始まらない場合は **停止**して報告する：

```bash
if [ "$BRANCH" = "main" ] || [[ "$BRANCH" != dev/* ]]; then
  echo "🚫 エラー：現在のブランチが作業ブランチではありません。"
  echo "  現在: $BRANCH"
  echo "  → 正しいdevブランチに切り替えてから再実行してください。"
  echo "  → 候補: $(git branch | grep dev/ | sort | tail -3)"
fi
```

正しいdevブランチにいる場合：

```
✅ 作業ブランチを確認しました：$BRANCH
```

---

### Step 2：本日の変更内容を表示（目視確認）

```bash
git log main..HEAD --oneline
echo "---"
git diff main...HEAD --stat
```

```
📋 本日の変更サマリー（dev/YYYY-MM-DD）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ コミット一覧:
  [コミット履歴]

■ 変更ファイル一覧:
  [変更統計]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**ユーザーに確認を求める：**

```
👀 上記の変更内容を確認してください。
  問題なければ「続ける」と入力してください。
  問題があれば作業内容を教えてください。
```

ユーザーの「続ける」確認後、次のステップへ。

---

### Step 3：ガードレール事後検証（arcoda-dev-guardrails の Check 1〜9 を実施）

**ガードレールスキルのセクション5「修正完了後の必須事後検証」をすべて実行する。**

```bash
# Check 1：ビルド確認
npm run build

# Check 2：TypeScript 型エラー確認
npx tsc --noEmit

# Check 3：コアファイルの存在確認
for f in \
  "music-analyzer/analyze_performance.py" \
  "app/generated/prisma" \
  "app/_libs/prisma.ts" \
  "app/_libs/supabaseServer.ts" \
  "app/_libs/storageAdmin.ts" \
  "app/api/convert-audio/route.ts"; do
  [ -e "$f" ] && echo "✅ $f" || echo "❌ MISSING: $f"
done

# Check 4：Prismaスキーマ整合性
npx prisma validate

# Check 5：ユーザーデータ分離（本日変更したファイルを対象に実行）
# ※ <変更ファイル> には git diff main...HEAD --name-only の出力を使う
git diff main...HEAD --name-only | grep -E "\.ts$|\.tsx$" | while read f; do
  result=$(grep -n "findMany\|findFirst" "$f" 2>/dev/null | grep -v "userId" | grep -v "practiceItem\|PracticeItem")
  [ -n "$result" ] && echo "⚠️ $f に userId フィルタなしのクエリあり:" && echo "$result"
done

# Check 6：コア機能の存在確認
find app -name "ScoreDetail*" -o -name "score-detail*" 2>/dev/null
grep -rn "uploadRecord\|convert-audio" app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
grep -rn "MusicXML\|musicxml\|parseScore\|renderScore" app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"

# Check 7：APIルート構造確認
grep -rn "export async function POST" app/api/ | grep "convert-audio"

# Check 8：環境変数安全確認
grep "\.env" .gitignore
git status | grep "\.env"

# Check 9：サービスアーキテクチャ動作確認
echo "SELECT 1;" | npx prisma db execute --stdin 2>&1
npx supabase storage ls 2>&1 | grep "practice-items"
cd music-analyzer && python analyze_performance.py 2>&1 | head -10 && cd ..
find .next -name "route.js" 2>/dev/null | grep "convert-audio"
```

**全チェック通過の場合：**

```
✅ ガードレール事後検証 全チェック通過。mainへのマージが可能です。
```

**チェック失敗の場合：**

```
❌ 以下のチェックが失敗しました：
  [失敗項目とエラー内容]

→ mainへのマージを中止します。
→ 失敗項目を修正してから再度 evening-review を実行してください。
```

失敗時は **ここで停止する。マージには進まない。**

---

### Step 4：mainへのマージ（必ずユーザー確認を取る）

```
⚠️ 以下の内容で main にマージします：
  ブランチ: $BRANCH
  変更ファイル数: N件
  コミット数: N件

  本当にマージしますか？（「はい」と入力してください）
```

ユーザーの「はい」確認後のみ実行：

```bash
git checkout main

# コンフリクト検知付きマージ
git merge --no-ff "$BRANCH" -m "merge: $BRANCH" || {
  echo "🚨 コンフリクトが発生しました。マージを中断します。"
  echo "  コンフリクトしているファイル:"
  git diff --name-only --diff-filter=U
  git merge --abort
  echo ""
  echo "  → コンフリクトを手動で解消してから再度 evening-review を実行してください。"
  echo "  → 対象ファイルを確認: git status"
  exit 1
}

git push origin main
```

`--no-ff` を必ず使う理由：マージコミットが残ることで「この日にマージした」履歴が明確になる。

---

### Step 5：マージ後の動作確認

```bash
npm run build 2>&1 | tail -10
```

**通過した場合：**

```
✅ マージ後のmainも正常です。
```

**失敗した場合：**

```
🚨 緊急：マージ後のmainでビルドが失敗しました。
  → 以下のコマンドでマージを取り消してください：
    git revert -m 1 HEAD
    git push origin main
  → エラー内容: [エラー]
```

---

### Step 6：翌日タスク整理

以下の情報をもとに翌日タスクを生成する：

- Step 3のチェック結果に含まれるwarning・スコープ外の気づき
- 本日コミットメッセージに「TODO」「WIP」「仮」が含まれるもの
- Step 3 Check 5でユーザーに確認を求めた項目

```
📅 翌日の作業候補
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 要対応（未完了タスク・ガードレール警告）:
  [リスト]

■ 確認推奨（スコープ外の気づき等）:
  [リスト]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
お疲れ様でした。今日の作業は完了です。
```

---

### Step 7：ログ保存

```bash
mkdir -p logs
echo "[$(date)] evening-review: $BRANCH → main マージ完了 user=$(whoami)" >> logs/daily.log
```

---

## 実行の原則

- **各ステップで必ずユーザーの確認を取る**。自動でマージまで突き進まない。
- **ガードレール事後検証（Check 1〜9）が全通過するまでマージしない。**
- **テスト・チェック失敗時は絶対にマージしない。**
- **エラーは自動解決しない**。内容を表示してユーザーに判断を委ねる。
