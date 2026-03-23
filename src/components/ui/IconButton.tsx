import { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { colors, spacing, borderRadius, shadows } from "../../theme";

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  accessibilityLabel: string;
}

export function IconButton({
  icon: Icon,
  onPress,
  size = 48,
  iconSize = 24,
  color = colors.primary,
  backgroundColor = `${colors.primary}15`,
  accessibilityLabel,
}: IconButtonProps) {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={iconSize} color={color} strokeWidth={1.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
