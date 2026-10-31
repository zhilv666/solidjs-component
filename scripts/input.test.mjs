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
let Input;
let InputDemo;
let cacheDirectory;
const cacheRoot = resolve(tmpdir());
const cachePrefix = "solidjs-input-cache-";

before(async () => {
  cacheDirectory = await mkdtemp(join(cacheRoot, cachePrefix));
  server = await createServer({
    configFile: false,
    cacheDir: cacheDirectory,
    plugins: [solid({ dev: false })],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    appType: "custom",
    logLevel: "error",
  });
  ({ Input } = await server.ssrLoadModule("/src/components/index.ts"));
  ({ InputDemo } = await server.ssrLoadModule(
    "/src/components/Input/Input.demo.tsx",
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

function renderInput(props = {}) {
  return renderToString(() => Input(props));
}

function openingTag(html) {
  const tag = html.match(/<input\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
  assert.ok(tag, "Expected a native input");
  return tag;
}

function classNames(tag) {
  return tag
    .match(/\sclass="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);
}

test("input SSR test server uses an isolated temporary Vite cache", () => {
  assert.equal(server.config.server.hmr, false);
  assert.equal(server.config.server.ws, false);
  assert.equal(resolve(server.config.cacheDir), cacheDirectory);
  assert.equal(dirname(resolve(server.config.cacheDir)), cacheRoot);
  assert.notEqual(
    resolve(server.config.cacheDir),
    resolve(server.config.root, "node_modules/.vite"),
  );
});

test("input defaults to medium text input and forwards native props and class", () => {
  const tag = openingTag(
    renderInput({
      id: "account",
      name: "account",
      placeholder: "Account name",
      title: "Native title",
      autocomplete: "username",
      maxlength: 40,
      "aria-label": "Account",
      "aria-describedby": "account-help",
      "data-demo": "native",
      class: "max-w-md",
    }),
  );
  for (const attribute of [
    'id="account"',
    'name="account"',
    'type="text"',
    'placeholder="Account name"',
    'title="Native title"',
    'autocomplete="username"',
    'maxlength="40"',
    'aria-label="Account"',
    'aria-describedby="account-help"',
    'data-demo="native"',
  ]) {
    assert.ok(tag.includes(attribute), `Missing ${attribute}`);
  }
  const classes = classNames(tag);
  assert.equal(classes.at(-1), "max-w-md");
  assert.ok(classes.includes("h-10"));
  assert.ok(classes.includes("text-md"));
  assert.doesNotMatch(tag, /\s(?:size|invalid|prefix|suffix|defaultValue)=/);
  assert.doesNotMatch(tag, /prop:defaultValue/);
  assert.doesNotMatch(tag, /\s(?:disabled|required|readonly)(?:\s|=|>)/);
  assert.doesNotMatch(tag, /\saria-invalid=/);
});

test("default and controlled values support native string and numeric values", () => {
  assert.equal(
    [
      ...openingTag(renderInput({ defaultValue: "Initial" })).matchAll(
        /\svalue=/g,
      ),
    ].length,
    1,
  );
  assert.match(
    openingTag(renderInput({ defaultValue: "Initial" })),
    /\svalue="Initial"/,
  );
  assert.match(
    openingTag(renderInput({ value: "Controlled", defaultValue: "Initial" })),
    /\svalue="Controlled"/,
  );
  assert.match(
    openingTag(renderInput({ type: "number", value: 0 })),
    /\svalue="0"/,
  );
  assert.match(openingTag(renderInput({ value: "" })), /\svalue=""/);
  assert.match(
    openingTag(renderInput({ value: '<"&>' })),
    /\svalue="<&quot;&amp;>"/,
  );
});

test("unnamed input does not acquire a generated successful form-control name", () => {
  assert.match(openingTag(renderInput()), /\sname=""/);
});

test("Kobalte maps invalid, required, disabled and readonly to native and ARIA state", () => {
  const html = renderInput({
    invalid: true,
    required: true,
    disabled: true,
    readOnly: true,
  });
  const tag = openingTag(html);
  for (const name of ["invalid", "required", "disabled", "readonly"]) {
    assert.match(tag, new RegExp(`\\saria-${name}="true"`));
    assert.match(tag, new RegExp(`\\sdata-${name}=""`));
  }
  for (const name of ["required", "disabled", "readonly"]) {
    assert.match(tag, new RegExp(`\\s${name}(?:\\s|=|>)`));
  }
  assert.match(html, /<div\b[^>]*\sdata-invalid=""/);
  assert.ok(classNames(tag).includes("border-danger"));
  assert.match(
    openingTag(renderInput({ readonly: true })),
    /\saria-readonly="true"/,
  );
  assert.doesNotMatch(
    openingTag(renderInput({ readOnly: false, readonly: true })),
    /\sreadonly(?:\s|=|>)/,
  );
});

test("explicit invalid cannot be hidden by a conflicting native aria-invalid", () => {
  assert.match(
    openingTag(renderInput({ invalid: true, "aria-invalid": false })),
    /\saria-invalid="true"/,
  );
  assert.match(
    openingTag(renderInput({ "aria-invalid": "spelling" })),
    /\saria-invalid="spelling"/,
  );
});

test("prefix and suffix are ordered non-interactive slots, including numeric zero", () => {
  const html = renderInput({ prefix: "https://", suffix: ".dev" });
  const inputPosition = html.indexOf("<input");
  assert.ok(html.indexOf('data-input-slot="prefix"') < inputPosition);
  assert.ok(html.indexOf('data-input-slot="suffix"') > inputPosition);
  assert.ok(html.includes("https://"));
  assert.ok(html.includes(".dev"));
  assert.doesNotMatch(openingTag(html), /\s(?:prefix|suffix)=/);
  const slots = [...html.matchAll(/<span\b[^>]*data-input-slot[^>]*>/g)];
  assert.equal(slots.length, 2);
  for (const [tag] of slots) {
    assert.ok(tag.includes('aria-hidden="true"'));
    assert.doesNotMatch(tag, /\s(?:tabindex|role)=/);
  }
  const zero = renderInput({ prefix: 0, suffix: 0 });
  assert.equal([...zero.matchAll(/data-input-slot=/g)].length, 2);
  for (const absent of [undefined, null, false]) {
    assert.doesNotMatch(
      renderInput({ prefix: absent, suffix: absent }),
      /data-input-slot=/,
    );
  }
});

test("input focus and disabled styles use shared tokens without Button shadow exceptions", () => {
  const classes = new Set(classNames(openingTag(renderInput())));
  for (const name of [
    "rounded-md",
    "text-fg",
    "font-normal",
    "placeholder:text-fg-muted",
    "transition-colors",
    "duration-token",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
  ]) {
    assert.ok(classes.has(name), `Missing ${name}`);
  }
  assert.ok(
    [...classes].every(
      (name) =>
        !/(?:keycap|mahjong|translate|scale|transform|gradient)/.test(name),
    ),
  );
});

test("every size and combined state emits valid UnoCSS utilities", async () => {
  const classes = new Set();
  const expectedSizeClasses = { sm: "h-8", md: "h-10", lg: "h-12" };
  for (const size of ["sm", "md", "lg"]) {
    for (const invalid of [false, true]) {
      for (const disabled of [false, true]) {
        for (const readOnly of [false, true]) {
          const html = renderInput({
            size,
            invalid,
            disabled,
            readOnly,
            prefix: "@",
            suffix: ".dev",
          });
          assert.ok(
            classNames(openingTag(html)).includes(expectedSizeClasses[size]),
          );
          for (const match of html.matchAll(/\bclass="([^"]+)"/g)) {
            for (const name of match[1].trim().split(/\s+/)) classes.add(name);
          }
        }
      }
    }
  }
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...classes].join(" "));
  for (const name of classes) {
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  }
  for (const variable of ["--color-ring", "--color-danger", "--radius-md"]) {
    assert.ok(css.includes(`var(${variable})`));
  }
});

test("input hover styles cannot override the pressed or disabled state", async () => {
  const classes = [false, true].flatMap((invalid) =>
    classNames(openingTag(renderInput({ invalid }))),
  );
  const uno = await createGenerator(unoConfig);
  const { css } = await uno.generate(classes.join(" "));
  const hoverRules = css
    .split("\n")
    .filter((rule) => rule.includes("\\:hover\\:"));
  assert.equal(hoverRules.length, 2);
  for (const rule of hoverRules) {
    assert.ok(rule.includes(":enabled"));
    assert.ok(rule.includes(":not(:active)"));
  }
});

test("input demo covers every size and state with accessible error descriptions", () => {
  const html = renderToString(() => InputDemo());
  for (const state of [
    "常规 / Default",
    "错误 / Invalid",
    "禁用 / Disabled",
    "只读 / Read only",
  ]) {
    for (const size of ["sm", "md", "lg"]) {
      assert.ok(html.includes(`aria-label="${state} ${size}"`));
    }
  }
  for (const size of ["sm", "md", "lg"]) {
    assert.ok(html.includes(`aria-describedby="input-invalid-${size}-error"`));
    assert.ok(html.includes(`id="input-invalid-${size}-error"`));
  }
});

test("input demo includes JSX slots, controlled editing and native form submission/reset", () => {
  const html = renderToString(() => InputDemo());
  for (const id of [
    "input-prefix",
    "input-suffix",
    "input-both",
    "input-controlled",
    "input-native-form",
    "input-account",
  ]) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.ok(html.includes('name="account"'));
  assert.ok(html.includes('type="submit"'));
  assert.ok(html.includes('type="reset"'));
  assert.ok(html.includes('data-demo="class-passthrough"'));
  assert.equal([...html.matchAll(/data-input-slot=/g)].length, 4);
});
