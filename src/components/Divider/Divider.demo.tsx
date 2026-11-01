import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Divider } from "./Divider";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["solid", "dashed"] as const;

export function DividerDemo() {
  const [vertical, setVertical] = createSignal(false);
  const [large, setLarge] = createSignal(false);
  return (
    <div class="space-y-8">
      <AppearancePreview id="divider">
        {(appearance, size) => (
          <div class="space-y-5">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-4">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <Divider
                    id={`divider-${appearance}-${variant}-${size}-horizontal`}
                    variant={variant}
                    size={size}
                    appearance={appearance}
                  />
                  <div class="flex min-h-10 items-center gap-4">
                    <span class="text-md text-fg">左侧</span>
                    <Divider
                      id={`divider-${appearance}-${variant}-${size}-vertical`}
                      orientation="vertical"
                      variant={variant}
                      size={size}
                      appearance={appearance}
                    />
                    <span class="text-md text-fg">右侧</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        默认横向，竖向在 flex 行内拉伸，也可用 class 指定高度。尺寸控制线宽，
        decorative 将纯装饰分隔线从无障碍树隐藏；不新增交互、按下效果或 Tab
        停靠点。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="divider-live-heading"
      >
        <h3 id="divider-live-heading" class="text-md font-medium">
          动态方向与尺寸
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="divider-toggle-orientation"
            variant="outline"
            onClick={() => setVertical((current) => !current)}
          >
            {vertical() ? "切换横向" : "切换竖向"}
          </Button>
          <Button
            id="divider-toggle-size"
            variant="outline"
            onClick={() => setLarge((current) => !current)}
          >
            {large() ? "使用中等线宽" : "使用较粗线宽"}
          </Button>
        </div>
        <div
          class={vertical() ? "flex min-h-16 items-center gap-4" : "space-y-4"}
        >
          <p class="text-md text-fg">第一组内容</p>
          <Divider
            id="divider-live"
            orientation={vertical() ? "vertical" : "horizontal"}
            size={large() ? "lg" : "md"}
            appearance="mahjong"
          />
          <p class="text-md text-fg">第二组内容</p>
        </div>
        <output
          id="divider-status"
          aria-live="polite"
          class="block text-md text-fg-muted"
        >
          {vertical() ? "竖向" : "横向"} · {large() ? "lg" : "md"}
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="divider-native-heading"
      >
        <h3 id="divider-native-heading" class="text-md font-medium">
          装饰分隔与原生属性透传
        </h3>
        <Divider id="divider-decorative" decorative />
        <Divider
          id="divider-native"
          class="w-3/4"
          title="Native title"
          data-demo="class-passthrough"
        />
      </section>
    </div>
  );
}
