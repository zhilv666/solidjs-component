import assert from "node:assert/strict";
import test from "node:test";
import { tokens } from "../src/theme/tokens.ts";
import { generateThemeCss, toKebabCase } from "../src/theme/generate.ts";
import { paletteOptions } from "../src/theme/palette-mode.ts";

function channels(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i);
  return [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
}
function luminance(color) {
  const linear = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}
const mix = (first, second, ratio) =>
  first.map((channel, index) => channel * ratio + second[index] * (1 - ratio));

test("palette choices match the four approved token overrides plus default blue", () => {
  assert.deepEqual(
    paletteOptions.map((option) => option.value),
    ["default", "sakura", "mint", "lavender", "apricot"],
  );
  assert.deepEqual(
    Object.keys(tokens.palettes),
    paletteOptions.slice(1).map((option) => option.value),
  );
  for (const palette of Object.values(tokens.palettes))
    for (const colors of [palette.color, palette.darkColor]) {
      assert.ok(colors.primary);
      assert.ok(colors.bg);
      assert.ok(colors.surface);
      for (const key of Object.keys(colors)) assert.ok(key in tokens.color);
      // Semantic feedback and the mahjong's green base keep their meaning.
      for (const key of ["danger", "dangerFg", "success", "warning"])
        assert.equal(colors[key], undefined);
    }
});

for (const [name, palette] of Object.entries(tokens.palettes))
  for (const [mode, colors] of Object.entries({
    light: { ...tokens.color, ...palette.color },
    dark: { ...tokens.darkColor, ...palette.darkColor },
  }))
    test(`${name}/${mode} text, pressed colors, outlines and focus meet AA contrast`, () => {
      const values = Object.fromEntries(
        Object.entries(colors).map(([key, value]) => [key, channels(value)]),
      );
      const surfaceHover = mix(values.surface, values.fg, 0.96);
      const surfaceActive = mix(values.surface, values.fg, 0.92);
      const pairs = [
        ["fg/bg", values.fg, values.bg],
        ["fg/surface", values.fg, values.surface],
        ["fgMuted/bg", values.fgMuted, values.bg],
        ["fgMuted/surface", values.fgMuted, values.surface],
        ["primaryFg/primary", values.primaryFg, values.primary],
        ["dangerFg/danger", values.dangerFg, values.danger],
        ["primary/bg", values.primary, values.bg],
        ["primary/surface", values.primary, values.surface],
        ["success/surface", values.success, values.surface],
        ["warning/surface", values.warning, values.surface],
        ["fg/surface-hover", values.fg, surfaceHover],
        ["fg/surface-active", values.fg, surfaceActive],
        ["fgMuted/surface-active", values.fgMuted, surfaceActive],
        ["primary/surface-hover", values.primary, surfaceHover],
        ["primary/surface-active", values.primary, surfaceActive],
      ];
      for (const color of ["primary", "danger"])
        for (const [state, ratio] of [
          ["hover", 0.9],
          ["active", 0.8],
        ])
          pairs.push([
            `${color}Fg/${color}-${state}`,
            values[`${color}Fg`],
            mix(values[color], [0, 0, 0], ratio),
          ]);
      for (const [pair, foreground, background] of pairs) {
        const result = contrast(foreground, background);
        assert.ok(
          result >= 4.5,
          `${name}/${mode} ${pair}: ${result.toFixed(2)}:1`,
        );
      }
      for (const color of ["border", "ring"])
        for (const background of ["bg", "surface"]) {
          const result = contrast(values[color], values[background]);
          assert.ok(
            result >= 3,
            `${name}/${mode} ${color}/${background}: ${result.toFixed(2)}:1`,
          );
        }
    });

test("palette overrides use root-scoped selectors with higher specificity for dark mode", () => {
  const css = generateThemeCss();
  const blocks = [...css.matchAll(/([^{}]+)\{([^}]+)\}/g)];
  for (const [name, palette] of Object.entries(tokens.palettes))
    for (const [selector, colors] of [
      [`:root[data-palette="${name}"]`, palette.color],
      [`:root[data-theme="dark"][data-palette="${name}"]`, palette.darkColor],
    ]) {
      const block = blocks.find((match) => match[1].trim() === selector);
      assert.ok(block, selector);
      for (const [key, value] of Object.entries(colors))
        assert.ok(block[2].includes(`--color-${toKebabCase(key)}: ${value};`));
      assert.doesNotMatch(
        block[2],
        /--(?:radius|shadow|font|animation|transition)-/,
      );
    }
  // The original root and dark declarations still own every derived state.
  assert.equal((css.match(/--color-primary-hover:/g) ?? []).length, 2);
  assert.equal((css.match(/--color-primary-active:/g) ?? []).length, 2);
  assert.ok(
    css.indexOf(':root[data-palette="sakura"]') >
      css.indexOf('[data-theme="dark"]'),
  );
});

test("changing one palette primary does not change default colors or the other palettes", () => {
  const original = generateThemeCss();
  const changed = generateThemeCss({
    ...tokens,
    palettes: {
      ...tokens.palettes,
      sakura: {
        ...tokens.palettes.sakura,
        color: { ...tokens.palettes.sakura.color, primary: "#7a2851" },
      },
    },
  });
  assert.equal(
    changed,
    original.replace(
      `--color-primary: ${tokens.palettes.sakura.color.primary};`,
      "--color-primary: #7a2851;",
    ),
  );
});
