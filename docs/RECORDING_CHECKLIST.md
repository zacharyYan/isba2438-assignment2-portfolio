# RECORDING_CHECKLIST — 演示视频录制提纲

> **状态：视频尚未录制，本文件只是录前准备与提纲。** 时长约 8–9 分钟。录制由学生本人完成。

## 录前准备（录之前逐项确认）

- [ ] `npm run dev` 已启动（launchd 常驻或手动），http://localhost:3000 可访问
- [ ] `data/contact-messages.json` 已查看**当前记录数**（录前留痕；演示时说明"从 N 条变为 N+1 条"，不要背固定数字）
- [ ] 无痕窗口（避免扩展/登录状态干扰）。注意：打开 `/` 会按浏览器语言跳到 `/zh` **或** `/en`，不一定中文——直接从 `/en` 开始演示英文页面
- [ ] 窗口分辨率与字体大小足够投影观看；关闭无关标签页；**AI 助手窗口不进入演示画面**
- [ ] 录屏软件已试录 10 秒确认有声音
- [ ] 演示中**不展示**手机号（公开版本已移除）；邮箱与 LinkedIn/GitHub 可展示
- [ ] 明确说明：本作业仅本地演示，无公网部署、无 /api/contact、无后台管理（Part 2 范围）
- [ ] **现场不求助 AI 助手**：录前先理解提纲与代码，录制时用自己的话说明；讲稿可参考 `docs/RECORDING_SCRIPT_EN.md`（参考稿，不保证分数）

## 提纲（时间轴）

### 0:00–0:45 开场
- 自我介绍（姓名、SCU 商业分析硕士）
- 本项目是什么：Next.js 16 App Router + TypeScript + Tailwind v4 的个人作品集
- 一句话点明：含中英文路由、动态项目详情、Server Action 表单持久化

### 0:45–2:00 首页与语言切换
- 打开 `/`（无痕窗口）→ 浏览器语言决定跳 `/zh` 或 `/en`，两者都正常
- 讲首页结构：姓名/方向/精选作品
- 演示以英文页面为主：点导航栏"English"→ URL 变为 `/en`；需要时可切回"中文"对比
- 提一句 `src/proxy.ts` 的 Accept-Language 协商与旧路径重定向（可现场访问 `/about-me` 演示跳转）

### 2:00–3:00 关于我
- `/en/about-me`（英文页演示为主）：教育、实习、技能板块；可切中文对比

### 3:00–4:15 作品列表与详情（两个演示项目）
- `/en/projects`：5 个项目列表
- 进入 **`/en/projects/bank-churn-prediction`**：看描述与 ROC-AUC 0.862 等数据；点 "View source on GitHub" 按钮（新标签打开仓库）
- 进入 **`/en/projects/amazon-review-nlp`**：同样有 GitHub 源码按钮
- 对比 **`/en/projects/researchai`**：显示 "Project link (to be added)"，说明没有核实过的 URL 就不生成空链接

### 4:15–5:00 未知 slug 的 404
- 访问 `/en/projects/xxx`：展示 "404 · Project not found" 页面与返回按钮；可说明流式渲染下 HTTP 状态码可能是 200 + noindex（README 有说明）
- 可顺带访问任一不存在页面展示全站 404

### 5:00–7:00 联系表单（核心）
- `/en/contact-me-server-form`：姓名/邮箱/留言 + 电话已从公开版移除的说明
- **无效提交**：空白姓名 + 错误邮箱（如 `bad email`）→ 展示服务器返回的字段错误（留言为空的错误一并出现）
- **有效提交**：填写完整（可用演示信息如 Demo Student / demo@example.com）→ 提交中按钮禁用 → 成功提示
- 打开 `data/contact-messages.json`：**按当前实际记录数**说明"从 N 条变为 N+1 条"，展示新追加的记录（id、时间戳、trim 后内容）；说明首次提交才创建该文件
- 再提交一条不同内容：两条都在，**是追加不是覆盖**

### 7:00–8:30 代码流程讲解（分享屏幕看代码）
- `actions.ts`：`"use server"`，验证在服务器执行；catch → save-error
- `contact-validation.ts`：trim 非空 + 邮箱五条规则，返回错误键，文案由词典渲染（双语错误提示）
- `contact-store.ts`：读-改-写 + 写队列防并发覆盖；仅 ENOENT 返回空数组，损坏文件抛错保留
- 一句话说明本地 JSON 存储的限制（无数据库、单机、文件无清理）

### 8:30–9:00 收尾
- 技术要点回顾：App Router 动态路由、Server Actions、i18n 路由、错误处理
- 状态：本地演示完成；Part 2 计划（API、后台、部署）未包含

## 录后核对（录完再勾）

- [ ] 视频已录制并回放检查（声音、画面、时长）
- [ ] 提交/上传（按课程要求）——**完成后再勾选，未完成前本文档不得声称已录制或已提交**
