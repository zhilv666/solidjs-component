import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, DropdownMenu, DropdownMenuDemo;
before(async () => {
  harness = await createComponentHarness("dropdown-menu");
  ({ DropdownMenu } = await harness.load("/src/components/index.ts"));
  ({ DropdownMenuDemo } = await harness.load(
    "/src/components/DropdownMenu/DropdownMenu.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (
  root = {},
  trigger = {},
  item = {},
  checkbox = {},
  group = {},
  content = {},
) =>
  renderToString(() =>
    createComponent(DropdownMenu, {
      ...root,
      get children() {
        return [
          createComponent(DropdownMenu.Trigger, {
            children: "Trigger",
            ...trigger,
          }),
          createComponent(DropdownMenu.Content, {
            ...content,
            get children() {
              return [
                createComponent(DropdownMenu.Group, {
                  get children() {
                    return [
                      createComponent(DropdownMenu.GroupLabel, {
                        children: "Actions",
                      }),
                      createComponent(DropdownMenu.Item, {
                        ...item,
                        get children() {
                          return [
                            createComponent(DropdownMenu.ItemLabel, {
                              children: "Action",
                            }),
                            createComponent(DropdownMenu.ItemDescription, {
                              children: "Help text",
                            }),
                          ];
                        },
                      }),
                    ];
                  },
                }),
                createComponent(DropdownMenu.Separator, {}),
                createComponent(DropdownMenu.CheckboxItem, {
                  ...checkbox,
                  get children() {
                    return [
                      createComponent(DropdownMenu.ItemLabel, {
                        children: "Grid",
                      }),
                      createComponent(DropdownMenu.ItemIndicator, {}),
                    ];
                  },
                }),
                createComponent(DropdownMenu.RadioGroup, {
                  defaultValue: "a",
                  ...group,
                  get children() {
                    return [
                      createComponent(DropdownMenu.RadioItem, {
                        value: "a",
                        children: "Compact",
                      }),
                      createComponent(DropdownMenu.RadioItem, {
                        value: "b",
                        children: "Comfortable",
                      }),
                    ];
                  },
                }),
                createComponent(DropdownMenu.Sub, {
                  defaultOpen: true,
                  get children() {
                    return [
                      createComponent(DropdownMenu.SubTrigger, {
                        children: "More",
                      }),
                      createComponent(DropdownMenu.SubContent, {
                        children: createComponent(DropdownMenu.Item, {
                          children: "Export",
                        }),
                      }),
                    ];
                  },
                }),
              ];
            },
          }),
        ];
      },
    }),
  );
const classLists = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].map((match) =>
    match[1].trim().split(/\s+/),
  );
const classes = (html) => classLists(html).flat();

test("dropdown menu compound API provides a safe native trigger and complete composable menu parts", () => {
  for (const key of [
    "Root",
    "Trigger",
    "Portal",
    "Content",
    "Item",
    "CheckboxItem",
    "RadioGroup",
    "RadioItem",
    "Group",
    "GroupLabel",
    "ItemLabel",
    "ItemDescription",
    "ItemIndicator",
    "Separator",
    "Sub",
    "SubTrigger",
    "SubContent",
  ])
    assert.equal(typeof DropdownMenu[key], "function");
  const html = render(
    {},
    { id: "trigger", title: "Native title", class: "text-left" },
  );
  assert.match(html, /^<button\b/);
  assert.ok(
    html.includes('type="button"') &&
      html.includes('aria-expanded="false"') &&
      html.includes('title="Native title"'),
  );
  assert.equal(classLists(html)[0].at(-1), "text-left");
  assert.doesNotMatch(html, /role="menu"|\s(?:size|appearance|variant)=/);
});

test("dropdown menu content renders Kobalte menu roles, groups, labels, descriptions and separators", () => {
  const html = render(
    { defaultOpen: true },
    {},
    { id: "item", class: "text-left" },
  );
  for (const role of [
    'role="menu"',
    'role="group"',
    'role="menuitem"',
    'role="menuitemcheckbox"',
    'role="menuitemradio"',
  ])
    assert.ok(html.includes(role));
  assert.match(html, /<hr\b/);
  assert.match(html, /<span\b[^>]*>Action<\/span>/);
  assert.ok(html.includes("Help text") && html.includes("Actions"));
  assert.equal(
    classLists(html)
      .find((list) => list.includes("solid-dropdown-menu-item"))
      .at(-1),
    "text-left",
  );
});

test("dropdown menu preserves checked, indeterminate, controlled and radio selection semantics", () => {
  assert.ok(
    render({ defaultOpen: true }, {}, {}, { defaultChecked: true }).includes(
      'aria-checked="true"',
    ),
  );
  const mixed = render(
    { defaultOpen: true },
    {},
    {},
    { indeterminate: true, defaultChecked: true },
  );
  assert.ok(
    mixed.includes('aria-checked="mixed"') &&
      mixed.includes("data-indeterminate"),
  );
  assert.ok(
    render(
      { defaultOpen: true },
      {},
      {},
      { checked: false, defaultChecked: true },
    ).includes('aria-checked="false"'),
  );
  const html = render({ defaultOpen: true }, {}, {}, {}, { value: "b" });
  assert.match(html.match(/<div\b[^>]*>Compact/)[0], /aria-checked="false"/);
  assert.match(html.match(/<div\b[^>]*>Comfortable/)[0], /aria-checked="true"/);
});

test("dropdown menu disabled radio groups propagate to items and all disabling remains Kobalte-owned", () => {
  const html = render(
    { defaultOpen: true, appearance: "mahjong" },
    { disabled: true },
    { disabled: true },
    { disabled: true },
    { disabled: true },
  );
  assert.equal([...html.matchAll(/aria-disabled="true"/g)].length, 4);
  assert.equal([...html.matchAll(/\sdisabled(?=[\s=>])/g)].length, 1);
  assert.ok(
    classes(html).includes("shadow-sm") &&
      !classes(html).includes("enabled:active:shadow-mahjong-pressed"),
  );
  assert.ok(
    classes(html).includes("aria-disabled:opacity-50") &&
      classes(html).includes("aria-disabled:cursor-not-allowed"),
  );
});

test("dropdown menu sizes and token appearances reach both content levels without competing shadows", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["outline", "ghost"]) {
        const html = render(
          { defaultOpen: true, appearance, size },
          { variant },
          { variant: "danger" },
        );
        const current = classes(html),
          panels = classLists(html).filter((list) =>
            list.includes("overflow-y-auto"),
          );
        assert.equal(panels.length, 2);
        assert.ok(
          current.includes(
            { sm: "min-h-8", md: "min-h-10", lg: "min-h-12" }[size],
          ),
        );
        assert.ok(
          current.includes({ sm: "w-52", md: "w-64", lg: "w-72" }[size]),
        );
        for (const panel of panels) {
          assert.ok(
            panel.includes(
              `shadow-${appearance === "default" ? "md" : appearance}`,
            ),
          );
          assert.ok(!panel.some((name) => name.includes("active:")));
        }
        if (appearance !== "default") assert.ok(!current.includes("shadow-md"));
        for (const name of current) names.add(name);
      }
  const uno = await createGenerator(unoConfig),
    { matched, css } = await uno.generate([...names].join(" "));
  for (const name of names)
    if (name !== "solid-dropdown-menu-item")
      assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--color-danger",
    "--color-ring",
    "--shadow-mahjong",
    "--shadow-keycap",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("dropdown menu native styles preserve viewport constraints and caller overrides", () => {
  for (const style of [{ "text-align": "right" }, "text-align: right"]) {
    const html = render(
      { defaultOpen: true },
      {},
      {},
      {},
      {},
      { id: "content", class: "text-left", style },
    );
    assert.match(html, /text-align:\s*right(?:;|")/);
    assert.ok(
      html.includes("--kb-popper-content-available-width") &&
        html.includes("--kb-popper-content-available-height"),
    );
    assert.equal(
      classLists(html)
        .find((list) => list.includes("overflow-y-auto"))
        .at(-1),
      "text-left",
    );
  }
});

test("dropdown menu delegates navigation, focus, selection and dismissal and styles native data states", async () => {
  assert.throws(
    () => renderToString(() => DropdownMenu.Trigger({})),
    /within DropdownMenu/,
  );
  const source = await readFile(
      new URL(
        "../src/components/DropdownMenu/DropdownMenu.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    css = await readFile(
      new URL(
        "../src/components/DropdownMenu/DropdownMenu.css",
        import.meta.url,
      ),
      "utf8",
    );
  assert.ok(source.includes("@kobalte/core/dropdown-menu"));
  assert.doesNotMatch(
    source,
    /addEventListener|\.focus\(|onKeyDown=|aria-labelledby=|aria-describedby=/,
  );
  assert.ok(
    css.includes("[data-highlighted]") &&
      css.includes(":not([data-disabled])") &&
      css.includes("var(--color-surface-active)"),
  );
});

test("dropdown menu demo covers every appearance, size, trigger variant and disabled state plus controlled choices", () => {
  const html = renderToString(() => DropdownMenuDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["outline", "ghost"])
        for (const state of ["enabled", "disabled"])
          assert.ok(
            html.includes(
              `id="dropdown-menu-${appearance}-${variant}-${size}-${state}"`,
            ),
          );
  for (const id of [
    "dropdown-menu-live-trigger",
    "dropdown-menu-toggle-disabled",
    "dropdown-menu-live-status",
    "dropdown-menu-native-trigger",
  ])
    assert.ok(html.includes(`id="${id}"`));
});
