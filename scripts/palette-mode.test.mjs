import assert from "node:assert/strict";
import test from "node:test";
import {
  PALETTE_STORAGE_KEY,
  applyPalette,
  getPreferredPalette,
  isThemePalette,
  paletteOptions,
} from "../src/theme/palette-mode.ts";
import { THEME_STORAGE_KEY, applyTheme } from "../src/theme/mode.ts";
import {
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
} from "../src/theme/appearance-mode.ts";

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

test("palette validation accepts only approved primitive strings", () => {
  for (const option of paletteOptions)
    assert.equal(isThemePalette(option.value), true);
  for (const value of [
    null,
    undefined,
    "",
    "dark",
    "mahjong",
    "invalid",
    0,
    {},
    ["sakura"],
  ])
    assert.equal(isThemePalette(value), false);
});

test("each palette preference is restored without consulting appearance or system color", (context) => {
  let selected = "default";
  stubGlobal(context, "window", {
    localStorage: {
      getItem: (key) => {
        assert.equal(key, PALETTE_STORAGE_KEY);
        return selected;
      },
    },
  });
  for (const option of paletteOptions) {
    selected = option.value;
    assert.equal(getPreferredPalette(), selected);
  }
});

test("missing and invalid stored palettes fall back to original blue", (context) => {
  let selected = null;
  stubGlobal(context, "window", { localStorage: { getItem: () => selected } });
  assert.equal(getPreferredPalette(), "default");
  selected = "keycap";
  assert.equal(getPreferredPalette(), "default");
});

test("palette, appearance and mode change and persist independently", (context) => {
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
  for (const option of paletteOptions) {
    applyPalette(option.value);
    assert.equal(root.dataset.palette, option.value);
    assert.equal(root.dataset.appearance, "mahjong");
    assert.equal(root.dataset.theme, "dark");
    assert.equal(stored.get(PALETTE_STORAGE_KEY), option.value);
    assert.equal(getPreferredPalette(), option.value);
  }
  assert.equal(stored.get(THEME_STORAGE_KEY), "dark");
  assert.equal(stored.get(APPEARANCE_STORAGE_KEY), "mahjong");
  applyTheme("light");
  applyAppearance("keycap");
  assert.equal(root.dataset.palette, "apricot");
});

test("a blocked storage getter does not prevent live palette updates", (context) => {
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    get localStorage() {
      throw new Error("Storage unavailable");
    },
  });
  assert.equal(getPreferredPalette(), "default");
  assert.doesNotThrow(() => applyPalette("sakura"));
  assert.equal(root.dataset.palette, "sakura");
});

test("failed storage writes do not prevent switching back to default", (context) => {
  const root = { dataset: { palette: "mint" } };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    localStorage: {
      getItem: () => "mint",
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    },
  });
  assert.equal(getPreferredPalette(), "mint");
  assert.doesNotThrow(() => applyPalette("default"));
  assert.equal(root.dataset.palette, "default");
});

test("server rendering uses default blue without DOM side effects", (context) => {
  stubGlobal(context, "window", undefined);
  stubGlobal(context, "document", undefined);
  assert.equal(getPreferredPalette(), "default");
  assert.doesNotThrow(() => applyPalette("lavender"));
});
