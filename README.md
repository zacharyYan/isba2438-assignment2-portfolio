# Zhike Yan — Personal Portfolio

A personal portfolio website built for **Assignment 2**, using **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

- **Part 1** (routes, projects, Server Action form, bilingual UI) is the committed historical version at [commit `233736ac481141eb0384c19db698744c55951772`](https://github.com/zacharyYan/isba2438-assignment2-portfolio/tree/233736ac481141eb0384c19db698744c55951772).
- **Part 2** (API contact form, blog management/list/detail) is developed on the `codex/assignment2-part2` branch on top of that commit. This version includes Part 2; historical development checkpoints were not committed at the time they were produced.

**This project is a local demo only — there is no public deployment and no authentication.** Part 2 has no `/admin` login or rate limiting; it is meant to be run on a local machine for the course demo.

## Requirements & Commands

- **Node.js >= 20.9.0** (as required by the `next` package's `engines` field; development used Node 24)
- All commands are run **from the project root directory** (the directory containing `package.json`):

```bash
npm ci              # Clean-install dependencies
npm run seed:blogs  # First time only: create data/blogs.json from the committed samples
npm run dev         # Dev server, http://localhost:3000
npm run build       # Production build (includes type checking and static generation)
npm run start       # Serve the production build (run `npm run build` first)
npm run lint        # ESLint check
```

`npm run seed:blogs` **refuses to overwrite any existing `data/blogs.json`** (valid, corrupt, or otherwise — the file is created exclusively). Delete the file by hand if you truly want to re-initialize.

## Part 2 Routes & API

| Path | Notes |
|---|---|
| `/en/contact-me` (or `/zh/...`) | API-powered contact form; the navbar Contact link points here; the page links back to the original Server Action form |
| `/en/blogs` (or `/zh/...`) | Blog list; a Client Component really fetches `GET /api/blogs`, with loading / empty / failure-and-retry states; links to the admin page |
| `/en/blogs/[slug]` (or `/zh/...`) | Post detail rendered from the actual JSON at request time (inside a Suspense boundary per the Cache Components guide); unknown slugs get a friendly not-found page |
| `/en/admin/blogs` (or `/zh/...`) | Create-a-post form that POSTs to `/api/blogs`; inputs are disabled while submitting; success clears the form and links to the new post |
| `/en/blog-posts` (or `/zh/...`) | Thin redirect to `/[lang]/blogs` (the assignment mentions both names) |
| `POST /api/contact` | JSON body `{ name, email, message }` → `201` / `400` (invalid JSON, non-object, non-string fields, or field validation with per-field error keys) / `500` (storage failure). No `GET` — contact data is not exposed |
| `POST /api/contacts` | Thin alias re-exporting the same handler from `/api/contact` (the assignment uses both singular and plural); zero duplicated logic |
| `GET /api/blogs` | `200` `{ status: "success", posts }`, newest first; `500` `storage-error` if the store is unreadable |
| `POST /api/blogs` | JSON body `{ title, slug, body, summary? }` → `201` + the created post / `400` (invalid JSON, non-object, non-string fields incl. `summary`, or field validation) / `409` duplicate slug / `500` (storage failure) |

Validation is strict: `title`, `slug`, `body` are required non-empty strings; `slug` must match `^[a-z0-9]+(-[a-z0-9]+)*$`; `summary` is optional but, if present, must be a string. Error responses contain status codes and machine-readable error keys only — no file paths or stack traces.

The language proxy (`src/proxy.ts`) excludes `/api` from its matcher, so API calls are never redirected by locale negotiation.

## Shared Storage Design

Both features write plain JSON files under `data/` in the project root (located via the running process's `cwd` — start the app from the project root):

- `data/contact-messages.json` — contact submissions, shared by the Part 1 Server Action and the Part 2 API (identical validation and store functions)
- `data/blogs.json` — blog posts; created by the first valid `POST /api/blogs` or by `npm run seed:blogs`

Both stores follow the same guards:

- Only a missing file (`ENOENT`) reads as an empty list; every other read/parse/validation error is thrown **before any write**, so a corrupt file is never silently overwritten (the failing submission produces no write)
- Blog records are shape-validated on read (`id`/`slug`/`title`/`summary`/`body`/`createdAt` strings with sensible non-empty/parseable values); a malformed record surfaces as a controlled storage error instead of crashing list sorting or detail rendering
- The duplicate-slug check and the append run inside **one process-wide write queue** (kept on `globalThis`, shared by both stores via `src/lib/json-write-queue.ts`), so concurrent creates cannot interleave read-modify-write cycles
- Each record: contact `{ id, name, email, message, submittedAt }`; blog `{ id, slug, title, summary, body, createdAt }`

### Local File Storage Limitations

- No database, no email sending: everything lives in local JSON files on one machine; `/data` is gitignored
- `fs.writeFile` is **not atomic**; the guards above prevent "write after failed read" but cannot rule out a corrupted file if a write is interrupted mid-way
- The write queue is effective within a **single Node process only**; multi-process or multi-instance setups can still conflict
- No authentication on `/admin/blogs` or `POST /api/blogs` — local demo scope; do not expose publicly as-is
- Storage paths depend on the running process's `cwd`

## Part 1 Routes (historical version `233736a`)

- Bilingual routes `/zh` and `/en` with `Accept-Language` negotiation in `src/proxy.ts` and legacy-path redirects; the navbar toggle switches locale while preserving the path
- `/[lang]/projects` and `/[lang]/projects/[slug]` (static params + friendly not-found; an unknown slug may return HTTP 200 with a `noindex` meta when the streamed response has started — documented PPR behavior)
- `/[lang]/about-me`, home with featured projects
- `/[lang]/contact-me-server-form` — the original Server Action form (still linked from the API form page)

## Project Structure (Part 2 additions)

```
src/
├── app/
│   ├── api/
│   │   ├── contact/route.ts        # POST only (alias: /api/contacts)
│   │   └── blogs/route.ts          # GET list + POST create
│   └── [lang]/
│       ├── contact-me/             # API contact form (+ link to server-form page)
│       ├── blogs/
│       │   ├── page.tsx            # List shell + client BlogList (fetch /api/blogs)
│       │   └── [slug]/             # Detail (Suspense-wrapped runtime read) + not-found
│       ├── admin/blogs/            # Create-post form (POST /api/blogs)
│       └── blog-posts/             # Thin redirect to /blogs
├── components/                     # Navbar (Blogs link) / Footer (contact → API page) / ...
├── data/
│   ├── projects.ts, profile.ts     # Part 1 content
│   └── blog-seed.json              # Committed sample posts (seed source)
├── dictionaries/                   # zh / en (blog + contact API strings)
├── lib/
│   ├── json-write-queue.ts         # Process-wide serialized write queue
│   ├── contact-{validation,request,store}.ts
│   ├── blog-{validation,request,store}.ts
│   └── i18n.ts
└── proxy.ts                        # Language negotiation (excludes /api)
scripts/seed-blogs.mjs              # Exclusive-create seed script
```

## Midterm Expansion

Branch `codex/midterm-expanded-portfolio`, developed on top of the Part 2 commit `19140d5`. The two new features are an **interview prep planner** stored in browser LocalStorage and a **learning resources library** backed by its own JSON file and API; in addition, all four categories — contacts, blog posts, projects and learning resources — now have full CRUD behind JSON-file storage and REST-style APIs, completed by a bilingual management hub at `/[lang]/manage`. Video recording and submission are pending.

**Requirements & commands** (Node.js >= 20.9.0; run from the project root):

```bash
npm ci                 # install dependencies
npm run seed:blogs     # first time only: data/blogs.json (2 sample posts)
npm run seed:projects  # first time only: data/projects.json (5 real projects, extracted losslessly)
npm run seed:resources # first time only: data/resources.json (2 sample resources)
npm run dev            # dev server, http://127.0.0.1:3000 (scripts bind 127.0.0.1)
npm run build && npm run start   # production build and serve on 127.0.0.1:3000
```

`data/contact-messages.json` needs no seed — it is created by the first valid contact submission. Every seed script is an exclusive create (`wx`): it refuses to overwrite an existing file, valid or not.

### Pages

| Path | Notes |
|---|---|
| `/en` · `/zh` | Home; featured projects are read from `data/projects.json` at request time |
| `/[lang]/projects` · `/[lang]/projects/[slug]` | List and detail read the runtime JSON; a deleted slug renders the not-found page (when the streamed shell has already gone out, the transfer status may be 200 — documented PPR behavior) |
| `/[lang]/blogs` · `/[lang]/blogs/[slug]` | Part 2 blog, unchanged UX; edit/delete live behind `/manage` |
| `/[lang]/resources` | Learning resources CRUD; the parent component fetches records and passes each to a card via props |
| `/[lang]/interview-planner` | Interview prep planner; data lives in the browser only |
| `/[lang]/manage` | Bilingual management hub: contacts, blog posts, projects — create / list / edit / delete with confirmation steps |
| `/[lang]/contact-me` · `/[lang]/contact-me-server-form` | Public contact forms (API + Server Action), unchanged |

### APIs

Every handler logs `[api] METHOD route -> status` — method, path and status only; request bodies, contact messages and emails are never logged.

| Route | Methods | Notes |
|---|---|---|
| `/api/contacts` | GET, POST | POST is the historical alias of `/api/contact` (same handler, same storage); both return `201` with the created record |
| `/api/contacts/[id]` | GET, PUT, DELETE | `id`/`submittedAt` are immutable |
| `/api/blogs` | GET, POST | Part 2 |
| `/api/blogs/[id]` | GET, PUT, DELETE | PUT edits title/summary/body; the slug is fixed |
| `/api/projects` | GET, POST | `409` on duplicate slug |
| `/api/projects/[slug]` | GET, PUT, DELETE | slug immutable; PUT replaces the editable fields |
| `/api/resources` · `/api/resources/[id]` | GET/POST · GET/PUT/DELETE | URL must be http/https; `readingStatus` is `to-read`/`reading`/`completed` |

Status contract: `201` create · `200` update/delete · `400` validation or invalid request (machine-readable error keys) · `404` unknown · `409` duplicate · `500` controlled storage error (no paths, no stacks). Every read-check-write cycle runs inside the shared process-wide write queue (`src/lib/json-write-queue.ts`); a corrupt file fails controlled and is never silently overwritten.

### JSON files (`data/`, gitignored)

| File | Record |
|---|---|
| `contact-messages.json` | `{id, name, email, message, submittedAt}` |
| `blogs.json` | `{id, slug, title, summary, body, createdAt}` |
| `projects.json` | bilingual `{slug, title/summary/description/role {zh,en}, techStack[], year?, links?, featured?}` |
| `resources.json` | `{id, title, url, category, notes, readingStatus, createdAt}` |

### Interview planner (LocalStorage)

- Versioned key `portfolio.interview-planner.v1`, payload `{version: 1, items: [{id, topic, targetDate, notes, status}]}` with `status` ∈ `pending`/`completed`
- Only the explicit **Save locally** button writes; nothing is written while loading, so an empty or corrupt store is never overwritten by a default
- Reads validate JSON parsing, envelope structure, item fields, real-calendar dates and the status enum, and reject duplicate ids
- With storage disabled, editing still works behind a persistent warning; a quota failure keeps the input and offers a retryable save

### Security & demo scope

Local course demo only — no database, no authentication, no cloud services. Contact records contain private messages: do not deploy this as-is, and do not show real contact content in demos or recordings (the isolated demo setup seeds synthetic data only, with contacts empty).

### Reproducing the tests (in order)

```bash
npm run lint                 # exit 0
npm run build                # exit 0 (includes type checking)
npm run test:planner-storage # mock Storage isolation: empty / bad JSON / bad structure / bad items / duplicate ids / disabled read / quota write — 24 assertions, exit 0
npm run test:resources-api   # isolated temp cwd + port 3177: resources CRUD, invalid input, corrupt-file protection, restart persistence, 201 logs — 58 assertions, exit 0
npm run test:crud-api        # isolated temp cwd + port 3188: contacts/blogs/projects CRUD, public-page sync, legacy endpoint compatibility, restart persistence — 66 assertions, exit 0
```

Each integration script spawns its server with an explicit child-process `cwd` (a fresh `mkdtemp` directory), verifies where writes actually land before mutating anything, and never touches the real `data/`. Failing assertions exit non-zero.

## Related Documents

Part 1 (frozen):

- [Prompt log (summary)](docs/PROMPT_LOG.md) — how Part 1 was built, phase by phase
- [Code review case studies](docs/CODE_REVIEW.md) — three real issues and how they were handled
- [Recording checklist](docs/RECORDING_CHECKLIST.md) — pre-recording preparation and outline for the demo video
- [Student reference script](docs/RECORDING_SCRIPT_EN.md) — Chinese step-by-step instructions + full English narration (not required reading for the instructor)

Part 2 (this branch):

- [Part 2 prompt log](docs/PART2_PROMPT_LOG.md) — real increments and decisions
- [Part 2 code review](docs/PART2_CODE_REVIEW.md) — three real cases (shared write queue, Suspense rendering, exclusive seed)
- [Part 2 test results](docs/PART2_TEST_RESULTS.md) — what was actually tested and what was not
- [Part 2 recording guide](docs/PART2_RECORDING_GUIDE.md) — Chinese steps + full English narration for the blog/API demo

## License

MIT License — see [LICENSE](LICENSE).
