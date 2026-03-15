# Music Analysis Pipeline — System Architecture

> Source: tetsuo-komatsuzaki/music-app
> Generated: 2026-03-15
> Stack: Next.js 16.1.6, Supabase (auth + storage), Prisma/PostgreSQL, Python analysis scripts

---

## 0. Pipeline Overview

```
 USER / ADMIN                    NEXT.JS SERVER              SUPABASE          PYTHON SCRIPTS          CLIENT UI
 ============                    ==============              ========          ==============          =========

 Upload MusicXML ──────> Server Action ──────> Storage
                         Create DB record      (musicxml
                                                bucket)
                                   |
                                   +──────────────────────> analyze_musicxml.py
                                   |                              |
                                   |                         analysis.json ──> Storage
                                   |
                                   +──────────────────────> build_score.py
                                   |                              |
                                   |                         build_score.musicxml ──> Storage
                                   |
                         Update DB status
                         (done/error)

 Upload WAV ───────────> Server Action ──────> Storage
                         Create DB record      (performances
                                                bucket)
                                   |
                                   +──────────────────────> analyze_performance.py
                                   |                              |
                                   |                         comparison_result.json ──> Storage
                                   |
                         Update DB path
                         (comparisonResultPath)

                                                                          Page request ──> Server Component
                                                                                          Fetch from Storage
                                                                                          (signed URLs)
                                                                                               |
                                                                                               v
                                                                                          Client renders
                                                                                          OSMD + colors
```

---

## 1. Score Upload Pipeline

### Entry Point: `uploadScore` server action

**Source:** `app/actions/uploadScore.ts`

```
+------------------+
| Student uploads  |
| MusicXML file    |
| via UploadModal  |
| (.xml/.musicxml/ |
|  .mxl, max 5MB) |
+--------+---------+
         |
         v
+------------------+       +---------------------+
| Server Action:   |       | Validation:         |
| uploadScore()    +------>| - Auth check        |
|                  |       | - File type check   |
+--------+---------+       | - File size check   |
         |                 +---------------------+
         v
+------------------+
| Supabase Storage |
| Bucket: musicxml |
| Path: {userId}/  |
|  {scoreId}.{ext} |
+--------+---------+
         |
         v
+------------------+
| Prisma: Create   |
| Score record      |
| - title           |
| - composer        |
| - originalXmlPath |
| - analysisStatus: |
|   "processing"    |
| - buildStatus:    |
|   "processing"    |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
PIPELINE A   PIPELINE B
(Analysis)   (Build)
```

### Pipeline A: Music Analysis

```
+----------------------------+
| analyze_musicxml.py        |
| Input: MusicXML from       |
|        Supabase storage    |
+-------------+--------------+
              |
              v
+----------------------------+
| Output: analysis.json      |
|                            |
| {                          |
|   "bpm": 120,             |
|   "notes": [              |
|     {                      |
|       "note_index": 0,    |
|       "type": "note",     |
|       "pitches": [440.0], |
|       "start_time_sec":   |
|         0.0,              |
|       "end_time_sec":     |
|         0.5               |
|     },                     |
|     ...                    |
|   ]                        |
| }                          |
+-------------+--------------+
              |
              v
+----------------------------+
| Upload to Supabase Storage |
| Bucket: musicxml           |
| Path: {userId}/{scoreId}/  |
|       analysis.json        |
+-------------+--------------+
              |
              v
+----------------------------+
| Update Score record:       |
| analysisStatus = "done"    |
| (or "error" on failure)    |
+----------------------------+
```

### Pipeline B: Score Build

```
+----------------------------+
| build_score.py             |
| Input: MusicXML from       |
|        Supabase storage    |
+-------------+--------------+
              |
              v
+----------------------------+
| Output: build_score.musicxml|
| (Display-optimized MusicXML|
|  for OpenSheetMusicDisplay)|
+-------------+--------------+
              |
              v
+----------------------------+
| Upload to Supabase Storage |
| Bucket: musicxml           |
| Path: {userId}/{scoreId}/  |
|       build_score.musicxml |
+-------------+--------------+
              |
              v
+----------------------------+
| Update Score record:       |
| buildStatus = "done"       |
| generatedXmlPath = path    |
| (or "error" on failure)    |
+----------------------------+
```

