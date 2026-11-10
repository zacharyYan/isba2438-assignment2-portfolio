# CODE_REVIEW — 三个真实代码审查案例

> **说明**：三个案例均来自本项目实际开发过程。每例记录发现的问题与建议、实际处理与原因、涉及源文件、检查方式与实际结果。"实现与测试由 Viber 完成"的事实已在各例标注；学生负责核对与理解，演示时应能独立讲解。

## 案例一：JSON 读取异常处理（防数据丢失）

**问题 / 建议**

`src/lib/contact-store.ts` 最初的 `readContactMessages` 用 `catch { return []; }` 兜底所有错误：JSON 损坏、内容不是数组、权限不足都会静默返回空数组。后果是下一次有效提交会读取到"空列表"，然后把只含一条新记录的数组写回——**损坏但可能可抢救的原文件被覆盖**。要求：仅文件不存在（首次使用）返回空数组；损坏或读取失败必须显示"保存失败"且原文件逐字节保留。

**实际处理与原因**

- 读文件单独 try/catch：仅当 `error.code === "ENOENT"`（文件不存在）返回 `[]`，其余错误原样抛出（`isFileNotFound` 守卫，避免宽松判断）。
- `JSON.parse` 与 `Array.isArray` 校验移出 try/catch：损坏或非数组直接抛错，交由 action 的 catch 转成 `save-error` 状态。
- 写队列保持原有设计：`writeQueue = task.catch(() => undefined)`，单次失败不毒化后续写入。
- 原因：区分"还没有文件"与"文件坏了"是保留用户数据的前提；错误上抛让 UI 能如实反馈，而不是用空数组掩盖故障。

**源文件**

- `src/lib/contact-store.ts`（读取守卫、错误抛出）
- `src/app/[lang]/contact-me-server-form/actions.ts`（捕获 → `save-error`）
- `src/lib/contact-validation.ts`（错误键，与本案例配合）

**检查方式与实际结果**

- 单元测试（Node 24 直接运行 TS，测试脚本加了工作目录安全锁，在临时目录运行）：**17/17 通过**——文件不存在返回 `[]` 且读操作不创建文件；两次 append 均保留；损坏 JSON / 非数组 / `null` / `EACCES` 四类读取失败均抛错且文件字节不变；失败后写队列可恢复。
- 端到端（临时目录符号链接 `.next` 启动生产构建，向真实服务器 POST）：损坏文件下有效提交返回 `save-error` + "保存失败"文案，损坏文件原样保留；无效提交同样不写；修复文件后立即恢复写入。
- **诚实记录**：第一轮单元测试曾在项目目录内误运行，覆盖了真实留言文件；当时从会话内已验证输出中逐字节恢复了已知两条记录，并披露给学生。该事故促成了测试脚本的安全锁。除此之外上述结论均可复现；未在 Windows/权限模型不同的环境下验证。

## 案例二：双语词典与 RSC 序列化修正

**问题 / 建议**

引入中英双语时连续暴露三类问题：(1) `Dictionary` 类型在 `src/lib/i18n.ts` 里用 `typeof dictionaries.zh` 定义，而 `src/dictionaries/index.ts` 又反过来用 `Dictionary` 标注自身——循环引用，TypeScript 报 `TS2456` / `TS2502`，构建失败；(2) 词典含函数字段 `count: (n) => ...`，而整本词典作为 prop 传给客户端组件 `ContactForm`——React Server Components 禁止函数跨服务端→客户端边界，预渲染报错 "Functions cannot be passed directly to Client Components"；(3) 重写 Footer 时把上一阶段 `"use cache"` 缓存年份的修复弄丢，`new Date()` 在预渲染期再次报错。

**实际处理与原因**

