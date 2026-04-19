# SECURITY_NOTES

> **最終更新**: 2026-04-19 (Phase 0 完了 + 基盤セキュリティ整備完了)

---

## 章1: 目的と読み方

*このドキュメントは music-app におけるセキュリティ対策の履歴・設計原則・残タスクを一元管理するための記録書です。*

### 対象読者と意図
1. **将来の自分（Tetsuoさん）**: 「なぜこの実装なのか」を後から思い出すためのリファレンス。特に数ヶ月後のリファクタ時に「ここは触ってはいけない境界線」が分かる
2. **新しいチームメンバー**: オンボーディング時に本ドキュメントを読めば、どこに何が実装されているか把握可能
3. **セキュリティレビュワー**: 次回レビュー時、前回対策の粒度・現在の残リスクを即把握できる

### 更新ルール
- **Phase ごとに追記**: 新Phaseに着手・完了したら、章3（解消した脆弱性）・章7（残タスク）を更新
- **インシデント発生時に追記**: 章8に日付付きで記録
- **ヘルパー追加・設計原則変更時に追記**: 章4・章5を更新
- **最終更新日を毎回変える**: 冒頭の更新日を反映

### 非推奨事項
- 本書にシークレット値（API key, パスワード等）を書かない
- Supabase プロジェクトURL / プロジェクトID などの具体値は書かない（環境変数経由で参照）

---

## 章2: 現在のセキュリティ水準

*Phase 0 完了により、主要な致命的脆弱性は全て解消。Phase 1 で多層防御と運用面の強化を行う予定。*

### 達成した水準（2026-04-19 時点）
- **2026-04 セキュリティレビュー**で「致命的 (Critical)」と判定された3件は全て解消:
  1. IDOR (Insecure Direct Object Reference) — API Routes 11本で URL `userId` 信頼
  2. Role Injection — `signUpAction` で `role` 外部入力
  3. 認証欠如 — `getUserRole` が任意の `supabaseUserId` を受理
- **同レビューで追加発見された2件**も Phase 0-5/0-6 で解消:
  4. Command Injection — `exec` 文字列連結に外部入力混入
  5. Path Traversal — Storage path に未検証 ID 混入

### 残存リスク（Phase 1 で対処予定）
- **多層防御の不足**: Middleware が `/api/*` をガードしていない（Server Action/Route 内のみで認証）
- **レート制限なし**: 認証失敗・アップロード等への総当たり攻撃耐性なし
- **XXE / zip bomb**: Python 側 music21 が `defusedxml` 未使用
- **マジックバイト検証なし**: 拡張子と Content-Type のみ信頼
- **セキュリティヘッダー欠落**: CSP, X-Frame-Options, HSTS 等未設定
- **Signed URL 長時間有効**: 音声URLが1時間有効（漏洩時の被害期間）
- **依存関係の既知 CVE**: `xlsx` に修正版のない脆弱性
- **Supabase Auth 設定の未ハードニング**: Email確認・セッション寿命・パスワードリセット等がデフォルト値のまま

### 構造的に解消しないリスク（Phase 2 以降で設計検討）
- 監査ログ基盤なし（誰がいつ何をしたか追跡できない）
- 未成年の保護者同意フロー未実装

---

## 章3: Phase 0 で塞いだ脆弱性

*致命的脆弱性の修正履歴。修正ファイルと Phase 番号で追跡可能。*
*（#1-b は #1 と連動する派生脆弱性のため、件数カウントは5件）*

| ID | 脆弱性 | 影響 | 修正 Phase | 修正ファイル |
|---|---|---|---|---|
| **#1** | IDOR (API Routes) | 他ユーザーの練習履歴・演奏データ・弱点情報が URL パラメータ改変で全て読めた | Phase 0-4 | `app/_libs/requireAuth.ts`（新規）, `app/api/**/route.ts` 計10本 |
| **#1-b** | A-3-2 デッドコード | `POST /api/practice/performances` が `body.userId` を信頼し、他者名義の偽レコード作成可能だった | Phase 0-4 | ファイル削除: `app/api/practice/performances/route.ts` |
| **#2** | Role Injection | 新規登録時に `formData.role=admin` を送ると管理者権限で登録可能だった | Phase 0-2 | `app/actions/signUpAction.ts` |
| **#3** | getUserRole 認証欠如 | 任意の `supabaseUserId` を引数に渡すと他ユーザーのロールが開示された | Phase 0-3 | `app/actions/getUserRole.ts`, 呼び出し側 `app/[userId]/components/Sidebar.tsx` |
| **#4** | Command Injection | `uploadRecord` / `uploadPracticeRecord` で `exec` 文字列に `formData` 値を埋め込み → RCE可能 | Phase 0-5 | `app/_libs/pythonRunner.ts`（新規）, `app/actions/upload*.ts` 計4本 |
| **#5** | Path Traversal | Storage path に未検証の `scoreId` / `practiceItemId` を埋め込み → 他者領域汚染 | Phase 0-6 | `app/_libs/validators.ts`（新規）, `app/actions/uploadRecord.ts`, `app/actions/uploadPracticeRecord.ts` |

