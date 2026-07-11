# 工程C 実装設計書：第三層 55→217置換（課題化・推薦のクエリ化）

作成: 2026-07-10 ／ 承認ゲート対象 ／ 根拠: 議事録§26-4/§26-5・検出方法設計書v1.1・β伝達文v1.0・spec§3・影響調査(2026-07-06)

---

# 0. スコープと現在地

**やること**: 演奏の弱点分析を「55固定小課題」から「217小課題カタログ＋決定関数」体系へ置換する。
工程A/Eで材料は全て揃った:
- 層1 = note_karte（全音符の属性＋遷移・弦/ポジ/信頼度）… 工程A
- 層2 = comparison_result（無変更・performancesバケット）… 既存
- 結合 = expanded_index_map（演奏順→カルテ。282/287で構築済）… 工程A-5
- 崩壊小節 = collapse_detector … 工程E

**v1発火範囲**（§26-4確定）: 音程の木63＋リズムの木80＝**143小課題**（β伝達文の監修済143と1:1）。
音色の木74は右手検出未実装のため**定義のみ**（発火不能）。

# 1. コミット分割

| # | 内容 | 成果物 |
|---|---|---|
| C-1 | **小課題カタログ正本**（217定義の単一ソース） | `subtask_catalog.json` ＋ Py loader ＋ TS同期 |
| C-2 | **診断エンジン**（決定関数→集計→top-2） | `lib/diagnosis.py`（単体＋実演奏検証） |
| C-3 | **保存**（演奏ごと診断＋ユーザー蓄積） | Performance.skillSubScores新形式／UserSkillSubScore流用 |
| C-4 | **loop_engine統合**（演奏後パイプライン組込・note_karte読み手移行） | loop_engine_runner改修＋デプロイ |
| C-5 | **弱点練習の推薦**（小課題→教材マッチのクエリ化） | 推薦ロジック（FeatureTag/positions/技術タグ使用） |
| C-6 | **フロント切替**（API/UI 27ファイル） | 段階切替（§5） |

# 2. C-1: カタログ正本（二重定義問題の解消）

**現状の問題**: 55 IDが Py 3箇所＋TS 1箇所の計4箇所に重複定義（追加時全同期必須という既知の地雷）。

**方針**: 正本を**1つのJSONファイル**にする。
- 置き場所: `music-analyzer/lib/subtask_catalog.json`（Pythonが直接読む）
- TS側: 生成スクリプトで `app/_libs/subtaskCatalog.ts` を自動生成（手書き禁止）＋**同期テスト**（両者のID集合一致をCI的に検証するスクリプト）

**カタログの1エントリ**:
```json
{
  "id": "pitch_shift_1_3",            // 機械ID
  "tree": "pitch",                     // ミス大分類: pitch | rhythm | timbre
  "problem": "position_shift",         // ミス問題(17)のキー
  "name": "隣接上行・跳躍（1→3ポジ）",  // 表示名（β伝達文の項目名と対応）
  "v1_active": true,                   // 音色74は false
  "advice_key": "D-jump-up-adjacent"   // β伝達文(観察/原因/アドバイス)への対応キー
}
```
**内訳**（§26-4の粒度で機械展開）:
- 音程63 = D.ポジション移動25（起点×終点5×5）＋ E.重音12（種別6×連続/単発）＋ F.技術タグ13 ＋ G.音程移動 粗13
- リズム80 = b.音価7 ＋ c.リズムパターン4 ＋ f.入り6 ＋ h.技術タグ13 ＋ j.音程移動13 ＋ k.重音12 ＋ l.ポジション移動25
- 音色74 = 全て v1_active=false
- 音程移動の詳細層236は**カタログ外**（詳細表示・複数曲集計専用。診断に使わない＝§26-4）

# 3. C-2: 診断エンジン（lib/diagnosis.py）

