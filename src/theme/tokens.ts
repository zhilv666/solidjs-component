export type HexColor = `#${string}`;

export interface ThemeColors {
  readonly primary: HexColor;
  readonly primaryFg: HexColor;
  readonly danger: HexColor;
  readonly dangerFg: HexColor;
  readonly success: HexColor;
  readonly warning: HexColor;
  readonly bg: HexColor;
  readonly surface: HexColor;
  readonly fg: HexColor;
  readonly fgMuted: HexColor;
  readonly border: HexColor;
  readonly ring: HexColor;
}

export interface ThemeTokens {
  readonly color: ThemeColors;
  readonly darkColor: ThemeColors;
  readonly radius: {
    readonly sm: string;
    readonly md: string;
    readonly lg: string;
  };
  readonly font: {
    readonly family: string;
    readonly size: {
      readonly sm: string;
      readonly md: string;
      readonly lg: string;
      readonly xl: string;
    };
    readonly weight: {
      readonly normal: number;
      readonly medium: number;
    };
  };
  readonly shadow: {
    readonly sm: string;
    readonly md: string;
  };
  readonly transition: {
    readonly duration: string;
  };
}

export const tokens = {
  color: {
    primary: "#1d4ed8",
    primaryFg: "#ffffff",
    danger: "#b91c1c",
    dangerFg: "#ffffff",
    success: "#166534",
    warning: "#92400e",
    bg: "#fafafa",
    surface: "#ffffff",
    fg: "#18181b",
    fgMuted: "#52525b",
    border: "#71717a",
    ring: "#1d4ed8",
  },
  darkColor: {
    primary: "#93c5fd",
    primaryFg: "#172554",
    danger: "#fca5a5",
    dangerFg: "#450a0a",
    success: "#86efac",
    warning: "#fcd34d",
    bg: "#18181b",
    surface: "#27272a",
    fg: "#fafafa",
    fgMuted: "#d4d4d8",
    border: "#a1a1aa",
    ring: "#93c5fd",
  },
  radius: {
    sm: "2px",
    md: "4px",
    lg: "6px",
  },
  font: {
    family:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    size: {
      sm: "12px",
      md: "14px",
      lg: "16px",
      xl: "20px",
    },
    weight: {
      normal: 400,
      medium: 500,
    },
  },
  shadow: {
    sm: "0 1px 2px rgb(0 0 0 / 0.06)",
    md: "0 2px 6px rgb(0 0 0 / 0.08)",
  },
  transition: {
    duration: "150ms",
  },
} as const satisfies ThemeTokens;
