---
# Music App — Figma Design Specification

> Source: tetsuo-komatsuzaki/music-app
> Generated: 2026-03-15
> Stack: Next.js 16.1.6, React 19.2.3, Tailwind CSS ^4 (dev dep only — styling via CSS Modules), Prisma ^7.4.1, Supabase SSR ^0.8.0, OpenSheetMusicDisplay ^1.9.6, react-icons ^5.5.0, Tone.js (imported in scoreDetail.tsx)

---

## 0. Design Tokens

> **Note:** No `tailwind.config.ts` or `tailwind.config.js` exists. All styling is done via CSS Modules with raw hex/CSS values. No Tailwind utility classes are used in component JSX. The tokens below are extracted directly from `.module.css` files and inline styles.

### Color Palette

| Token | CSS Value | Hex | Source File | Line Context |
|---|---|---|---|---|
| Header background | `background: #1E3A8A` | `#1E3A8A` | layout.module.css:8, Header.module.css:3 | `.header { background: #1E3A8A }` |
| Sidebar background | `background: #0B1E3A` | `#0B1E3A` | layout.module.css:32, Sidebar.module.css:4 | `.sidebar { background: #0B1E3A }` |
| Sidebar nav hover / active bg | `background: #1E40AF` | `#1E40AF` | layout.module.css:50, Sidebar.module.css:22,26 | `.navItem:hover, .navItemActive { background: #1E40AF }` |
| Sidebar active border | `border-left: 4px solid #3B82F6` | `#3B82F6` | layout.module.css:55, Sidebar.module.css:27 | `.navItemActive { border-left: 4px solid #3B82F6 }` |
| Main content background | `background: #F8FAFC` | `#F8FAFC` | layout.module.css:62 | `.main { background: #F8FAFC }` |
| Primary button gradient start | `#2563EB` | `#2563EB` | layout.module.css:71 | `.newButton { background: linear-gradient(135deg, #2563EB, #3B82F6) }` |
| Primary button gradient end | `#3B82F6` | `#3B82F6` | layout.module.css:71 | Same as above |
| Primary button hover gradient | `#1E40AF → #2563EB` | `#1E40AF`, `#2563EB` | layout.module.css:83 | `.newButton:hover` |
| Card title color | `color: #0F172A` | `#0F172A` | layout.module.css:141 | `.cardTitle { color: #0F172A }` |
| Card composer color | `color: #64748B` | `#64748B` | layout.module.css:147 | `.cardComposer { color: #64748B }` |
| Date tag background | `background: #EFF6FF` | `#EFF6FF` | layout.module.css:174 | `.dateTag { background: #EFF6FF }` |
| Date tag text | `color: #2563EB` | `#2563EB` | layout.module.css:175 | `.dateTag { color: #2563EB }` |
| Edit button background | `background: #E2E8F0` | `#E2E8F0` | layout.module.css:192 | `.editBtn { background: #E2E8F0 }` |
| Edit button hover | `background: #CBD5E1` | `#CBD5E1` | layout.module.css:202 | `.editBtn:hover` |
| Delete button text | `color: #DC2626` | `#DC2626` | layout.module.css:235 | `.deleteBtn { color: #DC2626 }` |
| Dropdown hover | `background: #F1F5F9` | `#F1F5F9` | layout.module.css:231 | `.dropdown button:hover` |
| Page title color | `color: #0F172A` | `#0F172A` | layout.module.css:295 | `.pageTitle { color: #0F172A }` |
| Page subtitle color | `color: #475569` | `#475569` | layout.module.css:303 | `.pageSubTitle { color: #475569 }` |
| Upload box border | `border: 3px dashed #3B82F6` | `#3B82F6` | layout.module.css:332 | `.uploadBox` |
| Upload box gradient | `#EFF6FF → #DBEAFE` | `#EFF6FF`, `#DBEAFE` | layout.module.css:333 | `.uploadBox { background: linear-gradient(...) }` |
| Upload icon color | `color: #2563EB` | `#2563EB` | layout.module.css:349 | `.uploadIcon` |
| Upload text color | `color: #1E3A8A` | `#1E3A8A` | layout.module.css:356 | `.uploadText` |
| Info box background | `background: #F1F5F9` | `#F1F5F9` | layout.module.css:373 | `.infoBox` |
| Info box text | `color: #334155` | `#334155` | layout.module.css:377 | `.infoBox` |
| Info box border accent | `border-left: 5px solid #3B82F6` | `#3B82F6` | layout.module.css:378 | `.infoBox` |
| Info box heading | `color: #1E3A8A` | `#1E3A8A` | layout.module.css:383 | `.infoBox h4` |
| Empty state text | `color: #64748B` | `#64748B` | layout.module.css:369 | `.emptyState` |
| Record button bg | `background: #2e7dff` | `#2E7DFF` | scoreDetail.module.css:63 | `.recordBtn { background: #2e7dff }` |
| Record button hover | `background: #1a6ae0` | `#1A6AE0` | scoreDetail.module.css:70 | `.recordBtn:hover` |
| Play button bg | `background: #f0f0f0` | `#F0F0F0` | scoreDetail.module.css:77 | `.playBtn` |
| Card background (detail) | `background: #fff` | `#FFFFFF` | scoreDetail.module.css:47 | `.card { background: #fff }` |
| History active bg | `background: #eef2ff` | `#EEF2FF` | scoreDetail.module.css:219 | `.historyActive` |
| History active border | `border-color: #b4c4ff` | `#B4C4FF` | scoreDetail.module.css:220 | `.historyActive` |
| History hover bg | `background: #f5f7ff` | `#F5F7FF` | scoreDetail.module.css:215 | `.historyItem:hover` |
| History badge bg | `background: #e8f5e9` | `#E8F5E9` | scoreDetail.module.css:232 | `.historyBadge` |
| History badge text | `color: #388e3c` | `#388E3C` | scoreDetail.module.css:233 | `.historyBadge` |
| Eval warning bg | `background: #fff8e1` | `#FFF8E1` | scoreDetail.module.css:189 | `.evalWarnings` |
| Eval warning border | `border-left: 3px solid #ffa000` | `#FFA000` | scoreDetail.module.css:190 | `.evalWarnings` |
| Eval warning text | `color: #795548` | `#795548` | scoreDetail.module.css:196 | `.evalWarning` |
| Recommend card bg | `background: #f8f9fa` | `#F8F9FA` | practice.module.css:7 | `.recommendCard` |
| Recommend card border | `border-left: 4px solid #4a90d9` | `#4A90D9` | practice.module.css:7 | `.recommendCard` |
| Recommend chip bg | `background: #4a90d9` | `#4A90D9` | practice.module.css:11 | `.recommendChip` |
| Recommend chip hover | `background: #3a7bc8` | `#3A7BC8` | practice.module.css:12 | `.recommendChip:hover` |
| Admin primary btn | `background: #4a90d9` | `#4A90D9` | admin.module.css:8 | `.primaryBtn` |
| Admin form card bg | `background: #f8f9fa` | `#F8F9FA` | admin.module.css:13 | `.formCard` |
| Star filled | `color: #f5a623` | `#F5A623` | admin.module.css:31 | `.starFilled` |
| Star empty | `color: #ddd` | `#DDDDDD` | admin.module.css:32 | `.starEmpty` |
| Tag selected bg | `background: #4a90d9` | `#4A90D9` | admin.module.css:41 | `.tagSelected` |
| Tag primary bg | `background: #e65100` | `#E65100` | admin.module.css:42 | `.tagPrimary` |
| Tag small bg | `background: #e8f0fe` | `#E8F0FE` | admin.module.css:43 | `.tagSmall` |
| Tag small text | `color: #1967d2` | `#1967D2` | admin.module.css:43 | `.tagSmall` |
| Status done | `color: #2e7d32` | `#2E7D32` | admin.module.css:54 | `.statusDone` |
| Status processing | `color: #e65100` | `#E65100` | admin.module.css:55 | `.statusProcessing` |
| Badge beginner bg | `background: #e8f5e9` | `#E8F5E9` | practice.module.css:34 | `.badgeBeginner` |
| Badge beginner text | `color: #2e7d32` | `#2E7D32` | practice.module.css:34 | `.badgeBeginner` |
| Badge intermediate bg | `background: #fff3e0` | `#FFF3E0` | practice.module.css:35 | `.badgeIntermediate` |
| Badge intermediate text | `color: #e65100` | `#E65100` | practice.module.css:35 | `.badgeIntermediate` |
| Badge advanced bg | `background: #fce4ec` | `#FCE4EC` | practice.module.css:36 | `.badgeAdvanced` |
| Badge advanced text | `color: #c62828` | `#C62828` | practice.module.css:36 | `.badgeAdvanced` |

