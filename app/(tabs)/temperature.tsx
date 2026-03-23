import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Snowflake, Thermometer, X } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, shadows, typography } from "../../src/theme";
import type { ComplianceStatus } from "../../src/theme";
import type { TemperatureDevice } from "../../src/types";
import { Button, SkeletonList, EmptyState } from "../../src/components/ui";
import { TemperatureInput } from "../../src/components/features/TemperatureInput";
import { useAppStore } from "../../src/stores/appStore";

function DeviceIcon({ type }: { type: TemperatureDevice["type"] }) {
  if (type === "freezer") {
    return <Snowflake size={24} color={colors.primary} strokeWidth={1.5} />;
  }
  return <Thermometer size={24} color={colors.primary} strokeWidth={1.5} />;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "ok"
      ? colors.success
      : status === "warning"
        ? colors.warning
        : status === "critical"
          ? colors.danger
          : colors.textMuted;

  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

function DeviceCard({
  device,
  onPress,
}: {
  device: TemperatureDevice;
  onPress: () => void;
}) {
  const temp = device.lastReading?.temperature;
  const status = device.lastReading?.status ?? "pending";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.deviceCard,
        pressed && styles.deviceCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Logg temperatur for ${device.name}`}
    >
      <View style={styles.deviceIconWrapper}>
        <DeviceIcon type={device.type} />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceRange}>
          {device.minTemp}°C – {device.maxTemp}°C
        </Text>
      </View>
      <View style={styles.deviceTemp}>
        {temp !== undefined && (
          <Text
            style={[
              styles.tempValue,
              {
                color: status === "ok" ? colors.success : colors.danger,
              },
            ]}
          >
            {temp.toFixed(1)}°C
          </Text>
        )}
        <StatusDot status={status} />
      </View>
    </Pressable>
  );
}

function getStatus(
  temp: number,
  minTemp: number,
  maxTemp: number,
): ComplianceStatus {
  if (temp >= minTemp && temp <= maxTemp) return "ok";
  const margin = (maxTemp - minTemp) * 0.25;
  if (temp >= minTemp - margin && temp <= maxTemp + margin) return "warning";
  return "critical";
}

export default function TemperatureScreen() {
  const insets = useSafeAreaInsets();
  const devices = useAppStore((s) => s.devices);
  const hydrated = useAppStore((s) => s.hydrated);
  const addReading = useAppStore((s) => s.addReading);
  const activeUser = useAppStore((s) => s.activeUser);
  const [selectedDevice, setSelectedDevice] = useState<TemperatureDevice | null>(null);
  const [tempValue, setTempValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const openDevice = useCallback((device: TemperatureDevice) => {
    setSelectedDevice(device);
    setTempValue(device.lastReading?.temperature ?? (device.minTemp + device.maxTemp) / 2);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedDevice(null);
    setBatchMode(false);
    setBatchIndex(0);
  }, []);

  const saveReading = useCallback(async () => {
    if (!selectedDevice) return;
    setSaving(true);
    const status = getStatus(tempValue, selectedDevice.minTemp, selectedDevice.maxTemp);
    await addReading({
      deviceId: selectedDevice.id,
      temperature: Math.round(tempValue * 10) / 10,
      status,
      recordedBy: activeUser,
      recordedAt: Date.now(),
    });
    void Haptics.notificationAsync(
      status === "ok"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
    setSaving(false);

    if (batchMode) {
      const nextIndex = batchIndex + 1;
      if (nextIndex < devices.length) {
        setBatchIndex(nextIndex);
        const next = devices[nextIndex];
        setSelectedDevice(next);
        setTempValue(next.lastReading?.temperature ?? (next.minTemp + next.maxTemp) / 2);
      } else {
        closeModal();
      }
    } else {
      closeModal();
    }
  }, [selectedDevice, tempValue, batchMode, batchIndex, devices, addReading, activeUser, closeModal]);

  const startBatch = useCallback(() => {
    if (devices.length === 0) return;
    setBatchMode(true);
    setBatchIndex(0);
    openDevice(devices[0]);
  }, [devices, openDevice]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Temperatur</Text>
        <Text style={styles.subtitle}>
          {devices.length} enheter registrert
        </Text>
      </View>

      {devices.length > 1 && (
        <View style={styles.batchRow}>
          <Button
            title="Logg alle"
            onPress={startBatch}
            variant="secondary"
            size="sm"
          />
        </View>
      )}

      {!hydrated ? (
        <SkeletonList count={3} />
      ) : devices.length === 0 ? (
        <EmptyState
          icon={Thermometer}
          title="Ingen enheter registrert"
          description="Legg til kjøleskap, frysere eller andre enheter for å starte temperaturlogging."
        />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                // Data is reactive via Zustand, just toggle refreshing
                setTimeout(() => setRefreshing(false), 300);
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
              <DeviceCard device={item} onPress={() => openDevice(item)} />
            </Animated.View>
          )}
        />
      )}

      {/* Temperature input modal */}
      <Modal
        visible={selectedDevice !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        {selectedDevice && (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedDevice.name}</Text>
                {batchMode && (
                  <Text style={styles.batchIndicator}>
                    {batchIndex + 1} av {devices.length}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); closeModal(); }} accessibilityLabel="Lukk">
                <X size={24} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <TemperatureInput
                value={tempValue}
                onChange={setTempValue}
                minTemp={selectedDevice.minTemp}
                maxTemp={selectedDevice.maxTemp}
              />
            </View>

            <View style={styles.modalActions}>
              {saving ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <>
                  <Button
                    title={batchMode ? "Lagre og neste" : "Lagre"}
                    onPress={() => void saveReading()}
                    variant="primary"
                    size="lg"
                  />
                  <Button
                    title="Avbryt"
                    onPress={closeModal}
                    variant="ghost"
                    size="md"
                  />
                </>
              )}
            </View>
          </View>
        )}
      </Modal>
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
  batchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "flex-start",
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing["5xl"],
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  deviceCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  deviceIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  deviceRange: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  deviceTemp: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  tempValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.tempSmall,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
  },
  emptySubtext: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  // Modal
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing["4xl"],
  },
  modalTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.text,
  },
  batchIndicator: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  modalActions: {
    gap: spacing.md,
    paddingBottom: spacing["5xl"],
  },
});
