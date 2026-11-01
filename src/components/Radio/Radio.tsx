import {
  Item as RadioItem,
  ItemControl as RadioControl,
  ItemIndicator as RadioIndicator,
  ItemInput as RadioInput,
  ItemLabel as RadioLabel,
  useRadioGroupContext,
} from "@kobalte/core/radio-group";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useRadioStyleContext } from "../RadioGroup/RadioGroup";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface RadioProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  | "type"
  | "size"
  | "name"
  | "value"
  | "checked"
  | "required"
  | "readonly"
  | "children"
> {
  value: string;
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  children?: JSX.Element;
  /** Styles the outer row; native attributes and ref go to its hidden input. */
  class?: string;
}

const sizes = {
  sm: "min-h-8 text-md",
  md: "min-h-10 text-md",
  lg: "min-h-12 text-lg",
} as const;
const controlSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" } as const;
const indicatorSizes = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;
const borders = {
  checked: "border-primary",
  unchecked: "border-border",
  invalid: "border-danger",
} as const;
const interactions = {
  valid:
    "hover:not-active:border-primary hover:not-active:bg-surface-hover active:border-primary-active active:bg-surface-active",
  invalid:
    "hover:not-active:border-danger-hover hover:not-active:bg-surface-hover active:border-danger-active active:bg-surface-active",
} as const;
const controlClasses =
  /* allow-token-bypass: Circular Radio controls distinguish single selection from Checkbox. */
  "inline-flex shrink-0 items-center justify-center rounded-full border border-solid bg-bg transition-colors duration-token peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed";
const indicatorClasses =
  /* allow-token-bypass: The circular selection dot matches the Radio control. */
  "block rounded-full bg-primary";

type NativeRadioEvent<EventType extends Event> = EventType & {
  currentTarget: HTMLInputElement;
  target: HTMLInputElement;
};

function isNativeRadioEvent<EventType extends Event>(
  event: EventType & { currentTarget: HTMLInputElement; target: Element },
): event is NativeRadioEvent<EventType> {
  return event.target === event.currentTarget;
}

function callNativeHandler<EventType extends Event>(
  event: EventType & { currentTarget: HTMLInputElement; target: Element },
  handler:
    | JSX.EventHandlerUnion<
        HTMLInputElement,
        EventType,
        (event: NativeRadioEvent<EventType>) => void
      >
    | undefined,
) {
  if (!isNativeRadioEvent(event)) return;
  if (typeof handler === "function") handler(event);
  else if (handler) handler[0](handler[1], event);
}

export function synchronizeRadioInputs(
  input: HTMLInputElement,
  isSelected: (value: string) => boolean,
) {
  const root = input.closest('[role="radiogroup"]');
  const inputs = root?.querySelectorAll<HTMLInputElement>(
    'input[type="radio"]',
  );
  if (!inputs) return;
  for (const field of inputs) {
    if (field.closest('[role="radiogroup"]') === root) {
      field.checked = isSelected(field.value);
    }
  }
}

export function Radio(props: RadioProps) {
  const merged = mergeProps(
    {
      size: undefined,
      appearance: undefined,
      disabled: false,
      onChange: undefined,
      onFocus: undefined,
      onBlur: undefined,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "value",
    "size",
    "appearance",
    "disabled",
    "onChange",
    "onFocus",
    "onBlur",
    "class",
    "children",
  ]);
  const group = useRadioStyleContext();
  const state = useRadioGroupContext();
  const size = () => local.size ?? group.size();
  const isDisabled = () => local.disabled || group.disabled();
  const nativeDefaults = {
    get "prop:defaultChecked"() {
      return group.nativeDefault() === local.value;
    },
  };

  const handleChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
    callNativeHandler(event, local.onChange);
    // Native grouping clears the previous radio before Kobalte rejects a read-only change.
    // Mirror Kobalte's selection without changing value, focus, or keyboard navigation.
    if (group.readOnly()) {
      synchronizeRadioInputs(event.currentTarget, state.isSelectedValue);
    }
  };

  return (
    <RadioItem
      value={local.value}
      disabled={local.disabled}
      class={clsx(
        "relative inline-flex min-w-0 items-center gap-2 text-fg font-normal",
        sizes[size()],
        isDisabled() && "opacity-50 cursor-not-allowed",
        local.class,
      )}
    >
      <RadioInput<"input">
        {...rest}
        {...nativeDefaults}
        type="radio"
        onChange={handleChange}
        onFocus={(event) => callNativeHandler(event, local.onFocus)}
        onBlur={(event) => callNativeHandler(event, local.onBlur)}
        class="peer focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <RadioControl
        aria-hidden="true"
        class={clsx(
          controlClasses,
          controlSizes[size()],
          borders[
            group.invalid()
              ? "invalid"
              : state.isSelectedValue(local.value)
                ? "checked"
                : "unchecked"
          ],
          isDisabled() && "pointer-events-none",
          !isDisabled() &&
            !group.readOnly() &&
            clsx(
              "cursor-pointer",
              interactions[group.invalid() ? "invalid" : "valid"],
            ),
          getAppearanceClasses(
            local.appearance ?? group.appearance(),
            "control",
            isDisabled() || group.readOnly(),
          ),
        )}
      >
        <RadioIndicator
          class={clsx(indicatorClasses, indicatorSizes[size()])}
        />
      </RadioControl>
      <Show
        when={
          local.children !== undefined &&
          local.children !== null &&
          local.children !== false
        }
      >
        <RadioLabel
          class={clsx(
            "min-w-0",
            isDisabled()
              ? "cursor-not-allowed"
              : group.readOnly()
                ? "cursor-default"
                : "cursor-pointer",
          )}
        >
          {local.children}
        </RadioLabel>
      </Show>
    </RadioItem>
  );
}
