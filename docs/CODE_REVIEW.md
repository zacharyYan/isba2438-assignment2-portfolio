# CODE_REVIEW — Three Real Case Studies

> **Note**: All three cases come from this project's actual development process. Each records the problem/suggestion, the actual handling and its rationale, the source files involved, the check method, and the actual results. The fact that implementation and testing were performed by Viber (the AI coding assistant) is stated in each case; the student is responsible for verifying and understanding the material and for explaining it in the demo.

## Case 1 — JSON read exception handling (preventing data loss)

**Problem / suggestion**

The original `readContactMessages` in `src/lib/contact-store.ts` wrapped everything in `catch { return []; }`: corrupt JSON, non-array content, and permission errors were all silently converted to an empty array. The consequence: the next valid submission would read "empty list" and write back an array containing only the new record — **overwriting a corrupt but possibly salvageable file**. The requirement: an empty array only when the file does not exist (first use); corrupt reads must surface a save failure while the original file is preserved byte-for-byte.

**Actual handling and rationale**

- The file read got its own try/catch: only `error.code === "ENOENT"` (file missing) returns `[]`; every other error is re-thrown (a dedicated `isFileNotFound` guard avoids loose checks).
- `JSON.parse` and the `Array.isArray` check were moved out of the try/catch: corrupt or non-array content throws, and the action's catch converts it into a `save-error` state.
- The write queue kept its design: `writeQueue = task.catch(() => undefined)`, so a single failure does not poison later writes.
- Rationale: distinguishing "no file yet" from "the file is broken" is the precondition for preserving user data; propagating errors lets the UI report honestly instead of masking a fault with an empty array.

**Source files**

- `src/lib/contact-store.ts` (read guard, error propagation)
- `src/app/[lang]/contact-me-server-form/actions.ts` (catch → `save-error`)
- `src/lib/contact-validation.ts` (error keys, used together with this case)

**Check method and actual results**

- Unit tests (Node 24 running the TS directly; the test script has a working-directory guard and runs in a temp directory): **17/17 passed** — a missing file returns `[]` and the read itself creates no file; two appends both survive; corrupt JSON / non-array / `null` / `EACCES` all throw with the file unchanged byte-for-byte; the write queue recovers after a failure.
- End-to-end (production build started from a temp directory with a symlinked `.next`, POSTing to the real server): a valid submission against a corrupt file returned `save-error` with the "save failed" copy, and the corrupt file was preserved; an invalid submission also wrote nothing; fixing the file restored normal writes immediately.
- **Honest record**: the first unit-test run mistakenly executed inside the project directory and overwrote the real messages file. The two known records were restored byte-for-byte from session-verified output and the incident was disclosed to the student. That incident motivated the working-directory guard in the test script. The results above are otherwise reproducible; they were **not** verified on Windows or under different permission models.
- **Attribution**: implementation and test execution were performed by Viber; the student is responsible for reviewing the outputs and explaining the code.

## Case 2 — Bilingual dictionary and RSC serialization fixes

**Problem / suggestion**

Introducing the bilingual toggle exposed three separate issues: (1) the `Dictionary` type in `src/lib/i18n.ts` was defined as `typeof dictionaries.zh`, while `src/dictionaries/index.ts` typed itself using `Dictionary` — a circular reference; TypeScript reported `TS2456` / `TS2502` and the build failed. (2) The dictionary contained a function field, `count: (n) => ...`, and the whole dictionary was passed as a prop to the Client Component `ContactForm` — React Server Components forbid functions across the server→client boundary, so prerendering failed with "Functions cannot be passed directly to Client Components". (3) While rewriting the Footer, the earlier `"use cache"` fix for the year was dropped, and `new Date()` again failed during prerendering.

**Actual handling and rationale**

- The `Dictionary` type moved to `src/dictionaries/zh.ts` (`export type Dictionary = typeof zh`, where `zh` is a dependency-free plain object); `en.ts` imports the type from `./zh`; `index.ts` only combines the values; `i18n.ts` imports the type from `zh.ts` — the dependency chain became one-directional and the cycle disappeared.
- `count` became a template string `"共 {n} 个项目"` / `"{n} projects in total"`, formatted at the call site with `.replace("{n}", String(n))` — the dictionary is now purely serializable data and can safely cross the RSC boundary.
- The footer year was extracted into `<FooterYear />` (containing `"use cache"`), restoring build-time caching.
- Rationale: the RSC serialization boundary requires client-component props to be serializable; placing a type at the end of its dependency chain is the standard way to break a circular reference.

**Source files**

- `src/dictionaries/zh.ts`, `en.ts`, `index.ts`
- `src/lib/i18n.ts`
- `src/app/[lang]/projects/page.tsx` (the `count` call site)
- `src/components/Footer.tsx` (the `"use cache"` year)

**Check method and actual results**

- Before the fixes, `npm run build` reproduced all three failures (exact messages in the build output: `TS2502`, `TS2724`, and "Functions cannot be passed..."); after the fixes, build and lint passed.
- curl checks: the `/zh` and `/en` homepages and list pages rendered the correct language; the project count "共 5 个项目" rendered correctly (SSR text nodes split the number with `<!-- -->5<!-- -->` comments — a normal artifact).
- **Attribution**: fixes and checks were performed by Viber; the student is responsible for understanding why the RSC boundary makes functions illegal as props.

## Case 3 — Distinguishing GitHub source links from live demo links

**Problem / suggestion**

The data model originally had a single `link?: string`, which could not distinguish a "source repository" from a "live demo"; labeling the only available GitHub URL as a Live Demo would mislead visitors. Some projects had no verified URL at all, creating a risk of invented URLs or empty/`#` links. The requirement: render a link only when the URL is verified; show "to be added" otherwise; external links must open in a new tab with a safe `rel`.

**Actual handling and rationale**

- Model refactor: `links?: { kind: "source" | "demo"; url: string }[]`, with labels driven by the `kind` — `source` renders "GitHub 源码 / View source on GitHub", `demo` renders "在线演示 / Live Demo" (dictionary-provided, both languages).
- Only the two public repositories — **verified by ChatGPT through the current GitHub CLI repository listing** (confirmed to exist and be public) — were filled in, both as `source` links: bank-churn-prediction and amazon-review-nlp. ResearchAI has no verified URL, so the detail page renders the text "Project link (to be added)" without any `<a>`.
- External links uniformly use `target="_blank" rel="noopener noreferrer"`.
- `src/data/profile.ts` gained the verified GitHub profile in its public social links, keeping LinkedIn.
- Rationale: the link's semantics live in the data (`kind`) rather than in hard-coded copy; adding a real demo later only requires setting `kind: "demo"`, with no UI changes.

**Source files**

- `src/data/projects.ts` (the type and the two `source` links)
- `src/dictionaries/zh.ts`, `en.ts` (`linkSource` / `linkDemo` / `linkTbd`)
- `src/app/[lang]/projects/[slug]/page.tsx` (renders by `kind`)
- `src/data/profile.ts` (GitHub profile)

**Check method and actual results**

- `npm run build` and `npm run lint` passed.
- curl checks: the href, label copy, `target`, and `rel` of both detail pages (zh/en) were verified one by one; the ResearchAI detail page renders no external link in its project section (the only GitHub/LinkedIn links on the page come from the global footer, which is expected); the contact page and footer list both social links.
- **Verification boundaries**: Viber itself made no direct network requests to the two GitHub URLs (page-render checks only); the repositories' existence and visibility were confirmed by ChatGPT via the GitHub CLI. The `demo` branch of the rendering has no live instance yet — it was not exercised at runtime and is only guaranteed by the code path.
