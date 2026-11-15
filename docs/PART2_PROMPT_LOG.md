# PART2_PROMPT_LOG — Part 2 Development Prompt Log (Summary)

> **Note**: Summary of the actual Part 2 session history, not a verbatim transcript. Part 1 history is recorded in `docs/PROMPT_LOG.md` and is not repeated or changed here.

## Roles (honest statement)

- **Requirement decomposition & review**: **Codex** helped break the instructor's Part 2 requirements into concrete tasks, reviewed the phase results, and performed browser QA at the review points.
- **Implementation & testing**: done by **Viber** (the coding assistant) — code writing, command execution, build/lint checks, isolated API tests, and result reporting.
- **Student's responsibility**: the student's personal understanding, code review, and demo recording are **still to be done by the student**. The browser verifications recorded in this log were performed by Codex as browser QA, not by the student.

## Phase log

### Phase 1 — Read-only inspection & plan

- **Prompt intent**: inspect the frozen Part 1 repo, branch, agent docs, and structure; produce a minimal-change plan for the API contact form and blog features; wait for the instructor's full requirements before implementing.
- **Output**: plan covering files, shared validation/persistence, Next 16 cache handling, fresh-checkout seeding, corrupt-file protection, and verification scenarios. Key finding: the proxy matcher already excluded `/api`, so API routes were never at risk of locale redirects.

### Phase 2 — API contact form

- **Prompt intent**: POST `/api/contact` with strict body checks, reusing the Part 1 validation and store (same `data/contact-messages.json`); 201/400/500 with no path/stack leaks; thin `/api/contacts` alias; bilingual `/[lang]/contact-me` page that really fetches the API; navbar Contact points to the new page; prove shared storage works in the compiled runtime (sequential mixed appends; fix concurrency loss in minimal scope if found); no commit/push.
- **Output**: `contact-request.ts` (parse/validate), `/api/contact/route.ts` (+ alias), `/[lang]/contact-me` pages, dictionary keys, navbar change. Isolated tests passed; a real concurrency check on the temp production server **found 4 lost updates out of 12** — see `PART2_CODE_REVIEW.md` case 1. Fixed by moving the write queue to a process-wide `globalThis` slot; retested clean (12/12, then an 18-request cross-entry stress with zero loss). Real-preview mixed writes (API + Server Action on the same file) verified, then this round's test records were removed and the contact file's SHA-256 restored byte-for-byte.

### Phase 3 — Blog management, list, detail

- **Prompt intent**: bilingual `/[lang]/admin/blogs` form POSTing `/api/blogs` (strict validation; 201/400/409/500; pending disables inputs; success links to the new post); `GET /api/blogs` list; `/[lang]/blogs` really fetching the API with loading/empty/failure+retry; blogs in the navbar, admin reachable from the list; `/[lang]/blogs/[slug]` from actual JSON with friendly not-found; runtime reads wrapped in Suspense per the local Next 16 docs; `/blog-posts` thin redirect; plain-text rendering; blog store with ENOENT-only-empty, corrupt-throws, duplicate check inside the shared queue; two clearly-marked sample posts committed as a seed with a refuse-overwrite script (no `--force`); footer contact link to the API page; keep existing data untouched.
- **Output**: blog validation/request/store modules, `/api/blogs` route, four pages, navbar/footer/dictionary updates, `scripts/seed-blogs.mjs` + `src/data/blog-seed.json`, `npm run seed:blogs`. Three implementation issues were found by the build/tests and fixed (see `PART2_CODE_REVIEW.md` cases 2 and the seed evolution in case 3's context): `usePathname` outside Suspense and `await params` outside Suspense broke prerendering of the unknown-param route; the not-found boundary receives no `params` prop (switched to `await lang()` from `next/root-params`, matching the Part 1 pattern). Full isolated suite: 41/41; restart persistence verified; unknown-slug detail renders the friendly page (HTTP 200 with `noindex` under streaming, consistent with the projects behavior documented in Part 1).

### Phase 4 — Hardening review fixes & English materials (this round)

- **Prompt intent**: two review findings to fix, then English documentation. (1) The seed script's existsSync check still had a check-then-write race — use an exclusive-create flag (`wx`), handle `EEXIST` friendly, and prove two concurrent initializations let exactly one win while existing/corrupt files stay byte-identical. (2) `readBlogPosts` only checked that the JSON was an array, so a record like `[{}]` would crash list sorting or detail rendering outside the existing catch — validate each record's shape on read (types plus sensible non-empty/parseable values), throwing into the existing storage-error paths, never silently filtering or rewriting. Then: English README covering Part 2 routes/API/schema/startup steps and limitations (keeping the Part 1 frozen-SHA reference), plus Part 2 prompt log, code review, test results, and a bilingual recording guide. Distinguish tested from untested; confirm build/lint exit codes with real exit codes instead of relying on piped output; note the dev-mode React Performance negative-timestamp warning as a dev-tools observation.
- **Output**: the two fixes with isolated verification (seed race: concurrent pair exit codes `1,0` — exactly one success; corrupt-record matrix: `[{}]`, partial record, numeric id, bad `createdAt` all produce controlled 500s with the file byte-identical, restore works); build exit 0, lint exit 0 captured explicitly; the five English documents. **No commit or push in Part 2 yet** — that waits for the student's review.

## Decisions (real, from this Part 2 work)

- No authentication, no deployment: local demo scope agreed upfront.
- Seed source is a committed JSON file (Node 20 compatible) with two posts clearly marked Sample/示例; `seed:blogs` refuses any overwrite and offers no force option.
- `/blog-posts` exists as a thin redirect because the assignment mentions both names.
- The list page fetches the API from a Client Component (the assignment's wording), with the detail page reading the store server-side inside Suspense.
- Plain text only: no Markdown dependency, no database.
- The dev-mode console may show a React Performance "measure with negative timestamp" warning; pages render normally and production builds show no such blocker. Recorded as a dev-tools observation; no framework dependency was changed.
- Not done anywhere in Part 2 (as of this document): commit/push, deployment, video recording, course-platform submission, email.
