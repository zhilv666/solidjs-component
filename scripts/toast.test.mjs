import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, afterEach, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Toast, Toaster, toast, ToastDemo;
before(async () => {
  harness = await createComponentHarness("toast");
  ({ Toast, Toaster, toast } = await harness.load("/src/components/index.ts"));
  ({ ToastDemo } = await harness.load("/src/components/Toast/Toast.demo.tsx"));
});
afterEach(() => toast?.clear());
after(async () => await harness?.close());

const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const rootClasses = (html) => html.match(/<li\b[^>]*class="([^"]*)"/)[1].trim();
const render = (props = {}, regionProps = {}, closeProps = {}) =>
  renderToString(() =>
    Toast.Region({
      ...regionProps,
      get children() {
        return Toast({
          toastId: -1,
          persistent: true,
          ...props,
          get children() {
            return [
              Toast.Title({ id: "toast-title", children: "Heading" }),
              Toast.Description({ id: "toast-description", children: "Body" }),
              Toast.CloseButton({
                "aria-label": "Close notification",
                ...closeProps,
              }),
            ];
          },
        });
      },
    }),
  );
const renderQueue = (props = {}) =>
  renderToString(() =>
    Toast.Region({
      ...props,
      get children() {
        return Toast.List({ id: "toast-list", class: "w-full" });
      },
    }),
  );

test("toast compound API uses Kobalte status semantics and preserves native root attributes and class", () => {
  const html = render({
    id: "native-toast",
    title: "Native title",
    class: "w-full",
    "data-native": "root",
  });
  assert.match(html, /<li\b[^>]*role="status"/);
  assert.match(html, /tabindex="0"/i);
  for (const value of [
    'id="native-toast"',
    'title="Native title"',
    'data-native="root"',
    'aria-live="assertive"',
    'aria-atomic="true"',
  ])
    assert.ok(html.includes(value), value);
  assert.match(html, /<h3\b[^>]*id="toast-title"/);
  assert.match(html, /<p\b[^>]*id="toast-description"/);
  assert.ok(rootClasses(html).endsWith("w-full"));
  assert.doesNotMatch(
    html,
    /\s(?:toastId|toastid|variant|size|appearance|persistent|priority)=/,
  );
  assert.ok(
    classes(html).includes("p-4") && classes(html).includes("shadow-md"),
  );
  assert.equal(typeof Toaster, "function");
  assert.equal(Toast.Root, Toast);
});

test("toast display bases remain static while named native close buttons support pressed and disabled states", () => {
  for (const appearance of ["keycap", "mahjong"]) {
    const html = render(
      { appearance },
      {},
      { class: "self-start", variant: "outline" },
    );
    assert.ok(rootClasses(html).includes(`shadow-${appearance}`));
    assert.doesNotMatch(rootClasses(html), /active:|hover:|cursor-pointer/);
    assert.ok(
      html.includes('type="button"') &&
        html.includes('aria-label="Close notification"'),
    );
    assert.match(
      html,
      new RegExp(`enabled:active:shadow-${appearance}-pressed`),
    );
    assert.ok(
      html
        .match(/<button\b[^>]*class="([^"]*)"/)[1]
        .trim()
        .endsWith("self-start"),
    );
    const disabled = render({ appearance }, {}, { disabled: true });
    const closeClass = disabled.match(/<button\b[^>]*class="([^"]*)"/)[1];
    assert.match(disabled, /<button\b[^>]*disabled(?:="")?/);
    assert.ok(closeClass.includes("shadow-sm"));
    assert.doesNotMatch(closeClass, /shadow-(?:keycap|mahjong)(?:-pressed)?/);
    for (const value of [
      "focus-visible:ring-2",
      "focus-visible:ring-ring",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
    ])
      assert.ok(closeClass.includes(value));
  }
});

