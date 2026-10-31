import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Input } from "../Input";
import { Textarea } from "../Textarea";
import { Select } from "../Select";
import { Checkbox } from "../Checkbox";
import { Radio } from "../Radio";
import { RadioGroup } from "../RadioGroup";
import { FormField } from "./FormField";

const sizes = ["sm", "md", "lg"] as const;
const states = [
  {
    id: "normal",
    label: "常规 / Normal",
    required: false,
    invalid: false,
    disabled: false,
  },
  {
    id: "required",
    label: "必填 / Required",
    required: true,
    invalid: false,
    disabled: false,
  },
  {
    id: "invalid",
    label: "错误 / Invalid",
    required: true,
    invalid: true,
    disabled: false,
  },
  {
    id: "disabled",
    label: "禁用 / Disabled",
    required: false,
    invalid: false,
    disabled: true,
  },
] as const;

export function FormFieldDemo() {
  const [invalid, setInvalid] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [description, setDescription] = createSignal(true);
  const [message, setMessage] = createSignal("尚未提交");
  return (
    <div class="space-y-8">
      <p class="text-md text-fg-muted">
        将插槽参数展开到控件，即可关联 label、帮助文字和错误文字，并同步 size /
        invalid / disabled / required。错误只在 invalid
        时显示；帮助文字保留，不改控件本身的交互逻辑。
      </p>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-3"
            aria-labelledby={`form-field-${state.id}-heading`}
          >
            <h3
              id={`form-field-${state.id}-heading`}
              class="text-md font-medium"
            >
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <FormField
                    controlId={`form-field-${state.id}-${size}`}
                    label={`${size} · 用户名 / Username`}
                    size={size}
                    required={state.required}
                    invalid={state.invalid}
                    disabled={state.disabled}
                    description="用于显示个人资料。"
                    error="用户名不能为空。"
                  >
                    {(field) => <Input {...field} placeholder="请输入用户名" />}
                  </FormField>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="form-field-reactive-heading"
      >
        <h3 id="form-field-reactive-heading" class="text-md font-medium">
          关联与响应性
        </h3>
        <p id="form-field-external-description" class="text-md text-fg-muted">
          这是通过 describedBy 加入的额外说明。
        </p>
        <FormField
          controlId="form-field-reactive"
          label="显示名称 / Display name"
          invalid={invalid()}
          disabled={disabled()}
          description={
            description() ? "帮助文字可以动态显示或隐藏。" : undefined
          }
          error="显示名称需要修改。"
          describedBy="form-field-external-description"
        >
          {(field) => <Input {...field} defaultValue="SolidJS" />}
        </FormField>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            aria-pressed={invalid()}
            onClick={() => setInvalid((current) => !current)}
          >
            {invalid() ? "清除错误" : "显示错误"}
          </Button>
          <Button
            variant="outline"
            aria-pressed={description()}
            onClick={() => setDescription((current) => !current)}
          >
            {description() ? "隐藏帮助" : "显示帮助"}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用字段" : "禁用字段"}
          </Button>
        </div>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="form-field-form-heading"
      >
        <h3 id="form-field-form-heading" class="text-md font-medium">
          组合已有控件与原生表单
        </h3>
        <form
          id="form-field-native-form"
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setMessage(
              `提交值：${String(data.get("bio"))} / ${String(data.get("language"))} / ${String(data.get("consent"))}`,
            );
          }}
          onReset={() => setMessage("已重置表单")}
        >
          <FormField
            controlId="form-field-bio"
            label="个人简介 / Bio"
            description="Enter 换行；最多 200 个字符。"
          >
            {(field) => (
              <Textarea
                {...field}
                name="bio"
                maxlength={200}
                defaultValue="SolidJS 组件库"
              />
            )}
          </FormField>
          <FormField
            controlId="form-field-language"
            label="开发语言 / Language"
            required
            description="请选择常用语言。"
          >
            {(field) => (
              <Select
                {...field}
                name="language"
                defaultValue="ts"
                options={[
                  { value: "ts", label: "TypeScript" },
                  { value: "js", label: "JavaScript" },
                ]}
              />
            )}
          </FormField>
          <FormField
            controlId="form-field-consent"
            label="允许展示个人资料 / Profile consent"
            description="该选项通过 FormField 的标签命名。"
          >
            {(field) => (
              <Checkbox {...field} name="consent" value="yes" defaultChecked />
            )}
          </FormField>
          <div class="flex flex-wrap items-center gap-3">
            <Button type="submit">提交表单</Button>
            <Button type="reset" variant="outline">
              重置表单
            </Button>
          </div>
          <output
            id="form-field-form-output"
            aria-live="polite"
            class="block text-md text-fg"
          >
            {message()}
          </output>
        </form>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="form-field-group-heading"
      >
        <h3 id="form-field-group-heading" class="text-md font-medium">
          分组控件
        </h3>
        <FormField
          controlId="form-field-density"
          group
          label="信息密度 / Density"
          description="group 使用 ARIA 命名，标签不绑定不可聚焦的 div。"
        >
          {(field) => (
            <RadioGroup {...field} name="density" defaultValue="comfortable">
              <Radio value="comfortable">舒适 / Comfortable</Radio>
              <Radio value="compact">紧凑 / Compact</Radio>
            </RadioGroup>
          )}
        </FormField>
      </section>
    </div>
  );
}
