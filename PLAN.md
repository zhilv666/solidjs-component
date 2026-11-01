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

- [x] **1.7 外观主题 Select**
  范围：在右上角明暗切换旁放置现有 Kobalte Select，选择默认 / 键帽 / 麻将；提供响应式 AppearanceProvider，为未显式指定 appearance 的已完成组件提供默认外观，并独立保存选择。显式外观对比与 Button 已确认实现保留，不处理未完成的 Tabs。
  参考：Button、Select、共享 appearance、theme/mode。
  验收：三种外观即时切换，控件身份与编辑值保留；刷新恢复选择，存储不可用时仍能切换；明暗独立、键盘与窄屏可用，原回归测试及全部检查通过。
  备注：顶部 Kobalte Select、响应式 AppearanceProvider 与独立存储已完成，20 个已完成组件继承默认外观，显式覆盖与原默认 class 保留；Button 实现/API/原断言及未完成 Tabs 未改。248 项完整测试（含 33 项新增主题测试）及 typecheck/完整 lint/check:tokens/生产构建通过；真实浏览器验收三外观即时切换、编辑值与节点身份、固定对比、方向键/End/Enter/Esc 焦点返回、明暗独立、刷新恢复、存储受限与 390px 下拉布局。明暗及窄屏三张截图已查看，重新加载后的控制台无错误或警告；不新增 token 或依赖。

- [x] **1.8 独立配色主题 Select**
  范围：按用户确认保留默认蓝，在 tokens.ts 追加樱花粉、清新绿、薰衣草紫、暖杏橙的明暗覆盖；右上角增加独立配色 Select，与外观和明暗分别保存。保留现有默认 token、Button 实现及未完成 Tabs。
  参考：tokens、generate、theme/mode、Select、Theme.demo；依赖 1.7。
  验收：五配色 × 明暗模式即时切换、刷新恢复和存储受限可用；键盘、窄屏、Portal 继承与编辑值/节点身份保留；文字/交互状态对比度和全部检查通过，不新增依赖。
  备注：用户确认的四套明暗配色覆盖、根属性与独立存储、右上角 Kobalte Select 及主题说明已完成；默认 token、语义反馈色、绿色麻将底座、Button 实现和原断言保留。新增 20 项配色回归，282 项完整测试及 typecheck/完整 lint/check:tokens/生产构建通过。真实浏览器验证 30 种配色/明暗/外观组合、编辑值与节点身份、Portal 颜色继承、方向键/Home/End/Enter/Esc 与焦点返回、五种配色刷新恢复和存储受限；390px 控件及弹层无横向溢出，截图已查看。新配色正文/交互状态均通过 AA，边框与焦点环通过 3:1；不新增依赖或处理未完成 Tabs。

---

## Phase 2：标准样例 🛑

- [x] **2.1 Button** 🛑
  variant：`solid` / `outline` / `ghost` / `danger`，另有经用户授权的 `mahjong` 实验变体；size：`sm` / `md` / `lg`；支持 `loading`、`disabled`、`as` 渲染为链接（可选）。
  验收：满足完成定义。
  备注：基于 Kobalte，保留 36 个旧矩阵组合，新增 18 个键帽/麻将并排对比组合及麻将计数、保存示例。原有四个变体、默认样式和键帽 token 已由回归测试锁定；仅新增用户授权的两个麻将阴影 token。30 项测试及 typecheck/check:tokens/build 通过；真实浏览器已验证鼠标、键盘、明暗主题三态与移动端布局。后续已仅修正 Button 测试的换行格式，完整 lint 复核通过，断言与组件实现未改。可选 as 链接未实现；按用户“继续下一个”的确认，Button 外观审核关卡已通过，现有实现与风格冻结。麻将仍是独立可选实验变体；本次完成时立体阴影例外仅限 Button，后续全组件外观授权见 4.4a。

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
- [x] 4.4 Alert（info / success / warning / danger）
  备注：基于 Kobalte Alert，提供四种状态与三种尺寸、可选 heading；原生 title/属性/事件/ref/class 与 ARIA 覆盖保持透传，可用 role=status 提供普通反馈语义。状态只使用现有语义色边框和不同装饰符号，正文 text-fg；支持空标题、数字零值、动态内容和长消息换行，无关闭交互或额外 Tab 停靠点。106 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验收全部 12 个组合、3 个操作按钮的 Tab/Enter/空格与焦点、单次消息更新且不抢焦点、动态尺寸/状态/标题/原生 role、组件身份保留、装饰符号从无障碍文本中隐藏、明暗主题和 390px 窄屏。正文最低对比度 14.27:1、符号最低 6.47:1，截图已查看；预览矩阵 aria-live=off，动态提示保留 alert 语义。未新增 token、依赖或修改已完成组件；未进行实际屏幕阅读器朗读测试。
