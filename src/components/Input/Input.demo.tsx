import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Input } from "./Input";

const sizes = ["sm", "md", "lg"] as const;
const states = [
  {
    id: "default",
    label: "常规 / Default",
    disabled: false,
    invalid: false,
    readOnly: false,
    value: "",
  },
  {
    id: "invalid",
    label: "错误 / Invalid",
    disabled: false,
    invalid: true,
    readOnly: false,
    value: "invalid-value",
  },
  {
    id: "disabled",
    label: "禁用 / Disabled",
    disabled: true,
    invalid: false,
    readOnly: false,
    value: "不可编辑 / Disabled",
  },
  {
    id: "readonly",
    label: "只读 / Read only",
    disabled: false,
    invalid: false,
    readOnly: true,
    value: "可选择和复制 / Read only",
  },
] as const;

export function InputDemo() {
  const [value, setValue] = createSignal("SolidJS");
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [readOnly, setReadOnly] = createSignal(false);
  const [withSlots, setWithSlots] = createSignal(false);
  const [large, setLarge] = createSignal(false);
  const [inputEvents, setInputEvents] = createSignal(0);
  const [changeEvents, setChangeEvents] = createSignal(0);
  const [formMessage, setFormMessage] = createSignal("尚未提交");

  return (
    <div class="space-y-8">
      <p class="text-md text-fg-muted">
        单一边框样式，三种尺寸。前后缀为非交互内容；使用 Tab 聚焦，输入文字，
        只读字段仍可聚焦、选择和复制。
      </p>

      <For each={states}>
        {(state) => (
          <section
            class="space-y-4"
            aria-labelledby={`input-${state.id}-heading`}
          >
            <h3 id={`input-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 space-y-2">
                    <label
                      for={`input-${state.id}-${size}`}
                      class="block text-md text-fg"
                    >
                      {size} · Input
                    </label>
                    <Input
                      id={`input-${state.id}-${size}`}
                      size={size}
                      disabled={state.disabled}
                      invalid={state.invalid}
                      readOnly={state.readOnly}
                      defaultValue={state.value}
                      placeholder="请输入文字 / Type here"
                      aria-label={`${state.label} ${size}`}
                      aria-describedby={
                        state.invalid
                          ? `input-${state.id}-${size}-error`
                          : undefined
                      }
                    />
                    <Show when={state.invalid}>
                      <p
                        id={`input-${state.id}-${size}-error`}
                        class="text-md text-danger"
                      >
                        校验未通过，请检查输入内容。
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
        aria-labelledby="input-slots-heading"
      >
        <h3 id="input-slots-heading" class="text-md font-medium">
          前后缀插槽
        </h3>
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="min-w-0 space-y-2">
            <label for="input-prefix" class="block text-md text-fg">
              网站地址（HTTPS）
            </label>
            <Input
              id="input-prefix"
              prefix="https://"
              placeholder="example.com"
              aria-describedby="input-prefix-help"
            />
            <p id="input-prefix-help" class="text-md text-fg-muted">
              只需填写域名，不包含 https://。
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <label for="input-suffix" class="block text-md text-fg">
              金额（人民币）
            </label>
            <Input
              id="input-suffix"
              suffix="元"
              inputmode="decimal"
              placeholder="0.00"
              aria-describedby="input-suffix-help"
            />
            <p id="input-suffix-help" class="text-md text-fg-muted">
              单位为元，支持小数输入。
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <label for="input-both" class="block text-md text-fg">
              站点名称（@ 名称 .dev）
            </label>
            <Input
              id="input-both"
              prefix={<span>@</span>}
              suffix={<span>.dev</span>}
              placeholder="your-name"
              aria-describedby="input-both-help"
            />
            <p id="input-both-help" class="text-md text-fg-muted">
              插槽支持文本与 JSX，不增加 Tab 停靠点。
            </p>
          </div>
        </div>
      </section>

      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="input-interactive-heading"
      >
        <h3 id="input-interactive-heading" class="text-md font-medium">
          受控值与响应性
        </h3>
        <div class="space-y-2">
          <label for="input-controlled" class="block text-md text-fg">
            实时输入
          </label>
          <Input
            id="input-controlled"
            value={value()}
            onValueChange={setValue}
            onInput={() => setInputEvents((count) => count + 1)}
            onChange={() => setChangeEvents((count) => count + 1)}
            size={large() ? "lg" : "md"}
            invalid={invalid()}
            disabled={disabled()}
            readOnly={readOnly()}
            prefix={withSlots() ? "@" : undefined}
            suffix={withSlots() ? ".dev" : undefined}
            aria-describedby={
              invalid()
                ? "input-controlled-help input-controlled-error"
                : "input-controlled-help"
            }
          />
          <p id="input-controlled-help" class="text-md text-fg-muted">
            onValueChange 更新受控值；原生 onInput 逐次触发，onChange
            在提交编辑（如失焦）时触发。
          </p>
          <Show when={invalid()}>
            <p id="input-controlled-error" class="text-md text-danger">
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
            aria-pressed={withSlots()}
            onClick={() => setWithSlots((current) => !current)}
          >
            {withSlots() ? "隐藏前后缀" : "显示前后缀"}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={large()}
            onClick={() => setLarge((current) => !current)}
          >
            {large() ? "切换到中尺寸" : "切换到大尺寸"}
          </Button>
          <Button variant="ghost" onClick={() => setValue("")}>
            清空受控值
          </Button>
        </div>
        <output
          id="input-value-output"
          aria-live="polite"
          class="block text-md"
        >
          当前值：{value() || "（空）"}
        </output>
        <p id="input-event-output" class="text-md text-fg-muted">
          原生 input：{inputEvents()} 次，change：{changeEvents()} 次
        </p>
      </section>

      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="input-native-heading"
      >
        <h3 id="input-native-heading" class="text-md font-medium">
          原生属性、class 与表单
        </h3>
        <form
          id="input-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setFormMessage(`提交值：${String(data.get("account") ?? "")}`);
          }}
          onReset={() => setFormMessage("已重置为 SolidJS")}
        >
          <div class="space-y-2">
            <label for="input-account" class="block text-md text-fg">
              用户名（必填）
            </label>
            <Input
              id="input-account"
              name="account"
              required
              defaultValue="SolidJS"
              onInput={[
                (label: string, event) =>
                  setFormMessage(`${label}：${event.target.value}`),
                "正在编辑",
              ]}
              maxlength={40}
              autocomplete="username"
              title="Native title attribute"
              data-demo="class-passthrough"
              class="w-full"
              aria-describedby="input-account-help"
            />
            <p id="input-account-help" class="text-md text-fg-muted">
              class 作用于原生 input；最多 40
              个字符。提交只在本页展示，不发送请求。
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交示例</Button>
            <Button type="reset" variant="outline">
              重置示例
            </Button>
            <output
              id="input-form-output"
              aria-live="polite"
              class="text-md text-fg"
            >
              {formMessage()}
            </output>
          </div>
        </form>
      </section>
    </div>
  );
}
