import { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { Minus, Plus } from "lucide-react-native";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  touchTargets,
} from "../../theme";

interface TemperatureInputProps {
  value: number;
  onChange: (value: number) => void;
  minTemp: number;
  maxTemp: number;
  step?: number;
}

export function TemperatureInput({
  value,
  onChange,
  minTemp,
  maxTemp,
  step = 0.1,
}: TemperatureInputProps) {
  const isInRange = value >= minTemp && value <= maxTemp;
  const statusColor = isInRange ? colors.success : colors.danger;
  const borderColorAnim = useSharedValue(statusColor);

  useEffect(() => {
    borderColorAnim.value = withTiming(statusColor, { duration: 200 });
  }, [statusColor, borderColorAnim]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    borderColor: borderColorAnim.value,
  }));

  const adjustTemp = useCallback(
    (delta: number) => {
      const newValue = Math.round((value + delta) * 10) / 10;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    },
    [value, onChange],
  );

  const decrement = useCallback(() => adjustTemp(-step), [adjustTemp, step]);
  const increment = useCallback(() => adjustTemp(step), [adjustTemp, step]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, containerAnimStyle]}>
        <Pressable
          onPress={decrement}
          style={({ pressed }) => [
            styles.stepper,
            pressed && styles.stepperPressed,
          ]}
          accessibilityLabel="Reduser temperatur"
          accessibilityRole="button"
        >
          <Minus size={28} color={colors.text} strokeWidth={2} />
        </Pressable>

        <View style={styles.display}>
          <Text style={[styles.tempValue, { color: statusColor }]}>
            {value.toFixed(1)}
          </Text>
          <Text style={[styles.unit, { color: statusColor }]}>°C</Text>
        </View>

        <Pressable
          onPress={increment}
          style={({ pressed }) => [
            styles.stepper,
            pressed && styles.stepperPressed,
          ]}
          accessibilityLabel="Øk temperatur"
          accessibilityRole="button"
        >
          <Plus size={28} color={colors.text} strokeWidth={2} />
        </Pressable>
      </Animated.View>

      <Text style={[styles.rangeLabel, { color: statusColor }]}>
        Grense: {minTemp}°C – {maxTemp}°C
      </Text>

      {!isInRange && (
        <Text style={styles.warningText}>
          Temperaturen er utenfor akseptabelt område
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    height: touchTargets.large,
    ...shadows.md,
  },
  stepper: {
    width: touchTargets.recommended,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperPressed: {
    backgroundColor: `${colors.border}50`,
  },
  display: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: spacing.lg,
    minWidth: 120,
    justifyContent: "center",
  },
  tempValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.tempLarge,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    marginLeft: spacing.xs,
  },
  rangeLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.small,
    marginTop: spacing.md,
  },
  warningText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
