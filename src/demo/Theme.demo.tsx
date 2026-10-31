import { For } from "solid-js";
import clsx from "clsx";
import { tokens } from "@/theme/tokens";

const swatches = [
  {
    name: "主色 / Primary",
    class: "border-primary bg-primary text-primary-fg",
  },
  { name: "危险 / Danger", class: "border-danger bg-danger text-danger-fg" },
  { name: "表面 / Surface", class: "border-border bg-surface text-fg" },
] as const;

export function ThemeDemo() {
  return (
    <div class="space-y-6">
      <div class="grid gap-3 sm:grid-cols-3">
        <For each={swatches}>
          {(swatch) => (
            <div class={clsx("rounded-md border p-4 text-md", swatch.class)}>
              {swatch.name}
            </div>
          )}
        </For>
      </div>

      <section
        class="space-y-3 rounded-md border border-border bg-surface p-4"
        aria-labelledby="theme-text-heading"
      >
        <h3 id="theme-text-heading" class="text-md font-medium">
          文字与反馈色
        </h3>
        <p class="text-md text-fg">
          中文排版与 English typography，正文清晰可读。
        </p>
        <p class="text-md text-fg-muted">
          次要说明 / Secondary text，使用相同字号。
        </p>
        <div class="flex flex-wrap gap-4 text-md">
          <span class="text-success">成功 / Success</span>
          <span class="text-warning">提醒 / Warning</span>
        </div>
      </section>

      <section class="space-y-3" aria-labelledby="theme-radius-heading">
        <h3 id="theme-radius-heading" class="text-md font-medium">
          圆角
        </h3>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-sm border border-border bg-surface p-4 text-md">
            Small · {tokens.radius.sm}
          </div>
          <div class="rounded-md border border-border bg-surface p-4 text-md">
            Medium · {tokens.radius.md}
          </div>
          <div class="rounded-lg border border-border bg-surface p-4 text-md">
            Large · {tokens.radius.lg}
          </div>
        </div>
      </section>
    </div>
  );
}