test("every toast appearance severity size and close variant generates only approved utilities", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["info", "success", "warning", "danger"])
      for (const size of ["sm", "md", "lg"])
        for (const closeVariant of ["outline", "ghost"])
          for (const disabled of [false, true]) {
            const html = render(
              { appearance, variant, size },
              {},
              { variant: closeVariant, disabled },
            );
            const current = classes(html);
            const semanticBorders = rootClasses(html)
              .split(/\s+/)
              .filter((name) =>
                /^border-(?:primary|success|warning|danger)$/.test(name),
              );
            assert.equal(semanticBorders.length, 1);
            assert.ok(
              current.includes("text-fg") && current.includes("bg-surface"),
            );
            assert.equal(
              rootClasses(html)
                .split(/\s+/)
                .filter((name) => /^shadow-/.test(name)).length,
              1,
            );
            for (const name of current) names.add(name);
          }
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-primary",
    "--color-danger",
    "--color-success",
    "--color-warning",
    "--color-fg",
    "--color-fg-muted",
    "--radius-md",
    "--transition-duration",
    "--font-size-md",
    "--font-size-lg",
    "--font-size-xl",
    "--shadow-md",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--shadow-keycap-pressed",
    "--shadow-mahjong-pressed",
  ])
    assert.ok(css.includes(`var(${variable})`), variable);
});

test("toast roots inherit region style defaults and explicit overrides without changing default classes", () => {
  assert.equal(
    rootClasses(render()),
    rootClasses(render({ appearance: "default", size: "md" })),
  );
  const inherited = render({}, { appearance: "mahjong", size: "lg" });
  assert.ok(
    rootClasses(inherited).includes("shadow-mahjong") &&
      rootClasses(inherited).includes("p-5"),
  );
  assert.ok(
    classes(inherited).includes("text-xl") &&
      classes(inherited).includes("h-12"),
  );
  const override = render(
    { appearance: "keycap", size: "sm" },
    { appearance: "mahjong", size: "lg" },
  );
  assert.ok(
    rootClasses(override).includes("shadow-keycap") &&
      rootClasses(override).includes("p-3"),
  );
  assert.doesNotMatch(override, /shadow-mahjong|h-12/);
  assert.match(override, /<h3\b[^>]*class="[^"]*text-md/);
});

test("toast region and list preserve native properties while Kobalte owns their queue children and hotkey", () => {
  const html = renderQueue({
    id: "region",
    class: "text-left",
    title: "Native region",
    appearance: "keycap",
    size: "sm",
    hotkey: ["shiftKey", "KeyN"],
    "aria-label": "Notifications ({hotkey})",
    regionId: "isolated",
  });
  for (const value of [
    'role="region"',
    'aria-label="Notifications (shift+N)"',
    'id="region"',
    'title="Native region"',
    'id="toast-list"',
    "<ol",
  ])
    assert.ok(html.includes(value), value);
  assert.match(html, /tabindex="-1"/i);
  assert.match(html, /class="[^"]*text-left\s*"/);
  assert.match(html, /class="[^"]*w-full\s*"/);
  assert.doesNotMatch(
    html,
    /\s(?:regionId|appearance|size|hotkey)=|shadow-keycap/,
  );
  assert.ok(!html.includes("<li"));
});

test("global toast calls preserve zero content native title priority and stable unique ids with explicit close defaults", () => {
  const first = toast({
    heading: 0,
    description: 0,
    title: "Native title",
    "data-native": "helper",
    class: "text-left",
    priority: "low",
  });
  const second = toast.show({
    heading: "Second",
    closeLabel: "Dismiss second",
    closable: false,
  });
  assert.equal(typeof first, "number");
  assert.equal(typeof second, "number");
  assert.notEqual(first, second);
  const html = renderQueue({ appearance: "mahjong" });
  assert.ok(
    html.includes('aria-live="polite"') &&
      html.includes('aria-live="assertive"'),
  );
  assert.match(html, /<h3\b[^>]*>0<\/h3>/);
  assert.match(html, /<p\b[^>]*>0<\/p>/);
  assert.ok(
    html.includes('title="Native title"') &&
      html.includes('data-native="helper"'),
  );
  assert.ok(html.includes('aria-label="关闭通知"'));
  assert.ok(!html.includes('aria-label="Dismiss second"'));
  assert.equal([...html.matchAll(/<button\b/g)].length, 1);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotMatch(
    html,
    /\s(?:heading|description|closable|closeLabel|closeButtonProps|region)=/,
  );
});

