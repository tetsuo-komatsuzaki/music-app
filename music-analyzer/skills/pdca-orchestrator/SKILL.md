---
name: pdca-orchestrator
description: "バイオリン演奏解析エンジン（analyze_performance.py）の
  精度向上PDCAを自動実行する。ユーザーが performanceId（cmまたはclで
  始まる文字列）を単体で入力したとき、または「このケースを分析して」
  「PDCAを回して」「分析して」と言ったときに必ずこのスキルを起動する。
  Planフェーズ（失敗分析・仮説生成）とDoフェーズ（ベースライン計測・
  コード修正・before/after比較）を自動実行し、最後にマージ推奨を出力する。"
---

# PDCA オーケストレーター

## トリガー条件
以下のいずれかが入力されたら即座にこのスキルを起動する:
- cm または cl で始まる英数字の文字列（performanceId）
- 「このケースを分析して」「PDCAを回して」「分析して」

## 前提確認（スキル起動直後に必ず実行）

テストケース数を確認する（Windows対応）:
```python
python -c "import os; path='music-analyzer/tests/cases'; print(len([d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]) if os.path.exists(path) else 0)"
```

確認結果に応じて以下のフラグを設定する:
- 5件未満の場合: benchmark_skip = True
                 ※ Phase 3・5（ベンチマーク計測）をスキップする
                 ※ Phase 4（コード修正）はスキップしない
- 5件以上の場合: benchmark_skip = False（全フェーズを実行する）

## Phase 1: データ取得・読み込み（自動）

### Step 1-1: fetch_case.py を実行
```bash
cd music-analyzer
python scripts/fetch_case.py {performanceId}
```

[OK] tests/cases/{performanceId}/ に保存しました と表示されたら成功。
失敗した場合（Supabase接続エラー等）: エラー内容を表示してスキルを停止する。先に進まない。

### Step 1-2: generate_expected.py を実行
```bash
cd music-analyzer
python scripts/generate_expected.py {performanceId}
```

[OK] expected.json を生成しました（N件）と表示されたら成功。
失敗した場合: エラー内容を表示してスキルを停止する。先に進まない。

### Step 1-3: ファイルを読み込む
以下のファイルを全て読み込む:
music-analyzer/tests/cases/{performanceId}/comparison_result.json
music-analyzer/tests/cases/{performanceId}/meta.json
music-analyzer/tests/cases/{performanceId}/expected.json
music-analyzer/skills/analysis-improver.md
music-analyzer/improvement_plan.md

読み込み後、以下を表示する:
[1/6] データ取得・読み込み完了
曲名: {meta.title}  テンポ: {meta.tempo_bpm}BPM
difficulty: {meta.difficulty}
sequence_confidence: {expected.sequence_confidence}
sequence_breaks: {expected.sequence_breaks}

### Step 1-4: 気になった点の入力を求める（全ケース共通・省略可）
気になった点があれば入力してください（省略する場合はEnterのみ）:

## [REVIEW]確認の停止ポイント（重要）

expected.json の needs_review フィールドを確認する:

needs_review = true かつ benchmark_skip = True（ケース5件未満）の場合:
  以下を表示して必ずユーザーの入力を待つ（自動続行しない）:

  ┌─────────────────────────────────────────────────────────────┐
  │ [REVIEW確認が必要です]                                      │
  │                                                             │
  │ このケースは基準データ（N件目/5件）です。                   │
  │ 最初の5件はPDCA全体の評価基準になるため確認が必要です。     │
  │                                                             │
  │ review=true の音符: N件                                     │
  │  - 要確認（conf < 0.7）: N件                               │
  │  - 確認推奨（0.7〜0.9）: N件                               │
  │                                                             │
  │ 【確認手順】                                                │
  │ 1. 以下のファイルをテキストエディタで開く                   │
  │    tests/cases/{performanceId}/expected.json                │
  │ 2. [REVIEW] コメントがある音符を確認する                    │
  │                                                             │
  │ 【問題がある場合】以下を修正してファイルを保存する          │
  │  - expected_pitch が間違い → 正しい音名に書き換える         │
  │    例: "E5" → "D5"                                         │
  │  - expected_start_sec がずれている → 正しい秒数に書き換える │
  │  - should_exist が間違い → true/false を書き換える          │
  │                                                             │
  │ 【問題がない場合】そのまま次へ                              │
  │                                                             │
  │ 確認・修正が終わったら「続行」と入力してEnterを押してください│
  └─────────────────────────────────────────────────────────────┘

  ユーザーが「続行」と入力したら:
  1. expected.json を再度読み込む（修正が反映されるように）
  2. last_reviewed_at を今日の日付に自動更新する
  3. 次のステップに進む

