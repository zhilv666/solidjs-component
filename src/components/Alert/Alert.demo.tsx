import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Alert } from "./Alert";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["info", "success", "warning", "danger"] as const;
const sizes = ["sm", "md", "lg"] as const;
const messages = {
  info: { heading: "信息 / Info", body: "配置已载入，请检查后继续。" },
  success: { heading: "成功 / Success", body: "设置已成功保存。" },
  warning: { heading: "警告 / Warning", body: "仍有未保存的修改。" },
  danger: { heading: "错误 / Error", body: "保存失败，请检查输入后重试。" },
} as const;

export function AlertDemo() {
  const [variant, setVariant] = createSignal<
    "info" | "success" | "warning" | "danger"
  >("info");
  const [size, setSize] = createSignal<"sm" | "md" | "lg">("md");
  const [showHeading, setShowHeading] = createSignal(true);
  return (
    <div class="space-y-8">
      <AppearancePreview id="alert">
        {(appearance, alertSize) => (
          <div class="space-y-4">
            <For each={variants}>
              {(item) => (
                <Alert
                  id={`alert-${appearance}-${item}-${alertSize}`}
                  appearance={appearance}
                  variant={item}
                  size={alertSize}
                  heading={`${alertSize} · ${messages[item].heading}`}
                  aria-live="off"
                >
                  {messages[item].body}
                </Alert>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Kobalte 提供 role=alert，适合重要提示；普通反馈可通过原生 role=status
        使用礼貌播报。符号和文字共同区分状态，正文保持 text-fg。 矩阵设置
        aria-live=off 避免预览时重复播报；下方动态示例保留提示语义。
      </p>
      <For each={variants}>
        {(item) => (
          <section class="space-y-3" aria-labelledby={`alert-${item}-heading`}>
            <h3 id={`alert-${item}-heading`} class="text-md font-medium">
              {item}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(alertSize) => (
                  <Alert
                    id={`alert-${item}-${alertSize}`}
                    variant={item}
                    size={alertSize}
                    heading={`${alertSize} · ${messages[item].heading}`}
                    aria-live="off"
                  >
                    {messages[item].body}
                  </Alert>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="alert-live-heading"
      >
        <h3 id="alert-live-heading" class="text-md font-medium">
          动态提示与响应性
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="alert-next-message"
            onClick={() =>
              setVariant(
                (current) =>
                  variants[(variants.indexOf(current) + 1) % variants.length]!,
              )
            }
          >
            下一条消息
          </Button>
          <Button
            id="alert-toggle-size"
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
            id="alert-toggle-heading"
            variant="ghost"
            aria-pressed={!showHeading()}
            onClick={() => setShowHeading((current) => !current)}
          >
            {showHeading() ? "隐藏标题" : "显示标题"}
          </Button>
        </div>
        <Alert
          id="alert-live"
          variant={variant()}
          size={size()}
          heading={showHeading() ? messages[variant()].heading : undefined}
        >
          {messages[variant()].body}
        </Alert>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="alert-content-heading"
      >
        <h3 id="alert-content-heading" class="text-md font-medium">
          普通反馈、零值与长内容
        </h3>
        <Alert id="alert-polite" variant="success" role="status">
          普通反馈使用 status 的礼貌播报，不抢占用户操作。
        </Alert>
        <Alert id="alert-zero" heading={0} aria-live="off">
          {0}
        </Alert>
        <Alert
          id="alert-long-content"
          variant="warning"
          class="w-full"
          title="Native title"
          data-demo="class-passthrough"
          heading="窄屏长消息 / Long message"
          aria-live="off"
        >
          长消息应换行，符号与正文始终可见。
          LongUnbrokenAlertMessageThatMustWrapWithoutExpandingTheNarrowScreen
        </Alert>
      </section>
    </div>
  );
}
