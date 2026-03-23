import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, X as XIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../src/theme";
import { ProgressBar, Button } from "../../src/components/ui";
import type {
  ChecklistItemTemplate,
  CompletedChecklistItem,
} from "../../src/types";
import { useAppStore } from "../../src/stores/appStore";

interface ItemState {
  result: "ok" | "deviation" | null;
  comment: string;
}

function ChecklistItem({
  item,
  state,
  onOk,
  onDeviation,
  onCommentChange,
  index,
}: {
  item: ChecklistItemTemplate;
  state: ItemState;
  onOk: () => void;
  onDeviation: () => void;
  onCommentChange: (text: string) => void;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.itemContainer}
    >
      <View style={styles.itemRow}>
        <Text
          style={[
            styles.itemText,
            state.result === "ok" && styles.itemTextDone,
          ]}
        >
          {item.text}
        </Text>
        <View style={styles.itemActions}>
          <Pressable
            onPress={onOk}
            style={[
              styles.actionBtn,
              styles.okBtn,
              state.result === "ok" && styles.okBtnActive,
            ]}
            accessibilityLabel="OK"
            accessibilityRole="button"
          >
            <Check
              size={20}
              color={state.result === "ok" ? "#FFFFFF" : colors.success}
              strokeWidth={2}
            />
          </Pressable>
          <Pressable
            onPress={onDeviation}
            style={[
              styles.actionBtn,
              styles.deviationBtn,
              state.result === "deviation" && styles.deviationBtnActive,
            ]}
            accessibilityLabel="Avvik"
            accessibilityRole="button"
          >
            <XIcon
              size={20}
              color={state.result === "deviation" ? "#FFFFFF" : colors.danger}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      {state.result === "deviation" && (
        <Animated.View entering={FadeInDown.duration(200)}>
          <TextInput
            style={styles.commentInput}
            placeholder="Beskriv avviket..."
            placeholderTextColor={colors.textMuted}
            value={state.comment}
            onChangeText={onCommentChange}
            multiline
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const checklists = useAppStore((s) => s.checklists);
  const addChecklistEntry = useAppStore((s) => s.addChecklistEntry);
  const activeUser = useAppStore((s) => s.activeUser);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const template = useMemo(
    () => checklists.find((t) => t.id === id) ?? null,
    [checklists, id],
  );

  // Initialize item states when template is found
  if (template && !initialized) {
    const initial: Record<string, ItemState> = {};
    for (const item of template.items) {
      initial[item.id] = { result: null, comment: "" };
    }
    setItemStates(initial);
    setInitialized(true);
  }

  const setItemResult = useCallback(
    (itemId: string, result: "ok" | "deviation") => {
      void Haptics.impactAsync(
        result === "ok"
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium,
      );
      setItemStates((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], result },
      }));
    },
    [],
  );

  const setItemComment = useCallback((itemId: string, comment: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment },
    }));
  }, []);

  const completedCount = Object.values(itemStates).filter(
    (s) => s.result !== null,
  ).length;
  const totalCount = template?.items.length ?? 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const handleComplete = useCallback(async () => {
    if (!template || !allDone) return;
    setSaving(true);

    const completedItems: CompletedChecklistItem[] = template.items.map((item) => ({
      itemId: item.id,
      result: itemStates[item.id].result as "ok" | "deviation",
      comment: itemStates[item.id].comment || undefined,
    }));

    await addChecklistEntry({
      templateId: template.id,
      completedItems,
      completedBy: activeUser,
      startedAt: Date.now(),
      completedAt: Date.now(),
      status: "completed",
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    router.back();
  }, [template, allDone, itemStates, addChecklistEntry, activeUser]);

  if (!template) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            accessibilityLabel="Tilbake"
            accessibilityRole="button"
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{template.name}</Text>
            <Text style={styles.subtitle}>
              {completedCount} av {totalCount} fullført
            </Text>
          </View>
        </View>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={totalCount > 0 ? completedCount / totalCount : 0} height={8} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {template.items.map((item, index) => (
          <ChecklistItem
            key={item.id}
            item={item}
            state={itemStates[item.id] ?? { result: null, comment: "" }}
            onOk={() => setItemResult(item.id, "ok")}
            onDeviation={() => setItemResult(item.id, "deviation")}
            onCommentChange={(text) => setItemComment(item.id, text)}
            index={index}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {saving ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button
            title="Fullfør sjekkliste"
            onPress={() => void handleComplete()}
            variant={allDone ? "success" : "primary"}
            size="lg"
            disabled={!allDone}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressWrapper: {
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: 120,
  },
  itemContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginRight: spacing.md,
  },
  itemTextDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  okBtn: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  okBtnActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  deviationBtn: {
    borderColor: colors.danger,
    backgroundColor: `${colors.danger}10`,
  },
  deviationBtnActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  commentInput: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
});