- [x] 4.4a 共享键帽/麻将外观基础
  范围：记录用户的全组件外观授权，复用现有四个阴影 token，提供 ComponentAppearance 类型、展示/原生控件/隐藏输入控件的状态样式和可复用 demo 对比区。默认外观不变，Button 既有实现与测试冻结；不新增依赖。
  备注：共享外观类型、三类交互阴影映射和 3 外观 × 3 尺寸 demo 对比区已完成；113 项测试及 typecheck/lint/check:tokens/build 通过。为共享 .ts 文件添加精确 UnoCSS 扫描与单文件标记，生产 CSS 已确认包含 peer-active 按下规则；真实浏览器验收鼠标/Enter/空格单次激活、两种底座收短且无位移、隐藏输入框键盘按下、禁用扁平、明暗和 390px 窄屏，截图已查看。未新增 token、依赖或修改 Button 实现与断言。
- [x] 4.5 Spinner
  追加验收：用户已允许旋转动画和 animation.spinDuration=1000ms；支持减少动态效果。默认/键帽/麻将三种外观的外框保持静止，只有内部加载图形旋转。
  备注：纯展示加载指示器提供 primary/neutral、三尺寸与三外观，支持原生属性/ref/class、可读状态标签和装饰用 ARIA 覆盖；新增批准的动画 token 与 UnoCSS 映射。token 检查仅对 Spinner 的 token 旋转/减少动态效果停转开放精确规则，原违规断言保留并追加拒绝其他动画/硬编码时长的测试。120 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验证 18 个矩阵、内圈旋转/外框静止、减少动态效果停转、Enter/空格切换且不抢焦点、响应式外观/尺寸/标签/class 和节点身份保留、默认外观恢复、明暗及 390px 窄屏。图形最低对比度 6.42:1，截图已查看；无额外依赖、Tab 停靠点或 Button 改动，未测试实际屏幕阅读器播报。
- [x] 4.5a Input 键帽/麻将外观
  备注：新增默认保留的 appearance，立体阴影仅作用于原生输入框，禁用/只读使用 shadow-sm；前后缀、语义边框与焦点环保留。原测试断言未改，123 项测试及 typecheck/lint/check:tokens/build 通过；真实浏览器验收 36 个外观矩阵、27 个 Tab 停靠点、鼠标按下无位移、键盘输入、动态外观/尺寸/错误/禁用/只读/插槽、节点身份和原生表单/重置、默认 class 恢复、明暗及 390px 窄屏，最低正文对比度 16.97:1，截图已查看。主题生成文件的开发热更新曾读取到空缓存，重新生成后恢复；未改主题 token、其他组件或依赖。
- [x] 4.5b Textarea 键帽/麻将外观
  备注：追加三外观，默认 class、原生多行内容、尺寸/错误/焦点/调整大小与自动增高保留，禁用/只读不缩短底座。126 项测试及 typecheck/lint/check:tokens/生产构建通过，原断言未改；真实浏览器验收 36 个矩阵、27 个 Tab 停靠点、鼠标按下无位移、Enter 换行、动态外观/尺寸/自动增高选项/错误/禁用/只读、节点身份/值/表单重置与默认 class 恢复、明暗及 390px 窄屏，正文最低对比度 16.97:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5c Checkbox 键帽/麻将外观
  备注：立体阴影仅作用于可见方框，通过 peer-active 关联原生输入框的空格按下，保留选中/半选/错误/聚焦与禁用/只读状态，默认样式和原断言未改。129 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 63 个矩阵、45 个 Tab 停靠点、鼠标/空格底座收短且无位移、只读不可切换、单次状态回调与可信原生事件、动态外观/尺寸/错误/禁用/只读、控件身份/选中值/表单重置与默认 class 恢复、明暗及 390px 窄屏，标签最低对比度 14.27:1，截图已查看。Kobalte 在表单中既有的合成事件保持不变；未新增 token、依赖或修改其他组件。
