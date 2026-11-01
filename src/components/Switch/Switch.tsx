import {
  Control as SwitchControl,
  Input as SwitchInput,
  Label as SwitchLabel,
  Root as SwitchRoot,
  Thumb as SwitchThumb,
} from "@kobalte/core/switch";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface SwitchProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "role" | "children"
> {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  invalid?: boolean;
  defaultChecked?: boolean;
  readOnly?: boolean;
  children?: JSX.Element;
  /** Styles the outer control/label row; native attributes go to the input. */
  class?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const sizes = {
  sm: "min-h-8 text-md",
  md: "min-h-10 text-md",
  lg: "min-h-12 text-lg",
} as const;
const controlSizes = { sm: "h-5 w-9", md: "h-6 w-11", lg: "h-8 w-14" } as const;
const thumbSizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-6 w-6" } as const;
const selections = {
  checked: "justify-end bg-primary",
  unchecked: "justify-start bg-bg",
} as const;
const borders = {
  checked: "border-primary",
  unchecked: "border-border",
  invalid: "border-danger",
} as const;
const thumbs = { checked: "bg-primary-fg", unchecked: "bg-fg" } as const;
const interactions = {
  checked:
    "hover:not-active:border-primary-hover hover:not-active:bg-primary-hover active:border-primary-active active:bg-primary-active",
  unchecked:
    "hover:not-active:border-primary hover:not-active:bg-surface-hover active:border-primary-active active:bg-surface-active",
  invalid: "hover:not-active:border-danger-hover active:border-danger-active",
} as const;
const thumbClasses =
  /* allow-token-bypass: The Switch thumb is a circular shape exception. */
  "block shrink-0 rounded-full transition-colors duration-token";

type NativeSwitchEvent<EventType extends Event> = EventType & {
  currentTarget: HTMLInputElement;
  target: HTMLInputElement;
};
function isNativeSwitchEvent<EventType extends Event>(
  event: EventType & { currentTarget: HTMLInputElement; target: Element },
): event is NativeSwitchEvent<EventType> {
  return event.target === event.currentTarget;
}
function callNativeHandler<EventType extends Event>(
  event: EventType & { currentTarget: HTMLInputElement; target: Element },
  handler:
    | JSX.EventHandlerUnion<
        HTMLInputElement,
        EventType,
        (event: NativeSwitchEvent<EventType>) => void
      >
    | undefined,
) {
  if (!isNativeSwitchEvent(event)) return;
  if (typeof handler === "function") handler(event);
  else if (handler) handler[0](handler[1], event);
}

export function Switch(props: SwitchProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      invalid: false,
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

  return (
    <SwitchRoot
      checked={local.checked}
      defaultChecked={local.defaultChecked}
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
          <SwitchInput<"input">
            {...rest}
            {...nativeDefaults}
            type="checkbox"
            role="switch"
            onChange={(event) => callNativeHandler(event, local.onChange)}
            onFocus={(event) => callNativeHandler(event, local.onFocus)}
            onBlur={(event) => callNativeHandler(event, local.onBlur)}
            aria-invalid={local.invalid || local["aria-invalid"]}
            class="peer focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <SwitchControl
            aria-hidden="true"
            class={clsx(
              "inline-flex shrink-0 items-center rounded-md border border-solid p-0.5 transition-colors duration-token peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed",
              controlSizes[local.size],
              selections[state.checked() ? "checked" : "unchecked"],
              borders[
                local.invalid
                  ? "invalid"
                  : state.checked()
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
                      : state.checked()
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
            <SwitchThumb
              class={clsx(
                thumbClasses,
                thumbSizes[local.size],
                thumbs[state.checked() ? "checked" : "unchecked"],
              )}
            />
          </SwitchControl>
          <Show
            when={
              local.children !== undefined &&
              local.children !== null &&
              local.children !== false
            }
          >
            <SwitchLabel
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
            </SwitchLabel>
          </Show>
        </>
      )}
    </SwitchRoot>
  );
}
