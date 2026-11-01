import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Input } from "../Input";
import { Dialog } from "./Dialog";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["outline", "ghost"] as const;
const states = [
  { id: "enabled", label: "打开", disabled: false },
  { id: "disabled", label: "禁用", disabled: true },
] as const;

export function DialogDemo() {
  const [open, setOpen] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [name, setName] = createSignal("Solid 用户");
  const [saved, setSaved] = createSignal("尚未保存");
  return (
    <div class="space-y-8">
      <AppearancePreview id="dialog">
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
                        const id = `dialog-${appearance}-${variant}-${size}-${state.id}`;
                        return (
                          <Dialog size={size} appearance={appearance}>
                            <Dialog.Trigger
                              id={id}
                              variant={variant}
                              disabled={state.disabled}
                            >
                              {state.label}
                            </Dialog.Trigger>
                            <Dialog.Portal>
                              <Dialog.Overlay id={`${id}-overlay`} />
                              <Dialog.Content id={`${id}-content`}>
                                <Dialog.Title id={`${id}-title`}>
                                  {appearance} · {size}
                                </Dialog.Title>
                                <Dialog.Description id={`${id}-description`}>
                                  模态对话框，Tab 在内容中循环，Esc
                                  或点击遮罩关闭。
                                </Dialog.Description>
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
                                  <Dialog.CloseButton
                                    id={`${id}-close-disabled`}
                                    aria-label="禁用的关闭按钮"
                                    variant={variant}
                                    disabled
                                  />
                                  <Dialog.CloseButton
                                    id={`${id}-close`}
                                    aria-label="关闭示例对话框"
                                    variant={variant}
                                  />
                                </div>
                              </Dialog.Content>
                            </Dialog.Portal>
                          </Dialog>
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
        Enter 或空格打开，关闭后焦点返回触发器。遮罩与居中面板不新增 Tab
        停靠点； 标题、说明关联、焦点陷阱、滚动锁定与外部隐藏全部交由 Kobalte。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="dialog-live-heading"
      >
        <h3 id="dialog-live-heading" class="text-md font-medium">
          受控编辑与保存
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Dialog open={open()} onOpenChange={setOpen} appearance="mahjong">
            <Dialog.Trigger id="dialog-live-trigger" disabled={disabled()}>
              编辑昵称
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay id="dialog-live-overlay" />
              <Dialog.Content id="dialog-live-content">
                <Dialog.Title>编辑昵称</Dialog.Title>
                <Dialog.Description>
                  值由调用方保存，关闭再打开仍然保留。
                </Dialog.Description>
                <form
                  class="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSaved(`已保存：${name()}`);
                    setOpen(false);
                  }}
                >
                  <div class="space-y-2">
                    <label class="block text-md text-fg" for="dialog-name">
                      昵称
                    </label>
                    <Input
                      id="dialog-name"
                      name="nickname"
                      value={name()}
                      onValueChange={setName}
                      appearance="mahjong"
                      required
                    />
                  </div>
                  <div class="flex items-center justify-end gap-3">
                    <Button id="dialog-save" type="submit" variant="mahjong">
                      保存
                    </Button>
                    <Dialog.CloseButton
                      id="dialog-live-close"
                      aria-label="关闭昵称编辑"
                    />
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
          <Button
            id="dialog-toggle-disabled"
            variant="outline"
            onClick={() => {
              setDisabled((current) => !current);
              setOpen(false);
            }}
          >
            {disabled() ? "启用触发器" : "禁用触发器"}
          </Button>
          <output
            id="dialog-live-status"
            aria-live="polite"
            class="text-md text-fg-muted"
          >
            {saved()}
          </output>
        </div>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="dialog-options-heading"
      >
        <h3 id="dialog-options-heading" class="text-md font-medium">
          非模态与长内容
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Dialog modal={false} appearance="keycap">
            <Dialog.Trigger id="dialog-nonmodal-trigger">
              非模态对话框
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Content id="dialog-nonmodal-content">
                <Dialog.Title>非模态示例</Dialog.Title>
                <Dialog.Description>
                  外部仍可操作，不显示遮罩；外部交互关闭且不抢回焦点。
                </Dialog.Description>
                <Input
                  id="dialog-nonmodal-input"
                  aria-label="非模态输入"
                  appearance="keycap"
                />
                <Dialog.CloseButton
                  id="dialog-nonmodal-close"
                  aria-label="关闭非模态对话框"
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
          <Dialog size="lg" appearance="mahjong">
            <Dialog.Trigger
              id="dialog-native-trigger"
              title="Native title"
              class="text-left"
              data-demo="class-passthrough"
            >
              长内容
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay id="dialog-long-overlay" />
              <Dialog.Content
                id="dialog-long-content"
                class="text-left"
                title="Content title"
              >
                <Dialog.Title>窄屏长内容</Dialog.Title>
                <Dialog.Description>
                  面板限制在视口内；长内容在面板内滚动，关闭按钮始终可通过键盘到达。
                </Dialog.Description>
                <Input
                  id="dialog-long-input"
                  aria-label="长内容示例输入"
                  appearance="mahjong"
                  placeholder="Tab 到末尾关闭按钮"
                />
                <For each={Array.from({ length: 12 }, (_, index) => index + 1)}>
                  {(index) => (
                    <p class="text-md text-fg">
                      {index} ·
                      VeryLongUnbrokenDialogTextForNarrowScreenVerificationWithoutHorizontalOverflowOrClippedControls.
                    </p>
                  )}
                </For>
                <Dialog.CloseButton
                  id="dialog-long-close"
                  aria-label="关闭长内容对话框"
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
