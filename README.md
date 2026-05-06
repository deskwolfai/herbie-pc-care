# Herbie PC Care

Marketing site for Herbie PC Care — PC cleaning, thermal repaste, and fan service in Tondo, Manila.

**Live site:** _set after Vercel import_
**Direct line:** 0920-857-0392

## Stack

Pure static — HTML, CSS, JS. No build step, no framework, no backend.

- 9 HTML pages (homepage, about, blog index, 3 blog posts, contact, privacy, terms)
- Shared `assets/styles.css` + `assets/enhance.js` for sub-pages
- 49 customer photos in `/Images/` powering the bench-log gallery
- Single Vercel Serverless Function at `/api/contact` that forwards intake submissions to [Resend](https://resend.com), which delivers the email

## Local preview

Just open `index.html` in a browser, or serve the folder:

```powershell
# Pick any of these — no install required if you have Python
python -m http.server 5500
# then visit http://localhost:5500
```

## Deploy

See [`DEPLOY.md`](DEPLOY.md) for the GitHub + Vercel walk-through.

## Files

```
.
├── index.html                       # Homepage (the long one)
├── about.html
├── blog.html
├── blog-dust-the-silent-killer.html
├── blog-laptop-vs-desktop.html
├── blog-thermal-paste-101.html
├── contact.html                     # Posts to /api/contact via fetch (JSON)
├── privacy.html
├── terms.html
├── vercel.json                      # Cache headers + clean URLs
├── package.json                     # Declares the resend SDK dep
├── .env.example                     # Documents required env vars
├── api/
│   └── contact.js                   # Vercel function: validates + sends via Resend
├── assets/
│   ├── styles.css                   # Shared design system for sub-pages
│   └── enhance.js                   # Shared scroll-progress, lightbox, FAB controllers
└── Images/                          # Customer bench-log photos (49)
```

## Editing

- Brand colours live as CSS custom properties at the top of both `index.html` (inline `<style>`) and `assets/styles.css` (`:root` block). Keep them in sync.
- The homepage is one self-contained file with inline CSS/JS — easiest to iterate on.
- Sub-pages share `assets/styles.css` and `assets/enhance.js` — change once, reflects everywhere.
- Phone number `0920-857-0392` appears in many places. Use search-and-replace if it changes.
