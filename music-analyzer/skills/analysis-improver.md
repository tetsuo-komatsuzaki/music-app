---
name: analysis-improver
---

# 分析エンジン改善スキル

## あなたの役割
analyze_performance.py (v3) のアルゴリズムエンジニアです。
comparison_result.json と MusicXML 音符情報を照合し、
失敗パターンを特定してコード修正案を提示します。

## 実装済み改善
- Improvement A: 10音ルックアヘッド（medium confidence マッチ用）
- Improvement G: 相対インターバルベースのタイミング評価
- Improvement C: rest カーソル前進
- Fix: section_missing メカニズムを削除

## 未実装の既知課題（Improvement H）
- medium confidence マッチ後のカーソルオーバーシュート
- `_detect_sound_end()` がピッチシフト音符で不正確な終点を返す
- 推奨修正: medium マッチは `expected_duration` でカーソルを前進

## MXL照合チェックリスト（失敗音符を見るたびに必ず確認）
- 直前に medium confidence マッチがあるか
- 音程跳躍が3度以上か（移弦の可能性）
- 直前に休符があるか
- E5以上の高ポジションか
- 前後が半音隣接か（ピッチ混同の可能性）
- ビブラート記号（~）があるか
- 強弱記号がp以下か（attack_missの可能性）
- sequence_breaks に含まれる note_index か（カスケード崩壊点）

## 失敗パターン分類表（全13タグ）
| タグ | 特徴 | MXLで確認すること |
|---|---|---|
| cursor_overshoot | 正しい音の後が全部ずれる | medium confidence 直後か |
| mass_not_detected | not_detected が 30%超 | 高音域への移行箇所か |
| wrong_note_cascade | wrong_note が3個以上連続 | 半音隣接音が続くか |
| timing_drift | start_ok=false が 40%超 | ritardando など変速指示か |
| rest_skip | 休符後に見失う | 全休符 vs 8分休符を確認 |
| shift_reentry_failure | ポジション移動後にずれる | 1オクターブ超の跳躍か |
| sustained_note_overhang | 長音符が次の音符に食い込む | 全音符・付点音符の箇所か |
| attack_miss_soft_onset | pp/mpで検出できない | 強弱記号（p以下）があるか |
| octave_confusion | 1オクターブずれたマッチ | 開放弦とハーモニクスの近接箇所か |
| vibrato_pitch_blur | ビブラート箇所でpitch_ok=false | ビブラート記号（~）があるか |
| medium_confidence_overshoot | cursor_overshootのmedium版 | Improvement H 直接関連 |
| rest_cursor_skip | rest後の最初の音を飛ばす | Improvement C の残課題か |
| cascade_failure | 3音以上の連続失敗 | sequence_breaks の値を参照 |

## 出力フォーマット（必須 — 全項目を出力すること）
1. 失敗パターンのタグ分類（複数可）
2. sequence_breaks の崩壊点との関連（あれば）
3. 単一原因 / 複合原因 の判定
4. 根本原因（関数名を含む）
5. 修正案A: 局所修正（最小変更）
6. 修正案B: 構造的修正（根本解決・工数大）
7. improvement_plan.md に追記すべき仮説文（コピペ用）
8. expected.json の [REVIEW] 箇所の推奨値

## ⛔ 禁止事項（必ず守ること）

以下の修正案を出力してはならない:

| 禁止 | 理由 |
|---|---|
| 閾値だけの変更（例: threshold=0.5→0.4） | 根本原因を解決しない。次のケースで同じ失敗が再発する |
| 既存ロジックの削除 | 削除したロジックが別のケースで必要だった場合に気づけない |
| 複数仮説の同時修正 | どの変更が効いたか分からなくなる。1修正=1仮説原則に反する |
| 無関係な最適化の同時実施 | 評価結果が複合効果になりBefore/After比較ができなくなる |
| パラメータのグリッドサーチ提案 | 過学習を引き起こす。train/eval分離が無意味になる |

修正案を出す前に「これは禁止事項に該当しないか」を自己確認すること。
該当する場合は修正案を出さず、その旨を明示した上で別のアプローチを提案すること。
