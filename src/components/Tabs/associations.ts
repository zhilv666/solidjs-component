import {
  createRenderEffect,
  createSignal,
  on,
  onCleanup,
  type Accessor,
} from "solid-js";

interface RegisteredId {
  readonly id: string;
}

export interface TabsIdRegistry {
  get(value: string): string | undefined;
  register(value: string, id: string, onRemove?: () => void): () => void;
}

/** Mirrors IDs only; Kobalte still owns selection, keyboard and focus. */
export function createTabsIdRegistry(): TabsIdRegistry {
  const [entries, setEntries] = createSignal<ReadonlyMap<string, RegisteredId>>(
    new Map(),
  );
  return {
    get: (value) => entries().get(value)?.id,
    register(value, id, onRemove) {
      const entry = { id };
      setEntries((previous) => new Map(previous).set(value, entry));
      return () => {
        setEntries((previous) => {
          if (previous.get(value) !== entry) return previous;
          onRemove?.();
          const next = new Map(previous);
          next.delete(value);
          return next;
        });
      };
    },
  };
}

export function createTabsPartRegistration(
  registry: TabsIdRegistry,
  value: Accessor<string>,
  id: Accessor<string>,
  primitiveIds: Accessor<Map<string, string>>,
): void {
  createRenderEffect(
    on([value, id], ([currentValue, currentId]) => {
      onCleanup(
        registry.register(currentValue, currentId, () => {
          // Clear stale Kobalte fallbacks before reactive ARIA props update.
          const ids = primitiveIds();
          if (ids.get(currentValue) === currentId) ids.delete(currentValue);
        }),
      );
    }),
  );
}