#### OSMD Overlay Colors (from scoreDetail.tsx)

| Token | Const Name | Hex | Source |
|---|---|---|---|
| Correct / Green | `COLOR_GREEN` | `#22AA44` | scoreDetail.tsx:72 |
| Timing off / Orange | `COLOR_ORANGE` | `#EE8800` | scoreDetail.tsx:73 |
| Pitch off / Red | `COLOR_RED` | `#EE2222` | scoreDetail.tsx:74 |
| Not evaluated / Grey | `COLOR_GREY` | `#AAAAAA` | scoreDetail.tsx:75 |
| Currently playing highlight | `COLOR_HIGHLIGHT` | `#2266FF` | scoreDetail.tsx:76 |

### Typography Scale

| Element | CSS Properties | Computed Size | Source |
|---|---|---|---|
| Page title (top) | `font-size: 30px; font-weight: 800; letter-spacing: -1px` | 30px | layout.module.css:292-296 |
| Page subtitle (top) | `font-size: 20px; font-weight: 500` | 20px | layout.module.css:300-302 |
| Score detail title | `font-size: 24px; font-weight: 700` | 24px | scoreDetail.module.css:22-23 |
| Card title | `font-size: 20px; font-weight: 600` | 20px | layout.module.css:139-140 |
| Card composer | `font-size: 14px` | 14px | layout.module.css:146 |
| Card icon | `font-size: 32px` | 32px | layout.module.css:112, 119 |
| Modal title | `font-size: 24px; font-weight: 600` | 24px | layout.module.css:286 |
| App name (header) | `font-weight: 600` | inherits (default ~16px) | Header.module.css:17 |
| Section title (practice) | `font-size: 18px; font-weight: 600` | 18px | practice.module.css:3 |
| Page title (practice/admin) | `font-size: 24px; font-weight: 700` | 24px | practice.module.css:2, admin.module.css:3 |
| Category icon | `font-size: 36px` | 36px | practice.module.css:19 |
| Category name | `font-size: 16px; font-weight: 600` | 16px | practice.module.css:20 |
| Category count | `font-size: 13px` | 13px | practice.module.css:21 |
| Item title | `font-size: 15px; font-weight: 600` | 15px | practice.module.css:30 |
| Item meta | `font-size: 12px` | 12px | practice.module.css:31 |
| Filter select | `font-size: 13px` | 13px | practice.module.css:26 |
| Date tag | `font-size: 12px; font-weight: 500` | 12px | layout.module.css:177-179 |
| Detail link | `font-size: 14px` | 14px | layout.module.css:184 |
| Record button | `font-size: 14px` | 14px | scoreDetail.module.css:68 |
| Play button | `font-size: 13px` | 13px | scoreDetail.module.css:82 |
| Eval value | `font-size: 18px; font-weight: 700` | 18px | scoreDetail.module.css:162 |
| Eval label | `font-size: 14px` | 14px | scoreDetail.module.css:153 |
| Eval legend | `font-size: 12px` | 12px | scoreDetail.module.css:169 |
| History item | `font-size: 13px` | 13px | scoreDetail.module.css:212 |
| History badge | `font-size: 10px; font-weight: 600` | 10px | scoreDetail.module.css:235 |
| Stars (admin) | `font-size: 20px; letter-spacing: 2px` | 20px | admin.module.css:30 |
| Table body | `font-size: 13px` | 13px | admin.module.css:48 |

