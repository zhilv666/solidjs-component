export interface ListKeyedItem {
  value: string;
}

export function validateListItems<T extends ListKeyedItem>(
  items: readonly T[],
) {
  const keys = new Set<string>();
  for (const item of items) {
    if (item.value.trim() === "" || keys.has(item.value)) {
      throw new Error("List item values must be unique, non-empty strings.");
    }
    keys.add(item.value);
  }
  return [...items];
}

/** Missing keys never render as selected; single selection uses the first key. */
export function normalizeListKeys(
  keys: Iterable<string>,
  items: readonly ListKeyedItem[],
  mode: "none" | "single" | "multiple",
): string[] {
  if (mode === "none") return [];
  const available = new Set(items.map((item) => item.value));
  const result = [...new Set(keys)].filter((key) => available.has(key));
  return mode === "single" ? result.slice(0, 1) : result;
}
