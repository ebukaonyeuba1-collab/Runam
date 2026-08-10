# RunAm

Errands, run by someone already going that way.

An escrow-backed errand marketplace for Warri and Effurun. A requester posts an
errand and sees the full price broken down before paying. The money goes into
escrow. Runners see errands sorted by how far each one pulls them off a trip they
were already making, and the price reflects that. Nothing reaches the runner until
the requester confirms the job is done.

## What is in here

| Piece | Where | Notes |
|---|---|---|
| Pricing engine | `src/lib/pricing.ts` | Rules based on purpose. Base, distance, task difficulty, peak hour. Transport quoted separately and passed through whole. |
| Route geometry | `src/lib/geo.ts` | Detour maths. No maps bill, no API key. |
| Runner tiers | `src/lib/tiers.ts` | Value ceilings, detour limits, transport advance, purchase unlock. |
| Escrow state machine | `src/app/api/errands/[id]/*` | Every transition is server side. |
| Append-only ledger | `escrow_ledger` table | Every naira that moves has a row. |
| Database | `supabase/schema.sql` | Tables, RLS, signup trigger. |

Status flow:

```
awaiting_payment -> funded -> accepted -> picked_up -> proof_submitted -> completed
                                                                       -> disputed
```

## Setup

### 1. Supabase

Create a project at supabase.com, then in **SQL Editor** run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Then in **Authentication > Providers > Email**, turn **Confirm email** off for the
pilot so testers can sign in immediately. Turn it back on before real launch.

Copy your keys from **Project Settings > API**.

### 2. Paystack

Create an account at paystack.com. From **Settings > API Keys & Webhooks**, take
the test secret and public keys.

After you deploy, come back and set the webhook URL to:

```
https://YOUR-DOMAIN/api/paystack/webhook
```

### 3. Environment

Copy `.env.example` to `.env.local` and fill it in.

`NEXT_PUBLIC_SIMULATE_PAYMENTS=true` skips Paystack entirely and moves errands
straight to funded. Useful for demos and for testing the runner flow without a
card. Never set it true in production.

### 4. Run it

```bash
npm install
npm run dev
```

## Deploy

```bash
git init
git add .
git commit -m "RunAm MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/runam.git
git push -u origin main
```

Then at vercel.com: **Add New > Project**, import the repo, and paste the same
environment variables from `.env.local` into **Settings > Environment Variables**.
Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL. Deploy.

Finally, add the webhook URL in Paystack and add your Vercel URL to Supabase under
**Authentication > URL Configuration**.

## Testing the whole loop

You need two accounts, because a person cannot run their own errand.

1. Sign up as **A**. Post an errand from Warri Main Market to Effurun Roundabout.
2. Fund it. In simulate mode it goes straight to funded. On Paystack test mode use
   card `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.
3. Sign up as **B** in a private window. Open **Run**, set a trip that passes the
   errand, for example Deco Road to Airport Road. The errand appears marked *On
   your route*.
4. Take it, or use **Ask for more** to send a counter offer and answer it as A.
5. As B, confirm pickup, then send proof with any image URL.
6. As A, confirm done. Watch the ledger fill in on the **Escrow** tab, and B's
   completed count go up.

## What is deliberately not built

These are not oversights. Each one needs something outside the codebase.

- **Payouts to runner bank accounts.** Moving customer money means holding
  customer money, which Nigerian law does not allow without an MMO or PSB licence
  (₦2bn capital). `release` writes the ledger entries; a licensed partner settles
  against that record. Wire real transfers only once that arrangement is signed.
- **Real NIN verification.** `api/profile/nin` records the last four digits and
  marks the runner verified. Replace its body with a call to a licensed NIMC
  verification provider before real errands run.
- **Free-text addresses.** v1 uses a curated list of Warri and Effurun points.
  This keeps addresses unambiguous and the app free of a maps bill. Correct the
  coordinates in `seed.sql` from the ground before launch.
- **Predictive pricing.** Every completed errand is a labelled row: quote,
  geometry, whether it was countered and why, time taken. When that table is large
  enough, `pricing.ts` is what gets replaced. Not before.
- **Photo upload.** Proof takes a URL. Wire it to Supabase Storage when you have a
  bucket and a size policy.

## Before the first real errand

- [ ] Correct the coordinates in `supabase/seed.sql`
- [ ] Signed arrangement with a licensed payment partner
- [ ] Live NIN verification provider
- [ ] Turn email confirmation back on
- [ ] `NEXT_PUBLIC_SIMULATE_PAYMENTS=false` and live Paystack keys
- [ ] A person on call for disputes, with a written refund rule