needs_review = true かつ benchmark_skip = False（ケース5件以上）の場合:
  以下を表示してそのまま自動続行する（停止しない）:
  「[INFO] expected.json に review=true の箇所が N件あります。
   6件目以降のケースは確認なしで続行します。」

needs_review = false の場合:
  何も表示せず自動続行する。

## Phase 2: 失敗分析・仮説生成（自動）

analysis-improver.md の内容を前提知識として使い、以下を実行する:

1. comparison_result.json を走査して算出する:
   - not_detected 率（全音符数に対する割合）
   - wrong_note 率
   - cascade_failure_count（3音以上連続失敗の回数）
   - sequence_breaks との照合

2. meta.json の MXL 情報と照合して失敗タグを特定する

3. 根本原因を特定する（関数名を含む）

4. 修正案A（局所・最小変更）と修正案B（構造的）を生成する

5. improvement_plan.md に以下の形式で仮説を追記する:
   ---
   ### {今日の日付} — {タグ名}
   - 仮説: {生成した仮説文}
   - 根拠ケース: {performanceId}
   - 結果: （サイクル完了後に追記）
   ---

表示する:
[2/6] 分析完了
主要タグ: {tag}
根本原因: {関数名} — {説明}
修正案A: {要約}

## Phase 3: ベースライン計測

benchmark_skip = False（ケース5件以上）の場合のみ以下を実行する:
```bash
cd music-analyzer
venv/Scripts/python.exe tests/benchmark_runner.py
```
結果をメモリに保持する（baseline）。
表示する:
[3/6] ベースライン計測完了
detection: XX%  pitch: XX%  onset_p95: XXms  cascade: N件

benchmark_skip = True（ケース5件未満）の場合は実行せず以下を表示する:
[3/6] ベースライン計測 — スキップ（ケース5件未満のため）

## Phase 4: コード修正（自動・件数に関わらず必ず実行）

Phase 2 で生成した修正案A を analyze_performance.py に適用する。

制約（必ず守ること）:
- 1箇所の変更のみ
- 変更箇所に以下のコメントを追加する:
  # IMPROVEMENT {tag}: {reason} — {YYYY-MM-DD}
- 閾値だけの変更は禁止
- 既存ロジックの削除は禁止
- 複数箇所の同時修正は禁止
- 無関係な最適化の同時実施は禁止
- パラメータのグリッドサーチは禁止

表示する:
[4/6] コード修正完了
変更箇所: {関数名} — {変更内容の要約}
修正した diff を表示する（確認できるように）。

## Phase 5: after 計測

benchmark_skip = False（ケース5件以上）の場合のみ以下を実行する:
```bash
cd music-analyzer
venv/Scripts/python.exe tests/benchmark_runner.py
```
結果をメモリに保持する（after）。
表示する:
[5/6] after 計測完了
detection: XX%  pitch: XX%  onset_p95: XXms  cascade: N件

benchmark_skip = True（ケース5件未満）の場合は実行せず以下を表示する:
[5/6] after 計測 — スキップ（ケース5件未満のため）

## Phase 6: 比較・レポート出力（自動）

### benchmark_skip = False（ケース5件以上）の場合

baseline と after を比較して以下を出力する:
[6/6] レポート出力
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PDCA 完了レポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【ケース情報】
performanceId: {id}
曲名: {title}  テンポ: {tempo}BPM  difficulty: {difficulty}
【失敗分析】
主要タグ: {tag}
根本原因: {関数名} — {説明}
【修正内容】（diff）
{変更箇所のdiff}
【ベンチマーク結果】
メトリクス      Before   After    変化
detection       XX%      XX%      +X%
pitch           XX%      XX%      +X%
onset_mae       XXms     XXms     -Xms
onset_p95       XXms     XXms     -Xms
cascade         N件      N件      -N件
改善ケース: N件  /  悪化ケース: N件
【リファクタリングトリガー確認】
同一タグ3件以上: あり（{タグ} N件） / なし
関数内IMPROVEMENT 4行以上: あり（{関数名}） / なし
【判定】
{マージ推奨 ✅ または revert推奨 ❌}
理由: {理由}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【マージする場合（あなたが実行）】
以下を順番に実行してください:

