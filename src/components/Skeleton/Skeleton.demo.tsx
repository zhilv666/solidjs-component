import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Skeleton } from "./Skeleton";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["line", "block"] as const;

export function SkeletonDemo() {
  const [loading, setLoading] = createSignal(true);
  return (
    <div class="space-y-8">
      <AppearancePreview id="skeleton">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <Skeleton
                    id={`skeleton-${appearance}-${variant}-${size}`}
                    appearance={appearance}
                    variant={variant}
                    size={size}
                  />
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        静态占位默认从无障碍树隐藏，不包含交互内容，也不新增 Tab 停靠点。
        加载状态和播报由调用方提供，宽度可通过 class 控制。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="skeleton-loading-heading"
      >
        <h3 id="skeleton-loading-heading" class="text-md font-medium">
          加载与内容替换
        </h3>
        <Button
          id="skeleton-toggle-loading"
          variant="outline"
          onClick={() => setLoading((current) => !current)}
        >
          {loading() ? "显示内容" : "重新加载"}
        </Button>
        <div id="skeleton-profile" class="space-y-4" aria-busy={loading()}>
          <Show
            when={loading()}
            fallback={
              <p class="text-md text-fg">
                SolidJS 组件库内容已载入 / Content loaded.
              </p>
            }
          >
            <div class="space-y-4">
              <Skeleton appearance="mahjong" class="w-3/4" />
              <Skeleton appearance="mahjong" variant="block" />
              <Skeleton appearance="mahjong" class="w-1/2" />
            </div>
          </Show>
        </div>
        <output
          id="skeleton-status"
          aria-live="polite"
          class="block text-md text-fg-muted"
        >
          {loading() ? "正在加载内容" : "内容加载完成"}
        </output>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="skeleton-native-heading"
      >
        <h3 id="skeleton-native-heading" class="text-md font-medium">
          原生属性与 class 透传
        </h3>
        <Skeleton
          id="skeleton-native"
          class="w-1/2"
          title="Native title"
          data-demo="class-passthrough"
        />
      </section>
    </div>
  );
}
