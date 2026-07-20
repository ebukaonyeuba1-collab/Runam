# RunAm — Errand Marketplace MVP

A Nigerian errand marketplace connecting customers with verified runners. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase (Postgres + Auth).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS (hand-rolled design system — no shadcn CLI dependency)
- Supabase: Postgres database, Auth (email + Google OAuth), Row Level Security
- React Hook Form + Zod for form validation
- Framer Motion for animation

## What's built

- **Auth**: email/password + Google OAuth signup & login, role selection (customer/runner), forgot/reset password, protected routes via middleware
- **Customer**: dashboard with stats, post an errand (full validation), errand list, errand detail with timeline + cancel
- **Runner**: dashboard with earnings/stats, browse open jobs, accept → start → complete flow, verification status banner
- **Landing page**: hero, features, how-it-works, CTA
- **Database**: full schema with RLS policies (`supabase/schema.sql`)

## Not yet built (next phases)

- Real-time chat (schema/table exists, UI does not)
- Wallet fund/withdraw UI (transactions table exists, no payment gateway wired — needs Paystack/Flutterwave keys)
- Runner verification upload flow (BVN/ID/selfie — needs storage bucket + UploadThing or Supabase Storage wiring)
- Admin dashboard
- Live map/tracking (needs a Maps API key — Google Maps or Mapbox)
- Push/SMS notifications (needs a provider — e.g. Termii for Nigerian SMS)

These all need real third-party credentials to be genuinely functional, not just UI — wire them in once you have the accounts.

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the schema**: open the SQL editor in your Supabase dashboard and paste the contents of `supabase/schema.sql`, then run it.
3. **Enable Google OAuth** (optional): Supabase dashboard → Authentication → Providers → Google, add your OAuth client ID/secret.
4. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase → Settings → API.
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
6. Visit `http://localhost:3000`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` in Vercel → Project Settings → Environment Variables.
4. Deploy. No other config needed — `next.config.js` and the project structure are already Vercel-ready.

## Test flow

1. Sign up as a customer at `/signup` → post an errand at `/errands/new`.
2. Sign up as a runner (different email) at `/signup`, select "I want to run errands" → go to `/runner/jobs` → accept the open errand → `/runner/dashboard` → Start → Mark Complete.
3. Back on the customer account, the errand detail page timeline updates and shows the runner.

## Project structure

```
app/
  (auth)/         → login, signup, forgot/reset password
  (customer)/     → dashboard, errands list/detail/new
  (runner)/       → runner dashboard, available jobs
  auth/callback/  → OAuth redirect handler
components/
  ui/             → Button, Input, Textarea, Select, Card, Badge, EmptyState
  errands/        → errand-specific forms and actions
  dashboard-shell.tsx → shared sidebar layout
lib/
  supabase/       → browser + server clients
  actions/        → server actions (create/cancel/accept/start/complete errand)
  validations/    → Zod schemas
types/            → hand-written types matching the Supabase schema
supabase/schema.sql → full DB schema + RLS policies
```
