import { View, Text, StyleSheet } from "react-native";
import { statusColors, type ComplianceStatus } from "../../theme";
import { spacing, borderRadius, typography } from "../../theme";

type BadgeSize = "sm" | "md";

interface StatusBadgeProps {
  status: ComplianceStatus;
  size?: BadgeSize;
  label?: string;
}

const defaultLabels: Record<ComplianceStatus, string> = {
  ok: "OK",
  warning: "Advarsel",
  critical: "Kritisk",
  pending: "Venter",
};

export function StatusBadge({ status, size = "sm", label }: StatusBadgeProps) {
  const color = statusColors[status];
  const displayLabel = label ?? defaultLabels[status];

  return (
    <View
      style={[
        styles.base,
        size === "md" && styles.md,
        { backgroundColor: `${color}20` },
      ]}
    >
      {size === "md" && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.text, size === "md" && styles.textMd, { color }]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  text: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
  },
  textMd: {
    fontSize: typography.sizes.small,
  },
});
