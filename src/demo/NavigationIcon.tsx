import { For, mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";

export interface NavigationIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  name: string;
}

// Small, code-native line icons. All paint inherits the navigation's token color.
const paths: Readonly<Record<string, readonly string[]>> = {
  layout: ["M3 4h18v16H3z", "M3 9h18M9 9v11"],
  button: ["M4 6h16v11H4z", "M4 17v3h16v-3M9 11h6"],
  input: ["M3 7h18v10H3z", "M9 5h4M11 5v14M9 19h4"],
  textarea: ["M3 4h18v16H3z", "M7 8h10M7 12h7M7 16h4"],
  checkbox: ["M4 4h16v16H4z", "m8 12 3 3 5-6"],
  "radio-group": [
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  ],
  switch: [
    "M7 6h10a6 6 0 0 1 0 12H7A6 6 0 0 1 7 6",
    "M7 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  ],
  select: ["M3 6h18v12H3z", "m8 10 4 4 4-4"],
  "form-field": ["M4 4h8M4 9h16v7H4z", "M4 20h12"],
  badge: ["m12 3 8 5v8l-8 5-8-5V8z", "m8 12 3 3 5-6"],
  tag: ["M3 3h9l9 9-9 9-9-9z", "M7 7h2v2H7z"],
  card: ["M3 4h18v16H3z", "M3 9h18M7 13h10M7 16h6"],
  alert: ["m12 3 10 17H2z", "M12 8v6M12 17v1"],
  spinner: ["M12 3a9 9 0 1 1-9 9", "M3 6v6h6"],
  skeleton: ["M3 4h18v5H3zM3 12h10v8H3z", "M16 13h5M16 17h5"],
  avatar: ["M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8", "M4 21v-3a8 8 0 0 1 16 0v3"],
  divider: ["M3 12h18", "M8 4h8M8 20h8"],
  tooltip: ["M3 4h18v12h-7l-4 4v-4H3z", "M12 7v1M12 10v3"],
  popover: ["M3 4h18v13H3z", "M7 8h10M7 12h6M9 21h6M12 17v4"],
  dialog: ["M3 5h18v14H3z", "M3 9h18M16 12l3 3M19 12l-3 3"],
  "dropdown-menu": ["M3 3h18v18H3z", "M7 7h10M7 12h10M7 17h6"],
  toast: ["M4 6h16v12H4z", "M8 3h8M8 21h8M8 10h8M8 14h5"],
  tabs: ["M3 4h7v5h11v11H3z", "M10 4h11v5M3 9h7"],
  theme: [
    "M12 3a9 9 0 1 0 0 18h2a3 3 0 0 0 3-3c0-2-2-2-2-4s3-2 5-2a2 2 0 0 0 1-3 10 10 0 0 0-9-6",
    "M7 9h1M12 6h1M17 9h1M6 14h1",
  ],
  overview: ["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
  team: [
    "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    "M2 21v-3a7 7 0 0 1 14 0v3M16 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 5v1",
  ],
  files: ["M3 5h7l2 3h9v12H3z"],
  billing: ["M4 3h16v18l-4-2-4 2-4-2-4 2z", "M8 7h8M8 12h8M8 16h5"],
};

export function NavigationIcon(props: NavigationIconProps) {
  const merged = mergeProps({ class: "" } as const, props);
  const [local, rest] = splitProps(merged, ["name", "class"]);
  return (
    <svg
      {...rest}
      {...{ focusable: "false" }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={clsx("h-full w-full", local.class)}
    >
      <For each={paths[local.name] ?? paths.overview}>
        {(path) => <path d={path} />}
      </For>
    </svg>
  );
}
