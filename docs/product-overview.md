# Violin Practice — Product Overview

> For non-technical stakeholders
> Last updated: 2026-03-15

---

## What Is Violin Practice?

Violin Practice is a web-based music learning platform that helps violin students improve through **objective, automated feedback** on their playing. Students upload sheet music, record themselves performing it, and receive an instant visual evaluation showing exactly which notes they played correctly and where they need improvement — all without requiring a teacher to be present.

The platform closes the gap between music lessons by giving students a practice companion that listens, evaluates, and recommends what to work on next.

---

## Who Uses It?

| Role | Description | Status |
|---|---|---|
| **Student** | Violin learners who upload scores, record performances, and follow personalized practice plans | Fully implemented |
| **Teacher** | Instructors who can view shared student progress and provide feedback | Role exists; features planned |
| **Admin** | Content managers who curate the practice exercise library (scales, arpeggios, etudes) | Fully implemented |

---

## Main User Journeys

### Journey 1: Student Practices a Piece

```
 Upload        View &         Record          Get Instant       Track
 Sheet Music → Play Score →  Performance →   Evaluation →     Progress
```

1. **Upload sheet music** — The student uploads a MusicXML file (exported from notation software like MuseScore, Sibelius, or Finale). The system processes it within seconds.

2. **View and play the score** — The sheet music renders interactively in the browser. Students can play back a synthesized audio version with a blue highlight following along note by note.

3. **Record a performance** — The student records themselves playing (WAV audio) and uploads it directly from the app.

4. **Get instant evaluation** — The system compares the recording against the original score and colors every note on the sheet music:
   - **Green** — Correct pitch and timing
   - **Orange** — Right note, wrong timing
   - **Red** — Wrong pitch
   - **Grey** — Could not be evaluated

   Summary statistics are shown: pitch accuracy %, timing accuracy %, and perfect match %.

5. **Track progress** — Every recording is saved in a performance history, so students can see how they improve over time.

### Journey 2: Student Follows a Practice Plan

```
 Weaknesses     Personalized        Guided           Repeat &
 Detected →    Recommendations →   Practice →       Improve
```

1. **Weakness detection** — Behind the scenes, the system analyzes patterns across a student's recent recordings. It identifies problem areas such as:
   - Struggling in a specific key (e.g., B-flat major)
   - Poor intonation in a pitch range (e.g., high register)
   - Consistent timing issues
   - Difficulty with a technique (e.g., spiccato)

2. **Personalized recommendations** — The practice menu shows targeted exercises:
   - *"Based on your score 'Concerto in G': try G Major Scale"*
   - *"Based on your weakness in high register: try 3rd Position Exercise"*

3. **Guided practice** — Students work through curated exercises (scales, arpeggios, etudes) with the same record-and-evaluate loop. Each exercise includes metadata like key, tempo, difficulty level, and technique focus.

4. **Continuous improvement** — As weaknesses improve, recommendations update automatically.

### Journey 3: Admin Curates the Exercise Library

```
 Create         Set            Publish →      Students
 Exercise →    Metadata →     Goes Live       See It
```

Administrators upload practice exercises (MusicXML files) with rich metadata:
- Category (scale, arpeggio, or etude)
- Key signature and recommended tempo range
- Difficulty rating (1-5 stars)
- Violin position (1st through 7th)
- Technique tags (detache, spiccato, vibrato, etc.)

Published exercises immediately appear in student practice menus and can be matched to students via the recommendation engine.

### Journey 4: Teacher Reviews Student Progress *(Planned)*

The platform includes a "Share with Teacher" section in the navigation, designed for a future feature where:
- Students share their score and performance data with their teacher
- Teachers can review recordings, view evaluation results, and monitor progress between lessons
- Teachers can assign specific pieces or exercises

This feature is architecturally supported but not yet built.

---

## How the Analysis Works

The core technology is an automated music analysis pipeline that processes two types of input and produces actionable feedback.

### Input → Processing → Output

```
                    ┌──────────────────────────────┐
  Sheet Music       │                              │      Interactive
  (MusicXML)  ───→  │   Analysis Engine (Python)    │  ──→  Score Display
                    │                              │
  Audio Recording   │  1. Parse score structure     │      Color-Coded
  (WAV)       ───→  │  2. Analyze performance audio │  ──→  Evaluation
                    │  3. Compare note-by-note      │
                    └──────────────────────────────┘      Weakness
                                                     ──→  Insights
```

