This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Repository Structure (Monorepo)

This repository is a monorepo containing three components:

```
music-app/                    # Next.js 16 App Router (this directory)
├── app/                      # Next.js application code
├── prisma/                   # Prisma schema and migrations
├── public/                   # Static assets
├── music-analyzer/           # Python audio analysis pipeline (Cloud Run Jobs)
│   ├── analyze_performance.py    # Performance analysis (librosa-based)
│   ├── analyze_musicxml.py       # MusicXML metadata extraction
│   ├── build_score.py            # Score generation and skill scoring
│   ├── entrypoint.py             # Cloud Run Jobs entry point
│   ├── improvement_plan.md       # PDCA improvement notes
│   ├── data/                     # Sample analysis artifacts
│   ├── tests/cases/              # PDCA test cases
│   └── ...
└── relay-service/            # Cloud Run Service (HTTP relay)
    ├── main.py                   # FastAPI app that triggers Cloud Run Jobs
    ├── Dockerfile
    └── requirements.txt
```

### Component Roles

| Component | Runtime | Deployment Target |
|---|---|---|
| `music-app/` (Next.js) | Vercel | Vercel |
| `music-analyzer/` (Python) | Cloud Run Jobs | GCP |
| `relay-service/` (FastAPI) | Cloud Run Service | GCP |

### Data Flow

```
Browser
  → uploadRecord.ts (Server Action)
  → Supabase Storage (audio file upload)
  → app/_libs/pythonRunner.ts
  → RELAY_URL (env var)
  → relay-service/main.py (Cloud Run Service)
  → Cloud Run Jobs trigger
  → music-analyzer/analyze_performance.py
  → comparison_result.json + DB write
  → Score detail page (overlay rendering via OSMD)
```

### Migration Note

This monorepo structure was established on 2026-05-06 by importing previously
Git-untracked sibling directories (`../music-analyzer/`, `../relay-service/`)
into the existing `music-app.git` repository.
