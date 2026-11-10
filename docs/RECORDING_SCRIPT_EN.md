# RECORDING_SCRIPT_EN — 英文演示讲稿（参考稿）

> **使用说明**：本文件是**参考稿**——中文为逐步操作指示，英文为每一步可参考的讲稿。请先理解内容，再用**自己的话**讲述；逐字照读会被听出来，也不保证分数。总时长控制在 **10 分钟以内**（下述脚本约 9 分钟）。演示一律使用英文页面；演示数据使用虚构信息（Demo Student / demo@example.com / "Assignment 2 recording demo"）；JSON 记录数以你录制时的**实际数字**为准。AI 助手窗口不出现在画面里，现场不求助。

---

## Step 1 · 开场（0:00–0:45）

**操作**：本步仅屏幕录制 + 旁白（不开摄像头）。画面停在浏览器标签页（先不打开网站）。念完开场白后切到浏览器。

**English script**:

"Hi, my name is Zhike Yan, a master's student in Business Analytics at Santa Clara University. This is my demo for the portfolio assignment. The site is built with Next.js sixteen using the App Router, TypeScript, and Tailwind CSS. It's a bilingual portfolio with Chinese and English routes, dynamic project pages, and a contact form whose submissions are validated on the server and stored in a local JSON file. This is a local demo only — there is no public deployment, and Part Two features like an API route or an admin page are not included."

---

## Step 2 · 首页与语言切换（0:45–2:00）

**操作**：无痕窗口打开 `http://localhost:3000`。指出跳转结果取决于浏览器语言（可能到 `/zh` 也可能到 `/en`，两者都正常）。然后点导航栏 **English** 到 `/en`，以英文页为主讲首页；可切回"中文"一瞬对比。最后地址栏输入 `/about-me`（不带前缀）演示重定向。

**English script**:

"Here's the homepage. Notice the URL: I opened the root path, and the app redirected me based on the browser's language setting — to slash-zh for Chinese or slash-en for English. That redirect comes from a proxy file that reads the Accept-Language header. If the browser already opens on slash-en, there's no need to press the language button at all. On the homepage you can see my name, my focus areas, and a couple of featured projects. The button on the right switches the language: it only swaps the locale prefix and keeps the rest of the path — for example, slash-en slash about-me becomes slash-zh slash about-me. If you visit an old path without a language prefix, like slash about-me, the proxy redirects it to the localized version."

---

## Step 3 · 关于我（2:00–3:00）

**操作**：点导航 **About Me**（`/en/about-me`）。滚动展示教育、实习、技能、其他。可切中文一瞬。

**English script**:

"This is the About Me page. It's rendered from a data file, not hard-coded in the page — education, my internships, and my technical skills are all stored as bilingual records in src slash data slash profile dot ts. That's why the same page can switch between Chinese and English without duplicating components."

---

## Step 4 · 作品列表与两个项目详情（3:00–4:30）

**操作**：点 **Projects**（`/en/projects`，共 5 个）。进 **Bank Customer Churn Prediction** 详情，滚到 "View source on GitHub" 按钮并点击（新标签打开仓库，切回）。进 **Amazon Watch Review NLP** 详情，指出同样按钮。最后提 ResearchAI 显示 "Project link (to be added)"。

**English script**:

"The Projects page lists all five projects, rendered from a local data file. Let me open the bank customer churn prediction project. The detail page comes from a dynamic route, projects slash bracket-slug, and the content here includes real numbers from the analysis — for example a test ROC-AUC of zero point eight six two. This button says 'View source on GitHub' — it opens the verified repository in a new tab. The label matters: this is a source code link, not a live demo. The same goes for the Amazon watch review NLP project — again a source link, clearly labeled. And notice the ResearchAI project has no button at all. There's no verified URL for it yet, so instead of guessing or rendering an empty link, the page just says 'Project link — to be added'."

---

## Step 5 · 未知 slug 的 404（4:30–5:15）

**操作**：地址栏输入 `/en/projects/xxx`，展示 404 页面，点 "Back to projects" 返回。

**English script**:

"What happens if I visit a slug that doesn't exist? The dynamic route validates the slug against the data file, and when nothing matches it triggers the not-found handler, which renders this page: 'Project not found', with a button back to the list. One detail: because Next.js streams the response, the HTTP status here can be two hundred with a noindex tag rather than a classic four-oh-four — that's documented behavior with Partial Prerendering, and I've noted it in the README."

