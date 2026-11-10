# PROMPT_LOG — 开发提示记录（摘要）

> **说明**：本文档是按会话实际历史整理的**摘要**，不是逐字引文。每个阶段列出主要提示意图与本阶段产出，供了解开发过程使用。不含伪造的用户原话、用户决定或历史提交记录。

## 角色说明（诚实声明）

- **实现与测试**：由 Viber（编程助手）完成——代码编写、命令执行、构建/lint/端到端检查及结果报告均来自助手，不是学生逐条手工执行。
- **提示组织与复核**：ChatGPT 协助组织提示词与复核产出。
- **学生职责**：核对代码与文档、理解并能讲解每一部分（演示视频由学生本人录制）。

## 阶段记录

### 阶段 1：初始化

- **提示意图**：检查环境与已有项目；如无项目先提出初始化方案；确认 Next.js 版本与路由方式；不实现页面。
- **产出**：确认为空目录（Node 24）；确认方案 App Router + TypeScript + Tailwind + 本地数据、暂不部署；`create-next-app` 创建项目，Next.js **16.4.5**（Turbopack、Cache Components）；`next build` 通过。

### 阶段 2：页面骨架

- **提示意图**：确定路由 `/about-me` 与 `/contact-me-server-form`；建立作品数据（含 slug 的类型 + 两条记录）、可复用导航栏/页脚/作品卡片、首页、作品列表与详情；两个有效 slug 内容不同、未知 slug 有清楚 404；个人资料不确定处标"待补充"，不编造。
- **产出**：`src/data/`、`src/components/`、首页、`/about-me`、`/projects`、`/projects/[slug]`（`generateStaticParams` + `notFound`）、详情级 `not-found.tsx`；构建中发现 Next 16 禁止预渲染期调用 `new Date()`，按文档用 `"use cache"` 修复；build/lint/运行时验证通过（未知 slug 因 PPR 流式渲染返回 200 状态码但渲染 404 UI 并注入 noindex，属文档化行为）。

### 阶段 3：服务器表单

- **提示意图**：只实现 `/contact-me-server-form` 的服务器表单；先读本地表单与 Server Actions 文档；姓名/留言 trim 后非空；邮箱五条规则（单一 @、@ 前非空、域名含点、每段非空、无空白）；验证必须在服务器；有效提交追加保存 JSON 且不互相覆盖，无效提交不写文件；读写逻辑独立服务器模块；显示成功/字段错误/保存失败与等待状态；修复 ProjectCard 重复技术标签导致的 key 重复。
- **产出**：`contact-validation.ts`（纯函数）、`contact-store.ts`（读-改-写 + promise 写队列）、`"use server"` action、`useActionState` 表单（pending/成功/验证错误/保存失败四种反馈）；ProjectCard 用 Set 去重。端到端用 React 渐进增强协议（SSR 暴露的 `$ACTION_*` 隐藏字段）真实 POST 验证：31 项检查全部通过（两次有效提交均保存、12 种无效提交文件逐字节不变、重启后记录仍在）。**未实现**（按指示）：`/api/contact`、`/admin`。

### 阶段 4：保存失败加固

- **提示意图**：审查 `contact-store.ts`——仅文件不存在时返回空数组；JSON 损坏或读取失败须显示保存失败并保留原文件；用独立测试文件验证，不破坏已有留言。
- **产出**：修复读取逻辑（仅 ENOENT 返回 `[]`，损坏/非数组/权限错误一律抛错）；Node 直跑单测 **17/17**（在临时目录运行，含 EACCES、写队列未被毒化）；临时目录 + 损坏文件的端到端验证：真实服务器返回 save-error、损坏文件逐字节保留。
- **事故披露**：第一轮单测误在项目目录运行，覆盖了真实留言文件；已从本会话已验证输出中逐字节恢复两条已知记录；若当时存在用户自行提交的留言则无法恢复（无系统快照）。测试脚本随后加了工作目录安全锁。

### 阶段 5：真实内容