### 副次的な改善（Phase 0 中に併行実施）
- **Role の enum 化**: `schema.prisma` の `User.role` を `String` → `Role` enum へ（`student` / `teacher` / `admin`）
- **Prisma マイグレーション履歴のドリフト修復**: 実DBとmigration履歴が乖離していたため、baseline migration 作成 + `migrate resolve --applied` で再同期
- **Supabase RLS 有効化**: 全 public テーブルで RLS ON + policies 空 = deny-all（Prisma は service_role 経由でバイパス）
- **Storage `performances` バケット Private 化**: public → private（誤設定修正）
- **OneDrive 同期から `.env*` 除外**: クラウド同期経路でのシークレット漏洩防止
- **`.gitignore`**: `.env*` + `!.env.example` で Next.js 規約に準拠

#### Phase 0 UPDATE/DELETE 認可監査（2026-04-19 実施）
- Prisma の update/delete/upsert 呼び出し 11 箇所を個別監査
- 全 11 箇所で P1/P2/P3 のいずれかの認可パターン成立確認
  - **P1** (直前 create + update/delete 同一 Action内): 10 箇所
  - **P2** (where 複合キーに userId: dbUserId 含有): 1 箇所（UserWeakness.upsert）
  - **P3** (admin-only ガード): 3 箇所（PracticeItem 系、P1 と重複）
- HTTP DELETE/PATCH/PUT メソッドの API Routes は 0 件
- getSession() 誤用は login/page.tsx:39 の 1 件のみ、認可判定には未使用
- IDOR の全攻撃面（GET/POST/UPDATE/DELETE/Signed URL/Storage path）が閉塞確認

---

## 章4: 新規追加されたセキュリティヘルパー

*3つのヘルパーを導入。全て `app/_libs/` 配下に集約し、各層で直接呼び出す設計。*

### 4.1 `app/_libs/requireAuth.ts`

**役割**: 認証+ユーザー解決ロジックの中央集約。API Routes と Server Actions で共通利用。

```ts
// API Route 用
export async function GET(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response   // 401 自動応答
  const dbUserId = auth.user.dbUser.id // ← これだけを信頼IDとして扱う

  const data = await prisma.xxx.findMany({
    where: { userId: dbUserId },        // URL の userId は一切使わない
  })
  return NextResponse.json(data)
}

// Server Action 用
export async function someAction(formData: FormData) {
  const result = await requireAuthAction()
  if (!result.ok) return { error: result.error }
  const { dbUser } = result.user
  // ...
}

// 管理者限定
export async function adminAction(formData: FormData) {
  const result = await requireAdminAction()
  if (!result.ok) return { error: result.error }  // role !== "admin" なら拒否
  // ...
}
```

**設計ポイント**:
- discriminated union (`{ ok: true, ... } | { ok: false, ... }`) で型安全
- Supabase auth → Prisma User 解決までを1関数で完結
- API と Action でエラー応答形式が違うため2関数に分離

### 4.2 `app/_libs/validators.ts`

**役割**: DB クエリ前の軽量バリデーション。現状 `isValidCuid` のみ。

```ts
// Prisma @default(cuid()) 形式: c + base36 24文字 = 計25文字
const CUID_V1_RE = /^c[a-z0-9]{24}$/

export function isValidCuid(id: unknown): id is string {
  return typeof id === "string" && CUID_V1_RE.test(id)
}
```

**使い方**: 外部入力（formData / searchParams / body）から受け取った ID を Prisma クエリに渡す**前**に必ず通す。
- 形式外を早期リターン → DB 接続節約・ログ分離
- 上限なし `{24,}` ではなく `{24}` 固定 → DoS 回避

