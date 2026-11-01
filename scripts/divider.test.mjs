import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Divider, DividerDemo;
before(async () => {
  harness = await createComponentHarness("divider");
  ({ Divider } = await harness.load("/src/components/index.ts"));
  ({ DividerDemo } = await harness.load(
    "/src/components/Divider/Divider.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Divider(props));
const classes = (html) =>
  html
    .match(/class="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);

test("divider renders a semantic native hr with horizontal defaults and attribute forwarding", () => {
  const html = render({
    id: "separator",
    title: "Native title",
    class: "w-3/4",
  });
  assert.match(html, /^<hr\b/);
  for (const attribute of [
    'id="separator"',
    'title="Native title"',
    'data-orientation="horizontal"',
  ])
    assert.ok(html.includes(attribute));
  assert.ok(
    classes(html).includes("border-t-2") &&
      classes(html).includes("border-solid"),
  );
  assert.equal(classes(html).at(-1), "w-3/4");
  assert.doesNotMatch(
    html,
    /\s(?:variant|size|appearance|orientation|decorative|tabindex|aria-hidden|aria-orientation)=/,
  );
});

test("vertical divider semantics are Kobalte-owned and decorative or native ARIA overrides are forwarded", () => {
  const vertical = render({ orientation: "vertical" });
  assert.ok(
    vertical.includes('aria-orientation="vertical"') &&
      vertical.includes('data-orientation="vertical"'),
  );
  assert.ok(
    classes(vertical).includes("border-l-2") &&
      classes(vertical).includes("self-stretch"),
  );
  assert.ok(render({ decorative: true }).includes('aria-hidden="true"'));
  assert.ok(
    render({ decorative: true, "aria-hidden": false, role: "none" }).includes(
      'aria-hidden="false"',
    ),
  );
  assert.ok(render({ role: "none" }).includes('role="none"'));
  assert.ok(!render({ children: "Hidden content" }).includes("Hidden content"));
});

test("every divider style, thickness, orientation and appearance generates static token-only utilities", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["solid", "dashed"])
      for (const size of ["sm", "md", "lg"])
        for (const orientation of ["horizontal", "vertical"]) {
          const current = classes(
            render({ appearance, variant, size, orientation }),
          );
          assert.ok(current.includes(`border-${variant}`));
          assert.ok(
            current.includes(
              `border-${orientation === "horizontal" ? "t" : "l"}${size === "sm" ? "" : size === "md" ? "-2" : "-4"}`,
            ),
          );
          assert.ok(
            !current.some((name) =>
              /active:|hover:|focus:|cursor-pointer|animate|rounded-full/.test(
                name,
              ),
            ),
          );
          if (appearance !== "default")
            assert.ok(current.includes(`shadow-${appearance}`));
          for (const name of current) names.add(name);
        }
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--color-border",
    "--radius-md",
    "--shadow-keycap",
    "--shadow-mahjong",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("default divider appearance is unchanged when selected explicitly", () => {
  assert.deepEqual(
    classes(render()),
    classes(render({ appearance: "default" })),
  );
  assert.ok(!classes(render()).some((name) => name.includes("shadow")));
});

test("divider demo covers all matrix combinations, keyboard controls and decoration", () => {
  const html = renderToString(() => DividerDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["solid", "dashed"])
      for (const size of ["sm", "md", "lg"])
        for (const orientation of ["horizontal", "vertical"])
          assert.ok(
            html.includes(
              `id="divider-${appearance}-${variant}-${size}-${orientation}"`,
            ),
          );
  for (const id of [
    "divider-live",
    "divider-toggle-orientation",
    "divider-toggle-size",
    "divider-status",
    "divider-decorative",
    "divider-native",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('aria-live="polite"'));
});
