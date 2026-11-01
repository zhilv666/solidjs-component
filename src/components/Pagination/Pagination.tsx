import {
  Root as PaginationRoot,
  Item as PaginationItem,
  Items as PaginationItems,
  Ellipsis as PaginationEllipsis,
  Previous as PaginationPrevious,
  Next as PaginationNext,
  usePaginationContext,
  type PaginationRootOptions,
} from "@kobalte/core/pagination";
import { createMemo, mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import { clampPaginationPage, getPaginationCount } from "./state";
import "./Pagination.css";

export interface PaginationProps
  extends
    Omit<JSX.HTMLAttributes<HTMLElement>, "children">,
    Omit<PaginationRootOptions, "itemComponent" | "ellipsisComponent"> {
  variant?: "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number) => string;
}

const variants = {
  outline:
    "border border-solid border-border bg-surface text-fg enabled:hover:not-active:border-primary enabled:hover:not-active:bg-surface-hover enabled:active:border-primary-active enabled:active:bg-surface-active",
  ghost:
    "border-0 bg-surface text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
} as const;
const sizes = {
  sm: "min-h-8 min-w-8 px-2 py-1 text-md",
  md: "min-h-10 min-w-10 px-3 py-2 text-md",
  lg: "min-h-12 min-w-12 px-4 py-2 text-lg",
} as const;

export function Pagination(props: PaginationProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      size: "md",
      appearance: "default",
      page: undefined,
      defaultPage: 1,
      onPageChange: undefined,
      siblingCount: 1,
      showFirst: true,
      showLast: true,
      fixedItems: false,
      disabled: false,
      previousLabel: "上一页",
      nextLabel: "下一页",
      pageLabel: (page: number) => `第 ${page} 页`,
      "aria-label": "分页 / Pagination",
      class: "",
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "count",
    "variant",
    "size",
    "appearance",
    "page",
    "defaultPage",
    "onPageChange",
    "siblingCount",
    "showFirst",
    "showLast",
    "fixedItems",
    "disabled",
    "previousLabel",
    "nextLabel",
    "pageLabel",
    "class",
  ]);
  const count = createMemo(() => getPaginationCount(local.count));
  const page = createMemo(() =>
    local.page === undefined
      ? undefined
      : clampPaginationPage(local.page, count()),
  );
  const unavailable = () => local.disabled || local.count === 0;
  const buttonClass = (disabled: boolean) =>
    clsx(
      "solid-pagination-button inline-flex max-w-full min-w-0 items-center justify-center break-all rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
      variants[local.variant],
      sizes[local.size],
      getAppearanceClasses(local.appearance, "native", disabled),
    );

  // Kobalte's public surface keeps its context and controls, while the semantic
  // list uses token utility spacing and wraps without DOM style mutations.
  function PaginationSurface(surfaceProps: JSX.HTMLAttributes<HTMLElement>) {
    const [, surfaceRest] = splitProps(surfaceProps, ["children"]);
    const context = usePaginationContext();
    const previousDisabled = () => unavailable() || context.page() === 1;
    const nextDisabled = () => unavailable() || context.page() === count();
    return (
      <nav {...surfaceRest}>
        <ul class="m-0 flex max-w-full flex-wrap items-center gap-3 list-none p-2">
          <PaginationPrevious
            type="button"
            disabled={previousDisabled()}
            aria-label={local.previousLabel}
            class={buttonClass(previousDisabled())}
          >
            <span class="min-w-0 break-all">{local.previousLabel}</span>
          </PaginationPrevious>
          <PaginationItems />
          <PaginationNext
            type="button"
            disabled={nextDisabled()}
            aria-label={local.nextLabel}
            class={buttonClass(nextDisabled())}
          >
            <span class="min-w-0 break-all">{local.nextLabel}</span>
          </PaginationNext>
        </ul>
      </nav>
    );
  }

  return (
    <PaginationRoot<typeof PaginationSurface>
      {...rest}
      as={PaginationSurface}
      count={count()}
      page={page()}
      defaultPage={clampPaginationPage(local.defaultPage, count())}
      onPageChange={(next) => {
        if (!unavailable()) {
          local.onPageChange?.(clampPaginationPage(next, count()));
        }
      }}
      siblingCount={Math.max(
        0,
        Math.min(
          Number.isFinite(local.siblingCount)
            ? Math.floor(local.siblingCount)
            : 1,
          count(),
        ),
      )}
      showFirst={local.showFirst}
      showLast={local.showLast}
      fixedItems={local.fixedItems}
      disabled={unavailable()}
      class={clsx("solid-pagination min-w-0 text-fg font-normal", local.class)}
      itemComponent={(itemProps) => (
        <PaginationItem
          page={itemProps.page}
          type="button"
          disabled={unavailable()}
          aria-label={local.pageLabel(itemProps.page)}
          class={buttonClass(unavailable())}
        >
          {itemProps.page}
        </PaginationItem>
      )}
      ellipsisComponent={() => (
        <PaginationEllipsis
          as="span"
          aria-hidden="true"
          class="inline-flex text-md text-fg-muted"
        >
          …
        </PaginationEllipsis>
      )}
    />
  );
}