---

## 2. Performance Recording Pipeline

### Entry Point: `uploadRecord` server action

**Source:** `app/actions/uploadRecord.ts`

```
+------------------+
| Student uploads  |
| WAV recording    |
| via Upload       |
| RecordModal      |
| (48kHz/16bit)    |
+--------+---------+
         |
         v
+------------------+       +---------------------+
| Server Action:   |       | Validation:         |
| uploadRecord()   +------>| - Auth check        |
|                  |       | - scoreId required  |
+--------+---------+       +---------------------+
         |
         v
+------------------+
| Supabase Storage |
| Bucket:          |
|  performances    |
| Path: {userId}/  |
|  {scoreId}/      |
|  {perfId}.wav    |
+--------+---------+
         |
         v
+------------------+
| Prisma: Create   |
| Performance      |
| - performanceType|
|   = "user"       |
| - performanceStatus
|   = "uploaded"   |
| - audioPath      |
| - userId, scoreId|
+--------+---------+
         |
         v
+----------------------------+
| analyze_performance.py     |
| Input:                     |
| - User's WAV recording     |
| - Reference analysis.json  |
|   (from Score analysis)    |
+-------------+--------------+
              |
              v
+----------------------------+
| Output:                    |
| comparison_result.json     |
| (see Section 4 for format) |
+-------------+--------------+
              |
              v
+----------------------------+
| Upload to Supabase Storage |
| Bucket: performances       |
| Path: same dir as audio/   |
|       comparison_result.json|
+-------------+--------------+
              |
              v
+----------------------------+
| Update Performance record: |
| comparisonResultPath = path|
+----------------------------+
              |
              v
+----------------------------+
| Revalidate page cache:     |
| revalidatePath(            |
|  /{userId}/top/{scoreId})  |
+----------------------------+
```

---

## 3. Practice Item Pipeline (Admin)

### Entry Point: `uploadPracticeItem` server action

**Source:** `app/actions/uploadPracticeItem.ts`

```
+------------------+
| Admin uploads    |
| practice item    |
| MusicXML +       |
| metadata         |
+--------+---------+
         |
         v
+------------------+       +---------------------+
| Server Action:   |       | Validation:         |
| uploadPractice   +------>| - Auth check        |
| Item()           |       | - Role = "admin"    |
+--------+---------+       | - File required     |
         |                 | - Title required    |
         v                 +---------------------+
+------------------+
| Supabase Storage |
| Bucket: musicxml |
| Path: practice/  |
|  {itemId}/       |
|  original.       |
|  musicxml        |
+--------+---------+
         |
         v
+------------------+
| Prisma: Create   |
| PracticeItem     |
| - category       |
| - title, composer|
| - difficulty     |
|   (Int 1-5)      |
| - keyTonic,      |
|   keyMode        |
| - tempoMin/Max   |
| - positions[]    |
| - originalXmlPath|
| - analysisStatus:|
|   "processing"   |
| - buildStatus:   |
|   "processing"   |
+--------+---------+
         |
         v
+------------------+
| Create technique |
| associations:    |
| PracticeItem     |
| Technique records|
| (with isPrimary) |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
PIPELINE A'  PIPELINE B'

analyze_      build_
musicxml.py   score.py
--practice-   --practice-
item          item
{itemId}      {itemId}
    |              |
    v              v
analysis.json  build_score.musicxml
    |              |
    v              v
Storage:       Storage:
practice/      practice/
{itemId}/      {itemId}/
analysis.json  build_score.musicxml
    |              |
    v              v
analysisStatus generatedXmlPath
= "done"       = path
analysisPath   buildStatus
= path         = "done"
```

### Practice Performance Sub-pipeline

**Source:** `app/actions/uploadPracticeRecord.ts`

```
Same as Performance Recording Pipeline (Section 2)
but with:
- Storage path: practice/{userId}/{practiceItemId}/{perfId}.wav
- Creates PracticePerformance record (not Performance)
- References PracticeItem's analysis (not Score's)
- Calls analyze_performance.py with practice-specific params
```

---

## 4. Data Formats

### 4.1 analysis.json (Output of analyze_musicxml.py)

