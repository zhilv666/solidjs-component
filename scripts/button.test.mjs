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

test("hover styles exclude the pressed state", async () => {
  const classes = new Set();
  for (const variant of ["solid", "outline", "ghost", "danger"]) {
    const tag = openingTag(renderButton({ variant }));
    for (const name of tag.match(/\sclass="([^"]*)"/)[1].split(/\s+/)) {
      classes.add(name);
    }
  }
  const uno = await createGenerator(unoConfig);
  const { css } = await uno.generate([...classes].join(" "));
  const hoverRules = css
    .split("\n")
    .filter((rule) => rule.includes("\\:hover\\:"));
  assert.equal(hoverRules.length, 5);
  for (const rule of hoverRules) {
    assert.ok(
      rule.includes(":not(:active)"),
      `Hover can override active: ${rule}`,
    );
  }
});

test("keycap variants use token shadows without movement", () => {
  for (const variant of ["solid", "outline", "danger"]) {
    const tag = openingTag(renderButton({ variant }));
    const classes = new Set(tag.match(/\sclass="([^"]*)"/)[1].split(/\s+/));
    for (const name of [
      "shadow-keycap",
      "enabled:active:shadow-keycap-pressed",
      "disabled:shadow-sm",
      "transition-shadow",
      "duration-token",
    ]) {
      assert.ok(classes.has(name), `${variant} is missing ${name}`);
    }
    assert.ok(
      [...classes].every((name) => !/(?:translate|scale|transform)/.test(name)),
    );
  }
  assert.doesNotMatch(
    openingTag(renderButton({ variant: "ghost" })),
    /shadow-keycap/,
  );
});

test("legacy variants and the default keep their existing class strings", () => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none whitespace-nowrap duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";
  const keycap =
    "shadow-keycap transition-shadow enabled:active:shadow-keycap-pressed disabled:shadow-sm";
  const legacy = {
    solid: `${keycap} border border-primary bg-primary text-primary-fg enabled:hover:not-active:border-primary-hover enabled:hover:not-active:bg-primary-hover enabled:active:border-primary-active enabled:active:bg-primary-active`,
    outline: `${keycap} border border-primary bg-surface text-primary enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active`,
    ghost:
      "border-0 text-fg transition-colors enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
    danger: `${keycap} border border-danger bg-danger text-danger-fg enabled:hover:not-active:border-danger-hover enabled:hover:not-active:bg-danger-hover enabled:active:border-danger-active enabled:active:bg-danger-active`,
  };
  const sizes = {
    sm: "h-8 px-3 text-md",
    md: "h-10 px-4 text-md",
    lg: "h-12 px-5 text-lg",
  };
  for (const [variant, variantClasses] of Object.entries(legacy)) {
    for (const [size, sizeClasses] of Object.entries(sizes)) {
      for (const state of [{}, { disabled: true }, { loading: true }]) {
        const tag = openingTag(renderButton({ variant, size, ...state }));
        assert.equal(
          tag.match(/\sclass="([^"]*)"/)[1].trim(),
          `${base} ${variantClasses} ${sizeClasses}`,
        );
      }
    }
  }
  assert.equal(
    openingTag(renderButton())
      .match(/\sclass="([^"]*)"/)[1]
      .trim(),
    `${base} ${legacy.solid} ${sizes.md}`,
  );
});

test("mahjong is an independent tokenized variant with pressed and disabled states", async () => {
  const tag = openingTag(renderButton({ variant: "mahjong" }));
  const classes = new Set(tag.match(/\sclass="([^"]*)"/)[1].trim().split(/\s+/));
  for (const name of [
    "shadow-mahjong",
    "enabled:active:shadow-mahjong-pressed",
    "disabled:shadow-sm",
    "bg-bg",
    "text-fg",
    "border-solid",
    "transition-shadow",
    "duration-token",
  ]) {
    assert.ok(classes.has(name), `Mahjong is missing ${name}`);
  }
  assert.ok(
    [...classes].every(
      (name) => !/(?:keycap|translate|scale|transform|gradient)/.test(name),
    ),
  );
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...classes].join(" "));
  for (const name of classes) assert.ok(matched.has(name));
  for (const name of ["shadow-mahjong", "shadow-mahjong-pressed"]) {
    assert.ok(css.includes(`var(--${name})`));
  }
  const hoverRules = css
    .split("\n")
    .filter((rule) => rule.includes("\\:hover\\:"));
  assert.equal(hoverRules.length, 2);
  for (const rule of hoverRules) assert.ok(rule.includes(":not(:active)"));
  for (const state of [{ disabled: true }, { loading: true }]) {
    assert.match(
      openingTag(renderButton({ variant: "mahjong", ...state })),
      /\sdisabled(?:\s|=|>)/,
    );
  }
});

test("every variant, size and state emits valid UnoCSS utilities", async () => {
  const classes = new Set();
  for (const variant of ["solid", "outline", "ghost", "danger", "mahjong"]) {
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

test("demo compares both styles in all sizes and states with live mahjong controls", () => {
  const html = renderToString(() => ButtonDemo());
  for (const style of ["keycap", "mahjong"]) {
    for (const state of [
      "常规 / Default",
      "禁用 / Disabled",
      "加载 / Loading",
    ]) {
      for (const size of ["sm", "md", "lg"]) {
        const name = `样式对比 ${style} ${state} ${size}`;
        assert.ok(html.includes(`aria-label="${name}"`), `Missing ${name}`);
      }
    }
  }
  assert.ok(html.includes('id="mahjong-counter-button"'));
  assert.ok(html.includes('id="mahjong-save-button"'));
});
