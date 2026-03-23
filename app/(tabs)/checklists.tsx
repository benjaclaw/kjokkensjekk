import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ClipboardCheck, ChevronRight } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../src/theme";
import { ProgressBar } from "../../src/components/ui";
import type { ChecklistTemplate, ChecklistEntry } from "../../src/types";
import { useAppStore } from "../../src/stores/appStore";

interface ChecklistRow {
  template: ChecklistTemplate;
  lastEntry?: ChecklistEntry;
}

function ChecklistCard({
  row,
  onPress,
}: {
  row: ChecklistRow;
  onPress: () => void;
}) {
  const { template, lastEntry } = row;
  const completedCount = lastEntry?.completedItems.length ?? 0;
  const totalCount = template.items.length;
  const isCompleted = lastEntry?.status === "completed";

  const lastCompletedLabel = lastEntry?.completedAt
    ? formatRelativeTime(lastEntry.completedAt)
    : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.cardIcon}>
        <ClipboardCheck size={24} color={colors.primary} strokeWidth={1.5} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{template.name}</Text>
        <ProgressBar
          progress={isCompleted ? 1 : totalCount > 0 ? completedCount / totalCount : 0}
        />
        <Text style={styles.cardMeta}>
          {template.items.length} punkter
          {lastCompletedLabel ? ` · Sist: ${lastCompletedLabel}` : ""}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} />
    </Pressable>
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
  return `${days} dager siden`;
}

export default function ChecklistsScreen() {
  const insets = useSafeAreaInsets();
  const checklists = useAppStore((s) => s.checklists);
  const entries = useAppStore((s) => s.entries);
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo<ChecklistRow[]>(() => {
    return checklists.map((template) => {
      const templateEntries = entries.filter(
        (e) => e.templateId === template.id,
      );
      const lastEntry = templateEntries[0];
      return { template, lastEntry };
    });
  }, [checklists, entries]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Sjekklister</Text>
        <Text style={styles.subtitle}>
          {rows.length} aktive sjekklister
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.template.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 300);
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ChecklistCard
            row={item}
            onPress={() => router.push(`/checklist/${item.template.id}`)}
          />
        )}
      />
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
    paddingBottom: spacing.xl,
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
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing["5xl"],
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
