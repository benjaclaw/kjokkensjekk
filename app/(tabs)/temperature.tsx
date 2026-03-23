import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Snowflake, Thermometer } from "lucide-react-native";
import { colors, spacing, borderRadius, shadows, typography } from "../../src/theme";
import type { TemperatureDevice } from "../../src/types";

// Demo-data — erstattes med ekte data fra storage/API
const DEMO_DEVICES: TemperatureDevice[] = [
  {
    id: "1",
    name: "Kjøleskap 1",
    type: "fridge",
    minTemp: 0,
    maxTemp: 4,
    lastReading: {
      id: "r1",
      deviceId: "1",
      temperature: 3.2,
      status: "ok",
      recordedBy: "demo",
      recordedAt: Date.now() - 3600000,
    },
  },
  {
    id: "2",
    name: "Kjøleskap 2",
    type: "fridge",
    minTemp: 0,
    maxTemp: 4,
    lastReading: {
      id: "r2",
      deviceId: "2",
      temperature: 5.1,
      status: "critical",
      recordedBy: "demo",
      recordedAt: Date.now() - 7200000,
    },
  },
  {
    id: "3",
    name: "Fryser",
    type: "freezer",
    minTemp: -25,
    maxTemp: -18,
    lastReading: {
      id: "r3",
      deviceId: "3",
      temperature: -20.5,
      status: "ok",
      recordedBy: "demo",
      recordedAt: Date.now() - 1800000,
    },
  },
];

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
        : colors.danger;

  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

function DeviceCard({ device }: { device: TemperatureDevice }) {
  const temp = device.lastReading?.temperature;
  const status = device.lastReading?.status ?? "pending";

  return (
    <Pressable style={styles.deviceCard} accessibilityRole="button">
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
                color:
                  status === "ok" ? colors.success : colors.danger,
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

export default function TemperatureScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>Temperatur</Text>
        <Text style={styles.subtitle}>
          {DEMO_DEVICES.length} enheter registrert
        </Text>
      </View>

      <FlatList
        data={DEMO_DEVICES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <DeviceCard device={item} />}
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
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.sm,
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
});