### Spacing & Layout

| Element | CSS Properties | Computed px | Source |
|---|---|---|---|
| Shell height | `height: 100vh` | viewport height | layout.module.css:2 |
| Sidebar width | `width: 220px` | 220px | layout.module.css:31, Sidebar.module.css:3 |
| Sidebar padding | `padding: 20px` | 20px | layout.module.css:34, Sidebar.module.css:6 |
| Sidebar nav gap | `gap: 16px` | 16px | layout.module.css:37, Sidebar.module.css:9 |
| Nav item padding | `padding: 10px` | 10px | layout.module.css:44, Sidebar.module.css:14 |
| Nav item border-radius | `border-radius: 8px` | 8px | layout.module.css:46, Sidebar.module.css:16 |
| Active border-left | `border-left: 4px solid` | 4px | layout.module.css:55, Sidebar.module.css:27 |
| Header padding | `padding: 12px 20px` | 12px vertical, 20px horizontal | layout.module.css:9, Header.module.css:4 |
| Header right gap | `gap: 10px` | 10px | layout.module.css:18, Header.module.css:11 |
| Main content padding | `padding: 30px` | 30px | layout.module.css:60 |
| Card grid gap | `gap: 20px` | 20px | layout.module.css:92 |
| Card padding | `padding: 20px 24px` | 20px top/bottom, 24px left/right | layout.module.css:98 |
| Card border-radius | `border-radius: 16px` | 16px | layout.module.css:97 |
| Card inner gap | `gap: 20px` | 20px | layout.module.css:100 |
| Detail container max-width | `max-width: 1280px` | 1280px | scoreDetail.module.css:5 |
| Detail container padding | `padding: 32px 40px` | 32px top/bottom, 40px left/right | scoreDetail.module.css:7 |
| Detail grid gap | `gap: 32px` | 32px | scoreDetail.module.css:28 |
| Left column width | `flex: 0 0 320px` | 320px | scoreDetail.module.css:32 |
| Left column gap | `gap: 16px` | 16px | scoreDetail.module.css:35 |
| Detail card border-radius | `border-radius: 12px` | 12px | scoreDetail.module.css:48 |
| Detail card padding | `padding: 20px` | 20px | scoreDetail.module.css:50 |
| Modal width | `width: 900px; max-width: 90%` | 900px (max 90vw) | layout.module.css:265 |
| Modal padding | `padding: 50px` | 50px | layout.module.css:267 |
| Modal border-radius | `border-radius: 20px` | 20px | layout.module.css:268 |
| Practice container max-width | `max-width: 1200px` | 1200px | practice.module.css:1 |
| Practice container padding | `padding: 24px` | 24px | practice.module.css:1 |
| Category grid | `grid-template-columns: repeat(3, 1fr); gap: 16px` | 3 equal cols, 16px gap | practice.module.css:16 |
| Category card padding | `padding: 32px 16px` | 32px top/bottom, 16px left/right | practice.module.css:17 |
| Admin container max-width | `max-width: 1200px` | 1200px | admin.module.css:1 |

---

## 1. Shell Layout

```
+--------------------------------------------------------------+
| HEADER  bg:#1E3A8A  h:~44px (12px pad * 2 + content)        |
|                              [app-name: "Violin Practice"] [Icon 40x40] |
+----------+---------------------------------------------------+
| SIDEBAR  | MAIN CONTENT                                      |
| w:220px  | bg:#F8FAFC                                        |
| bg:#0B1E3A| padding: 30px                                    |
| p:20px   |                                                   |
|          |                                                   |
| 🎼 スコア一覧  |  <children>                                 |
| 📈 練習プラン  |                                              |
| 🤝 教師と共有  |                                              |
| 👤 プロフィール|                                              |
| ⚙️ 管理      |                                              |
|          |                                                   |
+----------+---------------------------------------------------+
```

**Structure:** (from `layout.tsx` + `layout.module.css`)
- Outer `div.container`: `height: 100vh; display: flex; flex-direction: column`
- `<Header />` renders first (row)
- `div.body`: `flex: 1; display: flex` (row)
  - `<Sidebar />` fixed 220px
  - `<main className={styles.main}>` flex: 1, padding: 30px, bg: #F8FAFC

**Header** (from `Header.tsx` + `Header.module.css`):
- `justify-content: flex-end` — logo and name are right-aligned
- Contains: `<span className="appName">Violin Practice</span>` + `<Image src="/Icon.png" width={40} height={40} />`

**Sidebar** (from `Sidebar.tsx` + `Sidebar.module.css`):
- Nav items defined in code:
  | Path | Icon | Label |
  |---|---|---|
  | `top` | 🎼 | スコア一覧 |
  | `practice` | 📈 | 練習プラン |
  | `share` | 🤝 | 教師と共有 |
  | `profile` | 👤 | プロフィール |
  | `admin/practice` | ⚙️ | 管理 |
- Active detection: `pathname === href`
- Active style: `bg: #1E40AF; border-left: 4px solid #3B82F6`
- Hover style: `bg: #1E40AF`
- Inactive: transparent background

---

## 2. Score List Page (`/[userId]/top` — `TopClient.tsx`)

