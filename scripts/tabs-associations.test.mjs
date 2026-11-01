import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, before, test } from "node:test";
import { createRoot, mergeProps } from "solid-js";
import { renderToString } from "solid-js/web";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Tabs;
before(async () => {
  harness = await createComponentHarness("tabs-associations");
  ({ Tabs } = await harness.load("/src/components/Tabs/Tabs.tsx"));
});
after(async () => await harness?.close());

const fixture = (props = {}, triggerProps = {}, contentProps = {}) =>
  Tabs({
    id: "associated-tabs",
    defaultValue: "a",
    ...props,
    get children() {
      return [
        Tabs.List({
          "aria-label": "Associated sections",
          get children() {
            return [
              Tabs.Trigger({ value: "a", children: "Alpha", ...triggerProps }),
              Tabs.Trigger({ value: "b", children: "Beta" }),
            ];
          },
        }),
        Tabs.Content({ value: "a", children: "Alpha panel", ...contentProps }),
        Tabs.Content({ value: "b", children: "Beta panel" }),
      ];
    },
  });
const elements = (html, role) =>
  [...html.matchAll(new RegExp(`<[^>]*\\brole="${role}"[^>]*>`, "g"))].map(
    (match) =>
      Object.fromEntries(
        [...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [
          attribute[1],
          attribute[2],
        ]),
      ),
  );

test("initial controlled and default panels use their matching Kobalte trigger IDs without interaction", () => {
  for (const props of [{}, { value: "b" }, { defaultValue: "b" }]) {
    const html = renderToString(() => fixture(props));
    const tabs = elements(html, "tab");
    const panels = elements(html, "tabpanel");
    assert.equal(panels.length, 1);
    const selected = tabs.find((tab) => tab["aria-selected"] === "true");
    assert.equal(panels[0]["aria-labelledby"], selected.id);
  }
});

test("custom trigger IDs name initial panels and explicit caller ARIA remains authoritative", () => {
  const custom = renderToString(() =>
    fixture({}, { id: "custom-tab" }, { id: "custom-panel" }),
  );
  assert.equal(elements(custom, "tab")[0].id, "custom-tab");
  assert.equal(elements(custom, "tabpanel")[0].id, "custom-panel");
  assert.equal(
    elements(custom, "tabpanel")[0]["aria-labelledby"],
    "custom-tab",
  );
  const overridden = renderToString(() =>
    fixture(
      {},
      { "aria-controls": "caller-panel" },
      { "aria-labelledby": "caller-heading", "aria-label": "Caller panel" },
    ),
  );
  assert.equal(elements(overridden, "tab")[0]["aria-controls"], "caller-panel");
  assert.equal(
    elements(overridden, "tabpanel")[0]["aria-labelledby"],
    "caller-heading",
  );
  assert.equal(
    elements(overridden, "tabpanel")[0]["aria-label"],
    "Caller panel",
  );
});

test("every force-mounted panel keeps its own initial label including inactive content", () => {
  const html = renderToString(() =>
    Tabs({
      id: "forced-tabs",
      defaultValue: "a",
      get children() {
        return [
          Tabs.List({
            "aria-label": "Forced sections",
            get children() {
              return [
                Tabs.Trigger({ value: "a", children: "Alpha" }),
                Tabs.Trigger({ value: "b", children: "Beta" }),
              ];
            },
          }),
          Tabs.Content({
            value: "a",
            forceMount: true,
            children: "Alpha panel",
          }),
          Tabs.Content({
            value: "b",
            forceMount: true,
            children: "Beta panel",
          }),
        ];
      },
    }),
  );
  const panels = elements(html, "tabpanel");
  assert.equal(panels.length, 2);
  assert.equal(panels[0]["aria-labelledby"], "forced-tabs-trigger-a");
  assert.equal(panels[1]["aria-labelledby"], "forced-tabs-trigger-b");
});

test("automatic root IDs and nested roots isolate associations for identical values", () => {
  const html = renderToString(() => [
    fixture({ id: undefined }),
    fixture({ id: undefined }),
    fixture(
      { id: "outer" },
      {},
      {
        get children() {
          return fixture({ id: "inner" });
        },
      },
    ),
  ]);
  const panels = elements(html, "tabpanel");
  const ids = new Set(elements(html, "tab").map((tab) => tab.id));
  assert.equal(panels.length, 4);
  assert.equal(
    new Set(panels.map((panel) => panel["aria-labelledby"])).size,
    4,
  );
  for (const panel of panels) assert.ok(ids.has(panel["aria-labelledby"]));
  assert.ok(
    panels.some((panel) => panel["aria-labelledby"] === "outer-trigger-a"),
  );
  assert.ok(
    panels.some((panel) => panel["aria-labelledby"] === "inner-trigger-a"),
  );
});

