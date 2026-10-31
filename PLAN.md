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

- [x] **1.6 主题切换与 Demo 骨架**
  实现 `ThemeProvider`（或简单函数）切换 `data-theme`；创建 demo 页面骨架（左侧组件列表，右侧展示区，顶部有明暗切换）。
  验收：明暗切换后所有 token 正确变化。
  备注：采用主题函数与 Solid 信号，默认跟随系统并保存用户选择；17 项测试及 typecheck/lint/check:tokens/build 通过，浏览器视觉与键盘验收按用户选择留到 Button 关卡。

---

## Phase 2：标准样例 🛑

- [x] **2.1 Button** 🛑
  variant：`solid` / `outline` / `ghost` / `danger`，另有经用户授权的 `mahjong` 实验变体；size：`sm` / `md` / `lg`；支持 `loading`、`disabled`、`as` 渲染为链接（可选）。
  验收：满足完成定义。
  备注：基于 Kobalte，保留 36 个旧矩阵组合，新增 18 个键帽/麻将并排对比组合及麻将计数、保存示例。原有四个变体、默认样式和键帽 token 已由回归测试锁定；仅新增用户授权的两个麻将阴影 token。30 项测试及 typecheck/check:tokens/build 通过；真实浏览器已验证鼠标、键盘、明暗主题三态与移动端布局。后续已仅修正 Button 测试的换行格式，完整 lint 复核通过，断言与组件实现未改。可选 as 链接未实现；按用户“继续下一个”的确认，Button 外观审核关卡已通过，现有实现与风格冻结。麻将仍是独立可选实验变体，其他组件不继承 Button 的立体阴影例外。

  **agent 完成后停止，等待我审核并手动修改。** 我确认后，该组件即成为后续所有组件的"标准样例"，之后不得再改动其风格。

---

## Phase 3：表单组件

> 全部基于 Kobalte，参考 `Button` 的代码风格。

- [x] 3.1 Input（含 `invalid` 状态、前后缀插槽）
  备注：基于 Kobalte TextField，支持三种尺寸、错误/禁用/只读状态、文本与 JSX 前后缀、受控/非受控值、原生属性/事件及 class 透传；已导出并注册完整 demo。42 项测试及 typecheck/lint/check:tokens/build 通过，真实浏览器完成键盘、表单提交/重置、明暗主题与 390px 窄屏验收；未新增依赖或 token，未修改 Button 实现或风格。
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

- [2.1] 浏览器连接已恢复；SSR 测试使用独立临时缓存，开发服务运行测试后缓存不变、预览正常。新增阴影 token 后已重启开发服务，使 UnoCSS 重新加载主题映射。
- [2.1] 用户已确认键帽方向及 `shadow.keycap` / `shadow.keycapPressed` 两个 token；Button 的阴影例外仅限本组件。预览中底座阴影从 3px 收短到 1px，disabled / loading 使用 `shadow-sm`，未新增依赖或修改其他组件。
- [2.1] 用户已授权新增 `shadow.mahjong` / `shadow.mahjongPressed` 两个 token 及独立 `variant="mahjong"` 实验；瓷质牌面跟随现有背景 token，绿色厚底跟随 `success`，按下厚底从 6px 收短到 2px。保留旧版的 3px → 1px 键帽效果，不新增颜色、依赖、位移或渐变。
- [2.1] 真实浏览器键盘验收覆盖 54 个展示组合、28 个 Tab 停靠点（跳过 36 个禁用/加载按钮）、Enter / Space 单次激活、两种样式共享的动态禁用与 loading；明暗主题 hover / active 和实际焦点环通过，麻将文字最低对比度为 11.2:1，键帽为 5.26:1。1280×900 与 390×844 无横向溢出或按钮裁切；浅色、深色、移动端截图已查看并保存在 `.playwright-mcp/`（不提交）。用户已确认继续后续组件，Button 现有版本作为标准样例冻结。
- [3.1] 前后缀为非交互旁置插槽，以 aria-hidden 避免污染控件名称；单位与含义由使用方的 label/帮助文字说明，FormField 留待 3.7。保留原生 onInput/onChange，新增 onValueChange 对接受控值；适配 Solid 与 Kobalte 的输入事件类型，并同步原生 defaultValue，确保非受控、受控和固定值字段的原生 reset 行为一致。
- [3.1] 新增 12 项 SSR/UnoCSS 回归测试，测试服务器使用独立临时缓存并关闭 HMR/WebSocket，不影响预览。真实浏览器验证 22 个 Tab 停靠点（含 14 个可用输入框，跳过 3 个禁用字段）、readonly 选择且不可编辑、动态值/尺寸/插槽/class/name/状态、原生 ref 与绑定事件、Enter 提交及必填校验。明暗模式正文对比度为 16.97:1，占位文字最低为 7.41:1；1280×900 和 390×844 无横向溢出、输入框或插槽裁切。明暗及窄屏截图已查看并保存在 `.playwright-mcp/`（不提交）。Input 验收已完成，后续按计划推进。
- [3.1] pnpm lint 的过滤输出曾误报通过；完整复核定位到 Button 测试链式调用未换行。按用户继续整个 PLAN 的指示，仅修正该处测试格式并单独提交，未改变组件、样式或断言；`rtk proxy pnpm lint` 现已通过。后续对链式检查命令继续复核完整输出，避免误报完成。