test("Kobalte global queue limits and region routing support dismissing visible or queued toasts and clearing all regions", () => {
  const ids = Array.from({ length: 4 }, (_, index) =>
    toast({ heading: `Default ${index}` }),
  );
  const scoped = toast({ heading: "Scoped", region: "other" });
  let html = renderQueue();
  assert.equal([...html.matchAll(/<li\b/g)].length, 3);
  assert.ok(!html.includes("Default 3") && !html.includes("Scoped"));
  assert.ok(renderQueue({ regionId: "other" }).includes("Scoped"));
  assert.equal(toast.dismiss(ids[0]), ids[0]);
  html = renderQueue();
  assert.ok(!html.includes("Default 0") && html.includes("Default 3"));
  assert.equal(toast.dismiss(ids[3]), ids[3]);
  assert.ok(!renderQueue().includes("Default 3"));
  toast.dismiss(scoped);
  assert.ok(!renderQueue({ regionId: "other" }).includes("Scoped"));
  toast.clear();
  assert.ok(!renderQueue().includes("<li"));
  assert.ok(!renderQueue({ regionId: "other" }).includes("<li"));
});

test("toast preserves native object and string styles and caller ARIA overrides without replacing Kobalte semantics", () => {
  for (const style of [
    { "max-width": "var(--test-width)" },
    "max-width: var(--test-width);",
  ]) {
    const html = render({
      style,
      "aria-live": "off",
      "aria-label": "Custom notification",
    });
    assert.match(html, /max-width:\s*var\(--test-width\)/);
    assert.ok(
      html.includes('aria-live="off"') &&
        html.includes('aria-label="Custom notification"'),
    );
  }
});

test("toast delegates timers focus hotkey swipe and dismissal to Kobalte and uses click-through viewport layout", async () => {
  const source = await readFile(
    new URL("../src/components/Toast/Toast.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes('from "@kobalte/core/toast"'));
  for (const name of [
    "ToastRootPrimitive",
    "ToastRegionPrimitive",
    "ToastListPrimitive",
    "ToastCloseButtonPrimitive",
    "toaster.show",
    "toaster.dismiss",
    "toaster.clear",
  ])
    assert.ok(source.includes(name));
  assert.doesNotMatch(
    source,
    /addEventListener|setTimeout|setInterval|createEffect|\.focus\(|onKeyDown=|onPointerMove=/,
  );
  assert.ok(
    source.includes("pointer-events-none fixed inset-0") &&
      source.includes("max-h-full overflow-y-auto p-2"),
  );
  assert.ok(
    source.includes('"aria-label": string;') &&
      source.includes("children?: never"),
  );
});

test("toast demo covers every appearance severity size plus polite persistent disabled long and numeric examples", async () => {
  const html = renderToString(() => ToastDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["info", "success", "warning", "danger"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(html.includes(`id="toast-${appearance}-${variant}-${size}"`));
  for (const id of [
    "toast-show-polite",
    "toast-show-persistent",
    "toast-show-disabled-close",
    "toast-dismiss-last",
    "toast-clear",
    "toast-show-long",
    "toast-show-no-close",
    "toast-live-status",
    "toast-style-default",
    "toast-size-lg",
  ])
    assert.ok(html.includes(`id="${id}"`), id);
  const source = await readFile(
    new URL("../src/components/Toast/Toast.demo.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes("Alt+T") &&
      source.includes("onCleanup(toast.clear)") &&
      source.includes('aria-label="通知（{hotkey}）"'),
  );
  assert.ok(!source.includes('id: "toast-'));
});
