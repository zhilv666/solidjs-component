import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Badge } from "./Badge";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["solid", "outline", "neutral"] as const;
const sizes = ["sm", "md", "lg"] as const;

export function BadgeDemo() {
  const [count, setCount] = createSignal(0);
  return (
    <div class="space-y-8">
      <AppearancePreview id="badge">
        {(appearance, size) => (
          <div class="flex flex-wrap items-center gap-3">
            <For each={variants}>
              {(variant) => (
                <Badge
                  id={`badge-${appearance}-${variant}-${size}`}
                  appearance={appearance}
                  variant={variant}
                  size={size}
                >
                  {variant} · {size}
                </Badge>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        纯展示标签，不产生 Tab 停靠点，不模拟按钮。三种变体均使用现有
        token；正文保持至少 14px。
      </p>
      <For each={variants}>
        {(variant) => (
          <section
            class="space-y-3"
            aria-labelledby={`badge-${variant}-heading`}
          >
            <h3 id={`badge-${variant}-heading`} class="text-md font-medium">
              {variant}
            </h3>
            <div class="flex flex-wrap items-center gap-3">
              <For each={sizes}>
                {(size) => (
                  <Badge
                    id={`badge-${variant}-${size}`}
                    variant={variant}
                    size={size}
                  >
                    {size} · Badge
                  </Badge>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="badge-count-heading"
      >
        <h3 id="badge-count-heading" class="text-md font-medium">
          数字与响应性
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-md text-fg">待处理项目</span>
          <output aria-live="polite">
            <Badge id="badge-count" variant="outline">
              {count()}
            </Badge>
          </output>
          <Button
            id="badge-increment"
            onClick={() => setCount((value) => value + 1)}
          >
            增加计数
          </Button>
          <Button
            variant="outline"
            disabled={count() === 0}
            onClick={() => setCount((value) => value - 1)}
          >
            减少计数
          </Button>
        </div>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="badge-content-heading"
      >
        <h3 id="badge-content-heading" class="text-md font-medium">
          内容与 class 透传
        </h3>
        <Badge variant="neutral" aria-label="已完成">
          <span aria-hidden="true">✓</span> 已完成 / Completed
        </Badge>
        <Badge
          id="badge-long-label"
          variant="outline"
          class="w-full"
          title="Native title"
          data-demo="class-passthrough"
        >
          这是用于检验窄屏换行的长标签 / A long badge label that wraps on narrow
          screens.
        </Badge>
      </section>
    </div>
  );
}
