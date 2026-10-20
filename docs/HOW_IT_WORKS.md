# Vocalutor — Architecture & Technical Deep-Dive

This document provides a comprehensive technical walkthrough of how **Vocalutor** works under the hood — from real-time WebRTC audio streaming to AI session recaps, quota governance, streak calculation algorithms, and secure database isolation.

---

## 1. Real-Time Spoken Voice Pipeline (Vapi + Deepgram + ElevenLabs + GPT-4)

### High-Level Topology
```
[ User Microphone ]
       │ WebRTC Audio Stream
       ▼
[ Vapi AI Orchestrator ]
  ├── Speech-to-Text: Deepgram Nova-3 (sub-300ms transcription)
  ├── Reasoning & Dialogue: OpenAI GPT-4 with Pedagogical Voice Prompt
  └── Text-to-Speech: ElevenLabs Turbo v2 (low-latency lifelike audio)
       │ WebRTC Audio Stream
       ▼
[ User Speakers / Headphones ]
```

### Session Lifecycle (`components/CompanionComponents.tsx`)
1. **Pre-Flight Quota Check:** Before starting a voice call, `getVoiceQuota()` calculates remaining daily seconds for the authenticated user. If remaining seconds are below `MIN_CALL_SECONDS` (30s), the call is blocked and the user is prompted to upgrade or wait for quota reset.
2. **Assistant Configuration:** `configureAssistant(voice, style)` in `lib/utils.ts` configures:
   - Voice models and styles (e.g. `voices.male.casual`, `voices.female.formal`).
   - First message / greeting tailored to the companion subject and topic.
   - Guardrailed system instructions enforcing concise, natural spoken responses without Markdown, tables, or asterisks.
3. **WebRTC Connection:** `vapi.start(...)` initiates a low-latency WebRTC connection.
4. **Interactive State:**
   - `speech-start` & `speech-end` events toggle real-time Lottie soundwave visualizations.
   - `message` events capture partial and final transcripts for live conversation rendering.
5. **Session Teardown:**
   - When either participant disconnects, `onCallEnd` fires.
   - Spoken call duration is captured and written to `voice_usage` via `recordVoiceUsage`.
   - The session record is created via `addToSessionHistory`.
   - A non-blocking background promise calls `generateSessionRecap` to generate AI key learnings and a 3-question quiz.

---

## 2. Daily Voice-Minute Quota Guardrails

### Tier Limits (`lib/limits.ts`)
| Tier | Daily Allowance | Max Session Duration |
| :--- | :--- | :--- |
| **Free** | 15 minutes (900s) | 8 minutes (480s) |
| **Pro** | 60 minutes (3600s) | 20 minutes (1200s) |

### Pure Calculation Engine (`lib/compute-quota.ts`)
- `computeQuota(plan, usedSeconds)` calculates remaining seconds, determines whether calls are permitted (`remainingSeconds >= MIN_CALL_SECONDS`), and caps the session duration to `min(tierMaxSession, remainingSeconds)`.
- Tested with 10 unit tests covering zero-usage, fractional seconds, over-usage boundaries, and plan fallbacks.

### Double-Layer Enforcement
1. **Client-Side:** Countdown timer actively counts down remaining call time and triggers graceful disconnection 15 seconds before quota expiry.
2. **Server-Side & Telephony:** `maxDurationSeconds` is passed into Vapi session initialization, ensuring hard telephony termination even if the browser crashes or drops connection.

---

## 3. Post-Session AI Recap & Quiz Generation (Gemini Flash)

### Pipeline (`lib/actions/recap.actions.ts`)
```
[ Completed Call Transcript ]
              │
              ▼
[ Google Gemini 2.5 Flash SDK ]
  - Enforced structured JSON output schema
  - 2-3 sentence executive recap
  - Exactly 3 core learning takeaways
  - Exactly 3 multiple-choice quiz questions with explanations
              │
              ▼
[ Zod Validation (recapSchema) ]
              │
              ▼
[ Supabase 'session_recaps' Table ]
```

- **Resilience:** If Gemini fails or transcripts are empty, `generateSessionRecap` returns `null` safely without failing the primary session save.
- **Interactive Quiz (`components/session/QuizCard.tsx`):** Users test their retention immediately after each voice session with instant visual feedback and score evaluations.

---

## 4. Learning Analytics & Streak Computation

### Streak Algorithm (`lib/compute-streak.ts`)
- Standard UTC calculations break streaks across global timezones. `computeStreak(dates, timezone)` maps session timestamps to local calendar day strings (`YYYY-MM-DD`) in the user's IANA timezone (synced via `components/dashboard/TimezoneSync.tsx`).
- Deduplicates multiple sessions in a single day.
- Checks if the user studied today or yesterday to maintain consecutive day streaks.
- Tested with 11 unit tests across timezone boundaries, month roll-overs, and leap years.

### Analytics Dashboard (`app/dashboard/page.tsx`)
- **Activity Area Chart (`ActivityChart.tsx`):** 14-day rolling activity area chart powered by Recharts (dynamically imported with `ssr: false` to eliminate hydration mismatch).
- **Subject Distribution (`SubjectChart.tsx`):** Bar chart breaking down total study minutes across subjects.
- **Weekly Goal Progress Ring (`GoalProgressRing.tsx`):** SVG circular progress indicator computing completion percentage against user targets.

---

## 5. Security & Authentication Architecture

### Clerk + Supabase JWT Passthrough
```
[ Browser / Client ]
       │ Authenticated with Clerk
       ▼
[ Next.js Server Action ]
  - auth() retrieves Clerk session JWT
       ▼
[ Supabase Client Factory (lib/supabase.ts) ]
  - Passes Authorization: Bearer <clerk_token>
       ▼
[ PostgreSQL Row Level Security (RLS) ]
  - Verifies auth.jwt() ->> 'sub' = user_id
```

- Zero service keys exposed on client side.
- All database operations are restricted to rows owned by the authenticated Clerk `userId`.
- Safe `.env.example` template without live credentials.

---

## 6. Testing & CI Pipeline

- **Unit Testing:** Vitest configured for isolated module execution with alias resolution (`@/*`) and PostCSS bypass.
- **GitHub Actions CI (`.github/workflows/ci.yml`):**
  1. `typecheck`: Runs `tsc --noEmit` and `npm run lint`.
  2. `unit-tests`: Runs Vitest test suites.
  3. `build`: Next.js production build verification gated behind typecheck and tests.
