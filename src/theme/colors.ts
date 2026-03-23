export const colors = {
  // Primary
  primary: "#0D9488",
  primaryLight: "#14B8A6",
  primaryDark: "#0F766E",
  secondary: "#1E3A5F",
  accent: "#F59E0B",

  // Compliance trafikklys
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",

  // Neutrals
  background: "#F8FAFB",
  surface: "#FFFFFF",
  text: "#1A202C",
  textMuted: "#64748B",
  border: "#E2E8F0",

  // Dark mode
  darkBg: "#0F172A",
  darkSurface: "#1E293B",
  darkText: "#F1F5F9",
  darkBorder: "#334155",
} as const;

export type ComplianceStatus = "ok" | "warning" | "critical" | "pending";

export const statusColors: Record<ComplianceStatus, string> = {
  ok: colors.success,
  warning: colors.warning,
  critical: colors.danger,
  pending: colors.textMuted,
};