- [x] 4.5d Radio / RadioGroup 键帽/麻将外观
  备注：组通过响应式上下文统一提供外观，Radio 支持单项覆盖；阴影仅作用于可见圆形控件，既有圆形豁免、选中/错误边框和原断言保留。133 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 45 组/135 项矩阵、36 个 Tab 停靠点、空格/鼠标按下无位移、方向键互斥/循环/禁用跳过、只读和禁用扁平、单项覆盖与组动态切换、单次状态回调、表单值/重置/默认 class 恢复与节点身份、明暗及 390px 窄屏，标签最低对比度 14.27:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5e Switch 键帽/麻将外观
  备注：立体底座仅加在轨道，通过 peer-active 关联空格按下，保留圆形滑块、直接左右切换、语义颜色和原断言；禁用/只读不收短底座。136 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 63 个矩阵、45 个 Tab 停靠点、鼠标/空格按下无位移、单次状态回调和可信原生事件、动态外观/尺寸/错误/禁用/只读、节点身份/表单值/重置与默认 class 恢复、明暗及 390px 窄屏，标签最低对比度 14.27:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5f Select 键帽/麻将外观（含弹层）
  备注：触发器与 Portal 弹层共同响应 appearance，默认弹层继续 shadow-md，新外观避免阴影类竞争；选项交互和原断言保留。139 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、27 个 Tab 停靠点、三尺寸弹层、方向键/禁用跳过/Esc 焦点返回、鼠标按下无位移、单次选择回调、展开时动态外观/尺寸/错误、触发器与弹层身份/表单值/重置和默认 class 恢复、明暗及 390px 弹层布局，选项正常/悬停/按下最低对比度 5.24:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5g FormField 键帽/麻将外观
  备注：新外观提供按尺寸分档的展示外框，保留默认无框布局、Kobalte group 语义与原断言；内部控件外观独立设置，不新增 Tab 停靠点或外框按下行为。142 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、27 个控件 Tab 停靠点、完整 label/description/error 关联、禁用外框扁平、动态外观/尺寸/错误/必填/帮助移除、控件与外框身份/值/表单重置和默认 class 恢复、明暗及 390px 窄屏，标签和说明最低对比度 6.47:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5h Badge 键帽/麻将外观
  备注：追加独立 appearance，三语义变体、三尺寸、默认 class 和原断言保留；纯展示底座不响应按下，不新增角色或 Tab 停靠点。145 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 27 个矩阵、零值/键盘计数、动态外观/变体/尺寸/内容/class/节点身份与默认恢复、明暗及 390px 窄屏，最低文字对比度 6.70:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5i Tag 键帽/麻将外观
  备注：保留默认 class、原断言和关闭按钮 API；立体外框只在直属关闭按钮原生 active 时收短，纯标签/文字点击不产生按钮效果，禁用使用 shadow-sm。148 项测试及 typecheck/lint/check:tokens/生产构建通过，补充显式 Node URL 导入后 Tag 的 8 项测试与完整 lint 再次通过；真实浏览器验收 81 个矩阵、27 个可用关闭按钮 Tab 停靠点、空格/Enter/鼠标单次关闭请求、仅关闭按钮按下且无位移、禁用跳过/无回调、动态外观/变体/尺寸/内容/关闭标签/按钮和外框身份与默认恢复、表单安全、明暗及 390px 窄屏，最低文字对比度 6.70:1，截图已查看。新增的局部 CSS 仅通过 :has 关联原生按下状态与既有阴影 token；未新增 token、依赖或修改其他组件。
- [x] 4.5j Card 键帽/麻将外观
  备注：追加三外观，默认 outline/elevated 与原断言不变；新底座替代 elevated 的旧 shadow-sm，避免优先级竞争。151 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 18 个矩阵、区域标签、无新增 Tab 停靠点或外框按下行为、4 个内部按钮的 Tab/焦点/计数、动态外观/变体/尺寸/外框和内部按钮身份与默认恢复、明暗及 390px 窄屏，最低文字对比度 7.73:1，截图已查看。未新增 token、依赖或修改其他组件。
