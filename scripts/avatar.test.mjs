import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";
import { findTokenViolations } from "./check-tokens.mjs";

let harness, Avatar, AvatarDemo;
before(async () => {
  harness = await createComponentHarness("avatar");
  ({ Avatar } = await harness.load("/src/components/index.ts"));
  ({ AvatarDemo } = await harness.load(
    "/src/components/Avatar/Avatar.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) =>
  renderToString(() => Avatar({ alt: "Profile", ...props }));
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("avatar provides a stable image name and immediate fallback with native defaults", () => {
  const html = render({
    id: "profile",
    title: "Native title",
    class: "align-top",
    fallback: "UI",
  });
  assert.match(html, /^<span\b/);
  for (const attribute of [
    'role="img"',
    'aria-label="Profile"',
    'id="profile"',
    'title="Native title"',
    'aria-hidden="true"',
  ])
    assert.ok(html.includes(attribute));
  assert.ok(
    html.includes("UI") &&
      classes(html).includes("h-10") &&
      classes(html).includes("text-md"),
  );
  assert.equal(
    html
      .match(/class="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "align-top",
  );
  assert.doesNotMatch(
    html,
    /\s(?:alt|src|fallback|variant|size|appearance|imageProps|tabindex)=/,
  );
});

test("decorative avatars are hidden and caller ARIA naming overrides remain available", () => {
  const html = render({ alt: "" });
  assert.ok(html.includes('aria-hidden="true"'));
  assert.doesNotMatch(html, /role="img"|aria-label=/);
  const named = render({ "aria-label": "Team member", "aria-hidden": false });
  assert.ok(
    named.includes('aria-label="Team member"') &&
      named.includes('aria-hidden="false"'),
  );
  assert.ok(!named.includes('aria-label="Profile"'));
});

test("avatar fallback remains safe during SSR and no hidden interactive children are accepted", () => {
  assert.ok(
    render({ src: "data:image/svg+xml,invalid", fallback: "Failure" }).includes(
      "Failure",
    ),
  );
  assert.ok(
    render({ fallback: "<script>alert(1)</script>" }).includes("&lt;script>"),
  );
  assert.ok(!render({ children: "Hidden content" }).includes("Hidden content"));
  assert.ok(render().includes("?"));
});

test("avatar uses only its approved circular exception and static token appearance utilities", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["circle", "square"])
      for (const size of ["sm", "md", "lg"]) {
        const current = classes(render({ appearance, variant, size }));
        assert.ok(
          current.includes(
            variant === "circle" ? "rounded-full" : "rounded-md",
          ),
        );
        assert.ok(
          current.includes({ sm: "h-8", md: "h-10", lg: "h-12" }[size]),
        );
        assert.ok(
          !current.some((name) =>
            /hover:|active:|focus:|animate|cursor-pointer/.test(name),
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
    "--color-fg",
    "--radius-md",
    "--font-size-md",
    "--shadow-keycap",
    "--shadow-mahjong",
  ])
    assert.ok(css.includes(`var(${token})`));
  const source = await readFile(
    new URL("../src/components/Avatar/Avatar.tsx", import.meta.url),
    "utf8",
  );
  assert.deepEqual(findTokenViolations(source, "Avatar.tsx"), []);
});

test("avatar delegates image loading and native image attributes to Kobalte", async () => {
  const source = await readFile(
    new URL("../src/components/Avatar/Avatar.tsx", import.meta.url),
    "utf8",
  );
  for (const expected of [
    "@kobalte/core/image",
    "onLoadingStatusChange={local.onLoadingStatusChange}",
    "{...local.imageProps}",
    "src={local.src}",
    'alt=""',
    "local.imageProps.class",
  ])
    assert.ok(source.includes(expected));
  assert.doesNotMatch(
    source,
    /new (?:window\.)?Image|setTimeout|addEventListener/,
  );
  const uno = await createGenerator(unoConfig),
    { matched } = await uno.generate(source);
  for (const name of ["object-cover", "h-full", "w-full"])
    assert.ok(matched.has(name));
});

test("avatar demo covers every appearance, shape, size and image state with recovery controls", () => {
  const html = renderToString(() => AvatarDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["circle", "square"])
      for (const size of ["sm", "md", "lg"])
        for (const state of ["image", "fallback", "error"])
          assert.ok(
            html.includes(
              `id="avatar-${appearance}-${variant}-${size}-${state}"`,
            ),
          );
  for (const id of [
    "avatar-live",
    "avatar-toggle-source",
    "avatar-toggle-shape",
    "avatar-status",
    "avatar-decorative",
    "avatar-native",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('aria-live="polite"'));
});