```json
{
  "bpm": 120,
  "notes": [
    {
      "note_index": 0,
      "type": "note",
      "pitches": [440.0],
      "start_time_sec": 0.0,
      "end_time_sec": 0.5
    },
    {
      "note_index": 1,
      "type": "rest",
      "pitches": [],
      "start_time_sec": 0.5,
      "end_time_sec": 1.0
    }
  ]
}
```

**Used by:** ScoreDetail client component for:
- Synthesized playback via Tone.js (trianglewave synth)
- Visual note highlighting during playback (blue highlight follows current note)

### 4.2 comparison_result.json (Output of analyze_performance.py)

#### Format v2.0 (current)

```json
{
  "version": "2.0",
  "warnings": [
    "Some notes could not be evaluated due to noise"
  ],
  "results": [
    {
      "note_index": 0,
      "measure_number": 1,
      "note_name": "A4",
      "pitch_ok": true,
      "start_ok": true,
      "pitch_cents_error": 5.2,
      "start_diff_sec": 0.03,
      "evaluation_status": "evaluated"
    },
    {
      "note_index": 1,
      "measure_number": 1,
      "note_name": "B4",
      "pitch_ok": false,
      "start_ok": true,
      "pitch_cents_error": -45.0,
      "start_diff_sec": 0.01,
      "evaluation_status": "evaluated"
    },
    {
      "note_index": 2,
      "measure_number": 2,
      "note_name": "C5",
      "pitch_ok": null,
      "start_ok": null,
      "pitch_cents_error": null,
      "start_diff_sec": null,
      "evaluation_status": "not_evaluated"
    }
  ]
}
```

#### Format v1.0 (legacy)

```json
[
  {
    "note_index": 0,
    "detected_start_sec": 0.52,
    "pitch_cents_error": 5.2,
    "start_diff_sec": 0.03
  }
]
```

#### Evaluation Status Values

| Status | Meaning |
|---|---|
| `"evaluated"` | Both pitch and timing were assessed |
| `"pitch_only"` | Only pitch could be assessed (timing uncertain) |
| `"not_evaluated"` | Note could not be detected in recording |
| `"section_missing"` | Entire section was not performed |

### 4.3 Normalization (v1 → v2)

**Source:** `scoreDetail.tsx:54-66` — `normalizeComparison()` function

Both formats are normalized to the `ComparisonNote` type:

```typescript
type ComparisonNote = {
  note_index: number
  measure_number: number
  note_name: string
  pitch_ok: boolean | null
  start_ok: boolean | null
  pitch_cents_error: number | null
  start_diff_sec: number | null
  evaluation_status: "evaluated" | "pitch_only" | "not_evaluated" | "section_missing"
}
```

---

## 5. Visualization Pipeline

### 5.1 Score Display (OSMD)

```
+------------------+     +-------------------+
| Server Component |     | Supabase Storage  |
| page.tsx         |     |                   |
+--------+---------+     |  musicxml bucket  |
         |               |                   |
         | Check:        |  /{userId}/{id}/  |
         | buildStatus   |  build_score.     |
         | === "done"?   |  musicxml         |
         |               +--------+----------+
         v                        |
  Generate signed         Signed URL (300s)
  URL (300s expiry)              |
         |                       |
         +----------+------------+
                    |
                    v
+----------------------------------------+
| ScoreViewer Client Component           |
|                                        |
| 1. Load MusicXML via signed URL        |
| 2. Initialize OSMD:                    |
|    - autoResize: true                  |
|    - backend: "svg"                    |
|    - drawTitle: false                  |
|    - drawPartNames: false              |
|    - pageFormat: "A4_P"               |
|    - newPageFromXML: true              |
|    - pageBackgroundColor: "#ffffff"    |
|    - zoom: 0.85                        |
| 3. Render to SVG                       |
| 4. Extract g.vf-stavenote elements    |
| 5. Save original fill/stroke colors   |
| 6. Paginate (show one SVG at a time)  |
+----------------------------------------+
```

### 5.2 Comparison Color Overlay

