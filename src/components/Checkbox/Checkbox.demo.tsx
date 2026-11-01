import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Checkbox } from "./Checkbox";
import { AppearancePreview } from "../../demo/AppearancePreview";

const sizes = ["sm", "md", "lg"] as const;
const states = [
  { id: "unchecked", label: "未选中 / Unchecked", checked: false },
  { id: "checked", label: "选中 / Checked", checked: true },
  { id: "mixed", label: "半选 / Mixed", checked: false, indeterminate: true },
  { id: "invalid", label: "错误 / Invalid", checked: false, invalid: true },
  { id: "disabled", label: "禁用 / Disabled", checked: false, disabled: true },
  {
    id: "disabled-checked",
    label: "禁用且选中 / Disabled checked",
    checked: true,
    disabled: true,
  },
  { id: "readonly", label: "只读 / Read only", checked: true, readOnly: true },
] as const;

export function CheckboxDemo() {
  const [checked, setChecked] = createSignal(false);
  const [indeterminate, setIndeterminate] = createSignal(true);
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [readOnly, setReadOnly] = createSignal(false);
  const [changes, setChanges] = createSignal(0);
  const [message, setMessage] = createSignal("尚未提交");

  return (
    <div class="space-y-8">
      <AppearancePreview id="checkbox">
        {(appearance, size) => (
          <div class="space-y-3">
            <For each={states}>
              {(state) => (
                <div class="min-w-0 space-y-2">
                  <Checkbox
                    id={`checkbox-${appearance}-${state.id}-${size}`}
                    appearance={appearance}
                    size={size}
                    defaultChecked={state.checked}
                    indeterminate={
                      "indeterminate" in state && state.indeterminate
                    }
                    invalid={"invalid" in state && state.invalid}
                    disabled={"disabled" in state && state.disabled}
                    readOnly={"readOnly" in state && state.readOnly}
                    aria-describedby={
                      state.id === "invalid"
                        ? `checkbox-${appearance}-${size}-error`
                        : undefined
                    }
                  >
                    {state.label} · {size}
                  </Checkbox>
                  <Show when={state.id === "invalid"}>
                    <p
                      id={`checkbox-${appearance}-${size}-error`}
                      class="text-md text-danger"
                    >
                      请确认选项后继续。
                    </p>
                  </Show>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Tab
        聚焦，空格切换。标签可点击；半选是独立展示状态，由使用方决定何时清除。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-3"
            aria-labelledby={`checkbox-${state.id}-heading`}
          >
            <h3 id={`checkbox-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 space-y-2">
                    <Checkbox
                      id={`checkbox-${state.id}-${size}`}
                      size={size}
                      defaultChecked={state.checked}
                      indeterminate={
                        "indeterminate" in state && state.indeterminate
                      }
                      invalid={"invalid" in state && state.invalid}
                      disabled={"disabled" in state && state.disabled}
                      readOnly={"readOnly" in state && state.readOnly}
                      aria-describedby={
                        state.id === "invalid"
                          ? `checkbox-${size}-error`
                          : undefined
                      }
                    >
                      {size} · Checkbox
                    </Checkbox>
                    <Show when={state.id === "invalid"}>
                      <p
                        id={`checkbox-${size}-error`}
                        class="text-md text-danger"
                      >
                        请确认选项后继续。
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
        aria-labelledby="checkbox-interactive-heading"
      >
        <h3 id="checkbox-interactive-heading" class="text-md font-medium">
          受控值与响应性
        </h3>
        <Checkbox
          id="checkbox-controlled"
          checked={checked()}
          indeterminate={indeterminate()}
          invalid={invalid()}
          disabled={disabled()}
          readOnly={readOnly()}
          onCheckedChange={(next) => {
            setChecked(next);
            setIndeterminate(false);
            setChanges((count) => count + 1);
          }}
          aria-describedby={
            invalid()
              ? "checkbox-controlled-help checkbox-controlled-error"
              : "checkbox-controlled-help"
          }
        >
          接收组件库更新 / Receive updates
        </Checkbox>
        <p id="checkbox-controlled-help" class="text-md text-fg-muted">
          首次切换清除半选。状态回调与原生事件分别保留。
        </p>
        <Show when={invalid()}>
          <p id="checkbox-controlled-error" class="text-md text-danger">
            当前选项被标记为错误。
          </p>
        </Show>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setChecked((current) => !current)}
          >
            外部切换选中
          </Button>
          <Button
            variant="outline"
            aria-pressed={indeterminate()}
            onClick={() => setIndeterminate((current) => !current)}
          >
            {indeterminate() ? "清除半选" : "设为半选"}
          </Button>
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
            {disabled() ? "启用选项" : "禁用选项"}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={readOnly()}
            onClick={() => setReadOnly((current) => !current)}
          >
            {readOnly() ? "解除只读" : "设为只读"}
          </Button>
        </div>
        <output
          id="checkbox-state-output"
          aria-live="polite"
          class="block text-md text-fg"
        >
          选中：{String(checked())}，半选：{String(indeterminate())}，状态回调：
          {changes()} 次
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="checkbox-native-heading"
      >
        <h3 id="checkbox-native-heading" class="text-md font-medium">
          原生属性、class 与表单
        </h3>
        <form
          id="checkbox-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setMessage(
              `提交值：consent=${String(data.get("consent") ?? "未选中")}，newsletter=${String(data.get("newsletter") ?? "未选中")}`,
            );
          }}
          onReset={() => setMessage("已重置：必填项未选中，订阅选中")}
        >
          <div class="flex flex-col items-start gap-2">
            <Checkbox
              id="checkbox-consent"
              name="consent"
              value="accepted"
              required
              aria-describedby="checkbox-consent-help"
            >
              我已阅读使用约定（必填）
            </Checkbox>
            <p id="checkbox-consent-help" class="text-md text-fg-muted">
              未选中必填项时，浏览器阻止提交。
            </p>
            <Checkbox
              id="checkbox-newsletter"
              name="newsletter"
              value="email"
              defaultChecked
              class="w-full"
              title="Native title attribute"
              data-demo="class-passthrough"
              onInput={[
                (prefix: string, event) =>
                  setMessage(`${prefix}：${String(event.target.checked)}`),
                "订阅选中",
              ]}
            >
              接收邮件通知（原生属性与绑定事件示例）
            </Checkbox>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交示例</Button>
            <Button type="reset" variant="outline">
              重置示例
            </Button>
          </div>
          <output
            id="checkbox-form-output"
            aria-live="polite"
            class="block text-md text-fg"
          >
            {message()}
          </output>
        </form>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="checkbox-label-heading"
      >
        <h3 id="checkbox-label-heading" class="text-md font-medium">
          仅控件与长标签
        </h3>
        <Checkbox id="checkbox-icon-only" aria-label="允许自动保存" />
        <Checkbox class="w-full">
          允许在桌面与窄屏上自动保存草稿 / Automatically save drafts across
          desktop and narrow screens.
        </Checkbox>
      </section>
    </div>
  );
}
