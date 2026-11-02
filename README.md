# SolidJS Component Library

基于 SolidJS、TypeScript strict、Vite、UnoCSS、Kobalte 和 clsx 的自用组件库。视觉配置集中在主题 token 中，复杂交互、键盘导航和焦点管理由 Kobalte 提供。

当前仓库是 `private` 的 Vite 演示应用，可在仓库内直接引用组件源码；尚未发布 npm 包，也没有 Vite library mode、独立 ESM 组件制品或类型声明包。

## 运行与检查

环境要求见 [package.json](package.json)：

- Node.js `>=22.18.0`。
- pnpm `12.15.0`，与 `packageManager` 保持一致。

在仓库根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

访问终端打印的地址，默认通常为 `http://localhost:5173`。端口被占用时，以 Vite 的实际输出为准。

| 命令                | 用途                                                |
| ------------------- | --------------------------------------------------- |
| `pnpm typecheck`    | strict 类型检查，不输出文件                         |
| `pnpm lint`         | ESLint 零警告检查及 Prettier 格式检查               |
| `pnpm check:tokens` | 检查组件中的硬编码视觉值、任意值及未授权样式        |
| `pnpm test`         | Node 内置测试，包括组件 SSR、主题生成与 UnoCSS 回归 |
| `pnpm theme:build`  | 从 token 重新生成主题 CSS                           |
| `pnpm build`        | 生成主题、检查类型并构建演示应用到 `dist/`          |
| `pnpm preview`      | 本地预览已构建的演示应用                            |
| `pnpm format`       | 格式化仓库文件                                      |

`dev` 和 `build` 会先生成主题；`build` 不代替 lint、token 检查或测试。组件测试使用独立临时 Vite 缓存，不占用演示服务的缓存。

## 源码与已实现组件

入口 [src/main.tsx](src/main.tsx) 已加载主题、基础样式及 `virtual:uno.css`。组件及其 Props 类型从 [src/components/index.ts](src/components/index.ts) 导出，`@/` 指向 `src/`。

- 基础与表单：Button、Input、Textarea、Checkbox、Radio、RadioGroup、Switch、Select、FormField。
- 展示与反馈：Badge、Tag、Card、Alert、Spinner、Skeleton、Avatar、Divider。
- 浮层与通知：Tooltip、Popover、Dialog、DropdownMenu、Toast、Toaster，以及全局 `toast` 方法。
- 导航与数据：Tabs、Breadcrumb、List、Pagination、Table。
- 布局：Layout、Header、Sidebar、Content、Footer。
- 主题工具：AppearanceProvider、useAppearance、getAppearanceClasses。

各组件目录中的 `Xxx.demo.tsx` 覆盖变体、尺寸、状态及外观；演示在 [registry.ts](src/demo/registry.ts) 注册。复杂浮层采用组合 API，例如 `Dialog.Trigger / Portal / Overlay / Content / Title / Description / CloseButton`，完整用法见对应 demo 与导出的 Props。

下方示例用于本仓库的 `.tsx` 文件，不是已发布包的安装示例。移植到其他项目时，还需带上主题生成、UnoCSS 配置、基础样式及组件 CSS。

## 主题与外观

右上角的三个控制维度相互独立：

| 维度 | 可选值                                                                                  | 偏好存储键                     |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------ |
| 配色 | `default` 默认蓝、`sakura` 樱花粉、`mint` 清新绿、`lavender` 薰衣草紫、`apricot` 暖杏橙 | `solidjs-component-palette`    |
| 明暗 | `light`、`dark`                                                                         | `solidjs-component-theme`      |
| 外观 | `default`、`keycap`、`mahjong`、`pixel`                                                 | `solidjs-component-appearance` |

没有有效明暗偏好时，启动时读取系统偏好。配色和外观默认均为 `default`；存储不可用时仍可实时切换，但不会保存偏好。

未指定 `appearance` 的组件继承 AppearanceProvider；显式指定的外观始终优先。外观由响应式 Provider 驱动，不是仅修改根元素的 `data-appearance` 就能替代。尺寸使用 `sm / md / lg`，通常默认 `md`；语义 `variant` 与外观独立。

