import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardCheck, ChevronRight } from "lucide-react-native";
import { colors, spacing, borderRadius, shadows, typography } from "../../src/theme";

interface ChecklistSummary {
  id: string;
  name: string;
  itemCount: number;
  completedCount: number;
  lastCompleted?: string;
}

const DEMO_CHECKLISTS: ChecklistSummary[] = [
  {
    id: "1",
    name: "Daglig renholdssjekk",
    itemCount: 12,
    completedCount: 0,
    lastCompleted: "I går, 15:30",
  },
  {
    id: "2",
    name: "Varemottak",
    itemCount: 8,
    completedCount: 0,
    lastCompleted: "I dag, 08:15",
  },
  {
    id: "3",
    name: "Ukentlig dyprengjøring",
    itemCount: 18,
    completedCount: 0,
    lastCompleted: "Forrige mandag",
  },
];

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const progress = total > 0 ? completed / total : 0;
  const barColor = progress === 1 ? colors.success : colors.primary;

  return (
    <View style={styles.progressBg}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${progress * 100}%`,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

function ChecklistCard({ item }: { item: ChecklistSummary }) {
  return (
    <Pressable style={styles.card} accessibilityRole="button">
      <View style={styles.cardIcon}>
        <ClipboardCheck size={24} color={colors.primary} strokeWidth={1.5} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <ProgressBar completed={item.completedCount} total={item.itemCount} />
        <Text style={styles.cardMeta}>
          {item.completedCount}/{item.itemCount} punkter
          {item.lastCompleted ? ` · Sist: ${item.lastCompleted}` : ""}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function ChecklistsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Sjekklister</Text>
        <Text style={styles.subtitle}>
          {DEMO_CHECKLISTS.length} aktive sjekklister
        </Text>
      </View>

      <FlatList
        data={DEMO_CHECKLISTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ChecklistCard item={item} />}
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
  progressBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
