# plan.md

SolidJS 自用组件库的开发计划。agent 按顺序执行，**一次只做一个任务**，完成后把 `[ ]` 改成 `[x]`。

规则见 `AGENTS.md`。标注 🛑 的任务是**人工审核关卡**：agent 完成后必须停下，等我确认再继续。

通用验收标准（每个组件任务都适用，不再重复）：见 `AGENTS.md` 第 7 节"完成定义"。

---

## Phase 0：项目初始化

- [x] **0.1 脚手架**
  Vite + SolidJS + TypeScript（strict），配置路径别名 `@/` → `src/`。
  验收：`pnpm dev` 能启动，`pnpm typecheck` 通过。
  备注：已初始化 main 分支；strict 类型检查、生产构建和 dev HTTP 200 通过，lint 与 token 检查按后续任务建立。

- [x] **0.2 UnoCSS**
  安装并配置 UnoCSS（presetUno），在入口引入。
  验收：页面中使用 `p-4` 等类名生效。
  备注：presetUno 与 Vite 插件已接入；类型检查、构建通过，产物包含 .p-4 的 padding 规则。

- [x] **0.3 Lint 与格式化**
  配置 ESLint（含 `eslint-plugin-solid`）和 Prettier，添加 `pnpm lint` 脚本。
  验收：`pnpm lint` 通过，故意写 `const { a } = props` 能被 lint 报错。
  备注：lint、strict 类型检查和 2 项工具链测试通过；验证了函数体/参数中的 props 解构、className 与显式 any 会被拒绝。

- [x] **0.4 安装依赖**
  安装 `@kobalte/core`、`clsx`。
  验收：能成功 import。
  备注：Kobalte Button 与 clsx import 冒烟检查、typecheck、lint 通过；未安装计划外依赖。

---

## Phase 1：主题系统（整个项目的地基）

- [x] **1.1 tokens.ts**
  创建 `src/theme/tokens.ts`，在初始 token 基础上补全：
  - 颜色：`primary`、`primaryFg`（主色上的文字色）、`danger`、`dangerFg`、`success`、`warning`、`bg`、`surface`、`fg`、`fgMuted`、`border`、`ring`
    （注意用 `fg` / `fgMuted` 代替 `text` / `textMuted`，避免出现 `text-text` 这种类名）
  - 圆角：`sm: 2px`、`md: 4px`、`lg: 6px`
  - 字体：`family`、字号 `sm 12 / md 14 / lg 16 / xl 20`、字重 `normal 400 / medium 500`
  - 阴影：`sm`、`md`（轻量）
  - 过渡：`duration: 150ms`
  - 暗色模式的覆盖值单独放在 `darkColor`
  验收：类型完整，所有颜色对比度（fg 对 bg、primaryFg 对 primary）不低于 WCAG AA（4.5:1）。
  备注：无已有初始 token，按本任务创建蓝色主色与中性背景的明暗主题；正文、次要文字、主色/危险色文字等 9 组配色在两种主题中均通过 AA 对比度测试。

- [x] **1.2 generate.ts**
  把 tokens 转成 CSS 变量（`--color-primary`、`--radius-md`、`--font-size-md` 等），输出到 `src/theme/theme.css`。
  `hover` / `active` 色用 `color-mix(in srgb, var(--color-primary) 90%, black)` 之类的方式从主色派生，不单独写死。
  暗色模式输出到 `[data-theme="dark"]`。
  添加脚本 `pnpm theme:build`，并在 `dev` / `build` 前自动执行。
  验收：只改 `primary` 的值，重新生成后全局主色（含 hover / active）同步变化。
  备注：theme:build 已接入 dev/build 的前置命令；7 项工具链/主题测试、lint 与生产构建通过，测试使用内存副本修改主色，未改动 tokens.ts。

- [x] **1.3 UnoCSS 主题映射**
  在 `uno.config.ts` 中把 tokens 映射为类名：`bg-primary`、`text-primary-fg`、`text-fg`、`text-fg-muted`、`border-border`、`rounded-md`、`text-md`、`shadow-sm`、`ring-ring` 等。
  同时移除默认调色板与不允许的圆角档位（`rounded-xl` 及以上不应生成）。
  验收：`bg-primary` 生效；`bg-red-500` 与 `rounded-2xl` 不再生效。
  备注：已替换默认颜色、字号、字重、阴影与圆角映射；9 项测试、lint 与构建通过，圆形类仅保留给后续带豁免注释的 Avatar/Switch 例外。

