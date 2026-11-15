# PART2_TEST_RESULTS — What Was Actually Tested, and What Was Not

> **Note**: Results from Part 2's real verification runs. The build and lint statuses below come from commands whose **exit codes were captured explicitly** (`npm run build; echo exit: $?`), not inferred from piped output.

## Toolchain (this round)

- `npm run build` — **exit code 0** (46/46 static pages generated; `/[lang]/blogs/[slug]` prerendered as a Partial-Prerender shell)
- `npm run lint` — **exit code 0** (ESLint clean after moving the synchronous `setState` out of the fetch effect in `BlogList.tsx`)

## Tested (isolated temp-dir production servers unless noted)

**Seed script (`scripts/seed-blogs.mjs`)**

- Fresh directory: creates `data/blogs.json` with the 2 sample posts — pass
- Second run on an existing file: refuses with exit 1 — pass
- Two concurrent first-time runs (simultaneous processes): exit codes `1,0` — exactly one success; resulting file is a valid 2-post array — pass
- Corrupt existing file: refuses with exit 1; file byte-identical afterward — pass
- Re-initialization after manually deleting the file — pass
- Not run: seed on Windows / unusual filesystems

**Contact API (`/api/contact`, phase 2 suite, 25/25 on the temp production server)**

- Bad JSON → 400 `invalid-json`; array body → 400 `not-object`; non-string fields → 400 `invalid-types`; blank/malformed fields → 400 `validation-error` with per-field keys
- Valid → 201; sequential mixed order API → alias → Server Action appended in order; GET → 405 (both spellings)
- Concurrency: 8 parallel API + 4 parallel action posts — 12/12 persisted after the shared-queue fix (4 lost updates were observed **before** the fix and are documented in the code review)
- Corrupt contact file → 500 `save-error`, file byte-preserved, writes resume after restore
- `Accept-Language: zh` on `/api/*` → no redirect; error bodies contain no paths/stack traces
- Real dev-server preview: one API write + one Server Action write to the actual file, then this round's two records removed; file SHA-256 restored byte-for-byte

**Blog API + pages (phase 3 suite, 41/41 on the temp production server)**

- `GET /api/blogs`: 200, seeded posts newest-first; `Accept-Language: zh` → no redirect
- `POST /api/blogs`: bad JSON / array / non-string fields (incl. numeric `summary`) → 400; empty title, bad slug, hyphen-edge slug, blank body → 400 with the right error keys; valid → 201 with the post returned; duplicate slug → 409 with the file unchanged
- Freshly created post appears **immediately** as the first item in `GET /api/blogs` (no stale cache) and its detail page (`/en/…` and `/zh/…`) renders the title and both paragraphs
- Unknown slug → friendly not-found UI; observed HTTP 200 with `noindex` meta (streaming, consistent with the projects route in Part 1)
- `/en/blog-posts` → 307 to `/en/blogs`; unprefixed `/blog-posts` → proxy locale redirect
- List page contains the admin entry; `/en/admin/blogs` renders the form; navbar has the Blogs link; footer contact link points to the API page
- Corrupt blogs file → GET 500 `storage-error`, POST 500 `save-error`, byte-preserved, recovers after restore
- Contact regression: `POST /api/contact` still 201; the two stores write separate files and do not interfere

**Corrupt-record validation (phase 4 fix, temp production server)**

- `[{}]`, a partial record, a numeric `id`, and an invalid `createdAt` each produce: GET → 500 `storage-error`, POST → 500 `save-error`, file byte-identical, no path/stack leak in responses
- After restoring the seeded file: GET works, POST creates a post, its detail page renders 200, contact still 201

**Restart persistence**

- A created post survived a full server kill + restart (read back from the JSON)

**Dev-server preview (3000, real process, non-mutating checks)**

- `/en/blogs`, `/zh/blogs`, `/en|zh/admin/blogs` → 200; `/en/blog-posts` → 307; nav/footer links present
- Contact data untouched throughout phase 4: SHA-256 `54aac43950b4d8e32dc6e9cf69a5a7452d0c9c51b4bd7eedc2b2cf9c4e5d3388`, 4 records; 2 sample posts present in `data/blogs.json`

**Browser QA (Codex, phase 3 review)**

- Sample list, admin empty-submit errors, sample detail, unknown-slug page — confirmed in the browser by Codex as browser QA; the student's own browser verification is still pending

## Observed but not fixed (with reasons)

- Dev-mode console may log a React Performance "measure with negative timestamp" warning. It was observed **only in dev mode**, where pages rendered normally. Production was verified with HTTP checks only (status codes and HTML content) — **the production browser console was not tested**, so the absence of the warning in production is not claimed. Treated as a dev-tools observation; no framework dependency changed.

## Not tested (honest gaps)

- Real-browser interaction of the client-side states: the retry button, pending-disabled inputs, the success banner and the "view the new post" link have **not been verified through a real browser**. HTTP/DOM-level checks cannot exercise pending states or disabled buttons, so these interactive behaviors remain unverified until the student records the demo
- Multi-process or multi-instance writes (documented limitation — the queue is single-process by design)
- Deployment, HTTPS, reverse proxies — out of scope (local demo)
- Windows and non-macOS filesystems; `npm ci` on a truly fresh clone (existing `node_modules` was used)
- The demo video has not been recorded; nothing has been submitted to any course platform
