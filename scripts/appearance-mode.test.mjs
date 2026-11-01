import assert from "node:assert/strict";
import test from "node:test";
import {
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  getPreferredAppearance,
  isComponentAppearance,
} from "../src/theme/appearance-mode.ts";
import { THEME_STORAGE_KEY, applyTheme } from "../src/theme/mode.ts";

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

test("appearance preferences accept only the three approved values", () => {
  for (const value of ["default", "keycap", "mahjong"])
    assert.equal(isComponentAppearance(value), true);
  for (const value of [
    null,
    undefined,
    "",
    "dark",
    "invalid",
    0,
    {},
    ["mahjong"],
  ])
    assert.equal(isComponentAppearance(value), false);
});

test("each stored appearance is restored without consulting the color scheme", (context) => {
  let selected = "default";
  stubGlobal(context, "window", {
    localStorage: {
      getItem: (key) => {
        assert.equal(key, APPEARANCE_STORAGE_KEY);
        return selected;
      },
    },
  });
  for (const value of ["default", "keycap", "mahjong"]) {
    selected = value;
    assert.equal(getPreferredAppearance(), value);
  }
});

test("missing or invalid stored appearance falls back to the original defaults", (context) => {
  let selected = null;
  stubGlobal(context, "window", { localStorage: { getItem: () => selected } });
  assert.equal(getPreferredAppearance(), "default");
  selected = "dark";
  assert.equal(getPreferredAppearance(), "default");
});

test("appearance and light/dark preferences persist independently", (context) => {
  const stored = new Map(),
    root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
  });
  applyTheme("dark");
  applyAppearance("mahjong");
  assert.equal(root.dataset.theme, "dark");
  assert.equal(root.dataset.appearance, "mahjong");
  assert.equal(stored.get(THEME_STORAGE_KEY), "dark");
  assert.equal(getPreferredAppearance(), "mahjong");
  applyTheme("light");
  assert.equal(root.dataset.appearance, "mahjong");
  applyAppearance("keycap");
  assert.equal(root.dataset.theme, "light");
  assert.equal(stored.get(APPEARANCE_STORAGE_KEY), "keycap");
});

test("a blocked storage getter does not prevent live appearance changes", (context) => {
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    get localStorage() {
      throw new Error("Storage unavailable");
    },
  });
  assert.equal(getPreferredAppearance(), "default");
  assert.doesNotThrow(() => applyAppearance("mahjong"));
  assert.equal(root.dataset.appearance, "mahjong");
});

test("a blocked storage write does not prevent root appearance updates", (context) => {
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    localStorage: {
      getItem: () => "keycap",
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    },
  });
  assert.equal(getPreferredAppearance(), "keycap");
  assert.doesNotThrow(() => applyAppearance("default"));
  assert.equal(root.dataset.appearance, "default");
});

test("server rendering has stable default preferences and no DOM side effects", (context) => {
  stubGlobal(context, "window", undefined);
  stubGlobal(context, "document", undefined);
  assert.equal(getPreferredAppearance(), "default");
  assert.doesNotThrow(() => applyAppearance("keycap"));
});
