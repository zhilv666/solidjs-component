import assert from "node:assert/strict";
import test from "node:test";
import { createGenerator } from "unocss";
import config from "../uno.config.ts";

test("approved utilities resolve to theme variables and preserve spacing", async () => {
  const uno = await createGenerator(config);
  const classes = [
    "p-4",
    "bg-primary",
    "text-primary-fg",
    "text-fg",
    "text-fg-muted",
    "border-border",
    "rounded-sm",
    "rounded-md",
    "rounded-lg",
    "text-md",
    "font-normal",
    "font-medium",
    "shadow-sm",
    "shadow-md",
    "shadow-keycap",
    "shadow-keycap-pressed",
    "enabled:active:shadow-keycap-pressed",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "enabled:hover:bg-primary-hover",
    "enabled:hover:not-active:bg-primary-hover",
    "enabled:active:bg-primary-active",
    "transition-colors",
    "transition-shadow",
    "duration-token",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
  ];
  const { css, matched } = await uno.generate(classes.join(" "));
  for (const name of classes)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const name of [
    "color-primary",
    "color-primary-fg",
    "color-fg",
    "color-fg-muted",
    "color-border",
    "radius-md",
    "font-size-md",
    "font-weight-medium",
    "shadow-sm",
    "shadow-keycap",
    "shadow-keycap-pressed",
    "color-ring",
    "transition-duration",
  ]) {
    assert.ok(css.includes(`var(--${name})`), `Missing variable: ${name}`);
  }
});

test("default palettes, forbidden radii and non-token visual utilities do not generate", async () => {
  const uno = await createGenerator(config);
  const classes = [
    "bg-red-500",
    "text-gray-400",
    "bg-white",
    "rounded-xl",
    "rounded-2xl",
    "rounded-t-3xl",
    "font-light",
    "font-bold",
    "font-300",
    "text-2xl",
    "shadow-lg",
    "w-[13px]",
    "text-[#333]",
  ];
  const { matched } = await uno.generate(classes.join(" "));
  assert.deepEqual([...matched], []);
});
