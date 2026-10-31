import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Tag } from "./Tag";

const variants = ["solid", "outline", "neutral"] as const;
const sizes = ["sm", "md", "lg"] as const;
const states = [
  { id: "plain", label: "常规 / Plain", closable: false, disabled: false },
  {
    id: "closable",
    label: "可关闭 / Closable",
    closable: true,
    disabled: false,
  },
  { id: "disabled", label: "禁用 / Disabled", closable: true, disabled: true },
] as const;
interface DemoTag {
  id: string;
  label: string;
}
const initialTags: readonly DemoTag[] = [
  { id: "solid", label: "SolidJS" },
  { id: "ts", label: "TypeScript" },
  { id: "a11y", label: "Accessibility" },
];

export function TagDemo() {
  const [requests, setRequests] = createSignal(0);
  const [tags, setTags] = createSignal(initialTags);
  const [disabled, setDisabled] = createSignal(false);
  return (
    <div class="space-y-8">
      <p class="text-md text-fg-muted">
        关闭请求通过 onClose 通知，由调用方移除。可关闭标签必须提供 closeLabel
        和回调；矩阵仅记录请求以保留预览，下方列表会实际删除。关闭按钮使用
        Kobalte，最小点击区域为 24px。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-3"
            aria-labelledby={`tag-${state.id}-heading`}
          >
            <h3 id={`tag-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="space-y-3">
              <For each={variants}>
                {(variant) => (
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="w-16 text-md text-fg-muted">{variant}</span>
                    <For each={sizes}>
                      {(size) => (
                        <Show
                          when={state.closable}
                          fallback={
                            <Tag
                              id={`tag-${state.id}-${variant}-${size}`}
                              variant={variant}
                              size={size}
                            >
                              {size} · Tag
                            </Tag>
                          }
                        >
                          <Tag
                            id={`tag-${state.id}-${variant}-${size}`}
                            variant={variant}
                            size={size}
                            disabled={state.disabled}
                            closable
                            closeLabel={`移除 ${state.id} ${variant} ${size} 标签`}
                            onClose={() => setRequests((count) => count + 1)}
                          >
                            {size} · Tag
                          </Tag>
                        </Show>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
      <output
        id="tag-request-output"
        aria-live="polite"
        class="block text-md text-fg"
      >
        关闭请求：{requests()} 次
      </output>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="tag-list-heading"
      >
        <h3 id="tag-list-heading" class="text-md font-medium">
          受控列表与响应性
        </h3>
        <div id="tag-controlled-list" class="flex flex-wrap items-center gap-3">
          <For each={tags()}>
            {(item) => (
              <Tag
                id={`tag-list-${item.id}`}
                variant="outline"
                disabled={disabled()}
                closable
                closeLabel={`移除 ${item.label} 标签`}
                onClose={() =>
                  setTags((current) =>
                    current.filter((tag) => tag.id !== item.id),
                  )
                }
              >
                {item.label}
              </Tag>
            )}
          </For>
          <Show when={tags().length === 0}>
            <p class="text-md text-fg-muted">暂无标签。</p>
          </Show>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button onClick={() => setTags(initialTags)}>恢复标签</Button>
          <Button
            variant="ghost"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用列表" : "禁用列表"}
          </Button>
        </div>
        <output
          id="tag-list-output"
          aria-live="polite"
          class="block text-md text-fg"
        >
          剩余标签：{tags().length} 个
        </output>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="tag-content-heading"
      >
        <h3 id="tag-content-heading" class="text-md font-medium">
          长内容与 class 透传
        </h3>
        <Tag
          id="tag-long-label"
          variant="neutral"
          class="w-full"
          title="Native title"
          data-demo="class-passthrough"
          closable
          closeLabel="移除长标签"
          onClose={() => setRequests((count) => count + 1)}
        >
          窄屏长标签应换行，关闭按钮保持可见 / Long tag content wraps while its
          close button stays visible.
        </Tag>
      </section>
    </div>
  );
}
