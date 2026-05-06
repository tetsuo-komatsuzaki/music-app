# 分析エンジン改善プラン

## 実装済み
- Improvement A: 10音ルックアヘッド（medium confidence マッチ用）
- Improvement A2: lookahead MISS時カーソル前進 + medium もカウント対象に変更（2026-04-12）
- Improvement A3: lookahead 対象0件時は受理する（2026-04-12）
- Improvement G: 相対インターバルベースのタイミング評価
- Improvement C: rest カーソル前進
- Improvement H: オクターブ補正廃止 + 探索範囲を duration×3 に短縮（2026-04-12）
- Improvement I: onset refinement — 窓内の変化点検出で det_start を補正（2026-04-12）
- Improvement J: 隣接音false positive防止 — medium match時にprev/next pitchとの距離比較（2026-04-12）
- Improvement J2: _detect_sound_end の許容範囲を PITCH_SEARCH→PITCH_TOLERANCE に変更（2026-04-12）
- Improvement K: 再同期ロジック — 連続not_detected後にカーソルを演奏位置に復帰（2026-04-12、部分実装）
- Improvement L: テンポスケール推定 — performance_duration/score_durationで時間軸を補正（2026-04-12、部分実装）
- Fix: section_missing メカニズムを削除（2024年）
- Fix: PracticePerformance テーブル対応（practice フラグ追加）（2026-04-12）
- Fix: not_detected時カーソル進行を演奏基準に変更（prev_detected + expected_gap）（2026-04-12）
- Fix: prev_detected_start/prev_score_start を high confidence のみ更新（ドリフト防止）（2026-04-12）
- Fix: 探索範囲に下限1.5s・上限3.0sを設定（2026-04-12）
- Fix: signed URL有効期限を300秒→3600秒に延長（2026-04-12）
- Fix: play()エラーハンドリング追加（2026-04-12）
- Fix: middlewareのbodyサイズ制限を50MBに拡大（2026-04-12）

## 未実装の既知課題

### Improvement H → 実装済み（2026-04-12）
解決方法を当初仮説から変更:
- オクターブ補正の廃止 + 探索範囲の短縮で根本解決
- 詳細は仮説ログ [2026-04-12] — octave_fold_false_match を参照

---

## 仮説ログ（PDCAサイクルで追記していく）

フォーマット:
```
---
### [YYYY-MM-DD] — [tag]
- 仮説: ...
- 根拠ケース: case_xxx
- 結果: 支持 / 部分支持 / 棄却
- 次のアクション: ...
---
```

---
### [2026-04-12] — octave_fold_false_match → 探索範囲問題
- 仮説: `fold_to_expected_octave` と `MAX_SEARCH_SEC=10秒` の組み合わせにより
  弾いていないA6(1760Hz)を11秒先のA5(880Hz)×2で「正解」と誤マッチする。
  カーソルが11.40sに飛び、以降のnote 10-18が全てnot_detectedになる。
- 根拠ケース: practicePerformance cmnv6euy20000z0jyz5minno2
- 結果: 支持
- 修正内容:
  1. `fold_to_expected_octave` を完全廃止（バイオリンでオクターブ間違いは起きない）
  2. `MAX_SEARCH_SEC=10秒` → `expected_duration × 3` に変更（弾いていない音で遠くの別の音を拾わない）
- 検証結果（同一音声で再シミュレーション）:
  - 修正前: note 9 誤マッチ → 下降部分8音中1音のみ検出
  - 修正後: note 9 正しくnot_detected → 下降部分9音全て検出