**入力**: comparison_result.results＋note_karte（notes/expanded_index_map）
**処理**（§26準拠・全て決定関数＝独立した割り振り工程なし）:
1. ミス音符の特定: pitch_ok=False → 音程の木／start_ok=False → リズムの木（両方NGなら両木に独立カウント）
2. 対応表で層1カルテを引き、**決定関数**で小課題タグを導出:
   - D/l ポジション移動: position_from×position_to（低信頼(confidence="low")の音は除外＝§25 A案）
   - E/k 重音: chord_intervals×連続/単発
   - F/h 技術タグ: karte.technique_tags（13と1:1）
   - G/j 音程移動: 弦遷移区分(string_change_kind: same/adjacent/skip)×方向(interval_degree符号)×距離(順次=2度以下/跳躍=3度以上)＋移弦ユニゾン
   - b 音価: note_type/is_dotted ／ c 連符: is_tuplet(actual数) ／ f 入り: rest_before_beats(短≤8分/中/長≥全)×拍表裏(is_on_beat)
3. 小課題ごとに発生数を集計（1ミス＝複数タグ可）。分母（全音符の小課題所属数）も層1から算出
4. **診断 = 各木の発生数上位2つ**（最大6・v1は音色伏在で実質最大4）
5. 崩壊小節（工程E）も同じ結合レコードから同時算出して同梱

**出力（診断JSON）**:
```json
{
  "version": 1,
  "per_subtask": {"pitch_shift_1_3": {"miss": 4, "target": 10}},
  "diagnosis": {"pitch": ["pitch_shift_1_3", "double_3rd_consecutive"], "rhythm": [...]},
  "collapse": {"collapsed": [...], "is_clean": true},
  "map_available": true      // 対応表なし(5件)の曲は per_subtask を出さず曲全体のみ
}
```

# 4. C-3: 保存

- **演奏ごと**【2026-07-11 安全側に変更】: `Performance.analysisSummary`（既存Json?列・「将来の拡張用」として設計済み）に
  `{"diagnosis": {...}}` を**追記マージ**で保存。`skillSubScores` 列（旧55形式・旧UIが参照）には一切触れない
  ＝旧画面が新形式で壊れるリスクをゼロにする。PracticePerformance も同様。新UI(C-6)は analysisSummary.diagnosis を読む。
- **ユーザー蓄積**: `UserSkillSubScore`（既存テーブル）を**217のIDで流用**（skillSubTaskId は String なので migration不要）。matchedCount/totalCount/matchRate の意味は維持（小課題=matched、対象音数=total）。旧55のIDの行は残置（読み手が新IDのみ参照・遡及なし原則）。
- 旧 SkillTaskCard/SubTask/SubTaskAssignment は当面**凍結**（新規生成停止・既存は表示のみ）。課題カードの新体系は工程D（達成/判定）とUI刷新で再設計。

# 4.5. C-5: 弱点練習の推薦【2026-07-11 Tetsuo承認・論点1〜5確定】

**実装**: `app/_libs/weaknessRecommendation.ts`（TSオンデマンド計算=案A）＋ 診断側改定（diagnosis.py version 2）

**診断の選出ルール改定（version 2）**:
1. top-2は**ミス率順**（ミス数順を廃止。広い箱が母数で勝つ構造を排除）。対象<3音は足切り
2. **「変化なし箱」は診断出力から除外**: 同一ポジ内(X→X)10個＋同一弦×順次4個（カウント/累積は継続）。
   同弦×跳躍は残す（指の跳躍=実技能）。音価は全部残す（どの音価でぶれるかはリズムの重要情報）
3. **miss_patterns同梱**: ミス音符の4軸組（音程=ポジ移動×移弦×指移動×技術 / リズム=ポジ移動×移弦×音価×技術）。
   診断には使わず累積の詳細傾向分析用（§26-4詳細層の思想）。1木30パターン上限
4. 正本カタログv2に `diagnosable` / `material_query` フィールド追加（単一ソース原則・手書き対応表禁止）

**推薦ルール**:
- 小課題ID→教材検索はカタログの material_query（優先順リスト: feature/technique/category/basic）
- **ポジション・技術タグは前提条件**: ポジションは候補絞り込み（0件なら緩める）。4分以上の音価は基礎フォールバック（音階）
- 順位付け: ①star近い→②調一致→③テンポ近い（エチュード推薦と同ルール）。多様化ルールなし（診断は正直に）。教材IDはスロット間dedup
- 窓②累積: 対象音数≥10で足切り（少数サンプル暴発防止）、star基準=演奏実績曲の最高star（工程Dで達成記録に置換）
- **練習済み除外はv1から除外**（旧マスタリー記録は新基準と意味が違い誤除外リスク）→ excludeSubtaskフックのみ用意、工程Dで結線