---

## Step 6 · 无效提交（5:15–6:30）

**操作**：进 **Contact**（`/en/contact-me-server-form`）。
1. 姓名留空，邮箱填 `bad email`，留言留空 → 点 Submit → 三条字段错误同时显示。
2. 指出留言错误也在（空留言）。

**English script**:

"Now the contact form — this is the core feature. It has three fields: name, email, and message. Note that my phone number is intentionally not on the public version of this site. Let me submit invalid data first: I'll leave the name blank, type 'bad email' into the email field, and leave the message empty. All the validation runs on the server — the form has no client-side required attributes and noValidate is set — and the server returns an error for each field: the name cannot be empty, the email format is invalid, and the message cannot be empty. The text I typed is preserved, and importantly, nothing was written to the file — rejected submissions never touch storage."

---

## Step 7 · 有效提交与 JSON 展示（6:30–8:00）

**操作**：填入演示信息——姓名 `Demo Student`，邮箱 `demo@example.com`，留言 `Assignment 2 recording demo` → Submit → 按钮短暂"Submitting…"→ 绿色成功提示。然后切到编辑器打开 `data/contact-messages.json`：**先说录前的实际条数，再说现在是 N+1 条**（现场数，不要背数字）。

**English script**:

"Now a valid submission. I'll use demo information: Demo Student, demo at example dot com, and 'Assignment two recording demo'. While it submits, the button is disabled and shows 'Submitting'. And we get a success banner. Before recording, I noted the JSON file had — say — N records. Let's open it: now it has N plus one. Each record gets a UUID, the name and message are stored trimmed, and there's an ISO timestamp. The file lives in data slash contact-messages dot JSON, it's created automatically on the first valid submission, and it's excluded from the repository through gitignore. If I submitted again, it would be appended — earlier tests confirmed consecutive submissions don't overwrite each other."

---

## Step 8 · 代码流程讲解（8:00–9:15）

**操作**：编辑器里按顺序展示四个文件，每个 20 秒左右：
1. `src/app/[lang]/contact-me-server-form/ContactForm.tsx` — `useActionState`、`pending`、按词典渲染
2. `src/app/[lang]/contact-me-server-form/actions.ts` — `"use server"`、`validateContactFields`、try/catch
3. `src/lib/contact-validation.ts` — trim 非空 + 邮箱五条规则，返回错误键
4. `src/lib/contact-store.ts` — `readContactMessages`（仅 ENOENT 返回空数组）、`appendContactMessage`、写队列

**English script**:

"Here's how the code flows. The form is a client component using React's useActionState hook — it receives the action, shows the pending state, and renders feedback from the returned state object; the labels and error messages come from a dictionary, which is how the form speaks both languages. The action file starts with 'use server', so validation always runs on the server no matter how the form is submitted. It calls validateContactFields, a pure function that trims the name and message, checks the email against five rules — one at-sign, non-empty local part, a dot in the domain, non-empty domain segments, no whitespace — and returns error keys rather than strings. If validation fails, the action returns early and the file is never touched. If it passes, appendContactMessage in the store module reads the JSON file, pushes the new record, and writes it back. Reads return an empty array only when the file doesn't exist; a corrupt file throws instead, which becomes a 'save failed' message while the original file is preserved. Writes go through a small promise queue to serialize concurrent submissions within this process."

---

## Step 9 · 文档展示与收尾（9:15–9:45）

**操作**：快速切过 README.md、docs/PROMPT_LOG.md、docs/CODE_REVIEW.md（三案例标题）、docs/RECORDING_CHECKLIST.md，每个 2–3 秒。结束录制。

**English script**:

"Finally, the repo includes documentation: the README explains how to run everything and documents the storage limitations honestly — for example, the file write is not atomic and the write queue only works within a single process. The prompt log summarizes how this project was built with an AI assistant, the code review document walks through three real issues I reviewed, and there's a recording checklist. Thanks for watching — this demo covered the bilingual portfolio, the dynamic project routes with a proper not-found page, and the server-validated contact form with local JSON persistence."

---

## 讲稿之外的三条提醒

1. **先理解，再录**：以上英文讲稿是参考；确保你能脱稿解释每一步（尤其 Step 8 的代码流程），用自己的话讲。
2. **数字以现场为准**：JSON 记录数、项目数、时间戳都按你录制时的实际状态说。
3. **不保证分数**：本稿仅为组织演示用，评分以课程要求为准。
