# RECORDING_CHECKLIST — Demo Video Recording Checklist

> **Status: the video has not been recorded yet — this file is pre-recording preparation and an outline.** Target length: about 8–9 minutes. The student records it personally.

## Pre-recording checks (confirm each before recording)

- [ ] `npm run dev` is running (launchd-managed or started manually) and http://localhost:3000 responds
- [ ] Check the **current record count** in `data/contact-messages.json` before recording (during the demo, describe the change as "from N to N+1" — do not quote a fixed number)
- [ ] Incognito window (no extensions or logged-in sessions). Note: opening `/` redirects based on the browser's language — it may land on `/zh` **or** `/en`; both are correct. The demo uses the **English pages** (`/en`)
- [ ] Window resolution and font size are readable; close unrelated tabs; **the AI assistant window must not appear on screen**
- [ ] The screen recorder has been test-recorded for 10 seconds with sound confirmed
- [ ] The phone number is **not** shown during the demo (removed from the public version); the email and LinkedIn/GitHub links may be shown
- [ ] State clearly: this is a local demo only — no public deployment, no `/api/contact`, no admin pages (Part 2 scope)
- [ ] **No live help from AI assistants during recording**: understand the outline and the code beforehand, then explain in your own words; `docs/RECORDING_SCRIPT_EN.md` is a reference script (it does not guarantee a grade)

## Outline (timeline)

### 0:00–0:45 Opening
- Self-introduction (name, SCU Business Analytics master's student)
- What the project is: a portfolio built with Next.js 16 App Router, TypeScript, and Tailwind v4
- One sentence on scope: bilingual routes, dynamic project details, and a Server Action form with local persistence

### 0:45–2:00 Homepage and language switch
- Open `/` (incognito) → the browser's language decides whether it lands on `/zh` or `/en` — both are valid outcomes
- Explain the homepage structure: name, focus areas, featured projects
- The demo primarily uses the English pages: click "English" so the URL becomes `/en`; switching back to "中文" for a moment for comparison is fine
- Mention `src/proxy.ts` Accept-Language negotiation and the legacy-path redirect (visiting `/about-me` live is a good demo)

### 2:00–3:00 About Me
- `/en/about-me` (English pages preferred for the demo): education, internships, skills; a brief switch to Chinese is fine

### 3:00–4:15 Project list and the two demo projects
- `/en/projects`: a list of 5 projects
- Open **`/en/projects/bank-churn-prediction`**: walk through the description and numbers like the ROC-AUC of 0.862; click the "View source on GitHub" button (opens the repository in a new tab)
- Open **`/en/projects/amazon-review-nlp`**: same GitHub source button
- Contrast with **`/en/projects/researchai`**: it shows "Project link (to be added)" — no verified URL, so no empty link is rendered

### 4:15–5:00 Unknown slug 404
- Visit `/en/projects/xxx`: show the "404 · Project not found" page and its back button; mention that the HTTP status may be 200 + noindex under streaming (documented in the README)
- Optionally show the site-wide 404 with any nonexistent page

### 5:00–7:00 Contact form (core)
- `/en/contact-me-server-form`: name/email/message, plus a note that the phone number was removed from the public version
- **Invalid submission**: blank name + a malformed email (e.g. `bad email`) → show the server-returned field errors (the empty-message error appears as well)
- **Valid submission**: fill everything in (demo data such as Demo Student / demo@example.com) → the disabled "Submitting…" button → the success banner
- Open `data/contact-messages.json`: describe the append **relative to the actual current count** ("from N to N+1"), showing the new record's id, timestamp, and trimmed content; note the file is created by the first valid submission
- Submit one more different message: both are present — it **appends, it does not overwrite**

### 7:00–8:30 Code walkthrough (share the screen on the code)
- `actions.ts`: `"use server"`, validation on the server; catch → save-error
- `contact-validation.ts`: trimmed non-empty fields + the five email rules, returning error keys that the dictionary renders (bilingual error copy)
- `contact-store.ts`: read–modify–write + a write queue against concurrent overwrites; only `ENOENT` returns an empty array — a corrupt file throws and is preserved
- One sentence on the local-JSON limits (no database, single machine, no file cleanup)

### 8:30–9:00 Closing
- Recap: App Router dynamic routes, Server Actions, i18n routing, error handling
- Status: the local demo is complete; Part 2 plans (API, admin, deployment) are not included

## Post-recording checks (tick only after recording)

- [ ] The video has been recorded and reviewed (sound, visuals, duration)
- [ ] Submission/upload (per the course requirements) — **tick only when done; this document must not claim the video is recorded or submitted before that**
