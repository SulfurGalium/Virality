# Virality MVP Setup Guide for Windows

This app is a Next.js fullstack app. The website and API routes deploy together on Vercel. The database, auth, payments, Redis, and AI APIs come from separate services.

For an MVP, do not overbuild the infrastructure. Use free tiers wherever possible and only add small API credits for AI.

## MVP Cost

| Service | Use For | MVP Plan | Expected Cost |
| --- | --- | --- | --- |
| Vercel | Hosting the Next.js app | Hobby | $0 |
| Supabase | Postgres database | Free | $0 |
| Clerk | Sign in / sign up | Free | $0 |
| Upstash | Redis rate limiting | Free | $0 |
| Stripe | Billing tests | Test mode | $0 |
| Anthropic | Video analysis AI | API credits | $5-$10 |
| OpenAI | Transcription | API credits | $5-$10 |
| Domain | Custom URL | Skip for MVP | $0 |

Recommended MVP spend: $10-$20 total.

Upgrade later when real users are testing daily:

- Vercel Pro: about $20/month
- Supabase Pro: about $25/month
- Domain: about $10-$20/year

## What You Need Installed on Windows

Install these first:

1. Node.js LTS: https://nodejs.org
2. Git for Windows: https://git-scm.com/download/win
3. VS Code: https://code.visualstudio.com

Then open PowerShell in this project folder:

```powershell
cd C:\Users\gangu\Downloads\virality
```

Install dependencies:

```powershell
npm install
```

## Important Files

| File | Purpose |
| --- | --- |
| `.env.local` | Your real local secrets. Never commit this. |
| `.env.example` | Template showing required env vars. Safe to commit. |
| `prisma/schema.prisma` | Database table definitions. |
| `vercel.json` | Vercel function limits and monthly cron. |
| `src/app/api/*` | Backend API routes. |
| `src/app/*` | Frontend pages. |

## Step 1: Create `.env.local`

In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` in VS Code:

```powershell
code .env.local
```

Replace every placeholder like `pk_live_...`, `sk_live_...`, `sk-...`, and `price_...` with real values.

Do not leave fake keys in `.env.local`. The app can fail during `npm run build` if keys are placeholders.

## Step 2: Supabase Database

Go to https://supabase.com.

1. Create a new project.
2. Go to Project Settings.
3. Go to Database.
4. Copy the pooled Postgres connection string into `DATABASE_URL`.
5. Copy the direct Postgres connection string into `DIRECT_URL`.

Your `.env.local` should look roughly like this:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

Create the database tables:

```powershell
npx prisma db push
npx prisma generate
```

## Step 3: Clerk Auth

Go to https://clerk.com.

1. Create a new application.
2. Enable email sign-in. Google sign-in is optional for MVP.
3. Copy the publishable key.
4. Copy the secret key.

Put them in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

For MVP, use Clerk test/dev keys first. Use live keys only when you are ready for real users.

Keep these values:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

After the app is deployed, return to Clerk and add this webhook:

```text
https://YOUR-VERCEL-URL.vercel.app/api/auth/webhook
```

Select these events:

```text
user.created
user.updated
user.deleted
```

Copy the webhook signing secret into:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

## Step 4: Upstash Redis

Go to https://upstash.com.

1. Create a Redis database.
2. Choose the free plan.
3. Copy the REST URL.
4. Copy the REST token.

Put them in `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Step 5: Anthropic API

Go to https://console.anthropic.com.

1. Create an API key.
2. Add $5-$10 of credits if required.
3. Copy the key into `.env.local`.

```env
ANTHROPIC_API_KEY=sk-ant-...
```

## Step 6: OpenAI API

Go to https://platform.openai.com.

1. Create an API key.
2. Add $5-$10 of credits if required.
3. Copy the key into `.env.local`.

```env
OPENAI_API_KEY=sk-...
```

## Step 7: Stripe for MVP

Use Stripe test mode first. Do not enable real payments until the app works end to end.

