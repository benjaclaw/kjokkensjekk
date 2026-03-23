import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors, borderRadius } from "../../theme";

interface ProgressBarProps {
  progress: number; // 0–1
  height?: number;
}

export function ProgressBar({ progress, height = 6 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const barColor =
    clamped >= 1
      ? colors.success
      : clamped >= 0.5
        ? colors.primary
        : clamped > 0
          ? colors.warning
          : colors.border;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clamped * 100}%`, { duration: 300 }),
    backgroundColor: withTiming(barColor, { duration: 300 }),
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[styles.fill, { borderRadius: height / 2 }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.border,
    overflow: "hidden",
    borderRadius: borderRadius.full,
  },
  fill: {
    height: "100%",
  },
});