**Step 1 — Score Processing:**
When a student uploads sheet music, the system extracts every note's pitch and timing from the MusicXML file. It also generates a display-optimized version for rendering in the browser.

**Step 2 — Performance Analysis:**
When a student uploads a recording, the system detects the pitches and timing of every note they played.

**Step 3 — Comparison:**
The system aligns the detected performance against the reference score, note by note, and produces:
- **Per-note verdict:** Was the pitch correct? Was the timing correct?
- **Error measurements:** How many cents off was the pitch? How many seconds off was the timing?
- **Overall statistics:** Pitch accuracy, timing accuracy, perfect match rate

**Step 4 — Weakness Aggregation:**
Across multiple performances, the system identifies recurring patterns (struggling with certain keys, pitch ranges, timing, or techniques) and stores them as weakness profiles that drive personalized recommendations.

### What Makes This Valuable

| Traditional Practice | With Violin Practice |
|---|---|
| Students don't know which notes they missed | Every note is color-coded correct/incorrect |
| Feedback only during lessons (1x/week) | Instant feedback on every practice session |
| Teachers guess at recurring problems | Data-driven weakness identification |
| Generic practice assignments | Personalized exercise recommendations |
| No progress visibility between lessons | Full performance history with trends |

---

## Current Platform Capabilities

| Capability | Description |
|---|---|
| Score management | Upload, view, rename, and delete MusicXML scores |
| Interactive score display | Sheet music rendered in-browser with page navigation |
| Synthesized playback | Hear the score played back with visual note tracking |
| Audio recording upload | Upload WAV performance recordings |
| Automated evaluation | Per-note pitch and timing analysis with color overlay |
| Performance history | Track all recordings with timestamps and evaluation status |
| Practice exercise library | Admin-curated scales, arpeggios, and etudes |
| Weakness detection | Automated analysis of recurring errors across performances |
| Personalized recommendations | Score-based and weakness-based practice suggestions |
| Filtering and search | Filter exercises by key, difficulty, and position |
| Authentication | Email/password and Google OAuth sign-in |

---

## Key Future Expansion Points

### 1. Teacher Collaboration *(High Priority)*
The "Share with Teacher" section exists as a navigation placeholder. Building this out would enable:
- Student-teacher pairing
- Shared progress dashboards
- Teacher-assigned exercises and scores
- In-app feedback and annotations on performances

### 2. User Profile and Account Management
The "Profile" page is a placeholder. Expanding it could include:
- User settings (display name, email, password change)
- Subscription/plan management
- Practice statistics dashboard (total hours, streak tracking)
- Connected teachers/students list

### 3. Mobile and Responsive Experience
Currently, only the score detail page adapts to smaller screens. A full responsive redesign or native mobile app would significantly expand accessibility, since most students practice away from a desktop.

### 4. Real-Time Recording *(In-Browser)*
Students currently record externally and upload WAV files. Adding in-browser recording (via the Web Audio API) would streamline the workflow to a single "Record" button press.

### 5. Expanded Instrument Support
The platform is currently branded "Violin Practice" but the underlying MusicXML analysis and audio comparison pipeline is not inherently violin-specific. Supporting additional instruments (viola, cello, flute, etc.) is an architectural possibility.

### 6. Subscription Tiers
The database already includes a `plan` field on user accounts (currently defaulting to "free"). This supports introducing tiered plans with differentiated access to features, exercise libraries, or analysis depth.

### 7. Richer Analytics and Reporting
The weakness detection system already collects structured data. This could be surfaced as:
- Progress charts over time (pitch accuracy trending upward)
- Comparative benchmarks (how does this student compare to others at the same level)
- Exportable reports for teachers or parents

### 8. Content Marketplace
The admin exercise library could evolve into a marketplace where teachers create and share their own curated exercise sets, potentially with licensing or monetization.

---

## Technology Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js + React | Web application framework |
| Score rendering | OpenSheetMusicDisplay (OSMD) | Sheet music visualization in SVG |
| Audio playback | Tone.js | Synthesized score playback |
| Authentication | Supabase Auth | User sign-in (email + Google OAuth) |
| File storage | Supabase Storage | MusicXML files, audio recordings, analysis results |
| Database | PostgreSQL via Prisma ORM | User data, scores, performances, practice items, weaknesses |
| Analysis engine | Python scripts | MusicXML parsing, audio analysis, performance comparison |
| Hosting | Next.js server | Server-side rendering + API routes |
