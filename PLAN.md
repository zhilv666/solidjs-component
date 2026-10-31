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
- [x] 3.2 Textarea
  备注：基于 Kobalte TextField，支持三种尺寸、错误/禁用/只读状态、受控/非受控值、原生属性/事件与 class 透传；默认 Enter 换行，可纵向手动调整或启用自动增高。50 项测试及 typecheck/lint/check:tokens/build 通过，真实浏览器完成键盘、原生事件计数、表单提交/重置、明暗主题和 390px 窄屏验收；SSR 首行换行与特殊字符经浏览器解析复核。未新增依赖或 token，未修改已完成组件。
- [x] 3.3 Checkbox
  备注：基于 Kobalte，支持三种尺寸、选中/半选、错误/禁用/只读状态、受控/非受控值、原生事件/ref/属性与 class 透传；半选为独立展示状态。57 项测试及 typecheck/lint/check:tokens/build 通过，真实浏览器验收 26 个示例、20 个可用输入框的 Tab/空格与可见焦点环、单次状态回调、表单必填/提交/重置、明暗主题和 390px 窄屏；选中/半选与错误组合的边框无冲突。隐藏输入框通过 peer-focus-visible 将 2px token 焦点环映射到可见方框，未新增 token、依赖或改动已完成组件。
- [x] 3.4 Radio / RadioGroup
  备注：基于 Kobalte，组统一提供尺寸、横纵布局、受控/非受控值、错误/禁用/只读与必选状态；Radio 支持独立尺寸、原生事件/ref/属性和 class 透传。65 项测试及 typecheck/lint/check:tokens/build 通过，真实浏览器验收 52 个示例、15 个单选组 Tab 停靠点、方向键循环/禁用跳过、互斥选择、单次回调、原生表单与三种受控方式重置、明暗主题和 390px 窄屏。圆形控件与中心点属于必要圆形例外，均有局部 token 豁免注释；未新增 token 或依赖。未传 name 时沿用 Kobalte 自动生成的隔离分组名，表单场景须显式命名。补齐 Kobalte 拒绝只读变更后遗漏的原生 checked 回写，状态、焦点和键盘导航仍由 Kobalte/原生控件负责；未修改已完成组件。
- [x] 3.5 Switch
  备注：基于 Kobalte，支持三种尺寸、开启/关闭、错误/禁用/只读状态、受控/非受控值、原生事件/ref/属性及 class 透传。71 项测试及 typecheck/lint/check:tokens/build 通过，真实浏览器验收 25 个示例、19 个可用输入框的 Tab/空格与可见焦点环、单次交互回调、原生表单/必填/三种受控方式重置、明暗主题和 390px 窄屏。轨道使用 rounded-md，圆形滑块为明确允许的例外，已有局部豁免注释；通过布局对齐直接切换位置，仅做 token 颜色过渡，无位移/缩放动画。保留原生事件，不为自定义轨道点击额外合成 input/change；未新增 token、依赖或修改已完成组件。
- [x] 3.6 Select
  备注：基于 Kobalte 的单选下拉，支持三尺寸、占位、禁用选项、错误/禁用、受控/非受控值与展开状态、按钮属性/class/ref 和原生 select 事件/ref 透传；选项使用唯一非空字符串键，null 表示受控空值。78 项测试及 typecheck/lint/check:tokens/build 通过，真实浏览器验收 16 个示例、禁用跳过、方向键/首字母定位、Esc/外部关闭、重复选择关闭且不重复回调、原生必填/提交/自动填充与四种表单重置、明暗主题和 390px 窄屏。补齐 Kobalte 隐藏原生控件的必填代理值、默认选项和禁用状态同步，不改键盘/焦点/ARIA 逻辑；使用库提供的宽度变量限制长选项，明暗选中项最低对比度 6.59:1。未新增 token、依赖或修改已完成组件；搜索输入与多选不在本项范围。
- [x] 3.7 FormField（label + 控件 + 帮助文字 + 错误文字，提供 `aria-describedby` 关联）
  备注：基于 Kobalte TextField 的公共标签/说明/错误组件，通过渲染插槽的响应式 getter 传递控件 ID、三种尺寸、错误/禁用/必填及 ARIA 关联，不克隆或修改已有控件。支持自动隔离 ID、额外说明去重、动态帮助/错误和分组标签；错误仅在 invalid 时显示，帮助保留，移除文字时同步移除引用。86 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验收 Input/Textarea/Select/Checkbox/RadioGroup 的命名、19 个 Tab 停靠点与焦点环、表单提交/重置、原生冒泡事件、动态 ID/尺寸/分组且控件身份与值保留、明暗主题和 390px 窄屏。标签/帮助/错误文字最低对比度 6.47:1；截图已查看。未新增 token、依赖或修改已完成组件。

---

## Phase 4：展示与反馈

- [x] 4.1 Badge
  备注：纯展示 span，提供 solid/outline/neutral 与三种尺寸，支持原生属性/ref/class 透传、数字零值和内容换行；不模拟按钮，也不引入 hover/active 或 Tab 停靠点。90 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验收全部 9 种组合、键盘计数、零值、明暗主题和 390px 长标签换行，最低对比度 6.70:1，截图已查看。仅使用现有 token，无阴影、额外依赖或已完成组件改动。
- [x] 4.2 Tag（可关闭）
  备注：提供 solid/outline/neutral 与三种尺寸，默认纯展示；closable 时类型要求 closeLabel 与 onClose，Kobalte 关闭按钮固定 type=button 和 24px 点击区域，由调用方负责移除。支持原生属性/ref/class、数字零值、长内容换行与动态禁用；禁用文字和按钮分别降低透明度，避免叠乘。95 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验收 27 个矩阵示例、15 个 Tab 停靠点、鼠标/Enter/空格单次请求、禁用跳过、受控删除/恢复、表单安全与原生事件冒泡、响应式 props 和控件身份保留、明暗 hover/active/focus 及 390px 窄屏。最低对比度 5.26:1，明暗与移动截图已查看；使用带背景间隔的 token 焦点环，未新增 token、依赖或修改已完成组件。
- [x] 4.3 Card
  备注：纯展示 section 容器，提供 outline/elevated 与三种尺寸，默认 outline；尺寸使用默认间距刻度，elevated 仅增加 shadow-sm。通过 children 组合语义化标题/header/footer/内部操作，支持原生属性/ref/事件/class、数字零值和长内容换行；区域名称由调用方的 aria-labelledby 或 aria-label 提供，不模拟按钮、不增加 Tab 停靠点。100 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验收全部 6 个组合、4 个内部按钮的键盘操作与焦点、动态尺寸/变体/内容、控件身份与计数保留、原生属性和事件、明暗主题和 390px 无间断长文本。最低文字对比度 7.73:1，截图已查看；未新增 token、依赖或修改已完成组件。
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
