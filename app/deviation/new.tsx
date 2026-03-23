import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Camera, X as XIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const canSave = category !== null && severity !== null && description.trim().length > 0;

  const handleOpenCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Kamera-tilgang",
          "Du må gi tilgang til kameraet for å ta bilder av avvik.",
        );
        return;
      }
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCamera(true);
  }, [permission, requestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
    });
    if (photo) {
      setPhotoUri(photo.uri);
    }
    setShowCamera(false);
  }, []);

  const handleRemovePhoto = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoUri(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave || !category || !severity) return;
    setSaving(true);

    await addDeviation({
      category,
      severity,
      description: description.trim(),
      correctiveAction: correctiveAction.trim() || undefined,
      photoUri: photoUri ?? undefined,
      reportedBy: activeUser,
      reportedAt: Date.now(),
      status: "open",
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    router.back();
  }, [canSave, category, severity, description, correctiveAction, photoUri, addDeviation, activeUser]);

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        <View style={[styles.cameraControls, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable
            onPress={() => setShowCamera(false)}
            style={styles.cameraCancelBtn}
            accessibilityLabel="Avbryt"
          >
            <XIcon size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={() => void handleTakePhoto()}
            style={styles.cameraShutterBtn}
            accessibilityLabel="Ta bilde"
          >
            <View style={styles.cameraShutterInner} />
          </Pressable>
          <View style={styles.cameraSpacer} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
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

        <Text style={styles.label}>Foto</Text>
        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
            <Pressable
              onPress={handleRemovePhoto}
              style={styles.photoRemoveBtn}
              accessibilityLabel="Fjern bilde"
            >
              <XIcon size={16} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => void handleOpenCamera()}
            style={styles.photoButton}
          >
            <Camera size={24} color={colors.primary} strokeWidth={1.5} />
            <Text style={styles.photoButtonText}>Ta bilde</Text>
          </Pressable>
        )}
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
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}08`,
  },
  photoButtonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.primary,
  },
  photoPreview: {
    position: "relative",
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cameraCancelBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraShutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraShutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
  },
  cameraSpacer: {
    width: 48,
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
