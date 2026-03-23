import { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { Plus, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  statusColors,
} from "../../src/theme";
import type { ComplianceStatus } from "../../src/theme";
import type { Deviation } from "../../src/types";
import * as storageService from "../../src/services/storageService";

type FilterValue = "all" | "open" | "in_progress" | "closed";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "open", label: "Åpne" },
  { value: "in_progress", label: "Under behandling" },
  { value: "closed", label: "Lukket" },
];

function StatusChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SeverityBadge({ severity }: { severity: ComplianceStatus }) {
  const label =
    severity === "critical"
      ? "Kritisk"
      : severity === "warning"
        ? "Advarsel"
        : "OK";

  return (
    <View
      style={[styles.badge, { backgroundColor: `${statusColors[severity]}20` }]}
    >
      <Text style={[styles.badgeText, { color: statusColors[severity] }]}>
        {label}
      </Text>
    </View>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Nå";
  if (minutes < 60) return `${minutes} min siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}t siden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "I går";
  return `${days}d siden`;
}

function DeviationCard({
  deviation,
  onPress,
}: {
  deviation: Deviation;
  onPress: () => void;
}) {
  const statusLabel =
    deviation.status === "open"
      ? "Åpen"
      : deviation.status === "in_progress"
        ? "Under behandling"
        : "Lukket";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <SeverityBadge severity={deviation.severity} />
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
      <Text style={styles.cardTitle}>{deviation.description}</Text>
      <View style={styles.cardFooter}>
        <Clock size={14} color={colors.textMuted} strokeWidth={1.5} />
        <Text style={styles.cardTime}>
          {formatRelativeTime(deviation.reportedAt)}
        </Text>
        {deviation.category && (
          <Text style={styles.cardCategory}>{deviation.category}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function DeviationsScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");

  const loadData = useCallback(async () => {
    const loaded = await storageService.getDeviations();
    setDeviations(loaded);
  }, []);

  useEffect(() => {
    if (isFocused) {
      void loadData();
    }
  }, [isFocused, loadData]);

  const filtered =
    filter === "all"
      ? deviations
      : deviations.filter((d) => d.status === filter);

  const openCount = deviations.filter((d) => d.status !== "closed").length;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Avvik</Text>
        <Text style={styles.subtitle}>{openCount} åpne avvik</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <StatusChip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DeviationCard
            deviation={item}
            onPress={() => router.push(`/deviation/${item.id}`)}
          />
        )}
      />

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/deviation/new");
        }}
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
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
  cardCategory: {
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
