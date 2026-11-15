# PART2_RECORDING_GUIDE — Demo Video Recording Guide (Chinese steps + English narration)

> **给学生**: 目标 4–5 分钟。先照本指南把每一步自己操作一遍、把英文稿读熟，理解后再**独立录制**；录制过程中不使用任何 AI 助手，也不展示 AI 窗口。本指南只是参考，不保证分数。
>
> **开发模式说明**: dev 模式控制台可能偶现 React Performance "negative timestamp" 警告——仅在 dev 模式观察到，页面显示正常；production 的 HTTP 检查无此阻碍（production 浏览器控制台未测）。录制时忽略即可，不要为此改依赖。
>
> **隐私红线**: 不要打开或展示 `data/contact-messages.json` 的内容（里面有旧的私人留言），只口头说明"留言保存在本地 JSON 文件"。不要展示手机号（公开版已移除）。不要把还没做的部分说成已完成（视频未提交平台、未部署）。

## 录制前检查

- [ ] `npm run dev` 运行中，http://localhost:3000/en 能直接打开
- [ ] `data/blogs.json` 存在且有两篇 sample（若没有：`npm run seed:blogs`，它拒绝覆盖已有文件）
- [ ] 录屏软件试录 10 秒有声音
- [ ] 浏览器书签/输入法候选词等无关内容关闭

## 时间线与讲稿

### 0:00–0:40 开场 + 主页

**操作**: 浏览器直接打开 `http://localhost:3000/en`（明确从英文页开始，避免根路径按语言重定向找不到 Projects）→ 停留主页展示整体布局 → 点导航 "Projects"。

**English narration**:

"Hello, my name is Zhike Yan. This is my portfolio for Assignment 2. It is built with Next.js sixteen, TypeScript, and Tailwind CSS. The site works in Chinese and English, and it runs locally on my machine. I opened it directly at localhost colon three thousand slash en, so we start on the English home page. You can see my introduction and my featured projects. The site has five sections: home, projects, blog, about me, and contact. Let me show you the projects first."

### 0:40–1:25 作品列表 + 两个详情 + 未知 slug

**操作**: 列表页展示 5 个项目 → 打开 `/en/projects/bank-churn-prediction`（讲一句项目内容 + GitHub 源码按钮）→ 返回，打开 `/en/projects/amazon-review-nlp` → 改地址栏为 `/en/projects/xxx` 展示友好 404。

**English narration**:

"The list shows five projects, and each card shows the tech stack. This one is a bank customer churn prediction project. The model reached an AUC of zero point eight six, and the button opens the GitHub repository in a new tab. Another one analyzes Amazon reviews with NLP, and it also has a public repository. If I type a project name that does not exist, I get this friendly not found page, and I can go back to the list."

### 1:25–1:55 关于我 + 联系页介绍

**操作**: 导航 "About Me" → 简单滑过 → 导航 "Contact"（API 表单页）→ 指出页面底部"原版 Server Action 表单"入口链接。

**English narration**:

"This is my About Me page, with my education, internships, and skills. Now the contact page. This form sends a real POST request to an API route, slash API slash contact. The server validates the data and saves it into a local JSON file. The link at the bottom opens the older form, which uses a Server Action instead."

### 1:55–2:45 API 联系表单：无效 → 有效

**操作**: 名字留空、邮箱填 `bad email` → 提交 → 展示字段错误 → 填入有效内容（名字、`demo@example.com`、简短留言）→ 提交 → 成功横幅 + 输入框清空。

**English narration**:

"Let me submit an invalid form first. The name is empty and the email is wrong, so the server returns errors under each field, and nothing was saved. Now I fill in a valid name, email, and a short message, and submit. The button showed Submitting, then I got the success banner, and the form was cleared. The message passed server-side validation and was stored — all without a page reload."

### 2:45–3:45 博客：管理页创建 → 列表 → 两篇详情 → 未知

**操作**: 导航 "Blog" → 列表有两篇 sample → 点列表页底部 "Manage posts" → 粘贴样例（见下方"可粘贴样例"，slug 用日期+序号保唯一）→ 发布 → 成功横幅 + "查看新文章"链接 → 点开新文章详情 → 返回列表确认新文章排第一 → 打开两篇 sample 详情（一英一中）→ 改地址为 `/en/blogs/nope` 展示友好 404。

**English narration**:

"Now the blog. This list really loads the posts by calling the API, and it shows two sample posts from the seed file. At the bottom, the management link opens the admin page. I paste a title, a slug, and a body. I keep the slug unique by using the date and a number. I publish, and the success banner gives me a direct link to the new post. The detail page reads the real JSON file at request time, so new posts appear immediately. Back on the list, my post is already first. The sample posts open in English and Chinese. And a slug that does not exist shows a friendly not found page."

### 3:45–4:40 代码走读（共享屏幕讲代码）

**操作**: 编辑器打开 → `src/app/api/contact/route.ts`（POST→校验→存储→响应）→ `src/lib/contact-validation.ts`（错误键）→ `src/lib/contact-store.ts` 的 `appendContactMessage`（追加 + 进程级写队列）→ `src/lib/json-write-queue.ts` → `src/lib/blog-store.ts`（损坏保护、重复 slug 检查在队列内）→ `src/app/api/blogs/route.ts`（GET 列表 + POST）。

**English narration**:

"Finally, the code. The contact API route reads the JSON body and returns a four hundred if the body is broken. It reuses the same validation function as the Server Action form, so both forms behave the same. On success, the route calls appendContactMessage in the contact store, which appends the message to the JSON file inside a process-wide write queue, and answers with two hundred and one. The blog API works the same way, and its GET method returns all posts, newest first. Every read validates the file, so a broken file returns a clean error instead of crashing."

### 4:40–5:00 收尾

**操作**: 回到博客列表页结束录制。

**English narration**:

"To summarize: a bilingual portfolio with dynamic project pages, an API contact form that shares storage with the Server Action version, and a blog where new posts appear right away. Everything is stored locally in JSON, and validation happens on the server. Thank you for watching."

## 可粘贴样例（管理页创建时用）

- **Title**: `My first published post`
- **Slug**: 用"日期+序号"保证唯一，例如 `demo-2026-11-14-01`（若 409 就把序号 +1，这本身也是演示点）
- **Summary**: `Created live in the demo with POST /api/blogs.`
- **Body**:
  ```
  This post was created during the recording, using the admin page.

  It is stored in the local JSON file and rendered on the detail page at request time.
  ```

## 录制后检查（只有做完才勾选）

- [ ] 视频、声音、时长 OK
- [ ] 按课程要求提交（提交前本文档绝不声称"已提交"）
