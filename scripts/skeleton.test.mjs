import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Skeleton, SkeletonDemo;
before(async () => {
  harness = await createComponentHarness("skeleton");
  ({ Skeleton } = await harness.load("/src/components/index.ts"));
  ({ SkeletonDemo } = await harness.load(
    "/src/components/Skeleton/Skeleton.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Skeleton(props));
const classes = (html) =>
  html
    .match(/class="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);

test("skeleton is an empty decorative native div with explicit defaults and class forwarding", () => {
  const html = render({
    id: "placeholder",
    title: "Native title",
    class: "w-1/2",
  });
  assert.match(html, /^<div\b/);
  assert.ok(
    html.includes('aria-hidden="true"') &&
      html.includes('id="placeholder"') &&
      html.includes('title="Native title"'),
  );
  assert.ok(
    classes(html).includes("h-5") &&
      classes(html).includes("bg-surface-active"),
  );
  assert.equal(classes(html).at(-1), "w-1/2");
  assert.doesNotMatch(html, /\s(?:variant|size|appearance|role|tabindex)=/);
  assert.ok(html.endsWith("></div>"));
});

test("skeleton supports native ARIA overrides without introducing content or focus", () => {
  const html = render({
    "aria-hidden": false,
    "aria-label": "Preview placeholder",
  });
  assert.ok(
    html.includes('aria-hidden="false"') &&
      html.includes('aria-label="Preview placeholder"'),
  );
  assert.ok(!html.includes("<button") && !html.includes("tabindex"));
  assert.ok(!render({ children: "Hidden content" }).includes("Hidden content"));
});

test("skeleton shape sizes use default spacing scales and static token appearances", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["line", "block"])
      for (const size of ["sm", "md", "lg"]) {
        const current = classes(render({ appearance, variant, size }));
        assert.ok(
          current.includes(
            {
              line: { sm: "h-4", md: "h-5", lg: "h-6" },
              block: { sm: "h-16", md: "h-24", lg: "h-32" },
            }[variant][size],
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
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--radius-md",
    "--color-border",
    "--color-surface-active",
    "--shadow-keycap",
    "--shadow-mahjong",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("skeleton demo includes every shape, size and appearance plus accessible loading control", () => {
  const html = renderToString(() => SkeletonDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["line", "block"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(
          html.includes(`id="skeleton-${appearance}-${variant}-${size}"`),
        );
  for (const id of [
    "skeleton-toggle-loading",
    "skeleton-profile",
    "skeleton-status",
    "skeleton-native",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(
    html.includes('aria-busy="true"') && html.includes('aria-live="polite"'),
  );
});
