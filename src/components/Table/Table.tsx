import { Root as ButtonRoot } from "@kobalte/core/button";
import {
  createMemo,
  createSignal,
  For,
  mergeProps,
  onCleanup,
  onMount,
  Show,
  splitProps,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import { Checkbox } from "../Checkbox";
import { Pagination } from "../Pagination";
import { clampPaginationPage } from "../Pagination/state";
import {
  createTableRows,
  cycleTableSort,
  getTablePageSelection,
  getTablePageSize,
  normalizeTableKeys,
  normalizeTableSort,
  sortTableRows,
  toggleTableSelection,
  validateTableColumns,
  type TableSortState,
  type TableSortValue,
} from "./state";
import "./Table.css";

export interface TableColumn<T> {
  /** Stable, unique and non-empty. */
  key: string;
  /** Plain text keeps sorting controls accessible without an extra label. */
  header: string;
  cell: (row: T) => JSX.Element;
  /** Providing a value accessor makes this column sortable. */
  sortValue?: (row: T) => TableSortValue;
  align?: "start" | "center" | "end";
}

export interface TableProps<T> extends Omit<
  JSX.HTMLAttributes<HTMLTableElement>,
  "children" | "onChange"
> {
  data: readonly T[];
  columns: readonly TableColumn<T>[];
  getRowKey: (row: T) => string;
  getRowLabel?: (row: T) => string;
  getRowDisabled?: (row: T) => boolean;
  variant?: "outline" | "plain";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  caption?: JSX.Element;
  emptyContent?: JSX.Element;
  striped?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  /** An explicit [] is a controlled empty selection; missing keys are hidden. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** null is a controlled unsorted state; undefined uses internal state. */
  sort?: TableSortState | null;
  defaultSort?: TableSortState | null;
  onSortChange?: (sort: TableSortState | null) => void;
  paginate?: boolean;
  pageSize?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  selectAllLabel?: string;
  scrollLabel?: string;
  /** Native attributes and class go to table; this class styles its outer frame. */
  containerClass?: string;
}

const variants = {
  outline: "border border-solid border-border",
  plain: "border-0",
} as const;
const sizes = {
  sm: "px-3 py-2 text-md",
  md: "px-4 py-3 text-md",
  lg: "px-5 py-4 text-lg",
} as const;
const alignments = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
} as const;
const sortLabels = {
  none: "升序排序",
  asc: "降序排序",
  desc: "取消排序",
} as const;
const sortIndicators = { none: "↕", asc: "↑", desc: "↓" } as const;

