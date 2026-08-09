# 祝い体験（マイルストーン祝賀）設計書 — Option A

- 対象アプリ: Arcoda（Next.js 16 App Router / React 19 / Prisma 7 + Supabase / 解析=Cloud Run Python）
- 作成: 2026-07-25
- ステータス: 要件確定・実装前
- スコープ: **A（詳細画面での節目祝い）＋ 記念カード画像共有MVP ＋ 本棚（記録）画面**
- リリース方針: **単一リリースで完結・スキーマ変更ゼロ・単一フラグ `CELEBRATION_ENABLED` で即ロールバック**（8章）

---

## 1. 目的・背景

**核の1ループ（録音→解析→結果）の“感情報酬”を上げる**のが狙い。現状の録音直後オーバーレイ（[ArcoResultOverlay.tsx](../app/components/ArcoResultOverlay.tsx)）は絶対点数中心で「採点表」的であり、**「今日、前より上手くなった」という即時報酬**と**節目の“ハレ”演出**が弱い。

本設計は、**節目を新規に超えた瞬間だけ**、別格の「祝いオーバーレイ」を差し込み、記念カードを残す／家族に送れるようにする。

### 対象の節目
| 節目 | 定義 | 強さ |
|---|---|---|
| ✨ 達成 | 学びレッスン＋エチュード＋崩壊ゼロ通し3回（点数不問） | 全画面（大） |
| 🏆 マスター | 達成＋直近5回の演奏スコア平均90以上 | 全画面（大） |
| ⭐ ランクアップ | 同★の達成曲数が10に到達 → currentStar+1 | 全画面（最大・2段目） |
| 📈 自己ベスト更新 | 今回スコア > 過去最高 | 中 |
| 🏅 課題クリア | **教材の直近5回平均90に新規到達**（累計≥5） | 中 |

---

## 2. スコープ

### In（A）
1. 解析時に「この演奏で新規に超えた節目」を判定し、フロントが読める場所へ保存
2. 録音直後（詳細画面にいる時）に祝いオーバーレイを発火
3. 記念カード画像を生成し「家族に送る」＝Web Share（画像MVP）
4. 「記録を見る」＝本棚（新規ページ）で達成/マスター曲を記念カード一覧

### Out（後段）
- **B**: どの画面にいても発火（グローバル監視 ＋ 割り込みしないバナー ＋ DB `celebratedAt`）
- **C**: アプリを閉じていてもPush（Service Worker）
- 録音音声つき共有（公開再生リンク・トークン・アクセス制御）
- 月次成長レポート等

---

## 3. 現状アーキテクチャ（調査で確認済みの事実）

