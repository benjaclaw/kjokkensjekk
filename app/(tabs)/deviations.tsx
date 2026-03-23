import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, Plus, Clock } from "lucide-react-native";
import { colors, spacing, borderRadius, shadows, typography, statusColors } from "../../src/theme";
import type { ComplianceStatus } from "../../src/theme";

interface DeviationSummary {
  id: string;
  title: string;
  severity: ComplianceStatus;
  status: "open" | "in_progress" | "closed";
  reportedAt: string;
  assignedTo?: string;
}

const DEMO_DEVIATIONS: DeviationSummary[] = [
  {
    id: "1",
    title: "Kjøleskap 2 over grenseverdi",
    severity: "critical",
    status: "open",
    reportedAt: "I dag, 10:30",
  },
  {
    id: "2",
    title: "Manglende merking på varelageret",
    severity: "warning",
    status: "in_progress",
    reportedAt: "I går",
    assignedTo: "Anders",
  },
];

function StatusChip({ label, active }: { label: string; active: boolean }) {
  return (
    <Pressable
      style={[
        styles.chip,
        active && styles.chipActive,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SeverityBadge({ severity }: { severity: ComplianceStatus }) {
  const label = severity === "critical" ? "Kritisk" : severity === "warning" ? "Advarsel" : "OK";

  return (
    <View style={[styles.badge, { backgroundColor: `${statusColors[severity]}20` }]}>
      <Text style={[styles.badgeText, { color: statusColors[severity] }]}>
        {label}
      </Text>
    </View>
  );
}

function DeviationCard({ item }: { item: DeviationSummary }) {
  const statusLabel =
    item.status === "open"
      ? "Åpen"
      : item.status === "in_progress"
        ? "Under behandling"
        : "Lukket";

  return (
    <Pressable style={styles.card} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <SeverityBadge severity={item.severity} />
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <Clock size={14} color={colors.textMuted} strokeWidth={1.5} />
        <Text style={styles.cardTime}>{item.reportedAt}</Text>
        {item.assignedTo && (
          <Text style={styles.cardAssigned}>→ {item.assignedTo}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function DeviationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Avvik</Text>
        <Text style={styles.subtitle}>
          {DEMO_DEVIATIONS.filter((d) => d.status !== "closed").length} åpne avvik
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        <StatusChip label="Alle" active={true} />
        <StatusChip label="Åpne" active={false} />
        <StatusChip label="Under behandling" active={false} />
        <StatusChip label="Lukket" active={false} />
      </View>

      <FlatList
        data={DEMO_DEVIATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <DeviationCard item={item} />}
      />

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        accessibilityLabel="Meld nytt avvik"
        accessibilityRole="button"
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: 100,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
  },
  statusText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  cardTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardTime: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  cardAssigned: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
});