```
+----------------------------------------------------------+
| h1.pageTitle "スコア一覧" (30px, 800 weight)              |
|                                                          |
| h2.pageSubTitle "あなたの登録済み楽曲"   [＋ 新規楽曲を登録] |
|                                                          |
| +------------------------------------------------------+ |
| | 🎼  | Title              [▶ 練習する]  (pill button) | |
| |     | 作曲者：Composer                               | |
| |     | [作成日：2024/01/15]        [編集]              | |
| +------------------------------------------------------+ |
|                                                          |
| (repeat for each score)                                  |
|                                                          |
| EMPTY STATE: "🎻 まだ楽曲が登録されていません"              |
+----------------------------------------------------------+
```

### Component Inventory

| Element | CSS Class | Key Styles |
|---|---|---|
| Page title | `.pageTitle` | 30px, weight 800, color #0F172A, letter-spacing -1px |
| Subtitle row | `.subHeaderRow` | flex, space-between, mb 30px |
| Subtitle | `.pageSubTitle` | 20px, weight 500, color #475569 |
| New button | `.newButton` | gradient #2563EB→#3B82F6, white text, pad 10px 18px, radius 10px, shadow |
| Card grid | `.cardGrid` | flex column, gap 20px, mt 24px |
| Card | `.card` | white bg, radius 16px, pad 20px 24px, shadow 0 4px 10px rgba(0,0,0,0.05) |
| Card hover | `.card:hover` | translateY(-4px), shadow 0 12px 28px rgba(0,0,0,0.12) |
| Card left icon | `.cardLeft` | 32px font-size, color #2563EB |
| Card title | `.cardTitle` | 20px, weight 600, color #0F172A |
| Card composer | `.cardComposer` | 14px, color #64748B |
| Practice button | `.practiceBtn` | gradient #2563EB→#3B82F6, white, pad 8px 16px, radius 999px, weight 600 |
| Date tag | `.dateTag` | bg #EFF6FF, color #2563EB, 12px, pad 4px 10px, radius 999px |
| Edit button | `.editBtn` | bg #E2E8F0, pad 6px 14px, radius 999px, 12px |
| Empty state | `.emptyState` | mt 40px, center, color #64748B |

### Data Fields (mapped to Prisma `Score`)

| Rendered | Prisma Field |
|---|---|
| `score.title` | `Score.title` |
| `score.composer ?? "未登録"` | `Score.composer` (nullable) |
| `score.createdAt` (formatted ja-JP) | `Score.createdAt` |
| `score.id` (used for link) | `Score.id` |

