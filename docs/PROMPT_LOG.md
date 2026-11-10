# PROMPT_LOG — Development Prompt Log (Summary)

> **Note**: This document is a **summary** of the actual session history, not a verbatim transcript. Each phase lists the main prompt intent and the resulting output. It contains no fabricated user quotes, user decisions, or commit history.

## Roles (honest statement)

- **Implementation & testing**: done by **Viber** (the coding assistant) — code writing, command execution, build/lint/end-to-end checks, and result reporting all came from the assistant, not from the student running each command manually.
- **Prompt organization & review**: **ChatGPT** helped organize the prompts and review outputs.
- **Student's responsibility**: verify the code and documentation, understand every part well enough to explain it, and record the demo video personally.

## Phase log

### Phase 1 — Initialization

- **Prompt intent**: check the environment and existing project; if there is no project, propose an initialization plan first; confirm the Next.js version and routing approach; do not implement pages yet.
- **Output**: confirmed an empty directory (Node 24 present); agreed on App Router + TypeScript + Tailwind + local data files, deployment deferred; created the project with `create-next-app` — **Next.js 16.4.5** (Turbopack, Cache Components); `next build` passed.

### Phase 2 — Page skeleton

- **Prompt intent**: fix the routes `/about-me` and `/contact-me-server-form`; build the project data (a typed record containing `slug` + two entries), reusable navbar/footer/project card, homepage, project list and detail pages; two valid slugs must show different content and an unknown slug a clear not-found page; uncertain personal facts must be marked "to be added" and experiences must not be invented.
- **Output**: `src/data/`, `src/components/`, homepage, `/about-me`, `/projects`, `/projects/[slug]` (`generateStaticParams` + `notFound`), and a segment-level `not-found.tsx`. The build surfaced that Next 16 forbids calling `new Date()` during prerendering; fixed per the docs with `"use cache"`. Build/lint/runtime checks passed (an unknown slug returns HTTP 200 with `noindex` when the streamed response has started, while still rendering the 404 UI — documented PPR behavior).

### Phase 3 — Server form

- **Prompt intent**: implement only the `/contact-me-server-form` server form; read the local Next.js forms and Server Actions docs first; name/message non-empty after trimming; email must satisfy five rules (exactly one `@`, non-empty local part, a dot in the domain, non-empty dot-separated segments, no whitespace); validation must run on the server; valid submissions are appended to a JSON file without overwriting each other, invalid submissions write nothing; read/write logic lives in a separate server module; the page shows success, per-field errors, save failure, and a waiting state; also fix ProjectCard duplicate tech-stack keys.
- **Output**: `contact-validation.ts` (pure function), `contact-store.ts` (read–modify–write with a promise write queue), a `"use server"` action, and a `useActionState` form (pending / success / validation-error / save-error feedback); ProjectCard dedupes tags with a `Set`. End-to-end verification used React's progressive-enhancement protocol (the `$ACTION_*` hidden fields exposed by SSR) to POST real requests: **31 checks passed** (two consecutive valid submissions both saved, 12 invalid submissions left the file byte-for-byte unchanged, records survived a server restart). **Explicitly not implemented (as instructed)**: `/api/contact` and `/admin`.

### Phase 4 — Save-failure hardening

- **Prompt intent**: review `contact-store.ts` — return an empty array only when the file does not exist; corrupt JSON or read failure must surface a save failure while preserving the original file; verify with a separate test file without destroying existing messages.
- **Output**: fixed the read logic (only `ENOENT` returns `[]`; corrupt/non-array/permission errors are thrown); Node-run unit tests **17/17** (executed in an isolated temp directory, covering `EACCES` and write-queue recovery); an end-to-end check with a corrupted file in a temp-cwd server confirmed a real `save-error` response and the corrupt file preserved byte-for-byte.
- **Incident disclosure**: the first unit-test run mistakenly executed inside the project directory and overwrote the real messages file; the two known records were restored byte-for-byte from session-verified output, and the incident was disclosed. Any messages the user might have submitted themselves at the time would have been unrecoverable (no system snapshots). A working-directory guard was then added to the test script.

### Phase 5 — Real content

- **Prompt intent**: replace the placeholder profile and project data with the student's real résumé content.
- **Output**: `profile.ts` (SCU MSBA, prior degree, two internships, three skill groups, languages/photography) and `projects.ts` (five projects: ResearchAI, Bank Churn, Financial Marketing, Amazon NLP, Manufacturing Cost — copy drawn from the résumé); featured = ResearchAI + Bank Churn; the assistant raised two questions back to the student (phone digit count; ResearchAI links missing).

### Phase 6 — Chinese/English toggle