test("association registries clean only their own registration and preserve replacements and other keys", async () => {
  const { createTabsIdRegistry } = await harness.load(
    "/src/components/Tabs/associations.ts",
  );
  const registry = createTabsIdRegistry();
  const old = registry.register("a", "old-a");
  const other = registry.register("b", "other-b");
  const replacement = registry.register("a", "new-a");
  old();
  assert.equal(registry.get("a"), "new-a");
  assert.equal(registry.get("b"), "other-b");
  replacement();
  assert.equal(registry.get("a"), undefined);
  assert.equal(registry.get("b"), "other-b");
  other();
  assert.equal(registry.get("b"), undefined);
});

test("part registrations share their owner lifetime and are removed on disposal", async () => {
  const { createTabsIdRegistry, createTabsPartRegistration } =
    await harness.load("/src/components/Tabs/associations.ts");
  const registry = createTabsIdRegistry();
  let dispose;
  createRoot((rootDispose) => {
    dispose = rootDispose;
    createTabsPartRegistration(
      registry,
      () => "a",
      () => "owned-a",
      () => new Map(),
    );
    assert.equal(registry.get("a"), "owned-a");
  });
  dispose();
  assert.equal(registry.get("a"), undefined);
});

test("owned cleanup runs before reactive removal and stale cleanup cannot affect a replacement", async () => {
  const { createTabsIdRegistry } = await harness.load(
    "/src/components/Tabs/associations.ts",
  );
  const registry = createTabsIdRegistry();
  const observations = [];
  const old = registry.register("a", "same-id", () =>
    observations.push("stale cleanup"),
  );
  const replacement = registry.register("a", "same-id", () =>
    observations.push(registry.get("a")),
  );
  old();
  assert.deepEqual(observations, []);
  assert.equal(registry.get("a"), "same-id");
  replacement();
  assert.deepEqual(observations, ["same-id"]);
  assert.equal(registry.get("a"), undefined);
});

test("part disposal removes matching Kobalte fallbacks and leaves other keys untouched", async () => {
  const { createTabsIdRegistry, createTabsPartRegistration } =
    await harness.load("/src/components/Tabs/associations.ts");
  for (const attribute of ["aria-controls", "aria-labelledby"]) {
    const registry = createTabsIdRegistry();
    const primitiveIds = new Map([
      ["a", "owned-a"],
      ["b", "other-b"],
    ]);
    const attributes = mergeProps(
      {
        get [attribute]() {
          return primitiveIds.get("a");
        },
      },
      {
        get [attribute]() {
          return registry.get("a");
        },
      },
    );
    let dispose;
    createRoot((rootDispose) => {
      dispose = rootDispose;
      createTabsPartRegistration(
        registry,
        () => "a",
        () => "owned-a",
        () => primitiveIds,
      );
    });
    assert.equal(attributes[attribute], "owned-a");
    dispose();
    assert.equal(attributes[attribute], undefined);
    assert.equal(primitiveIds.get("a"), undefined);
    assert.equal(primitiveIds.get("b"), "other-b");
  }
});

test("part disposal preserves a newer primitive ID registered for the same value", async () => {
  const { createTabsIdRegistry, createTabsPartRegistration } =
    await harness.load("/src/components/Tabs/associations.ts");
  const registry = createTabsIdRegistry();
  const primitiveIds = new Map([["a", "owned-a"]]);
  let dispose;
  createRoot((rootDispose) => {
    dispose = rootDispose;
    createTabsPartRegistration(
      registry,
      () => "a",
      () => "owned-a",
      () => primitiveIds,
    );
  });
  primitiveIds.set("a", "replacement-a");
  dispose();
  assert.equal(registry.get("a"), undefined);
  assert.equal(primitiveIds.get("a"), "replacement-a");
});

test("the association adapter uses Kobalte ID generators and never replaces keyboard focus or selection", async () => {
  const source = await readFile(
    new URL("../src/components/Tabs/Tabs.tsx", import.meta.url),
    "utf8",
  );
  const adapter = await readFile(
    new URL("../src/components/Tabs/associations.ts", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes("primitiveContext.generateTriggerId(merged.value)"),
  );
  assert.ok(
    source.includes("primitiveContext.generateContentId(merged.value)"),
  );
  assert.ok(source.includes("primitiveContext.triggerIdsMap"));
  assert.ok(source.includes("primitiveContext.contentIdsMap"));
  for (const code of [source, adapter])
    assert.doesNotMatch(
      code,
      /onKeyDown=|addEventListener|\.focus\(|setSelectedKey|selectionManager\(\)\.set/,
    );
});

test("the live demo exposes a reactive root and native custom IDs without remounting its parts", async () => {
  const { TabsDemo } = await harness.load("/src/components/Tabs/Tabs.demo.tsx");
  const html = renderToString(TabsDemo);
  assert.match(html, /id="tabs-toggle-ids"/);
  assert.match(html, /data-tabs-live/);
  assert.match(html, /id="tabs-name"/);
  assert.match(html, /自定义 ID/);
});
