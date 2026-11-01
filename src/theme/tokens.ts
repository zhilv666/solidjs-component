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

export type ThemePalette =
  "default" | "sakura" | "mint" | "lavender" | "apricot";

export interface ThemePaletteOverrides {
  readonly color: Partial<ThemeColors>;
  readonly darkColor: Partial<ThemeColors>;
}

export interface ThemeTokens {
  readonly color: ThemeColors;
  readonly darkColor: ThemeColors;
  readonly palettes: Readonly<
    Record<Exclude<ThemePalette, "default">, ThemePaletteOverrides>
  >;
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
    readonly keycap: string;
    readonly keycapPressed: string;
    readonly mahjong: string;
    readonly mahjongPressed: string;
  };
  readonly transition: {
    readonly duration: string;
  };
  readonly animation: {
    readonly spinDuration: string;
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
  palettes: {
    sakura: {
      color: {
        primary: "#a52d62",
        primaryFg: "#ffffff",
        bg: "#fceff4",
        surface: "#fff7fa",
        fg: "#331624",
        fgMuted: "#725360",
        border: "#95697d",
        ring: "#a52d62",
      },
      darkColor: {
        primary: "#f2a8c8",
        primaryFg: "#45172e",
        bg: "#23171e",
        surface: "#30212a",
        fg: "#fff0f6",
        fgMuted: "#e8bed0",
        border: "#b7829a",
        ring: "#f2a8c8",
      },
    },
    mint: {
      color: {
        primary: "#116a4f",
        primaryFg: "#ffffff",
        bg: "#edf8f0",
        surface: "#f8fdfa",
        fg: "#153729",
        fgMuted: "#466b56",
        border: "#62856e",
        ring: "#116a4f",
      },
      darkColor: {
        primary: "#8be0b2",
        primaryFg: "#113c2a",
        bg: "#14231c",
        surface: "#203329",
        fg: "#eafaf0",
        fgMuted: "#bedfca",
        border: "#79a78b",
        ring: "#8be0b2",
      },
    },
    lavender: {
      color: {
        primary: "#6941b1",
        primaryFg: "#ffffff",
        bg: "#f4effc",
        surface: "#fcfaff",
        fg: "#2c1d41",
        fgMuted: "#635176",
        border: "#8b759f",
        ring: "#6941b1",
      },
      darkColor: {
        primary: "#c5acf3",
        primaryFg: "#32204e",
        bg: "#201928",
        surface: "#30243d",
        fg: "#f7f0ff",
        fgMuted: "#d5c4e9",
        border: "#a791bd",
        ring: "#c5acf3",
      },
    },
    apricot: {
      color: {
        primary: "#a04c13",
        primaryFg: "#ffffff",
        bg: "#fff3e8",
        surface: "#fffaf4",
        fg: "#3d291c",
        fgMuted: "#745842",
        border: "#977452",
        ring: "#a04c13",
      },
      darkColor: {
        primary: "#ffc08c",
        primaryFg: "#45270f",
        bg: "#281d16",
        surface: "#38291f",
        fg: "#fff3e7",
        fgMuted: "#e7c5a6",
        border: "#b99270",
        ring: "#ffc08c",
      },
    },
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
    keycap: "0 3px 0 var(--color-border), var(--shadow-sm)",
    keycapPressed: "0 1px 0 var(--color-border), var(--shadow-sm)",
    mahjong:
      "inset 0 1px 0 var(--color-surface), inset 0 -2px 0 var(--color-surface-active), 0 2px 0 var(--color-surface-active), 0 6px 0 var(--color-success), 0 7px 0 var(--color-border), var(--shadow-md)",
    mahjongPressed:
      "inset 0 1px 0 var(--color-surface), inset 0 -2px 0 var(--color-surface-active), 0 1px 0 var(--color-surface-active), 0 2px 0 var(--color-success), 0 3px 0 var(--color-border), var(--shadow-md)",
  },
  transition: {
    duration: "150ms",
  },
  animation: {
    spinDuration: "1000ms",
  },
} as const satisfies ThemeTokens;
