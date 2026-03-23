import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Clock, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  statusColors,
} from "../../src/theme";
import { StatusBadge, Button } from "../../src/components/ui";
import type { Deviation } from "../../src/types";
import * as storageService from "../../src/services/storageService";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeviationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [deviation, setDeviation] = useState<Deviation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    void (async () => {
      const deviations = await storageService.getDeviations();
      const found = deviations.find((d) => d.id === id);
      setDeviation(found ?? null);
      setLoading(false);
    })();
  }, [id]);

  const updateStatus = useCallback(
    async (newStatus: Deviation["status"]) => {
      if (!deviation) return;
      setUpdating(true);
      const updates: Partial<Deviation> = { status: newStatus };
      if (newStatus === "closed") {
        updates.closedAt = Date.now();
        updates.closedBy = "Bruker";
      }
      await storageService.updateDeviation(deviation.id, updates);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeviation({ ...deviation, ...updates });
      setUpdating(false);
    },
    [deviation],
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!deviation) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.emptyText}>Avvik ikke funnet</Text>
      </View>
    );
  }

  const statusLabel =
    deviation.status === "open"
      ? "Åpen"
      : deviation.status === "in_progress"
        ? "Under behandling"
        : "Lukket";

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
        <Text style={styles.headerTitle}>Avviksdetalj</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <StatusBadge status={deviation.severity} size="md" />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>

        <Text style={styles.category}>{deviation.category}</Text>
        <Text style={styles.description}>{deviation.description}</Text>

        {deviation.correctiveAction && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Korrigerende tiltak</Text>
            <Text style={styles.sectionBody}>{deviation.correctiveAction}</Text>
          </View>
        )}

        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <User size={16} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.metaText}>
              Rapportert av {deviation.reportedBy}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Clock size={16} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.metaText}>
              {formatDate(deviation.reportedAt)}
            </Text>
          </View>
          {deviation.closedAt && (
            <View style={styles.metaRow}>
              <Clock size={16} color={colors.success} strokeWidth={1.5} />
              <Text style={[styles.metaText, { color: colors.success }]}>
                Lukket {formatDate(deviation.closedAt)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {deviation.status !== "closed" && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          {updating ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View style={styles.footerActions}>
              {deviation.status === "open" && (
                <Button
                  title="Start behandling"
                  onPress={() => void updateStatus("in_progress")}
                  variant="primary"
                  size="lg"
                />
              )}
              <Button
                title="Lukk avvik"
                onPress={() => void updateStatus("closed")}
                variant="success"
                size="lg"
              />
            </View>
          )}
        </View>
      )}
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
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  statusText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  category: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.text,
    lineHeight: typography.sizes.body * typography.lineHeights.body,
  },
  section: {
    marginTop: spacing["2xl"],
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.text,
    lineHeight: typography.sizes.body * typography.lineHeights.body,
  },
  metaSection: {
    marginTop: spacing["2xl"],
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  emptyText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
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
  footerActions: {
    gap: spacing.sm,
  },
});
