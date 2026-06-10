# Virality — Deployment Guide (Windows)

AI-powered video virality analysis. Next.js · Prisma · Clerk · Stripe · Upstash · Supabase · Vercel.

---

## Table of contents

- [Cost overview](#cost-overview)
- [Prerequisites](#prerequisites)
- [Security rules — read first](#security-rules--read-first)
- [Step 1 — Clone and install](#step-1--clone-and-install)
- [Step 2 — Create your secrets file](#step-2--create-your-secrets-file)
- [Step 3 — Supabase database](#step-3--supabase-database)
- [Step 4 — Clerk authentication](#step-4--clerk-authentication)
- [Step 5 — Upstash Redis](#step-5--upstash-redis)
- [Step 6 — Anthropic API](#step-6--anthropic-api)
- [Step 7 — OpenAI API](#step-7--openai-api)
- [Step 8 — Stripe billing](#step-8--stripe-billing)
- [Step 9 — App URL and cron secret](#step-9--app-url-and-cron-secret)
- [Step 10 — Run locally and build](#step-10--run-locally-and-build)
- [Step 11 — Push to GitHub](#step-11--push-to-github)
- [Step 12 — Deploy to Vercel](#step-12--deploy-to-vercel)
- [Step 13 — Post-deploy webhooks](#step-13--post-deploy-webhooks)
- [Smoke test checklist](#smoke-test-checklist)
- [Accessibility (ADA / WCAG 2.1 AA)](#accessibility-ada--wcag-21-aa)
- [When to upgrade from free tiers](#when-to-upgrade-from-free-tiers)
- [Useful commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

---

## Cost overview

| Service   | Purpose                 | MVP plan    | Cost           |
| --------- | ----------------------- | ----------- | -------------- |
| Vercel    | Host the Next.js app    | Hobby       | Free           |
| Supabase  | Postgres database       | Free        | Free           |
| Clerk     | Sign-in / sign-up       | Free        | Free           |
| Upstash   | Redis rate limiting     | Free        | Free           |
| Stripe    | Billing (test mode)     | Test mode   | Free           |
| Anthropic | Video analysis AI       | Pay-as-you-go | $5–$10 credit |
| OpenAI    | Audio transcription     | Pay-as-you-go | $5–$10 credit |
| Domain    | Custom URL              | Skip for MVP | Free          |

**Recommended MVP spend: $10–$20 total.**

Upgrade path when you have daily active users:

- Vercel Pro: ~$20/month
- Supabase Pro: ~$25/month
- Custom domain: ~$10–$20/year
- Clerk production keys: included in Clerk free plan

---

## Prerequisites

Install all three before opening PowerShell:

1. **Node.js LTS** — https://nodejs.org (choose "LTS", not "Current")
2. **Git for Windows** — https://git-scm.com/download/win (accept all defaults)
3. **VS Code** — https://code.visualstudio.com

Verify they installed correctly. Open PowerShell and run:

```powershell
node --version
git --version
```

Both should print a version number. If either says "not recognized", restart PowerShell after installing.

---

## Security rules — read first

These rules protect your money and your users' data. Breaking them is the most common way developers accidentally expose API keys or get billed for unauthorized usage.

**Never commit `.env.local` to Git.** It contains live API keys. The `.gitignore` already excludes it — do not remove that line.

**Never share your `.env.local` file in screenshots, Discord, or GitHub issues.** Bots scrape GitHub for exposed keys within seconds.

**Use test keys until you are ready to charge real money.** Every service (Clerk, Stripe) has separate test and live credentials. Test keys cannot create real charges. Live keys can.

**Generate the cron secret properly.** Do not use a short or guessable string. Use PowerShell:

```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copy the output and paste it as your `CRON_SECRET`. It will look like `xK3mZ8...` — 44 characters. This secret protects your monthly usage reset endpoint from being called by anyone except Vercel.

**Rotate any key you accidentally commit.** Go to that service's dashboard, delete the exposed key, and generate a new one immediately.

**Supabase password special characters.** If your Supabase database password contains `@`, `#`, `$`, `%`, or `&`, you must URL-encode it in the connection string. For example, `p@ss` becomes `p%40ss`. Use https://www.urlencoder.org to encode just the password portion.

**Vercel environment variables are not the same as `.env.local`.** You must enter every variable from your `.env.local` manually in Vercel Project Settings → Environment Variables. Vercel never reads your local file.

---

## Step 1 — Clone and install

Open PowerShell. Navigate to where you want the project:

```powershell
cd C:\Users\YourName\Projects
```

If you are working from a downloaded ZIP instead of cloning:

```powershell
cd C:\Users\YourName\Downloads\virality
```

Install dependencies:

```powershell
npm install
```

This takes 1–3 minutes the first time. You will see a progress bar. Warnings about deprecated packages are normal and safe to ignore.

---

## Step 2 — Create your secrets file

Copy the example file to create your local secrets:

```powershell
Copy-Item .env.example .env.local
```

Open it in VS Code:

```powershell
code .env.local
```

You will fill in each value in the steps below. Leave `.env.local` open in VS Code throughout setup — you will be pasting values into it repeatedly.

**Important:** `.env.local` must never be committed to Git. Confirm `.gitignore` contains these lines (it should already):

```
.env
.env.local
.env*.local
next-env.d.ts
tsconfig.tsbuildinfo
```

---

## Step 3 — Supabase database

Go to https://supabase.com and sign in.

1. Click **New project**.
2. Choose a name (e.g., `virality`), set a strong database password, and pick the region closest to your users (US East for most North American users).
3. Wait for the project to finish provisioning (~1 minute).
4. Go to **Project Settings** → **Database**.
5. Scroll to **Connection string** and select the **URI** tab.
6. Copy the **Transaction pooler** string (this is your `DATABASE_URL`). It will look like:
   `postgresql://postgres.xxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
7. Also copy the **Session pooler** string (this is your `DIRECT_URL`). It uses port `5432`.

Paste into `.env.local`:

```
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

Replace `PASSWORD` with your actual Supabase database password. If the password contains special characters, URL-encode them (see Security rules above).

Now create the database tables:

```powershell
npx prisma db push
npx prisma generate
```

You should see: `Your database is now in sync with your Prisma schema.`

**Supabase security settings to enable:**

In your Supabase dashboard, go to **Project Settings** → **API**:
- Confirm **Row Level Security (RLS)** is noted as available — enable it on any tables you create manually.
- Do not expose the `service_role` key in your app. Only the `anon` key is needed for client-side use, and only if you are using Supabase client directly (this app uses Prisma, so neither is needed in code).

---

## Step 4 — Clerk authentication

Go to https://clerk.com and sign in.

1. Click **Create application**.
2. Name it `Virality`.
3. Enable **Email** sign-in. Optionally enable **Google**.
4. Click **Create application**.
5. On the API Keys page, copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

Paste into `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Keep these redirect values exactly as shown:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Do not add the webhook yet.** You need your deployed Vercel URL first. You will return to this in Step 13.

**Clerk security settings:**
- In Clerk dashboard → **Sessions**, set session token lifetime to 7 days (default is fine for MVP).
- In **Attack protection**, enable **Bot protection** (free on all plans).
- Do not share your `CLERK_SECRET_KEY`. It can impersonate any user in your app.

---

## Step 5 — Upstash Redis

Go to https://upstash.com and sign in.

1. Click **Create database**.
2. Name it `virality-ratelimit`.
3. Choose **Global** (or the region closest to your Vercel deployment — US East is a safe default).
4. Select the **Free** plan.
5. Click **Create**.
6. On the database page, copy:
   - **REST URL** (starts with `https://`)
   - **REST Token**

Paste into `.env.local`:

```
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Upstash free tier allows 10,000 commands/day — sufficient for hundreds of daily analyses.

---

## Step 6 — Anthropic API

Go to https://console.anthropic.com and sign in.

1. Go to **API Keys** → **Create key**.
2. Name it `virality-prod`.
3. Copy the key (it starts with `sk-ant-`).
4. Go to **Billing** and add $10 of credits.

Paste into `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

**Spend protection:** In the Anthropic console, set a monthly spend limit under **Billing → Limits**. $20/month is a safe cap for early testing. This prevents unexpected charges if your app has a bug that loops API calls.

---

## Step 7 — OpenAI API

Go to https://platform.openai.com and sign in.

1. Go to **API keys** → **Create new secret key**.
2. Name it `virality-prod`.
3. Copy the key (starts with `sk-`).
4. Go to **Billing** and add $10 of credits.

Paste into `.env.local`:

```
OPENAI_API_KEY=sk-...
```

**Spend protection:** In the OpenAI dashboard, go to **Settings → Limits** and set a monthly usage limit. $15/month is reasonable for early users.

---

## Step 8 — Stripe billing

Use Stripe test mode for all local development and staging. Do not switch to live mode until the entire checkout and webhook flow is verified end-to-end.

Go to https://dashboard.stripe.com and sign in.

1. Confirm the **Test mode** toggle (top right) is **on**. The dashboard turns orange in test mode.
2. Go to **Developers** → **API keys**.
3. Copy **Secret key** (`sk_test_...`) and **Publishable key** (`pk_test_...`).

Paste into `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Create the four test products

In Stripe dashboard → **Product catalog** → **Add product**:

| Product name            | Price     | Billing period |
| ----------------------- | --------- | -------------- |
| Virality Pro Monthly    | $9.00     | Monthly        |
| Virality Pro Yearly     | $79.00    | Yearly         |
| Virality Agency Monthly | $49.00    | Monthly        |
| Virality Agency Yearly  | $399.00   | Yearly         |

After creating each product, copy its **Price ID** (starts with `price_`).

Paste into `.env.local`:

```
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_...
STRIPE_AGENCY_YEARLY_PRICE_ID=price_...
```

**Do not add the Stripe webhook yet.** You will return in Step 13 after deploying.

---

## Step 9 — App URL and cron secret

For local development:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a secure cron secret in PowerShell:

```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copy the output and paste it:

```
CRON_SECRET=paste-the-output-here
```

Save `.env.local`. Your file should now have every variable filled in with real values — no more `...` placeholders.

---

## Step 10 — Run locally and build

Start the development server:

```powershell
npm run dev
```

Open http://localhost:3000 in your browser. Confirm the home page loads.

Test sign-up: create an account and confirm you land on `/dashboard`.

Stop the server (`Ctrl+C`) and run a production build to catch any errors before deploying:

```powershell
npm run build
```

The build must complete with **no errors**. Warnings are fine. If the build fails:
- The most common cause is a missing or malformed env var. Check `.env.local` — every value must be real, not a placeholder.
- TypeScript errors will fail the build. Fix them before deploying.

---

## Step 11 — Push to GitHub

If you have not initialized Git yet:

```powershell
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on https://github.com/new (name: `virality`, visibility: **Private** for now).

Then push:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/virality.git
git push -u origin main
```

**Confirm `.env.local` was not pushed:** Go to your GitHub repo and look at the file list. You should not see `.env.local` there. If you do, delete the file from GitHub immediately, rotate every key it contained, and add it properly to `.gitignore`.

---

## Step 12 — Deploy to Vercel

Go to https://vercel.com and sign in with your GitHub account.

1. Click **Add New** → **Project**.
2. Import your `virality` GitHub repository.
3. Framework preset should auto-detect as **Next.js**.
4. Click **Environment Variables** and add every variable from your `.env.local` — all of them, one by one.
5. Click **Deploy**.

The first deploy takes 2–4 minutes. When it finishes, copy your Vercel URL (e.g., `https://virality-abc123.vercel.app`).

Return to Vercel **Project Settings** → **Environment Variables** and update:

```
NEXT_PUBLIC_APP_URL=https://virality-abc123.vercel.app
```

Then **Redeploy**: go to **Deployments** → click the three dots on the latest deployment → **Redeploy** (check "Use existing build cache" is off).

**Vercel security settings:**
- In **Project Settings** → **Security**, enable **Vercel Authentication** if you want to password-protect the deployment during testing (removes it before going public).
- Do not enable **Edge Config** or **KV** unless you know you need them — they add billing.
- The `vercel.json` in this repo already sets correct function timeouts and cache headers. Do not modify it without understanding the implications.

---

## Step 13 — Post-deploy webhooks

### Clerk webhook

1. Go to https://clerk.com → your app → **Webhooks** → **Add endpoint**.
2. URL: `https://YOUR-VERCEL-URL.vercel.app/api/auth/webhook`
3. Select these events: `user.created`, `user.updated`, `user.deleted`
4. Click **Create**.
5. Copy the **Signing secret** (`whsec_...`).
6. Add it to Vercel environment variables: `CLERK_WEBHOOK_SECRET=whsec_...`
7. Redeploy Vercel.

### Stripe webhook

1. Go to https://dashboard.stripe.com → **Developers** → **Webhooks** → **Add endpoint**.
2. URL: `https://YOUR-VERCEL-URL.vercel.app/api/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint**.
5. Copy the **Signing secret** (`whsec_...`).
6. Add it to Vercel environment variables: `STRIPE_WEBHOOK_SECRET=whsec_...`
7. Redeploy Vercel.

---

## Smoke test checklist

Run through this before showing the app to anyone:

- [ ] Home page loads without errors
- [ ] Sign-up creates an account and redirects to `/dashboard`
- [ ] Uploading and analyzing a short video completes (may take 30–60 seconds)
- [ ] Analysis result appears on screen and saves (check Supabase table in dashboard)
- [ ] Analyzing more than the free limit shows a rate-limit error (not a crash)
- [ ] Stripe checkout opens in test mode — use card number `4242 4242 4242 4242`
- [ ] After Stripe checkout, subscription state updates in your database
- [ ] Clerk webhook: sign up a new user and confirm a row appears in your Supabase `users` table
- [ ] Stripe webhook: complete a test checkout and confirm subscription appears in your database

---

## Accessibility (ADA / WCAG 2.1 AA)

This app is required to meet WCAG 2.1 Level AA to comply with ADA Title III for web services. The following standards must be maintained in all UI work:

**Keyboard navigation.** Every interactive element (buttons, inputs, links, modals) must be reachable and operable with Tab, Shift+Tab, Enter, and Escape. Do not remove focus outlines with `outline: none` unless you replace them with a visible custom focus indicator.

**Focus management.** When a modal or dialog opens, move keyboard focus inside it. When it closes, return focus to the element that triggered it.

**Color contrast.** Text must meet minimum contrast ratios:
- Normal text (under 18pt): 4.5:1 against its background
- Large text (18pt+ or 14pt bold): 3:1 against its background
- UI components and form borders: 3:1 against adjacent colors
- Use https://webaim.org/resources/contrastchecker to verify.

**Images and icons.** All `<img>` elements need descriptive `alt` text. Purely decorative images use `alt=""`. Icon-only buttons need `aria-label`. Tabler icons used without adjacent text need `aria-hidden="true"` on the icon and a label on the button.

**Form labels.** Every form input must have an associated `<label>` element or `aria-label`. Placeholder text alone does not count as a label.

**Error messages.** Error states must be announced to screen readers. Use `aria-live="polite"` regions for dynamic error messages, or associate errors with inputs via `aria-describedby`.

**Skip navigation.** Add a skip-to-main-content link as the first focusable element in the page. Example:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded"
>
  Skip to main content
</a>
```

**ARIA landmarks.** Wrap page regions in semantic elements: `<header>`, `<nav>`, `<main id="main-content">`, `<footer>`. Screen readers use these to jump between sections.

**Motion and animation.** Wrap all animations in `@media (prefers-reduced-motion: reduce)` and disable or simplify them for users who have enabled reduced motion in their OS settings.

**Testing tools:**
- **axe DevTools** browser extension (free) — run on every new page
- **NVDA screen reader** (free, Windows) — tab through every interactive flow
- **Lighthouse** (built into Chrome DevTools) — run the Accessibility audit

A score of 90+ in Lighthouse Accessibility is a minimum bar, not a guarantee of compliance. Manual keyboard and screen reader testing is required.

---

## When to upgrade from free tiers

Stay on free tiers until at least one of these is true:

- You have real users testing the app every day
- Supabase free-tier limits become a problem (500 MB database, 2 GB bandwidth)
- You are enabling Stripe live mode to charge real money
- You want a custom domain and production-level uptime guarantees

Upgrade order:

1. Switch Clerk from test keys to live keys (free, same dashboard)
2. Enable Stripe live mode (flip the toggle; create live products and prices)
3. Buy a custom domain (~$10–$20/year on Namecheap or Google Domains)
4. Upgrade Vercel to Pro ($20/month) for longer function timeouts and better support
5. Upgrade Supabase to Pro ($25/month) for daily backups and more storage

---

## Useful commands

All commands run in PowerShell from the project root.

```powershell
npm install              # Install or update dependencies
npm run dev              # Start local development server
npm run build            # Production build (run before every deploy)
npx prisma db push       # Apply schema changes to the database
npx prisma generate      # Regenerate Prisma client after schema changes
npm run db:studio        # Open Prisma Studio (visual database browser)
```

---

## Troubleshooting

### `InvalidCharacterError` during build

Your Clerk key is invalid or still a placeholder. In `.env.local`, confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_` (or `pk_live_` for production) and is the full key from the Clerk dashboard.

### Prisma cannot connect to the database

Check `DATABASE_URL` and `DIRECT_URL` in `.env.local`. The most common causes:
- Password contains a special character that is not URL-encoded (encode `@` as `%40`, `#` as `%23`, `$` as `%24`)
- You copied the wrong connection string (use the pooled URL for `DATABASE_URL`, the direct URL for `DIRECT_URL`)
- Your Supabase project is paused (free-tier projects pause after 1 week of inactivity — click **Restore** in the Supabase dashboard)

### Webhooks not firing

Webhooks only work after the app is deployed to Vercel — they cannot reach `localhost`. Confirm:
- The webhook URL matches your exact Vercel URL (no trailing slash)
- The signing secret is correctly set in Vercel environment variables
- You redeployed after adding the secret

### Stripe checkout fails or shows wrong price

Confirm the key type matches the price IDs. Test secret keys (`sk_test_`) only work with test price IDs (`price_` created while in test mode). Live secret keys only work with live price IDs.

### Build succeeds locally but fails on Vercel

Vercel does not read your `.env.local`. Every variable must be added in Vercel Project Settings → Environment Variables. Check that no variable is missing or has a typo compared to your local file.

### Changes to `.env.local` do not take effect

Restart the dev server:

```powershell
# Press Ctrl+C to stop, then:
npm run dev
```

Vercel: go to Deployments → Redeploy after any environment variable change.

### `npm install` fails with ERESOLVE

Your Node.js version may be outdated. Install the LTS version from https://nodejs.org, restart PowerShell, and run `npm install` again.