```
comparison_result.json loaded by server
         |
         v
Passed as prop to ScoreDetail
         |
         v
normalizeComparison() → ComparisonNote[]
         |
         v
useEvaluationSummary() → Summary stats
         |
         v
applyComparisonColors()
         |
         v
For each note element (g.vf-stavenote):
+------------------------------------------+
| getComparisonColor(note) logic:          |
|                                          |
| evaluation_status is                     |
| "not_evaluated" or "section_missing"?    |
|     YES → #AAAAAA (grey)                |
|     NO  ↓                               |
| pitch_ok === false?                      |
|     YES → #EE2222 (red)                 |
|     NO  ↓                               |
| evaluation_status === "evaluated"        |
| AND start_ok === false?                  |
|     YES → #EE8800 (orange)              |
|     NO  → #22AA44 (green)               |
+------------------------------------------+
         |
         v
colorizeNote(element, color)
  → Sets fill and stroke on all <path>
    children of the SVG note group
```

### 5.3 Score Playback with Visual Sync

```
User clicks "譜面再生"
         |
         v
+----------------------------+
| Tone.js Setup              |
| - Synth: triangle wave     |
|   attack:0.02, decay:0.1   |
|   sustain:0.3, release:0.4 |
| - Transport: Tone.Part     |
|   with analysis.notes[]    |
+-------------+--------------+
              |
              v
+----------------------------+
| Animation Loop             |
| (requestAnimationFrame)    |
|                            |
| Each frame:                |
| 1. Get Transport.seconds   |
| 2. Find note at current    |
|    time position           |
| 3. Highlight current note  |
|    with #2266FF (blue)     |
| 4. Restore previous note   |
|    to comparison color     |
|    (or original color)     |
+----------------------------+
              |
              v
+----------------------------+
| On playback end:           |
| 1. Stop Transport          |
| 2. Cancel animation        |
| 3. Restore all comparison  |
|    colors                  |
+----------------------------+
```

### 5.4 Standalone Visualizer Overlay (app/page.tsx)

```
+----------------------------+
| Load MusicXML + JSON       |
| /test/output/              |
| pseudo_score.musicxml      |
| comparison_result.json     |
+-------------+--------------+
              |
              v
+----------------------------+
| OSMD renders score         |
| Query: g.vf-notehead       |
+-------------+--------------+
              |
              v
+----------------------------+
| Null Block Detection       |
| (NULL_CONSECUTIVE = 3)     |
|                            |
| Scan for ≥3 consecutive    |
| null detected_start_sec    |
|                            |
| Check recovery position:   |
| |start_diff_sec| ≥ 0.15?  |
| YES → isRealShift = true   |
| NO  → isRealShift = false  |
+-------------+--------------+
              |
              v
+----------------------------+
| Create DOM Markers         |
| (positioned absolute)      |
|                            |
| For each comparison note:  |
|                            |
| Null block start?          |
| ├ Real shift:              |
| │ "⚠ ここから演奏が        |
| │  ずれています"            |
| │ color: blue, 14px        |
| └ Temporary:               |
|   "ℹ 一時的に検出          |
|    できませんでした"         |
|   color: purple, 14px      |
|                            |
| Single null?               |
| → "×" green, 18px          |
|                            |
| Pitch error?               |
| ├ ≥100 cents: "↑↑" red    |
| ├ >0, <100:  "↑" orange   |
| ├ ≤-100:     "↓↓" red     |
| └ <0, >-100: "↓" orange   |
|                            |
| Within tolerance (≤10)?    |
| → no marker                |
+----------------------------+
```

---

## 6. Weakness Analysis Pipeline

### Entry Point: `/api/practice/analyze-weaknesses` (POST)

**Source:** `app/api/practice/analyze-weaknesses/route.ts`

