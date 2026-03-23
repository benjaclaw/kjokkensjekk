import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Thermometer,
  ClipboardCheck,
  AlertTriangle,
  Settings,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../src/theme";
import { useAppStore } from "../../src/stores/appStore";

function ComplianceScoreLarge({ score }: { score: number }) {
  const statusColor =
    score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger;

  return (
    <View style={[styles.scoreBadge, { borderColor: statusColor }]}>
      <Text style={[styles.scoreValue, { color: statusColor }]}>{score}</Text>
      <Text style={styles.scoreUnit}>%</Text>
      <Text style={styles.scoreLabel}>Compliance Score</Text>
    </View>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.statCard}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={24} color={color} strokeWidth={1.5} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function OverviewScreen() {
  const insets = useSafeAreaInsets();
  const devices = useAppStore((s) => s.devices);
  const readings = useAppStore((s) => s.readings);
  const entries = useAppStore((s) => s.entries);
  const deviations = useAppStore((s) => s.deviations);
  const checklists = useAppStore((s) => s.checklists);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const tempsLoggedThisWeek = readings.filter(
      (r) => r.recordedAt >= weekAgo,
    ).length;

    const checklistsCompletedThisWeek = entries.filter(
      (e) => e.status === "completed" && (e.completedAt ?? 0) >= weekAgo,
    ).length;

    const deviationsThisWeek = deviations.filter(
      (d) => d.reportedAt >= weekAgo,
    ).length;

    const openDeviations = deviations.filter(
      (d) => d.status !== "closed",
    ).length;

    const devicesOk = devices.filter(
      (d) => d.lastReading?.status === "ok",
    ).length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const checklistsDoneToday = entries.filter(
      (e) =>
        e.status === "completed" &&
        (e.completedAt ?? 0) >= todayStart.getTime(),
    ).length;

    const totalDeviations = deviations.length;
    const closedDeviations = totalDeviations - openDeviations;

    const tempScore =
      devices.length > 0 ? (devicesOk / devices.length) * 100 : 100;
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
      tempsLoggedThisWeek,
      checklistsCompletedThisWeek,
      deviationsThisWeek,
      openDeviations,
    };
  }, [devices, readings, entries, deviations, checklists]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Oversikt</Text>
        <Pressable
          onPress={() => {
            // Placeholder for settings
          }}
          accessibilityLabel="Innstillinger"
          accessibilityRole="button"
        >
          <Settings size={24} color={colors.textMuted} strokeWidth={1.5} />
        </Pressable>
      </View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.scoreWrapper}
      >
        <ComplianceScoreLarge score={stats.complianceScore} />
      </Animated.View>

      <Text style={styles.sectionTitle}>Denne uken</Text>
      <View style={styles.statGrid}>
        <StatCard
          icon={Thermometer}
          label="Temp. logget"
          value={`${stats.tempsLoggedThisWeek}`}
          color={colors.primary}
          delay={200}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Sjekklister"
          value={`${stats.checklistsCompletedThisWeek}`}
          color={colors.success}
          delay={300}
        />
        <StatCard
          icon={AlertTriangle}
          label="Avvik"
          value={`${stats.deviationsThisWeek}`}
          color={stats.openDeviations > 0 ? colors.danger : colors.textMuted}
          delay={400}
        />
      </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.text,
  },
  scoreWrapper: {
    alignItems: "center",
    marginVertical: spacing["4xl"],
  },
  scoreBadge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  scoreValue: {
    fontFamily: typography.fonts.bold,
    fontSize: 52,
  },
  scoreUnit: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.textMuted,
    marginTop: -8,
  },
  scoreLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  statGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
