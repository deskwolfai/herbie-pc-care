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

## Step 4 — Activate the contact form (one-time)

The contact form posts to FormSubmit.co, free, no signup, no API key. But the destination email needs a one-time verification.

1. Go to your live site (`https://your-site.vercel.app/contact`).
2. Fill in the form with **any test data** and submit.
3. Check the inbox of the email address listed in `contact.html`'s form `action` attribute (currently `contact@deskwolf.ai`).
4. There will be a "Confirm Email" message from FormSubmit. Click the confirmation link.
5. From now on, every form submission lands as an email in that inbox. Real customers can submit immediately.

To change the destination email later, edit `contact.html` and change:

```html
<form ... action="https://formsubmit.co/contact@deskwolf.ai" ...>
```

…to whatever address Herbie wants to receive intake messages on, then push. Vercel auto-redeploys, and the new address goes through one more verification round.

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
