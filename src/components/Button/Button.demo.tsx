import { createSignal, For, onCleanup } from "solid-js";
import { Button } from "./Button";

const variants = ["solid", "outline", "ghost", "danger"] as const;
const sizes = ["sm", "md", "lg"] as const;
const states = [
  { id: "default", label: "常规 / Default", disabled: false, loading: false },
  { id: "disabled", label: "禁用 / Disabled", disabled: true, loading: false },
  { id: "loading", label: "加载 / Loading", disabled: false, loading: true },
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
