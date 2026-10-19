# Vocalutor Upgrade Progress & Audit Log

## Current Status Overview
- **Active Branch**: `upgrade/v2`
- **Target App Name**: Vocalutor
- **Tagline**: Talk to an AI tutor out loud. Pick a subject, start a voice session, and learn by conversation instead of reading.
- **UI Strategy**: Existing UI layout preserved for current feature implementations; user will provide bespoke UI code to be integrated later.
- **Git Push Policy**: Local commits only per phase; no automatic push to remote.

---

## Phase 0: Audit Summary

### 1. Framework & Router Architecture
- **Framework**: Next.js 15.3.8 with React 19 and TypeScript 5.
- **Router**: Next.js App Router (`app/`).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with custom CSS utility classes in `app/globals.css`.
- **Package Manager**: `npm` (tracked via `package-lock.json`).

### 2. Folder Structure
- `app/`: Next.js App Router pages and layouts:
  - `app/page.tsx`: Home page with popular companions, recent sessions list, and CTA banner.
  - `app/companions/page.tsx`: Companion library with search and subject filtering.
  - `app/companions/[id]/page.tsx`: Live voice session room.
  - `app/companions/new/page.tsx`: Companion creation builder guarded by plan limits.
  - `app/my-journey/page.tsx`: User profile, completed lessons count, bookmarked companions, and history accordion.
  - `app/subscription/page.tsx`: Clerk `<PricingTable />` subscription management.
  - `app/sign-in/`: Clerk authentication route.
  - `app/layout.tsx`: Root layout with ClerkProvider, font (`Bricolage_Grotesque`), and navbar.
- `components/`: UI components including Radix primitives in `components/ui/`, `CompanionComponents.tsx` (Vapi session room), `CompanionCard.tsx`, `CompanionForm.tsx`, `CompanionList.tsx`, `Navbar.tsx`, `NavItems.tsx`, `SearchInput.tsx`, `SubjectFilter.tsx`, `CTA.tsx`.
- `constants/`: Subject listings, subject pastel color map, ElevenLabs voice IDs, and mock session data.
- `lib/`:
  - `lib/supabase.ts`: Supabase client factory passing Clerk session JWT tokens.
  - `lib/vapi.sdk.ts`: Client-side singleton instance of `@vapi-ai/web`.
  - `lib/utils.ts`: Utility functions (`cn`, `getSubjectColor`, `configureAssistant`).
  - `lib/actions/companion.actions.ts`: Server Actions (`createCompanion`, `getAllCompanions`, `getCompanion`, `addToSessionHistory`, `getRecentSessions`, `getUserSessions`, `getUserCompanions`, `newCompanionPermissions`, `addBookmark`, `removeBookmark`, `getBookmarkedCompanions`).
- `public/`: SVG icons for subjects, mic, bookmarks, and tutorial leftover images in `public/images/` and `public/readme/`.

### 3. How Clerk is Wired to Supabase
In `lib/supabase.ts`:
```typescript
export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    }
  );
};
```
Clerk provides the user's JWT to Supabase with each request. In Supabase Postgres, RLS policies check `auth.jwt() ->> 'sub'` or `auth.uid()::text = user_id` to enforce user-level data isolation.

### 4. Database Tables & Schema
Existing tables in Supabase:
1. **`companions`**:
   - `id` (uuid / text, PK)
   - `name` (text)
   - `subject` (text: maths, science, language, coding, history, economics)
   - `topic` (text)
   - `voice` (text: male / female)
   - `style` (text: casual / formal)
   - `duration` (integer)
   - `author` (text, Clerk `userId`)
   - `created_at` (timestamp with time zone)
2. **`session_history`**:
   - `id` (uuid, PK)
   - `companion_id` (uuid / text, FK referencing `companions.id`)
   - `user_id` (text, Clerk `userId`)
   - `created_at` (timestamp with time zone)
3. **`bookmarks`**:
   - `id` (uuid, PK)
   - `companion_id` (uuid / text, FK referencing `companions.id`)
   - `user_id` (text, Clerk `userId`)
   - `created_at` (timestamp with time zone)