```ts
const scoreId = (formData.get("scoreId") as string | null)?.trim() ?? ""
if (!isValidCuid(scoreId)) return { error: "scoreId が不正です" }
// ここから先は scoreId が cuid 形式であることが保証される
```

### 4.3 `app/_libs/pythonRunner.ts`

**役割**: Python 解析実行を中央集約。コマンドインジェクション遮断 + 本番/開発分離。

```ts
// 同期待機版
const r = await runPythonScript("../music-analyzer/analyze_musicxml.py", [
  dbUser.id,
  score.id,
])
if (r.status === "skipped") {
  // Python 無効環境（本番）: 明示的スキップ
}

// fire-and-forget 版（バックグラウンド処理）
runPythonScriptFireAndForget("../music-analyzer/analyze_performance.py", [
  dbUser.id,
  scoreId,
  performance.id,
])
```

**2段階環境変数設計の意図**:
| `ENABLE_PYTHON_ANALYSIS` | `PYTHON_PATH` | 挙動 | 用途 |
|---|---|---|---|
| `true` | 設定済 | spawn で実行 | ローカル開発 |
| `true` | 未設定 | **throw** | 設定漏れ検知 |
| `false` / 未設定 | 任意 | 明示スキップ（warn ログ） | Vercel 本番 |

**フォールバックパスを持たない理由**: 個人Windowsパスをコード内フォールバックにすると、Vercelで意図せず実行を試みて500エラー化する。環境変数なしでは動かない設計にすることで、誤設定時に即エラーで気づける。

**spawn + 配列引数**: `shell: false` で `spawn(pythonPath, [scriptPath, ...args])` するため、args 内のシェルメタ文字は全てリテラル扱い → コマンドインジェクション不可。

---

## 章5: 設計原則

*今後の開発で守るべきルール。コードレビュー時のチェックリストにもなる。*

### 認可

1. **【認可は常にセッション由来の ID で】**  
   URL / body / formData / searchParams の `userId` / `supabaseUserId` は**一切信頼しない**。必ず `requireAuthApi()` / `requireAuthAction()` から取得した `dbUser.id` を信頼IDとして使う。

2. **【多層防御】**  
   Middleware（セッション確認）+ API Route / Server Action（認証+認可）+ DB（RLS）の3層で独立にチェック。どれか1層を抜いても他で止まる構成。

3. **【エンティティ列挙防止】**  
   他者所有リソースへのアクセスは `403 Forbidden` ではなく **`404 Not Found`** を返す。403 は「存在はする」と漏らすため。未公開リソースも同様。

4. **【管理者昇格は out-of-band】**  
   `role="admin"` 等の昇格はアプリUIから不可能にする（`signUpAction` は `role="student"` 固定）。昇格は DB 直接操作のみ。

### 入力検証

5. **【cuid 形式検証】**  
   DB クエリ前に `isValidCuid()` で弾く。DB 接続節約と DoS 回避の両方の効果。

6. **【trim 必須】**  
   `formData.get(...)` / `searchParams.get(...)` から受け取る文字列は `.trim()`。前後空白でバリデーション迂回や path 誤動作を防ぐ。

7. **【ホワイトリストで固定化】**  
   `category`, `plan`, `role`, Content-Type などは明示的な許容リストで弾く。ブラックリスト方式は取らない。

### 外部プロセス・システム境界

8. **【exec 文字列連結禁止】**  
   `child_process.exec(文字列)` 形式は使わない。`spawn(cmd, [args])` 配列形式のみ。pythonRunner.ts 以外で `child_process` を使う場合も同原則。

9. **【所有者確認 → Storage path に使う】**  
   外部入力の ID を Storage path / file path / query に使う前に、DB で所有者/アクセス権を検証する。検証済みの ID のみ path 組み立てに使ってよい。

10. **【フォールバックパスを持たない】**  
    環境変数必須のリソースアクセスで、コード内にハードコードされたフォールバックパスを置かない。設定漏れは即エラーで気づける設計にする。

### シークレット取り扱い

11. **【grep で値を表示しない】**  
    シークレット確認は「存在有無のみ」で値を表示させない。

    ```bash
    # ❌ 悪い例（値が出力される）
    grep "BRAVE_API_KEY" .env

    # ✅ 良い例（存在有無のみ）
    grep -q "BRAVE_API_KEY" .env && echo "exists" || echo "not found"
    grep -c "BRAVE_API_KEY" .env  # 件数のみ
    ```

