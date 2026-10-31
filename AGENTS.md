# AGENTS.md

本文件是 agent 在本仓库工作的最高优先级规则。开始任何任务前，必须先读完本文件和 `plan.md`。

## 1. 项目简介

一个基于 SolidJS 的自用组件库。目标：视觉一致、可维护、只改一个配置文件就能换主题。

技术栈（未经许可不得增减）：

- SolidJS + TypeScript（strict）
- Vite
- UnoCSS（主题映射到 CSS 变量）
- Kobalte（`@kobalte/core`）：负责交互逻辑与无障碍，我们只写样式层
- clsx：合并 class
- 包管理：pnpm

## 2. 设计风格（不可更改）

- **小圆角**：只使用 `rounded-sm`（2px）、`rounded-md`（4px）、`rounded-lg`（6px）。默认 `rounded-md`。禁止 `rounded-xl` 及以上，禁止 `rounded-full`（Avatar、Switch 滑块等确需圆形的例外，须在 PR 说明中标注）。
- **字体清晰**：正文使用 `text-fg`（深色），次要文字使用 `text-fg-muted`，禁止用更浅的灰色。正文不小于 14px，字重只用 400 / 500，禁止 300 及以下。
- **风格克制**：扁平为主，边框清晰，阴影只用 token 中的 `shadow-sm` / `shadow-md`，不做渐变、不做大面积模糊。Button 经用户确认的键帽样式是例外，可使用 `shadow-keycap` / `shadow-keycap-pressed`；经用户授权的 `mahjong` 实验变体另可使用 `shadow-mahjong` / `shadow-mahjong-pressed`，仅用于该变体。其他组件不沿用上述例外。

## 3. 硬性规则（违反即视为任务失败）

1. **禁止硬编码视觉值**：颜色（`#fff`、`rgb()`、`red-500` 等）、圆角、字号、字重、阴影、动画时长，一律只能通过 token 对应的类名或 CSS 变量使用。
2. **禁止 UnoCSS 任意值**：不得出现 `w-[13px]`、`text-[#333]`、`rounded-[5px]` 这类写法。间距使用默认刻度（`p-2`、`gap-3` 等）。
3. **不得擅自修改** `src/theme/tokens.ts`。如果现有 token 不够用，**停下来向我提问**，说明缺什么、建议加什么，不要自己造。
4. **不得擅自新增依赖**。需要新依赖时先问。
5. **不得修改范围外的文件**。任务只涉及某个组件时，不要顺手重构其他组件。
6. **不得删除或弱化现有测试、lint 规则、token 检查**来让任务通过。

## 4. SolidJS 编码规范

Solid 不是 React，以下习惯必须避免：

- **不要解构 props**（会丢失响应性）。使用 `splitProps` / `mergeProps`。
- 使用 `class`，不是 `className`。
- 条件渲染用 `<Show>`，列表用 `<For>`，多分支用 `<Switch>/<Match>`；不要用 `&&` 三元去包裹复杂 JSX。
- 没有 `useEffect` / `useState`。使用 `createSignal`、`createMemo`、`createEffect`、`onCleanup`。
- 信号是函数，读取要调用：`count()`。
- 组件函数体只执行一次，不要在函数体顶层读取信号做一次性计算，需要派生值请用 `createMemo` 或直接在 JSX / 函数里读取。
- 不使用 `any`。类型不明确时用泛型或 `unknown` 收窄。

## 5. 组件约定

### 5.1 文件结构

```
src/components/Button/
  Button.tsx        组件实现
  Button.demo.tsx   演示用例（覆盖所有 variant / size / 状态）
  index.ts          只做导出
```

新增组件后，必须在 `src/components/index.ts` 中导出，并在 demo 页面注册。

### 5.2 Props 约定

- 组件 props 类型命名为 `XxxProps`，并导出。
- 需要继承原生属性的，继承对应的 `JSX.XxxHTMLAttributes<HTMLXxxElement>`，并透传剩余 props。
- 统一命名：
  - `variant`：视觉变体，如 `"solid" | "outline" | "ghost"`
  - `size`：`"sm" | "md" | "lg"`，默认 `"md"`
  - `disabled`、`loading`、`class`、`children`
