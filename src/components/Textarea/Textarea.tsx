import {
  Root as TextFieldRoot,
  TextArea as TextFieldTextArea,
} from "@kobalte/core/text-field";
import { mergeProps, splitProps, type JSX } from "solid-js";
import { isServer } from "solid-js/web";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface TextareaProps extends Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "children"
> {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  invalid?: boolean;
  autoResize?: boolean;
  defaultValue?: string;
  /** Kobalte's value callback; native input/change handlers are preserved. */
  onValueChange?: (value: string) => void;
}

const states = {
  valid:
    "border-border enabled:hover:not-active:border-primary enabled:active:border-primary-active",
  invalid:
    "border-danger enabled:hover:not-active:border-danger-hover enabled:active:border-danger-active",
} as const;

const sizes = {
  sm: "min-h-20 p-3 text-md",
  md: "min-h-28 p-3 text-md",
  lg: "min-h-36 p-4 text-lg",
} as const;

type NativeTextareaEvent = Parameters<
  JSX.InputEventHandler<HTMLTextAreaElement, InputEvent>
>[0];

function isNativeTextareaEvent(
  event: Parameters<JSX.EventHandler<HTMLTextAreaElement, InputEvent>>[0],
): event is NativeTextareaEvent {
  return event.target === event.currentTarget;
}

export function Textarea(props: TextareaProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      invalid: false,
      autoResize: false,
      disabled: false,
      required: false,
      readonly: false,
      readOnly: undefined,
      rows: 3,
      name: "",
      value: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      onInput: undefined,
      class: "",
      "aria-invalid": undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "invalid",
    "autoResize",
    "disabled",
    "required",
    "readonly",
    "readOnly",
    "name",
    "value",
    "defaultValue",
    "onValueChange",
    "onInput",
    "class",
    "aria-invalid",
  ]);

  const nativeDefaults = {
    get "prop:defaultValue"() {
      return local.value === undefined
        ? (local.defaultValue ?? "")
        : String(local.value);
    },
  };

  // Dynamic Kobalte tags serialize value as an attribute; textarea needs text.
  const serverContent = isServer
    ? {
        get children() {
          const value =
            local.value === undefined
              ? local.defaultValue
              : String(local.value);
          // HTML parsing removes one leading newline from textarea content.
          return value?.startsWith("\n") ? `\n${value}` : value;
        },
      }
    : {};

  const handleInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (
    event,
  ) => {
    if (!isNativeTextareaEvent(event)) return;
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
      class="w-full"
    >
      <TextFieldTextArea<"textarea">
        {...rest}
        {...nativeDefaults}
        {...serverContent}
        autoResize={local.autoResize}
        onInput={handleInput}
        aria-invalid={local.invalid || local["aria-invalid"]}
        class={clsx(
          "block w-full min-w-0 rounded-md border border-solid bg-bg text-fg font-normal transition-colors duration-token placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
          states[local.invalid ? "invalid" : "valid"],
          sizes[local.size],
          local.autoResize ? "resize-none" : "resize-y",
          getAppearanceClasses(
            local.appearance,
            "native",
            local.disabled || (local.readOnly ?? local.readonly),
          ),
          local.class,
        )}
      />
    </TextFieldRoot>
  );
}
