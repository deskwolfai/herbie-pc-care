# Deploy — GitHub + Vercel

This site is pure static HTML. Deployment is a 5-minute, three-step process. **You do not need any API keys to deploy.**

The site is already prepped:

- ✅ Local git repo initialized with first commit
- ✅ `vercel.json` set up for clean URLs + cache headers + security headers
- ✅ `.gitignore` filters editor + OS junk
- ✅ Internal links point at `index.html` (root works)

All you need to finish:

1. Create an empty GitHub repo (web, 30 sec)
2. Push this folder to it (one terminal command)
3. Click "Import" on Vercel (web, 30 sec)

That's it. The form-submission endpoint also needs **one** verification email click, covered in step 4.

---

## Step 1 — Create the empty GitHub repo

Sign in to GitHub at **https://github.com** with `contact@deskwolf.ai` (create the account first if you haven't).

Then go to **https://github.com/new**:

- **Repository name:** `herbie-pc-care` (or whatever you prefer)
- **Description:** `Herbie PC Care marketing site`
- **Public** (cheaper for Vercel free-tier; private also works)
- **Do NOT** check "Add a README", "Add .gitignore", or "Choose a license" — the repo must be empty so the push succeeds. We already have those files locally.

Click **Create repository**. GitHub will show a "quick setup" page with a URL like:

```
https://github.com/<your-username>/herbie-pc-care.git
```

Copy that URL.

---

## Step 2 — Push this folder to GitHub

Open PowerShell in this folder (`Outputs/herbie-pc-care/`) and run:

```powershell
# Replace <YOUR-USERNAME> with the one you saw on GitHub
git remote add origin https://github.com/<YOUR-USERNAME>/herbie-pc-care.git
git branch -M main
git push -u origin main
```

The first push will prompt you to authenticate. Two options:

- **Easiest:** GitHub will open a browser window asking you to authorize Git Credential Manager. Click through. You're done.
- **Alt:** generate a Personal Access Token (PAT) at https://github.com/settings/tokens?type=beta with `repo` scope, paste it as the password.

Re-run `git push -u origin main` if auth was the only issue.

After this, your code is on GitHub. Refresh your repo page to confirm.

---

## Step 3 — Import to Vercel

Sign in to **https://vercel.com** with the same `contact@deskwolf.ai` account. (When you sign up, choose **"Continue with GitHub"** to link them in one step.)

Then go to **https://vercel.com/new**:

- Vercel shows a list of your GitHub repos. Click **Import** next to `herbie-pc-care`.
- **Framework Preset:** Vercel auto-detects "Other" (static). Leave as is.
- **Root Directory:** leave at `./` (the folder we pushed already IS the root).
- **Build & Output Settings:** leave all empty. There is no build.
- **Environment Variables:** leave empty for now. None are needed.
- Click **Deploy**.

Vercel deploys. Within ~30 seconds you'll have a URL like:

```
https://herbie-pc-care.vercel.app
```

That's the live site. Done.

> **Auto-redeploy:** every `git push` to `main` from now on will auto-deploy. No build pipeline to wire up.

---

## Step 4 — Activate the contact form (one-time, Resend)