```tsx
import {
  AppearanceProvider,
  Button,
  Card,
  FormField,
  Input,
} from "@/components";

export function FormExample() {
  return (
    <AppearanceProvider appearance="pixel">
      <Card class="space-y-4">
        <FormField
          appearance="default"
          label="名称"
          description="切换外观不会清空当前输入。"
        >
          {(control) => (
            <Input {...control} name="name" defaultValue="SolidJS" />
          )}
        </FormField>
        <Button variant="mahjong">保存</Button>
      </Card>
      <Card appearance="keycap">固定键帽外观，不随 Provider 改变。</Card>
    </AppearanceProvider>
  );
}
```

FormField 通过响应式插槽属性关联标签、帮助和错误文字，不克隆控件。分组控件使用 `group`；控件自身的状态仍须按其 Props 配置。

Button 是冻结的标准样例，不接收 `appearance`：`solid / outline / danger` 保留键帽底座，`ghost` 保持轻量，`mahjong` 是独立实验变体。全局像素外观不会重写 Button 的圆角或阴影，但其颜色仍跟随配色与明暗。

### 修改主题配置

修改 [src/theme/tokens.ts](src/theme/tokens.ts)，不直接编辑生成文件 [theme.css](src/theme/theme.css)：

1. 默认配色修改 `color` 与 `darkColor`；主色相关项包括 `primary`、`primaryFg` 和独立的 `ring`。其他配色在 `palettes.<name>.color / darkColor` 中覆盖，默认主色变化不会覆盖这些独立配置。
2. `primaryHover / primaryActive` 等状态色由 [generate.ts](src/theme/generate.ts) 从 CSS 变量派生。调整后同时检查文字、焦点环与边框的对比度。
3. 常规圆角使用 `radius.sm / md / lg` 的 2 / 4 / 6px 小圆角档位；字体配置在 `font.family / size / weight`，正文至少 14px，字重只用 400 / 500。
4. 像素外观使用 `radius.pixel` 的直角及 `shadow.pixel / pixelPressed`。两层无模糊阴影分别跟随 `border` 和 `primary`，按下时从 2/4px 收短至 1/2px，不做位移或缩放。

运行 `pnpm theme:build` 更新 CSS；新增 token 名称或修改 UnoCSS 映射后，重启开发服务。新增 token、依赖或扩大设计例外需遵守 [AGENTS.md](AGENTS.md)。

直角仅作用于像素标记表面，包括 Avatar 的外框；其他外观的圆形 Avatar 与内部必要圆形图形保留原样。禁用/只读控件不产生按下阴影，纯展示底座保持静止；Tag 只在直属关闭按钮按下时收短。Spinner 仅旋转内部图形，并在减少动态效果偏好下停止。

## Breadcrumb：路径导航

`Breadcrumb` 基于 Kobalte Breadcrumbs，使用 `List / Item / Link / Separator` 组合。`variant` 为 `plain / outline`，默认 `plain`；提供三尺寸与四外观，当前页和禁用链接不参与 Tab 导航。

```tsx
import { Breadcrumb } from "@/components";

export function BreadcrumbExample() {
  return (
    <Breadcrumb aria-label="文档路径" separator="›">
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/">首页</Breadcrumb.Link>
          <Breadcrumb.Separator />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Link current>文档</Breadcrumb.Link>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb>
  );
}
```

原生 `href / target / rel / onClick` 属性保留，可在点击回调中对接应用路由；不内置路由依赖。`current` 由调用方设置，并由 Kobalte 提供 `aria-current="page"` 与移除链接目的地。分隔符默认隐藏于无障碍树，长路径可换行。

## List：展示与选择

[ListProps](src/components/List/List.tsx) 使用稳定、唯一、非空的字符串 `ListItem.value`；`label` 是字符串，`description / icon` 可传 JSX。

```tsx
import { createSignal } from "solid-js";
import { List, type ListItem } from "@/components";

const items: readonly ListItem[] = [
  { value: "design", label: "Design", description: "设计配置" },
  { value: "locked", label: "Locked", description: "暂不可选", disabled: true },
  { value: "docs", label: "Docs", description: "项目文档" },
];

export function ListExample() {
  const [value, setValue] = createSignal<readonly string[]>(["design"]);
  return (
    <List
      items={items}
      selectionMode="multiple"
      value={value()}
      onValueChange={setValue}
      appearance="pixel"
      aria-label="项目列表"
    />
  );
}
```

