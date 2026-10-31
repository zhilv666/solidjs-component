import { createSignal, For, Show } from "solid-js";
import { Button } from "../Button";
import { Switch } from "./Switch";

const sizes = ["sm", "md", "lg"] as const;
const states = [
  {
    id: "off",
    label: "关闭 / Off",
    checked: false,
    invalid: false,
    disabled: false,
    readOnly: false,
  },
  {
    id: "on",
    label: "开启 / On",
    checked: true,
    invalid: false,
    disabled: false,
    readOnly: false,
  },
  {
    id: "invalid",
    label: "错误 / Invalid",
    checked: false,
    invalid: true,
    disabled: false,
    readOnly: false,
  },
  {
    id: "invalid-on",
    label: "错误且开启 / Invalid on",
    checked: true,
    invalid: true,
    disabled: false,
    readOnly: false,
  },
  {
    id: "disabled",
    label: "禁用 / Disabled",
    checked: false,
    invalid: false,
    disabled: true,
    readOnly: false,
  },
  {
    id: "disabled-on",
    label: "禁用且开启 / Disabled on",
    checked: true,
    invalid: false,
    disabled: true,
    readOnly: false,
  },
  {
    id: "readonly",
    label: "只读 / Read only",
    checked: true,
    invalid: false,
    disabled: false,
    readOnly: true,
  },
] as const;

export function SwitchDemo() {
  const [checked, setChecked] = createSignal(false);
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [readOnly, setReadOnly] = createSignal(false);
  const [changes, setChanges] = createSignal(0);
  const [message, setMessage] = createSignal("尚未提交");
  return (
    <div class="space-y-8">
      <p class="text-md text-fg-muted">
        Tab
        聚焦，空格切换；圆形滑块直接切换左右位置，只做颜色过渡，没有位移或缩放动画。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-3"
            aria-labelledby={`switch-${state.id}-heading`}
          >
            <h3 id={`switch-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 space-y-2">
                    <Switch
                      id={`switch-${state.id}-${size}`}
                      size={size}
                      defaultChecked={state.checked}
                      invalid={state.invalid}
                      disabled={state.disabled}
                      readOnly={state.readOnly}
                      aria-describedby={
                        state.invalid
                          ? `switch-${state.id}-${size}-error`
                          : undefined
                      }
                    >
                      {size} · Switch
                    </Switch>
                    <Show when={state.invalid}>
                      <p
                        id={`switch-${state.id}-${size}-error`}
                        class="text-md text-danger"
                      >
                        当前设置需要确认。
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
        aria-labelledby="switch-interactive-heading"
      >
        <h3 id="switch-interactive-heading" class="text-md font-medium">
          受控值与响应性
        </h3>
        <Switch
          id="switch-controlled"
          checked={checked()}
          invalid={invalid()}
          disabled={disabled()}
          readOnly={readOnly()}
          onCheckedChange={(next) => {
            setChecked(next);
            setChanges((count) => count + 1);
          }}
          aria-describedby={
            invalid()
              ? "switch-controlled-help switch-controlled-error"
              : "switch-controlled-help"
          }
        >
          自动保存草稿 / Auto save
        </Switch>
        <p id="switch-controlled-help" class="text-md text-fg-muted">
          交互状态变化用 onCheckedChange 通知；onInput/onChange
          保留原生事件，自定义轨道点击不额外合成事件。
        </p>
        <Show when={invalid()}>
          <p id="switch-controlled-error" class="text-md text-danger">
            当前设置被标记为错误。
          </p>
        </Show>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setChecked((current) => !current)}
          >
            外部切换状态
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
            {disabled() ? "启用开关" : "禁用开关"}
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
          id="switch-state-output"
          aria-live="polite"
          class="block text-md text-fg"
        >
          开启：{String(checked())}，状态回调：{changes()} 次
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="switch-native-heading"
      >
        <h3 id="switch-native-heading" class="text-md font-medium">
          原生属性、class 与表单
        </h3>
        <form
          id="switch-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(
              `提交值：${String(new FormData(event.currentTarget).get("autosave") ?? "未开启")}`,
            );
          }}
          onReset={() => setMessage("已重置为开启")}
        >
          <Switch
            id="switch-autosave"
            name="autosave"
            value="enabled"
            defaultChecked
            required
            class="w-full"
            data-demo="class-passthrough"
            title="Native title attribute"
            onInput={[
              (prefix: string, event) =>
                setMessage(`${prefix}：${String(event.target.checked)}`),
              "原生开启",
            ]}
            aria-describedby="switch-autosave-help"
          >
            启用草稿保存（必选）
          </Switch>
          <p id="switch-autosave-help" class="text-md text-fg-muted">
            使用空格观察绑定原生事件；关闭时必填校验阻止提交，重置恢复开启。
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交示例</Button>
            <Button type="reset" variant="outline">
              重置示例
            </Button>
          </div>
          <output
            id="switch-form-output"
            aria-live="polite"
            class="block text-md text-fg"
          >
            {message()}
          </output>
        </form>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="switch-label-heading"
      >
        <h3 id="switch-label-heading" class="text-md font-medium">
          仅控件与长标签
        </h3>
        <Switch id="switch-icon-only" aria-label="开启消息提醒" />
        <Switch class="w-full">
          允许在桌面与窄屏上自动保存草稿 / Automatically save drafts across
          desktop and narrow screens.
        </Switch>
      </section>
    </div>
  );
}
