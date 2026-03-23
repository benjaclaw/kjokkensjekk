import { useCallback } from "react";
import { Pressable, View, StyleSheet, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, shadows } from "../../theme";
import { statusColors, type ComplianceStatus } from "../../theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "status" | "interactive";
  status?: ComplianceStatus;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = "default",
  status,
  onPress,
  style,
}: CardProps) {
  const handlePress = useCallback(() => {
    if (!onPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const isInteractive = variant === "interactive" || !!onPress;
  const statusBorder: ViewStyle =
    variant === "status" && status
      ? { borderLeftWidth: 4, borderLeftColor: statusColors[status] }
      : {};

  if (isInteractive) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.base,
          statusBorder,
          pressed && styles.pressed,
          style,
        ]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, statusBorder, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
});
