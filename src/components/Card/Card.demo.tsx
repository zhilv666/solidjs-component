import { createSignal, For, Show } from "solid-js";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Card } from "./Card";

const variants = ["outline", "elevated"] as const;
const sizes = ["sm", "md", "lg"] as const;

export function CardDemo() {
  const [size, setSize] = createSignal<"sm" | "md" | "lg">("md");
  const [variant, setVariant] = createSignal<"outline" | "elevated">("outline");
  const [details, setDetails] = createSignal(true);
  const [count, setCount] = createSignal(0);
  return (
    <div class="space-y-8">
      <p class="text-md text-fg-muted">
        Card 是非交互的 section 容器，不额外占用 Tab 停靠点。outline
        保持清晰边框，elevated 仅增加 shadow-sm；尺寸控制内边距与正文字号。
        标题、正文和操作区通过 children 组合，区域名称由 aria-labelledby 提供。
      </p>
      <For each={variants}>
        {(item) => (
          <section class="space-y-3" aria-labelledby={`card-${item}-heading`}>
            <h3 id={`card-${item}-heading`} class="text-md font-medium">
              {item}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(cardSize) => (
                  <Card
                    id={`card-${item}-${cardSize}`}
                    variant={item}
                    size={cardSize}
                    aria-labelledby={`card-${item}-${cardSize}-title`}
                    class="space-y-3"
                  >
                    <h4
                      id={`card-${item}-${cardSize}-title`}
                      class="font-medium"
                    >
                      {cardSize} · Card
                    </h4>
                    <p>中英文内容 / SolidJS components</p>
                    <p class="text-fg-muted">现有主题 token 与小圆角。</p>
                  </Card>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="card-composition-heading"
      >
        <h3 id="card-composition-heading" class="text-md font-medium">
          内容组合与响应性
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="card-toggle-size"
            variant="ghost"
            onClick={() =>
              setSize(
                (current) =>
                  sizes[(sizes.indexOf(current) + 1) % sizes.length]!,
              )
            }
          >
            切换尺寸：{size()}
          </Button>
          <Button
            id="card-toggle-variant"
            variant="ghost"
            onClick={() =>
              setVariant((current) =>
                current === "outline" ? "elevated" : "outline",
              )
            }
          >
            切换变体：{variant()}
          </Button>
          <Button
            id="card-toggle-details"
            variant="ghost"
            aria-expanded={details()}
            aria-controls={details() ? "card-details" : undefined}
            onClick={() => setDetails((current) => !current)}
          >
            {details() ? "隐藏说明" : "显示说明"}
          </Button>
        </div>
        <Card
          id="card-composed"
          size={size()}
          variant={variant()}
          class="space-y-4"
          aria-labelledby="card-composed-title"
        >
          <header class="space-y-2">
            <h4 id="card-composed-title" class="font-medium">
              组件库 / Component library
            </h4>
            <Badge variant="neutral">展示容器</Badge>
          </header>
          <div class="space-y-3">
            <p>内容由调用方提供，Card 不模拟可点击区域或管理焦点。</p>
            <Show when={details()}>
              <p id="card-details" class="text-fg-muted">
                变体与尺寸更新不重建内部控件；可使用 header、footer
                和语义化标题组织内容。
              </p>
            </Show>
          </div>
          <footer class="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <Button
              id="card-counter"
              onClick={() => setCount((current) => current + 1)}
            >
              增加计数
            </Button>
            <output id="card-count" aria-live="polite" class="text-fg">
              计数：{count()}
            </output>
          </footer>
        </Card>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="card-content-heading"
      >
        <h3 id="card-content-heading" class="text-md font-medium">
          长内容与原生属性
        </h3>
        <Card
          id="card-long-content"
          class="w-full space-y-3"
          title="Native title"
          data-demo="class-passthrough"
          aria-labelledby="card-long-title"
        >
          <h4 id="card-long-title" class="font-medium">
            窄屏内容换行 / Long content on narrow screens
          </h4>
          <p>
            LongUnbrokenContentToVerifyThatCardContentWrapsInsteadOfExpandingThePageWidth
          </p>
        </Card>
      </section>
    </div>
  );
}
