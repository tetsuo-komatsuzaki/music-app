# Music App - Project Architecture Documentation

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [ER Diagram](#2-er-diagram)
3. [System Architecture](#3-system-architecture)
4. [Data Flow - Score Upload Sequence](#4-data-flow---score-upload-sequence)
5. [Main Modules and Responsibilities](#5-main-modules-and-responsibilities)
6. [Entity Relationships Explained](#6-entity-relationships-explained)

---

## 1. Directory Structure

```
music-app/
├── app/
│   ├── [userId]/                        # Dynamic user-scoped pages
│   │   ├── admin/
│   │   │   ├── adminPractice.tsx         # Admin form for practice items
│   │   │   └── practice/
│   │   │       └── page.tsx             # Admin practice management page
│   │   ├── components/
│   │   │   ├── Header.tsx               # App header (logo, title)
│   │   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   │   ├── UploadModal.tsx          # MusicXML score upload modal
│   │   │   └── UploadRecordModal.tsx    # Performance recording upload modal
│   │   ├── practice/                    # Practice module pages
│   │   │   ├── [category]/
│   │   │   │   ├── [itemId]/
│   │   │   │   │   └── page.tsx         # Individual practice item detail
│   │   │   │   ├── page.tsx             # Category listing (server)
│   │   │   │   └── practiceLIst.tsx     # Category listing (client, filters)
│   │   │   ├── page.tsx                 # Practice top (server, recommendations)
│   │   │   └── practiceTop.tsx          # Practice top (client)
│   │   ├── profile/
│   │   │   └── page.tsx                 # User profile page
│   │   ├── share/
│   │   │   └── page.tsx                 # Teacher sharing page
│   │   ├── top/                         # Score management pages
│   │   │   ├── [scoreId]/
│   │   │   │   ├── page.tsx             # Score detail (server)
│   │   │   │   └── scoreDetail.tsx      # Score detail (client)
│   │   │   ├── page.tsx                 # Score list (server)
│   │   │   └── TopClient.tsx            # Score list (client)
│   │   └── layout.tsx                   # User area layout (Header + Sidebar)
│   │
│   ├── _libs/                           # Shared library clients
│   │   ├── prisma.ts                    # Prisma client (PostgreSQL + PrismaPg adapter)
│   │   ├── storageAdmin.ts              # Supabase storage (service role)
│   │   ├── supabase.ts                  # Generic Supabase client
│   │   ├── supabaseBrowser.ts           # Browser-side Supabase client
│   │   └── supabaseServer.ts            # Server-side Supabase client
│   │
│   ├── actions/                         # Next.js Server Actions
│   │   ├── signUpAction.ts              # User registration
│   │   ├── uploadScore.ts               # MusicXML score upload + analysis
│   │   ├── uploadRecord.ts              # Performance recording upload + analysis
│   │   ├── uploadPracticeRecord.ts      # Practice recording upload + analysis
│   │   └── uploadPracticeItem.ts        # Admin: create practice item
│   │
│   ├── api/                             # REST API Routes
│   │   └── practice/
│   │       ├── analyze-weaknesses/
│   │       │   └── route.ts             # POST: analyze user weaknesses
│   │       ├── history/
│   │       │   └── route.ts             # GET: practice history
│   │       ├── items/
│   │       │   ├── route.ts             # GET: list/filter practice items
│   │       │   └── [itemId]/
│   │       │       └── route.ts         # GET: single practice item
│   │       ├── performances/
│   │       │   └── route.ts             # POST: create practice performance
│   │       └── recommendations/
│   │           └── route.ts             # GET: personalized recommendations
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                 # OAuth callback handler
│   │
│   ├── generated/prisma/               # Prisma generated client
│   ├── types/
│   │   └── score.ts                     # ScoreView interface
│   │
│   ├── login/page.tsx                   # Login page
│   ├── signUp/page.tsx                  # Sign-up page
│   ├── forgotPassword/page.tsx          # Password reset page
│   ├── updatePassword/updatePassword.tsx
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Score comparison visualizer (OSMD)
│
├── prisma/
│   ├── schema.prisma                    # Database schema definition
│   └── migrations/                      # Migration history
│
├── scripts/
│   └── seed-technique-tags.ts           # Seed TechniqueTag data
│
├── public/                              # Static assets
│
├── package.json                         # Dependencies & scripts
├── tsconfig.json                        # TypeScript config
├── next.config.ts                       # Next.js config (50MB body limit)
├── prisma.config.ts                     # Prisma config
└── eslint.config.mjs                    # ESLint config
```

---

## 2. ER Diagram

```mermaid
erDiagram
    User {
        String id PK "cuid()"
        String supabaseUserId UK
        String name
        String role "student | teacher"
        String plan "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    Score {
        String id PK "cuid()"
        String createdById FK
        String title
        String composer "nullable"
        String arranger "nullable"
        String originalXmlPath
        String generatedXmlPath "nullable"
        JobStatus analysisStatus "processing | done | error"
        JobStatus buildStatus "processing | done | error"
        String keyTonic "nullable"
        String keyMode "nullable"
        Int timeNumerator "nullable"
        Int timeDenominator "nullable"
        Int defaultTempo "nullable"
        DateTime createdAt
    }

    Performance {
        String id PK "cuid()"
        String userId FK
        String scoreId FK
        PerformanceType performanceType "user | pro"
        PerformanceStatus performanceStatus "uploaded | invalid | deleted"
        String audioPath
        String audioFeaturesPath "nullable"
        String comparisonResultPath "nullable"
        String pseudoXmlPath "nullable"
        Float performanceDuration "nullable"
        DateTime performanceDate "nullable"
        DateTime uploadedAt
        DateTime createdAt
    }

    PracticeItem {
        String id PK "cuid()"
        PracticeCategory category "scale | arpeggio | etude"
        String title
        String composer "nullable"
        String description "nullable"
        String descriptionShort "nullable"
        Int difficulty "1-5"
        String keyTonic
        String keyMode
        Int tempoMin "nullable"
        Int tempoMax "nullable"
        StringArray positions
        String instrument "default: violin"
        String originalXmlPath
        String generatedXmlPath "nullable"
        String analysisPath "nullable"
        JobStatus analysisStatus
        JobStatus buildStatus
        String source "nullable"
        Int sortOrder
        Boolean isPublished
        Json metadata "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    TechniqueTag {
        String id PK "cuid()"
        String category
        String name
        String nameEn "nullable"
        String description "nullable"
        StringArray xmlTags
        String isAnalyzable
        String implementStatus
    }

    PracticeItemTechnique {
        String practiceItemId PK_FK
        String techniqueTagId PK_FK
        Boolean isPrimary "default: false"
    }

    PracticePerformance {
        String id PK "cuid()"
        String userId FK
        String practiceItemId FK
        String audioPath
        String comparisonResultPath "nullable"
        Float performanceDuration "nullable"
        DateTime uploadedAt
    }

    UserWeakness {
        String id PK "cuid()"
        String userId FK
        String weaknessType "key_area | pitch_range | timing | technique"
        String weaknessKey
        String techniqueTagId FK "nullable"
        Float severity
        Int sampleCount
        DateTime lastUpdated
    }

    User ||--o{ Score : "creates"
    User ||--o{ Performance : "records"
    User ||--o{ PracticePerformance : "practices"
    User ||--o{ UserWeakness : "has"

    Score ||--o{ Performance : "has"

    PracticeItem ||--o{ PracticePerformance : "practiced in"
    PracticeItem ||--o{ PracticeItemTechnique : "tagged with"

    TechniqueTag ||--o{ PracticeItemTechnique : "applied to"
    TechniqueTag ||--o{ UserWeakness : "linked to"
```

---

## 3. System Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        UI["React Pages<br/>(Next.js App Router)"]
        OSMD["OpenSheetMusicDisplay<br/>(Score Renderer)"]
        SupaBrowser["Supabase Browser Client<br/>(Auth)"]
    end

    subgraph Server["Next.js Server"]
        SA["Server Actions<br/>uploadScore / uploadRecord<br/>uploadPracticeRecord<br/>uploadPracticeItem / signUp"]
        API["API Routes<br/>/api/practice/*<br/>items / history / performances<br/>recommendations / analyze-weaknesses"]
        AuthCB["Auth Callback<br/>/auth/callback"]
    end

    subgraph External["External Services"]
        SupaAuth["Supabase Auth"]
        SupaStorage["Supabase Storage<br/>Buckets: musicxml, performances"]
        PG["PostgreSQL<br/>(Supabase-hosted)"]
        Python["Python Analyzer<br/>analyze_musicxml.py<br/>build_score.py<br/>analyze_performance.py"]
    end

    subgraph DataLayer["Data Access Layer"]
        Prisma["Prisma ORM<br/>(PrismaPg Adapter)"]
        StorageAdmin["Storage Admin Client<br/>(Service Role Key)"]
    end

    UI -->|"form submit"| SA
    UI -->|"fetch"| API
    UI --> OSMD
    SupaBrowser -->|"OAuth / session"| SupaAuth
    AuthCB -->|"exchange code"| SupaAuth

    SA --> Prisma
    SA --> StorageAdmin
    SA -->|"exec"| Python
    API --> Prisma

    Prisma -->|"SQL"| PG
    StorageAdmin -->|"upload / download"| SupaStorage
    Python -->|"read / write"| SupaStorage
    Python -->|"read"| PG
```

---

## 4. Data Flow - Score Upload Sequence

```mermaid
sequenceDiagram
    actor U as User
    participant UI as Browser (UploadModal)
    participant SA as Server Action (uploadScore)
    participant Auth as Supabase Auth
    participant DB as PostgreSQL (Prisma)
    participant S3 as Supabase Storage (musicxml)
    participant Py1 as analyze_musicxml.py
    participant Py2 as build_score.py

    U->>UI: Select MusicXML file + enter title
    UI->>SA: FormData (title, composer, file)

    SA->>SA: Validate file (≤5MB, .xml/.musicxml/.mxl)

    SA->>Auth: getUser()
    Auth-->>SA: Supabase user

    SA->>DB: findUnique(User by supabaseUserId)
    DB-->>SA: dbUser

    SA->>DB: score.create(title, composer, status=processing)
    DB-->>SA: score (with id)

    SA->>S3: upload(musicxml, userId/scoreId.ext)
    alt Upload fails
        SA->>DB: score.delete(scoreId)
        SA-->>UI: { error: "Storage保存失敗" }
    end
    S3-->>SA: success

    SA->>DB: score.update(originalXmlPath)

    SA->>Py1: exec analyze_musicxml.py userId scoreId
    Note over Py1: Extracts key, tempo, time signature,<br/>articulations from MusicXML
    Py1->>S3: Write analysis results
    Py1->>DB: Update score (keyTonic, keyMode, etc.)
    Py1-->>SA: done

    SA->>Py2: exec build_score.py userId scoreId
    Note over Py2: Generates display-ready MusicXML<br/>with rendering metadata
    Py2->>S3: Write generatedXmlPath
    Py2->>DB: Update score (generatedXmlPath, statuses=done)
    Py2-->>SA: done

    alt Python script fails
        SA->>DB: score.update(status=error)
        SA-->>UI: throw error
    end

    SA->>SA: revalidatePath(/userId/top)
    SA-->>UI: { success: true }
    UI-->>U: Show new score in list
```

### Performance Recording Upload Flow

```mermaid
sequenceDiagram
    actor U as User
    participant UI as Browser (UploadRecordModal)
    participant SA as Server Action (uploadRecord)
    participant Auth as Supabase Auth
    participant DB as PostgreSQL (Prisma)
    participant S3 as Supabase Storage (performances)
    participant Py as analyze_performance.py

    U->>UI: Record / select WAV file
    UI->>SA: FormData (scoreId, file)

    SA->>Auth: getUser()
    Auth-->>SA: user

    SA->>DB: findUnique(User)
    DB-->>SA: dbUser

    SA->>DB: performance.create(userId, scoreId, type=user, status=uploaded)
    DB-->>SA: performance (with id)

    SA->>S3: upload(performances, userId/scoreId/performanceId.wav)
    alt Upload fails
        SA->>DB: performance.delete()
        SA-->>UI: { error }
    end
    S3-->>SA: success

    SA->>DB: performance.update(audioPath)

    SA->>Py: exec analyze_performance.py userId scoreId performanceId
    Note over Py: Compares recorded audio against<br/>score reference. Outputs:<br/>- audio_features.json<br/>- comparison_result.json<br/>- pseudo.xml
    Py->>S3: Write analysis artifacts
    Py-->>SA: done (failure non-blocking)

    SA->>SA: revalidatePath
    SA-->>UI: { success: true }
    UI-->>U: Show performance with analysis overlay
```

---

## 5. Main Modules and Responsibilities

### 5.1 Authentication Module

| File | Responsibility |
|---|---|
| `app/_libs/supabaseServer.ts` | Creates server-side Supabase client with cookie-based sessions |
| `app/_libs/supabaseBrowser.ts` | Creates browser-side Supabase client for client components |
| `app/auth/callback/route.ts` | Handles OAuth callback, exchanges auth code for session |
| `app/actions/signUpAction.ts` | Creates Supabase auth user + Prisma `User` record (with rollback) |
| `app/login/page.tsx` | Email/password login + Google OAuth |
| `app/signUp/page.tsx` | Registration form (name, email, password, plan, role) |

### 5.2 Score Module

| File | Responsibility |
|---|---|
| `app/actions/uploadScore.ts` | Uploads MusicXML to storage, creates `Score`, triggers Python analysis |
| `app/[userId]/top/page.tsx` | Server component - fetches all scores for a user |
| `app/[userId]/top/TopClient.tsx` | Client component - renders score cards with edit/delete actions |
| `app/[userId]/top/[scoreId]/scoreDetail.tsx` | Score detail view with performance list |
| `app/[userId]/components/UploadModal.tsx` | Modal form for MusicXML file upload |
| `app/page.tsx` | Score comparison visualizer using OpenSheetMusicDisplay |

### 5.3 Performance Module

| File | Responsibility |
|---|---|
| `app/actions/uploadRecord.ts` | Uploads WAV recording, creates `Performance`, runs comparison analysis |
| `app/[userId]/components/UploadRecordModal.tsx` | Modal for recording upload |
| `app/page.tsx` | Renders pitch/timing error overlays on sheet music (↑↓ arrows, color coding) |

### 5.4 Practice Module

| File | Responsibility |
|---|---|
| `app/[userId]/practice/page.tsx` | Practice homepage with personalized recommendations |
| `app/[userId]/practice/practiceTop.tsx` | Client-side practice dashboard |
| `app/[userId]/practice/[category]/practiceLIst.tsx` | Filterable practice item list (key, difficulty, position, technique) |
| `app/[userId]/practice/[category]/[itemId]/page.tsx` | Individual practice item detail + recording |
| `app/actions/uploadPracticeRecord.ts` | Upload practice recording, run analysis |
| `app/actions/uploadPracticeItem.ts` | Admin-only: create practice items with technique tags |

### 5.5 Practice API Module

| Endpoint | Method | Responsibility |
|---|---|---|
| `/api/practice/items` | GET | List/filter practice items by category, key, difficulty, technique |
| `/api/practice/items/[itemId]` | GET | Get single practice item with technique tags |
| `/api/practice/performances` | POST | Create practice performance record |
| `/api/practice/history` | GET | Fetch last 50 performances for a user/item |
| `/api/practice/analyze-weaknesses` | POST | Aggregate recent performances, detect key/pitch/timing weaknesses |
| `/api/practice/recommendations` | GET | Personalized recommendations (score-based, weakness-based) |

### 5.6 Analysis & Recommendation Engine

The weakness analysis system (`/api/practice/analyze-weaknesses`) processes the 20 most recent performances and detects three types of weaknesses:

| Weakness Type | Detection Logic | Threshold |
|---|---|---|
| `key_area` | Error rate per key (tonic + mode) | > 20% |
| `pitch_range` | Error rate by frequency range (low/mid/high/very_high) | > 30% |
| `timing` | Note start timing error rate | > 30% |

The recommendation engine (`/api/practice/recommendations`) uses two strategies:

1. **Score-based**: Matches practice items (scales, arpeggios) to a user's uploaded score by key signature; matches etudes by XML articulation tags
2. **Weakness-based**: Finds practice items targeting the user's identified weaknesses via technique tags

---

## 6. Entity Relationships Explained

### User → Score (1:N)
A user creates and owns multiple scores. Each `Score` stores the uploaded MusicXML file path and analysis results (key, tempo, time signature). The `createdById` foreign key links back to the `User`.

### User → Performance (1:N) via Score
A user records performances against their scores. Each `Performance` is linked to both a `User` and a `Score`. It stores the audio file path and analysis artifacts (audio features, comparison results, pseudo-XML for visualization). Performances can be typed as `user` (student recording) or `pro` (reference recording).

### User → PracticePerformance (1:N) via PracticeItem
Similar to score performances, but for practice exercises. Each `PracticePerformance` links a `User` to a `PracticeItem` and stores the recording and comparison results.

### PracticeItem ↔ TechniqueTag (M:N)
Practice items are tagged with violin techniques (e.g., legato, staccato, vibrato) through the `PracticeItemTechnique` junction table. The `isPrimary` flag distinguishes the main technique from secondary ones. This relationship powers the recommendation engine.

### User → UserWeakness (1:N) → TechniqueTag
Weaknesses are detected by analyzing a user's recent practice performances. Each `UserWeakness` has a type (`key_area`, `pitch_range`, `timing`, `technique`), a severity score, and an optional link to a `TechniqueTag`. The recommendation engine uses these to suggest targeted practice items.

### Score → Performance Analysis Pipeline
```
Score (MusicXML) ──analyze_musicxml.py──→ Key/Tempo/Articulation metadata
                 ──build_score.py──────→ Display-ready MusicXML

Performance (WAV) ──analyze_performance.py──→ comparison_result.json
                                             → audio_features.json
                                             → pseudo.xml (overlay data)
```

The analysis results flow back to the frontend where OpenSheetMusicDisplay renders the score with color-coded performance overlays:
- **Orange arrows** (↑/↓): Small pitch errors (< 100 cents)
- **Red arrows** (↑↑/↓↓): Large pitch errors (≥ 100 cents)
- **Green ×**: Undetected notes
- **Blue ⚠**: Confirmed performance shift
- **Purple ℹ**: Temporary detection loss
