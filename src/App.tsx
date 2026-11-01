import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import clsx from "clsx";
import { getAppearanceClasses } from "@/components/appearance";
import { Select } from "@/components/Select";
import { demos } from "@/demo/registry";
import { applyTheme, getPreferredTheme } from "@/theme/mode";
import { AppearanceProvider } from "@/theme/appearance";
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
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-md font-medium cursor-pointer transition-colors duration-token enabled:hover:bg-surface-hover enabled:active:bg-surface-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

export default function App() {
  const [theme, setTheme] = createSignal(getPreferredTheme());
  const [appearance, setAppearance] = createSignal(getPreferredAppearance());
  const [activeId, setActiveId] = createSignal(demos[0]?.id ?? "");
  const activeDemo = createMemo(() =>
    demos.find((entry) => entry.id === activeId()),
  );

  createEffect(() => applyTheme(theme()));
  createEffect(() => applyAppearance(appearance()));

  return (
    <AppearanceProvider appearance={appearance()}>
      <div class="min-h-screen bg-bg text-fg">
        <header class="border-b border-border bg-surface">
          <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 p-4 md:px-6">
            <div class="space-y-1">
              <p class="text-md text-fg-muted">SolidJS Component Library</p>
              <h1 class="text-xl font-medium">组件预览</h1>
            </div>
            <div
              id="theme-controls"
              class="ml-auto flex flex-wrap items-center justify-end gap-3"
            >
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
        </header>

        <div class="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:flex-row md:p-6">
          <aside class="w-full shrink-0 md:w-56">
            <nav aria-label="组件目录" class="space-y-3">
              <h2 class="text-md font-medium">组件目录</h2>
              <ul class="list-none space-y-2 p-0">
                <For each={demos}>
                  {(entry) => (
                    <li>
                      <button
                        type="button"
                        class={clsx(
                          controlClass,
                          "w-full justify-start",
                          getAppearanceClasses(appearance(), "native"),
                          activeId() === entry.id
                            ? "border-primary bg-surface-hover text-primary"
                            : "border-border bg-surface text-fg",
                        )}
                        aria-current={
                          activeId() === entry.id ? "page" : undefined
                        }
                        aria-controls="component-preview"
                        onClick={() => setActiveId(entry.id)}
                      >
                        {entry.name}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
          </aside>

          <main id="component-preview" class="min-w-0 flex-1">
            <Show
              when={activeDemo()}
              fallback={
                <p class="text-md text-fg-muted">选择一个组件开始预览。</p>
              }
            >
              {(entry) => (
                <section
                  class={clsx(
                    "rounded-md border border-border bg-surface p-4 md:p-6",
                    getAppearanceClasses(appearance()),
                  )}
                  aria-labelledby="demo-heading"
                >
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
          </main>
        </div>
      </div>
    </AppearanceProvider>
  );
}
