# Vocalutor — Voice-Interactive AI Tutoring SaaS

[![CI](https://github.com/harshalchandekar/Converso/actions/workflows/ci.yml/badge.svg)](https://github.com/harshalchandekar/Converso/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-729B1B?logo=vitest)](https://vitest.dev/)

> **Talk to an AI tutor out loud.** Pick a subject, start a voice session, and learn by conversation instead of reading.

---

## 🌟 Key Highlights & Features

- 🎙️ **Bidirectional Real-Time Voice Sessions:** Powered by Vapi AI, orchestrating Deepgram Nova-3 (speech-to-text), ElevenLabs (ultra-realistic synthesis), and OpenAI GPT-4 (pedagogical reasoning) over low-latency WebRTC.
- ⏱️ **Voice-Minute Guardrails & Quotas:** Enforces daily limits (Free: 15 min/day, Pro: 60 min/day) with client-side countdown timers and telephony max-duration termination.
- 🧠 **AI Session Recaps & Interactive Quizzes:** Immediately following every voice session, Google Gemini 2.5 Flash extracts a concise summary, 3 core learnings, and an interactive 3-question MCQ quiz to test concept retention.
- 📊 **Comprehensive Learning Dashboard:** 
  - Real-time active day streaks with timezone boundary handling.
  - 14-day study activity area chart and subject breakdown bar chart powered by Recharts.
  - Customizable weekly study goals with dynamic SVG progress rings.
- 🛡️ **End-to-End Enterprise Security:** Clerk authentication passing JWTs directly into Supabase PostgreSQL Row-Level Security (RLS) policies.
- 💳 **Tiered SaaS Gating:** Subscription limits managed via Clerk billing entitlements (`free`, `pro`, companion creation caps).
- 🧪 **Automated Testing & CI Pipeline:** 21 unit tests covering quota math and streak computation algorithms via Vitest, accompanied by a 3-stage GitHub Actions CI workflow (lint/typecheck → test → production build).

---

## 🛠️ Tech Stack Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Full-stack server components, Server Actions, dynamic routes. |
| **Runtime & UI** | **React 19 & TypeScript 5** | Core frontend with strict type-safety. |
| **Styling** | **Tailwind CSS v4** | Modern utility-first styling with `@tailwindcss/postcss`. |
| **Voice AI Engine** | **Vapi AI Web SDK** | Real-time WebRTC audio streaming with Deepgram + ElevenLabs. |
| **Generative AI** | **Google Gemini 2.5 Flash** | Post-session transcript synthesis, key takeaways, and quiz generation. |
| **Authentication** | **Clerk (`@clerk/nextjs`)** | User auth, route protection middleware, and `<PricingTable />`. |
| **Database** | **Supabase (`@supabase/supabase-js`)** | PostgreSQL with Clerk JWT pass-through and Row-Level Security. |
| **Data Visualization** | **Recharts** | Interactive learning trends and subject distribution charts. |
| **Testing** | **Vitest** | Fast unit testing for pure business logic and algorithms. |
| **Monitoring** | **Sentry (`@sentry/nextjs`)** | Full-stack error telemetry and session replay. |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- Supabase project
- Clerk account
- Vapi account
- Google Gemini API key

### 2. Clone and Install
```bash
git clone https://github.com/harshalchandekar/Converso.git
cd Converso
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

NEXT_PUBLIC_VAPI_WEB_TOKEN=your-vapi-token
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Database Setup
Run the SQL migration scripts located in `supabase/migrations/` inside your Supabase SQL Editor:
1. `001_dashboard_tables.sql` (Creates `user_settings` and `voice_usage` tables with RLS).
2. `002_session_recaps.sql` (Creates `session_recaps` table with JSONB columns and RLS).

### 5. Run the Application
```bash
# Start Next.js development server
npm run dev

# Run unit tests
npm test

# Run ESLint validation
npm run lint

# Production build verification
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to start learning.

---

## 📁 Repository Structure

```
├── app/                               # Next.js App Router routes & pages
│   ├── companions/                    # Library, live session [id], and builder
│   ├── dashboard/                     # Learning analytics & progress dashboard
│   ├── my-journey/                    # User session history & bookmarks
│   ├── sessions/[id]/                 # AI Session Recap & Quiz review page
│   ├── subscription/                  # Pricing table & tier upgrade
│   ├── opengraph-image.tsx            # Dynamic social preview card via next/og
│   ├── robots.ts & sitemap.ts         # Automated SEO indexing
│   └── layout.tsx                     # Root layout with font & metadata
├── components/                        # UI and feature components
│   ├── dashboard/                     # Recharts components, Goal ring, Timezone sync
│   ├── session/                       # RecapCard, QuizCard
│   ├── ui/                            # Radix primitives (Button, Card, Form, etc.)
│   ├── CompanionComponents.tsx        # Live voice session room controller
│   └── Navbar.tsx & UsageMeter.tsx    # Header navigation and real-time quota meter
├── lib/                               # Business logic & integrations
│   ├── actions/                       # Next.js Server Actions (Supabase / Gemini)
│   ├── compute-quota.ts               # Pure daily quota math
│   ├── compute-streak.ts              # Pure timezone-aware streak calculator
│   ├── limits.ts                      # Free vs Pro voice limits
│   └── supabase.ts                    # Clerk-authenticated Supabase client
├── tests/                             # Vitest unit test suites
│   ├── compute-quota.test.ts          # 10 quota calculation tests
│   └── compute-streak.test.ts         # 11 streak calculation tests
├── .github/workflows/ci.yml           # GitHub Actions 3-stage CI workflow
└── docs/                              # Technical documentation
    ├── HOW_IT_WORKS.md                # Architecture & technical deep dive
    └── PROGRESS.md                    # Project roadmap & implementation log
```

---

## 📖 In-Depth Architecture

For a detailed technical walkthrough of the voice streaming lifecycle, quota math, Gemini JSON schemas, and streak boundary algorithms, see [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md).

---

## 📄 License

This project is licensed under the MIT License.
