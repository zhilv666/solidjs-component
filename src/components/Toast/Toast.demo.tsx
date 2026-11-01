import { createSignal, For, onCleanup } from "solid-js";
import { Button } from "../Button";
import { Toaster, toast } from "./Toast";
import { AppearancePreview } from "../../demo/AppearancePreview";
import type { ComponentAppearance } from "../appearance";

const variants = ["info", "success", "warning", "danger"] as const;
const appearances = ["default", "keycap", "mahjong"] as const;
const sizes = ["sm", "md", "lg"] as const;

export function ToastDemo() {
  const [appearance, setAppearance] =
    createSignal<ComponentAppearance>("mahjong");
  const [size, setSize] = createSignal<"sm" | "md" | "lg">("md");
  const [lastId, setLastId] = createSignal<number>();
  const [count, setCount] = createSignal(0);
  const [closed, setClosed] = createSignal(0);
  const record = (id: number) => {
    setLastId(id);
    setCount((current) => current + 1);
  };
  // Demo owns the default queue; navigating away leaves no stale notifications.
  onCleanup(toast.clear);
  return (
    <div class="space-y-8">
      <Toaster
        id="toast-demo-region"
        appearance={appearance()}
        size={size()}
        aria-label="通知（{hotkey}）"
      />
      <AppearancePreview id="toast">
        {(currentAppearance, currentSize) => (
          <div class="space-y-3">
            <p class="text-md text-fg-muted">{currentSize} · 点击显示通知</p>
            <div class="flex flex-wrap items-center gap-3">
              <For each={variants}>
                {(variant) => (
                  <Button
                    id={`toast-${currentAppearance}-${variant}-${currentSize}`}
                    variant={
                      currentAppearance === "mahjong" ? "mahjong" : "outline"
                    }
                    size={currentSize}
                    onClick={() =>
                      record(
                        toast({
                          "data-demo-toast": "matrix",
                          appearance: currentAppearance,
                          size: currentSize,
                          variant,
                          heading: `${variant} · ${currentSize}`,
                          description:
                            "消息正文与语义色独立，面板底座保持静止。",
                          closeLabel: `关闭 ${variant} 通知`,
                        }),
                      )
                    }
                  >
                    {variant}
                  </Button>
                )}
              </For>
            </div>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        全局调用 toast(options) 或 toast.show(options)，返回可用于
        toast.dismiss(id) 的 ID；toast.clear()
        清空所有区域的队列。默认最多同时显示 3 条，5
        秒后关闭；悬停、聚焦或页面失焦暂停计时。Alt+T 跳转到通知列表，再用 Tab
        到达通知和关闭按钮，Esc 关闭当前通知。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="toast-live-heading"
      >
        <h3 id="toast-live-heading" class="text-md font-medium">
          全局调用与区域默认外观
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="toast-show-polite"
            variant="outline"
            onClick={() =>
              record(
                toast.show({
                  "data-demo-toast": "polite",
                  heading: "后台同步完成",
                  description: "低优先级通知使用 polite，不自动抢焦点。",
                  variant: "success",
                  priority: "low",
                  closeButtonProps: {
                    onClick: () => setClosed((value) => value + 1),
                  },
                }),
              )
            }
          >
            普通通知
          </Button>
          <Button
            id="toast-show-persistent"
            variant="mahjong"
            onClick={() =>
              record(
                toast({
                  "data-demo-toast": "persistent",
                  heading: "持续通知",
                  description: "不会自动关闭；仅关闭按钮或 Esc 关闭。",
                  persistent: true,
                }),
              )
            }
          >
            持续通知
          </Button>
          <Button
            id="toast-show-disabled-close"
            variant="outline"
            onClick={() =>
              record(
                toast({
                  "data-demo-toast": "disabled-close",
                  heading: "禁用关闭按钮",
                  description: "禁用按钮跳过 Tab；仍可按 Esc 或全局关闭。",
                  persistent: true,
                  closeButtonProps: { disabled: true, variant: "outline" },
                }),
              )
            }
          >
            禁用关闭
          </Button>
          <Button
            id="toast-dismiss-last"
            variant="ghost"
            disabled={lastId() === undefined}
            onClick={() => {
              const id = lastId();
              if (id !== undefined) toast.dismiss(id);
            }}
          >
            关闭最后一条
          </Button>
          <Button id="toast-clear" variant="ghost" onClick={toast.clear}>
            清空所有通知
          </Button>
        </div>
        <div
          class="flex flex-wrap items-center gap-3"
          role="group"
          aria-label="通知区域外观"
        >
          <For each={appearances}>
            {(value) => (
              <Button
                id={`toast-style-${value}`}
                variant="ghost"
                aria-pressed={appearance() === value}
                onClick={() => setAppearance(value)}
              >
                {value}
              </Button>
            )}
          </For>
          <For each={sizes}>
            {(value) => (
              <Button
                id={`toast-size-${value}`}
                variant="ghost"
                aria-pressed={size() === value}
                onClick={() => setSize(value)}
              >
                {value}
              </Button>
            )}
          </For>
        </div>
        <output
          id="toast-live-status"
          class="text-md text-fg-muted"
          aria-live="polite"
        >
          已调用 {count()} 次；关闭按钮激活 {closed()} 次；区域外观{" "}
          {appearance()} / {size()}
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="toast-long-heading"
      >
        <h3 id="toast-long-heading" class="text-md font-medium">
          长消息、无关闭按钮与原生属性
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="toast-show-long"
            variant="outline"
            onClick={() =>
              record(
                toast({
                  "data-demo-toast": "long",
                  heading: "长消息 / Native attributes",
                  description:
                    "VeryLongUnbrokenNotificationTextForNarrowScreenWithoutHorizontalOverflow. ".repeat(
                      40,
                    ),
                  title: "Native title",
                  class: "text-left",
                  "data-demo": "class-passthrough",
                  appearance: "keycap",
                  size: "lg",
                  persistent: true,
                }),
              )
            }
          >
            长消息
          </Button>
          <Button
            id="toast-show-no-close"
            variant="outline"
            onClick={() =>
              record(
                toast({
                  "data-demo-toast": "no-close",
                  heading: 0,
                  description: 0,
                  closable: false,
                  persistent: true,
                }),
              )
            }
          >
            无关闭按钮 / 0
          </Button>
        </div>
      </section>
      <p class="text-md text-fg-muted">
        可用 Toast.Region / Toast.List / Toast / Toast.Title / Toast.Description
        / Toast.CloseButton 组合自定义通知；创建队列条目时沿用 Kobalte
        toaster.show。 每个区域只挂载一个列表，regionId 与调用的 region
        保持一致。
      </p>
    </div>
  );
}
