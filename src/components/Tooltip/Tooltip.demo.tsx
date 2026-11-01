import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Tooltip } from "./Tooltip";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["outline", "ghost"] as const;
const states = [
  {
    id: "enabled",
    label: "可用",
    triggerDisabled: false,
    tooltipDisabled: false,
  },
  {
    id: "trigger-disabled",
    label: "控件禁用",
    triggerDisabled: true,
    tooltipDisabled: true,
  },
  {
    id: "tooltip-disabled",
    label: "仅提示禁用",
    triggerDisabled: false,
    tooltipDisabled: true,
  },
] as const;

export function TooltipDemo() {
  const [open, setOpen] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [count, setCount] = createSignal(0);
  return (
    <div class="space-y-8">
      <AppearancePreview id="tooltip">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <div class="flex flex-wrap items-center gap-3">
                    <For each={states}>
                      {(state) => (
                        <Tooltip
                          size={size}
                          appearance={appearance}
                          disabled={state.tooltipDisabled}
                        >
                          <Tooltip.Trigger
                            id={`tooltip-${appearance}-${variant}-${size}-${state.id}`}
                            variant={variant}
                            disabled={state.triggerDisabled}
                          >
                            {state.label}
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              id={`tooltip-content-${appearance}-${variant}-${size}-${state.id}`}
                            >
                              {appearance} · {size} · 非交互说明文字
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip>
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
        Tab 聚焦即显示说明，Esc 关闭且焦点留在触发器。提示层通过 Portal
        挂载；只有非交互说明，操作内容应使用 Popover。Root 的 disabled
        仅禁用提示，Trigger 的 disabled 禁用控件。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="tooltip-live-heading"
      >
        <h3 id="tooltip-live-heading" class="text-md font-medium">
          受控状态与原生操作
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Tooltip
            open={open()}
            onOpenChange={setOpen}
            disabled={disabled()}
            appearance="mahjong"
          >
            <Tooltip.Trigger
              id="tooltip-live-trigger"
              disabled={disabled()}
              onClick={() => setCount((current) => current + 1)}
            >
              计数提示
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content id="tooltip-live-content">
                按 Enter 或空格增加计数；提示不会抢夺焦点。
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip>
          <Button
            id="tooltip-toggle-disabled"
            variant="outline"
            onClick={() => {
              setDisabled((current) => !current);
              setOpen(false);
            }}
          >
            {disabled() ? "启用控件" : "禁用控件"}
          </Button>
          <output
            id="tooltip-live-status"
            aria-live="polite"
            class="text-md text-fg-muted"
          >
            {open() ? "提示展开" : "提示关闭"} · 计数：{count()}
          </output>
        </div>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="tooltip-native-heading"
      >
        <h3 id="tooltip-native-heading" class="text-md font-medium">
          图标命名、属性与长说明
        </h3>
        <Tooltip appearance="keycap">
          <Tooltip.Trigger
            id="tooltip-icon-trigger"
            aria-label="帮助说明"
            title="Native title"
            class="w-10"
            data-demo="class-passthrough"
          >
            <span aria-hidden="true">?</span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content id="tooltip-long-content" class="text-left">
              很长的说明文字会换行，不包含链接或按钮。VeryLongUnbrokenTooltipTextForNarrowScreenVerificationWithoutOverflowOrClipping.
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip>
      </section>
    </div>
  );
}
