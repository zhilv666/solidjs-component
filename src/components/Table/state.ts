export type TableSortValue =
  string | number | boolean | Date | null | undefined;

export interface TableSortState {
  column: string;
  direction: "asc" | "desc";
}

export interface TableKeyedRow<T> {
  key: string;
  row: T;
}

interface SortableColumn<T> {
  key: string;
  sortValue?: (row: T) => TableSortValue;
}

export function createTableRows<T>(
  data: readonly T[],
  getRowKey: (row: T) => string,
): TableKeyedRow<T>[] {
  const keys = new Set<string>();
  return data.map((row) => {
    const key = getRowKey(row);
    if (typeof key !== "string" || key.trim() === "" || keys.has(key)) {
      throw new Error("Table row keys must be unique, non-empty strings.");
    }
    keys.add(key);
    return { key, row };
  });
}

export function validateTableColumns<T extends { key: string }>(
  columns: readonly T[],
): readonly T[] {
  const keys = new Set<string>();
  for (const column of columns) {
    if (
      typeof column.key !== "string" ||
      column.key.trim() === "" ||
      keys.has(column.key)
    ) {
      throw new Error("Table column keys must be unique, non-empty strings.");
    }
    keys.add(column.key);
  }
  return columns;
}

export function normalizeTableKeys<T>(
  value: readonly string[],
  rows: readonly TableKeyedRow<T>[],
): string[] {
  const keys = new Set(rows.map((entry) => entry.key));
  return [...new Set(value)].filter((key) => keys.has(key));
}

export function normalizeTableSort<T>(
  sort: TableSortState | null | undefined,
  columns: readonly SortableColumn<T>[],
): TableSortState | null {
  if (
    !sort ||
    !["asc", "desc"].includes(sort.direction) ||
    !columns.some((column) => column.key === sort.column && column.sortValue)
  ) {
    return null;
  }
  return sort;
}

export function cycleTableSort(
  sort: TableSortState | null,
  column: string,
): TableSortState | null {
  if (!sort || sort.column !== column) return { column, direction: "asc" };
  return sort.direction === "asc" ? { column, direction: "desc" } : null;
}

const collator = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

function comparableValue(
  value: TableSortValue,
): string | number | boolean | null {
  const comparable = value instanceof Date ? value.getTime() : value;
  if (
    comparable === undefined ||
    comparable === null ||
    (typeof comparable === "number" && !Number.isFinite(comparable))
  ) {
    return null;
  }
  return comparable;
}

/** Sort the full dataset before paging; empty/invalid values stay last in both directions. */
export function sortTableRows<T>(
  rows: readonly TableKeyedRow<T>[],
  sort: TableSortState | null,
  columns: readonly SortableColumn<T>[],
): TableKeyedRow<T>[] {
  const column = columns.find((candidate) => candidate.key === sort?.column);
  const sortValue = column?.sortValue;
  if (!sort || !sortValue) return [...rows];
  const direction = sort.direction === "asc" ? 1 : -1;
  return rows
    .map((entry, index) => ({
      entry,
      index,
      value: comparableValue(sortValue(entry.row)),
    }))
    .sort((left, right) => {
      if (left.value === null || right.value === null) {
        if (left.value === right.value) return left.index - right.index;
        return left.value === null ? 1 : -1;
      }
      const comparison =
        typeof left.value === "number" && typeof right.value === "number"
          ? left.value - right.value
          : typeof left.value === "boolean" && typeof right.value === "boolean"
            ? Number(left.value) - Number(right.value)
            : collator.compare(String(left.value), String(right.value));
      return comparison * direction || left.index - right.index;
    })
    .map((item) => item.entry);
}

export function getTablePageSize(pageSize: number): number {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new Error("Table pageSize must be a positive safe integer.");
  }
  return pageSize;
}

export function getTablePageSelection(
  value: readonly string[],
  selectableKeys: readonly string[],
): { checked: boolean; indeterminate: boolean } {
  const selected = new Set(value);
  const count = selectableKeys.filter((key) => selected.has(key)).length;
  return {
    checked: selectableKeys.length > 0 && count === selectableKeys.length,
    indeterminate: count > 0 && count < selectableKeys.length,
  };
}

/** Page changes only affect eligible keys, preserving other pages and disabled rows. */
export function toggleTableSelection(
  value: readonly string[],
  eligibleKeys: readonly string[],
  checked: boolean,
): string[] {
  const result = new Set(value);
  for (const key of eligibleKeys) {
    if (checked) result.add(key);
    else result.delete(key);
  }
  return [...result];
}
