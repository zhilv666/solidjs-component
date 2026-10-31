import { createSignal, For, onCleanup } from "solid-js";
import { Button } from "./Button";

const variants = ["solid", "outline", "ghost", "danger"] as const;
const sizes = ["sm", "md", "lg"] as const;
const states = [
  { id: "default", label: "常规 / Default", disabled: false, loading: false },
  { id: "disabled", label: "禁用 / Disabled", disabled: true, loading: false },
  { id: "loading", label: "加载 / Loading", disabled: false, loading: true },
] as const;

const comparisons = [
  { id: "keycap", label: "键帽 / Keycap", variant: "solid" },
  { id: "mahjong", label: "麻将 / Mahjong", variant: "mahjong" },
] as const;

export function ButtonDemo() {
  const [count, setCount] = createSignal(0);
  const [disabled, setDisabled] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal("尚未保存");
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const save = () => {
    setLoading(true);
    setSaveMessage("正在保存…");
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      setLoading(false);
      setSaveMessage("保存完成");
    }, 1000);
  };

  onCleanup(() => {
    if (saveTimer !== undefined) clearTimeout(saveTimer);
  });

  return (
    <div class="space-y-8">
      <section
        id="button-style-comparison"
        class="space-y-4"
        aria-labelledby="button-style-comparison-heading"
      >
        <h3 id="button-style-comparison-heading" class="text-md font-medium">
          立体样式对比
        </h3>
        <p class="text-md text-fg-muted">
          保留现有键帽样式，新增瓷质牌面、绿色厚底与细边倒角的麻将实验样式。
          深色模式牌面跟随主题；按住鼠标或空格时底座收短，不做位移或缩放。
        </p>
        <div class="grid gap-6 lg:grid-cols-2">
          <For each={comparisons}>
            {(style) => (
              <section
                class="space-y-4 rounded-md border border-solid border-border p-4"
                aria-labelledby={`button-${style.id}-comparison-heading`}
                data-demo-style={style.id}
              >
                <h4
                  id={`button-${style.id}-comparison-heading`}
                  class="text-md font-medium"
                >
                  {style.label}
                </h4>
                <For each={states}>
                  {(state) => (
                    <div class="space-y-2">
                      <p class="text-md text-fg-muted">{state.label}</p>
                      <div class="flex flex-wrap items-center gap-3">
                        <For each={sizes}>
                          {(size) => (
                            <Button
                              variant={style.variant}
                              size={size}
                              disabled={state.disabled}
                              loading={state.loading}
                              aria-label={`样式对比 ${style.id} ${state.label} ${size}`}
                            >
                              {size} · Button
                            </Button>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </section>
            )}
          </For>
        </div>
      </section>

      <p class="text-md text-fg-muted">
        solid、outline、danger 使用键帽式底座，按住鼠标或空格时阴影收短；ghost
        保持轻量。按钮本身不做位移或缩放。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-4"
            aria-labelledby={`button-${state.id}-heading`}
          >
            <h3 id={`button-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="space-y-3">
              <For each={variants}>
                {(variant) => (
                  <div class="flex flex-wrap items-center gap-3">
                    <h4 class="w-20 shrink-0 text-md text-fg-muted">
                      {variant}
                    </h4>
                    <For each={sizes}>
                      {(size) => (
                        <Button
                          variant={variant}
                          size={size}
                          disabled={state.disabled}
                          loading={state.loading}
                          aria-label={`${state.label} ${variant} ${size}`}
                        >
                          {size} · Button
                        </Button>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </section>
        )}
      </For>

      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="button-interactive-heading"
      >
        <h3 id="button-interactive-heading" class="text-md font-medium">
          交互与响应性
        </h3>
        <p class="text-md text-fg-muted">
          使用 Tab 聚焦，Enter 或空格激活按钮。
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="counter-button"
            disabled={disabled()}
            onClick={() => setCount((value) => value + 1)}
          >
            点击计数
          </Button>
          <Button
            id="mahjong-counter-button"
            variant="mahjong"
            disabled={disabled()}
            onClick={() => setCount((value) => value + 1)}
          >
            麻将计数
          </Button>
          <Button
            variant="ghost"
            aria-pressed={disabled()}
            onClick={() => setDisabled((value) => !value)}
          >
            {disabled() ? "启用计数按钮" : "禁用计数按钮"}
          </Button>
          <Button
            variant="outline"
            aria-label="新增项目并增加计数"
            onClick={() => setCount((value) => value + 1)}
          >
            <span aria-hidden="true" class="text-lg">
              ＋
            </span>
          </Button>
          <output aria-live="polite" class="text-md text-fg">
            计数：{count()}
          </output>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button id="save-button" loading={loading()} onClick={save}>
            {loading() ? "保存中" : "模拟保存"}
          </Button>
          <Button
            id="mahjong-save-button"
            variant="mahjong"
            loading={loading()}
            onClick={save}
          >
            {loading() ? "麻将保存中" : "麻将保存"}
          </Button>
          <p aria-live="polite" class="text-md text-fg-muted">
            {saveMessage()}
          </p>
        </div>
      </section>

      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="button-class-heading"
      >
        <h3 id="button-class-heading" class="text-md font-medium">
          class 与原生属性透传
        </h3>
        <Button
          variant="outline"
          class="w-full"
          title="Native title attribute"
          data-demo="class-passthrough"
        >
          全宽按钮 / class="w-full"
        </Button>
      </section>
    </div>
  );
}