Go to https://dashboard.stripe.com.

1. Toggle Test mode on.
2. Go to Developers.
3. Go to API keys.
4. Copy the test secret key and test publishable key.

Put them in `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Create four test prices:

| Product | Price |
| --- | --- |
| Virality Pro Monthly | $9/month |
| Virality Pro Yearly | $79/year |
| Virality Agency Monthly | $49/month |
| Virality Agency Yearly | $399/year |

Copy each Stripe price ID into `.env.local`:

```env
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_...
STRIPE_AGENCY_YEARLY_PRICE_ID=price_...
```

After the app is deployed, return to Stripe and add this webhook:

```text
https://YOUR-VERCEL-URL.vercel.app/api/webhook
```

Select these events:

```text
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.trial_will_end
invoice.payment_succeeded
invoice.payment_failed
```

Copy the webhook signing secret into:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 8: App URL and Cron Secret

For local development:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Vercel deployment:

```env
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-URL.vercel.app
```

Create a long random cron secret:

```env
CRON_SECRET=make-this-long-and-random
```

The monthly usage reset route uses this secret.

## Step 9: Run Locally

Start the app:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

If you change `.env.local`, stop the dev server with `Ctrl+C` and start it again.

## Step 10: Build Before Deploying

Run:

```powershell
npm run build
```

If the build fails with an env/key error, check `.env.local` first. The most common MVP mistake is leaving placeholder keys like:

```env
pk_live_...
sk_live_...
sk-...
```

## Step 11: Prepare Git

Make sure `.gitignore` exists and includes:

```gitignore
node_modules
.next
.vercel
.env
.env.local
.env*.local
```

Initialize git if this folder is not already a repo:

```powershell
git init
git add .
git commit -m "Initial MVP deploy"
```

Create a GitHub repo, then push:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/virality.git
git push -u origin main
```

## Step 12: Deploy on Vercel

Go to https://vercel.com.

1. Click Add New Project.
2. Import your GitHub repo.
3. Framework should be Next.js.
4. Add every env var from `.env.local` into Vercel Project Settings.
5. Deploy.

After deployment:

1. Copy your Vercel URL.
2. Set `NEXT_PUBLIC_APP_URL` in Vercel to that URL.
3. Redeploy.
4. Add the Clerk webhook.
5. Add the Stripe webhook.

## MVP Smoke Test

Use this checklist before showing anyone:

1. Home page loads.
2. Sign up works.
3. Dashboard loads after sign in.
4. Uploading/analyzing a small video works.
5. Result saves to Supabase.
6. Rate limiting does not crash.
7. Stripe checkout opens in test mode.
8. Clerk webhook creates users in the database.
9. Stripe webhook updates subscription state.

## When to Upgrade

Stay on free tiers until one of these happens:

- You have real users testing every day.
- Supabase free project limits become annoying.
- You want a real custom domain and reliable production posture.
- You are ready to charge real money.

Then upgrade:

1. Vercel Pro.
2. Supabase Pro.
3. Stripe live mode.
4. Real domain.
5. Clerk production keys.

## Useful Commands

```powershell
npm install
npm run dev
npm run build
npx prisma db push
npx prisma generate
npm run db:studio
```

## Troubleshooting

### `InvalidCharacterError` during build

Usually a fake Clerk key. Replace placeholder keys in `.env.local` with real Clerk keys.

### Prisma cannot connect

Check `DATABASE_URL` and `DIRECT_URL`. Passwords with special characters may need URL encoding.

### Webhooks do not work locally

For MVP, configure webhooks after deploying to Vercel. Local webhook forwarding can wait.

### Stripe checkout fails

Make sure the Stripe key type matches the price IDs:

- Test secret key must use test price IDs.
- Live secret key must use live price IDs.

### Changes to `.env.local` do not apply

Restart the dev server:

```powershell
Ctrl+C
npm run dev
```
"# Virality" 
