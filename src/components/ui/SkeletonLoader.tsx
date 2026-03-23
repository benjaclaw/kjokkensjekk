import { useEffect } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, spacing, borderRadius } from "../../theme";

function SkeletonPulse({ style }: { style?: ViewStyle }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.pulse, style, animatedStyle]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonPulse style={styles.cardCircle} />
      <View style={styles.cardContent}>
        <SkeletonPulse style={styles.cardLine} />
        <SkeletonPulse style={styles.cardLineShort} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pulse: {
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  cardCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
    gap: spacing.sm,
  },
  cardLine: {
    height: 14,
    width: "70%",
    borderRadius: borderRadius.sm,
  },
  cardLineShort: {
    height: 10,
    width: "40%",
    borderRadius: borderRadius.sm,
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
