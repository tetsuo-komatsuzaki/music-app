# tests/audit — 解析器の精度監査

解析器 (analyze_performance.py) が「正しく測れているか」を、人の耳を待たずに数字で出す道具。
2026-09-06 の音程監査で作った。レポート: https://claude.ai/code/artifact/70b44495-e701-4606-b7e0-ed4bb73d7183

## 考え方

正解を人が作ると遅くて不正確。だから正解を機械で作る。

- 既存の録音を既知のセント量だけピッチシフトすれば、「報告されるべき値」は元の報告値にその量を足したもの。演奏者が完璧でなくてもこの関係は厳密に成り立つ
- 音の中で動く音程は、既知の軌道を持つ合成音で作る

## ファイル

| ファイル | 役割 |
|---|---|
| `_load_analyzer.py` | analyze_performance.py の関数と定数だけを AST で抜き出して読む。本体は import すると DB へ行くので、これが唯一の入口 |
| `_cache.py` | ケースをローカルへ写す。OneDrive 上の wav は読むだけで 278 秒かかる |
| `offline_analyzer.py` | 本番経路 (f0 → ゲート → 位置合わせ → evaluate_notes) を wav と音符リストから直接呼ぶ。判定ロジックは複製しない |
| `pitch_probe.py` | 層1 · フレーム f0 の既知量シフト応答 |
| `note_probe.py` | 層2 · 音符報告値の既知量シフト応答と誤合格数 |
| `motion_probe.py` | 層3 · 合成音の音内変化に対する報告値 |
| `run_audit.py` | 3層をまとめて回して `history/` に残す |
| `fetch_case_inputs.py` | 本番 DB と Storage から、解析器が実際に受け取った入力 (analysis.json・録音テンポ・カウントイン位置・区間) をケースへ取り寄せる。読み取りのみ |
| `make_expected.py` | analysis.json から expected.json を作る。時刻は楽譜基準、音符番号は analysis.json のもの |
| `_diag_match.py` | 一致しない音の理由を切り分ける診断 |

## 使い方

```
cd music-analyzer
python tests/audit/run_audit.py            # 3層すべて。history/audit_<日付>.md
python tests/audit/run_audit.py --quick    # 段を減らして速く
python tests/benchmark_runner.py           # 回帰ベンチマーク (基準線との一致)
python tests/audit/offline_analyzer.py tests/cases/<case_id>   # 1ケースを本番経路で解析
```

Windows のコンソールで日本語が化けるときは `PYTHONIOENCODING=utf-8` を付ける。

## 2つの尺度を混ぜない

- **tests/audit/** が測るのは正しさ。正解は数式で決まる
- **tests/benchmark_runner.py** が測るのは基準線との一致。`expected.json` は解析器の過去出力から自動生成されたもの (`confidence: auto_generated`) なので、正解ではない。解析器を変えたときの意図しない変化を検知する用途

人の耳で検証した `expected.json` (`confidence: reviewed`) が揃えば、ベンチマークも正しさの尺度になる。

## 新しいケースを足すとき

1. `tests/cases/<performance_id>/` に `recording.wav` と `meta.json` を置く
2. `python tests/audit/fetch_case_inputs.py <performance_id>` で `analysis.json` と `params.json` を取り寄せる
3. `python tests/audit/make_expected.py <performance_id>` で `expected.json` を作る
4. 耳で確認した音があれば `expected.json` の `should_exist` / `review` を直し、`confidence: reviewed` にする

`analysis.json` がないと `comparison_result.json` から音符を復元するが、録音条件がわからず本番と違う結果になる (2026-09-06 に位置合わせが 11.14s → 0.62s にずれた)。必ず取り寄せる。

## 2026-09-06 時点の結論

- 静的な音程のずれは 0.2 セント以内で検出できている。検出器は疑わなくてよい
- 音の中で動く音程は、動く区間が音の 50% 未満なら報告値に出ない。原因は `_try_match_at` の「中央 80% の中央値 1 つ」という要約
- 合否ライン `PITCH_TOLERANCE_CENTS = 50` は仮値
