import { createSignal, For } from "solid-js";
import clsx from "clsx";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Input } from "../Input";
import { Select } from "../Select";
import { getAppearanceClasses } from "../appearance";
import { AppearancePreview } from "@/demo/AppearancePreview";
import { useAppearance } from "@/theme/appearance";
import {
  Layout,
  Header,
  Sidebar,
  Content,
  Footer,
  type LayoutSize,
} from "./index";

const variants = ["plain", "outline"] as const;
const sizeOptions = [
  { value: "sm", label: "sm · 紧凑" },
  { value: "md", label: "md · 默认" },
  { value: "lg", label: "lg · 宽松" },
] as const;
const navigation = [
  { id: "overview", label: "概览", disabled: false },
  { id: "team", label: "团队", disabled: false },
  { id: "files", label: "文件", disabled: false },
  { id: "billing", label: "账单（禁用）", disabled: true },
] as const;
const navigationBase =
  "inline-flex min-h-10 w-full min-w-0 items-center justify-start rounded-md border border-solid px-3 py-2 text-md font-normal text-left cursor-pointer transition-colors duration-token enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

export function LayoutDemo() {
  const appearance = useAppearance();
  const [size, setSize] = createSignal<LayoutSize>("md");
  const [collapsed, setCollapsed] = createSignal(false);
  const [open, setOpen] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [page, setPage] = createSignal("overview");
  const [draft, setDraft] = createSignal("我的工作区");
  const [saves, setSaves] = createSignal(0);
  const [collapseChanges, setCollapseChanges] = createSignal(0);
  const [openChanges, setOpenChanges] = createSignal(0);
  const [footerClicks, setFooterClicks] = createSignal(0);
  const pageName = () => navigation.find((entry) => entry.id === page())?.label;

  return (
    <div class="space-y-8">
      <section class="space-y-4" aria-labelledby="layout-working-heading">
        <h3 id="layout-working-heading" class="text-md font-medium">
          可组合工作区布局
        </h3>
        <p class="text-md text-fg-muted">
          Header / Sidebar / Content / Footer 可以独立使用，也可以通过 Layout
          继承尺寸与外观。
          桌面折叠隐藏导航、保留内容节点；窄屏改为可滚动抽屉，Esc
          关闭并返回触发器。 从右上角切换默认、键帽或麻将主题。
        </p>
        <div class="flex flex-wrap items-center gap-4">
          <div class="w-40">
            <Select
              id="layout-size-select"
              aria-label="布局尺寸"
              options={sizeOptions}
              value={size()}
              onValueChange={(value) => {
                if (value === "sm" || value === "md" || value === "lg")
                  setSize(value);
              }}
            />
          </div>
          <Checkbox checked={disabled()} onCheckedChange={setDisabled}>
            禁用侧栏开关
          </Checkbox>
          <Sidebar mode="mobile" disabled>
            <Sidebar.Trigger aria-label="禁用抽屉触发器">
              禁用触发器
            </Sidebar.Trigger>
          </Sidebar>
          <Sidebar mode="mobile" size={size()}>
            <Sidebar.Trigger
              id="layout-drawer-trigger"
              variant="ghost"
              aria-label="打开独立抽屉"
            >
              非受控抽屉
            </Sidebar.Trigger>
            <Sidebar.Panel
              id="layout-drawer-panel"
              heading="独立导航"
              description="这个抽屉使用内部展开状态；Esc、遮罩和关闭按钮均可关闭。"
              title="Uncontrolled navigation drawer"
              class="h-full"
            >
              <p class="mb-4 text-md text-fg-muted">
                可在任意屏幕宽度使用 mode="mobile"。键盘跳过禁用关闭按钮。
              </p>
              <div class="flex flex-wrap gap-3">
                <Sidebar.CloseButton
                  variant="outline"
                  aria-label="关闭独立抽屉"
                />
                <Sidebar.CloseButton
                  variant="outline"
                  aria-label="禁用关闭按钮"
                  disabled
                />
              </div>
            </Sidebar.Panel>
          </Sidebar>
        </div>
        <Layout
          id="layout-working-example"
          variant="outline"
          size={size()}
          class="gap-4 p-4"
        >
          <Sidebar
            collapsed={collapsed()}
            onCollapsedChange={(value) => {
              setCollapsed(value);
              setCollapseChanges((count) => count + 1);
            }}
            open={open()}
            onOpenChange={(value) => {
              setOpen(value);
              setOpenChanges((count) => count + 1);
            }}
            disabled={disabled()}
          >
            <Header variant="plain">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h4 class="text-lg font-medium">项目工作区</h4>
                <Sidebar.Trigger
                  id="layout-working-trigger"
                  aria-label="打开工作区导航"
                >
                  项目导航
                </Sidebar.Trigger>
                <Sidebar.Toggle variant="outline" aria-label="切换工作区导航" />
              </div>
            </Header>
            <div class="flex min-h-0 min-w-0 flex-col gap-4 lg:h-72 lg:flex-row">
              <Sidebar.Panel
                id="layout-working-sidebar"
                heading="工作导航"
                description="选择页面；抽屉模式下按 Esc 可关闭。"
                class="h-full max-w-full md:h-56 lg:h-full"
              >
                <nav aria-label="工作区导航">
                  <ul class="m-0 list-none space-y-3 p-0 pb-2">
                    <For each={navigation}>
                      {(entry) => (
                        <li>
                          <button
                            type="button"
                            disabled={entry.disabled}
                            aria-current={
                              page() === entry.id ? "page" : undefined
                            }
                            aria-controls="layout-working-content"
                            class={clsx(
                              navigationBase,
                              page() === entry.id
                                ? "border-primary bg-surface-hover text-primary"
                                : "border-border bg-surface text-fg",
                              getAppearanceClasses(
                                appearance(),
                                "native",
                                entry.disabled,
                              ),
                            )}
                            onClick={() => {
                              setPage(entry.id);
                              setOpen(false);
                            }}
                          >
                            {entry.label}
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </nav>
              </Sidebar.Panel>
              <Content
                id="layout-working-content"
                as="section"
                class="h-72 space-y-4 overflow-y-auto"
                aria-labelledby="layout-page-heading"
              >
                <h4 id="layout-page-heading" class="text-lg font-medium">
                  {pageName()}
                </h4>
                <label for="layout-draft" class="block text-md text-fg">
                  工作区名称
                </label>
                <Input
                  id="layout-draft"
                  size={size()}
                  value={draft()}
                  onValueChange={setDraft}
                />
                <Button onClick={() => setSaves((count) => count + 1)}>
                  保存名称
                </Button>
                <output
                  id="layout-save-output"
                  aria-live="polite"
                  class="block break-words text-md text-fg-muted"
                >
                  已保存 {saves()} 次 · {draft()}
                </output>
              </Content>
            </div>
            <Footer variant="plain">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <p id="layout-state" class="break-words text-md text-fg-muted">
                  折叠：{String(collapsed())} · 抽屉：{String(open())} ·
                  折叠回调：{collapseChanges()} · 抽屉回调：{openChanges()}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setFooterClicks((count) => count + 1)}
                >
                  页脚操作：{footerClicks()}
                </Button>
              </div>
            </Footer>
          </Sidebar>
        </Layout>
      </section>

      <AppearancePreview
        id="layout"
        description="三种外观、三种尺寸与 plain / outline 两种边框组合。布局底座静止；只有侧栏开关响应按下。小型样例使用桌面模式，展开后宽度受容器约束。"
      >
        {(value, currentSize) => (
          <div class="space-y-6">
            <For each={variants}>
              {(variant) => (
                <Layout
                  appearance={value}
                  size={currentSize}
                  variant={variant}
                  class="gap-3 p-3"
                  data-layout-variant={variant}
                  data-layout-size={currentSize}
                  data-layout-appearance={value}
                >
                  <Header variant={variant}>Header · {variant}</Header>
                  <Sidebar mode="desktop" defaultCollapsed>
                    <div class="flex min-w-0 flex-col gap-3">
                      <Sidebar.Panel
                        heading="Sidebar"
                        variant={variant}
                        class="max-w-full"
                      >
                        <p class="break-words text-md text-fg-muted">
                          静态导航内容 / Sidebar
                        </p>
                      </Sidebar.Panel>
                      <Content as="section" variant={variant}>
                        Content · {currentSize}
                      </Content>
                    </div>
                  </Sidebar>
                  <Footer variant={variant}>Footer · {currentSize}</Footer>
                </Layout>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>

      <section class="space-y-3" aria-labelledby="layout-notes-heading">
        <h3 id="layout-notes-heading" class="text-md font-medium">
          语义与透传
        </h3>
        <p class="text-md text-fg-muted">
          整页 Content 默认是 main，嵌入样例使用 as="section" 避免嵌套 main。
          Sidebar.Trigger 打开移动抽屉，Sidebar.Toggle
          控制桌面折叠，Sidebar.Panel 承载导航。 原生属性、事件、ref 与 class
          保持透传；布局自身不创建额外焦点停靠点。
        </p>
      </section>
    </div>
  );
}