---
### [2026-04-12] — csharp_vs_c_pitch_detection
- 仮説: note_index 4 (C#5, 554Hz) が pitch_ok=False (cents=-100) なのは
  ユーザーがCナチュラル(523Hz)を演奏しているため。
  YIN検出値 522-525Hz は安定しており、ピッチ検出は正確。
  これは演奏側の問題（A major の第3音を半音低く弾いている）
- 根拠ケース: 同上ケース、t=4.0-4.8s のフレーム
- 結果: 支持（解析エンジン側の問題ではない）
- 次のアクション: なし（正しい判定）

---
### [2026-04-12] — lookahead_cascade_reject
- 問題: medium confidence マッチが先読み検証で不当に却下される
- 原因1: 先読みでMISS時にカーソルを動かさないため、1つの未演奏音の後の音が全て見つからず合致率が下がる
- 原因2: 先読みが high confidence のみカウントし、medium（音はあるがピッチずれ）を無視
- 原因3: 楽譜末尾の音は先読み対象が0件で rate=0 となり必ず却下
- 根拠ケース: cmnv6euy20000z0jyz5minno2 note 7,8,11,14,16-18 が不当に not_detected
- 修正内容:
  1. MISS時に `temp_cursor += next_dur` でカーソルを進める
  2. high だけでなく medium もマッチとしてカウント
  3. total_checked=0 の場合 rate=1.0（否定根拠なし → 受理）
- 検証結果: not_detected 8音 → 1音（弾いていないA6のみ）

---
### [2026-04-12] — onset_refinement (Improvement I)
- 問題: タイミング正解率が低い（63.2%）
- 原因: `find_note_segment` が1秒窓のmedianでマッチを判定し、窓の左端を det_start にする。
  窓の前半にまだ前の音が残っている場合、det_start が実際の音の開始より0.4-0.5秒早くなる。
  相対タイミング評価で前の音との間隔が短く計算され、start_ok=False になる。
- 根拠ケース: cmnvje6bd0000e8jydfc4f0h1
  - note 2 (E4): det=1.59s だが実際のE4開始は2.1s（窓前半はC#4）
  - note 8 (E6): det=7.47s だが実際のE6開始は7.9s（窓前半はC#6）
  - note 11 (C#6): det=10.37s だが実際のC#6開始は10.9s（窓前半はE6）
  - note 13 (E5): det=12.35s だが実際のE5開始は12.9s（窓前半はA5）
- 修正内容: `_refine_onset()` を追加。マッチした窓の中で期待ピッチが連続3フレーム以上
  現れ始める位置を探し、その時刻を det_start にする。
- 検証結果:
  - cmnvje6bd: timing 63.2% → 89.5%、pitch 57.9% → 84.2%、overall 60.0 → 86.3
  - cmnv6euy2: timing 84.2% → 94.7%、pitch 47.4% → 57.9%、overall 62.1 → 72.6

---
### [2026-04-12] — chromatic_false_positive (Improvement J)
- 問題: 半音階(C chromatic)で5小節目以降のほぼ全音が pitch_ok=False になる
- 現象: note 1 (C#4) の検出時刻(det=0.61s)で、音声はまだ C4(255Hz) が鳴っている。
  C4 と C#4 の差は141centsで PITCH_SEARCH_CENTS(200) 以内のため medium match が成立。
  以降の全ノートが1音分ずれてマッチし続ける。
- 根本原因: **「近い音」と「その音が鳴っている」は別**。
  medium match は「窓内のmedianが期待ピッチに近い」ことしか見ていない。
  窓内に期待ピッチのフレームが1つも存在しなくても、前の音のmedianが近ければマッチする。
  半音階では隣接音の差が約100centsしかなく、この誤検出が容易に起きる。
- なぜ _refine_onset で直らないか:
  窓内にC#4が一度も現れないため、変化点が存在しない。
  _refine_onset は「音が変わっている場合」に効くが、「音がまだ変わっていない」場合は効かない。
- 分類: false positive（誤検出）
- 修正方針:
  medium match 時に「窓内にそのピッチが実際に出現しているか」を確認する。
  窓内のフレームのうち、期待ピッチに近い(±PITCH_SEARCH_CENTS以内の)フレームが
  一定割合(MIN_PRESENCE_RATIO)以上存在しなければ reject する。
  ```
  if pitch_diff < threshold:
      if pitch_presence_ratio(target_pitch) < MIN_RATIO:
          return NOT_MATCH
  ```
- 根拠ケース: practicePerformance cmnvlc4h40000e8jyqb9hv9lo（C chromatic 2oct legato 低音域）
  - note 1: C#4(277Hz)を探索 → C4(255Hz)の区間で141cents差のmedium match → 誤検出
  - note 2以降: 1音ずれたまま49音中29音が pitch_ok=False
- 修正内容（2026-04-12 実装）:
  1. `find_note_segment` に prev/next_expected_pitch を渡す
  2. medium match 時、median が前の音または次の音のほうに近ければ reject してスキャン継続
  3. `_detect_sound_end` の許容範囲を PITCH_SEARCH_CENTS(200) → PITCH_TOLERANCE_CENTS(50) に変更
     （半音差の次の音を「同一音」として追跡してカーソルが飛び越える問題を防止）
- 検証結果:
  - 半音階: pitch 40.8% → 93.9%, not_detected 0→2, overall 42.0→84.9
  - アルペジオ1: 変化なし（86.3）
  - アルペジオ2: 変化なし（72.6）
- 影響範囲: 半音階で顕著。全音階でも隣接音の差が小さい箇所で起きうる。

---
### [2026-04-12] — tempo_scale_and_resync (Improvement K + L)
- 問題: 楽曲「糸」(310音)で not_detected=275/310。音階・アルペジオでは正常。
- 原因分析:
  1. 楽譜BPM=60(214秒)だが、演奏は128.8秒（約1.66倍速）。テンポが大幅に異なる。
  2. カーソルが楽譜テンポで進むため、演奏位置からどんどん離れていく。
  3. 探索範囲 duration×3 では短い音符(0.25秒)で0.75秒しか探せず、テンポずれに対応不能。
- 実装内容:
  - Improvement L: time_scale = performance_duration / score_duration を算出し、
    expected_duration, score_interval, rest_dur, expected_gap に一律適用。
    performance_durationはfirst_sound〜last_soundで算出（前後無音を除外）。
  - Improvement K: RESYNC_AFTER_MISS=3回連続not_detected後に再同期を試みる。
    RESYNC_CONFIRM_COUNT=2音連続マッチで確定。RESYNC_MAX_JUMP=1.2秒。
    ±40cents以内、high or medium confidence必須。
  - 探索範囲: max(duration×3, 1.5)、上限3.0秒。
  - not_detected時カーソル: prev_detected + expected_gap（演奏基準）にフォールバック。
  - prev_detected_start: high confidenceのみ更新（ドリフト防止）。
- 検証結果:
  - 半音階: pitch 95.9%, timing 69.4%, not_det=2（維持）
  - アルペジオ1: pitch 84.2%, timing 78.9%, not_det=1（微変動、許容範囲）
  - アルペジオ2: pitch 52.6%, timing 73.7%, not_det=2（微変動）
  - 糸: not_det=288→287（ほぼ改善なし）。resync発火3回のみ。
- 未解決の課題:
  - 糸のような長い楽曲で、短い音符が密集している場合にnot_detectedが大量発生。
  - time_scaleは固定値で、演奏中のテンポ揺れには対応できない。
  - resyncのmax_jump=1.2秒ではテンポずれが大きい場合に追いつけない。
  - 根本的に、楽曲解析にはカーソルベースの逐次探索ではなく、
    DTW（Dynamic Time Warping）等のグローバルアライメント手法が必要な可能性がある。
- 次のアクション候補:
  1. 局所テンポ推定（直近N音の検出結果からローカルtime_scaleを更新）
  2. resyncのmax_jumpを動的に（連続miss数に応じて段階的に拡大）
  3. DTW導入の検討（計算コストと精度のトレードオフ評価）

<!-- 仮説ログはここから下に追記する -->
