export type ThemeMode = "desktop" | "tablet" | "mobile";

export type ThemeTokens = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    card: string;
    sidebar: string;
    header: string;
    footer: string;
    text: string;
    muted: string;
    button: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    buttonFont: string;
    headingSize: string;
    bodySize: string;
    letterSpacing: string;
    lineHeight: string;
  };
  layout: {
    containerWidth: string;
    radius: string;
    spacing: string;
    shadow: string;
    animationSpeed: string;
    navbarHeight: string;
  };
  components: {
    buttonStyle: string;
    cardStyle: string;
    animationIntensity: string;
  };
};

export type ThemeVersion = {
  id: string;
  name: string;
  createdAt: string;
  tokens: ThemeTokens;
};

export const defaultTheme: ThemeTokens = {
  colors: {
    primary: "#2563EB",
    secondary: "#06B6D4",
    accent: "#F59E0B",
    background: "#030712",
    surface: "#0F172A",
    card: "rgba(15,23,42,0.6)",
    sidebar: "rgba(3,7,18,0.9)",
    header: "rgba(3,7,18,0.75)",
    footer: "rgba(15,23,42,0.85)",
    text: "#F8FAFC",
    muted: "#94A3B8",
    button: "linear-gradient(135deg,#2563EB,#06B6D4)",
    border: "rgba(255,255,255,0.1)",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    buttonFont: "Inter, system-ui, sans-serif",
    headingSize: "3rem",
    bodySize: "1rem",
    letterSpacing: "-0.02em",
    lineHeight: "1.6",
  },
  layout: {
    containerWidth: "max-w-7xl",
    radius: "1.5rem",
    spacing: "1.5rem",
    shadow: "0 20px 60px rgba(2,8,23,0.35)",
    animationSpeed: "300ms",
    navbarHeight: "4.5rem",
  },
  components: {
    buttonStyle: "gradient",
    cardStyle: "glass",
    animationIntensity: "smooth",
  },
};

export const presetThemes: Record<string, ThemeTokens> = {
  "Luxury Dark": defaultTheme,
  "Luxury Light": {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      background: "#F8FAFC",
      surface: "#FFFFFF",
      card: "rgba(255,255,255,0.8)",
      sidebar: "rgba(248,250,252,0.9)",
      header: "rgba(255,255,255,0.85)",
      footer: "rgba(248,250,252,0.9)",
      text: "#0F172A",
      muted: "#475569",
      border: "rgba(15,23,42,0.1)",
      primary: "#0F172A",
      button: "linear-gradient(135deg,#0F172A,#2563EB)",
    },
  },
  "Minimal": {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, primary: "#111827", accent: "#111827", button: "#111827", background: "#FFFFFF", text: "#111827", muted: "#6B7280" },
  },
  "Cyber Neon": {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, primary: "#8B5CF6", accent: "#22D3EE", button: "linear-gradient(135deg,#8B5CF6,#22D3EE)", background: "#020617" },
  },
  "Apple Glass": {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, primary: "#0A84FF", accent: "#30D158", background: "#F5F5F7", text: "#1D1D1F", muted: "#6E6E73" },
  },
};

export const colorGroups = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "card",
  "sidebar",
  "header",
  "footer",
  "text",
  "muted",
  "button",
  "border",
] as const;

export function varsForTheme(theme: ThemeTokens): Record<string, string> {
  return {
    "--theme-primary": theme.colors.primary,
    "--theme-secondary": theme.colors.secondary,
    "--theme-accent": theme.colors.accent,
    "--theme-bg": theme.colors.background,
    "--theme-surface": theme.colors.surface,
    "--theme-card": theme.colors.card,
    "--theme-sidebar": theme.colors.sidebar,
    "--theme-header": theme.colors.header,
    "--theme-footer": theme.colors.footer,
    "--theme-text": theme.colors.text,
    "--theme-muted": theme.colors.muted,
    "--theme-button": theme.colors.button,
    "--theme-border": theme.colors.border,
    "--theme-heading-font": theme.typography.headingFont,
    "--theme-body-font": theme.typography.bodyFont,
    "--theme-heading-size": theme.typography.headingSize,
    "--theme-body-size": theme.typography.bodySize,
    "--theme-letter-spacing": theme.typography.letterSpacing,
    "--theme-line-height": theme.typography.lineHeight,
    "--theme-container": theme.layout.containerWidth,
    "--theme-radius": theme.layout.radius,
    "--theme-spacing": theme.layout.spacing,
    "--theme-shadow": theme.layout.shadow,
    "--theme-speed": theme.layout.animationSpeed,
    "--theme-nav-height": theme.layout.navbarHeight,
  };
}

function isStringRecord(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => typeof record[key] === "string");
}

export function isThemeTokens(value: unknown): value is ThemeTokens {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    isStringRecord(record.colors, Object.keys(defaultTheme.colors)) &&
    isStringRecord(record.typography, Object.keys(defaultTheme.typography)) &&
    isStringRecord(record.layout, Object.keys(defaultTheme.layout)) &&
    isStringRecord(record.components, Object.keys(defaultTheme.components))
  );
}

export function isThemeVersion(value: unknown): value is ThemeVersion {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.createdAt === "string" &&
    isThemeTokens(record.tokens)
  );
}

export function toThemeVersions(value: unknown): ThemeVersion[] {
  return Array.isArray(value) ? value.filter(isThemeVersion) : [];
}
