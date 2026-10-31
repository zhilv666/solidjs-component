import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import { format, resolveConfig } from "prettier";
import { generateThemeCss, toKebabCase } from "../src/theme/generate.ts";
import { tokens } from "../src/theme/tokens.ts";

test("CSS variables contain every light and dark color in separate scopes", () => {
  const css = generateThemeCss();
  const blocks = [
    ...css.matchAll(/(:root|\[data-theme="dark"\])\s*\{([^}]+)\}/g),
  ];
  assert.equal(blocks.length, 2);

  for (const [index, colors] of [tokens.color, tokens.darkColor].entries()) {
    for (const [name, value] of Object.entries(colors)) {
      assert.ok(
        blocks[index][2].includes(`--color-${toKebabCase(name)}: ${value};`),
      );
    }
  }
  assert.ok(css.includes(`--font-size-md: ${tokens.font.size.md};`));
  assert.ok(
    css.includes(`--transition-duration: ${tokens.transition.duration};`),
  );
});

test("changing primary leaves hover and active dependent on that CSS variable", () => {
  const changed = {
    ...tokens,
    color: { ...tokens.color, primary: "#0f766e" },
  };
  const original = generateThemeCss();
  const css = generateThemeCss(changed);
  assert.equal(
    css,
    original.replace(
      `--color-primary: ${tokens.color.primary};`,
      "--color-primary: #0f766e;",
    ),
  );
  for (const state of ["hover", "active"]) {
    assert.equal(
      [
        ...css.matchAll(
          new RegExp(
            `--color-primary-${state}: color-mix\\(in srgb, var\\(--color-primary\\)`,
            "g",
          ),
        ),
      ].length,
      2,
    );
  }
});

test("generated stylesheet stays in sync with tokens and formatting", async () => {
  const output = new URL("../src/theme/theme.css", import.meta.url);
  const options = await resolveConfig(fileURLToPath(output));
  const expected = await format(generateThemeCss(), {
    ...options,
    parser: "css",
  });
  assert.equal(await readFile(output, "utf8"), expected);
});
