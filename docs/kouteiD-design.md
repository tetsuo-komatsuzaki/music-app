# 工程D 実装設計書：判定（達成・マスター・Star）

作成: 2026-07-11 ／ 論点1〜5 Tetsuo確定済 ／ 根拠: spec§1（2026-07-06改定・ロック済）・工程E崩壊小節・工程C診断基盤

---

# 0. 目的

上達ループ「弾く→弱点がわかる→練習する→**弾けると認定される**→次へ」の最後のピース。
確定済みの2段判定思想（達成=スコア不問／マスター=平均90）を実装し、旧スコア一辺倒の判定を退役させる。

**判定ルール（spec§1・ロック済のため再決定しない）:**
- 曲の達成 = ①技術タグ+習得系特徴タグの学びレッスン全クリア ②エチュード要件（最多カバー同難度1つ達成・無ければ免除） ③3回×崩壊小節ゼロ
- 教材の達成 = 3回×崩壊小節ゼロ／学びレッスンクリア = 有効演奏3回（崩壊条件なし・最も緩い）
- マスター = 達成 + 直近5回平均90（masteredAt刻んだら消さない）
- Star昇格 = 同★で10曲達成

# 1. 確定論点（2026-07-11 Tetsuo）

| # | 論点 | 決定 |
|---|---|---|
| 1 | 学びレッスン未制作（27本コンテンツなし） | **レッスン未登録のタグは要件①から自動除外**（§1-4の在庫フォールバックと同思想）。登録した瞬間から以後の判定で有効。遡及なし |
| 2 | 記録テーブル | **学びレッスン=PracticeItem新カテゴリ`lesson`**（既存パイプライン全再利用・教えるタグ=教材自身のタグ）＋新テーブル4: UserLessonClear / UserScoreAchievement(achievedAt+starAtAchievement+masteredAt) / UserPracticeAchievement / UserStarProgress。**既存の旧記録テーブルは流用しない**（意味が違う・旧UI参照中） |
| 3 | 実行場所と3回の数え方 | **loop_engine演奏完了時（診断ステップ直後・SAVEPOINT隔離）**。3回=**累計3回**（崩壊してもリセットしない。安定性の証明はマスター側の役割）。マスターは達成後の演奏ごとにavg90チェック |
| 4 | 旧判定の退役 | **3段階**: ①旧課題カード生成=D同時停止（ENABLE_LEGACY_CARDS=false・消費UIはC-6aで消滅済） ②旧マスタリー/グレード進行=D並走→C-6bのUI切替後に停止 ③旧テーブル/旧API削除=C-6b。付随: 曲マスター進捗トラッカーの条件表示を新体系に最小改修（旧カード数0/0で達成済みに見える壊れ防止） |
| 5 | 過去演奏 | 達成カウント=**v65以降のみ（前向き）**。**診断バックフィルは実施（案B）**: 過去85演奏に診断バッチ一括適用（累積弱点/窓②を初日から実データ化）。達成記録はバックフィルで作らない |

# 2. データ設計（全て追加のみ）

```prisma
enum PracticeCategory { ... lesson }  // 追加

model UserLessonClear {      // 学びレッスンクリア（永続・一度きり・難易度非依存）
  id String @id @default(cuid())
  userId String
  tagType String             // "technique" | "position" | "double_stop"
  tagKey  String             // TechniqueTag.name / "position:3" / FeatureTag名("3度"等)
  lessonItemId String?       // クリアに使ったlesson教材（差替え耐性のためnull可）
  clearedAt DateTime @default(now())
  @@unique([userId, tagType, tagKey])
}

model UserScoreAchievement { // 曲の達成/マスター（永続・遡及なし）
  id String @id @default(cuid())
  userId String
  scoreId String
  achievedAt DateTime @default(now())
  starAtAchievement Int      // Star昇格の集計キー
  masteredAt DateTime?       // 達成+avg90成立時に刻む（消さない）
  achievedPerformanceId String?  // 達成を確定させた演奏（お祝いUI用）
  @@unique([userId, scoreId])
}

model UserPracticeAchievement { // 教材の達成（エチュード要件・レッスン判定の材料）
  id String @id @default(cuid())
  userId String
  practiceItemId String
  achievedAt DateTime @default(now())
  @@unique([userId, practiceItemId])
}

model UserStarProgress {     // Starの現在地
  userId String @id
  currentStar Int @default(1)
  updatedAt DateTime @updatedAt
}
```

