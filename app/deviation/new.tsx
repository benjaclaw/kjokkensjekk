import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
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
import { Button } from "../../src/components/ui";
import { useAppStore } from "../../src/stores/appStore";

const CATEGORIES = [
  "Temperatur",
  "Renhold",
  "Varemottak",
  "Merking",
  "Personlig hygiene",
  "Annet",
];

const SEVERITIES: { value: ComplianceStatus; label: string }[] = [
  { value: "warning", label: "Advarsel" },
  { value: "critical", label: "Kritisk" },
];

function ChipSelect<T extends string>({
  options,
  selected,
  onSelect,
  getLabel,
  getColor,
}: {
  options: T[];
  selected: T | null;
  onSelect: (value: T) => void;
  getLabel: (value: T) => string;
  getColor?: (value: T) => string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt === selected;
        const activeColor = getColor?.(opt) ?? colors.primary;
        return (
          <Pressable
            key={opt}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt);
            }}
            style={[
              styles.chip,
              active && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                active && styles.chipTextActive,
              ]}
            >
              {getLabel(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function NewDeviationScreen() {
  const insets = useSafeAreaInsets();
  const addDeviation = useAppStore((s) => s.addDeviation);
  const activeUser = useAppStore((s) => s.activeUser);
  const [category, setCategory] = useState<string | null>(null);
  const [severity, setSeverity] = useState<ComplianceStatus | null>(null);
  const [description, setDescription] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = category !== null && severity !== null && description.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!canSave || !category || !severity) return;
    setSaving(true);

    await addDeviation({
      category,
      severity,
      description: description.trim(),
      correctiveAction: correctiveAction.trim() || undefined,
      reportedBy: activeUser,
      reportedAt: Date.now(),
      status: "open",
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    router.back();
  }, [canSave, category, severity, description, correctiveAction, addDeviation, activeUser]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Tilbake"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.title}>Nytt avvik</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Kategori</Text>
        <ChipSelect
          options={CATEGORIES}
          selected={category}
          onSelect={setCategory}
          getLabel={(v) => v}
        />

        <Text style={styles.label}>Alvorlighet</Text>
        <ChipSelect
          options={SEVERITIES.map((s) => s.value)}
          selected={severity}
          onSelect={setSeverity}
          getLabel={(v) => SEVERITIES.find((s) => s.value === v)?.label ?? v}
          getColor={(v) => statusColors[v]}
        />

        <Text style={styles.label}>Beskrivelse *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Beskriv avviket..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Korrigerende tiltak</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Hva er gjort / skal gjøres?"
          placeholderTextColor={colors.textMuted}
          value={correctiveAction}
          onChangeText={setCorrectiveAction}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {saving ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button
            title="Registrer avvik"
            onPress={() => void handleSave()}
            variant="danger"
            size="lg"
            disabled={!canSave}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.text,
  },
  form: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.small,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 80,
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
