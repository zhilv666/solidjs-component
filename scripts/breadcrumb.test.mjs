import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Breadcrumb, BreadcrumbDemo, AppearanceProvider;
before(async () => {
  harness = await createComponentHarness("breadcrumb");
  ({ Breadcrumb, AppearanceProvider } = await harness.load(
    "/src/components/index.ts",
  ));
  ({ BreadcrumbDemo } = await harness.load(
    "/src/components/Breadcrumb/Breadcrumb.demo.tsx",
  ));
});
after(async () => await harness?.close());

const path = (props = {}, linkProps = {}, separatorProps = {}) =>
  Breadcrumb({
    ...props,
    get children() {
      return Breadcrumb.List({
        id: "path-list",
        start: 2,
        class: "w-full",
        get children() {
          return [
            Breadcrumb.Item({
              id: "path-first",
              class: "flex-1",
              get children() {
                return [
                  Breadcrumb.Link({
                    href: "/home",
                    children: "Home",
                    ...linkProps,
                  }),
                  Breadcrumb.Separator(separatorProps),
                ];
              },
            }),
            Breadcrumb.Item({
              get children() {
                return Breadcrumb.Link({
                  current: true,
                  href: "/current",
                  children: "Current",
                });
              },
            }),
          ];
        },
      });
    },
  });
const render = (props = {}, linkProps = {}, separatorProps = {}) =>
  renderToString(() => path(props, linkProps, separatorProps));
const links = (html) =>
  [...html.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]);
const classNames = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const linkClasses = (html, index = 0) => classNames(links(html)[index]);

test("breadcrumb exposes a named navigation landmark with native ordered list and item attributes", () => {
  const html = render({
    id: "path",
    title: "Native navigation",
    class: "w-3/4",
  });
  assert.match(html, /^<nav\b/);
  assert.ok(html.includes('aria-label="面包屑 / Breadcrumb"'));
  assert.ok(
    html.includes('id="path"') && html.includes('title="Native navigation"'),
  );
  assert.match(html, /<ol\b[^>]*id="path-list"[^>]*start="2"/);
  assert.equal((html.match(/<li\b/g) ?? []).length, 2);
  assert.ok(html.includes('id="path-first"'));
  assert.equal(classNames(html.match(/<nav\b[^>]*>/)[0]).at(-1), "w-3/4");
  assert.equal(classNames(html.match(/<ol\b[^>]*>/)[0]).at(-1), "w-full");
  assert.equal(classNames(html.match(/<li\b[^>]*>/)[0]).at(-1), "flex-1");
  assert.doesNotMatch(
    html,
    /\s(?:variant|size|appearance|current|disabled|separator|translations)=/,
  );
});

test("Kobalte current and disabled links remove destinations and Tab stops while current remains named", () => {
  const html = render({}, { disabled: true });
  for (const link of links(html)) {
    assert.ok(link.includes('aria-disabled="true"'));
    assert.doesNotMatch(link, /\s(?:href|tabindex)=/);
  }
  assert.ok(links(html)[1].includes('aria-current="page"'));
  assert.ok(linkClasses(html).includes("opacity-50"));
  assert.ok(!linkClasses(html, 1).includes("opacity-50"));
  assert.equal(
    links(render({ disabled: true })).filter((link) =>
      link.includes('aria-disabled="true"'),
    ).length,
    2,
  );
});

test("native anchor destinations and labels, localization, current ARIA and decorative separators are forwarded", () => {
  const html = render(
    { translations: { breadcrumbs: "Project path" }, separator: "›" },
    {
      href: "/guide",
      target: "_blank",
      rel: "noopener",
      title: "Native link",
      class: "flex-1",
      "aria-label": "Guide",
    },
    { id: "path-separator", class: "mx-2" },
  );
  assert.ok(html.includes('aria-label="Project path"'));
  for (const attribute of [
    'href="/guide"',
    'target="_blank"',
    'rel="noopener"',
    'title="Native link"',
    'aria-label="Guide"',
  ])
    assert.ok(links(html)[0].includes(attribute));
  assert.equal(linkClasses(html).at(-1), "flex-1");
  assert.match(html, /<span\b[^>]*aria-hidden="true"[^>]*id="path-separator"/);
  assert.ok(html.includes("›"));
  assert.ok(
    render({ "aria-label": "Explicit path" }).includes(
      'aria-label="Explicit path"',
    ),
  );
  assert.ok(
    links(
      render({}, { current: true, "aria-current": "location" }),
    )[0].includes('aria-current="location"'),
  );
  for (const value of [true, false])
    assert.ok(
      links(render({}, { current: true, "aria-current": value }))[0].includes(
        `aria-current="${value}"`,
      ),
    );
  assert.ok(render({ separator: "/" }, {}, { children: "→" }).includes("→"));
});