- [x] 4.5k Alert 键帽/麻将外观
  备注：仅追加展示外框，四语义边框/装饰符号、原默认 class、原断言及 alert/status/aria-live 透传保留；不新增交互或 Tab 停靠点。154 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、3 个操作按钮 Tab/焦点/单次消息切换且不抢焦点、动态外观/状态/尺寸/标题/正文/ARIA 与节点身份/默认恢复、明暗及 390px 窄屏，文字与符号最低对比度 6.47:1，截图已查看。矩阵维持 aria-live=off；未进行实际屏幕阅读器朗读测试。未新增 token、依赖或修改其他组件。
  通用追加验收：appearance=default 保持原实现外观；keycap/mahjong 支持全部尺寸，保留禁用/只读/选中/错误/聚焦等原有状态。原测试保留并追加覆盖，检查通过后逐项更新；所有后续新组件首次实现时一并提供两种外观。
- [x] 4.6 Skeleton
  备注：静态装饰占位提供 line/block、三尺寸和三外观，默认 aria-hidden；宽度/class/原生属性/ref 可透传，不接受隐藏交互内容，加载与状态播报由调用方组合。158 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 18 个矩阵、无新增 Tab 停靠点或按下效果、Enter/空格切换加载与内容且焦点保留、动态形状/尺寸/外观/ARIA/节点身份和默认恢复、明暗及 390px 窄屏，演示文字最低对比度 7.73:1，截图已查看。已导出并注册；未新增动画 token、依赖或修改已完成组件。
- [x] 4.7 Avatar（圆形例外，需在备注中说明）
  备注：基于 Kobalte Image，提供 circle/square、三尺寸和三外观，支持图片加载/失败回退、状态回调、原生根属性/ref/class 与 imageProps；必填 alt 在图片与回退间保持稳定名称，空 alt 为装饰，内部图像与回退不重复命名。circle 使用有局部豁免注释的明确圆形例外，square 使用 rounded-md；纯展示底座无按下行为或额外 Tab 停靠点。164 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 54 个矩阵、18 个加载图片、失败/恢复的 Enter/空格操作和两按钮焦点、动态名称/形状/尺寸/外观/图片属性/节点身份与默认恢复、明暗及 390px 窄屏，最低文字对比度 7.73:1，截图已查看。已导出并注册；演示 SVG 颜色来自现有 token，未新增 token、依赖或修改已完成组件。未进行实际屏幕阅读器朗读测试。
- [x] 4.8 Divider
  备注：基于 Kobalte Separator，提供 solid/dashed、横/竖方向、三线宽与三外观，原生 hr 属性/ref/class 透传；竖向在 flex 行内拉伸，decorative 可隐藏纯装饰分隔。静态底座不响应按下、不新增 Tab 停靠点，不接受子内容。169 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、实际线宽与竖向高度、两按钮 Enter/空格和可见焦点、动态方向/线宽/样式/外观/装饰语义/节点身份与默认恢复、明暗及 390px 窄屏。分隔线最低对比度 4.83:1，演示文字最低 7.73:1，截图已查看；已导出并注册，未新增 token、依赖或修改已完成组件。

---

## Phase 5：浮层

> 全部基于 Kobalte，注意 Portal、焦点陷阱、Esc 关闭。

- [x] 5.1 Tooltip
  备注：基于 Kobalte 的 Root/Trigger/Portal/Content 组合，Root 提供三尺寸/三外观，触发器提供 outline/ghost，提示层同步底座且仅承载非交互说明。支持受控/非受控展开、Kobalte 定位/延迟/关闭选项和原生属性/ref/class/style；Root disabled 与原生控件禁用独立，按钮默认 type=button，类型只接受 Kobalte 支持的 button/submit/reset。175 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 54 个矩阵、39 个 Tab 停靠点、聚焦关联/悬停与安全区/移出关闭/Esc 焦点保留、鼠标按下无位移、Enter/空格单次激活、禁用切换、固定受控值/可阻止 Esc、展开时动态外观/尺寸/内容/style 与触发器/弹层身份、明暗及 390px 长说明布局。最低状态对比度 11.22:1，七张弹层截图已查看；移动验收等待滚动布局稳定后重新聚焦，保留 Kobalte 的滚动关闭行为。已导出并注册，未新增 token、依赖或修改已完成组件；未进行实际屏幕阅读器朗读测试。
