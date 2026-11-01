import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import clsx from "clsx";
import { getAppearanceClasses } from "@/components/appearance";
import { Select } from "@/components/Select";
import { Layout, Header, Sidebar, Content, Footer } from "@/components/Layout";
import { demos } from "@/demo/registry";
import { applyTheme, getPreferredTheme } from "@/theme/mode";
import { AppearanceProvider } from "@/theme/appearance";
import {
  applyPalette,
  getPreferredPalette,
  isThemePalette,
  paletteOptions,
} from "@/theme/palette-mode";
import {
  applyAppearance,
  getPreferredAppearance,
  isComponentAppearance,
} from "@/theme/appearance-mode";

const appearanceOptions = [
  { value: "default", label: "默认主题" },
  { value: "keycap", label: "键帽主题" },
  { value: "mahjong", label: "麻将主题" },
] as const;

const controlClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-md font-medium cursor-pointer transition-colors duration-token enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";
const navigationClass =
  "inline-flex h-10 w-full min-w-0 items-center justify-start gap-2 rounded-md border px-3 text-md font-medium text-left cursor-pointer transition-colors duration-token enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

export default function App() {
  const [theme, setTheme] = createSignal(getPreferredTheme());
  const [appearance, setAppearance] = createSignal(getPreferredAppearance());
  const [palette, setPalette] = createSignal(getPreferredPalette());
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [activeId, setActiveId] = createSignal(demos[0]?.id ?? "");
  const activeDemo = createMemo(() =>
    demos.find((entry) => entry.id === activeId()),
  );

  createEffect(() => applyTheme(theme()));
  createEffect(() => applyAppearance(appearance()));
  createEffect(() => applyPalette(palette()));

  return (
    <AppearanceProvider appearance={appearance()}>
      <Sidebar open={sidebarOpen()} onOpenChange={setSidebarOpen}>
        <Layout class="h-screen" variant="plain">
          <Header variant="plain" class="border-b border-border">
            <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
              <div class="space-y-1">
                <p class="text-md text-fg-muted">SolidJS Component Library</p>
                <h1 class="text-xl font-medium">组件预览</h1>
              </div>
              <div
                id="theme-controls"
                class="ml-auto flex flex-wrap items-center justify-end gap-3"
              >
                <Sidebar.Trigger
                  id="demo-sidebar-trigger"
                  aria-label="打开组件目录"
                >
                  目录
                </Sidebar.Trigger>
                <div class="w-36">
                  <Select
                    id="palette-select"
                    aria-label="配色主题"
                    options={paletteOptions}
                    value={palette()}
                    onValueChange={(value) => {
                      if (isThemePalette(value)) setPalette(value);
                    }}
                  />
                </div>
                <div class="w-40">
                  <Select
                    id="appearance-select"
                    aria-label="外观主题"
                    options={appearanceOptions}
                    value={appearance()}
                    onValueChange={(value) => {
                      if (isComponentAppearance(value)) setAppearance(value);
                    }}
                  />
                </div>
                <button
                  id="theme-toggle"
                  type="button"
                  class={clsx(
                    controlClass,
                    "border-border bg-surface text-fg",
                    getAppearanceClasses(appearance(), "native"),
                  )}
                  aria-label={
                    theme() === "dark" ? "切换到浅色模式" : "切换到深色模式"
                  }
                  aria-pressed={theme() === "dark"}
                  onClick={() =>
                    setTheme((value) => (value === "dark" ? "light" : "dark"))
                  }
                >
                  {theme() === "dark" ? "深色模式" : "浅色模式"}
                </button>
              </div>
            </div>
          </Header>

          <div class="mx-auto flex w-full min-h-0 max-w-7xl flex-1 gap-4 p-4 md:gap-6 md:p-6">
            <Sidebar.Panel id="demo-sidebar" heading="组件目录" class="h-full">
              <nav aria-label="组件目录" class="space-y-3">
                <ul class="list-none space-y-2 p-0">
                  <For each={demos}>
                    {(entry) => (
                      <li>
                        <button
                          type="button"
                          class={clsx(
                            navigationClass,
                            getAppearanceClasses(appearance(), "native"),
                            activeId() === entry.id
                              ? "border-primary bg-surface-hover text-primary"
                              : "border-border bg-surface text-fg",
                          )}
                          aria-current={
                            activeId() === entry.id ? "page" : undefined
                          }
                          aria-controls="component-preview"
                          onClick={() => {
                            setActiveId(entry.id);
                            setSidebarOpen(false);
                          }}
                        >
                          {entry.name}
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </nav>
            </Sidebar.Panel>

            <Content id="component-preview" class="overflow-y-auto">
              <Show
                when={activeDemo()}
                fallback={
                  <p class="text-md text-fg-muted">选择一个组件开始预览。</p>
                }
              >
                {(entry) => (
                  <section class="space-y-6" aria-labelledby="demo-heading">
                    <div class="space-y-2">
                      <h2 id="demo-heading" class="text-lg font-medium">
                        {entry().name}
                      </h2>
                      <p class="text-md text-fg-muted">{entry().description}</p>
                    </div>
                    <div class="mt-6">
                      <Dynamic component={entry().component} />
                    </div>
                  </section>
                )}
              </Show>
            </Content>
          </div>
          <Footer size="sm" variant="plain" class="border-t border-border">
            <p class="mx-auto max-w-7xl text-md text-fg-muted">
              SolidJS · Kobalte · 默认 / 键帽 / 麻将外观
            </p>
          </Footer>
        </Layout>
      </Sidebar>
    </AppearanceProvider>
  );
}