test("all breadcrumb appearances keep wrappers static and apply pressing only to available link surfaces", () => {
  for (const appearance of ["default", "keycap", "mahjong", "pixel"]) {
    const html = render({ appearance });
    assert.doesNotMatch(
      html.match(/<nav\b[^>]*>/)[0],
      /shadow-|active:|tabindex=/,
    );
    const available = linkClasses(html);
    const current = linkClasses(html, 1);
    const disabled = linkClasses(render({ appearance }, { disabled: true }));
    assert.ok(available.includes("hover:not-active:bg-surface-hover"));
    for (const unavailable of [current, disabled])
      assert.ok(
        !unavailable.some((name) =>
          /^(?:hover:|active:|peer-active:)/.test(name),
        ),
      );
    if (appearance !== "default") {
      assert.ok(available.includes(`shadow-${appearance}`));
      assert.ok(available.includes(`active:shadow-${appearance}-pressed`));
      assert.ok(
        current.includes("shadow-sm") && disabled.includes("shadow-sm"),
      );
      assert.ok(
        !current.includes(`shadow-${appearance}`) &&
          !disabled.includes(`shadow-${appearance}`),
      );
    }
    assert.equal(
      available.includes("solid-appearance-pixel"),
      appearance === "pixel",
    );
  }
});

test("breadcrumb inherits the nearest appearance provider and explicit defaults remain independent", () => {
  for (const appearance of ["default", "keycap", "mahjong", "pixel"]) {
    const inherited = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return path();
        },
      }),
    );
    assert.deepEqual(classNames(inherited), classNames(render({ appearance })));
    const explicit = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return path({ appearance: "default" });
        },
      }),
    );
    assert.deepEqual(
      classNames(explicit),
      classNames(render({ appearance: "default" })),
    );
  }
});

test("every breadcrumb variant size appearance and disabled combination generates token utilities", async () => {
  const names = new Set();
  for (const variant of ["plain", "outline"])
    for (const size of ["sm", "md", "lg"])
      for (const appearance of ["default", "keycap", "mahjong", "pixel"])
        for (const disabled of [false, true])
          for (const name of classNames(
            render({ variant, size, appearance, disabled }),
          ))
            if (!name.startsWith("solid-breadcrumb")) names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--color-fg",
    "--color-fg-muted",
    "--color-primary",
    "--radius-md",
    "--radius-pixel",
    "--font-size-md",
    "--font-size-lg",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--shadow-pixel",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${token})`), token);
});

test("breadcrumb supports empty and single-item paths and preserves a zero separator or label", () => {
  const empty = renderToString(() =>
    Breadcrumb({
      get children() {
        return Breadcrumb.List({});
      },
    }),
  );
  assert.ok(empty.includes("<ol"));
  assert.doesNotMatch(empty, /<a\b|<li\b|tabindex=/);
  const single = renderToString(() =>
    Breadcrumb({
      get children() {
        return Breadcrumb.List({
          get children() {
            return Breadcrumb.Item({
              get children() {
                return Breadcrumb.Link({ current: true, children: 0 });
              },
            });
          },
        });
      },
    }),
  );
  assert.equal(links(single).length, 1);
  assert.ok(single.includes('aria-current="page"') && single.includes(">0<"));
  assert.ok(render({ separator: 0 }).includes(">0<"));
});

test("breadcrumb demo includes both variants in all size/appearance combinations plus dynamic, long, empty and icon cases", () => {
  const html = renderToString(() => BreadcrumbDemo());
  for (const appearance of ["default", "keycap", "mahjong", "pixel"])
    for (const variant of ["plain", "outline"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(
          html.includes(`id="breadcrumb-${appearance}-${variant}-${size}"`),
        );
  for (const id of [
    "breadcrumb-live",
    "breadcrumb-toggle-disabled",
    "breadcrumb-toggle-all",
    "breadcrumb-toggle-size",
    "breadcrumb-toggle-separator",
    "breadcrumb-reset",
    "breadcrumb-long",
    "breadcrumb-single",
    "breadcrumb-empty",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('aria-label="项目主页"'));
  assert.ok(
    html.includes("VeryLongUnbrokenComponentDirectoryNameForNarrowScreens"),
  );
});