**性能実測（2026-07-11・本番DB）**: 在庫全量+タグJOIN=444行12ms→キャッシュ後0.01ms、窓①=1.4ms、窓②=104ms。
事前計算(案B)はanalysisSummary読み(≒10ms)が必要で速度差なし＝鮮度・チューニング性で案A確定。

# 5. C-6: フロント切替（27ファイル）の段階戦略

一括置換はリスク過大。**エンジン先行・UI後追い**の2段:
- 第1段（工程C内）: Python側を217化し、新形式データを**書く**。旧UIは旧データのまま表示（凍結・壊れない）
- 第2段（工程D/UI工程）: 診断表示・課題カード・推薦UIを新形式で刷新し、skillMaster.ts の55定義を削除

## 5.5. C-6a 実装済【2026-07-11 Tetsuo承認・決定反映】

**スコープ分割**: C-6a=診断・推薦の表示（工程D/I非依存） / C-6b=課題カード・バッジ・スキルツリー・アドバイス文・旧系完全撤去（D/I後）

**確定決定**:
- 新旧は**併存でなく置換**。カードは**中間型**（弱点見出し+内訳一言、教材=タイトル+★・調+[練習する →]）
- 弱点なし=「完璧な演奏です！」（境界: 診断空+崩壊ゼロ+総ミス率**10%以下**。超えたら「特定の弱点は見つかりませんでした」）
- 在庫ゼロ=「教材準備中です」（旧MissingFlag表示の代替）
- 曲詳細の課題カード（上達ループタブ）=「この曲から生じた課題」として**最新演奏の診断+推薦リンク**に中身置換
- API=**新ルート並走方式**（旧skill-detailは触らない。理由: デプロイ中の新旧JS混在安全+ロールバック一手。旧ルートはC-6bで削除）

**実装**:
- API: `/api/performances/[id]/diagnosis`・`/api/practice-performances/[performanceId]/diagnosis`・`/api/users/[userId]/weakness`＋整形層 `app/_libs/diagnosisPresentation.ts`（verdict判定・miss_patterns→内訳文生成: 共起6割以上のみ発言）
- UI: `app/components/WeaknessDiagnosisCard.tsx`（窓①カード/窓②パネル/スロット共通表示）
- 置換3箇所: PerformanceSkillDetail（旧ImprovementGuideCard→新カード。気になる箇所ジャンプは旧アドバイス内表示だったため一緒に退役・データ温存）／ScoreLoopDetail（旧SkillTaskCard群→最新演奏の新カード。曲マスター進捗トラッカーは工程Dまで温存）／home.tsx TodayPanel（旧challengeName→累積弱点パネル。弱点なし時は従来の「次の曲にチャレンジ」）
- 崩壊小節はAPIに含むがC-6aでは未表示（ユーザー向けの役割は工程Dの達成判定で確定するため）

# 6. 承認ポイント

1. カタログ正本＝単一JSON＋TS自動生成＋同期テスト（4箇所地雷の解消）
2. 保存＝既存列/テーブルを新IDで流用（migration不要・旧データ残置・遡及なし）
3. 旧課題カード（SkillTaskCard等）は新規生成停止・凍結（新カードは工程Dで）
4. フロントは第2段後追い（工程C中は旧UI表示を維持）
5. v1発火＝143（音程63＋リズム80）、音色74は定義のみ

# 7. リスク

| リスク | 対策 |
|---|---|
| 決定関数の粒度ミス（例: G音程移動の分類誤り） | β伝達文143の名前と1:1で照合するテスト＋実演奏でtop-2の妥当性を目視 |
| 対応表なし5曲 | map_available=false で per-note診断スキップ（曲全体のみ）＝設計済 |
| 旧UIが新データで壊れる | 書き込みは新keyのみ追加・旧keyの形は触らない（versionキーで判別） |
| loop_engine改修の回 regression | 演奏→診断のE2Eを実演奏3件で検証してからデプロイ |