- [x] **1.4 全局基础样式**
  创建 `src/theme/base.css`：
  - 简单 reset
  - `body` 使用 `--font-family`、`--font-size-md`、`color: var(--color-fg)`
  - `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;`
  验收：在 demo 页面肉眼检查中英文混排清晰。
  备注：基础样式、token 字体与字体渲染设置已接入，lint/typecheck/build 通过；按用户选择，中英文视觉验收并入 Button 人工关卡。

- [x] **1.5 token 检查脚本**
  添加 `pnpm check:tokens`，扫描 `src/components/**`，出现以下任一即报错并输出文件与行号：
  - 十六进制颜色：`#[0-9a-fA-F]{3,8}\b`
  - `rgb(` / `rgba(` / `hsl(`
  - UnoCSS 任意值：`-\[[^\]]+\]`
  - 禁用的圆角：`rounded-(xl|2xl|3xl|full)`（允许通过注释 `/* allow-token-bypass: 原因 */` 豁免）
  - 内联 `style=` 中的颜色和尺寸字面量
  验收：故意写入违规代码，脚本能报错；正常代码通过。
  备注：13 项工具链/主题测试、typecheck、lint、check:tokens 通过；CLI 违规样例在临时目录中验证，豁免只影响相邻且写明原因的圆角，组件目录尚无文件时明确报告 0 files。

- [ ] **1.6 主题切换与 Demo 骨架**
  实现 `ThemeProvider`（或简单函数）切换 `data-theme`；创建 demo 页面骨架（左侧组件列表，右侧展示区，顶部有明暗切换）。
  验收：明暗切换后所有 token 正确变化。

---

## Phase 2：标准样例 🛑

- [ ] **2.1 Button** 🛑
  variant：`solid` / `outline` / `ghost` / `danger`；size：`sm` / `md` / `lg`；支持 `loading`、`disabled`、`as` 渲染为链接（可选）。
  验收：满足完成定义。

  **agent 完成后停止，等待我审核并手动修改。** 我确认后，该组件即成为后续所有组件的"标准样例"，之后不得再改动其风格。

---

## Phase 3：表单组件

> 全部基于 Kobalte，参考 `Button` 的代码风格。

- [ ] 3.1 Input（含 `invalid` 状态、前后缀插槽）
- [ ] 3.2 Textarea
- [ ] 3.3 Checkbox
- [ ] 3.4 Radio / RadioGroup
- [ ] 3.5 Switch
- [ ] 3.6 Select
- [ ] 3.7 FormField（label + 控件 + 帮助文字 + 错误文字，提供 `aria-describedby` 关联）

---

## Phase 4：展示与反馈

- [ ] 4.1 Badge
- [ ] 4.2 Tag（可关闭）
- [ ] 4.3 Card
- [ ] 4.4 Alert（info / success / warning / danger）
- [ ] 4.5 Spinner
- [ ] 4.6 Skeleton
- [ ] 4.7 Avatar（圆形例外，需在备注中说明）
- [ ] 4.8 Divider

---

## Phase 5：浮层

> 全部基于 Kobalte，注意 Portal、焦点陷阱、Esc 关闭。

- [ ] 5.1 Tooltip
- [ ] 5.2 Popover
- [ ] 5.3 Dialog（含 `Dialog.Title` / `Dialog.Description`）
- [ ] 5.4 DropdownMenu
- [ ] 5.5 Toast（含全局调用方法）

---

## Phase 6：导航与数据

- [ ] 6.1 Tabs
- [ ] 6.2 Breadcrumb
- [ ] 6.3 Pagination
- [ ] 6.4 Table（基础样式，斑马纹可选，不含排序等复杂逻辑）

---

## Phase 7：收尾

- [ ] 7.1 **全库审计**：检查所有组件 props 命名、状态覆盖、暗色模式对比度是否一致，列出不一致项交给我决定。
- [ ] 7.2 **README**：安装、主题配置方法（如何改主色、圆角、字体）、组件列表。
- [ ] 7.3 **库模式打包**：Vite library mode，输出 ESM + 类型声明，`solid-js` 作为 peerDependency。

---

## 备注区（agent 在此记录遗留问题与待决事项）

<!-- 格式：- [任务编号] 问题描述 / 需要我决定的事项 -->
