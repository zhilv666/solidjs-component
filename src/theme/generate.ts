import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { tokens, type ThemeTokens } from "./tokens.ts";

export function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function variables(
  prefix: string,
  values: Readonly<Record<string, string | number>>,
): string[] {
  return Object.entries(values).map(
    ([name, value]) => `--${prefix}-${toKebabCase(name)}: ${value};`,
  );
}

const derivedColors = {
  primaryHover: "color-mix(in srgb, var(--color-primary) 90%, black)",
  primaryActive: "color-mix(in srgb, var(--color-primary) 80%, black)",
  dangerHover: "color-mix(in srgb, var(--color-danger) 90%, black)",
  dangerActive: "color-mix(in srgb, var(--color-danger) 80%, black)",
  surfaceHover: "color-mix(in srgb, var(--color-surface) 96%, var(--color-fg))",
  surfaceActive:
    "color-mix(in srgb, var(--color-surface) 92%, var(--color-fg))",
} as const;

function block(selector: string, declarations: readonly string[]): string {
  return `${selector} {\n${declarations.map((value) => `  ${value}`).join("\n")}\n}`;
}

export function generateThemeCss(theme: ThemeTokens = tokens): string {
  const light = [
    "color-scheme: light;",
    ...variables("color", { ...theme.color }),
    ...variables("color", derivedColors),
    ...variables("radius", theme.radius),
    `--font-family: ${theme.font.family};`,
    ...variables("font-size", theme.font.size),
    ...variables("font-weight", theme.font.weight),
    ...variables("shadow", theme.shadow),
    ...variables("transition", theme.transition),
    ...variables("animation", theme.animation),
  ];
  const dark = [
    "color-scheme: dark;",
    ...variables("color", { ...theme.darkColor }),
    ...variables("color", derivedColors),
  ];

  return [
    "/* Generated from tokens.ts. Run pnpm theme:build to regenerate. */",
    block(":root", light),
    block('[data-theme="dark"]', dark),
    "",
  ].join("\n\n");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const output = new URL("./theme.css", import.meta.url);
  const options = await resolveConfig(fileURLToPath(output));
  const css = await format(generateThemeCss(), { ...options, parser: "css" });
  await writeFile(output, css, "utf8");
  console.log("Generated src/theme/theme.css");
}