- [x] 5.2 Popover
  备注：基于 Kobalte 的 Root/Trigger/Portal/Content/Title/Description/CloseButton 组合，三尺寸/三外观同步触发器、弹层与关闭控件，outline/ghost 按钮保留原生属性/ref/class，内容 style 支持对象与字符串并保留视口约束。默认非模态，modal 的焦点陷阱/外部隐藏/滚动锁定及标题/说明关联由 Kobalte 管理；关闭图标类型要求 aria-label，按钮默认 type=button。182 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、22 个关闭态 Tab 停靠点、自动聚焦输入/禁用关闭按钮跳过/Enter 与空格/Esc 焦点返回/外部点击焦点保留、鼠标按下无位移、受控昵称提交与重开保留、模态双向 Tab 循环和实际滚动锁定、固定受控展开/可阻止 Esc、展开时动态尺寸/外观/标题说明 ID/style 与弹层/输入/关闭控件身份和编辑值、明暗及 390px 长内容布局。最低说明对比度 7.73:1，七张弹层截图已查看；已导出并注册，未新增 token、依赖或修改已完成组件。未进行实际屏幕阅读器朗读测试。
- [x] 5.3 Dialog（含 `Dialog.Title` / `Dialog.Description`）
  备注：基于 Kobalte 的 Root/Trigger/Portal/Overlay/Content/Title/Description/CloseButton 组合，三尺寸/三外观同步触发器、面板和关闭按钮，outline/ghost 按钮保留原生属性/ref/class，内容和遮罩支持原生对象/字符串 style。默认模态；焦点陷阱、外部隐藏、滚动锁定、标题说明关联与关闭逻辑由 Kobalte 管理，非模态示例不显示遮罩。面板通过默认间距刻度居中并限制视口内宽高，长内容内部滚动，展示面板不产生按下效果；关闭图标要求 aria-label，按钮默认 type=button。189 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、22 个关闭态 Tab 停靠点、自动聚焦/双向 Tab 循环/禁用跳过/Enter 与空格/Esc 和遮罩关闭及焦点返回、实际滚动锁定和外部隐藏恢复、非模态外部点击焦点保留、受控昵称保存与重开保留、固定受控值/阻止 Esc/单次回调/原生表单安全、展开时动态外观/尺寸/标题说明 ID/style 与面板/输入/关闭/遮罩节点身份和编辑值、明暗与 390px 长文本内部滚动及键盘到达关闭按钮。最低说明对比度 7.73:1，七张截图已查看；已导出并注册，未新增 token、依赖或修改已完成组件。未进行实际屏幕阅读器朗读测试。
- [x] 5.4 DropdownMenu
  备注：基于 Kobalte 的 Root/Trigger/Portal/Content、普通/复选/单选项目、分组标签/项目说明/指示器/分隔及 Sub/SubTrigger/SubContent 组合；三尺寸/三外观同步触发器和两级浮层，菜单行沿用 Select 的轻量布局，普通项目提供 default/danger。原生属性/ref/class/style 透传，按钮默认 type=button，浮层使用可用视口变量限制宽高；普通项目选择关闭，复选/单选默认保持展开，半选为展示并在示例中组合 forceMount 的减号指示器。补齐当前 Kobalte 未透传的单选组禁用属性，状态与键盘/焦点/ARIA 仍由 Kobalte 管理。197 项测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、21 个关闭态 Tab 停靠点、Enter/空格/上下方向键打开、方向键/禁用跳过/Home/End/首字母定位、左右方向键进入/返回子菜单、Esc 焦点返回、模态外部隐藏与实际滚动锁定、非模态外部焦点保留、单次操作与受控复选/单选、动态外观/尺寸/style/组选中及禁用/半选、两级弹层和项目节点身份、原生表单安全与固定受控展开值。明暗常规/悬停/按下、说明与危险文本均通过 AA；390px 长菜单和子菜单无横向溢出，末项可通过键盘到达，八张截图已查看。子菜单验收等待根菜单自动聚焦和布局稳定后再进入；当前 Kobalte 的 Esc 回调忽略 preventDefault 并强制请求关闭，已在 API 注释说明，可通过受控 open 拒绝关闭请求。已导出并注册，未新增 token、依赖或修改已完成组件；未进行实际屏幕阅读器朗读测试。
