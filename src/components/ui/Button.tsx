import { useCallback } from "react";
import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, typography, shadows } from "../../theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: "#FFFFFF" },
  },
  secondary: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    text: { color: colors.primary },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: "#FFFFFF" },
  },
  success: {
    container: { backgroundColor: colors.success },
    text: { color: "#FFFFFF" },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { height: 36, paddingHorizontal: spacing.md },
    text: { fontSize: typography.sizes.small },
  },
  md: {
    container: { height: 48, paddingHorizontal: spacing.xl },
    text: { fontSize: typography.sizes.button },
  },
  lg: {
    container: { height: 56, paddingHorizontal: spacing["2xl"] },
    text: { fontSize: typography.sizes.button },
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
}: ButtonProps) {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const vStyles = variantStyles[variant];
  const sStyles = sizeStyles[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        vStyles.container,
        sStyles.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.text, vStyles.text, sStyles.text]}>
        {loading ? "..." : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  text: {
    fontFamily: typography.fonts.semibold,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