12. **【`.env*` は OneDrive / Dropbox 等のクラウド同期から除外】**  
    OS 同期フォルダに置く場合、クラウド経由での漏洩経路に注意。

### コード構造

13. **【ヘルパー中央集約】**  
    認証・バリデーション・外部プロセス呼び出しは同じ処理を複数ファイルに分散させない。`app/_libs/` に集約し、import で呼ぶ。

14. **【Server Actions には必ず `"use server"` ディレクティブ】**  
    これがないとクライアントに関数本体が漏れる可能性。

15. **【`server-only` インポート】**  
    Server Component / Server Action / API Route 用のライブラリには `import "server-only"` を冒頭に。クライアントバンドルに混入したらビルドエラーになる安全装置。

---

## 章6: 環境変数の運用ルール

*環境ごとの責務分担と秘密情報の取り扱いを明文化。*

### ファイル役割

| ファイル | Git | 個人パス | 秘密情報 | 用途 |
|---|---|---|---|---|
| `.env` | **❌ 非コミット** | OK | 入れてOK | 古い規約・`.env.local` 推奨 |
| `.env.local` | **❌ 非コミット** | OK | 入れてOK | ローカル開発の秘密 |
| `.env.example` | ✅ コミット | **❌ 禁止** | **❌ 禁止** | 設定項目の説明テンプレ |
| Vercel UI | - | - | 環境別に設定 | Production / Preview / Development |

### 公開値と秘密値の区別

```
# 公開OK（ブラウザに配信される）
NEXT_PUBLIC_SUPABASE_URL           # Supabase プロジェクト URL
NEXT_PUBLIC_SUPABASE_ANON_KEY      # 匿名キー（RLS前提で公開）

# 秘密（サーバー側のみ）
SUPABASE_SERVICE_ROLE_KEY          # 全権限・絶対公開しない
DATABASE_URL / DIRECT_URL          # DB 接続文字列（パスワード含む）
PYTHON_PATH                         # 個人パスなので公開しない
```

**ルール**: `NEXT_PUBLIC_` プレフィックスがついた値は**公開される前提**で扱う。秘密を入れると Next.js ビルド時にバンドルされて全世界にリークする。

### Python 解析の2段階制御

```
# ローカル開発 (.env.local)
ENABLE_PYTHON_ANALYSIS=true
PYTHON_PATH=C:/Users/.../venv/Scripts/python.exe

# Vercel 本番 (Settings → Environment Variables)
ENABLE_PYTHON_ANALYSIS=false
# PYTHON_PATH は未設定のままにする（本番では Python なし）
```

**注意**: 将来 Vercel 以外（Railway、Fly.io、自前VPS等）に Python対応インフラを追加した際は、その環境で `ENABLE_PYTHON_ANALYSIS=true` + `PYTHON_PATH` を設定すればコード変更なしで有効化できる。

---

## 章7: 残タスク（Phase 1 着手予定）

*Phase 0 完了を受けて次に着手する項目。影響小→大の順で並べる。*

### Phase 1 タスク一覧

| # | タスク | 影響範囲 | 着手予定 | 状態 |
|---|---|---|---|---|
| 1-0 | 🔴 緊急: Supabase 管理画面 MFA 有効化（プライマリ + バックアップの2ファクター） | Dashboard 設定のみ | 2026-04-19 | ✅ 完了 |
| 1-8 | Next.js 16.1.6 → 16.2.4 パッチ更新 | `npm i next@latest`、動作確認広範囲 | 次着手 | ⏸ 未着手 |
| 1-3 | Middleware に `/api/*` 認証ガード追加 | `middleware.ts` のみ | 次着手 | ⏸ 未着手 |
| 1-4 | `next.config.ts` にセキュリティヘッダー（CSP, XFO, HSTS, Referrer-Policy, Permissions-Policy） | `next.config.ts` のみ | 後続 | ⏸ 未着手 |
| 1-5 | Signed URL 期限短縮（3600s → 600s） | API Routes 2本 | 後続 | ⏸ 未着手 |
| 1-9 | Supabase Auth ハードニング（Email確認強制、セッション寿命、PKCE、パスワードリセット） | Supabase Dashboard 設定のみ、コード変更なし | 後続 | ⏸ 未着手 |
| 1-1 | Python XML 解析の `defusedxml` 化 + zip bomb 対策 | `music-analyzer/` 配下の Python | 後続 | ⏸ 未着手 |
| 1-2 | ファイル マジックバイト検証（`file-type` パッケージ） | `uploadScore.ts`, `uploadPracticeItem.ts`, `convert-audio/route.ts` | 後続 | ⏸ 未着手 |
| 1-7 | `xlsx` → `exceljs` 置換（既知 CVE への対応） | `xlsx` 使用箇所 | 後続 | ⏸ 未着手 |
| 1-6 | レート制限（Upstash or Supabase テーブル） | 認証・アップロード系エンドポイント全般 | 後続 | ⏸ 未着手 |