### 3.1 解析は非同期・完了はポーリング検知
- 録音 → 署名URLでアップロード → `uploadAction` が**Cloud Run解析を非同期起動**（status: queued→processing→done）
- 詳細画面が**3秒ごとにポーリング**（[scoreDetail.tsx:1210](../app/[userId]/scores/[scoreId]/scoreDetail.tsx#L1210)）。長い曲・コールドスタート・OOMリトライで**数秒〜分**かかり得る
- 完了検知の受け皿は既存：`justRecordedRef` ＋ `sessionStorage("arcoPending")` で「今録音した演奏がdoneになった瞬間」を検知して結果オーバーレイを表示（[scoreDetail.tsx:1474](../app/[userId]/scores/[scoreId]/scoreDetail.tsx#L1474)）。**先に目印を消してから表示**するため、構造的に“1回だけ”発火する

### 3.2 節目判定・永続化は既に解析時に存在
- [music-analyzer/lib/achievement.py](../music-analyzer/lib/achievement.py) `process_score_achievement` が **`{"achieved", "mastered", "star_up"}` を返し**、DBへ永続化：
  - `UserScoreAchievement`（`achievedPerformanceId` = 達成を確定させた演奏。**スキーマに「お祝いUI用」と明記済み**）
  - `masteredAt`（達成後 avg90成立で刻む・不可逆）
  - `UserStarProgress.currentStar`（`_check_star_up`、`STAR_UP_ACHIEVEMENTS=10`）
- 定数: `CLEAN_RUNS_REQUIRED=3` / `MASTER_RECENT=5` / `MASTER_AVG=90` / `STAR_UP_ACHIEVEMENTS=10`

### 3.3 唯一の欠け（＝Aの主改修点）
`process_score_achievement` の戻り値は [loop_engine_runner.py:277](../music-analyzer/loop_engine_runner.py#L277) で **`print` されるだけで、フロントが読める場所に保存されていない**。診断（`save_performance_diagnosis`）は `analysisSummary` にマージ保存されているのに、**達成サマリだけ保存されていない**。ここを埋めるのが本設計の中心。

### 3.4 既存資産
- **アルコちゃん**（[ArcoChan.tsx](../app/components/ArcoChan.tsx)）: 30ポーズ/10系統のパラメトリックSVG。CSSアニメ実装済み（`hop` / `clap` / `wave` / `sway` / `glow` 他）
- **本棚の素地**（[MyRankCard.tsx](../app/components/MyRankCard.tsx)）: 達成スタンプ（曲名・ベスト点・達成日・詳細リンク）を既に表示
- **共有インフラ**: 無し（OG画像生成・公開リンク・トークンいずれも未実装）

---

## 4. 全体フロー

```
録音 → アップロード → Cloud Run 解析
  ├ 5.5 診断(217) → analysisSummary.diagnosis          (既存)
  └ 5.6 achievement_v2
        ├ process_score_achievement → {achieved,mastered,star_up}   (既存の判定・永続化)
        ├ 教材: 直近5回平均90 到達判定 → UserPracticeMastery upsert    (★新規)
        └ ★summary を analysisSummary.milestone にマージ保存           (★新規)
        ↓
フロント(詳細画面) 3秒ポーリングで done を検知（既存 justRecordedRef）
        ↓
analysisSummary.milestone ＋ isPersonalBest を評価
        ↓
節目あり → 祝いオーバーレイ（最上位1つ／達成+昇格は2段）
節目なし → 通常の結果シート（現状どおり）
```

---

## 5. 詳細設計

### 5.1 マイルストーンのデータ構造（`analysisSummary.milestone`）＝**型付きイベント配列**（拡張の要）

固定4項目ではなく、**開いた型のイベント配列**で持つ。新しい節目は「新しい `type` を1つ足す」だけで増やせる（横展開の土台）。JSON内なので**スキーマ変更ゼロは維持**。

```jsonc
// 汎用「祝賀イベント」形（発生源・タイミングを問わず共通）
{
  "type": "master",              // 開いた列挙（未知は無視）
  "tier": "major",               // epic > major > medium > minor（表示の格）
  "source": "analysis",          // 発生源: analysis | app_open | schedule | session_end | counter | realtime | external
  "occurredAt": "2026-07-25T...",// 発生時刻（表示時刻とは別。キューで遅延表示可）
  "dedupeKey": "master:scoreId", // 一意キー（同一イベントの二重発火/多端末を1回に）
  "subject": { "kind": "score", "id": "..." },
  "payload": { "newStar": 3 }
}

// A(今)の載せ場所: Performance.analysisSummary.milestone（source は "analysis" 固定）
{ "version": 1, "events": [ /* 上の形 */ ] }
```

- `type`/`tier` は**開いた列挙**（未知は安全に無視）。`source`/`occurredAt`/`dedupeKey` により**発生源とタイミングを自由に増やせる**（12.6）
- 節目ゼロなら `events: []` → 通常結果
- **自己ベスト**（`isPersonalBest`、[scoreDetail.tsx:1439](../app/[userId]/scores/[scoreId]/scoreDetail.tsx#L1439)）も**同じ形**（`{type:"personal_best", source:"analysis", ...}`）に合成し処理を一本化
- 読み側の契約：**未知 `type`/`source` は無視**・`events` 欠落は空扱い（INV-3）
- **Aのスコープ**：`source:"analysis"` × タイミング「録音直後」の**1系統のみ**を実装。他の source/タイミングは同じ形で**後から加算**（下記12.6）

### 5.2 Python 改修（解析時）

**(a) 達成サマリの保存**（[loop_engine_runner.py](../music-analyzer/loop_engine_runner.py) `_run_achievement_v2`）
`process_score_achievement` / `process_practice_achievement` の戻り `summary` を `analysisSummary.milestone` へマージ保存。既存の診断保存（`save_performance_diagnosis`）と同じ更新経路を使う。失敗時は既存どおり SAVEPOINT 隔離＋警告（パイプライン無傷）。

**(b) 教材クリア判定の新規追加**（教材演奏時）
現行の `process_practice_achievement` は「3回崩壊ゼロ（`UserPracticeAchievement`）」で、**課題クリア定義（直近5回平均90）とは別物**。そこで教材演奏時に：
1. 当該 `practiceItemId` × `userId` の**直近5回平均（(pitch+timing)/2）と累計**を集計
2. `UserPracticeMastery` を upsert（`recentAverageScore` / `totalPerformanceCount` / `isPerformanceMastered` / `masteredAt`）
   - `UserPracticeMastery` は定義（直近5回平均≥90・累計≥5・不可逆・masteredAt固定）が**課題クリアと完全一致**するため**新規テーブルは作らず再利用**する
3. `isPerformanceMastered` が **false→true に遷移したこの演奏**で `milestone.materialCleared = true`
4. upsert は `@@unique([userId, practiceItemId])` により冪等。失敗は achievement_v2 の SAVEPOINT 隔離内（解析本体に影響しない）
   - ※教材↔演奏の紐付け列（`masteredPerformanceId`）は**追加しない**（6章・本棚の教材表示は将来段）

### 5.3 発火ロジック（フロント）

**発火点**: 既存の完了検知 useEffect（[scoreDetail.tsx:1474](../app/[userId]/scores/[scoreId]/scoreDetail.tsx#L1474)）に相乗り。`justRecordedRef` の演奏が `done` になった所で：

```ts
const events = [...(perf.analysisSummary?.milestone?.events ?? [])]
if (isPersonalBest) events.push({ type: "personal_best", tier: "medium", payload: { delta } })
// 未知typeは CELEBRATION_SPEC 未登録として自然に除外
const shown = selectCelebrations(events)  // 表示規則を1関数に集約（純粋・テスト対象）
```

- **表示規則 `selectCelebrations`（純粋関数・拡張耐性）**: `CELEBRATION_SPEC`（5.4のレジストリ）に登録された `type` のみ採用 → `tier` 降順で最上位を選ぶ → 「本体1つ＋昇格系は2段目」の合成。**新しい節目を足しても、この関数とレジストリを触るだけ**で分岐が増えない
- 既定の格: `epic`(rank_up) ＞ `major`(master/achieve) ＞ `medium`(material_clear/personal_best)。自己ベストは major と同時なら**吸収**（本体カード内に「自己ベストも更新」）
- **節目なし** → 現状の結果シート（[ArcoResultOverlay](../app/components/ArcoResultOverlay.tsx)）
- **二重防止**: **新規マーカー不要**。既存の `justRecordedRef` + `arcoPending`（発火時に自己クリア、[1479-1481](../app/[userId]/scores/[scoreId]/scoreDetail.tsx#L1479)）が構造的に“1回だけ”を保証する。履歴からの再表示（replay）では祝いを出さず通常結果のみ

### 5.4 祝いオーバーレイ UI ＋ **祝賀レジストリ**（`CELEBRATION_SPEC`）

**表示は「node × config」で駆動**する。新しい節目は**レジストリに1行足すだけ**で見た目・文言・演出が決まる（コンポーネント増設なし）。

```ts
// app/_libs/celebrationSpec.ts — 型ごとの見た目・文言・演出を集約（横展開の中心）
type Tone = "child" | "adult"
type CelebrationSpec = {
  tier: "epic" | "major" | "medium" | "minor"
  theme: string           // 色（緑/金/紫/青…）
  arcoPose: string        // ArcoChan のポーズ系統（称賛/喜び…）
  motion: "takeover" | "card" | "toast"  // 演出強度
  copy: Record<Tone, { title: string; sub: string }>  // 子供/大人のトーン
  keepsake: boolean       // 記念カードを残すか
}
const CELEBRATION_SPEC: Record<string, CelebrationSpec> = {
  rank_up:        { tier:"epic",  theme:"purple", ... },
  master:         { tier:"major", theme:"gold",   ... },
  achieve:        { tier:"major", theme:"green",  ... },
  material_clear: { tier:"medium",theme:"teal",   ... },
  personal_best:  { tier:"medium",theme:"blue", keepsake:false, ... },
  // 将来: technique_mastered / lesson_cleared / streak_7 / goal_song ... を追記
}
```

- 実装は既存 `ArcoResultOverlay` の兄弟 `MilestoneCelebration({ event, tone })`（新規・純粋表示）。`createPortal` で全画面。**検知源に依存しない**（A/B/Cで再利用＝12章）
- **トーン（子供/大人）は `tone` パラメータ**で切替（コード分岐せずレジストリの `copy` を引く）
- **アルコちゃん**: `ArcoChan` を spec の `arcoPose` ＋ `hop`/`clap` で使用
- **演出**: `motion` に応じ takeover(全画面＋紙吹雪) / card / toast。`prefers-reduced-motion` は演出抑制フォールバック（モック[af7bad76]準拠）
- **ボタン遷移**:
  - 達成/マスター: 「🎁 家族に送る」→ 5.5 / 「記録を見る」→ 5.6 本棚 / 「つづける」→ 閉じる
  - ランクアップ: 「新しい曲を見る」→ `/[userId]/practice/pieces` / 他同上
  - 自己ベスト/課題クリア: 「つづける」→ 閉じる

### 5.5 記念カード＋共有（画像MVP）

- **記念カード生成**: クライアントの `<canvas>` に賞状（曲名・☆・節目・日付・アルコ）を描画 → `toBlob()` で画像化
- **共有**: `navigator.share({ files: [pngFile], title, text })`（Web Share Level 2）。非対応環境は**画像ダウンロード**にフォールバック
- 個人情報・外部送信を伴うため、**共有はユーザーの明示操作（ボタン）でのみ実行**。録音音声は**含めない**（MVP）

### 5.6 本棚（記録）画面

- **新規ページ**: `/[userId]/records`（名称仮）。既存 `MyRankCard` の「記録を見る」導線から遷移
- **データ源（汎用記念カード型）**:
  ```ts
  type RecordCard = {
    kind: "score" | "material"
    tier: "achieved" | "mastered" | "cleared"
    title: string
    cover?: string | null
    star?: number | null
    date: string          // achievedAt / masteredAt
    href: string          // 曲/教材 詳細
  }
  ```
  - 曲: `UserScoreAchievement`（achievedAt / masteredAt / starAtAchievement / scoreId → Score.title, cover）
  - 教材（**将来**）: `UserPracticeMastery`（masteredAt / practiceItemId → PracticeItem.title, category）
- **今回は曲のみ表示**。ただしデータは教材も蓄積（5.2b）し、コンポーネントは `RecordCard[]` の汎用型で作る → 将来は**供給源を1つ足すだけ**で教材が並ぶ

---

## 6. データモデル変更 — **スキーマ変更ゼロ**（単一リリース・ロールバック要件）

「1回のリリースで完結・即ロールバック」を満たすため、**DBマイグレーションは行わない**。既存の列・JSONのみで実現する。

| モデル | 変更 | 種別 | 用途 |
|---|---|---|---|
| `Performance.analysisSummary` (JSON) | `milestone` キーを追加 | **加算のみ**（JSON内・スキーマ不変） | 発火判定 |
| `UserPracticeMastery` | 既存列に**データを書く**（`recentAverageScore`/`totalPerformanceCount`/`isPerformanceMastered`/`masteredAt`） | **データのみ**（列追加なし） | 課題クリア検知 |
| `UserScoreAchievement` 等 | 変更なし（既存を読むだけ。`achievedPerformanceId`/`masteredAt` 活用） | — | — |

**明示的に“やらない”こと（後段送り）**
- `UserPracticeMastery.masteredPerformanceId` の**列追加はしない**。教材の記念カード↔演奏の紐付けは本棚が教材を表示する将来段で追加（それまで不要）
- `UserScoreAchievement.celebratedAt` は**足さない**（Aは既存トリガーで1回保証。DB化はB段階）

→ **A全体がゼロ・マイグレーションで成立**。これがロールバックを容易にする（下記8章）。

---

## 7. 変更ファイル一覧

**Python / 解析（Cloud Run）**
- `lib/achievement.py`: 教材クリア判定（直近5回平均90到達 → `UserPracticeMastery` upsert ＋ `materialCleared`）追加
- `loop_engine_runner.py` `_run_achievement_v2`: `summary` を `analysisSummary.milestone` にマージ保存

**フロント（Vercel）**
- `app/_libs/featureFlags.ts`（新規）: `CELEBRATION_ENABLED` フラグ（下記8章）
- `app/_libs/celebrationSpec.ts`（新規）: `CELEBRATION_SPEC` レジストリ ＋ `selectCelebrations`（純粋・テスト対象。**横展開の中心**）
- `app/_libs/milestone.ts`（新規）: `milestone.events` の型と null 耐性パーサ（未知typeを無視）
- `MilestoneCelebration.tsx`（新規・祝いオーバーレイ、ArcoChan＋モーション。**検知源非依存**）
- `KeepsakeCard.tsx`（新規・canvas記念カード＋Web Share）
- `scoreDetail.tsx`: 完了検知点（[1474](../app/[userId]/scores/[scoreId]/scoreDetail.tsx#L1474)）に**フラグ配下の**節目分岐を追加。`PerformanceDTO` に `milestone` 型追加
- `app/[userId]/records/page.tsx` ＋ `RecordShelf.tsx`（新規・本棚）。フラグOFF時は導線非表示

**スキーマ**: 変更なし（6章）

---

## 8. 単一リリース設計とロールバック（本要件の核）

> 目標：**1回のリリースで完結**し、イメージと違えば**即座に現状へ戻せる**。そのために全変更を「加算のみ・前後方互換・フラグでゲート」に限定する。

### 8.1 なぜ安全に一括投入できるか（互換性契約）
各部品は**単独で無害**であり、投入順序に依存しない：
- **Python の `milestone` 追加**：`analysisSummary` にキーを**足すだけ**。旧フロントは未知キーを無視 → 無害
- **Python の `UserPracticeMastery` 書き込み**：既存テーブルへの**データ追加のみ**（列追加なし）。読む所が無ければ無害
- **フロントの祝い**：`CELEBRATION_ENABLED` フラグ配下。**OFF なら現状と完全一致**（分岐に入らず既存 `ArcoResultOverlay`）
- **旧演奏（投入前）**：`milestone` を持たない → **遡及して祝わない**（正しい）

→ 「Pythonが先／フロントが先」どちらでも壊れない。**DBマイグレーションが無い**ため戻す対象も無い。

### 8.2 リリース手順（1リリース＝2ターゲットの協調投入）
> 技術的には Cloud Run と Vercel の2ターゲットだが、**順序非依存・各々単独安全**なので実質“1リリース”として扱える。フラグOFFで投入 → 動作確認 → フラグONで公開。

1. **Cloud Run 再デプロイ**（Python）※`git push`では反映されない。手動再デプロイ必須（[cloud_run手順メモ]準拠）
2. **Vercel デプロイ**（フロント、`CELEBRATION_ENABLED=false` で投入）
3. **本番スモーク**（フラグOFF＝現状どおりを確認。milestoneは書かれ始めるが未使用）
4. **フラグ ON**（`CELEBRATION_ENABLED=true`）→ 祝い公開

### 8.3 ロールバック手順書（runbook）
イメージと違う／不具合時、上から順に「軽い手段」で戻せる：

| レベル | 手段 | 効果 | 所要 | 副作用 |
|---|---|---|---|---|
| **L1（推奨）** | フラグ `CELEBRATION_ENABLED=false` | 祝い・本棚が消え**現状と完全一致** | 即時（再デプロイ/再起動のみ） | なし。milestoneデータは無害に残る |
| **L2** | Vercel を**前のデプロイに即時ロールバック** | フロント全体を旧版へ | 即時 | なし |
| **L3** | Python(Cloud Run) を前リビジョンへ | milestone書き込みを停止 | 数分 | 既書きのmilestone/UserPracticeMasteryデータは無害に残置 |

- **DBの巻き戻しは不要**（スキーマ変更ゼロ）。`UserPracticeMastery` の残置データは正規の定義（直近5回平均90）に一致するため害がない
- **通常はL1で十分**。L1だけで「今の状態」に戻る＝これが本要件の主答え

### 8.4 フラグ設計
- `CELEBRATION_ENABLED`（サーバ側 env、`app/_libs/featureFlags.ts` 経由で参照）
- **契約**：フラグOFF時、`scoreDetail` は**一切の新分岐に入らず**、録音後は現行 `ArcoResultOverlay` のみ。本棚ルートは導線非表示（直リンクはリダイレクト or 404）
- 単一フラグで**祝い・記念カード・共有・本棚を一括**制御（部分的な中途状態を作らない）

### 8.5 不変条件（実装で必ず守る・間違い防止のチェック項目）
以下は**コードレビュー／テストで機械的に検証する契約**。1つでも破れたらリリースしない。

- **INV-1 フラグOFF＝現状一致**：`CELEBRATION_ENABLED=false` のとき、録音後の表示・DOM・遷移が現行と差分ゼロ（新分岐に入らない）
- **INV-2 スキーマ不変**：`prisma migrate` を生成しない。`schema.prisma` に差分が出たら設計違反
- **INV-3 加算のみ・null耐性**：`milestone` は欠落し得る前提。読み側は `analysisSummary?.milestone?.xxx ?? false` で**未定義でも例外を出さない**
- **INV-4 遡及祝い禁止**：発火は `justRecordedRef` の演奏に**限定**。履歴閲覧・リロード・再訪で過去の達成を祝わない
- **INV-5 1回性**：同一録音の完了で祝いは**高々1回**（既存の目印自己クリアを流用）
- **INV-6 解析非破壊**：教材判定・milestone保存の失敗は SAVEPOINT隔離＋警告のみ。**解析本体（診断・スコア）を壊さない**
- **INV-7 区間録音除外**：`rangeFromNote != null` は祝い対象外
- **INV-8 冪等な教材書き込み**：`UserPracticeMastery` は upsert（unique制約）で二重行を作らない
- **INV-9 共有は明示操作のみ**：外部送信（Web Share）はユーザーのボタン操作でのみ発火。自動送信しない。音声は含めない

---

## 9. エッジケース・非機能

- **解析遅延中に離脱**: Aでは発火しない（戻れば `arcoPending` で拾う／恒久対応はB）
- **解析失敗（error）**: `milestone` 無し → 祝い無し（安全側）
- **`achievement_v2` 失敗**: SAVEPOINT隔離で握り潰し → 稀に milestone 未計算 → 祝いが出ないだけ
- **区間録音（`rangeFromNote != null`）**: 曲スコア非算入 → 祝い対象外（既存ルール踏襲）
- **同時多節目**: 5.3 の重なり規則で最上位＋（昇格のみ）2段
- **`prefers-reduced-motion`**: モーション抑制フォールバック
- **パフォーマンス**: 紙吹雪はCSSのみ、canvasは共有押下時に生成（常時描画しない）

---

## 10. テスト計画

- **Python（pytest）**: 教材クリア判定（4回→未／5回目で平均90到達→`materialCleared=true`／既にmastered→false）、`milestone` マージ保存
- **TS（Vitest）**: 節目→表示tierの選択規則（重なり・自己ベスト吸収・2段）、`RecordCard` 変換、記念カード生成の非破壊
- **手動/E2E**: 実際に達成/マスター/昇格/自己ベスト/課題クリアを起こし、詳細画面での発火・1回性・共有・本棚を確認

### 10.1 受け入れ基準（Definition of Done ＝これを満たさなければリリースしない）
- [ ] **フラグOFFで現状と差分ゼロ**（INV-1。スクショ/DOM比較で確認）
- [ ] `prisma migrate` 差分ゼロ（INV-2）
- [ ] 各節目が**正しい演奏でのみ1回**発火（達成/マスター/昇格/自己ベスト/課題クリア）
- [ ] 過去演奏を開いても祝わない（INV-4）
- [ ] `milestone` 欠落の旧演奏・解析中でも例外ゼロ（INV-3）
- [ ] 教材クリア：4回目未発火／5回目で平均90到達時に発火／既クリアは再発火しない（pytest）
- [ ] 重なり：達成＋昇格＝2段、自己ベストは達成に吸収（Vitest）
- [ ] 共有：Web Share 起動（非対応はダウンロード）。音声を含まない
- [ ] 本棚：達成/マスター曲が記念カードで並ぶ。フラグOFFで導線非表示
- [ ] `prefers-reduced-motion` で演出抑制
- [ ] `npm test`（Vitest）・pytest・`tsc --noEmit`・`npm run build` すべて green
- [ ] **ロールバックL1（フラグOFF）を本番前にリハーサル**して現状復帰を確認

### 10.2 リスク登録簿
| # | リスク | 影響 | 対策 |
|---|---|---|---|
| R1 | フラグOFFなのに挙動が変わる | 現状復帰できない | INV-1をE2E必須化・分岐を1点に集約 |
| R2 | milestone保存が解析を壊す | 採点不能 | SAVEPOINT隔離（INV-6）・既存パターン踏襲 |
| R3 | 教材クリア判定の閾値ミス（境界5回/90点） | 誤発火/未発火 | 境界値pytest・`dailyLessons.ts`の既存定義と一致させる |
| R4 | 遡及祝い（過去の達成が今出る） | 体験破壊 | INV-4（justRecordedRef限定）・E2E |
| R5 | Cloud Runだけ戻してフロントが古いmilestoneを読む | 不整合 | milestoneはnull耐性（INV-3）→無害。L1で無効化 |
| R6 | Web Shareで意図せぬ外部送信 | プライバシー | 明示操作のみ・音声非含（INV-9） |
| R7 | canvas記念カードが端末依存で崩れる | 見栄え低下 | 固定サイズ・Webフォント非依存・失敗時はテキスト共有にフォールバック |

---

## 12. 拡張性・横展開（設計の“のびしろ”）

本設計は**4層分離**を基本方針とし、各層を独立に差し替え／追加できるようにする。**「何を(type)」「いつ・どこ発(source/timing)」「いつ見せるか(queue)」「どう祝うか(spec)」を全て分離**することで、イベントの種類もタイミングも独立に増やせる。

```
[発生源層] エミッタ(source×timing)   … analysis(録音直後) / app_open / schedule(cron) /
   │                                    session_end / counter(N回目) / realtime / external(先生)
   ↓ (共通イベント形: type/tier/source/occurredAt/dedupeKey)
[キュー層] 検知≠表示 を分離          … 即時 or 未表示キューに積む(dedupeKeyで1回性)
   ↓
[配信層] いつ・どこで見せるか        … A:詳細画面オーバーレイ / B:全画面バナー /
   │                                    C:Push / on_open:次回起動時 / recap:ホーム要約
   ↓
[表示層] どう祝うか                  … MilestoneCelebration + KeepsakeCard + CELEBRATION_SPEC
```

- **Aで実装するのは**：発生源=`analysis` の1エミッタ／キューは使わず即時表示／配信=詳細画面オーバーレイ。**他はすべて“この形に合わせて後から足す”**

### 12.1 新しい節目を足す（縦の拡張）
新節目 = **①Pythonで `events` に1つ足す ②`CELEBRATION_SPEC` に1行足す** だけ。プラミング・分岐は不変。想定候補：
- `technique_mastered`（既存 `UserTechniqueMastery` を供給源に）
- `lesson_cleared`（既存 `UserLessonClear`）
- `streak_7` / `streak_30`（継続日数）
- `goal_song`（旅の地図の目標曲 達成）
- `first_run`（初めての通し）／`grade_up`（グレード昇格）

### 12.2 配信先を増やす（横の展開＝B/C）
表示層（`MilestoneCelebration`）は**検知源に依存しない純粋コンポーネント**。同じイベントを別の配信層に流すだけで横展開できる：
- **B（どの画面でも）**: グローバル監視 → 割り込みしないバナー → タップで同じ `MilestoneCelebration` を開く
- **C（アプリ外）**: Push → ディープリンク → 同じ表示層
- **他サーフェス**: ホームの「今日の成果」要約、成長記録、月次レポート、通知センターも**同じイベントを読むだけ**で作れる

### 12.3 検知層の“真実の一元化”への移行パス
Aでは `analysisSummary.milestone`（JSON・ゼロマイグレーション）に持つ。横展開（レポート／通知／「最近の達成」フィード／端末をまたぐ1回性）が要る段階で、**`events` と同一形の `MilestoneEvent` テーブル**を追加し、Pythonが JSON とテーブルへ**二重書き**する（イベント形は今から固定しておくので、後付けは加算）。これが同時に **DB `celebratedAt`**（B段階の1回性）も提供する。
- **重要**：今 `events` のスキーマ（`type`/`tier`/`subject`/`payload`）を確定しておくことで、将来のテーブルは**この形の1:1写し**にできる → 手戻りゼロ

### 12.4 記念カード・本棚の横展開
- `KeepsakeCard` / `RecordCard` は既に**汎用型**（`kind: score | material | …`）。技術・レッスン・ストリーク等も**供給源を足すだけ**で本棚に並ぶ
- 共有（Web Share）も node × spec 駆動なので、新節目は自動で「家族に送る」対象になる

### 12.5 拡張時に守る契約（横展開を壊さないための不変条件）
- **EX-1**: 新 `type` 追加時、読み側の既存分岐を増やさない（レジストリ登録のみ）
- **EX-2**: `events` の形（`type`/`tier`/`subject`/`payload`）は**後方互換**でのみ変更（`version` を持つ）
- **EX-3**: 表示層は検知源・配信層を知らない（A/B/Cで同一実装を再利用）
- **EX-4**: 未知 `type`・未知 `tier` は**安全に無視**（クラッシュしない・既定minor扱いにしない）

### 12.6 発生源×タイミングの拡張（イベントを“いつ・どこ発でも”増やせる）
節目の**種類**だけでなく、**発生源とタイミング**も差し込み式にする。鍵は **①エミッタ・レジストリ ②検知≠表示を分けるキュー ③`dedupeKey` による1回性**。

**① エミッタ・レジストリ（発生源を足す＝1つ登録するだけ）**
```ts
// 各エミッタは「あるユーザー/文脈で、共通イベント形の配列を生む」関数
type MilestoneEmitter = (ctx) => MilestoneEvent[]
const EMITTERS = {
  analysis:    fromAnalysisSummary,   // A: 録音直後（今回実装）
  app_open:    fromPendingQueue,      // 起動時に未表示を出す
  schedule:    fromCron,              // 週次/月次/記念日/ストリーク判定
  session_end: fromSessionSummary,    // 「今日の練習やり切った」
  counter:     fromCounters,          // 100回目の録音 / 累計時間 等
  realtime:    fromLivePlay,          // 演奏中の「弾けた！」
  external:    fromTeacher,           // 先生の課題付与・コメント
}
```

**② タイミング分類（＝配信のトリガ）**
| タイミング | 例 | 実現 |
|---|---|---|
| 即時（行動直後） | 達成・自己ベスト | Aで実装（source=analysis） |
| 起動時（遅延表示） | 解析が離脱中に完了／ストリーク | 未表示キューを起動時に読む |
| スケジュール | 週次まとめ・記念日・7日継続 | cron がイベント生成→キュー |
| 累積しきい値 | 100回目・累計10時間 | 書き込み時に counter 判定 |
| リアルタイム | 演奏中の成功 | クライアント側エミッタ |
| 外部 | 先生の付与 | サーバ書き込み→キュー |

**③ キュー（検知時刻と表示時刻を分離）**
即時に出せない/出すべきでないイベントは**未表示キュー**に積み、適切な瞬間（起動時・バナー・ホーム要約）で出す。`dedupeKey`（例 `streak_7:2026-W30`）で**何度検知しても1回だけ**表示。
- Aでは**キュー未使用**（即時のみ）。キュー導入＝12.3の `MilestoneEvent` テーブル追加時（イベント形は今から同一なので加算のみ）
- 割り込み規則：即時以外は**全画面ハイジャックせず**、まずバナー→タップで表示層を開く（B方針と共通）

**拡張時の契約（追加）**
- **EX-5**: 新しい発生源は `EMITTERS` に1つ足すだけ。配信・表示・レジストリは不変
- **EX-6**: すべてのイベントは `dedupeKey` を持ち、1回性はキー基準（timing/端末を跨いでも1回）
- **EX-7**: 表示層・配信層は `source` を意識しない（analysis発でもcron発でも同じ見せ方）

→ **まとめ**：`type`（種類）・`source`（発生源）・timing（タイミング）・`spec`（見せ方）が**全て独立の“足すだけ”**。Aは「analysis×即時」の1マスを埋める実装で、残りのマスは同じ器に後から差し込む。

---

## 11. 未決・将来

- **B（どこでも発火）**: グローバル監視（まずポーリング）＋未祝いキュー＋割り込みしないバナー展開＋DB `celebratedAt`
- **C（Push）**: Service Worker 再エンゲージ
- **音声つき共有**: 公開再生リンク（トークン・アクセス制御・音声公開URL）
- **本棚の教材表示**: 供給源を足すだけ（データは本設計で蓄積済み）
- **月次成長レポート／Before→Now 聴き比べ**: 継続動機の別施策

---

## 付録: 確定した設計判断（本セッション）

1. 共有MVP = 記念カード**画像**共有（音声は後段）
2. 本棚 = 今は曲のみ表示、**データは教材も蓄積**し汎用型で将来拡張
3. 二重防止 = **既存トリガー再利用（新規マーカー不要）**。DB `celebratedAt` はB段階
4. 課題クリア = **直近5回平均90 の新規到達**を解析時に判定（`UserPracticeMastery` 再利用）
5. **単一リリース＋即ロールバック**：スキーマ変更ゼロ・全変更を加算のみ・単一フラグ `CELEBRATION_ENABLED` でゲート。**戻す時はフラグOFF（L1）で現状に完全一致**。DBの巻き戻しは不要
6. **拡張性・横展開**：`milestone` を型付きイベント配列にし、**4層分離（発生源/キュー/配信/表示）＋祝賀レジストリ＋エミッタ・レジストリ**で構成。
   - **種類**を増やす＝`CELEBRATION_SPEC` に1行（12.1）
   - **発生源・タイミング**を増やす＝`EMITTERS` に1つ（12.6：起動時/週次cron/累積N回/リアルタイム/外部…）
   - **配信先**（B/C/ホーム要約/通知）＝表示層を再利用（12.2）
   - イベント形に `type/tier/source/occurredAt/dedupeKey` を持たせ、`dedupeKey` で timing・端末を跨いだ1回性を担保
   - 将来の `MilestoneEvent` テーブル＋キューは今のイベント形の1:1写しで後付け（手戻りゼロ）
   - **Aの実装範囲**：`source:analysis × 即時` の1マスのみ。残りは同じ器へ加算
