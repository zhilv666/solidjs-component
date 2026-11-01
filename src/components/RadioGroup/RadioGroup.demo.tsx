import { createSignal, Show } from "solid-js";
import { Button } from "../Button";
import { Radio } from "../Radio";
import { RadioDemo } from "../Radio/Radio.demo";
import { RadioGroup } from "./RadioGroup";
import type { ComponentAppearance } from "../appearance";

const appearances = ["default", "keycap", "mahjong", "pixel"] as const;

export function RadioGroupDemo() {
  const [value, setValue] = createSignal("a");
  const [appearance, setAppearance] =
    createSignal<ComponentAppearance>("default");
  const [size, setSize] = createSignal<"md" | "lg">("md");
  const [orientation, setOrientation] = createSignal<"horizontal" | "vertical">(
    "vertical",
  );
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [readOnly, setReadOnly] = createSignal(false);
  const [optionDisabled, setOptionDisabled] = createSignal(false);
  const [changes, setChanges] = createSignal(0);
  const [message, setMessage] = createSignal("尚未提交");
  return (
    <div class="space-y-8">
      <p class="text-md text-fg-muted">
        同组原生 radio 保持互斥；Tab
        进入组，方向键移动与选中，空格选择。禁用项跳过，行为由 Kobalte
        与原生控件负责。
      </p>
      <RadioDemo />
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="radio-interactive-heading"
      >
        <h3 id="radio-interactive-heading" class="text-md font-medium">
          受控值、方向与响应性
        </h3>
        <RadioGroup
          id="radio-controlled-group"
          appearance={appearance()}
          value={value()}
          onValueChange={(next) => {
            setValue(next);
            setChanges((count) => count + 1);
          }}
          size={size()}
          orientation={orientation()}
          invalid={invalid()}
          disabled={disabled()}
          readOnly={readOnly()}
          aria-label="选择组件方案"
          aria-describedby={
            invalid()
              ? "radio-controlled-help radio-controlled-error"
              : "radio-controlled-help"
          }
        >
          <Radio id="radio-controlled-a" value="a">
            组件方案 A
          </Radio>
          <Radio id="radio-controlled-b" value="b" disabled={optionDisabled()}>
            组件方案 B
          </Radio>
          <Radio id="radio-controlled-c" value="c">
            组件方案 C
          </Radio>
        </RadioGroup>
        <p id="radio-controlled-help" class="text-md text-fg-muted">
          尺寸与状态由组统一提供，原生 name 自动隔离各组；表单中请显式设置
          name。
        </p>
        <Show when={invalid()}>
          <p id="radio-controlled-error" class="text-md text-danger">
            当前组被标记为错误。
          </p>
        </Show>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="radio-toggle-appearance"
            variant="ghost"
            onClick={() =>
              setAppearance(
                (current) =>
                  appearances[
                    (appearances.indexOf(current) + 1) % appearances.length
                  ]!,
              )
            }
          >
            切换外观：{appearance()}
          </Button>
          <Button variant="outline" onClick={() => setValue("b")}>
            外部选择 B
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setOrientation((current) =>
                current === "vertical" ? "horizontal" : "vertical",
              )
            }
          >
            {orientation() === "vertical" ? "切换为横向" : "切换为纵向"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setSize((current) => (current === "md" ? "lg" : "md"))
            }
          >
            {size() === "md" ? "切换为大号" : "切换为中号"}
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
            {disabled() ? "启用整组" : "禁用整组"}
          </Button>
          <Button
            variant="outline"
            aria-pressed={optionDisabled()}
            onClick={() => setOptionDisabled((current) => !current)}
          >
            {optionDisabled() ? "启用 B 项" : "禁用 B 项"}
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
          id="radio-value-output"
          aria-live="polite"
          class="block text-md text-fg"
        >
          选中：{value()}，状态回调：{changes()} 次
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="radio-native-heading"
      >
        <h3 id="radio-native-heading" class="text-md font-medium">
          原生属性、class 与表单
        </h3>
        <form
          id="radio-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(
              `提交值：${String(new FormData(event.currentTarget).get("framework") ?? "未选择")}`,
            );
          }}
          onReset={() => setMessage("已重置为未选择")}
        >
          <RadioGroup
            id="radio-framework-group"
            name="framework"
            required
            aria-label="框架（必选）"
            class="w-full"
            aria-describedby="radio-framework-help"
          >
            <Radio
              id="radio-framework-solid"
              value="solid"
              title="Native title attribute"
              class="w-full"
              data-demo="class-passthrough"
              onInput={[
                (prefix: string, event) =>
                  setMessage(`${prefix}：${event.target.value}`),
                "原生选择",
              ]}
            >
              SolidJS
            </Radio>
            <Radio id="radio-framework-typescript" value="typescript">
              TypeScript
            </Radio>
          </RadioGroup>
          <p id="radio-framework-help" class="text-md text-fg-muted">
            必选组；提交仅包含一个值，重置恢复初始未选择状态。
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交示例</Button>
            <Button type="reset" variant="outline">
              重置示例
            </Button>
          </div>
          <output
            id="radio-form-output"
            aria-live="polite"
            class="block text-md text-fg"
          >
            {message()}
          </output>
        </form>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="radio-label-heading"
      >
        <h3 id="radio-label-heading" class="text-md font-medium">
          长标签与独立尺寸
        </h3>
        <RadioGroup
          aria-label="草稿保存方式"
          defaultValue="auto"
          orientation="horizontal"
        >
          <Radio value="auto" size="sm">
            在桌面与窄屏上自动保存草稿 / Automatically save drafts across
            desktop and narrow screens.
          </Radio>
          <Radio value="manual" size="lg" aria-label="手动保存" />
        </RadioGroup>
      </section>
      <section
        class="space-y-3 border-t border-border pt-6"
        aria-labelledby="radio-override-heading"
      >
        <h3 id="radio-override-heading" class="text-md font-medium">
          组外观与单项覆盖
        </h3>
        <RadioGroup
          id="radio-appearance-override"
          appearance="keycap"
          defaultValue="inherited"
          aria-label="单项外观覆盖"
        >
          <Radio id="radio-appearance-inherited" value="inherited">
            继承键帽外观
          </Radio>
          <Radio
            id="radio-appearance-overridden"
            value="overridden"
            appearance="mahjong"
          >
            单项麻将外观
          </Radio>
        </RadioGroup>
      </section>
    </div>
  );
}
