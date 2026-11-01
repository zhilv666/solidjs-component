import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Select, type SelectOption } from "./Select";
import { AppearancePreview } from "../../demo/AppearancePreview";

const sizes = ["sm", "md", "lg"] as const;
const options: readonly SelectOption[] = [
  { value: "solid", label: "SolidJS" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue", disabled: true },
  { value: "svelte", label: "Svelte" },
];
const states = [
  {
    id: "empty",
    label: "占位 / Placeholder",
    invalid: false,
    disabled: false,
    value: undefined,
  },
  {
    id: "selected",
    label: "已选择 / Selected",
    invalid: false,
    disabled: false,
    value: "solid",
  },
  {
    id: "invalid",
    label: "错误 / Invalid",
    invalid: true,
    disabled: false,
    value: undefined,
  },
  {
    id: "disabled",
    label: "禁用 / Disabled",
    invalid: false,
    disabled: true,
    value: "solid",
  },
] as const;

export function SelectDemo() {
  const [value, setValue] = createSignal<string | null>(null);
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [changes, setChanges] = createSignal(0);
  const [message, setMessage] = createSignal("尚未提交");

  return (
    <div class="space-y-8">
      <AppearancePreview id="select">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={states}>
              {(state) => (
                <div class="min-w-0 space-y-2">
                  <Select
                    id={`select-${appearance}-${state.id}-${size}`}
                    appearance={appearance}
                    size={size}
                    options={options}
                    defaultValue={state.value}
                    invalid={state.invalid}
                    disabled={state.disabled}
                    aria-describedby={
                      state.invalid
                        ? `select-${appearance}-${state.id}-${size}-error`
                        : undefined
                    }
                  >
                    {state.label} · {size}
                  </Select>
                  <Show when={state.invalid}>
                    <p
                      id={`select-${appearance}-${state.id}-${size}-error`}
                      class="text-md text-danger"
                    >
                      请选择一个框架。
                    </p>
                  </Show>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Tab 聚焦，Enter / 空格 / 上下方向键展开；列表内方向键导航，Enter
        选择，Esc 关闭。
        支持首字母定位，禁用选项会被跳过。本组件为单选下拉，不含搜索输入或多选。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-3"
            aria-labelledby={`select-${state.id}-heading`}
          >
            <h3 id={`select-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 space-y-2">
                    <Select
                      id={`select-${state.id}-${size}`}
                      size={size}
                      options={options}
                      defaultValue={state.value}
                      invalid={state.invalid}
                      disabled={state.disabled}
                      aria-describedby={
                        state.invalid
                          ? `select-${state.id}-${size}-error`
                          : undefined
                      }
                    >
                      {size} · Framework
                    </Select>
                    <Show when={state.invalid}>
                      <p
                        id={`select-${state.id}-${size}-error`}
                        class="text-md text-danger"
                      >
                        请选择一个框架。
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
        aria-labelledby="select-controlled-heading"
      >
        <h3 id="select-controlled-heading" class="text-md font-medium">
          受控值与响应性
        </h3>
        <Select
          id="select-controlled"
          options={options}
          value={value()}
          invalid={invalid()}
          disabled={disabled()}
          onValueChange={(next) => {
            setValue(next);
            setChanges((count) => count + 1);
          }}
          aria-describedby={
            invalid()
              ? "select-controlled-help select-controlled-error"
              : "select-controlled-help"
          }
        >
          选择框架 / Framework
        </Select>
        <p id="select-controlled-help" class="text-md text-fg-muted">
          value 使用选项的字符串键；null 表示受控空值，undefined 表示非受控。
        </p>
        <Show when={invalid()}>
          <p id="select-controlled-error" class="text-md text-danger">
            当前字段被标记为错误。
          </p>
        </Show>
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setValue("react")}>
            外部选择 React
          </Button>
          <Button variant="outline" onClick={() => setValue(null)}>
            清空选择
          </Button>
          <Button
            variant="outline"
            aria-pressed={invalid()}
            onClick={() => setInvalid((current) => !current)}
          >
            {invalid() ? "清除错误" : "标记为错误"}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用选择" : "禁用选择"}
          </Button>
        </div>
        <output
          id="select-state-output"
          aria-live="polite"
          class="block text-md text-fg"
        >
          当前值：{value() ?? "空"}，交互回调：{changes()} 次
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="select-form-heading"
      >
        <h3 id="select-form-heading" class="text-md font-medium">
          原生表单、事件与 class
        </h3>
        <form
          id="select-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(
              `提交值：${String(new FormData(event.currentTarget).get("framework"))}`,
            );
          }}
          onReset={() => setMessage("已重置为空值")}
        >
          <Select
            id="select-framework"
            options={options}
            name="framework"
            required
            class="w-full"
            data-demo="class-passthrough"
            title="Native trigger title"
            onChange={[
              (prefix: string, event) =>
                setMessage(`${prefix}：${event.currentTarget.value}`),
              "原生选择",
            ]}
            aria-describedby="select-framework-help"
          >
            使用框架（必选）
          </Select>
          <p id="select-framework-help" class="text-md text-fg-muted">
            空值阻止提交；选择后可提交，重置恢复占位。原生事件由 Kobalte 隐藏
            select 发出，触发按钮的原生属性照常透传。
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交示例</Button>
            <Button type="reset" variant="outline">
              重置示例
            </Button>
          </div>
          <output
            id="select-form-output"
            aria-live="polite"
            class="block text-md text-fg"
          >
            {message()}
          </output>
        </form>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="select-edge-heading"
      >
        <h3 id="select-edge-heading" class="text-md font-medium">
          空列表与长标签
        </h3>
        <Select
          id="select-no-options"
          options={[]}
          placeholder="暂无可选项 / No options"
          aria-label="空列表示例"
        />
        <Select
          id="select-long-label"
          options={[
            {
              value: "long",
              label:
                "用于验证窄屏布局的长选项标签 / A long option label for checking layout on narrow screens",
            },
          ]}
          defaultValue="long"
        >
          长选项标签 / Long label
        </Select>
      </section>
    </div>
  );
}
