import {
  Input as TextFieldInput,
  Root as TextFieldRoot,
} from "@kobalte/core/text-field";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface InputProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix" | "children"
> {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  invalid?: boolean;
  /** Non-interactive content before the native input. */
  prefix?: JSX.Element;
  /** Non-interactive content after the native input. */
  suffix?: JSX.Element;
  defaultValue?: string;
  /** Kobalte's value callback; native onInput and onChange remain available. */
  onValueChange?: (value: string) => void;
}

const states = {
  valid:
    "border-border enabled:hover:not-active:border-primary enabled:active:border-primary-active",
  invalid:
    "border-danger enabled:hover:not-active:border-danger-hover enabled:active:border-danger-active",
} as const;

const sizes = {
  sm: "h-8 px-3 text-md",
  md: "h-10 px-3 text-md",
  lg: "h-12 px-4 text-lg",
} as const;

const slotSizes = {
  sm: "text-md",
  md: "text-md",
  lg: "text-lg",
} as const;

type NativeInputEvent = Parameters<
  JSX.InputEventHandler<HTMLInputElement, InputEvent>
>[0];

function isNativeInputEvent(
  event: Parameters<JSX.EventHandler<HTMLInputElement, InputEvent>>[0],
): event is NativeInputEvent {
  return event.target === event.currentTarget;
}

export function Input(props: InputProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      invalid: false,
      disabled: false,
      required: false,
      readOnly: undefined,
      readonly: false,
      name: "",
      type: "text",
      value: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      onInput: undefined,
      prefix: undefined,
      suffix: undefined,
      class: "",
      "aria-invalid": undefined,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "invalid",
    "disabled",
    "required",
    "readOnly",
    "readonly",
    "name",
    "value",
    "defaultValue",
    "onValueChange",
    "onInput",
    "prefix",
    "suffix",
    "class",
    "aria-invalid",
  ]);

  // Native reset must agree with Kobalte before the browser's default action.
  const nativeDefaults = {
    get "prop:defaultValue"() {
      return local.value === undefined
        ? (local.defaultValue ?? "")
        : String(local.value);
    },
  };

  // Solid narrows native input targets more than Kobalte's shared field API.
  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    if (!isNativeInputEvent(event)) return;
    const handler = local.onInput;
    if (typeof handler === "function") handler(event);
    else if (handler) handler[0](handler[1], event);
  };

  return (
    <TextFieldRoot
      name={local.name}
      value={local.value === undefined ? undefined : String(local.value)}
      defaultValue={local.defaultValue}
      onChange={local.onValueChange}
      disabled={local.disabled}
      required={local.required}
      readOnly={local.readOnly ?? local.readonly}
      validationState={local.invalid ? "invalid" : "valid"}
      class="flex w-full min-w-0 items-center gap-2"
    >
      <Show
        when={
          local.prefix !== undefined &&
          local.prefix !== null &&
          local.prefix !== false
        }
      >
        <span
          aria-hidden="true"
          data-input-slot="prefix"
          class={clsx(
            "shrink-0 text-fg-muted font-normal",
            slotSizes[local.size],
            local.disabled && "opacity-50",
          )}
        >
          {local.prefix}
        </span>
      </Show>
      <TextFieldInput<"input">
        {...rest}
        {...nativeDefaults}
        onInput={handleInput}
        aria-invalid={local.invalid || local["aria-invalid"]}
        class={clsx(
          "w-full min-w-0 flex-1 rounded-md border border-solid bg-bg text-fg font-normal transition-colors duration-token placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
          states[local.invalid ? "invalid" : "valid"],
          sizes[local.size],
          getAppearanceClasses(
            local.appearance,
            "native",
            local.disabled || (local.readOnly ?? local.readonly),
          ),
          local.class,
        )}
      />
      <Show
        when={
          local.suffix !== undefined &&
          local.suffix !== null &&
          local.suffix !== false
        }
      >
        <span
          aria-hidden="true"
          data-input-slot="suffix"
          class={clsx(
            "shrink-0 text-fg-muted font-normal",
            slotSizes[local.size],
            local.disabled && "opacity-50",
          )}
        >
          {local.suffix}
        </span>
      </Show>
    </TextFieldRoot>
  );
}