```
+----------------------------+
| Trigger: Client POST       |
| with userId                |
+-------------+--------------+
              |
              v
+----------------------------+
| Fetch last 20 performances |
| (Performance +             |
|  PracticePerformance)      |
| WHERE comparisonResultPath |
|       IS NOT NULL          |
+-------------+--------------+
              |
              v
+----------------------------+
| For each performance:      |
| 1. Get signed URL for      |
|    comparison_result.json  |
| 2. Fetch and parse JSON    |
| 3. Normalize to v2 format  |
+-------------+--------------+
              |
              v
+----------------------------+
| Aggregate across all       |
| performances:              |
|                            |
| KEY AREA WEAKNESS:         |
| - Group by key (tonic+mode)|
| - Pitch error rate > 20%   |
| → weaknessType: "key_area" |
| → weaknessKey: "C_major"   |
|                            |
| PITCH RANGE WEAKNESS:      |
| - Group by octave range    |
|   (low/mid/high/very_high) |
| - Pitch error rate > 30%   |
| → weaknessType:            |
|   "pitch_range"            |
| → weaknessKey: "low"       |
|                            |
| TIMING WEAKNESS:           |
| - Overall timing errors    |
| - Start error rate > 30%   |
| → weaknessType: "timing"   |
| → weaknessKey: "overall"   |
|                            |
| TECHNIQUE WEAKNESS:        |
| - By technique tag         |
| - High error rate          |
| → weaknessType: "technique"|
| → weaknessKey: tag name    |
+-------------+--------------+
              |
              v
+----------------------------+
| Upsert UserWeakness        |
| records:                   |
| - userId                   |
| - weaknessType             |
| - weaknessKey              |
| - techniqueTagId (optional)|
| - severity (0.0 - 1.0)    |
| - sampleCount              |
| - lastUpdated              |
+----------------------------+
```

---

## 7. Recommendation Pipeline

### Entry Point: `/api/practice/recommendations` (GET)

**Source:** `app/api/practice/recommendations/route.ts`

Also computed server-side in `practice/page.tsx`.

```
+----------------------------+
| Input:                     |
| - User's Scores            |
| - User's Weaknesses        |
+-------------+--------------+
              |
         +----+----+
         |         |
         v         v
  SCORE-BASED    WEAKNESS-BASED
  RECOMMENDATIONS RECOMMENDATIONS
         |         |
         v         v
+----------------+ +----------------+
| For each Score | | For each       |
| with keyTonic: | | UserWeakness:  |
|                | |                |
| Find Practice  | | Match by type: |
| Items matching | |                |
| key signature  | | key_area →     |
| (scales +      | |   scales in    |
|  arpeggios)    | |   same key     |
|                | |                |
| Also extract   | | timing →       |
| XML technique  | |   etudes       |
| tags to find   | |                |
| relevant       | | pitch_range →  |
| etudes         | |   by position  |
+--------+-------+ |                |
         |         | technique →    |
         |         |   by tag       |
         |         +--------+-------+
         |                  |
         v                  v
+----------------------------+
| Format:                    |
| scoreRecommendations: [    |
|   {                        |
|     scoreTitle: "...",     |
|     reason: "...",         |
|     items: [               |
|       { id, title,         |
|         category,          |
|         difficulty }       |
|     ]                      |
|   }                        |
| ]                          |
|                            |
| weaknessRecommendations: [ |
|   {                        |
|     reason: "...",         |
|     items: [...]           |
|   }                        |
| ]                          |
+----------------------------+
```

---

## 8. Storage Architecture

### Supabase Buckets

```
SUPABASE STORAGE
================

musicxml/                           performances/
├── {userId}/                       ├── {userId}/
│   ├── {scoreId}.xml               │   ├── {scoreId}/
│   ├── {scoreId}/                  │   │   ├── {perfId}.wav
│   │   ├── analysis.json           │   │   └── comparison_result.json
│   │   └── build_score.musicxml    │   └── ...
│   └── ...                         │
├── practice/                       └── practice/
│   ├── {itemId}/                       ├── {userId}/
│   │   ├── original.musicxml           │   ├── {practiceItemId}/
│   │   ├── analysis.json               │   │   ├── {perfId}.wav
│   │   └── build_score.musicxml        │   │   └── comparison_result.json
│   └── ...                             │   └── ...
└── ...                                 └── ...
```

### Access Pattern

```
+------------------+     +-------------------+
| Server Actions   |     | Server Components |
| (write)          |     | (read)            |
+------------------+     +-------------------+
| Uses:            |     | Uses:             |
| SERVICE_ROLE_KEY |     | SERVICE_ROLE_KEY  |
| via storageAdmin |     | via storageAdmin  |
|                  |     |                   |
| Operations:      |     | Operations:       |
| - upload()       |     | - createSignedUrl |
| - from().upload  |     |   (60-300 sec)    |
+------------------+     +-------------------+
                                  |
                                  v
                          +-------------------+
                          | Client Components |
                          | (read via URL)    |
                          +-------------------+
                          | Uses:             |
                          | Signed URLs       |
                          | (time-limited)    |
                          |                   |
                          | Operations:       |
                          | - fetch() JSON    |
                          | - OSMD.load(url)  |
                          | - <audio src=url> |
                          +-------------------+
```