- 默认 `selectionMode="none"` 是语义展示列表；`single / multiple` 使用 Kobalte Listbox。变体为 `outline / plain`。
- 单选的值也使用数组；`value={[]}` 是受控空选择。不传 `value`，使用 `defaultValue` 可初始化非受控选择；`defaultValue` 不是后续更新入口。
- 方向键、Home/End、首字母定位跳过禁用项。单选方向键同步选择，首字母只移动焦点；多选用空格/Enter 切换，Ctrl+A 选择可用项。
- `renderAction(item)` 只用于展示模式；选择项内不要放按钮、链接或输入框等交互内容。展示操作按钮的禁用状态由调用方设置。
- List 不生成原生表单字段；需要提交选中键时，由调用方组织表单数据。

## Table：选择、排序与本地分页

[TableProps / TableColumn](src/components/Table/Table.tsx) 要求 `data`、`columns` 与 `getRowKey`。行 key、列 key 必须稳定、唯一、非空；列 `header` 为字符串，`cell(row)` 渲染单元格，提供 `sortValue(row)` 才启用该列排序。

```tsx
import { createSignal } from "solid-js";
import { Table, type TableColumn, type TableSortState } from "@/components";

interface Row {
  id: string;
  name: string;
  score: number;
  disabled?: boolean;
}

const data: readonly Row[] = [
  { id: "design", name: "Design", score: 24 },
  { id: "locked", name: "Locked", score: 15, disabled: true },
  { id: "docs", name: "Docs", score: 10 },
];
const columns: readonly TableColumn<Row>[] = [
  {
    key: "name",
    header: "名称",
    cell: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    key: "score",
    header: "评分",
    cell: (row) => row.score,
    sortValue: (row) => row.score,
    align: "end",
  },
];

export function TableExample() {
  const [value, setValue] = createSignal<readonly string[]>([]);
  const [sort, setSort] = createSignal<TableSortState | null>(null);
  const [page, setPage] = createSignal(1);
  return (
    <Table
      data={data}
      columns={columns}
      getRowKey={(row) => row.id}
      getRowLabel={(row) => row.name}
      getRowDisabled={(row) => row.disabled ?? false}
      caption="项目评分"
      selectable
      striped
      paginate
      pageSize={2}
      value={value()}
      onValueChange={setValue}
      sort={sort()}
      onSortChange={setSort}
      page={page()}
      onPageChange={setPage}
      appearance="pixel"
    />
  );
}
```

三个状态可以分别受控或非受控：

| 状态 | 受控值                  | 非受控初值     | 请求回调        |
| ---- | ----------------------- | -------------- | --------------- |
| 选择 | `value`，空选择为 `[]`  | `defaultValue` | `onValueChange` |
| 排序 | `sort`，无排序为 `null` | `defaultSort`  | `onSortChange`  |
| 页码 | `page`，从 1 开始       | `defaultPage`  | `onPageChange`  |

不传对应受控值时使用内部状态。受控回调是变更请求；调用方不更新值即可拒绝请求。排序状态为 `{ column, direction: "asc" | "desc" }`，其中 `column` 对应列 key。

- 默认 `selectable / striped / paginate` 均为 `false`，`pageSize=10`；页大小必须是正的安全整数。变体为 `outline / plain`，列对齐为 `start / center / end`。
- 全选只处理当前页可选行，保留其他页和已选禁用行；跨页保留选中键。缺失行的 key 不显示，下一次选择请求会清理缺失 key。
- 排序按升序、降序、取消循环，先稳定排序全数据再分页，不自动回第一页。`sortValue` 支持字符串、数字、布尔值、Date、null、undefined；null/undefined、非有限数值和无效日期在两个方向都排在最后。
- 数据缩减只约束显示页码，不自动改写调用方页码。复用的 [Pagination](src/components/Pagination/Pagination.tsx) 支持前后页、省略号、受控/非受控和禁用；`count=0` 显示禁用占位页。
- `class` 传给原生 table，`containerClass` 传给外框；`caption / emptyContent` 提供标题与空态。实际横向溢出时，滚动区域才加入 Tab 顺序，可用原生左右方向键滚动。
- 当前页内相同 key 的行重排保留行节点；离开分页会卸载单元格。编辑值应存于调用方状态，不能依赖跨页保留输入节点。第一版不包含远程数据、虚拟滚动或服务器分页。

## Layout 与侧栏

整页布局示例：

