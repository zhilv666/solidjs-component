import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import { createServer } from "vite";
import solid from "vite-plugin-solid";
import unoConfig from "../uno.config.ts";

let server;
let Button;
let ButtonDemo;
let cacheDirectory;
const cacheRoot = resolve(tmpdir());
const cachePrefix = "solidjs-button-cache-";

before(async () => {
  cacheDirectory = await mkdtemp(join(cacheRoot, cachePrefix));
  server = await createServer({
    configFile: false,
    cacheDir: cacheDirectory,
    plugins: [solid({ dev: false })],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null },
    appType: "custom",
    logLevel: "error",
  });
  ({ Button } = await server.ssrLoadModule("/src/components/index.ts"));
  ({ ButtonDemo } = await server.ssrLoadModule(
    "/src/components/Button/Button.demo.tsx",
  ));
});

after(async () => {
  try {
    await server?.close();
  } finally {
    if (cacheDirectory) {
      assert.equal(dirname(cacheDirectory), cacheRoot);
      assert.ok(basename(cacheDirectory).startsWith(cachePrefix));
      await rm(cacheDirectory, { recursive: true, force: true });
    }
  }
});

function renderButton(props = {}) {
  return renderToString(() => Button({ children: "Save", ...props }));
}

function openingTag(html) {
  const tag = html.match(/<button\b[^>]*>/)?.[0];
  assert.ok(tag, "Expected a native button");
  return tag;
}

test("SSR test server keeps its Vite cache outside the project", () => {
  assert.equal(resolve(server.config.cacheDir), cacheDirectory);
  assert.equal(dirname(resolve(server.config.cacheDir)), cacheRoot);
  assert.notEqual(
    resolve(server.config.cacheDir),
    resolve(server.config.root, "node_modules/.vite"),
  );
});

test("default button is safe in forms and forwards native props and class", () => {
  const html = renderButton({
    id: "save",
    title: "Native title",
    class: "w-full",
  });
  const tag = openingTag(html);
  assert.match(tag, /\stype="button"/);
  assert.match(tag, /\sid="save"/);
  assert.match(tag, /\stitle="Native title"/);
  assert.doesNotMatch(tag, /\sdisabled(?:\s|=|>)/);
  assert.doesNotMatch(tag, /\saria-busy=/);
  const classes = tag
    .match(/\sclass="([^"]*)"/)?.[1]
    .trim()
    .split(/\s+/);
  assert.equal(classes?.at(-1), "w-full");
  assert.ok(html.includes("Save"));
});

test("explicit submit type and caller busy state are preserved", () => {
  const tag = openingTag(renderButton({ type: "submit", "aria-busy": true }));
  assert.match(tag, /\stype="submit"/);
  assert.match(tag, /\saria-busy="true"/);
});

test("loading disables activation and preserves the accessible label", () => {
  const html = renderButton({
    loading: true,
    "aria-label": "Save changes",
    "aria-busy": false,
  });
  const tag = openingTag(html);
  assert.match(tag, /\sdisabled(?:\s|=|>)/);
  assert.match(tag, /\saria-busy="true"/);
  assert.match(tag, /\saria-label="Save changes"/);
  assert.match(html, /aria-hidden="true"/);
  assert.ok(html.includes("Save"));
  assert.match(
    openingTag(renderButton({ disabled: true })),
    /\sdisabled(?:\s|=|>)/,
  );
});

test("every variant, size and state emits valid UnoCSS utilities", async () => {
  const classes = new Set();
  for (const variant of ["solid", "outline", "ghost", "danger"]) {
    for (const size of ["sm", "md", "lg"]) {
      for (const state of [{}, { disabled: true }, { loading: true }]) {
        const html = renderButton({ variant, size, ...state });
        for (const match of html.matchAll(/\bclass="([^"]+)"/g)) {
          for (const name of match[1].trim().split(/\s+/)) classes.add(name);
        }
      }
    }
  }
  const uno = await createGenerator(unoConfig);
  const { matched } = await uno.generate([...classes].join(" "));
  for (const name of classes)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
});

test("demo renders all 36 matrix cases and labels its icon button", () => {
  const html = renderToString(() => ButtonDemo());
  for (const state of ["常规 / Default", "禁用 / Disabled", "加载 / Loading"]) {
    for (const variant of ["solid", "outline", "ghost", "danger"]) {
      for (const size of ["sm", "md", "lg"]) {
        assert.ok(html.includes(`aria-label="${state} ${variant} ${size}"`));
      }
    }
  }
  assert.ok(html.includes('aria-label="新增项目并增加计数"'));
});