---

## 9. Database Schema (Pipeline-Relevant Fields)

```
+------------------+         +-------------------+
|     Score        |         |   Performance     |
+------------------+         +-------------------+
| id               |<-----+  | id                |
| title            |      |  | performanceType   |
| composer         |      |  |   ("user"/"pro")  |
| originalXmlPath ─+─> musicxml bucket           |
| generatedXmlPath ─+─> musicxml bucket          |
| analysisStatus   |      |  | performanceStatus |
|  (processing/    |      |  |   ("uploaded"/    |
|   done/error)    |      |  |    "invalid"/     |
| buildStatus      |      |  |    "deleted")     |
|  (processing/    |      |  | audioPath ────────+─> performances bucket
|   done/error)    |      |  | audioFeaturesPath |
| keyTonic         |      |  | comparisonResult  |
| keyMode          |      |  |   Path ───────────+─> performances bucket
| timeNumerator    |      +--+ scoreId            |
| timeDenominator  |         | userId             |
| defaultTempo     |         +-------------------+
+------------------+

+------------------+         +-------------------+
|  PracticeItem    |         | PracticePerformance|
+------------------+         +-------------------+
| id               |<-----+  | id                |
| category         |      |  | userId            |
|  (scale/arpeggio |      +--+ practiceItemId    |
|   /etude)        |         | audioPath ────────+─> performances bucket
| title            |         | comparisonResult  |
| difficulty (1-5) |         |   Path ───────────+─> performances bucket
| keyTonic, keyMode|         | performanceDuration|
| tempoMin/Max     |         | uploadedAt        |
| positions[]      |         +-------------------+
| originalXmlPath ─+─> musicxml bucket
| generatedXmlPath ─+─> musicxml bucket
| analysisPath ────+─> musicxml bucket
| analysisStatus   |
| buildStatus      |         +-------------------+
| isPublished      |         |  UserWeakness     |
+------------------+         +-------------------+
                              | userId            |
+------------------+          | weaknessType      |
| TechniqueTag     |          |  ("key_area"/     |
+------------------+          |   "pitch_range"/  |
| id               |<----+   |   "timing"/       |
| category         |     |   |   "technique")    |
| name             |     +---+ techniqueTagId    |
| nameEn           |         | weaknessKey       |
| xmlTags[]        |         | severity (0-1)    |
| isAnalyzable     |         | sampleCount       |
+------------------+         +-------------------+
```

---

## 10. Job Status State Machine

```
              +---+
              | ? |  (record created)
              +-+-+
                |
                v
        +-------+-------+
        |  processing   |  (initial state, scripts running)
        +---+-------+---+
            |       |
       Success    Failure
            |       |
            v       v
        +---+---+ +-+-----+
        | done  | | error |
        +-------+ +-------+

  Applies to:
  - Score.analysisStatus
  - Score.buildStatus
  - PracticeItem.analysisStatus
  - PracticeItem.buildStatus
```

### Processing Dependencies

```
                  MusicXML Upload
                       |
              +--------+--------+
              |                 |
              v                 v
       analyze_musicxml    build_score
       (Pipeline A)        (Pipeline B)
              |                 |
              v                 v
       analysis.json     build_score.musicxml
              |                 |
              |                 +---> OSMD can render score
              |
              +---> Used as reference for
                    performance comparison
                          |
                          v
                   WAV Upload
                          |
                          v
                   analyze_performance
                          |
                          v
                   comparison_result.json
                          |
              +-----------+-----------+
              |                       |
              v                       v
        Note colorization       Weakness aggregation
        in ScoreDetail          (analyze-weaknesses API)
                                      |
                                      v
                                UserWeakness records
                                      |
                                      v
                                Recommendations
                                (practice/page.tsx)
```

---

## 11. End-to-End Data Flow Example

### Scenario: Student uploads a score, records a performance, gets recommendations

