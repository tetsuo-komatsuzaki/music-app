# 分析エンジン改善プラン

## 実装済み
- Improvement A: 10音ルックアヘッド（medium confidence マッチ用）
- Improvement G: 相対インターバルベースのタイミング評価
- Improvement C: rest カーソル前進
- Fix: section_missing メカニズムを削除（2024年）

## 未実装の既知課題

### Improvement H（最優先）
優先度: 高
確度: 中

#### 症状
medium confidence マッチの直後からカーソルがずれ始める
→ 以降の音符が全て not_detected または wrong_note になる

#### 観測ケース
（fetch_case.py で取得したケースをここに追記する）

#### 仮説
1. `_detect_sound_end()` がピッチシフト音符で過大な終点を返す
2. lookahead でのマッチ選択が正しくても
   カーソル前進量が `expected_duration` より大きくなる

#### 推奨修正
medium マッチは `_detect_sound_end()` の値ではなく
`expected_duration` でカーソルを前進させる

#### 検証方法
benchmark で `cascade_failure_count` と `onset_p95` の変化を見る

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

<!-- 仮説ログはここから下に追記する -->
