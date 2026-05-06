---
name: daily-branch-setup
description: >
  毎朝の開発開始時に実行するスキル。今日の日付ブランチを安全に作成し、前日の作業サマリーを表示して、作業開始の準備を整える。
  「今日のブランチを作って」「開発を始めたい」「朝のセットアップをして」などのフレーズで必ずこのスキルを使うこと。
---

# Daily Branch Setup スキル

## 目的

毎朝の開発開始を安全に、かつ前日のコンテキストを引き継いだ状態でスタートするための準備スキル。

---

## ⚠️ 前提：ガードレールスキルのロード（必須・最優先）

このスキルの実行前に、必ず以下を読み込むこと。
ガードレールは開発作業全体を通じて常に有効であり、変更可否の判断・事後検証の手順はすべてガードレールスキルに定義されている。

```
.claude/skills/arcoda-dev-guardrails/SKILL.md
```

---

## 実行ステップ（順番厳守）

### Step 1：現在のブランチがmainでないことを確認

```bash
CURRENT=$(git branch --show-current)

if [ "$CURRENT" = "main" ]; then
  echo "🚫 警告：現在 main ブランチにいます。"
  echo "  このまま作業すると main を直接汚染します。"
  echo "  → 以降のステップでdevブランチを作成します。"
fi
```

> 停止はしない（次のステップでdevブランチに切り替えるため）。
> main にいることを認識させることが目的。

---

### Step 2：前日ブランチのマージ確認

```bash
git branch --merged main | grep "dev/"
git branch --no-merged main | grep "dev/"
```

`--no-merged` にブランチが残っている場合は **作業を停止**し、以下を報告する：

```
⚠️ 警告：マージ未完了のブランチが存在します
  対象: dev/YYYY-MM-DD
  → evening-review スキルを先に実行してください
  → マージ済みの場合は手動で確認してください
```

ユーザーの明示的な確認（「続ける」など）があった場合のみ次のステップへ進む。

---

### Step 3：リモートとの同期確認

```bash
# リモートの最新状態を取得
git fetch origin

# ローカル・リモート両方のdevブランチを一覧表示
git branch -a | grep "dev/"
```

リモートに同名ブランチが既に存在する場合は報告する：

```
ℹ️ リモートに以下のdevブランチが存在します：
  [git branch -a の出力]
  → 他の環境で作業済みの場合は衝突に注意してください。
```

---

### Step 4：main の健全性確認

```bash
git checkout main
git pull origin main
git status
```

`git status` が clean であることを確認する。
未コミットの変更がある場合は **作業を停止**し、以下を報告する：

```
⚠️ 警告：main に未コミットの変更があります
  直接 main を編集した可能性があります。
  → git status で内容を確認し、手動で処理してください。
```

---

### Step 5：当日ブランチの存在確認と作成

```bash
BASE_BRANCH="dev/$(date +%Y-%m-%d)"

# ローカル・リモート両方で同名ブランチを確認
git branch -a | grep "$BASE_BRANCH"
```

**同日ブランチが存在しない場合（通常）：**

```bash
BRANCH="$BASE_BRANCH"
git checkout -b "$BRANCH"
```

**同日ブランチが既に存在する場合（1日2セッション目以降）：**

既存ブランチを使い続けるか、新しいブランチを作るかをユーザーに確認する：

```
ℹ️ 本日のブランチ（dev/YYYY-MM-DD）は既に存在します。

  [1] 既存ブランチを使い続ける → dev/YYYY-MM-DD
  [2] 新しいブランチを作成する → dev/YYYY-MM-DD-2（以降 -3, -4...）

  どちらにしますか？
```

ユーザーの選択に応じて実行する：

```bash
# [1] の場合
git checkout "$BASE_BRANCH"
BRANCH="$BASE_BRANCH"

# [2] の場合（既存数をカウントして連番を付与）
COUNT=$(git branch -a | grep "$BASE_BRANCH" | wc -l)
BRANCH="${BASE_BRANCH}-$((COUNT + 1))"
git checkout -b "$BRANCH"
```

---

### Step 6：前日の作業サマリー表示

マージ済み・未マージを問わず、ローカルの直近 dev ブランチを取得して表示する：

```bash
YESTERDAY_BRANCH=$(git branch | grep "dev/" | sort | tail -1 | xargs)

if [ -z "$YESTERDAY_BRANCH" ] || [ "$YESTERDAY_BRANCH" = "$BRANCH" ]; then
  echo "ℹ️ 前回の作業ブランチが見つかりませんでした。新規スタートです。"
else
  git log main..$YESTERDAY_BRANCH --oneline 2>/dev/null
  git diff main...$YESTERDAY_BRANCH --stat 2>/dev/null
fi
```

前日ブランチが存在する場合：

```
📋 前回の作業サマリー（dev/YYYY-MM-DD）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ コミット一覧:
  [コミット履歴をそのまま表示]

■ 変更ファイル:
  [変更ファイルの統計をそのまま表示]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 7：セットアップ完了の報告

```
✅ 本日のブランチ（dev/YYYY-MM-DD）で作業を開始できます。

🛡️ ガードレール（arcoda-dev-guardrails）をロード済みです。
   変更可否の判断・事後検証の手順はガードレールスキルに従ってください。
```

---

## エラー時の原則

- **不明なエラーが出た場合は必ず停止し、エラー内容をそのまま報告する**
- 自動で解決しようとしない
- ユーザーに判断を委ねる

---

## 実行ログの保存

```bash
mkdir -p logs
echo "[$(date)] daily-branch-setup: branch=$BRANCH user=$(whoami)" >> logs/daily.log
```