```
TIME ──────────────────────────────────────────────────────>

1. UPLOAD SCORE
   Student → UploadModal → uploadScore action
   │
   ├─ Store MusicXML → musicxml/{userId}/{scoreId}.xml
   ├─ Create Score record (processing/processing)
   ├─ Run analyze_musicxml.py → analysis.json
   │   └─ Score.analysisStatus = "done"
   └─ Run build_score.py → build_score.musicxml
       └─ Score.buildStatus = "done"
                                                     ✓ Score ready

2. VIEW SCORE
   Student → /{userId}/top/{scoreId}
   │
   ├─ Server: signed URL for build_score.musicxml (300s)
   ├─ Server: fetch + parse analysis.json
   └─ Client: OSMD renders sheet music
       └─ Tone.js can play back from analysis.json
                                                     ✓ Score visible

3. UPLOAD RECORDING
   Student → UploadRecordModal → uploadRecord action
   │
   ├─ Store WAV → performances/{userId}/{scoreId}/{perfId}.wav
   ├─ Create Performance record (status: uploaded)
   └─ Run analyze_performance.py
       ├─ Input: WAV + analysis.json (reference)
       ├─ Output: comparison_result.json
       └─ Performance.comparisonResultPath = path
                                                     ✓ Evaluation ready

4. VIEW EVALUATION
   Student → /{userId}/top/{scoreId} (refreshed)
   │
   ├─ Server: fetch comparison_result.json
   ├─ Client: normalize v1/v2 format
   ├─ Client: compute summary (pitch %, timing %, perfect %)
   ├─ Client: colorize OSMD notes (green/orange/red/grey)
   └─ Client: show EvaluationSummaryCard
                                                     ✓ Feedback shown

5. WEAKNESS ANALYSIS (background)
   Client POST → /api/practice/analyze-weaknesses
   │
   ├─ Fetch last 20 comparison results
   ├─ Aggregate error patterns
   └─ Upsert UserWeakness records
       ├─ key_area: "C_major", severity: 0.35
       ├─ timing: "overall", severity: 0.28
       └─ technique: "détaché", severity: 0.42
                                                     ✓ Weaknesses stored

6. GET RECOMMENDATIONS
   Student → /{userId}/practice
   │
   ├─ Server: fetch Score keys → match PracticeItems
   ├─ Server: fetch UserWeakness → match PracticeItems
   └─ Render:
       ├─ 📋 "C Major scale recommended (matches your score)"
       └─ 🎯 "Détaché etude recommended (technique weakness)"
                                                     ✓ Personalized plan

7. PRACTICE
   Student → /{userId}/practice/scale/{itemId}
   │
   ├─ Same ScoreDetail UI as step 2-4
   ├─ Upload practice recording
   ├─ Get evaluation feedback
   └─ Cycle continues...
                                                     ✓ Learning loop
```

---

## 12. System Boundaries & External Dependencies

```
+------------------------------------------+
|           NEXT.JS APPLICATION            |
|                                          |
|  Server Actions    Server Components     |
|  (write ops)       (read + render)       |
|       |                  |               |
|       v                  v               |
|  +--Supabase-----------+                |
|  | Auth (JWT sessions)  |                |
|  | Storage (2 buckets)  |                |
|  +-----+----------------+               |
|        |                                 |
|  +--PostgreSQL (Prisma)--+               |
|  | Users, Scores,        |               |
|  | Performances,         |               |
|  | PracticeItems,        |               |
|  | Weaknesses            |               |
|  +-----------------------+               |
|                                          |
+--------+---------------------------------+
         |
         v (child_process.exec)
+------------------------------------------+
|        PYTHON ANALYSIS SCRIPTS           |
|        (../music-analyzer/)              |
|                                          |
| analyze_musicxml.py                      |
|   Input: MusicXML file                   |
|   Output: analysis.json (notes + timing) |
|                                          |
| build_score.py                           |
|   Input: MusicXML file                   |
|   Output: display-optimized MusicXML     |
|                                          |
| analyze_performance.py                   |
|   Input: WAV audio + analysis.json       |
|   Output: comparison_result.json         |
|           (per-note pitch + timing eval) |
+------------------------------------------+

Note: Python scripts are invoked via child_process.exec()
with hardcoded paths. They read/write to Supabase storage.
```
