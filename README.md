# Zhike Yan — 个人作品集 / Portfolio

Assignment 2 Part 1 的个人作品集网站，基于 Next.js 16（App Router）+ TypeScript + Tailwind CSS v4。

**仅本地演示，没有公网部署。** 不包含 /api/contact、后台管理或部署配置（属 Part 2 范围）。

## 环境与命令

要求 Node.js 20+（开发环境为 Node 24）。

```bash
npm install         # 安装依赖
npm run dev         # 开发服务器，http://localhost:3000
npm run build       # 生产构建（含类型检查与静态生成）
npm run start       # 运行生产构建，需先 build
npm run lint        # ESLint 检查
```

## 中英文与路由重定向

- 所有路由带语言前缀：`/zh`、`/en`，例如 `/zh/about-me`、`/en/projects/researchai`
- `src/proxy.ts` 读取浏览器 `Accept-Language`：中文浏览器重定向到 `/zh/...`，其他到 `/en/...`
- 不带前缀的旧路径（如 `/about-me`）自动重定向到带语言前缀的版本
- 导航栏右侧按钮在当前路径上切换 `/zh ↔ /en`
- `<html lang>` 与各页 metadata 随语言输出

## 可演示的项目 slug

| 路径 | 说明 |
|---|---|
| `/zh/projects/bank-churn-prediction`（或 `/en/...`） | 详情页含 "GitHub 源码 / View source on GitHub" 按钮 |
| `/zh/projects/amazon-review-nlp`（或 `/en/...`） | 同上 |
| `/zh/projects/researchai` | 无已核实链接，显示"项目链接（待补充）"，不生成空链接 |

未知 slug（如 `/zh/projects/xxx`）会渲染 `[lang]/projects/[slug]/not-found.tsx` 的未找到页面。注意 HTTP 状态码：在流式响应已开始的情况下可能是 **200（自动附带 `noindex`）** 而非 404，这是 Next.js Partial Prerendering 的文档化行为。

## 表单 → Server Action → 验证 → JSON 的代码流程

1. `src/app/[lang]/contact-me-server-form/ContactForm.tsx`（客户端组件）用 `useActionState` 渲染表单：姓名、邮箱、留言三个字段，提交中禁用按钮显示"提交中…"。
2. 提交进入 `actions.ts` 的 `submitContactForm`（文件顶部 `"use server"`，验证只在服务器执行）。
3. `src/lib/contact-validation.ts` 校验：姓名/留言去除首尾空白后非空；邮箱只能有一个 @、@ 前非空、域名含点且每段非空、整体不含空白。返回错误键（如 `nameEmpty`），文案由词典渲染。
4. 校验失败 → 返回 `validation-error` 状态与字段错误，**不触碰文件**，并保留用户已输入内容。
5. 校验通过 → `src/lib/contact-store.ts` 的 `appendContactMessage` 读取-追加-重写 JSON 文件（模块内 promise 写队列串行化并发写入）。
6. 读取/解析失败（JSON 损坏、内容非数组、权限错误）发生在写入之前 → action 捕获后返回 `save-error`，本次提交不会产生任何写入。存储模块只在文件不存在（ENOENT）时返回空数组。
   **写入限制**：`fs.writeFile` 是非原子写入。上述机制只能保证"读取/解析失败时不进行后续写入"，**不能**保证磁盘写入中途断电/中断时原文件完整。写队列是模块级 promise，只在单个服务器进程内生效；多进程或多实例部署时并发写仍可能互相覆盖。
7. 成功 → 返回 `success`，表单清空，页面显示成功提示。

### JSON 位置与首次创建

- 文件：`<项目根>/data/contact-messages.json`，由 `process.cwd()` 定位
- **首次有效提交时自动创建**（目录与文件都不预建）；无效提交不会创建文件
- 每条记录含 `id`（UUID）、`name`、`email`、`message`、`submittedAt`（ISO 时间）
- `/data` 已被 .gitignore 排除，留言不会进入版本库

### 本地文件存储的限制

- 无数据库、无邮件发送：留言只落在本地 JSON 文件，仅本机可读
- 文件无限增长，无清理机制；不设鉴权，不能上公网直接用
- 路径依赖 `process.cwd()`，从其他目录启动 `npm run start` 会写到别处
- `fs.writeFile` 非原子：磁盘写入中断可能损坏文件，本实现不做原子替换（如临时文件 + rename）
- 写队列只在单进程内生效，不防多进程/多实例并发写
- 若 JSON 被手工改坏，提交会显示"保存失败"（保护发生在读取/解析阶段，不执行写入）；手工修复为合法 JSON 数组后恢复写入

## 项目结构

```
src/
├── app/
│   ├── [lang]/                  # 双语路由（zh / en）
│   │   ├── layout.tsx           # 根布局：Navbar + Footer，generateStaticParams
│   │   ├── page.tsx             # 首页：简介 + 精选作品
│   │   ├── about-me/            # 关于我
│   │   ├── projects/
│   │   │   ├── page.tsx         # 作品列表
│   │   │   └── [slug]/          # 详情（generateStaticParams + notFound）
│   │   ├── contact-me-server-form/  # 表单页 + actions.ts + form-state.ts
│   │   └── not-found.tsx
│   ├── favicon.ico
│   └── globals.css              # Tailwind v4（@theme 定义在 CSS 内）
├── components/                  # Navbar / Footer / ProjectCard / LocaleToggle
├── data/                        # profile.ts、projects.ts（双语内容数据）
├── dictionaries/                # zh.ts / en.ts 词典
├── lib/                         # i18n.ts、contact-validation.ts、contact-store.ts
└── proxy.ts                     # 语言协商重定向
```

## 相关文档

- `docs/PROMPT_LOG.md` — 开发过程提示记录（摘要）
- `docs/CODE_REVIEW.md` — 三个代码审查案例
- `docs/RECORDING_CHECKLIST.md` — 演示视频录制提纲（尚未录制）
- `docs/RECORDING_SCRIPT_EN.md` — 英文演示讲稿（参考稿，尚未录制）

## 许可

MIT License，见 `LICENSE`。