The contact form posts to a Vercel Serverless Function at `/api/contact`, which forwards the submission to Herbie via [Resend](https://resend.com). You need to add **one** environment variable in Vercel for this to work.

### 4a. Get a Resend API key

1. Sign in at https://resend.com (account is on `contact@deskwolf.ai`).
2. Go to **API Keys** → **Create API Key**.
3. Name it `herbie-pc-care-prod`, give it **Sending access**, click create.
4. Copy the key (starts with `re_…`). Resend shows it **once** — don't navigate away until you've pasted it into the next step.

### 4b. Add it to Vercel

1. Open the Vercel dashboard for this project: https://vercel.com/deskwolfai/herbie-pc-care
2. **Settings → Environment Variables**
3. Add three vars (the last two are optional but recommended):

   | Name | Value | Environments |
   |---|---|---|
   | `RESEND_API_KEY` | `re_…` (the key from 4a) | Production, Preview, Development |
   | `INTAKE_TO` | `contact@deskwolf.ai` | Production, Preview, Development |
   | `INTAKE_FROM` | `Herbie PC Care <onboarding@resend.dev>` | Production, Preview, Development |

4. Click **Save**.
5. Go to **Deployments** → latest deploy → "..." → **Redeploy** to pick up the new env vars (or just push any commit).

### 4c. Smoke-test it

1. Go to https://herbie-pc-care.vercel.app/contact
2. Fill the form with test data (use a real-looking phone number — `09171234567`).
3. Click **Send Intake**.
4. The form should swap to "Got it — message in." within 1–2 seconds.
5. Check the inbox of `contact@deskwolf.ai` — there should be an email titled `New intake — <name> · <unit>`.

If nothing arrives:

- **Browser console** in DevTools → look for a 400/500 from `/api/contact`. Most common: `RESEND_API_KEY` not set in the right environment, or you forgot to redeploy after adding it.
- **Vercel Function Logs** — Vercel dashboard → Deployments → latest → **Functions** tab → click `/api/contact` → live logs reveal Resend errors.
- **Resend → Emails dashboard** — every send (success or fail) is logged at https://resend.com/emails. If a send shows up there but the email never arrived, check spam.

### 4d. Optional — verify your domain so emails come from `intake@deskwolf.ai`

The default sender (`onboarding@resend.dev`) works out-of-the-box but only delivers to the email address registered on your Resend account. That's fine for the intake flow (`contact@deskwolf.ai` → `contact@deskwolf.ai`), but if you ever want to send confirmations back to **customers**, you need to verify your domain.

1. Resend dashboard → **Domains** → **Add Domain** → `deskwolf.ai`
2. Resend gives you a handful of DNS records (SPF, DKIM, DMARC). Add them at your domain registrar (Namecheap, GoDaddy, Hostinger, etc).
3. Wait a few minutes, click **Verify**.
4. Once verified, change the `INTAKE_FROM` env var in Vercel to:
   `Herbie PC Care <intake@deskwolf.ai>`
5. Trigger a redeploy.

---

## Optional — custom domain

In the Vercel dashboard for the project:

1. **Settings → Domains** → "Add" → type `herbiepccare.com` (or whatever you register)
2. Vercel shows the DNS records to add at your registrar (CNAME or A record)
3. Add them at the registrar (Namecheap, GoDaddy, Hostinger, etc.)
4. Wait a few minutes for DNS propagation. Vercel auto-issues an SSL cert.

Until then, `https://herbie-pc-care.vercel.app` is your URL.

---

## What you do NOT need

- **No API keys** for deployment itself
- **No backend** — the form uses FormSubmit, a hosted email-relay
- **No build step** — pure HTML/CSS/JS served as-is
- **No CI** — Vercel's GitHub integration handles deploys on every push

## API keys / env vars you might add later

If you ever add any of these, set them in Vercel's **Project Settings → Environment Variables**:

- **Plausible / Fathom / GA4** analytics — drop their snippet into `index.html` `<head>`
- **Custom form backend** (replacing FormSubmit) — would need an endpoint URL or token
- **Map provider key** (currently just an iframe embed of Google Maps, no key needed)

Until you add any of these, the deployment is fully self-sufficient.

---

## Troubleshooting

- **`git push` says "Updates were rejected"** → the GitHub repo wasn't created empty. Go back to step 1, recreate without the README/gitignore checkboxes.
- **Vercel can't find the repo** → make sure the GitHub account you signed up with is the same one that owns the repo, OR install the Vercel GitHub app and grant it access to the repo from https://github.com/apps/vercel.
- **Site loads but nav clicks 404** → make sure `vercel.json` was committed. `cleanUrls: true` rewrites `/about.html` → `/about`. Without it, links break.
- **Images don't load** → confirm the `Images/` folder pushed. Run `git status` and `git ls-files Images/ | wc -l` (should be ~49).
- **Form submits but no email arrives** → you skipped step 4 (verification email). Submit again, check the inbox.
