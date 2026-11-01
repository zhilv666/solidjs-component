import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Input } from "../Input";
import { Popover } from "./Popover";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["outline", "ghost"] as const;
const states = [
  { id: "enabled", label: "打开", disabled: false },
  { id: "disabled", label: "禁用", disabled: true },
] as const;

export function PopoverDemo() {
  const [open, setOpen] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [name, setName] = createSignal("Solid 用户");
  const [saved, setSaved] = createSignal("尚未保存");
  return (
    <div class="space-y-8">
      <AppearancePreview id="popover">
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
                      {(state) => {
                        const id = `popover-${appearance}-${variant}-${size}-${state.id}`;
                        return (
                          <Popover size={size} appearance={appearance}>
                            <Popover.Trigger
                              id={id}
                              variant={variant}
                              disabled={state.disabled}
                            >
                              {state.label}
                            </Popover.Trigger>
                            <Popover.Portal>
                              <Popover.Content id={`${id}-content`}>
                                <Popover.Title id={`${id}-title`}>
                                  {appearance} · {size}
                                </Popover.Title>
                                <Popover.Description id={`${id}-description`}>
                                  非模态弹层，Esc 或外部交互关闭。
                                </Popover.Description>
                                <div class="space-y-2">
                                  <label
                                    class="block text-md text-fg"
                                    for={`${id}-input`}
                                  >
                                    示例输入
                                  </label>
                                  <Input
                                    id={`${id}-input`}
                                    appearance={appearance}
                                    size={size}
                                    placeholder="可用键盘编辑"
                                  />
                                </div>
                                <div class="flex justify-end gap-3">
                                  <Popover.CloseButton
                                    id={`${id}-close-disabled`}
                                    aria-label="禁用的关闭按钮"
                                    variant={variant}
                                    disabled
                                  />
                                  <Popover.CloseButton
                                    id={`${id}-close`}
                                    aria-label="关闭示例弹层"
                                    variant={variant}
                                  />
                                </div>
                              </Popover.Content>
                            </Popover.Portal>
                          </Popover>
                        );
                      }}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Enter 或空格打开弹层，标题和说明由 Kobalte
        关联；关闭后焦点返回触发器。默认非模态，modal 由 Kobalte
        提供焦点陷阱、外部隐藏和滚动锁定。关闭图标要求 aria-label。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="popover-live-heading"
      >
        <h3 id="popover-live-heading" class="text-md font-medium">
          受控编辑与保存
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Popover open={open()} onOpenChange={setOpen} appearance="mahjong">
            <Popover.Trigger id="popover-live-trigger" disabled={disabled()}>
              编辑昵称
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content id="popover-live-content">
                <Popover.Title>编辑昵称</Popover.Title>
                <Popover.Description>
                  值由调用方保存，关闭再打开仍然保留。
                </Popover.Description>
                <form
                  class="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSaved(`已保存：${name()}`);
                    setOpen(false);
                  }}
                >
                  <div class="space-y-2">
                    <label class="block text-md text-fg" for="popover-name">
                      昵称
                    </label>
                    <Input
                      id="popover-name"
                      name="nickname"
                      value={name()}
                      onValueChange={setName}
                      appearance="mahjong"
                      required
                    />
                  </div>
                  <div class="flex items-center justify-end gap-3">
                    <Button id="popover-save" type="submit" variant="mahjong">
                      保存
                    </Button>
                    <Popover.CloseButton
                      id="popover-live-close"
                      aria-label="关闭昵称编辑"
                    />
                  </div>
                </form>
              </Popover.Content>
            </Popover.Portal>
          </Popover>
          <Button
            id="popover-toggle-disabled"
            variant="outline"
            onClick={() => {
              setDisabled((current) => !current);
              setOpen(false);
            }}
          >
            {disabled() ? "启用触发器" : "禁用触发器"}
          </Button>
          <output
            id="popover-live-status"
            aria-live="polite"
            class="text-md text-fg-muted"
          >
            {saved()}
          </output>
        </div>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="popover-modal-heading"
      >
        <h3 id="popover-modal-heading" class="text-md font-medium">
          模态与长内容
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Popover modal appearance="keycap">
            <Popover.Trigger id="popover-modal-trigger">
              模态弹层
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content id="popover-modal-content">
                <Popover.Title>模态示例</Popover.Title>
                <Popover.Description>
                  Tab 在内容中循环，Esc 关闭。
                </Popover.Description>
                <Input
                  id="popover-modal-input"
                  aria-label="模态输入"
                  appearance="keycap"
                />
                <Popover.CloseButton
                  id="popover-modal-close"
                  aria-label="关闭模态弹层"
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover>
          <Popover appearance="mahjong">
            <Popover.Trigger
              id="popover-native-trigger"
              title="Native title"
              class="text-left"
              data-demo="class-passthrough"
            >
              长内容
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                id="popover-long-content"
                class="text-left"
                title="Content title"
              >
                <Popover.Title>窄屏长内容</Popover.Title>
                <Popover.Description>
                  按可用视口限制宽高，长文本自动换行。
                </Popover.Description>
                <p class="text-md text-fg">
                  VeryLongUnbrokenPopoverTextForNarrowScreenVerificationWithoutHorizontalOverflowOrClippedControls.
                </p>
                <Popover.CloseButton
                  id="popover-long-close"
                  aria-label="关闭长内容弹层"
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover>
        </div>
      </section>
    </div>
  );
}