```tsx
import { Layout, Header, Sidebar, Content, Footer } from "@/components";

export function WorkspaceExample() {
  return (
    <Layout class="h-screen" appearance="pixel">
      <Sidebar>
        <Header
          variant="plain"
          class="border-0 border-b-2 border-solid border-border"
        >
          <Sidebar.Trigger aria-label="打开工作区导航">目录</Sidebar.Trigger>
        </Header>
        <div class="flex min-h-0 flex-1 gap-4 p-4">
          <Sidebar.Panel
            heading="工作区导航"
            navigation={
              <nav aria-label="工作区页面">
                <Sidebar.Item
                  label="概览"
                  icon={<span aria-hidden="true">⌂</span>}
                  active
                />
              </nav>
            }
          />
          <Content class="overflow-y-auto">工作区内容</Content>
        </div>
        <Footer
          variant="plain"
          class="border-0 border-t-2 border-solid border-border"
        >
          项目状态
        </Footer>
      </Sidebar>
    </Layout>
  );
}
```

Layout 提供尺寸与外观继承，Header/Footer 使用语义标签。Content 默认为 `main`，嵌入已有 main 时设置 `as="section"` 或 `as="div"`。侧栏的样式上下文由其父级取得；需要同步外观时，将 Sidebar 放在 Layout 或 AppearanceProvider 内，或显式配置 Sidebar 的 `appearance`。

Sidebar 默认 `mode="responsive"`：768px 起为桌面侧栏，小屏为 Kobalte Dialog 抽屉；也支持显式 `desktop / mobile`。桌面 `collapsed / defaultCollapsed / onCollapsedChange` 与移动 `open / defaultOpen / onOpenChange` 相互独立。

`navigation` 插槽在折叠时保留图标导航，普通 `children` 随折叠隐藏；Sidebar.Item 要求 `label` 和 `icon`，支持 `active / disabled`。Root 的 `disabled` 禁用开关，不自动禁用导航项。详细组合与键盘用法见 [Layout.demo.tsx](src/components/Layout/Layout.demo.tsx)。

## Tabs 与通知

Tabs 使用 `Tabs.List / Trigger / Content`；Root 支持 `value / defaultValue / onValueChange`、`orientation` 和 `activationMode`。默认横向、自动激活；手动模式用方向键定位，再用 Enter/空格选择。`Tabs.Content forceMount` 保留非活动面板节点并隐藏，示例见 [Tabs.demo.tsx](src/components/Tabs/Tabs.demo.tsx)。

全局通知需要在应用中每个区域挂载一次 Toaster：

```tsx
import { Button, Toaster, toast } from "@/components";

export function NotificationExample() {
  return (
    <>
      <Toaster appearance="pixel" />
      <Button
        onClick={() =>
          toast({
            heading: "保存成功",
            description: "这是一条本地演示通知。",
            variant: "success",
          })
        }
      >
        显示通知
      </Button>
    </>
  );
}
```

`toast(options)` 与 `toast.show(options)` 返回数字 ID，`toast.dismiss(id)` 关闭指定项，`toast.clear()` 清空所有区域。命名区域的 Toaster `regionId` 与调用参数 `region` 必须匹配。Tag 的 `closable` 则要求 `closeLabel` 与 `onClose`，由调用方实际移除标签。

## 已知边界与后续任务

- 当前锁定的 Kobalte 0.13.14 中，Tabs 的 Enter/空格可能因 keydown 与原生 click 请求同值两次；相关选择行为保留，回调中的业务副作用应自行避免重复。
- DropdownMenu.Content 的 `onEscapeKeyDown` 中直接 `preventDefault()` 不能阻止该版本请求关闭；可以使用受控 `open` 拒绝关闭请求。封装未替换库的键盘或焦点逻辑。
- Select 当前是单选，不提供搜索或多选；List/Table 不提供远程数据与虚拟滚动。
- 已进行类型、lint、token、回归、浏览器键盘、对比度与窄屏检查；尚未进行实际屏幕阅读器朗读验收，不宣称完整无障碍认证。
- 全库一致性审计与 library mode 打包仍未完成，见 [PLAN.md](PLAN.md)。组件开发完成不等于整个计划完成。

开发前阅读 [AGENTS.md](AGENTS.md) 与 PLAN，按一次一个任务执行。新组件以 Button 为样例，使用 `mergeProps / splitProps`、`class` 和 token 样式，不解构 props、不新增未授权依赖，不删除或弱化现有检查。
