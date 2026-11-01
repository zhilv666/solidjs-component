import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Textarea } from "./Textarea";
import { AppearancePreview } from "../../demo/AppearancePreview";

const sizes = ["sm", "md", "lg"] as const;
const states = [
  {
    id: "default",
    label: "常规 / Default",
    invalid: false,
    disabled: false,
    readOnly: false,
    value: "",
  },
  {
    id: "invalid",
    label: "错误 / Invalid",
    invalid: true,
    disabled: false,
    readOnly: false,
    value: "请检查此内容\nPlease review.",
  },
  {
    id: "disabled",
    label: "禁用 / Disabled",
    invalid: false,
    disabled: true,
    readOnly: false,
    value: "不可编辑\nDisabled",
  },
  {
    id: "readonly",
    label: "只读 / Read only",
    invalid: false,
    disabled: false,
    readOnly: true,
    value: "可选择和复制\nRead only",
  },
] as const;

export function TextareaDemo() {
  const [value, setValue] = createSignal("第一行\nSecond line");
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [readOnly, setReadOnly] = createSignal(false);
  const [autoResize, setAutoResize] = createSignal(false);
  const [inputEvents, setInputEvents] = createSignal(0);
  const [changeEvents, setChangeEvents] = createSignal(0);
  const [message, setMessage] = createSignal("尚未提交");

  return (
    <div class="space-y-8">
      <AppearancePreview id="textarea">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={states}>
              {(state) => (
                <div class="min-w-0 space-y-2">
                  <label
                    for={`textarea-${appearance}-${state.id}-${size}`}
                    class="block text-md text-fg"
                  >
                    {state.label} · {size}
                  </label>
                  <Textarea
                    id={`textarea-${appearance}-${state.id}-${size}`}
                    appearance={appearance}
                    size={size}
                    disabled={state.disabled}
                    invalid={state.invalid}
                    readOnly={state.readOnly}
                    defaultValue={state.value}
                    placeholder="请输入多行文本 / Multiline text"
                    aria-describedby={
                      state.invalid
                        ? `textarea-${appearance}-${state.id}-${size}-error`
                        : undefined
                    }
                  />
                  <Show when={state.invalid}>
                    <p
                      id={`textarea-${appearance}-${state.id}-${size}-error`}
                      class="text-md text-danger"
                    >
                      内容校验未通过，请检查后重试。
                    </p>
                  </Show>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Enter 插入换行。默认可纵向调整大小；启用自动增高后由 Kobalte
        按内容计算高度，不做高度动画。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-4"
            aria-labelledby={`textarea-${state.id}-heading`}
          >
            <h3 id={`textarea-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 space-y-2">
                    <label
                      for={`textarea-${state.id}-${size}`}
                      class="block text-md text-fg"
                    >
                      {size} · Textarea
                    </label>
                    <Textarea
                      id={`textarea-${state.id}-${size}`}
                      size={size}
                      invalid={state.invalid}
                      disabled={state.disabled}
                      readOnly={state.readOnly}
                      defaultValue={state.value}
                      placeholder="请输入多行文本 / Multiline text"
                      aria-label={`${state.label} ${size}`}
                      aria-describedby={
                        state.invalid ? `textarea-${size}-error` : undefined
                      }
                    />
                    <Show when={state.invalid}>
                      <p
                        id={`textarea-${size}-error`}
                        class="text-md text-danger"
                      >
                        内容校验未通过，请检查后重试。
                      </p>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </section>
        )}
      </For>

      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="textarea-interactive-heading"
      >
        <h3 id="textarea-interactive-heading" class="text-md font-medium">
          受控值与自动增高
        </h3>
        <div class="space-y-2">
          <label for="textarea-controlled" class="block text-md text-fg">
            实时多行输入
          </label>
          <Textarea
            id="textarea-controlled"
            value={value()}
            onValueChange={setValue}
            onInput={() => setInputEvents((count) => count + 1)}
            onChange={() => setChangeEvents((count) => count + 1)}
            invalid={invalid()}
            disabled={disabled()}
            readOnly={readOnly()}
            autoResize={autoResize()}
            aria-describedby={
              invalid() ? "textarea-help textarea-error" : "textarea-help"
            }
          />
          <p id="textarea-help" class="text-md text-fg-muted">
            输入多行内容后启用自动增高，观察高度随内容变化。
          </p>
          <Show when={invalid()}>
            <p id="textarea-error" class="text-md text-danger">
              当前字段被标记为错误。
            </p>
          </Show>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            aria-pressed={invalid()}
            onClick={() => setInvalid((current) => !current)}
          >
            {invalid() ? "清除错误" : "标记为错误"}
          </Button>
          <Button
            variant="outline"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用输入" : "禁用输入"}
          </Button>
          <Button
            variant="outline"
            aria-pressed={readOnly()}
            onClick={() => setReadOnly((current) => !current)}
          >
            {readOnly() ? "解除只读" : "设为只读"}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={autoResize()}
            onClick={() => setAutoResize((current) => !current)}
          >
            {autoResize() ? "关闭自动增高" : "启用自动增高"}
          </Button>
          <Button variant="ghost" onClick={() => setValue("")}>
            清空受控值
          </Button>
        </div>
        <output
          id="textarea-value-output"
          aria-live="polite"
          class="block whitespace-pre-wrap text-md text-fg"
        >
          {value() || "（空）"}
        </output>
        <p id="textarea-event-output" class="text-md text-fg-muted">
          原生 input：{inputEvents()} 次，change：{changeEvents()} 次
        </p>
      </section>

      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="textarea-native-heading"
      >
        <h3 id="textarea-native-heading" class="text-md font-medium">
          原生属性、class 与表单
        </h3>
        <form
          id="textarea-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setMessage(`提交内容：${String(data.get("notes") ?? "")}`);
          }}
          onReset={() => setMessage("已重置为默认内容")}
        >
          <div class="space-y-2">
            <label for="textarea-notes" class="block text-md text-fg">
              备注（必填）
            </label>
            <Textarea
              id="textarea-notes"
              name="notes"
              rows={4}
              required
              defaultValue={"SolidJS\n组件库"}
              maxlength={200}
              onInput={[
                (label: string, event) =>
                  setMessage(`${label}：${event.target.value}`),
                "正在编辑",
              ]}
              title="Native title attribute"
              class="w-full"
              data-demo="class-passthrough"
              aria-describedby="textarea-notes-help"
            />
            <p id="textarea-notes-help" class="text-md text-fg-muted">
              支持 rows、maxlength、原生事件与 class 透传。Enter
              只换行，点击提交在本页展示表单值。
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交示例</Button>
            <Button type="reset" variant="outline">
              重置示例
            </Button>
          </div>
          <output
            id="textarea-form-output"
            aria-live="polite"
            class="block whitespace-pre-wrap text-md text-fg"
          >
            {message()}
          </output>
        </form>
      </section>
    </div>
  );
}
