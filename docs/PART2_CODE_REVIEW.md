# PART2_CODE_REVIEW — Three Real Case Studies

> **Note**: All three cases come from Part 2's actual development. Each records the problem/proposal, what was accepted or modified, the rationale, the files involved, and the actual check results. Implementation and testing were performed by Viber; Codex helped review the phase results. The student is responsible for reviewing the outputs and explaining the code — no line-by-line student review has been completed yet.

## Case 1 — Concurrent writes lost updates (shared write queue)

**Problem / proposal**

Phase 2's acceptance check required proving that the Server Action and the new API route really append to the same `data/contact-messages.json` in the compiled runtime. The original Part 1 queue was a module-level `let writeQueue` promise chain. The proposal under review: with `route.ts` and `actions.ts` compiled into separate server bundles, each gets its **own copy** of the store module — two queues. Interleaved read-modify-write cycles could then lose updates.

**Accepted or modified, rationale**

- Accepted: make the queue process-wide by keeping it on `globalThis` instead of in module scope, so every copy of the store in the same Node process shares one queue.
- Modified during implementation: when the blog store arrived in phase 3, the queue logic was extracted into `src/lib/json-write-queue.ts` (`enqueueJsonWrite<T>`) and both stores now call it — one queue serializes both `contact-messages.json` and `blogs.json` writes; the duplicate-slug check runs **inside** the same enqueued task so a read-check-write cycle cannot interleave with another create.
- Rationale: read-modify-write is only safe if every writer in the process queues first; `globalThis` survives module duplication across bundles. The single-process limitation remains honest and documented (`fs.writeFile` is still not atomic; multi-process setups are out of scope).

**Source files**

- `src/lib/json-write-queue.ts`
- `src/lib/contact-store.ts` (switched to the shared helper; guards unchanged)
- `src/lib/blog-store.ts` (duplicate check inside the queue)
- `src/app/api/contact/route.ts`, `src/app/[lang]/contact-me-server-form/actions.ts` (callers)

**Actual check results**

- Before the fix (isolated temp production server): 8 parallel API POSTs + 4 parallel Server Action posts — all 12 returned success but only 8 were persisted: **4 lost updates**, reproduced once.
- After the fix: the same 12-request mix persisted 12/12; a larger cross-entry stress (12 API + 6 action = 18) persisted 18/18. Sequential mixed order (API → alias → action) preserved.
- Real-preview check: one API write + one Server Action write on the dev server's actual file, then this round's two test records removed — the contact file's SHA-256 returned to its exact pre-test value.
- Per-request stress scaling beyond the above was not run (kept moderate per instructions).

## Case 2 — Next 16 Cache Components: runtime reads must live inside Suspense

**Problem / proposal**

The blog detail page (`/[lang]/blogs/[slug]`) has no `generateStaticParams` — posts are runtime data. The first implementation awaited `params` at the top of the page and read the store inside a Suspense child. `npm run build` failed with two prerender errors: "Next.js encountered URL data `usePathname()` in a Client Component outside of `<Suspense>`" and "Next.js encountered uncached or runtime data during prerendering".

**Accepted or modified, rationale**

- The local docs (`use-pathname.md`, `building.md`, `migrating-to-cache-components.md`) prescribe exactly: wrap the component calling `usePathname` in a Suspense boundary with a fallback, and move runtime data access inside Suspense (or cache it, or opt out with `instant = false`).
- Accepted (per docs): `Navbar` now wraps `LocaleToggle` in `<Suspense fallback={null}>` — for fully static routes the toggle still renders into the prerendered HTML; for unknown-param shells it streams in at request time.
- Accepted (per docs): the detail page moved **everything request-time** — the `await params` read and the store read — into the async child inside `<Suspense>`, with a skeleton fallback in the shell.
- Modified after a follow-up build error: the segment `not-found.tsx` originally destructured `params`, but the not-found boundary receives no such prop during prerendering (`TypeError: Cannot destructure property 'lang'`). It now uses `await lang()` from `next/root-params`, matching the Part 1 not-found pattern.
- Rationale: the shell must be prerenderable without resolving any runtime input; the local docs describe this exact error and fix.

**Source files**

- `src/components/Navbar.tsx` (Suspense around LocaleToggle)
- `src/app/[lang]/blogs/[slug]/page.tsx` (params + store read inside Suspense)
- `src/app/[lang]/blogs/[slug]/not-found.tsx` (`next/root-params`)
- `src/app/[lang]/blogs/BlogList.tsx` (client fetch; separate lint fix: no synchronous `setState` in the effect — loading reset moved into the retry handler)

**Actual check results**

- `npm run build` exit code 0 (captured explicitly, not inferred from piped output); route table shows `/[lang]/blogs/[slug]` as Partial Prerender (◐) with a prerenderable shell; `npm run lint` exit code 0.
- Runtime: detail pages for seeded and freshly created posts render immediately after creation (no stale cache); unknown slug renders the friendly not-found UI (HTTP 200 with `noindex` while streaming — consistent with the projects route behavior documented in Part 1); the language toggle still renders on static pages.

## Case 3 — Seed script could still overwrite (check-then-write race)

**Problem / proposal**

Phase 3's `scripts/seed-blogs.mjs` refused to run when `data/blogs.json` existed (valid or corrupt), with no `--force` option. The phase 4 review finding: `existsSync` + plain `writeFileSync` is a check-then-write race — two concurrent first-time initializations (or another process creating the file in between) could both pass the check and one would clobber the other's file.

**Accepted or modified, rationale**

- Accepted with modification: the actual write now uses the exclusive-create flag — `writeFileSync(target, content, { encoding: "utf8", flag: "wx" })` — and handles `EEXIST` with the same friendly refusal message and exit code 1. The `existsSync` pre-check is kept for an early, clearer error but is no longer the safety mechanism.
- Rationale: `wx` asks the kernel to create the file only if it does not exist; the check and the creation become one atomic step. Any pre-existing file — valid, corrupt, or created milliseconds earlier by a racing seed — can never be truncated or overwritten.
- The no-`--force` requirement is preserved: there is deliberately no code path that replaces an existing file.

**Source files**

- `scripts/seed-blogs.mjs`
- `src/data/blog-seed.json` (unchanged seed source; Node-20-compatible JSON, two posts clearly marked Sample/示例)

**Actual check results**

- Sequential pair: first run creates the file (exit 0), second refuses (exit 1, "Refusing to overwrite").
- True concurrency: two seed processes launched simultaneously in the same fresh directory exited `1,0` — **exactly one success**, and the resulting file is a valid 2-post JSON array.
- Corrupt file: a seeded directory's `blogs.json` replaced by `CORRUPT` content, then seed run → exit 1, file byte-identical (`CORRUPT` preserved).
- Re-initialization after manually deleting the file works (2 posts).
