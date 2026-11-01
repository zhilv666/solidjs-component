import {
  Description as FieldDescription,
  ErrorMessage as FieldErrorMessage,
  Label as FieldLabel,
  Root as FieldRoot,
} from "@kobalte/core/text-field";
import {
  createMemo,
  createUniqueId,
  mergeProps,
  Show,
  splitProps,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface FormFieldControlProps {
  id: string;
  size: "sm" | "md" | "lg";
  invalid: boolean;
  disabled: boolean;
  required: boolean;
  "aria-labelledby": string;
  "aria-describedby": string | undefined;
}

export interface FormFieldProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  label: JSX.Element;
  controlId?: string;
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  description?: JSX.Element;
  error?: JSX.Element;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Group controls use ARIA naming instead of a native label's for attribute. */
  group?: boolean;
  /** Additional space-separated description IDs for the control. */
  describedBy?: string;
  children: (controlProps: FormFieldControlProps) => JSX.Element;
}

const sizes = { sm: "text-md", md: "text-md", lg: "text-lg" } as const;
const frameSizes = { sm: "p-3", md: "p-4", lg: "p-5" } as const;
const hasContent = (value: JSX.Element) =>
  value !== undefined &&
  value !== null &&
  value !== false &&
  value !== true &&
  value !== "";

export function FormField(props: FormFieldProps) {
  const merged = mergeProps(
    {
      id: undefined,
      controlId: `form-field-${createUniqueId()}`,
      size: "md",
      appearance: "default",
      description: undefined,
      error: undefined,
      invalid: false,
      disabled: false,
      required: false,
      group: false,
      describedBy: "",
      onChange: undefined,
      class: "",
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "id",
    "controlId",
    "size",
    "appearance",
    "label",
    "description",
    "error",
    "invalid",
    "disabled",
    "required",
    "group",
    "describedBy",
    "onChange",
    "class",
    "children",
  ]);
  const labelId = () => `${local.controlId}-label`;
  const descriptionId = () => `${local.controlId}-description`;
  const errorId = () => `${local.controlId}-error`;
  const showDescription = createMemo(() => hasContent(local.description));
  const showError = createMemo(() => local.invalid && hasContent(local.error));
  const describedBy = createMemo(
    () =>
      [
        ...new Set([
          ...local.describedBy.split(/\s+/).filter(Boolean),
          ...(showDescription() ? [descriptionId()] : []),
          ...(showError() ? [errorId()] : []),
        ]),
      ].join(" ") || undefined,
  );
  // Getters keep spread props reactive without cloning children or changing controls.
  const controlProps: FormFieldControlProps = {
    get id() {
      return local.controlId;
    },
    get size() {
      return local.size;
    },
    get invalid() {
      return local.invalid;
    },
    get disabled() {
      return local.disabled;
    },
    get required() {
      return local.required;
    },
    get "aria-labelledby"() {
      return labelId();
    },
    get "aria-describedby"() {
      return describedBy();
    },
  };
  const handleNativeChange: JSX.EventHandler<HTMLDivElement, Event> = (
    event,
  ) => {
    const handler = local.onChange;
    if (typeof handler === "function") handler(event);
    else if (handler) handler[0](handler[1], event);
  };
  const labelClass = () =>
    clsx(
      "block text-fg font-normal",
      sizes[local.size],
      local.disabled && "cursor-not-allowed",
    );
  const labelContent = () => (
    <>
      {local.label}
      <Show when={local.required}>
        <span aria-hidden="true" class="ml-1 text-danger">
          *
        </span>
      </Show>
    </>
  );

  return (
    <FieldRoot<"div">
      {...rest}
      id={local.id ?? `${local.controlId}-field`}
      validationState={local.invalid ? "invalid" : "valid"}
      disabled={local.disabled}
      required={local.required}
      aria-labelledby={labelId()}
      on:change={handleNativeChange}
      class={clsx(
        "w-full min-w-0 space-y-2 text-fg font-normal",
        sizes[local.size],
        local.appearance !== "default" &&
          clsx(
            "rounded-md border border-solid bg-surface",
            local.invalid ? "border-danger" : "border-border",
            frameSizes[local.size],
          ),
        getAppearanceClasses(local.appearance, "display", local.disabled),
        local.class,
      )}
    >
      <Show
        when={local.group}
        fallback={
          <FieldLabel<"label">
            id={labelId()}
            for={local.controlId}
            class={labelClass()}
          >
            {labelContent()}
          </FieldLabel>
        }
      >
        <FieldLabel<"span"> as="span" id={labelId()} class={labelClass()}>
          {labelContent()}
        </FieldLabel>
      </Show>
      {local.children(controlProps)}
      <Show when={showDescription()}>
        <FieldDescription
          as="p"
          id={descriptionId()}
          class="text-md text-fg-muted"
        >
          {local.description}
        </FieldDescription>
      </Show>
      <Show when={showError()}>
        <FieldErrorMessage
          as="p"
          id={errorId()}
          role="alert"
          class="text-md text-danger"
        >
          {local.error}
        </FieldErrorMessage>
      </Show>
    </FieldRoot>
  );
}
