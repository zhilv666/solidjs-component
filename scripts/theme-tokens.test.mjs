import assert from "node:assert/strict";
import test from "node:test";
import { tokens } from "../src/theme/tokens.ts";

function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i);
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

for (const [mode, colors] of Object.entries({
  light: tokens.color,
  dark: tokens.darkColor,
})) {
  test(`${mode} theme text meets WCAG AA contrast`, () => {
    const pairs = [
      ["fg", "bg"],
      ["fg", "surface"],
      ["fgMuted", "bg"],
      ["fgMuted", "surface"],
      ["primaryFg", "primary"],
      ["dangerFg", "danger"],
      ["primary", "surface"],
      ["success", "surface"],
      ["warning", "surface"],
    ];
    for (const [foreground, background] of pairs) {
      const values = [
        luminance(colors[foreground]),
        luminance(colors[background]),
      ];
      const contrast =
        (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
      assert.ok(
        contrast >= 4.5,
        `${mode} ${foreground}/${background}: ${contrast.toFixed(2)}:1`,
      );
    }
  });
}
