import { For } from "solid-js";
import clsx from "clsx";
import { tokens } from "@/theme/tokens";
import { useAppearance } from "@/theme/appearance";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";

const appearanceNames = {
  default: "默认",
  keycap: "键帽",
  mahjong: "麻将",
} as const;
const appearances = ["default", "keycap", "mahjong"] as const;

const swatches = [
  {
    name: "主色 / Primary",
    class: "border-primary bg-primary text-primary-fg",
  },
  { name: "危险 / Danger", class: "border-danger bg-danger text-danger-fg" },
  { name: "表面 / Surface", class: "border-border bg-surface text-fg" },
] as const;

export function ThemeDemo() {
  const appearance = useAppearance();
  return (
    <div class="space-y-6">
      <Card class="space-y-4" aria-labelledby="theme-preview-heading">
        <h3 id="theme-preview-heading" class="text-md font-medium">
          当前外观：{appearanceNames[appearance()]}
        </h3>
        <p class="text-md text-fg-muted">
          右上角的配色、外观和明暗模式独立切换。配色包含默认蓝、樱花粉、清新绿、
          薰衣草紫和暖杏橙；未指定 appearance 的组件跟随外观，输入内容保留。
          Button 保留已确认的键帽与麻将变体，颜色跟随配色。
        </p>
        <Input
          id="theme-preview-input"
          aria-label="主题预览输入"
          defaultValue="切换主题后，这段内容仍会保留。"
        />
        <Badge data-demo="inherited-appearance">继承当前主题</Badge>
      </Card>
      <section class="space-y-3" aria-labelledby="theme-explicit-heading">
        <h3 id="theme-explicit-heading" class="text-md font-medium">
          显式外观不受主题切换影响
        </h3>
        <div class="grid gap-6 sm:grid-cols-3">
          <For each={appearances}>
            {(value) => (
              <Card appearance={value} data-demo-explicit={value}>
                {appearanceNames[value]} · 固定外观
              </Card>
            )}
          </For>
        </div>
      </section>
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