- `Dictionary` 类型移到 `src/dictionaries/zh.ts`（`export type Dictionary = typeof zh`，zh 是无依赖的纯对象）；`en.ts` 从 `./zh` 导入类型；`index.ts` 只组合值；`i18n.ts` 从 `zh.ts` 引类型——依赖链变成单向，循环消除。
- `count` 改为字符串模板 `"共 {n} 个项目"` / `"{n} projects in total"`，使用处 `.replace("{n}", String(n))`——词典变成纯可序列化数据，安全跨 RSC 边界。
- Footer 年份抽成 `<FooterYear />`（内部 `"use cache"`），恢复构建期缓存。
- 原因：RSC 的序列化边界要求客户端组件的 props 只含可序列化数据；类型定义放在依赖链末端是消除循环引用的常规做法。

**源文件**

- `src/dictionaries/zh.ts`、`en.ts`、`index.ts`
- `src/lib/i18n.ts`
- `src/app/[lang]/projects/page.tsx`（`count` 使用处）
- `src/components/Footer.tsx`（`"use cache"` 年份）

**检查方式与实际结果**

- 修复前 `npm run build` 分别复现了上述三个错误（错误信息原文见构建输出：`TS2502`、`TS2724`、"Functions cannot be passed..."）；修复后 build 与 lint 通过。
- curl 实测：`/zh` 与 `/en` 首页、列表页双语内容正确；项目计数"共 5 个项目"渲染正常（SSR 文本节点会把数字拆成 `<!-- -->5<!-- -->`，属正常现象）。

## 案例三：GitHub 源码与在线演示链接的区分

**问题 / 建议**

数据模型最初只有单一 `link?: string`，无法区分"源码仓库"与"在线演示"；如果把手头唯一的 GitHub 地址标成 Live Demo 会误导访客；同时部分项目没有已核实的 URL，存在猜测编造或生成空链接（`#`）的风险。要求：只有核实过的地址才生成链接；未核实的显示"待补充"；外链新标签打开并带安全 rel。

**实际处理与原因**

- 模型重构：`links?: { kind: "source" | "demo"; url: string }[]`，类型驱动标签渲染——`source` 显示"GitHub 源码 / View source on GitHub"，`demo` 显示"在线演示 / Live Demo"（词典双语）。
- 仅填入两个**经 ChatGPT 通过 GitHub CLI 核实的公开仓库**（bank-churn-prediction、amazon-review-nlp），均标 `source`；ResearchAI 无核实 URL，详情页只渲染"项目链接（待补充）"文字，不生成 `<a>`。
- 外链统一 `target="_blank" rel="noopener noreferrer"`。
- `src/data/profile.ts` 的公开社交链接加入已核实的 GitHub 主页，保留 LinkedIn。
- 原因：链接语义交给数据（kind）而不是硬编码文案，后续添加真实演示链接只需把 `kind` 设为 `"demo"`，UI 无需改动。

**源文件**

- `src/data/projects.ts`（类型与两个 source 链接）
- `src/dictionaries/zh.ts`、`en.ts`（`linkSource` / `linkDemo` / `linkTbd`）
- `src/app/[lang]/projects/[slug]/page.tsx`（按 kind 渲染）
- `src/data/profile.ts`（GitHub 主页）

**检查方式与实际结果**

- `npm run build` / `npm run lint` 通过。
- curl 实测：两个详情页（zh/en）的 href、标签文案、`target`/`rel` 逐一核对正确；ResearchAI 详情页项目区无外链（页面唯一的 GitHub/LinkedIn 链接来自全站页脚，属预期）；联系页与页脚的 GitHub/LinkedIn 链接齐全。
- **仓库核实方式**：两个 GitHub 仓库的真实性与公开状态由 **ChatGPT 通过当前 GitHub CLI 仓库列表核实**（确认存在且为公开仓库）；**Viber 自身未对这两个 URL 做直接网络请求验证**（页面渲染只验证了 href、标签与 rel 属性）。
- **未验证项**：演示（demo）类链接当前无实例，其渲染分支未经过运行时验证，仅由代码路径保证。