- クリーン演奏回数は都度 `analysisSummary.diagnosis.collapse.is_clean` をCOUNTして得る（v65以降の演奏のみ持つ=論点5と自然に整合）
- レッスンの有効演奏回数 = PracticePerformance の採点成功数（analysisStatus done）

# 3. 判定エンジン（music-analyzer/lib/achievement.py）

loop_engine step 5.6（診断5.5の直後・同トランザクション・SAVEPOINT隔離・失敗は警告のみ）。

**practiceモード（教材/レッスン演奏後）:**
1. 教材達成チェック: この演奏がclean → 累計clean回数≥3 かつ 未達成 → UserPracticeAchievement INSERT
2. category=lesson の場合: 有効演奏累計≥3 かつ 未クリア → 教材のタグ（TechniqueTag/FeatureTag/positions）ごとに UserLessonClear INSERT

**scoreモード（曲演奏後）:**
1. clean累計≥3 チェック
2. 要件①: 曲の技術タグ+習得系特徴タグを列挙 → lesson教材在庫のあるタグに絞る（論点1フォールバック） → 全て UserLessonClear 済みか
3. 要件②: エチュード解決（§4）→ 対象があれば UserPracticeAchievement 済みか（無ければ免除）
4. 全成立 かつ 未達成 → UserScoreAchievement INSERT（starAtAchievement=Score.star）
   → Star昇格チェック: 現在★の達成数≥10 → UserStarProgress.currentStar+1
5. マスター: 達成済み かつ masteredAt null かつ 直近5回平均 overallScore≥90 → masteredAt=NOW()

# 4. エチュード要件の解決（決定関数）

対象 = category=etude かつ star=曲のstar のうち、曲の技術タグとの共有数最大 → 同数なら調号一致 → なおも同数ならテンポ近い → 0件なら免除。
曲の技術タグ0個の場合はエチュード要件なし（免除）。判定時に都度クエリ（教材追加が即反映・凍結した割当を持たない）。

# 5. トラッカー最小改修（壊れ防止）

新API `GET /api/scores/[scoreId]/achievement-status`:
`{ lessons: {cleared, total, items[]}, etude: {required, title?, achieved?} | null, cleanRuns: {count, required:3}, achieved, mastered, recentAvg }`
ScoreLoopDetail「🏆 曲マスターまで」を新条件（レッスンx/y・エチュード・通し x/3・平均90）に差替え。バッジ/スキルツリー等の本格UIはC-6b。

# 6. 診断バックフィル（scripts/backfill_diagnosis.py）

過去演奏（Performance85+PracticePerformance1）に対し comparison_result+karte を取得して diagnose() を実行、
save_performance_diagnosis + bump_user_subtask_counters を適用。dry-run既定/--apply。
**達成記録は作らない**（判定は前向きのみ）。既に diagnosis を持つ演奏はスキップ（v65以降の二重加算防止）。

# 7. コミット/デプロイ計画

| # | 内容 | 承認ゲート |
|---|---|---|
| D-1 | schema+migration（enum lesson+新4テーブル） | **prisma migrate deploy は Tetsuo 実行許可** |
| D-2 | achievement.py + loop_engine統合 + ENABLE_LEGACY_CARDS=false | Cloud Run **v67** デプロイ承認 |
| D-3 | エチュード解決（D-2に同梱） | — |
| D-4 | achievement-status API + トラッカー改修 | push（Vercel）承認 |
| D-5 | 診断バックフィル | dry-run報告 → apply承認 |

# 8. リスク

| リスク | 対策 |
|---|---|
| 判定バグで誤達成が永続 | E2E: 実演奏で3回clean→達成→star集計を rollback 検証してからデプロイ。SAVEPOINT隔離 |
| lesson enum追加で既存UI崩れ | 教材一覧はカテゴリ定数配列駆動（practiceConstants）= lesson を配列に足すまで非表示。管理UIのみD-1で対応 |
| 旧カード停止の副作用 | env フリップのみ=即復旧可。カード消費UIはC-6aで置換済みを確認済み |
| バックフィルの二重加算 | diagnosis既存チェックでスキップ+dry-run検証 |
