import { defineConfig, presetUno, type PresetUnoTheme } from "unocss";
import { tokens } from "./src/theme/tokens.ts";

function tokenVariables(prefix: string, names: readonly string[]) {
  return Object.fromEntries(
    names.map((name) => {
      const key = name.replace(
        /[A-Z]/g,
        (letter) => `-${letter.toLowerCase()}`,
      );
      return [key, `var(--${prefix}-${key})`];
    }),
  );
}

const colors = tokenVariables("color", [
  ...Object.keys(tokens.color),
  "primaryHover",
  "primaryActive",
  "dangerHover",
  "dangerActive",
  "surfaceHover",
  "surfaceActive",
]);

export default defineConfig({
  presets: [presetUno()],
  blocklist: [
    /-\[[^\]]+\]/,
    /^rounded(?:-[trblse]{1,2})?-(?:xl|[2-9]xl)$/,
    /^(?:font|fw)-(?:(?:thin|extralight|light|semibold|bold|extrabold|black)|[1-9]00)$/,
  ],
  extendTheme: (theme): PresetUnoTheme => ({
    ...theme,
    colors,
    borderRadius: {
      DEFAULT: "var(--radius-md)",
      ...tokenVariables("radius", Object.keys(tokens.radius)),
      // Circular shapes are reserved for annotated Avatar/Switch exceptions.
      full: theme.borderRadius?.full ?? "",
    },
    fontFamily: { sans: "var(--font-family)" },
    fontSize: Object.fromEntries(
      Object.entries(
        tokenVariables("font-size", Object.keys(tokens.font.size)),
      ).map(([name, value]) => [name, [value, "normal"]]),
    ),
    fontWeight: tokenVariables("font-weight", Object.keys(tokens.font.weight)),
    boxShadow: tokenVariables("shadow", Object.keys(tokens.shadow)),
    duration: {
      DEFAULT: "var(--transition-duration)",
      token: "var(--transition-duration)",
    },
  }),
});
