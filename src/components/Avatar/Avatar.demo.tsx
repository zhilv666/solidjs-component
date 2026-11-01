import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Avatar, type AvatarLoadingStatus } from "./Avatar";
import { AppearancePreview } from "../../demo/AppearancePreview";
import { tokens } from "../../theme/tokens";

// Demo artwork derives its colors from tokens, like a static image asset.
const imageSource = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path fill="${tokens.color.primary}" d="M0 0h80v80H0z"/><circle fill="${tokens.color.primaryFg}" cx="40" cy="28" r="13"/><path fill="${tokens.color.primaryFg}" d="M15 80v-8a25 25 0 0 1 50 0v8z"/></svg>`,
)}`;
const errorSource = "data:image/svg+xml,invalid";
const variants = ["circle", "square"] as const;
const states = [
  { id: "image", label: "图片", src: imageSource },
  { id: "fallback", label: "无图片", src: undefined },
  { id: "error", label: "加载失败", src: errorSource },
] as const;

export function AvatarDemo() {
  const [validSource, setValidSource] = createSignal(true);
  const [square, setSquare] = createSignal(false);
  const [status, setStatus] = createSignal<AvatarLoadingStatus>("idle");
  return (
    <div class="space-y-8">
      <AppearancePreview id="avatar">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <div class="flex flex-wrap items-start gap-4">
                    <For each={states}>
                      {(state) => (
                        <div class="space-y-2">
                          <Avatar
                            id={`avatar-${appearance}-${variant}-${size}-${state.id}`}
                            alt={`${appearance} ${variant} ${size} ${state.label}头像`}
                            src={state.src}
                            fallback="ZH"
                            variant={variant}
                            size={size}
                            appearance={appearance}
                          />
                          <p class="text-md text-fg-muted">{state.label}</p>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        圆形 Avatar 是明确允许的圆角例外；square 使用 rounded-md。
        图片加载与回退由 Kobalte 管理，alt 提供稳定名称，空 alt 表示装饰。
        头像只展示，不模拟按钮，也不新增 Tab 停靠点。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="avatar-live-heading"
      >
        <h3 id="avatar-live-heading" class="text-md font-medium">
          加载失败与恢复
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Avatar
            id="avatar-live"
            alt="张同学的头像"
            src={validSource() ? imageSource : errorSource}
            fallback="张"
            appearance="mahjong"
            variant={square() ? "square" : "circle"}
            onLoadingStatusChange={setStatus}
          />
          <Button
            id="avatar-toggle-source"
            variant="outline"
            onClick={() => setValidSource((current) => !current)}
          >
            {validSource() ? "模拟图片失败" : "恢复图片"}
          </Button>
          <Button
            id="avatar-toggle-shape"
            variant="outline"
            onClick={() => setSquare((current) => !current)}
          >
            {square() ? "切换圆形" : "切换方形"}
          </Button>
          <output
            id="avatar-status"
            aria-live="polite"
            class="text-md text-fg-muted"
          >
            图片状态：{status()}
          </output>
        </div>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="avatar-native-heading"
      >
        <h3 id="avatar-native-heading" class="text-md font-medium">
          装饰头像与原生属性透传
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Avatar id="avatar-decorative" alt="" fallback="?" />
          <Avatar
            id="avatar-native"
            alt="自定义图片属性示例"
            src={imageSource}
            fallback="UI"
            variant="square"
            class="align-top"
            title="Native title"
            data-demo="class-passthrough"
            imageProps={{
              id: "avatar-native-image",
              title: "Image title",
              referrerPolicy: "no-referrer",
            }}
          />
          <p class="text-md text-fg-muted">
            根元素 ref、属性与 class 透传；imageProps 传给内部图片。
          </p>
        </div>
      </section>
    </div>
  );
}