### Interactive States
- **Card hover:** translateY(-4px) + increased shadow
- **New button hover:** gradient shifts darker, shadow increases, translateY(-2px)
- **Practice button hover:** gradient shifts darker, shadow appears
- **Edit button hover:** bg changes #E2E8F0 → #CBD5E1
- **Dropdown:** appears on edit button click, positioned absolute bottom:10px right:20px
  - "楽曲名を変更" button
  - "削除" button (color: #DC2626)
  - Dropdown closes on outside click
- **Upload modal:** triggered by new button, renders `<UploadModal>`

---

## 3. Score Detail Page (`/[userId]/top/[scoreId]` — `scoreDetail.tsx`)

```
+----------------------------------------------------------+
| h1 "Score Title" (24px, 700)        [演奏をアップロード]   |
+----------------------------------------------------------+
|                                                          |
| LEFT (320px)          |  RIGHT (flex: 1)                 |
| +-------------------+ | +------------------------------+ |
| | 最新の演奏         | | | 楽譜データ                    | |
| | [再生] / [一時停止]| | | +--OSMD Container----------+ | |
| | <audio controls>  | | | |                            | | |
| +-------------------+ | | |  (OpenSheetMusicDisplay)   | | |
| +-------------------+ | | |                            | | |
| | 楽譜を再生         | | | +----------------------------+ | |
| | [譜面再生] / [停止]| | | [前へ] 1/N [次へ]            | |
| +-------------------+ | +------------------------------+ |
| +-------------------+ |                                  |
| | 演奏評価           | |                                  |
| | 音程正確率    XX%  | |                                  |
| | タイミング    XX%  | |                                  |
| | 完全一致率    XX%  | |                                  |
| | 判定不能   Xノート | |                                  |
| | [legend dots]     | |                                  |
| +-------------------+ |                                  |
| +-------------------+ |                                  |
| | 演奏履歴           | |                                  |
| | [date] status     | |                                  |
| | [date] status ★   | |                                  |
| +-------------------+ |                                  |
+----------------------------------------------------------+
```

### Component Inventory

| Element | CSS Class | Key Styles |
|---|---|---|
| Container | `.container` | max-width 1280px, margin 0 auto, pad 32px 40px, font-family "Helvetica Neue" |
| Header row | `.header` | flex, space-between, align-center, mb 32px |
| Title | `.title` | 24px, weight 700 |
| Record button | `.recordBtn` | bg #2E7DFF, white, radius 8px, pad 10px 20px |
| Two-col grid | `.grid` | flex, gap 32px |
| Left column | `.leftColumn` | flex 0 0 320px, flex-col, gap 16px |
| Right column | `.rightColumn` | flex 1, min-width 0 |
| Card | `.card` | bg #FFF, radius 12px, shadow 0 1px 4px rgba(0,0,0,0.08), pad 20px |
| Card heading | `.card h3` | 15px, weight 600, mb 12px |
| Play button | `.playBtn` | bg #F0F0F0, border 1px #DDD, radius 8px, pad 8px 16px |
| Audio | `.audioMock` | width 100%, mt 8px |
| OSMD container | `.osmdContainer` | width 100%, overflow-x auto |
| Score nav | `.scoreNav` | flex center, gap 16px, mt 12px |
| Eval row | `.evalRow` | flex space-between, 14px |
| Eval label | `.evalLabel` | color #555 |
| Eval value | `.evalValue` | weight 700, 18px |
| Legend dot | `.legendDot` | 10px circle (inline-block) |
| Eval warnings | `.evalWarnings` | bg #FFF8E1, border-left 3px #FFA000, pad 8px 12px |
| History item | `.historyItem` | pad 10px 12px, radius 8px, border 1px #EEE, 13px |
| History active | `.historyActive` | bg #EEF2FF, border #B4C4FF |
| History hover | `.historyItem:hover` | bg #F5F7FF |
| History badge | `.historyBadge` | bg #E8F5E9, color #388E3C, pad 1px 8px, radius 4px, 10px |

### Data Fields

| Rendered | Prisma Field |
|---|---|
| `score.title` | `Score.title` |
| `performance.uploadedAt` | `Performance.uploadedAt` |
| `performance.status` | `Performance.performanceStatus` |
| `performance.audioUrl` | signed URL from `Performance.audioPath` |
| `performance.comparisonResult` | JSON from `Performance.comparisonResultPath` |
| `performance.comparisonWarnings` | from comparison JSON `.warnings` |

### OSMD Score Viewer Sub-component
- Renders `OpenSheetMusicDisplay` with config: `autoResize: true, backend: "svg", drawTitle: false, drawPartNames: false, pageFormat: "A4_P", newPageFromXML: true, pageBackgroundColor: "#ffffff", zoom: 0.85`
- Multi-page: shows one SVG at a time with prev/next buttons
- Note elements: `g.vf-stavenote` selectors are colorized based on comparison

### Evaluation Color Legend
| Color | Meaning | Hex |
|---|---|---|
| Green dot | 正確 (Correct) | `#22AA44` |
| Orange dot | タイミングずれ (Timing off) | `#EE8800` |
| Red dot | 音程ずれ (Pitch off) | `#EE2222` |
| Grey dot | 判定不能 (Not evaluated) | `#AAAAAA` |

### Modals
- `<UploadRecordModal>` triggered by "演奏をアップロード" button

### Responsive (from scoreDetail.module.css)
- `@media (max-width: 900px)`: container padding 20px, grid becomes column, left column full width

---

## 4. Practice Top Page (`/[userId]/practice` — `practiceTop.tsx`)

```
+----------------------------------------------------------+
| h1 "練習メニュー" (24px, 700 weight)                      |
|                                                          |
| RECOMMENDATIONS SECTION (if any):                        |
| h2 "おすすめ練習" (18px, 600)                             |
| +------------------------------------------------------+ |
| | 📋 あなたの楽曲から                                    | |
| | reason text (13px, #666)                              | |
| | [chip1] [chip2] [chip3]  (pills, bg #4A90D9)         | |
| +------------------------------------------------------+ |
| +------------------------------------------------------+ |
| | 🎯 あなたの苦手から                                    | |
| | reason text                                           | |
| | [chip1] [chip2]                                       | |
| +------------------------------------------------------+ |
|                                                          |
| CATEGORY SECTION:                                        |
| +----------------+ +----------------+ +----------------+ |
| |    🎵          | |    🎶          | |    📖          | |
| |   音階          | |  アルペジオ     | |  エチュード     | |
| |  N項目          | |  N項目          | |  N項目          | |
| +----------------+ +----------------+ +----------------+ |
+----------------------------------------------------------+
```

### Component Inventory

| Element | CSS Class | Key Styles |
|---|---|---|
| Container | `.container` | max-width 1200px, pad 24px |
| Page title | `.pageTitle` | 24px, weight 700, mb 24px |
| Section title | `.sectionTitle` | 18px, weight 600, mb 16px |
| Recommend section | `.recommendSection` | mb 32px |
| Recommend card | `.recommendCard` | bg #F8F9FA, radius 12px, pad 16px, mb 12px, border-left 4px #4A90D9 |
| Recommend label | `.recommendLabel` | 14px, weight 600, mb 4px |
| Recommend reason | `.recommendReason` | 13px, color #666, mb 8px |
| Recommend items | `.recommendItems` | flex, gap 8px, wrap |
| Recommend chip | `.recommendChip` | bg #4A90D9, white, pad 6px 14px, radius 20px, 13px |
| Category section | `.categorySection` | mt 8px |
| Category grid | `.categoryGrid` | grid 3-col, gap 16px |
| Category card | `.categoryCard` | flex-col center, pad 32px 16px, bg white, border 1px #E0E0E0, radius 12px |
| Category icon | `.categoryIcon` | 36px |
| Category name | `.categoryName` | 16px, weight 600 |
| Category count | `.categoryCount` | 13px, color #888 |

### Data Fields

| Rendered | Source |
|---|---|
| `categoryCounts[cat]` | Count of `PracticeItem` per `PracticeCategory` |
| `scoreRecommendations[].scoreTitle` | Derived from `Score.title` |
| `scoreRecommendations[].reason` | Computed recommendation logic |
| `scoreRecommendations[].items[]` | `PracticeItem.{id, title, category, difficulty}` |
| `weaknessRecommendations[].reason` | Derived from `UserWeakness` |

---

## 5. Practice List Page (`/[userId]/practice/[category]` — `practiceList.tsx`)

```
+----------------------------------------------------------+
| h1 "CategoryTitle"                     ← 練習メニュー     |
|                                                          |
| FILTER BAR:                                              |
| [調: 全て ▼]  [難易度: 全て ▼]  [ポジション: 全て ▼]       |
|                                                          |
| +------------------------------------------------------+ |
| | Title ★★★☆☆                                          | |
| | Composer                                              | |
| | G 長調 · 1st, 3rd · デタシェ, スピッカート              | |
| | Short description                                     | |
| | 最終練習: 2024/01/15 · 練習回数: 5回                   | |
| +------------------------------------------------------+ |
| (repeat)                                                 |
|                                                          |
| EMPTY: "該当する練習メニューがありません"                   |
+----------------------------------------------------------+
```

### Component Inventory

| Element | CSS Class | Key Styles |
|---|---|---|
| List header | `.listHeader` | flex, space-between, align-center, mb 16px |
| Back link | inline style | font-size 13px, color #4A90D9 |
| Filters | `.filters` | flex, gap 12px, mb 20px, wrap |
| Filter select | `.filterSelect` | pad 6px 12px, border 1px #CCC, radius 6px, 13px |
| Item list | `.itemList` | flex column, gap 8px |
| Item card | `.itemCard` | block, pad 16px, bg white, border 1px #E0E0E0, radius 8px |
| Item card hover | `.itemCard:hover` | shadow 0 2px 8px rgba(0,0,0,0.06) |
| Item title | `.itemTitle` | 15px, weight 600, mb 4px |
| Item composer | `.itemComposer` | ⚠️ NOT FOUND IN SOURCE — CSS class referenced but not defined in practice.module.css |
| Item meta | `.itemMeta` | 12px, color #888 |
| Item description | `.itemDescription` | ⚠️ NOT FOUND IN SOURCE — CSS class referenced but not defined in practice.module.css |
| Item history | `.itemHistory` | 12px, color #4A90D9, mt 4px |
| Stars filled | `.starFilled` | ⚠️ NOT FOUND IN practice.module.css — may inherit from admin.module.css or be undefined |
| Stars empty | `.starEmpty` | ⚠️ NOT FOUND IN practice.module.css — same issue |
| Empty state | `.emptyState` | center, pad 40px, color #999, 14px |

### Filter Options
1. **Key** (`key`): `{tonic}_{mode}` format, display as `"{tonic} {長調|短調}"`
2. **Difficulty** (`difficulty`): Int 1-5, display as filled/empty stars
3. **Position** (`position`): only shown if options exist

### Data Fields (mapped to Prisma `PracticeItem`)

| Rendered | Prisma Field |
|---|---|
| `item.title` | `PracticeItem.title` |
| `item.composer` | `PracticeItem.composer` |
| `item.difficulty` | `PracticeItem.difficulty` (Int 1-5) |
| `item.keyTonic` | `PracticeItem.keyTonic` |
| `item.keyMode` | `PracticeItem.keyMode` |
| `item.positions` | `PracticeItem.positions` (String[]) |
| `item.techniques` | via `PracticeItemTechnique` → `TechniqueTag.name` |
| `item.descriptionShort` | `PracticeItem.descriptionShort` |
| `item.lastPracticed` | Derived: max `PracticePerformance.uploadedAt` |
| `item.totalPractices` | Derived: count of `PracticePerformance` |

---

## 6. Practice Detail Page (`/[userId]/practice/[category]/[itemId]` — `page.tsx`)

```
+----------------------------------------------------------+
| ← CategoryLabel (13px, #4A90D9 link)                     |
| [description box: bg #F8F9FA, radius 8px, pad 8px 12px]  |
| meta: "G 長調 · 推奨テンポ: 60-90 · 1st, 3rd · デタシェ"  |
|                                                          |
| === ScoreDetail component (same as Section 3) ===        |
+----------------------------------------------------------+
```

### Differences from Score Detail (Section 3)
- Adds breadcrumb link back to category list
- Adds description box (inline style: `fontSize: 14, color: #555, pad: 8px 12px, bg: #F8F9FA, radius: 8`)
- Adds meta line (inline style: `fontSize: 12, color: #888, mb: 8px`)
- Wrapping container: inline style `maxWidth: 1200, margin: 0 auto, pad: 16px 24px 0`
- Uses `uploadPracticeRecord` action instead of `uploadScore`
- Reuses the full `<ScoreDetail>` component passing `PracticeItem` data shaped as `score: { id, title }`

### Data Fields (mapped to Prisma `PracticeItem`)

| Rendered | Prisma Field |
|---|---|
| `item.title` | `PracticeItem.title` |
| `item.description` | `PracticeItem.description` |
| `item.keyTonic + keyMode` | `PracticeItem.keyTonic`, `PracticeItem.keyMode` |
| `item.tempoMin + tempoMax` | `PracticeItem.tempoMin`, `PracticeItem.tempoMax` |
| `item.positions` | `PracticeItem.positions` |
| `item.techniques[].techniqueTag.name` | via `PracticeItemTechnique` → `TechniqueTag.name` |
| `item.generatedXmlPath` | `PracticeItem.generatedXmlPath` |
| `item.analysisPath` | `PracticeItem.analysisPath` |
| Performances | `PracticePerformance` records for this item+user |

---

## 7. Share Page (`/[userId]/share` — `page.tsx`)

```
+----------------------------------------------------------+
| h1 "共有"                                                 |
+----------------------------------------------------------+
```

**Minimal stub.** Only renders `<h1>共有</h1>` inside a `<div>`. No additional sections, styles, or data.

---

## 8. Admin Practice Page (`/[userId]/admin/practice` — `adminPractice.tsx`)

```
+----------------------------------------------------------+
| h1 "練習メニュー管理"                  [新規登録] / [閉じる]|
|                                                          |
| [message banner if present]                               |
|                                                          |
| FORM (toggled by button):                                |
| +------------------------------------------------------+ |
| | h2 "新規登録"                                         | |
| | [MusicXML ファイル *]  file input                     | |
| | [タイトル *]           text input                     | |
| | [作曲者]               text input                     | |
| | [カテゴリ *]           (●音階 ○アルペジオ ○エチュード)  | |
| | [難易度 *]             ★★★☆☆ (3/5)                   | |
| | [調 *]  [C▼] [長調▼]  [推奨テンポ] [60] 〜 [90]       | |
| | [ポジション]  ☑1st ☐2nd ☑3rd ...                      | |
| | [技法タグ]   grouped by category, click/dblclick      | |
| | [短い説明]   text input                               | |
| | [詳細説明]   textarea                                 | |
| | [登録]                                                | |
| +------------------------------------------------------+ |
|                                                          |
| TABLE: "登録済み (N件)"                                   |
| |タイトル|カテゴリ|難易度|調|テンポ|技法|状態|公開|         |
| |--------|--------|------|--|------|----|----|----| ...    |
+----------------------------------------------------------+
```

### Component Inventory

| Element | CSS Class | Key Styles |
|---|---|---|
| Container | `.container` | max-width 1200px, pad 24px |
| Header | `.header` | flex, space-between, align-center, mb 24px |
| Page title | `.pageTitle` | 24px, weight 700 |
| Primary button | `.primaryBtn` | bg #4A90D9, white, pad 8px 20px, radius 6px, 14px |
| Primary btn hover | `.primaryBtn:hover` | bg #3A7BC8 |
| Primary btn disabled | `.primaryBtn:disabled` | bg #AAA |
| Message | `.message` | bg #E3F2FD, pad 12px, radius 8px, 14px |
| Form card | `.formCard` | bg #F8F9FA, radius 12px, pad 24px, border 1px #E0E0E0 |
| Form title | `.formTitle` | 18px, weight 600, mb 16px |
| Form grid | `.formGrid` | flex-col, gap 16px, mb 20px |
| Field label | `.field label` | 13px, weight 600, color #333 |
| Field input | `.field input/select/textarea` | width 100%, pad 8px 12px, border 1px #CCC, radius 6px, 14px |
| Field row | `.fieldRow` | flex, gap 24px |
| Inline group | `.inlineGroup` | flex, gap 8px, align-center |
| Radio group | `.radioGroup` | flex, gap 16px, wrap |
| Checkbox group | `.checkboxGroup` | flex, gap 16px, wrap |
| Stars | `.stars` | 20px, letter-spacing 2px |
| Star filled | `.starFilled` | color #F5A623 |
| Star empty | `.starEmpty` | color #DDD |
| Tag | `.tag` | pad 3px 10px, radius 12px, bg #EEE, color #555, 12px |
| Tag selected | `.tagSelected` | bg #4A90D9, white |
| Tag primary | `.tagPrimary` | bg #E65100, white |
| Tag small | `.tagSmall` | bg #E8F0FE, color #1967D2, pad 1px 6px, radius 8px, 11px |
| Hint | `.hint` | 12px, color #888 |
| Table | `.table` | width 100%, collapse, 13px |
| Table header | `.table th` | pad 8px 12px, border-bottom 2px #E0E0E0, weight 600, color #555 |
| Table cell | `.table td` | pad 8px 12px, border-bottom 1px #EEE |
| Table row hover | `.table tr:hover` | bg #F5F5F5 |
| Status done | `.statusDone` | color #2E7D32, 12px |
| Status processing | `.statusProcessing` | color #E65100, 12px |

### Form Fields (mapped to Prisma `PracticeItem`)

| Form Field | Required | Prisma Field | Input Type |
|---|---|---|---|
| MusicXML ファイル | * | `originalXmlPath` (uploaded) | file (.musicxml, .mxl, .xml) |
| タイトル | * | `title` | text |
| 作曲者 | | `composer` | text |
| カテゴリ | * | `category` (PracticeCategory enum) | radio (scale/arpeggio/etude) |
| 難易度 | * | `difficulty` (Int 1-5) | star click |
| 調 | * | `keyTonic` + `keyMode` | 2 selects |
| 推奨テンポ | | `tempoMin` + `tempoMax` | 2 number inputs |
| ポジション | | `positions` (String[]) | checkboxes (1st-7th) |
| 技法タグ | | via `PracticeItemTechnique` | tag chips with click/dblclick |
| 短い説明 | | `descriptionShort` | text |
| 詳細説明 | | `description` | textarea |

### Technique Tag Selector Behavior
- Tags grouped by `TechniqueTag.category`
- Single click: toggle selection (`.tagSelected` bg #4A90D9)
- Double click: toggle primary (`.tagPrimary` bg #E65100, shows "●" suffix)
- Hint text: "クリック: 選択/解除　ダブルクリック: 主要タグ指定"

---

## 9. OSMD Overlay System

### Score Detail Overlay (scoreDetail.tsx — SVG colorization)

Notes are colorized by modifying SVG `fill` and `stroke` attributes on `g.vf-stavenote` elements.

| Visual Effect | Trigger Condition (from code) | Color | Hex |
|---|---|---|---|
| Green note | `pitch_ok === true` AND (`start_ok === true` OR `evaluation_status !== "evaluated"`) | Green | `#22AA44` |
| Orange note | `evaluation_status === "evaluated"` AND `start_ok === false` AND `pitch_ok !== false` | Orange | `#EE8800` |
| Red note | `pitch_ok === false` | Red | `#EE2222` |
| Grey note | `evaluation_status === "not_evaluated"` OR `evaluation_status === "section_missing"` | Grey | `#AAAAAA` |
| Blue highlight | Currently playing note during score playback | Blue | `#2266FF` |

**Color determination logic** (from `getComparisonColor` function, scoreDetail.tsx:78-85):
```
if evaluation_status is "not_evaluated" or "section_missing" → GREY
if pitch_ok is false → RED
if evaluation_status is "evaluated" and start_ok is false → ORANGE
otherwise → GREEN
```

### Standalone Visualizer Overlay (app/page.tsx — DOM markers)

Markers are created as positioned `<div>` elements overlaid on `g.vf-notehead` positions.

| Marker Symbol | Trigger Condition (from code) | Color | Font Size |
|---|---|---|---|
| `⚠ ここから演奏がずれています` | Null block (≥3 consecutive null `detected_start_sec`) AND recovery `start_diff_sec` ≥ 0.15s | `blue` | 14px |
| `ℹ 一時的に検出できませんでした` | Null block (≥3 consecutive null) AND recovery diff < 0.15s | `purple` | 14px |
| `×` | Single null `detected_start_sec` (not part of a null block) | `green` | 18px |
| `↑` | `pitch_cents_error` > 0 AND < 100 AND > PITCH_TOLERANCE(10) | `orange` | 18px |
| `↑↑` | `pitch_cents_error` ≥ 100 | `red` | 18px |
| `↓` | `pitch_cents_error` < 0 AND > -100 AND abs > PITCH_TOLERANCE(10) | `orange` | 18px |
| `↓↓` | `pitch_cents_error` ≤ -100 | `red` | 18px |
| (no marker) | `pitch_cents_error` is null OR abs ≤ PITCH_TOLERANCE(10) | — | — |

**Constants** (from page.tsx):
- `PITCH_TOLERANCE = 10` cents
- `NULL_CONSECUTIVE = 3` notes
- `RECOVERY_DIFF_THRESHOLD = 0.15` seconds

---

## 10. Shared Components

### Patterns appearing in 2+ files

| Pattern | Files Used | Description |
|---|---|---|
| `ScoreDetail` component | `top/[scoreId]/scoreDetail.tsx`, `practice/[category]/[itemId]/page.tsx` | Full score viewer with audio, eval, history — reused for both scores and practice items |
| Stars display | `practice/[category]/practiceList.tsx`, `admin/adminPractice.tsx` | 5-star difficulty display with `.starFilled`/`.starEmpty` |
| Category labels map | `practiceTop.tsx`, `practiceList.tsx`, `adminPractice.tsx`, `practice/[itemId]/page.tsx` | `{ scale: "音階", arpeggio: "アルペジオ", etude: "エチュード" }` |
| Mode labels map | `practiceList.tsx`, `adminPractice.tsx` | `{ major: "長調", minor: "短調" }` |
| Page title pattern | All page components | `h1.pageTitle` with 24-30px, weight 700-800 |
| Card pattern | `layout.module.css`, `scoreDetail.module.css`, `practice.module.css` | White bg, rounded corners, subtle shadow |
| Empty state | `TopClient.tsx`, `practiceList.tsx` | Centered text message when no items |
| Upload modal pattern | `UploadModal` (score upload), `UploadRecordModal` (performance upload) | Modal overlay with form |

### Shared CSS Module Classes (duplicated across files)

| Class | layout.module.css | Sidebar.module.css | Header.module.css |
|---|---|---|---|
| `.header` | ✅ (defined) | — | ✅ (duplicated) |
| `.sidebar` | ✅ (defined) | ✅ (duplicated) | — |
| `.navItem` / `.navItemActive` | ✅ (defined) | ✅ (duplicated) | — |

> Note: CSS Module scoping means the duplicate definitions don't conflict, but the styles in `layout.module.css` are not actually used (the dedicated module files are imported instead).

---

## 11. Figma Frame Specs

| Page | Recommended Frame Size | Notes |
|---|---|---|
| Shell (Layout) | 1440 × 900 | Full viewport, sidebar 220px + main content area |
| Score List (Top) | 1440 × 900 | Main content area fills remaining width after sidebar |
| Score Detail | 1440 × 1024 | Two-column layout (320px + flex), may need vertical scroll for long scores |
| Practice Top | 1440 × 800 | 3-column category grid, recommendation cards above |
| Practice List | 1440 × 900 | Filter bar + scrollable item list |
| Practice Detail | 1440 × 1024 | Same as Score Detail with added header area |
| Share | 1440 × 400 | Minimal stub — placeholder page |
| Admin Practice | 1440 × 1200 | Form (when expanded) + data table, potentially long |
| Upload Modal | 900 × auto | Modal overlay, 900px width, max 90% viewport |
| OSMD Visualizer (root) | 1440 × 900 | Standalone full-page music display |
| Mobile (responsive) | 375 × 812 | Only scoreDetail has `@media (max-width: 900px)` breakpoint |

---

## 12. Gaps & Design Decisions Needed

| # | Gap | Context | Severity |
|---|---|---|---|
| 1 | `.itemComposer` CSS class not defined | Referenced in `practiceList.tsx:118` but not in `practice.module.css` | Medium — items render but composer may be unstyled |
| 2 | `.itemDescription` CSS class not defined | Referenced in `practiceList.tsx:125` but not in `practice.module.css` | Medium — same unstyled issue |
| 3 | `.starFilled` / `.starEmpty` not defined in `practice.module.css` | `practiceList.tsx` imports `practice.module.css` but stars classes only exist in `admin.module.css` | High — stars in practice list may not render with correct colors |
| 4 | Share page has no design | `share/page.tsx` is a stub with only `<h1>共有</h1>` | High — needs full design |
| 5 | Profile page not found | Sidebar links to `/[userId]/profile` but no `profile` directory or page found | High — needs design and implementation |
| 6 | Header height not explicitly set | Header uses `padding: 12px 20px` but no fixed height; computed ~44px depending on content | Low — implicit from padding |
| 7 | No responsive design for most pages | Only `scoreDetail.module.css` has a `@media` query; all other pages lack mobile breakpoints | High — mobile experience undefined |
| 8 | No dark mode support | All colors are hardcoded light-mode values | Low — unless dark mode is planned |
| 9 | Font family only specified in scoreDetail | `font-family: "Helvetica Neue", sans-serif` only in `scoreDetail.module.css:8`; other pages inherit browser default | Medium — inconsistent typography |
| 10 | UploadModal and UploadRecordModal internal design | These components were referenced but their internal structure was not among the files specified to read | Medium — need to read those files for complete spec |
| 11 | Login/SignUp/ForgotPassword pages | CSS modules exist (`login/page.module.css`, `signUp/page.module.css`, etc.) but were not in scope | Low — auth pages need separate spec |
| 12 | Badge classes defined but unused | `.badge`, `.badgeBeginner`, `.badgeIntermediate`, `.badgeAdvanced` defined in `practice.module.css` but not referenced in any TSX | Low — leftover CSS or planned feature |
| 13 | Tailwind CSS v4 installed but unused | `tailwindcss` and `@tailwindcss/postcss` are in devDependencies but no Tailwind utility classes are used anywhere in the codebase | Low — clarify if migration is planned |
