# Midterm Review — Portfolio Expansion

Status: implementation and automated verification are complete. **Video recording and submission are pending.** All work lives on the branch `codex/midterm-expanded-portfolio` (created from the submitted Part 2 commit `19140d5`, history preserved).

## What was built

On top of Assignment 2 Part 2 (contact forms + blog), the midterm adds:

1. **Interview Prep Planner** — `/[lang]/interview-planner`, a standalone client feature stored in browser LocalStorage under a versioned key (`portfolio.interview-planner.v1`). Add / view / edit / delete prep items (topic, target date, notes, pending/completed) with an explicit save action, unsaved-changes indicator, two-step delete and discard confirmations, and controlled handling of empty, corrupt, disabled or full storage.
2. **Learning Resources** — `/[lang]/resources` with full CRUD against `data/resources.json` via `GET/POST /api/resources` and `GET/PUT/DELETE /api/resources/[id]`. The parent component (`ResourceBoard`) fetches into state and passes each record to a reusable `ResourceCard` via props; cards never fetch themselves. URLs are restricted to http/https; `readingStatus` is `to-read`/`reading`/`completed`.
3. **Contacts, Blogs, Projects: full CRUD** — REST APIs (`/api/contacts`, `/api/blogs`, `/api/projects` + by-id/by-slug routes) and a bilingual management hub `/[lang]/manage` with create / list / edit / delete-confirm flows per category. The legacy `POST /api/contact` endpoint and the Server Action form keep working against the same file and validation.
4. **Projects migrated to runtime data** — the five real projects were extracted losslessly from `src/data/projects.ts` into a committed seed (`src/data/projects-seed.json`) and initialized into `data/projects.json` by an exclusive-create script. Home, list and detail pages now read the same JSON at request time (Suspense boundaries, no static fallback), so deleted slugs render the not-found page instead of resurrecting.

## Verified results (real)

| Check | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 (Next.js 16.4.5, includes type checking) |
| `npm run test:planner-storage` | 24/24 assertions, exit 0 |
| `npm run test:resources-api` | 58/58 assertions, exit 0 |
| `npm run test:crud-api` | 66/66 assertions, exit 0 |

Data baselines were preserved throughout: 5 contact records (ids and `submittedAt` intact), 3 blog posts, 5 projects, 2 resources. The integration tests run against isolated temporary directories with their own server processes and verify the write landing spot before mutating anything.

## Key design decisions

- **LocalStorage planner never writes on load.** Reads go through `useSyncExternalStore` (server/hydration snapshot is a loading placeholder); only the explicit save button writes. An empty or corrupt store is never overwritten by a default, and corrupt data surfaces a controlled error with a two-step clear.
- **One process-wide write queue.** Every read-check-write cycle (duplicate-slug checks, updates, deletes) runs inside `src/lib/json-write-queue.ts` on `globalThis`, shared by all four stores.
- **Controlled failure, no silent repair.** Corrupt or malformed JSON files produce a `500` with a fixed body (no paths, no stacks) and failed writes leave the file byte-identical.
- **Strict request validation.** Bodies are checked for exact field sets, types, enums and formats (http/https URLs, real calendar dates); clients cannot inject `id` or `createdAt`.
- **Streaming architecture kept.** With Cache Components/PPR, dynamic content stays inside Suspense boundaries; a deleted project's page renders the not-found content, while the data API returns a real `404`.
- **Honest logging.** `[api] METHOD route -> status` only — alias routes log the pathname actually requested; content is never logged.

## Division of labor (real)

- **Viber coding assistant**: implemented the features, refactorings, seed scripts and the three test suites; executed the automated verification (`npm run lint`, `npm run build`, and all three test runs); fixed the issues those runs surfaced (e.g. the project-update slug-validation bug and the port-probe event-name hang).
- **Codex, on the student's behalf**: coordinated the phases, checked the code and diffs (caught the project-update slug-validation bug during review), operated the browser for acceptance of the planner and resources flows, and ran the isolated integration verification — including the contacts create/update/delete checks against a temporary-directory server.
- **Preparation assistant**: provided the architecture suggestions (including keeping the streaming rendering under Cache Components/PPR) and performed acceptance of the materials.
- **Student**: set the requirements and scope, and will record the official video afterwards — narrated in their own words, without AI tools open, and without showing real contact messages (the isolated demo environment uses synthetic seed data and empty contacts).