### 5. How a Voice Session Starts and Ends
Located in `components/CompanionComponents.tsx`:
- **Start**: User clicks "Start Session" which invokes `handleCall()`. It sets call status to `CONNECTING`, creates the assistant configuration via `configureAssistant(voice, style)` (Deepgram Nova-3 + ElevenLabs + GPT-4 with a specialized tutor prompt), and calls `vapi.start(...)`.
- **Active Call Events**: Vapi emits `call-start` (switches status to `ACTIVE`), `speech-start` and `speech-end` (triggers Lottie soundwaves), and `message` (captures transcript messages).
- **End**: User clicks "End Session" (`handleDisconnect()` calls `vapi.stop()`) or the remote party ends the call. When `call-end` fires, `onCallEnd()` sets status to `FINISHED` and invokes Server Action `addToSessionHistory(companionId)`.

### 6. Where Plan Limits are Enforced
Enforced in `lib/actions/companion.actions.ts` via `newCompanionPermissions()`:
- Checks Clerk user entitlements using `auth()`:
  - `has({ plan: 'pro' })`: unlimited companions.
  - `has({ feature: '10_companions_limit' })`: capped at 10 companions.
  - `has({ feature: '3_companions_limit' })`: capped at 3 companions.
  - Default / Free: fallback to 0 or 3 depending on feature assignment.
- Used in `app/companions/new/page.tsx` before rendering `CompanionForm`. If cap is reached, renders an upgrade banner pointing to `/subscription`.

### 7. How Session History is Saved
- When a call ends in `components/CompanionComponents.tsx`, `addToSessionHistory(companionId)` is called.
- It inserts `{ companion_id, user_id }` into `session_history`.
- Note: It previously did not record call duration (seconds) or transcript history.

### 8. Tutorial Leftovers Identified
- **Branding**: Title "Converso" across `README.md`, `CLAUDE.md`, `app/layout.tsx`, and navbar logo alt texts.
- **Assets**:
  - `public/images/logo.svg` (1.04 MB heavy tutorial logo).
  - `public/readme/jsmpro.jpg`, `videokit.jpg`, `hero.png`, `thumbnail.png` (JavaScript Mastery tutorial promotional assets).
- **Sample Data**:
  - `constants/index.ts` contains hardcoded `recentSessions` array with mock data ("Neura the Brainy Explorer", "Countsy the Number Wizard", etc.).
- **Metadata**: Generic description "Real-time AI Teaching Platform" and default theme colors.
- **Typecheck & Lint Issues**:
  - `app/page.tsx`: `getRecentSessions({ limit: 10 })` passed object instead of number.
  - `components/CompanionForm.tsx`: React Hook Form with Zod 4 type discrepancy on coerced number.
  - `lib/utils.ts`: `clientMessages` and `serverMessages` typed as `never[]`.
  - Unused imports in multiple files.

---

## Phase Tracker
- [x] **Phase 0: Audit** (Complete)
- [ ] **Phase 1: Rebrand & Base Design System** (UI layout preserved per user instruction; tokens, metadata & logo components prepared)
- [ ] **Phase 2: Feature 1 - Voice-Minute Guardrails** (Limits config, quota calculation, migration, Server Actions, countdown timer, header meter)
- [ ] **Phase 3: Feature 3 - Learning Dashboard** (Aggregation queries, user_settings table, timezone streak calculation, Recharts charts, goal updates)
- [ ] **Phase 4: Feature 2 - AI Session Recap + Quiz** (Final transcripts capture, session_recaps table, Gemini Flash integration, Zod validation, retry logic, /sessions/[id] review page)
- [ ] **Phase 5: Tests, CI & Code Hygiene** (Vitest unit tests, Playwright smoke test, GitHub Actions CI workflow, .env.example)
- [ ] **Phase 6: Metadata, SEO & Performance** (next/font, next/og, robots.ts, sitemap.ts, production build audit)
- [ ] **Phase 7: Documentation & Final Report** (README.md, docs/HOW_IT_WORKS.md, final summary)
