import {
  Control as CheckboxControl,
  Indicator as CheckboxIndicator,
  Input as CheckboxInput,
  Label as CheckboxLabel,
  Root as CheckboxRoot,
} from "@kobalte/core/checkbox";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface CheckboxProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "children"
> {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  invalid?: boolean;
  indeterminate?: boolean;
  defaultChecked?: boolean;
  readOnly?: boolean;
  children?: JSX.Element;
  /** Styles the outer control/label row; native attributes go to the input. */
  class?: string;
  /** Kobalte's checked callback; native input/change handlers are preserved. */
  onCheckedChange?: (checked: boolean) => void;
}

const sizes = {
  sm: "min-h-8 text-md",
  md: "min-h-10 text-md",
  lg: "min-h-12 text-lg",
} as const;

const controlSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

const selections = {
  checked: "bg-primary text-primary-fg",
  unchecked: "bg-bg text-fg",
} as const;

const borders = {
  checked: "border-primary",
  unchecked: "border-border",
  invalid: "border-danger",
} as const;

const interactions = {
  checked:
    "hover:not-active:border-primary-hover hover:not-active:bg-primary-hover active:border-primary-active active:bg-primary-active",
  unchecked:
    "hover:not-active:border-primary hover:not-active:bg-surface-hover active:border-primary-active active:bg-surface-active",
  invalid: "hover:not-active:border-danger-hover active:border-danger-active",
} as const;

function isNativeCheckboxEvent<EventType extends Event>(
  event: EventType & { currentTarget: HTMLInputElement; target: Element },
): event is EventType & {
  currentTarget: HTMLInputElement;
  target: HTMLInputElement;
} {
  return event.target === event.currentTarget;
}

export function Checkbox(props: CheckboxProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      invalid: false,
      indeterminate: false,
      checked: undefined,
      defaultChecked: false,
      disabled: false,
      required: false,
      readonly: false,
      readOnly: undefined,
      name: "",
      value: "on",
      onCheckedChange: undefined,
      onChange: undefined,
      onFocus: undefined,
      onBlur: undefined,
      class: "",
      children: undefined,
      "aria-invalid": undefined,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "invalid",
    "indeterminate",
    "checked",
    "defaultChecked",
    "disabled",
    "required",
    "readonly",
    "readOnly",
    "name",
    "value",
    "onCheckedChange",
    "onChange",
    "onFocus",
    "onBlur",
    "class",
    "children",
    "aria-invalid",
  ]);

  const nativeDefaults = {
    get "prop:defaultChecked"() {
      return local.checked ?? local.defaultChecked;
    },
  };

  const handleChange: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    if (!isNativeCheckboxEvent(event)) return;
    const handler = local.onChange;
    if (typeof handler === "function") handler(event);
    else if (handler) handler[0](handler[1], event);
  };

  const handleFocus: JSX.EventHandler<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    if (!isNativeCheckboxEvent(event)) return;
    const handler = local.onFocus;
    if (typeof handler === "function") handler(event);
    else if (handler) handler[0](handler[1], event);
  };

  const handleBlur: JSX.EventHandler<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    if (!isNativeCheckboxEvent(event)) return;
    const handler = local.onBlur;
    if (typeof handler === "function") handler(event);
    else if (handler) handler[0](handler[1], event);
  };

  return (
    <CheckboxRoot
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      indeterminate={local.indeterminate}
      onChange={local.onCheckedChange}
      disabled={local.disabled}
      required={local.required}
      readOnly={local.readOnly ?? local.readonly}
      validationState={local.invalid ? "invalid" : "valid"}
      name={local.name}
      value={String(local.value)}
      class={clsx(
        "relative inline-flex min-w-0 items-center gap-2 text-fg font-normal",
        sizes[local.size],
        local.disabled && "opacity-50 cursor-not-allowed",
        local.class,
      )}
    >
      {(state) => (
        <>
          <CheckboxInput<"input">
            {...rest}
            {...nativeDefaults}
            type="checkbox"
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={local.invalid || local["aria-invalid"]}
            class="peer focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <CheckboxControl
            aria-hidden="true"
            class={clsx(
              "inline-flex shrink-0 items-center justify-center rounded-md border border-solid transition-colors duration-token peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed",
              controlSizes[local.size],
              selections[
                state.checked() || state.indeterminate()
                  ? "checked"
                  : "unchecked"
              ],
              borders[
                local.invalid
                  ? "invalid"
                  : state.checked() || state.indeterminate()
                    ? "checked"
                    : "unchecked"
              ],
              !local.disabled &&
                !(local.readOnly ?? local.readonly) &&
                clsx(
                  "cursor-pointer",
                  interactions[
                    local.invalid
                      ? "invalid"
                      : state.checked() || state.indeterminate()
                        ? "checked"
                        : "unchecked"
                  ],
                ),
              getAppearanceClasses(
                local.appearance,
                "control",
                local.disabled || (local.readOnly ?? local.readonly),
              ),
            )}
          >
            <CheckboxIndicator class="flex h-full w-full items-center justify-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                class="h-full w-full stroke-2"
              >
                <Show
                  when={state.indeterminate()}
                  fallback={<path d="m6 12 4 4 8-8" />}
                >
                  <path d="M5 12h14" />
                </Show>
              </svg>
            </CheckboxIndicator>
          </CheckboxControl>
          <Show
            when={
              local.children !== undefined &&
              local.children !== null &&
              local.children !== false
            }
          >
            <CheckboxLabel
              class={clsx(
                "min-w-0",
                local.disabled
                  ? "cursor-not-allowed"
                  : (local.readOnly ?? local.readonly)
                    ? "cursor-default"
                    : "cursor-pointer",
              )}
            >
              {local.children}
            </CheckboxLabel>
          </Show>
        </>
      )}
    </CheckboxRoot>
  );
}
