import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import UnoCSS from "unocss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [UnoCSS(), solid()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build:
    mode === "library"
      ? {
          outDir: "dist-lib",
          lib: {
            entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
            formats: ["es"],
            fileName: "index",
            cssFileName: "style",
          },
          rolldownOptions: {
            external: (id) =>
              ["solid-js", "@kobalte/core", "clsx"].some(
                (dependency) =>
                  id === dependency || id.startsWith(`${dependency}/`),
              ),
          },
        }
      : undefined,
}));