- **提示意图**：按学生简历替换个人资料与项目内容。
- **产出**：`profile.ts`（SCU 商业分析硕士、本科、两段实习、三组技能、语言/摄影）与 `projects.ts`（ResearchAI、Bank Churn、Financial Marketing、Amazon NLP、Manufacturing Cost 共 5 个项目，文案源自简历）；精选=ResearchAI+Bank Churn；曾就电话号码位数与 ResearchAI 链接缺失向学生提问确认。

### 阶段 6：中英文切换

- **提示意图**：添加中英文切换按钮。
- **产出**：按 Next.js 16 官方 i18n 指南重构为 `src/app/[lang]/` 双语路由；`src/proxy.ts`（Next 16 中 middleware 更名 proxy）按 `Accept-Language` 重定向，旧路径自动跳转；`src/dictionaries/` 双语词典；数据文件改为 `{ zh, en }` 本地化字段；验证改为返回错误键、由词典渲染；导航栏 `LocaleToggle` 按当前路径切换。
- **构建问题与修复**：词典类型循环引用（`Dictionary` 类型移至 `zh.ts`）；词典内函数无法传给客户端组件（改为 `{n}` 占位符）；Footer 重写时丢失 `"use cache"` 年份修复（补回）。build/lint 通过；语言协商、双语内容、双语 404、双语言表单反馈均实测通过。

### 阶段 7：项目链接

- **提示意图**：填入两个已核实的 GitHub 仓库；明确区分"GitHub 源码"与"在线演示"；未核实 URL 不猜测、不生成空链接；社交链接加入 GitHub 主页；外链新标签打开并带 rel。
- **产出**：`Project.link` 重构为 `links?: { kind: "source" | "demo"; url: string }[]`；两个仓库以 source 类型填入，词典提供双语标签；ResearchAI 保持"待补充"；`profile.links` 加入 GitHub；build/lint/运行时验证通过。

### 阶段 8：发布前收尾（本轮）

- **提示意图**：移除公开版本手机号；重写 README；加 MIT LICENSE；补 `docs/`（提示记录、代码审查、录制提纲）；完善 .gitignore；最终 build/lint 与页面核对；保持 3000 预览。
- **产出**：`profile.phone` 设为 `null`；重写 README；新增 LICENSE 与三份 docs；.gitignore 增加录屏与本地提交信息规则（实测 `package-lock.json` 保持入库）。
- **本轮实际验证**（由 Viber 执行）：`npm run build` 通过（zh/en 全路由静态生成）、`npm run lint` 0 错 0 警；curl 核对 11 个页面路径均为 200、`/zh/projects/xxx` 为 404；全仓库检索确认无手机号痕迹（README/docs/LICENSE/src）；`data/contact-messages.json` 保持 2 条记录、字段完整。
- **验证边界**：本轮**没有新增表单端到端测试写入**（表单链路未改动）；表单相关的历史检查结果（两轮共 31 + 6 项）是引用阶段 3/4 的会话内验证记录，本轮未重跑；本文件依据会话对话记录整理，不存在独立的日志文件来源。

### 阶段 8 补充：发布前复核修正

- **提示意图**：复核后修正文档表述——写失败保护的能力边界（非原子写入、写队列仅单进程）、未知 slug 的 HTTP 状态码表述、仓库核实方式（ChatGPT 经 GitHub CLI 核实）、录制提纲细节。
- **产出**：README 两处准确化（写入非原子限制、流式下可能 200+noindex）；CODE_REVIEW 案例三的核实方式改为如实归属；录制提纲修正（见该文件）；新增 `docs/RECORDING_SCRIPT_EN.md`（英文讲稿参考）。本轮只改文档，未重新构建。

## 截至发布前准备阶段结束时未发生的事（防误解）

- **截至本文件更新时**（发布前准备阶段结束）：未执行过任何 `git commit` / `git push`，未创建远程仓库，未部署。此后若学生进行 GitHub 发布，以实际操作为准，与本文件无矛盾。
- 未实现 Part 2 功能（`/api/contact`、`/admin`、部署）。
- 演示视频尚未录制。
