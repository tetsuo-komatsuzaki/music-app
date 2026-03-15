# Music Learning Platform — User Flow Diagram

> Source: tetsuo-komatsuzaki/music-app
> Generated: 2026-03-15
> Covers: Student journey, Teacher journey, Admin journey, Authentication flows

---

## 0. High-Level System Overview

```
                        +------------------+
                        |   Landing Page   |
                        |   (app/page.tsx)  |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
             +------v------+          +------v------+
             |   Sign Up   |          |    Login    |
             | /signUp     |          |  /login     |
             +------+------+          +------+------+
                    |                         |
                    |   +---------------------+
                    |   |
                    v   v
            +-------+---+--------+
            |  Authenticated     |
            |  /{userId}/top     |
            +--------+-----------+
                     |
     +---------------+---------------+---------------+
     |               |               |               |
+----v----+   +------v-----+  +-----v------+  +-----v-----+
| Scores  |   | Practice   |  |  Share     |  | Profile   |
| /top    |   | /practice  |  |  /share    |  | /profile  |
+---------+   +------------+  +------------+  +-----------+
```

---

## 1. Authentication Flow

### 1.1 Sign Up Flow

```
+------------------+
|   /signUp        |
|                  |
| Form Fields:     |
| - Username       |
| - Email          |
| - Password       |
| - Confirm Pass   |
| - Plan (free)    |
| - Role (student  |
|   or teacher)    |
+--------+---------+
         |
         v
+------------------+     +------------------+
| signUpAction     |     | Google OAuth      |
| (Server Action)  |     | signInWithOAuth() |
+--------+---------+     +--------+---------+
         |                         |
         v                         v
+------------------+     +------------------+
| Supabase:        |     | /auth/callback   |
| admin.createUser |     | exchangeCode     |
+--------+---------+     | ForSession()     |
         |               +--------+---------+
         v                         |
+------------------+               |
| Prisma:          |               |
| User.create({   |               |
|  supabaseUserId, |               |
|  name, role,     |               |
|  plan })         |               |
+--------+---------+               |
         |                         |
         v                         v
+------------------+     +------------------+
| Success Alert    |     | Redirect to /    |
| (manual login)   |     | (auto session)   |
+------------------+     +------------------+
```

### 1.2 Login Flow

```
+--------------------+
|   /login           |
|                    |
| - Email + Password |
| - [Remember Me]   |
| - Google OAuth btn |
+--------+-----------+
         |
    +----+----+
    |         |
    v         v
Email/Pass   Google OAuth
    |         |
    v         v
signInWith   signInWith
Password()   OAuth()
    |         |
    v         v
Success?     /auth/callback
    |         |
    v         v
Lookup User  Exchange code
by Supabase  for session
UUID         |
    |         |
    v         v
Redirect to /{userId}/top
```

### 1.3 Password Reset Flow

```
/forgotPassword              /updatePassword
+------------------+         +------------------+
| Enter email      |         | (from email link)|
| resetPassword    |         |                  |
| ForEmail()       +-------->| Enter new pass   |
|                  | (email) | Confirm pass     |
+------------------+         | updateUser()     |
                              +--------+---------+
                                       |
                                       v
                              Redirect to /login
                              (2 sec delay)
```

---

## 2. Authenticated Shell & Navigation

```
+--------------------------------------------------------------+
| HEADER  bg:#1E3A8A                                           |
|                        "Violin Practice" [Icon.png 40x40]    |
+----------+---------------------------------------------------+
| SIDEBAR  |                                                   |
| bg:#0B1E3A|  MAIN CONTENT AREA (bg:#F8FAFC)                 |
| w:220px  |                                                   |
|          |  Rendered by child route's page.tsx               |
| Nav:     |                                                   |
| 🎼 スコア |                                                   |
|   一覧    |                                                   |
| 📈 練習   |                                                   |
|   プラン  |                                                   |
| 🤝 教師と |                                                   |
|   共有    |                                                   |
| 👤 プロ   |                                                   |
|   フィール|                                                   |
| ⚙️ 管理   |                                                   |
+----------+---------------------------------------------------+

Active item: bg:#1E40AF + left border 4px #3B82F6
Hover:       bg:#1E40AF
```

All nav items are shown to all roles. Access control is server-side only.

---

## 3. Student Journey

### 3.1 Score Management Flow