- **Prompt intent**: add a language toggle button.
- **Output**: restructured to `src/app/[lang]/` bilingual routes per the official Next.js 16 i18n guide; `src/proxy.ts` (middleware was renamed to proxy in Next 16) redirects based on `Accept-Language`, with legacy paths redirected; `src/dictionaries/` bilingual dictionaries; data files became `{ zh, en }` localized fields; validation now returns error keys rendered by the dictionaries; a navbar `LocaleToggle` switches while preserving the path.
- **Build issues and fixes**: a circular dictionary type (`Dictionary` moved into `zh.ts`); a function in the dictionary could not cross to a Client Component (replaced with a `{n}` placeholder); the Footer rewrite had dropped the `"use cache"` year fix (restored). Build/lint passed; language negotiation, bilingual content, bilingual 404s, and bilingual form feedback all verified at runtime.

### Phase 7 — Project links

- **Prompt intent**: fill in two verified GitHub repositories; clearly distinguish "GitHub source" from "live demo"; do not guess unverified URLs and do not render empty/`#` links; add the confirmed GitHub profile to the public social links; external links open in a new tab with a proper `rel`.
- **Output**: `Project.link` refactored to `links?: { kind: "source" | "demo"; url: string }[]`; the two repositories were filled in as `source` links with dictionary-provided labels in both languages; ResearchAI stays "to be added"; `profile.links` gained the GitHub profile; build/lint/runtime checks passed.

### Phase 8 — Pre-publication wrap-up

- **Prompt intent**: remove the phone number from the public version; rewrite the README; add an MIT LICENSE; add `docs/` (prompt log, code review, recording checklist); improve `.gitignore`; final build/lint and page checks; keep the port-3000 preview.
- **Output**: `profile.phone` set to `null`; README rewritten; LICENSE and three docs added; `.gitignore` extended for recordings and local commit-message files (verified `package-lock.json` stays tracked).
- **Verification in this round (run by Viber)**: `npm run build` passed (all zh/en routes statically generated), `npm run lint` clean; curl checks confirmed 11 page paths at 200 and `/zh/projects/xxx` at 404; a repository-wide search confirmed no phone-number traces (README/docs/LICENSE/src); `data/contact-messages.json` kept its 2 records with intact fields.
- **Verification boundary**: no new form end-to-end test writes were added this round (the form path was unchanged); the historical form checks (31 + 6 across two rounds) are cited from the Phase 3/4 in-session records, not re-run. This log is based on the session transcript; no separate log files exist.
- **Doc corrections after review**: the README was corrected on the limits of write-failure protection (non-atomic writes; single-process queue) and on the unknown-slug HTTP status wording; CODE_REVIEW's repository attribution was corrected (ChatGPT verified via GitHub CLI); the recording checklist was refined.

### Phase 9 — GitHub publication

- **Prompt intent**: confirm the GitHub CLI account; create the public repository if it does not exist; set a repo-local commit identity; review staged content for secrets before committing; push; verify the remote SHA; write a local submission-info file.
- **Actual output**: the GitHub CLI reported no login inside the assistant's session because the environment injected `XDG_CONFIG_HOME` pointing at a different config directory; running `gh` with that variable unset resolved the login as **zacharyYan** (keyring auth; no credentials were copied or changed). The repo `zacharyYan/isba2438-assignment2-portfolio` did not exist and was created **public**; a single wrap-up commit on top of the genuine Create-Next-App initial commit was pushed to `main`, and local/remote full SHAs were verified identical. Repo-local git identity: `Zhike Yan <232455304+zacharyYan@users.noreply.github.com>` (global config untouched). `recordings/SUBMISSION_INFO.txt` was written locally (gitignored, contains the commit SHA).
- **Verification in this round (run by Viber)**: staged-content grep found no phone number (626/5959/9788), no "HackerSquad", no token material; `data/`, `.env`, `.next`, and `recordings/` confirmed ignored; local HEAD equals the remote `main` SHA (40 characters).

### Phase 10 — Documentation English revision (this round)

- **Prompt intent**: the instructor primarily reads English — translate README, PROMPT_LOG, and CODE_REVIEW into English; translate RECORDING_CHECKLIST as well while RECORDING_SCRIPT_EN stays a student reference (Chinese instructions + English script); keep the Phase 8 time boundary and add the real publication record; fix README statements about the working directory and the Node minimum version (taken from the `next` package's `engines` field).
- **Output**: the four instructor-facing documents in English; documentation-only changes — no website code, functionality, data, or video changes; no rebuild/lint re-run.
- **Status**: the student's code review, the demo recording, and any platform submission have **not** happened yet.

## Things that have not happened (as of this update)

- The demo video has **not** been recorded and has **not** been submitted to any platform.
- The student has not performed a formal code review sign-off; review documents here were produced with the assistant and remain the student's responsibility to verify.
- No email has been sent, and no content has been submitted to any course platform.

## Historical boundary (kept for accuracy)

At the end of Phase 8 (the pre-publication preparation phase), nothing had been committed, pushed, or deployed, and no remote repository existed. Phase 9 records the actual publication; the two statements are time-scoped and not in conflict.