/** Native table semantics; Kobalte owns checkbox and button keyboard behavior. */
export function Table<T>(props: TableProps<T>) {
  const merged = mergeProps(
    {
      variant: "outline",
      size: "md",
      appearance: "default",
      getRowLabel: undefined,
      getRowDisabled: () => false,
      caption: undefined,
      emptyContent: "暂无数据 / No data",
      striped: false,
      selectable: false,
      disabled: false,
      value: undefined,
      defaultValue: [] as readonly string[],
      onValueChange: undefined,
      sort: undefined,
      defaultSort: null,
      onSortChange: undefined,
      paginate: false,
      pageSize: 10,
      page: undefined,
      defaultPage: 1,
      onPageChange: undefined,
      selectAllLabel: "全选当前页可选行",
      scrollLabel: "表格横向滚动区域 / Table scrolling area",
      containerClass: "",
      class: "",
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "data",
    "columns",
    "getRowKey",
    "getRowLabel",
    "getRowDisabled",
    "variant",
    "size",
    "appearance",
    "caption",
    "emptyContent",
    "striped",
    "selectable",
    "disabled",
    "value",
    "defaultValue",
    "onValueChange",
    "sort",
    "defaultSort",
    "onSortChange",
    "paginate",
    "pageSize",
    "page",
    "defaultPage",
    "onPageChange",
    "selectAllLabel",
    "scrollLabel",
    "containerClass",
    "class",
  ]);
  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const [internalSort, setInternalSort] = createSignal<TableSortState | null>(
    local.defaultSort,
  );
  const [internalPage, setInternalPage] = createSignal(local.defaultPage);
  const [overflowing, setOverflowing] = createSignal(false);
  let scrollArea: HTMLDivElement | undefined;
  const rows = createMemo(() => createTableRows(local.data, local.getRowKey));
  const rowsByKey = createMemo(
    () => new Map(rows().map((entry) => [entry.key, entry.row])),
  );
  const columns = createMemo(() => validateTableColumns(local.columns));
  const columnKeys = createMemo(() => columns().map((column) => column.key));
  const columnsByKey = createMemo(
    () => new Map(columns().map((column) => [column.key, column])),
  );
  const value = createMemo(() =>
    normalizeTableKeys(local.value ?? internalValue(), rows()),
  );
  const sort = createMemo(() =>
    normalizeTableSort(
      local.sort === undefined ? internalSort() : local.sort,
      columns(),
    ),
  );
  const sortedKeys = createMemo(() =>
    sortTableRows(rows(), sort(), columns()).map((entry) => entry.key),
  );
  const pageSize = createMemo(() => getTablePageSize(local.pageSize));
  const pageCount = createMemo(() => Math.ceil(rows().length / pageSize()));
  const page = createMemo(() =>
    local.paginate
      ? clampPaginationPage(local.page ?? internalPage(), pageCount())
      : 1,
  );
  const visibleKeys = createMemo(() =>
    local.paginate
      ? sortedKeys().slice((page() - 1) * pageSize(), page() * pageSize())
      : sortedKeys(),
  );
  const selectableKeys = createMemo(() =>
    visibleKeys().filter((key) => !local.getRowDisabled(rowsByKey().get(key)!)),
  );
  const pageSelection = createMemo(() =>
    getTablePageSelection(value(), selectableKeys()),
  );
  const sortDirection = (key: string) =>
    sort()?.column === key ? sort()!.direction : "none";
  const cellClass = (align: "start" | "center" | "end" = "start") =>
    clsx(
      "border-0 border-b border-solid border-border break-words align-middle",
      sizes[local.size],
      alignments[align],
    );

  onMount(() => {
    const area = scrollArea;
    if (!area) return;
    const update = () => setOverflowing(area.scrollWidth > area.clientWidth);
    const observer = new ResizeObserver(update);
    observer.observe(area);
    const table = area.querySelector("table");
    if (table) observer.observe(table);
    update();
    onCleanup(() => observer.disconnect());
  });

  function requestSelection(keys: readonly string[], checked: boolean) {
    if (local.disabled || !local.selectable) return;
    const next = toggleTableSelection(value(), keys, checked);
    if (
      next.length === value().length &&
      next.every((key) => value().includes(key))
    )
      return;
    if (local.value === undefined) setInternalValue(next);
    local.onValueChange?.(next);
  }
  function requestSort(key: string) {
    if (local.disabled) return;
    const next = cycleTableSort(sort(), key);
    if (local.sort === undefined) setInternalSort(next);
    local.onSortChange?.(next);
  }
  function requestPage(next: number) {
    if (local.disabled || next === page()) return;
    if (local.page === undefined) setInternalPage(next);
    local.onPageChange?.(next);
  }

  return (
    <div class="min-w-0 space-y-3">
      <div
        class={clsx(
          "solid-table-frame max-w-full min-w-0 rounded-md bg-surface p-2",
          variants[local.variant],
          getAppearanceClasses(local.appearance, "display", local.disabled),
          local.containerClass,
        )}
      >
        <div
          ref={(element) => {
            scrollArea = element;
          }}
          role="region"
          aria-label={local.scrollLabel}
          tabIndex={overflowing() ? 0 : undefined}
          class="solid-table-scroll max-w-full min-w-0 overflow-x-auto p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <table
            {...rest}
            aria-disabled={local.disabled || undefined}
            class={clsx(
              "w-full border-separate border-spacing-0 text-fg font-normal",
              local.class,
            )}
          >
            <Show
              when={
                local.caption !== undefined &&
                local.caption !== null &&
                local.caption !== false
              }
            >
              <caption
                class={clsx("text-start font-medium", sizes[local.size])}
              >
                {local.caption}
              </caption>
            </Show>
            <thead class="bg-bg">
              <tr>
                <Show when={local.selectable}>
                  <th scope="col" class={cellClass()}>
                    <Checkbox
                      data-table-select-all=""
                      checked={pageSelection().checked}
                      indeterminate={pageSelection().indeterminate}
                      disabled={local.disabled || selectableKeys().length === 0}
                      size={local.size}
                      appearance={local.appearance}
                      aria-label={local.selectAllLabel}
                      onCheckedChange={(checked) =>
                        requestSelection(selectableKeys(), checked)
                      }
                    />
                  </th>
                </Show>
                <For each={columnKeys()}>
                  {(key) => {
                    const column = createMemo(() => columnsByKey().get(key)!);
                    return (
                      <th
                        scope="col"
                        aria-sort={
                          column().sortValue
                            ? sortDirection(key) === "none"
                              ? "none"
                              : sortDirection(key) === "asc"
                                ? "ascending"
                                : "descending"
                            : undefined
                        }
                        class={clsx(cellClass(column().align), "font-medium")}
                      >
                        <Show
                          when={Boolean(column().sortValue)}
                          fallback={column().header}
                        >
                          <ButtonRoot
                            type="button"
                            disabled={local.disabled}
                            aria-label={`${column().header}，${sortLabels[sortDirection(key)]}`}
                            onClick={() => requestSort(key)}
                            class={clsx(
                              "solid-table-sort inline-flex items-center gap-2 rounded-sm border-0 bg-surface px-2 py-1 text-fg font-medium cursor-pointer select-none transition-colors duration-token enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
                              getAppearanceClasses(
                                local.appearance,
                                "native",
                                local.disabled,
                              ),
                            )}
                          >
                            <span class="whitespace-nowrap">
                              {column().header}
                            </span>
                            <span aria-hidden="true" class="shrink-0">
                              {sortIndicators[sortDirection(key)]}
                            </span>
                          </ButtonRoot>
                        </Show>
                      </th>
                    );
                  }}
                </For>
              </tr>
            </thead>
            <tbody>
              <For
                each={visibleKeys()}
                fallback={
                  <tr>
                    <td
                      colSpan={Math.max(
                        1,
                        columns().length + Number(local.selectable),
                      )}
                      class={clsx(cellClass(), "text-center text-fg-muted")}
                    >
                      {local.emptyContent}
                    </td>
                  </tr>
                }
              >
                {(key) => {
                  const row = createMemo(() => rowsByKey().get(key)!);
                  const unavailable = () =>
                    local.disabled || local.getRowDisabled(row());
                  return (
                    <tr
                      class="solid-table-row"
                      data-table-key={key}
                      data-striped={local.striped ? "" : undefined}
                      data-selected={
                        local.selectable && value().includes(key)
                          ? ""
                          : undefined
                      }
                      data-disabled={unavailable() ? "" : undefined}
                    >
                      <Show when={local.selectable}>
                        <td class={cellClass()}>
                          <Checkbox
                            data-table-select-key={key}
                            value={key}
                            checked={value().includes(key)}
                            disabled={unavailable()}
                            size={local.size}
                            appearance={local.appearance}
                            aria-label={`选择 ${local.getRowLabel?.(row()) ?? key}`}
                            onCheckedChange={(checked) => {
                              if (!unavailable())
                                requestSelection([key], checked);
                            }}
                          />
                        </td>
                      </Show>
                      <For each={columnKeys()}>
                        {(columnKey) => {
                          const column = createMemo(() =>
                            columnsByKey().get(columnKey)!,
                          );
                          return (
                            <td class={cellClass(column().align)}>
                              {column().cell(row())}
                            </td>
                          );
                        }}
                      </For>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </div>
      </div>
      <Show when={local.paginate}>
        <Pagination
          count={pageCount()}
          page={page()}
          size={local.size}
          appearance={local.appearance}
          disabled={local.disabled}
          onPageChange={requestPage}
          aria-label={`${local.scrollLabel}，分页`}
        />
      </Show>
    </div>
  );
}