```
Student logs in
      |
      v
+---------------------+
| Score List (/top)    |
| "スコア一覧"          |
|                     |
| [＋ 新規楽曲を登録]   |<--------+
|                     |          |
| +--Score Card------+|          |
| | 🎼 Title         ||          |
| | 作曲者: Composer  ||          |
| | [▶ 練習する]      ||          |
| | [作成日] [編集]   ||          |
| +-+---------+------+|          |
+---|---------+--------+         |
    |         |                  |
    |    Edit dropdown           |
    |    +--楽曲名を変更         |
    |    +--削除 (red)           |
    |                            |
    v                            |
Click "＋ 新規楽曲を登録"         |
    |                            |
    v                            |
+---------------------+         |
| UploadModal         |         |
| - 曲名 (required)   |         |
| - 作曲者 (optional)  |         |
| - MusicXML file     |         |
|   (.xml/.musicxml/  |         |
|    .mxl, max 5MB)   |         |
| [キャンセル] [登録]   |         |
+--------+------------+         |
         |                      |
         v                      |
  uploadScore action            |
  (see Pipeline diagram)        |
         |                      |
         +-------> Return ------+
```

### 3.2 Score Practice Flow (Core Learning Loop)

```
Score Card → Click "▶ 練習する"
      |
      v
+-----------------------------------------------+
| Score Detail (/top/[scoreId])                  |
| "Score Title"            [演奏をアップロード]     |
+-----------------------------------------------+
| LEFT (320px)        | RIGHT (flex: 1)          |
|                     |                          |
| +最新の演奏--------+ | +楽譜データ-----------+   |
| | [再生/一時停止]   | | |                     |   |
| | <audio controls> | | | OpenSheetMusicDisplay|   |
| +------------------+ | | (OSMD)              |   |
|                     | |                       |   |
| +楽譜を再生--------+ | | Notes colored by     |   |
| | [譜面再生/停止]   | | | comparison results: |   |
| +------------------+ | | 🟢 Correct          |   |
|                     | | 🟠 Timing off        |   |
| +演奏評価----------+ | | 🔴 Pitch off        |   |
| | 音程正確率  XX%  | | | ⚪ Not evaluated     |   |
| | タイミング  XX%  | | | 🔵 Playing now       |   |
| | 完全一致率  XX%  | | |                     |   |
| | 判定不能  Xノート | | | [前へ] 1/N [次へ]   |   |
| | [color legend]   | | +---------------------+   |
| +------------------+ |                          |
|                     |                          |
| +演奏履歴----------+ |                          |
| | 2024/01/15       | |                          |
| |   uploaded 評価あり| |                          |
| | 2024/01/10       | |                          |
| |   uploaded       | |                          |
| +------------------+ |                          |
+---------------------+--------------------------+

  User actions:
  1. Listen to their recording (audio player)
  2. Play the score (synthesized MIDI playback with visual sync)
  3. View evaluation metrics
  4. Click history items to compare different recordings
  5. Upload new recording via modal
```

### 3.3 Upload Recording Sub-flow

```
Click "演奏をアップロード"
      |
      v
+---------------------+
| UploadRecordModal    |
| - scoreId (hidden)   |
| - WAV audio file     |
|   (48kHz/16bit rec.) |
| [キャンセル] [登録]   |
+--------+------------+
         |
         v
  uploadRecord action
  (see Pipeline diagram)
         |
         v
  Page revalidates →
  New performance appears
  in history list
```

### 3.4 Practice Plan Flow

```
+----------------------------+
| Practice Top (/practice)   |
| "練習メニュー"               |
|                            |
| IF recommendations exist:  |
| +-おすすめ練習-------------+|
| | 📋 あなたの楽曲から      ||
| |   reason text            ||
| |   [chip] [chip] [chip]  ||
| |                          ||
| | 🎯 あなたの苦手から      ||
| |   reason text            ||
| |   [chip] [chip]         ||
| +-------------------------+|
|                            |
| +--Category Cards---------+|
| | 🎵 音階  | 🎶 アルペジオ ||
| | N項目     | N項目        ||
| |----------|------------- ||
| | 📖 エチュード            ||
| | N項目                   ||
| +-------------------------+|
+----------------------------+
      |
      | Click category card
      v
+----------------------------+
| Practice List              |
| (/practice/[category])     |
| "CategoryTitle"  ← 練習メニュー|
|                            |
| FILTER BAR:                |
| [調▼] [難易度▼] [ポジション▼]|
|                            |
| +--Item Card--------------+|
| | Title ★★★☆☆            ||
| | Composer                ||
| | G 長調 · 1st · デタシェ  ||
| | Short description       ||
| | 最終: 2024/01/15 · 5回  ||
| +-------------------------+|
| (repeat...)                |
+----------------------------+
      |
      | Click item card
      v
+----------------------------+
| Practice Detail            |
| (/practice/[cat]/[itemId]) |
|                            |
| ← CategoryLabel (link)    |
| [description box]         |
| meta: key · tempo · pos   |
|                            |
| === ScoreDetail ===        |
| (same as Section 3.2      |
|  but for practice items)   |
+----------------------------+
```

