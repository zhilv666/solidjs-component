import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { createServer } from "vite";
import solid from "vite-plugin-solid";

export async function createComponentHarness(name) {
  assert.match(name, /^[a-z][a-z0-9-]*$/);
  const cacheRoot = resolve(tmpdir());
  const cachePrefix = `solidjs-${name}-cache-`;
  const cacheDirectory = await mkdtemp(join(cacheRoot, cachePrefix));
  let server;
  const close = async () => {
    try {
      await server?.close();
    } finally {
      assert.equal(dirname(cacheDirectory), cacheRoot);
      assert.ok(basename(cacheDirectory).startsWith(cachePrefix));
      await rm(cacheDirectory, { recursive: true, force: true });
    }
  };
  try {
    server = await createServer({
      root: fileURLToPath(new URL("../", import.meta.url)),
      configFile: false,
      cacheDir: cacheDirectory,
      plugins: [solid({ dev: false })],
      resolve: {
        alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
      },
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, watch: null, hmr: false, ws: false },
      appType: "custom",
      logLevel: "error",
    });
  } catch (error) {
    await close();
    throw error;
  }
  return {
    config: server.config,
    load: (path) => server.ssrLoadModule(path),
    close,
  };
}