- 所有可选 props 必须有明确默认值（用 `mergeProps` 设置）。
- 支持外部传入 `class`，并与内部 class 通过 `clsx` 合并，外部 class 排在最后。

### 5.3 样式约定

- variant / size 用普通对象映射成 class 字符串，不引入额外变体库。
- 每个可交互组件必须覆盖这些状态：`hover`、`active`、`focus-visible`、`disabled`。
- 聚焦样式统一使用 `focus-visible:ring-2 focus-visible:ring-ring`，不得移除 outline 而不提供替代。
- 禁用状态统一：`disabled:opacity-50 disabled:cursor-not-allowed`。
- 动画过渡只用 `transition-colors` / `transition-shadow` 加 token 时长，不做位移、缩放动画。

### 5.4 交互与无障碍

- Select、Dialog、Popover、Tooltip、Tabs、DropdownMenu、Checkbox、Radio、Switch 等有复杂交互的组件，**必须基于 Kobalte 封装**，不要手写焦点管理、键盘导航、ARIA。
- 纯展示组件（Badge、Card、Spinner 等）直接写即可，但要使用语义化标签。
- 图标按钮必须要求传入 `aria-label`（在类型层面强制或在 demo 中体现）。

### 5.5 参考样例

`src/components/Button` 是**标准样例**，代码风格、props 设计、class 组织方式以它为准。写新组件前先完整阅读它，保持一致，不要自创另一种写法。

最小骨架（仅示意结构，具体以 Button 为准）：

```tsx
import { splitProps, mergeProps, type JSX } from "solid-js";
import clsx from "clsx";

export interface XxxProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants = { solid: "...", outline: "..." } as const;
const sizes = { sm: "...", md: "...", lg: "..." } as const;

export function Xxx(props: XxxProps) {
  const merged = mergeProps({ variant: "solid", size: "md" } as const, props);
  const [local, rest] = splitProps(merged, ["variant", "size", "class", "children"]);

  return (
    <div class={clsx("base...", variants[local.variant], sizes[local.size], local.class)} {...rest}>
      {local.children}
    </div>
  );
}
```

## 6. 工作流程

1. 阅读 `plan.md`，找到第一个未完成且依赖已满足的任务。**一次只做一个任务**。
2. 阅读该任务指定的"参考"文件和 `tokens.ts`。
3. 实现，并写好 `.demo.tsx`。
4. 运行检查，全部通过才算完成：
   ```
   pnpm typecheck
   pnpm lint
   pnpm check:tokens
   ```
5. 在 `plan.md` 中把该任务的 `[ ]` 改为 `[x]`，并在任务下方补一行"备注"（如有偏离、遗留问题、需要我决定的事项）。
6. 汇报：改了哪些文件、有哪些假设、有什么需要我确认。

遇到以下情况**立即停止并提问**，不要自行决定：

- token 不够用
- 需求有歧义，或有两种合理的实现方式
- 需要新依赖
- 需要修改标准样例或已完成的组件

## 7. 完成定义（Definition of Done）

一个组件被视为完成，必须同时满足：

- [ ] 类型检查、lint、`check:tokens` 全部通过
- [ ] 无任何硬编码颜色 / 圆角 / 字号 / 字重 / 阴影
- [ ] 覆盖 hover / active / focus-visible / disabled 状态
- [ ] 所有 variant 与 size 在 demo 中可见
- [ ] 支持 `class` 透传，props 未被解构
- [ ] 键盘可操作，焦点样式清晰可见
- [ ] 暗色模式下可读（对比度足够）
- [ ] 已在 `components/index.ts` 导出，`plan.md` 已更新

## 8. 沟通风格

- 汇报简洁，列出事实，不要夸大完成度。
- 做不到或不确定的部分明确说明，不要用"应该可以"含糊带过。
- 默认用中文回复；代码、变量名、注释使用英文。
