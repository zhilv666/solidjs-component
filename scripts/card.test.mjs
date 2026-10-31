import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Card, CardDemo;
before(async () => {
  harness = await createComponentHarness("card");
  ({ Card } = await harness.load("/src/components/index.ts"));
  ({ CardDemo } = await harness.load("/src/components/Card/Card.demo.tsx"));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Card(props));
const classes = (html) =>
  html
    .match(/class="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);

test("card defaults to a noninteractive section and forwards native attributes/class and zero", () => {
  const html = render({
    id: "card",
    title: "Native title",
    "aria-labelledby": "title",
    class: "w-full",
    children: 0,
  });
  assert.match(html, /^<section\b/);
  assert.ok(
    html.includes('id="card"') &&
      html.includes('title="Native title"') &&
      html.includes('aria-labelledby="title"') &&
      html.endsWith(">0</section>"),
  );
  const names = classes(html);
  assert.ok(
    names.includes("p-4") &&
      names.includes("bg-surface") &&
      names.includes("text-fg"),
  );
  assert.equal(names.at(-1), "w-full");
  assert.doesNotMatch(html, /\s(?:variant|size|tabindex|role)=/i);
  assert.ok(!names.includes("shadow-sm"));
});
test("card variants have clear borders and only the elevated variant adds an approved shadow", () => {
  for (const variant of ["outline", "elevated"]) {
    const names = classes(render({ variant }));
    assert.ok(names.includes("border-border") && names.includes("rounded-md"));
    assert.equal(names.includes("shadow-sm"), variant === "elevated");
    assert.ok(
      names.every(
        (name) =>
          !/hover:|active:|focus:|cursor-pointer|keycap|mahjong|animate/.test(
            name,
          ),
      ),
    );
  }
});
test("every card size and variant generates token-only typography and styling", async () => {
  const names = new Set();
  for (const variant of ["outline", "elevated"])
    for (const size of ["sm", "md", "lg"]) {
      const item = classes(render({ variant, size }));
      assert.ok(item.includes({ sm: "p-3", md: "p-4", lg: "p-6" }[size]));
      assert.ok(item.includes(size === "lg" ? "text-lg" : "text-md"));
      for (const name of item) names.add(name);
    }
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-surface",
    "--color-fg",
    "--color-border",
    "--radius-md",
    "--font-size-md",
    "--font-size-lg",
    "--font-weight-normal",
    "--shadow-sm",
  ])
    assert.ok(css.includes(`var(${variable})`));
});
test("card renders empty and escaped text content without inventing controls", () => {
  assert.ok(render().endsWith("></section>"));
  const html = render({ children: "<button>Not a control & text</button>" });
  assert.ok(html.includes("&lt;button>Not a control &amp; text&lt;/button>"));
  assert.ok(!html.includes("<button"));
});
test("card demo covers all variants/sizes, semantic composition and a narrow-screen example", () => {
  const html = renderToString(() => CardDemo());
  for (const variant of ["outline", "elevated"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(
        html.includes(`id="card-${variant}-${size}"`) &&
          html.includes(`aria-labelledby="card-${variant}-${size}-title"`),
      );
  for (const id of [
    "card-composed",
    "card-count",
    "card-counter",
    "card-long-content",
    "card-toggle-size",
    "card-toggle-variant",
    "card-toggle-details",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(
    html.includes("<header") &&
      html.includes("<footer") &&
      html.includes("计数：0"),
  );
});
