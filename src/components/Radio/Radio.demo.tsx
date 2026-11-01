import { For, Show } from "solid-js";
import { RadioGroup } from "../RadioGroup";
import { Radio } from "./Radio";
import { AppearancePreview } from "../../demo/AppearancePreview";

const sizes = ["sm", "md", "lg"] as const;
const states = [
  {
    id: "default",
    label: "常规 / Default",
    selected: "b",
    invalid: false,
    disabled: false,
    readOnly: false,
  },
  {
    id: "empty",
    label: "未选择 / Empty",
    selected: undefined,
    invalid: false,
    disabled: false,
    readOnly: false,
  },
  {
    id: "invalid",
    label: "错误 / Invalid",
    selected: "a",
    invalid: true,
    disabled: false,
    readOnly: false,
  },
  {
    id: "disabled",
    label: "禁用 / Disabled",
    selected: "a",
    invalid: false,
    disabled: true,
    readOnly: false,
  },
  {
    id: "readonly",
    label: "只读 / Read only",
    selected: "b",
    invalid: false,
    disabled: false,
    readOnly: true,
  },
] as const;
const options = [
  { value: "a", label: "SolidJS", disabled: false },
  { value: "b", label: "TypeScript", disabled: false },
  { value: "c", label: "禁用项", disabled: true },
] as const;

export function RadioDemo() {
  return (
    <div class="space-y-8">
      <AppearancePreview id="radio">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={states}>
              {(state) => (
                <div class="min-w-0 space-y-2">
                  <h4 class="text-md text-fg">
                    {state.label} · {size}
                  </h4>
                  <RadioGroup
                    id={`radio-${appearance}-${state.id}-${size}`}
                    appearance={appearance}
                    size={size}
                    defaultValue={state.selected}
                    invalid={state.invalid}
                    disabled={state.disabled}
                    readOnly={state.readOnly}
                    aria-label={`${appearance} ${state.label} ${size}`}
                    aria-describedby={
                      state.invalid
                        ? `radio-${appearance}-${size}-error`
                        : undefined
                    }
                  >
                    <For each={options}>
                      {(option) => (
                        <Radio
                          id={`radio-${appearance}-${state.id}-${size}-${option.value}`}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </Radio>
                      )}
                    </For>
                  </RadioGroup>
                  <Show when={state.invalid}>
                    <p
                      id={`radio-${appearance}-${size}-error`}
                      class="text-md text-danger"
                    >
                      请确认选择后继续。
                    </p>
                  </Show>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <For each={states}>
        {(state) => (
          <section
            class="space-y-3"
            aria-labelledby={`radio-${state.id}-heading`}
          >
            <h3 id={`radio-${state.id}-heading`} class="text-md font-medium">
              {state.label}
            </h3>
            <div class="grid gap-4 lg:grid-cols-3">
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 space-y-2">
                    <h4 class="text-md text-fg">{size} · RadioGroup</h4>
                    <RadioGroup
                      id={`radio-${state.id}-${size}`}
                      size={size}
                      defaultValue={state.selected}
                      invalid={state.invalid}
                      disabled={state.disabled}
                      readOnly={state.readOnly}
                      aria-label={`${state.label} ${size}`}
                      aria-describedby={
                        state.invalid ? `radio-${size}-error` : undefined
                      }
                    >
                      <For each={options}>
                        {(option) => (
                          <Radio
                            id={`radio-${state.id}-${size}-${option.value}`}
                            value={option.value}
                            disabled={option.disabled}
                          >
                            {option.label}
                          </Radio>
                        )}
                      </For>
                    </RadioGroup>
                    <Show when={state.invalid}>
                      <p id={`radio-${size}-error`} class="text-md text-danger">
                        请确认选择后继续。
                      </p>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
    </div>
  );
}