### Phase 2 以降に持ち越した課題

- **ログ・監査基盤**  
  認証失敗・role 変更・大量アクセスの検知。現状 `console.log` のみでトレーサビリティなし。
- **依存関係スキャン CI 化**  
  Dependabot / Snyk / GitHub Dependency Review 等を PR CI で自動実行。
- **バックグラウンドジョブ基盤**  
  Python skipped 状態で `analysisStatus="processing"` が永続化する問題の解決。Python対応環境を別途立てて、キューから順次処理する設計。
- **未成年の保護者同意フロー**  
  β版は**18歳以上限定**で回避予定。将来的に未成年ユーザーを受け入れるなら、日本の個人情報保護法（2022年改正）とGDPR（16歳未満）双方の遵守が必要。
- **Prisma enum 化の拡大**  
  現状 `JobStatus`, `PerformanceType`, `PerformanceStatus`, `PracticeCategory`, `Role` は enum 化済。`TechniqueTag.category` / `isAnalyzable` / `implementStatus` 等は String のまま。enum 化で型安全を向上させたい。
- **管理者アカウント用 MFA**  
  現状 Supabase 側のパスワードログインのみ。admin ロールには TOTP 等を追加したい。
- **middleware.ts → proxy.ts リネーム**  
  Next.js 16 で推奨される新名称への移行。現状は動作するため優先度低。
- **login/page.tsx の不要な getSession() 呼び出し削除**  
  認可判定には使われていないデッドコードだが、監査性向上のため削除推奨。

---

## 章8: インシデント対応メモ

*セキュリティインシデント発生時の記録と再発防止策。*

### 2026-04-19: BRAVE_API_KEY 会話ログ漏洩

- **発生経緯**: Phase 0 監査中、セキュリティレビューの事前調査で `.env` 全文を表示する `Read` ツールを実行。その結果、`BRAVE_API_KEY` の値が会話履歴に含まれた状態となった
- **影響評価**:
  - キーは **アプリ本体のランタイムでは未使用**（grep 確認: `app/` 配下ヒット0件）
  - ローカル MCP（Brave Search）の開発支援用途のみ
  - Git 履歴には残っていない（`.env` は `.gitignore` 済、`git log -p --all -- .env` で確認）
- **対応**:
  - Brave Search Dashboard でキーを revoke（新キー発行は不要、未使用のため）
  - `.env` から該当行を削除
  - Git 履歴確認: `git log -p --all -- .env | grep -c BRAVE_API_KEY` → 0件確認済
- **再発防止策**:
  1. シークレット確認は `grep -q "PATTERN" .env && echo "exists"` のように**存在有無のみ**
  2. `Read` で `.env` 全文を表示するのは最終手段、できる限り `ls` + `grep -c` で代替
  3. 本ドキュメント章5のルール11に明文化

### 2026-04-19: Supabase 管理画面 MFA 設定完了

- プライマリ TOTP: iPhone Google Authenticator
- バックアップ TOTP: Windows PC WinAuth
- 別デバイス・別 OS・別アプリの3点分離で構成
- 次回確認予定: 2027-04-19（年次レビュー）

### 2026-04-19: BRAVE_API_KEY Revoke 完了

- Brave Search Dashboard で漏洩キーを Revoke
- 新キー発行は不要（アプリ本体で未使用）
- `.env` から該当行を削除済

### （今後のインシデント記録スペース）

```
<!-- 新しいインシデントは以下の書式で追記 -->
<!--
### YYYY-MM-DD: 事案名
- 発生経緯:
- 影響評価:
- 対応:
- 再発防止策:
-->
```

---

*End of SECURITY_NOTES.md*