### 3.5 Recommendation Engine Data Flow

```
+------------------+     +-------------------+
| User's Scores    |     | User's Weaknesses |
| (Score table)    |     | (UserWeakness)    |
+--------+---------+     +---------+---------+
         |                         |
         v                         v
  Match by keyTonic/       Match by weakness type:
  keyMode to find          - key_area → scales/arpeggios
  scales & arpeggios       - timing → etudes
  in same key              - pitch_range → by position
                           - technique → by techniqueTag
         |                         |
         v                         v
+------------------+     +-------------------+
| Score-based      |     | Weakness-based    |
| Recommendations  |     | Recommendations   |
| 📋 label         |     | 🎯 label          |
+------------------+     +-------------------+
         |                         |
         +----------+--------------+
                    |
                    v
            Practice Top Page
            (/practice)
```

---

## 4. Teacher Journey

> **Current state:** The teacher role exists in the Prisma schema (`Role.teacher`)
> and can be selected during signup, but no teacher-specific features are
> implemented yet. Teachers see the same UI as students.

```
Teacher logs in
      |
      v
  Same dashboard as Student
  (/{userId}/top)
      |
      +---> Score List (same)
      +---> Practice Plan (same)
      +---> Share Page (STUB: only <h1>共有</h1>)
      +---> Profile Page (STUB: only <h1>プロフィール</h1>)
```

### 4.1 Planned Teacher Features (inferred from schema & stubs)

```
SHARE PAGE (not yet implemented):
+----------------------------+
| Share (/share)             |
| "共有"                      |
|                            |
| Likely intended features:  |
| - View shared student      |
|   performances             |
| - Provide feedback on      |
|   student recordings       |
| - Track student progress   |
|   over time                |
+----------------------------+

PROFILE PAGE (not yet implemented):
+----------------------------+
| Profile (/profile)         |
| "プロフィール"               |
|                            |
| Likely intended features:  |
| - User info display/edit   |
| - Plan management          |
| - Connected students/      |
|   teachers                 |
+----------------------------+
```

---

## 5. Admin Journey

### 5.1 Access Control

```
User navigates to /{userId}/admin/practice
      |
      v
+---------------------+
| Server-side check:  |
| 1. supabase.auth    |
|    .getUser()       |
| 2. Check ADMIN_IDS  |
|    whitelist         |
+--------+------------+
         |
    +----+----+
    |         |
  Admin    Not Admin
    |         |
    v         v
  Render    Error: "この機能は
  page     管理者専用です"
```

**ADMIN_IDS whitelist:** Hardcoded single UUID `"85555ce4-6822-4efb-8af6-c2a8eda145f0"`

### 5.2 Admin Practice Management Flow

```
+-----------------------------------------------+
| Admin Practice (/admin/practice)               |
| "練習メニュー管理"            [新規登録/閉じる]   |
+-----------------------------------------------+
|                                               |
| [message banner: success/error]               |
|                                               |
| FORM (toggled):                               |
| +--------------------------------------------+|
| | "新規登録"                                  ||
| |                                            ||
| | [MusicXML ファイル*] ←file input            ||
| | [タイトル*]          ←text                  ||
| | [作曲者]             ←text                  ||
| | [カテゴリ*]  ●音階 ○アルペジオ ○エチュード    ||
| | [難易度*]    ★★★☆☆ (3/5)                   ||
| | [調*]        [C▼][長調▼]                    ||
| | [推奨テンポ]  [60]〜[90]                     ||
| | [ポジション]  ☑1st ☐2nd ☑3rd ☐4th...       ||
| | [技法タグ]   click=select, dblclick=primary ||
| |              grouped by category            ||
| | [短い説明]   ←text                          ||
| | [詳細説明]   ←textarea                      ||
| | [登録]                                      ||
| +--------------------------------------------+|
|                                               |
| TABLE: "登録済み (N件)"                        |
| |タイトル|カテゴリ|難易度|調|テンポ|技法|状態|公開||
| |--------|--------|------|--|------|----|----|--||
| |G Major | 音階   |★★★  |G |60-90 |tags|完了|✅||
| |Scale   |        |      |長|      |    |    |  ||
| |        |        |      |調|      |    |    |  ||
| |--------|--------|------|--|------|----|----|--||
+-----------------------------------------------+

  Admin submits form:
       |
       v
  uploadPracticeItem action
  (see Pipeline diagram)
       |
       v
  Page reloads (window.location.reload())
  New item appears in table
```

