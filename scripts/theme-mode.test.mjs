import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTheme,
  getPreferredTheme,
  THEME_STORAGE_KEY,
} from "../src/theme/mode.ts";

function stubGlobal(context, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else Reflect.deleteProperty(globalThis, name);
  });
}

test("stored theme takes precedence over system preference", (context) => {
  stubGlobal(context, "window", {
    localStorage: { getItem: () => "light" },
    matchMedia: () => ({ matches: true }),
  });
  assert.equal(getPreferredTheme(), "light");
});

test("invalid stored preference falls back to system theme", (context) => {
  stubGlobal(context, "window", {
    localStorage: { getItem: () => "invalid" },
    matchMedia: () => ({ matches: true }),
  });
  assert.equal(getPreferredTheme(), "dark");
});

test("switching themes updates the root and persists the selection", (context) => {
  const stored = new Map();
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
    matchMedia: () => ({ matches: false }),
  });
  applyTheme("dark");
  assert.equal(root.dataset.theme, "dark");
  assert.equal(stored.get(THEME_STORAGE_KEY), "dark");
  assert.equal(getPreferredTheme(), "dark");
  applyTheme("light");
  assert.equal(root.dataset.theme, "light");
  assert.equal(getPreferredTheme(), "light");
});

test("blocked storage still permits theme selection and root updates", (context) => {
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    get localStorage() {
      throw new Error("Storage unavailable");
    },
    matchMedia: () => ({ matches: true }),
  });
  assert.equal(getPreferredTheme(), "dark");
  assert.doesNotThrow(() => applyTheme("dark"));
  assert.equal(root.dataset.theme, "dark");
});
