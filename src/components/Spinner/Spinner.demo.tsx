import { createSignal, For, Show } from "solid-js";
import { AppearancePreview } from "@/demo/AppearancePreview";
import { Button } from "../Button";
import { Spinner } from "./Spinner";

const variants = ["primary", "neutral"] as const;

export function SpinnerDemo() {
  const [loading, setLoading] = createSignal(true);
  return (
    <div class="space-y-8">
      <AppearancePreview
        id="spinner"
        description="只有内部加载图形旋转，外框与立体底座保持静止。旋转时长来自主题 token；系统开启减少动态效果时停转。"
      >
        {(appearance, size) => (
          <div class="flex flex-wrap items-center gap-4">
            <For each={variants}>
              {(variant) => (
                <div class="flex items-center gap-2">
                  <Spinner
                    id={`spinner-${appearance}-${variant}-${size}`}
                    appearance={appearance}
                    variant={variant}
                    size={size}
                    label={`${appearance} ${variant} ${size} 加载中`}
                    aria-live="off"
                  />
                  <span class="text-md text-fg-muted">
                    {variant} · {size}
                  </span>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="spinner-live-heading"
      >
        <h3 id="spinner-live-heading" class="text-md font-medium">
          加载状态与键盘操作
        </h3>
        <Button
          id="spinner-toggle"
          variant="outline"
          onClick={() => setLoading((value) => !value)}
        >
          {loading() ? "完成加载" : "重新加载"}
        </Button>
        <div class="flex items-center gap-3" aria-busy={loading()}>
          <Show when={loading()}>
            <Spinner
              id="spinner-live"
              appearance="mahjong"
              aria-hidden="true"
            />
          </Show>
          <p id="spinner-status" role="status" class="text-md text-fg">
            {loading() ? "正在加载，请稍候。" : "加载完成。"}
          </p>
        </div>
        <p class="text-md text-fg-muted">
          Spinner 不接收键盘焦点；Tab 停靠在操作按钮。装饰用例通过 aria-hidden
          隐藏图形，状态文字负责播报。
        </p>
      </section>
    </div>
  );
}
