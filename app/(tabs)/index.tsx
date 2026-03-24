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
import { useAppStore } from "../../src/stores/appStore";

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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function useComputedStats() {
  const devices = useAppStore((s) => s.devices);
  const entries = useAppStore((s) => s.entries);
  const deviations = useAppStore((s) => s.deviations);
  const checklists = useAppStore((s) => s.checklists);

  const devicesOk = devices.filter((d) => d.lastReading?.status === "ok").length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const checklistsDoneToday = entries.filter(
    (e) => e.status === "completed" && (e.completedAt ?? 0) >= todayMs,
  ).length;

  const openDeviations = deviations.filter((d) => d.status !== "closed").length;
  const totalDeviations = deviations.length;
  const closedDeviations = totalDeviations - openDeviations;

  const tempScore = devices.length > 0 ? (devicesOk / devices.length) * 100 : 100;
  const checklistScore =
    checklists.length > 0
      ? (checklistsDoneToday / checklists.length) * 100
      : 100;
  const deviationScore =
    totalDeviations > 0
      ? (closedDeviations / totalDeviations) * 100
      : 100;

  const complianceScore = Math.round(
    tempScore * 0.4 + checklistScore * 0.3 + deviationScore * 0.3,
  );

  return {
    complianceScore: Math.min(100, Math.max(0, complianceScore)),
    devicesOk,
    devicesTotal: devices.length,
    checklistsDoneToday,
    checklistsTotal: checklists.length,
    openDeviations,
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const stats = useComputedStats();
  const greeting = getGreeting();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>
          {stats.complianceScore >= 80
            ? "Alt ser bra ut i dag"
            : stats.complianceScore >= 60
              ? "Noen ting trenger oppmerksomhet"
              : "Det er oppgaver som haster"}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.scoreWrapper}
      >
        <ComplianceScore score={stats.complianceScore} />
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
          onPress={() => router.push("/deviation/new")}
          delay={400}
        />
      </View>

      {/* Oversikt */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statsCard}>
          <StatRow
            label="Temperatur OK"
            value={`${stats.devicesOk} / ${stats.devicesTotal}`}
          />
          <StatRow
            label="Sjekklister i dag"
            value={`${stats.checklistsDoneToday} / ${stats.checklistsTotal}`}
          />
          <StatRow
            label="Åpne avvik"
            value={`${stats.openDeviations}`}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "God natt";
  if (hour < 12) return "God morgen";
  if (hour < 18) return "God ettermiddag";
  return "God kveld";
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
    gap: spacing["2xl"],
    marginBottom: spacing["3xl"],
  },
  quickAction: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
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
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
  },
  statValue: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
});