- [x] 5.5 Toast（含全局调用方法）
  备注：基于 Kobalte 的 Region/List/Root/Title/Description/CloseButton 与 Portal 提供三外观、三尺寸、四语义状态；Toaster 提供一次挂载的视口内队列，toast(options)/toast.show(options) 返回数字 ID，toast.dismiss(id)/toast.clear() 分别关闭指定项或清空所有区域。支持命名区域、原生属性/ref/class/style、继承与单项覆盖的响应式外观、持续/优先级选项；关闭图标要求 aria-label，按钮默认 type=button，展示底座不随关闭按钮按下变化。207 项完整测试及 typecheck/lint/check:tokens/生产构建通过；真实浏览器验收 36 个矩阵、48 个初始 Tab 停靠点、Enter/空格单次显示和关闭/禁用跳过/Alt+T 与自定义快捷键/Esc 和可阻止 Esc、显示不抢焦点/可见聚焦环、关闭按钮底座收短无位移、默认队列上限与排队/指定关闭/清空、自动关闭/悬停和聚焦暂停恢复、动态外观/尺寸/优先级/内容/style/禁用/单项覆盖与节点身份及默认恢复、说明移除后的 ARIA 关联和原生表单安全。明暗常规/悬停/按下最低对比度 6.47:1；390px 长消息限制在视口内滚动，末段可见且键盘可返回关闭按钮，八张截图已查看。已导出并注册；未新增 token、依赖或修改已完成组件。对比度脚本的 Canvas 性能提示不属于产品警告，重新加载后的产品控制台无警告或错误；未进行实际屏幕阅读器朗读测试。

---

## Phase 6：导航与数据

- [x] 6.0 Layout / Header / Sidebar / Content / Footer
  范围：按用户确认新增可组合语义布局，提供三尺寸、三外观；Sidebar 支持桌面折叠和基于 Kobalte Dialog 的窄屏抽屉，并接入 Demo 外壳。纯布局区域不模拟按钮或增加 Tab 停靠点。
  参考：Button、Card、Dialog、AppearanceProvider；依赖 1.7。
  验收：完整组合演示、折叠与抽屉受控/非受控行为、键盘焦点与 Esc、响应式窄屏、明暗可读、原生属性/class 透传和节点身份通过；不新增 token 或依赖，全部检查通过。
  备注：语义布局、三外观/三尺寸/plain 与 outline 组合及 Demo 外壳已完成；Sidebar 的桌面折叠与移动展开状态独立，分别由 Kobalte Collapsible 和 Dialog 管理，导航节点在折叠、关闭与断点切换间保留。新增 14 项布局回归，262 项完整测试及 typecheck/完整 lint/check:tokens/生产构建通过；真实浏览器验收受控与非受控开关、单次回调、双向 Tab 循环与禁用跳过、Esc/遮罩/关闭按钮及导航关闭、焦点返回、长目录滚动、断点切换关闭模态并解锁滚动、节点身份与编辑值、两种按下底座无位移和静态布局外框。三外观/三尺寸及 18 个固定矩阵已检查，1280px、768px、390px 无横向溢出；工作区演示在 lg 以下纵向排列避免挤压内容。明暗文字通过 AA，明暗及窄屏截图已查看；未新增 token 或依赖，未修改 Button 或未完成 Tabs，未测试实际屏幕阅读器播报。

