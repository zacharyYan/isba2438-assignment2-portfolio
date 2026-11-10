# Zhike Yan — Personal Portfolio

A personal portfolio website built for **Assignment 2 Part 1**, using **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

**This project is a local demo only — there is no public deployment.** It intentionally excludes Part 2 scope: no `/api/contact`, no admin pages, no deployment configuration.

## Requirements & Commands

- **Node.js >= 20.9.0** (as required by the `next` package's `engines` field; development used Node 24)
- All commands are run **from the project root directory** (the directory containing `package.json`):

```bash
npm install         # Install dependencies
npm run dev         # Dev server, http://localhost:3000
npm run build       # Production build (includes type checking and static generation)
npm run start       # Serve the production build (run `npm run build` first)
npm run lint        # ESLint check
```

## Bilingual Routing & Redirects

- All routes are prefixed by locale: `/zh` and `/en` — for example `/zh/about-me`, `/en/projects/researchai`
- `src/proxy.ts` reads the browser's `Accept-Language` header: Chinese-language browsers are redirected to `/zh/...`, everything else to `/en/...`
- Legacy paths without a prefix (e.g. `/about-me`) are redirected to the localized version automatically
- The button in the navbar switches `/zh ↔ /en` while preserving the current path (only the locale prefix changes)
- `<html lang>` and per-page metadata follow the active locale

## Demoable Project Slugs

| Path | Notes |
|---|---|
| `/en/projects/bank-churn-prediction` (or `/zh/...`) | Detail page has a "View source on GitHub" button |
| `/en/projects/amazon-review-nlp` (or `/zh/...`) | Same as above |
| `/en/projects/researchai` | No verified URL yet; renders "Project link (to be added)" — no empty links are generated |

An unknown slug (e.g. `/en/projects/xxx`) renders the not-found UI from `[lang]/projects/[slug]/not-found.tsx`. Note the HTTP status: when the streamed response has already started, the status may be **200 with a `noindex` meta tag** rather than a classic 404 — this is documented behavior of Next.js Partial Prerendering.

## Form → Server Action → Validation → JSON Flow

1. `src/app/[lang]/contact-me-server-form/ContactForm.tsx` (a Client Component) renders the form with `useActionState`: three labeled fields (name, email, message); while submitting, the button is disabled and shows "Submitting…".
2. Submission enters `submitContactForm` in `actions.ts` (the file starts with `"use server"`, so validation always executes on the server).
3. `src/lib/contact-validation.ts` validates: name/message must be non-empty after trimming; email must contain exactly one `@`, with a non-empty local part, a dot in the domain, non-empty dot-separated domain segments, and no whitespace anywhere. It returns **error keys** (e.g. `nameEmpty`); display text comes from the dictionaries.
4. Validation failure → the action returns a `validation-error` state with per-field errors and the user's input preserved. **The file is never touched.**
5. Validation success → `appendContactMessage` in `src/lib/contact-store.ts` performs read–append–rewrite of the JSON file. A module-level promise write queue serializes concurrent submissions **within a single server process**.
6. Read/parse failure (corrupt JSON, non-array content, permission errors) happens **before any write** → the action catches it and returns `save-error`; that submission produces no write. The store returns an empty array **only** when the file does not exist (`ENOENT`).

   **Write limitations**: `fs.writeFile` is not atomic. The mechanism above only guarantees "no write happens after a failed read/parse"; it **cannot** guarantee the original file stays intact if a disk write is interrupted mid-way. The write queue only works inside one server process — multi-process or multi-instance deployments can still overwrite each other.
7. Success → a `success` state is returned, the form is cleared, and the page shows a success banner.

### JSON Location & First Creation

- File: `data/contact-messages.json` under the **project root**, located via `process.cwd()` of the running server process — start the app from the project root so the file lands where you expect
- The file (and its directory) is **created automatically by the first valid submission**; invalid submissions never create it
- Each record contains `id` (UUID), `name`, `email`, `message`, and `submittedAt` (ISO timestamp)
- `/data` is excluded by `.gitignore`; messages never enter version control

### Local File Storage Limitations

- No database, no email sending: messages live only in a local JSON file, readable on this machine
- The file grows without limit and has no cleanup mechanism; there is no authentication, so this is not safe to expose publicly as-is
- The storage path depends on the running process's `cwd` — starting the server from a different directory writes the file elsewhere
- `fs.writeFile` is non-atomic: an interrupted write can corrupt the file (this implementation does not do atomic replace via temp-file + rename)
- The write queue is effective only within a single process; it does not protect against concurrent writes from multiple processes/instances
- If the JSON is corrupted by hand, submissions show "save failed" (the protection happens at the read/parse stage, before any write); fix the file back to a valid JSON array to resume writing

## Project Structure

```
src/
├── app/
│   ├── [lang]/                  # Bilingual routes (zh / en)
│   │   ├── layout.tsx           # Root layout: Navbar + Footer, generateStaticParams
│   │   ├── page.tsx             # Home: intro + featured projects
│   │   ├── about-me/            # About me
│   │   ├── projects/
│   │   │   ├── page.tsx         # Project list
│   │   │   └── [slug]/          # Detail (generateStaticParams + notFound)
│   │   ├── contact-me-server-form/  # Form page + actions.ts + form-state.ts
│   │   └── not-found.tsx
│   ├── favicon.ico
│   └── globals.css              # Tailwind v4 (@theme is defined in CSS)
├── components/                  # Navbar / Footer / ProjectCard / LocaleToggle
├── data/                        # profile.ts, projects.ts (bilingual content data)
├── dictionaries/                # zh.ts / en.ts dictionaries
├── lib/                         # i18n.ts, contact-validation.ts, contact-store.ts
└── proxy.ts                     # Language negotiation redirects
```

## Related Documents

- [Prompt log (summary)](docs/PROMPT_LOG.md) — how this project was built, phase by phase
- [Code review case studies](docs/CODE_REVIEW.md) — three real issues and how they were handled
- [Recording checklist](docs/RECORDING_CHECKLIST.md) — pre-recording preparation and outline for the demo video (not yet recorded)
- [Student reference script](docs/RECORDING_SCRIPT_EN.md) — Chinese step-by-step instructions + full English narration (not required reading for the instructor)

## License

MIT License — see [LICENSE](LICENSE).
