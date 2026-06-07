# 奏法品質判定 仕様（2e 第二段階）

作成 2026-06-07 / 対象 = `*_technique_*` スキルの「正しく弾けて定着したか」のクリア判定。

## 0. なぜ作るか（背景）

現状の 2e（commit 3ceeb93 / analyzer v53）は奏法音符を**ピッチ/リズムでしか採点していない**。
スタッカートをベタ弾きしても、音程とタイミングが合えば OK＝クリアになってしまう。
本仕様は「奏法そのものが楽譜マーク通りに弾けているか」を測ってクリア条件に足す。

## 1. 前提検証（実データ／実コードで確認済み 2026-06-07）

| 確認項目 | 結果 | 出典 |
|---|---|---|
| analysis.json の奏法情報 | `articulations`(music21クラス名), `is_tremolo`, `is_trill`, `dynamic`, `start_time_sec`, `end_time_sec`, `pitches` | `analyze_musicxml.py:307,378` / 実ファイル |
| comparison_result.json（**現行**）の音符フィールド | `detected_start_sec`, `pitch_ok`, `start_ok`, `start_diff_sec`, `pitch_cents_error`, `expected_start/end_sec`, `expected_pitch_hz` のみ | `_make_result` `analyze_performance.py:1404-1428` |
| **実音の終了時刻 / 実音長** | **現行出力に無い**（`detected_end_sec` を出していない） | 同上 |
| ただし内部計算は存在 | `_detect_sound_end()` が `seg_end`(=actual_end) を算出済み。`_make_result` で捨てている | `analyze_performance.py:473`, 1003 `actual_dur = seg_end - seg_start` |
| 古い comparison_result_latest.json に end がある件 | **2026-05-06 版の残骸**（コードは 05-27 更新で end 出力を削除済み）。誤解の元なので無視 | mtime 比較 |
| オンセット検出 | `librosa` spectral flux で全体オンセット列 `onset_times` を生成済み（evaluate_notes に渡っている） | `analyze_performance.py:251-266,1002` |
| 音量 | analysis.json に楽譜上の `dynamic`、comparison 側に実音量は**無い**（IntegratedNote.avg_volume_db は未充填） | 実ファイル |

**結論**: 奏法品質を測る土台（実音長・オンセット列）は解析内部に既にある。
ボトルネックは「`_make_result` が `seg_end` を出力していない」一点。ここを開ければ大半の奏法が測れる。

## 2. 設計方針

- **2軸クリア制**にする: 奏法スキルのクリア = ①従来の音程/リズム OK ∧ ②**奏法実演 OK**。
  - ①はそのまま（音を外していたら奏法以前）。②を新設。
- ②奏法実演 OK の判定は「楽譜マークが要求する弾き方の特徴量」を実演から測り、閾値判定。
- スコア化・発火・クリアは既存ルール踏襲（点=OK割合、発火=対象3個以上∧70未満、
  クリア=該当SubTask全クリア∧中項目≥70）。②を OK 条件に AND で足すだけ。
- **音色（倍音・ノイズ）には踏み込まない**。時間領域の特徴量（音長・オンセット密度・
  ピッチ交替）に絞る。音色判定は引き続き後回し（[[project_subtask_quality_judgment_deferred]]）。

## 3. 奏法別 測定軸（第一弾＝今のデータ＋seg_end で測れるもの）

`dur_ratio = 実音長 / 期待音長 = (seg_end - seg_start) / (expected_end - expected_start)`

| 奏法 | ②奏法OKの測り方 | 必要データ | 第一/二段階 |
|---|---|---|---|
| **staccato** | `dur_ratio ≤ Ts`（短く切れている。目安 Ts≈0.5） | seg_end | 第一（seg_end 出力で可） |
| **spiccato** | staccato 同様 `dur_ratio ≤ Ts` ＋ 連続音で音長が均一 | seg_end | 第一 |
| **portato** | `Tp_lo ≤ dur_ratio ≤ Tp_hi`（切るが切りすぎない。スラー内で軽く分離） | seg_end | 第一 |
| **tremolo** | 音符区間 `[seg_start,seg_end]` 内のオンセット数 ≥ N（小刻みに反復） | onset_times＋seg_end | 第一（オンセット列を音符単位で集計する出力追加） |
| **trill** | 音符区間内でピッチが主音↔上補助音を高速交替（cents 時系列のジグザグ回数 ≥ N） | f0時系列の区間集計 | **第二**（ピッチ時系列の区間特徴量を新規出力） |
| **pizzicato** | 立ち上がり鋭く急減衰（アタック後すぐ減衰、`dur_ratio` 小＋エンベロープ） | seg_end＋RMS包絡 | **第二**（音量包絡の出力追加。撥弦は音程検出自体が不安定な点も注意） |

### スケルトン据置（理由は2グループ。music21 クラス実在を確認済み 2026-06-07）