- [x] 6.0a Sidebar 折叠导航图标
  范围：折叠时保留图标导航，展开时显示图标与文字；接入组件目录与布局演示，保留现有受控/非受控开关、Kobalte 抽屉及导航节点。
  参考：Sidebar、Button、Layout.demo；依赖 6.0。
  验收：三尺寸/三外观的折叠图标可见、可命名、可键盘操作；选中与禁用状态、长目录滚动、移动抽屉和断点切换正常，原测试及全部检查通过。
  备注：新增基于 Kobalte Button 的 Sidebar.Item、必填 label/icon 与独立 navigation 插槽；普通详情保留原 Collapsible 隐藏行为，图标/文字节点不重建。组件目录、工作区与 18 个矩阵接入继承 token 颜色的 SVG 图标。7 项新增回归及 49 项布局/外观相关测试、typecheck/完整 lint/check:tokens/生产构建通过；真实浏览器验证 24 项折叠目录、三尺寸/三外观、Tab/Enter/空格、禁用跳过、选中状态、清晰焦点环、导航/输入节点与值保留、麻将按下底座无位移、移动完整标签与双向 Tab 循环、导航选择/Esc 关闭及焦点返回、断点回桌面解锁滚动。1280px 与 390px 无横向溢出，截图已查看；原断言及 Button/Tabs 实现保留，不新增 token 或依赖。

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

- [5.4] 当前 Kobalte 0.13.14 的 MenuContentBase 在 onEscapeKeyDown 回调后无条件执行 context.close(true)，直接 preventDefault 不能取消关闭；受控 open 可以拒绝关闭请求。本轮保留库的键盘逻辑并说明限制，依赖升级或行为适配交给全库审计决定。

- [2.1] 浏览器连接已恢复；SSR 测试使用独立临时缓存，开发服务运行测试后缓存不变、预览正常。新增阴影 token 后已重启开发服务，使 UnoCSS 重新加载主题映射。
- [2.1] 用户已确认键帽方向及 `shadow.keycap` / `shadow.keycapPressed` 两个 token；Button 的阴影例外仅限本组件。预览中底座阴影从 3px 收短到 1px，disabled / loading 使用 `shadow-sm`，未新增依赖或修改其他组件。
- [2.1] 用户已授权新增 `shadow.mahjong` / `shadow.mahjongPressed` 两个 token 及独立 `variant="mahjong"` 实验；瓷质牌面跟随现有背景 token，绿色厚底跟随 `success`，按下厚底从 6px 收短到 2px。保留旧版的 3px → 1px 键帽效果，不新增颜色、依赖、位移或渐变。
- [2.1] 真实浏览器键盘验收覆盖 54 个展示组合、28 个 Tab 停靠点（跳过 36 个禁用/加载按钮）、Enter / Space 单次激活、两种样式共享的动态禁用与 loading；明暗主题 hover / active 和实际焦点环通过，麻将文字最低对比度为 11.2:1，键帽为 5.26:1。1280×900 与 390×844 无横向溢出或按钮裁切；浅色、深色、移动端截图已查看并保存在 `.playwright-mcp/`（不提交）。用户已确认继续后续组件，Button 现有版本作为标准样例冻结。
- [3.1] 前后缀为非交互旁置插槽，以 aria-hidden 避免污染控件名称；单位与含义由使用方的 label/帮助文字说明，FormField 留待 3.7。保留原生 onInput/onChange，新增 onValueChange 对接受控值；适配 Solid 与 Kobalte 的输入事件类型，并同步原生 defaultValue，确保非受控、受控和固定值字段的原生 reset 行为一致。
- [3.1] 新增 12 项 SSR/UnoCSS 回归测试，测试服务器使用独立临时缓存并关闭 HMR/WebSocket，不影响预览。真实浏览器验证 22 个 Tab 停靠点（含 14 个可用输入框，跳过 3 个禁用字段）、readonly 选择且不可编辑、动态值/尺寸/插槽/class/name/状态、原生 ref 与绑定事件、Enter 提交及必填校验。明暗模式正文对比度为 16.97:1，占位文字最低为 7.41:1；1280×900 和 390×844 无横向溢出、输入框或插槽裁切。明暗及窄屏截图已查看并保存在 `.playwright-mcp/`（不提交）。Input 验收已完成，后续按计划推进。
- [3.1] pnpm lint 的过滤输出曾误报通过；完整复核定位到 Button 测试链式调用未换行。按用户继续整个 PLAN 的指示，仅修正该处测试格式并单独提交，未改变组件、样式或断言；`rtk proxy pnpm lint` 现已通过。后续对链式检查命令继续复核完整输出，避免误报完成。