CHANGELOG.md をエディタで開いて先頭に以下を追記する:
## {日付} — {tag}
- 仮説: {仮説文}
- 修正箇所: {関数名}
- Before: detection XX% / pitch XX% / onset_p95 XXms
- After:  detection XX% / pitch XX% / onset_p95 XXms
- 次の課題: （ここに記載）

以下を実行する:
git add music-analyzer/analyze_performance.py
git add music-analyzer/improvement_plan.md
git add music-analyzer/CHANGELOG.md
git commit -m "IMPROVEMENT {tag}: {理由} — {日付}"

【リバートする場合（あなたが実行）】
git revert HEAD

### benchmark_skip = True（ケース5件未満）の場合

以下を出力する:
[6/6] レポート出力
現在 N件のテストケースがあります。
5件未満のためベンチマーク比較はスキップします。
分析と修正案は完了しました。5件揃ったらフル実行に切り替わります。
【失敗分析】
主要タグ: {tag}
根本原因: {関数名} — {説明}
【修正内容】（diff）
{変更箇所のdiff}
【マージする場合（あなたが実行）】
コードの修正内容を確認して問題なければ以下を実行してください:

CHANGELOG.md をエディタで開いて先頭に以下を追記する:
## {日付} — {tag}
- 仮説: {仮説文}
- 修正箇所: {関数名}
- Before: ベンチマークなし（ケース5件未満）
- After:  ベンチマークなし（ケース5件未満）
- 次の課題: （ここに記載）

以下を実行する:
git add music-analyzer/analyze_performance.py
git add music-analyzer/improvement_plan.md
git add music-analyzer/CHANGELOG.md
git commit -m "IMPROVEMENT {tag}: {理由} — {日付}"

【リバートする場合（あなたが実行）】
git revert HEAD

## 失敗パターン分類表（全13タグ）
| タグ | 特徴 | 確認すること |
|---|---|---|
| cursor_overshoot | 正しい音の後が全部ずれる | medium confidence 直後か |
| mass_not_detected | not_detected が30%超 | 高音域への移行箇所か |
| wrong_note_cascade | wrong_note が3個以上連続 | 半音隣接音が続くか |
| timing_drift | start_ok=false が40%超 | ritardandoなど変速指示か |
| rest_skip | 休符後に見失う | 全休符 vs 8分休符を確認 |
| shift_reentry_failure | ポジション移動後にずれる | 1オクターブ超の跳躍か |
| sustained_note_overhang | 長音符が次の音符に食い込む | 全音符・付点音符の箇所か |
| attack_miss_soft_onset | pp/mpで検出できない | 強弱記号（p以下）があるか |
| octave_confusion | 1オクターブずれたマッチ | 開放弦とハーモニクスの近接箇所か |
| vibrato_pitch_blur | ビブラートでpitch_ok=false | ビブラート記号（~）があるか |
| medium_confidence_overshoot | cursor_overshootのmedium版 | Improvement H 直接関連 |
| rest_cursor_skip | rest後の最初の音を飛ばす | Improvement C の残課題か |
| cascade_failure | 3音以上の連続失敗 | sequence_breaksの値を参照 |

## 実装済み改善
- Improvement A: 10音ルックアヘッド（medium confidence マッチ用）
- Improvement G: 相対インターバルベースのタイミング評価
- Improvement C: rest カーソル前進
- Fix: section_missing メカニズムを削除

## 未実装の既知課題（Improvement H・最優先）
- medium confidence マッチ後のカーソルオーバーシュート
- _detect_sound_end() がピッチシフト音符で不正確な終点を返す
- 推奨修正: medium マッチは expected_duration でカーソルを前進

## 禁止事項（コード修正案に含めてはならない）
| 禁止 | 理由 |
|---|---|
| 閾値だけの変更 | 根本原因を解決しない |
| 既存ロジックの削除 | 別ケースで必要だった場合に気づけない |
| 複数箇所の同時修正 | 1修正=1仮説原則に反する |
| 無関係な最適化の同時実施 | Before/After比較ができなくなる |
| パラメータのグリッドサーチ | 過学習を引き起こす |