**グループA: 楽譜に専用マークが無い → 対象を一意に絞れない（martele / hooked_staccato / ricochet）**
- music21 に該当クラス無し（確認: `articulations.Martele/HookedStaccato/Ricochet/Jete` 全て False）。
- 楽譜上は accent / スラー＋スタッカート / テキスト記号で表され、機械的に一意判定不可。
- 品質の本質も音色・弓動作領域（martele=アタックの鋭さ, hooked=弓の向き＝同一弓2音,
  ricochet=弓の跳ね）で、時間領域特徴（音長・オンセット）では測れない。
- → 対象絞り・品質判定の両方で手段が無い。据置。

**グループB: マークはあるが articulations 外で未抽出（glissando / arpeggio）**
- glissando = `spanner.Glissando`（スラーと同じ spanner、確認: True）。
  arpeggio = `expressions.ArpeggioMark`（確認: True、articulations ではない）。
- 現 2e 検出器は `element.articulations` と is_tremolo/is_trill しか見ず、両者を拾えない。
- → analyze_musicxml 側で spanner/expression を抽出し analysis.json に出す改修が前提
  （スラー対応と同種の工事）。それをすれば対象は絞れる。品質判定はその後の別設計。

### 別管理（本仕様の対象外）
`harmonic`（pitch_harmonic / bowing_technique_harmonic）は 2a（commit 6bfd4c5）で
実装済み。articulations.Harmonic で対象を絞り、ピッチ＋presence 純度で判定する。
本仕様（時間領域の奏法品質）とは別軸なので対象外。

### 奏法スキル全量（確認用 = sub_task 20 / 奏法名 12）
rhythm 9: martele, staccato, spiccato, ricochet, tremolo, portato, trill, arpeggio, glissando
bowing 11: staccato, hooked_staccato, spiccato, ricochet, pizzicato, tremolo, portato,
           trill, arpeggio, glissando, harmonic
（pizzicato/harmonic は bowing のみ、martele は rhythm のみ）

## 4. 必要な解析側改修（段階）

**段階1（最小・効果大）— seg_end 出力**
- `_make_result` に `detected_end_sec`(=seg_end) を追加。`expected_end_sec` は既出力。
- IntegratedNote に `detected_end_sec` 復活（v3.2.2 で消したものを再追加）＋
  `dur_ratio` 派生プロパティ。
- これだけで staccato / spiccato / portato の②が判定可能になる。

**段階2 — オンセット密度出力**
- evaluate_notes で各音符区間内の `onset_times` 件数を集計し、音符結果に `onset_count_in_note` を出力。
- tremolo の②が判定可能に。

**段階3 — ピッチ/音量の区間時系列特徴**
- trill（ピッチ交替回数）, pizzicato（RMS 包絡）用。出力追加コスト中〜大。後続 PR。

## 5. 閾値（要チューニング・実データで調整）

| 記号 | 意味 | 暫定 | 決め方 |
|---|---|---|---|
| Ts | staccato/spiccato 上限 dur_ratio | 0.5 | 実演サンプルで分布を見て調整 |
| Tp_lo/Tp_hi | portato 範囲 | 0.5〜0.85 | 同上 |
| N_trem | tremolo 最小オンセット数/拍 | 拍あたり3 | 楽譜の tremolo marks 数から導出も検討 |
| N_trill | trill 最小交替回数 | 区間で4 | 同上 |

**注意**: 全て「テンポガイド前提」「奏法を含む実演サンプルが無いと決まらない」。
→ 着手前に staccato/tremolo を含む教材を1曲アップロードし、dur_ratio 等の実分布を取ってから閾値確定（[[feedback_spec_premise_verification]]）。

## 6. クリア判定への結線

- SubTaskResult の OK 判定（`_judge_technique` の is_bad）を「①pitch/timing bad **or** ②technique bad」に変更。
- ②technique bad は奏法別の上記閾値で算出。対象音符は現状の検出器（articulations/flags）で絞る（変更不要）。
- 中項目集計・カード発火・mastery 結線は既存のまま（[[project_skill_scoring_firing_spec]]）。

## 7. 実装順（提案）

1. 段階1（seg_end 出力 + IntegratedNote.detected_end_sec/dur_ratio）→ staccato/spiccato/portato の②実装・閾値仮置き。
2. 奏法を含む教材を1曲投入し、dur_ratio 実分布で Ts/Tp 確定。
3. 段階2（onset_count_in_note）→ tremolo の②。
4. 段階3 → trill / pizzicato（必要なら）。
5. glissando/arpeggio は楽譜マーク抽出から別途。

## 8. やらないこと（明示）

- 音色そのもの（倍音構成・ノイズ・弓の毛の当たり）の品質評価。
- martele/hooked_staccato/ricochet の自動判定（確実な特徴量が無い）。
