import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Thermometer,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, borderRadius, shadows, typography } from "../../src/theme";

function ComplianceScore({ score }: { score: number }) {
  const statusColor =
    score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger;

  return (
    <View style={[styles.scoreContainer, { borderColor: statusColor }]}>
      <Text style={[styles.scoreNumber, { color: statusColor }]}>{score}</Text>
      <Text style={styles.scoreLabel}>Compliance</Text>
    </View>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onPress,
  delay,
}: {
  icon: typeof Thermometer;
  label: string;
  onPress: () => void;
  delay: number;
}) {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <Pressable
        onPress={handlePress}
        style={styles.quickAction}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.quickActionIcon}>
          <Icon size={28} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={styles.greeting}>God morgen 👋</Text>
        <Text style={styles.subtitle}>Alt ser bra ut i dag</Text>
      </Animated.View>

      {/* Compliance Score */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.scoreWrapper}
      >
        <ComplianceScore score={92} />
      </Animated.View>

      {/* Hurtigknapper */}
      <View style={styles.quickActions}>
        <QuickAction
          icon={Thermometer}
          label="Temperatur"
          onPress={() => router.push("/(tabs)/temperature")}
          delay={200}
        />
        <QuickAction
          icon={ClipboardCheck}
          label="Sjekkliste"
          onPress={() => router.push("/(tabs)/checklists")}
          delay={300}
        />
        <QuickAction
          icon={AlertTriangle}
          label="Meld avvik"
          onPress={() => router.push("/(tabs)/deviations")}
          delay={400}
        />
      </View>

      {/* Kommende oppgaver */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <Text style={styles.sectionTitle}>Kommende oppgaver</Text>
        <View style={styles.taskCard}>
          <View style={[styles.taskDot, { backgroundColor: colors.warning }]} />
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>Temperaturkontroll — Kjøl 1</Text>
            <Text style={styles.taskTime}>Innen 14:00</Text>
          </View>
        </View>
        <View style={styles.taskCard}>
          <View style={[styles.taskDot, { backgroundColor: colors.primary }]} />
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>Daglig renholdssjekk</Text>
            <Text style={styles.taskTime}>Innen 16:00</Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["5xl"],
  },
  greeting: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  scoreWrapper: {
    alignItems: "center",
    marginVertical: spacing["3xl"],
  },
  scoreContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  scoreNumber: {
    fontFamily: typography.fonts.bold,
    fontSize: 40,
  },
  scoreLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: -2,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing["3xl"],
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.small,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  taskTime: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    marginTop: 2,
  },
});