---

## 6. Cross-Role Flow Summary

```
                 AUTHENTICATION
                 ==============
                 Sign Up (student/teacher)
                       |
                       v
                     Login
                    /     \
                   /       \
        Email/Pass         Google OAuth
                   \       /
                    \     /
                     v   v
               /{userId}/top
                       |
       +---------------+---------------+
       |               |               |
   STUDENT          TEACHER          ADMIN
   FLOWS            FLOWS            FLOWS
   ======           ======           ======
       |               |               |
  Score List       (Same as        Admin Practice
       |            Student)        Management
       v                               |
  Score Detail                    Create Items
  - Upload WAV                   - MusicXML upload
  - View eval                    - Metadata config
  - Play score                   - Technique tags
  - History                           |
       |                              v
  Practice Plan               Items appear in
  - Recommendations           student Practice
  - By category                     Plan
  - Filter/search
       |
  Practice Detail
  - Same as Score Detail
  - For practice items

  FEEDBACK LOOP:
  ==============
  Performance recordings
       |
       v
  Python analysis scripts
       |
       v
  comparison_result.json
       |
       v
  Evaluation display +
  UserWeakness aggregation
       |
       v
  Personalized
  recommendations
```

---

## 7. Page Route Map

| Route | Auth | Role | Server Data | Client Component |
|---|---|---|---|---|
| `/` | None | Any | None | ScoreViewer (test) |
| `/login` | None | Any | None | Login form |
| `/signUp` | None | Any | Server action | Signup form |
| `/forgotPassword` | None | Any | None | Reset form |
| `/updatePassword` | Session | Any | None | Password form |
| `/auth/callback` | OAuth | Any | Token exchange | Redirect |
| `/{userId}/top` | Session | Any | Scores by user | TopClient |
| `/{userId}/top/[scoreId]` | Session | Any | Score + performances + analysis + audio URLs | ScoreDetail |
| `/{userId}/practice` | Session | Any | Category counts + recommendations + weaknesses | PracticeTop |
| `/{userId}/practice/[cat]` | Session | Any | Filtered items + history + filter options | PracticeList |
| `/{userId}/practice/[cat]/[id]` | Session | Any | Item + performances + analysis + audio URLs | ScoreDetail (reused) |
| `/{userId}/share` | Session | Any | None (stub) | SharePage |
| `/{userId}/profile` | Session | Any | None (stub) | ProfilePage |
| `/{userId}/admin/practice` | Session | Admin | All items + technique tags | AdminPractice |

### API Routes

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/practice/items` | GET | None | List practice items with filters |
| `/api/practice/history` | GET | None | User's practice performance history |
| `/api/practice/performances` | POST | None | Create practice performance record |
| `/api/practice/analyze-weaknesses` | POST | None | Aggregate comparison results into weaknesses |
| `/api/practice/recommendations` | GET | None | Score/weakness-based suggestions |

> **Security note:** API routes currently have no authentication checks.

---

## 8. State Transitions

### Score Lifecycle

```
[Upload MusicXML]
      |
      v
  Score.analysisStatus = "processing"
  Score.buildStatus = "processing"
      |
      +---> analyze_musicxml.py
      |         |
      |    Success: analysisStatus = "done"
      |    Failure: analysisStatus = "error"
      |
      +---> build_score.py
                |
           Success: buildStatus = "done"
                    generatedXmlPath set
           Failure: buildStatus = "error"
```

### Performance Lifecycle

```
[Upload WAV]
      |
      v
  Performance.performanceStatus = "uploaded"
      |
      v
  analyze_performance.py
      |
      +---> comparisonResultPath set
      |     (comparison_result.json)
      |
      v
  UI can display evaluation
```

### Practice Item Lifecycle

```
[Admin uploads MusicXML + metadata]
      |
      v
  PracticeItem.analysisStatus = "processing"
  PracticeItem.buildStatus = "processing"
      |
      +---> analyze_musicxml.py --practice-item
      |         |
      |    analysisStatus = "done"
      |    analysisPath set
      |
      +---> build_score.py --practice-item
                |
           buildStatus = "done"
           generatedXmlPath set
      |
      v
  isPublished = true (default)
  → Visible in student practice menus
```
