import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Building2, UserPlus } from "lucide-react-native";
import { colors, spacing, borderRadius, shadows, typography } from "../../src/theme";
import { useAuthStore } from "../../src/stores/authStore";

type Mode = "choose" | "create" | "join";

export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const createWorkspace = useAuthStore((s) => s.createWorkspace);
  const joinWorkspace = useAuthStore((s) => s.joinWorkspace);

  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [resultCode, setResultCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Skriv inn bedriftsnavn");
      return;
    }
    setError("");
    setLoading(true);
    const result = await createWorkspace(name.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.inviteCode) {
      setResultCode(result.inviteCode);
      setMode("choose"); // will show success
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) {
      setError("Koden må være 6 tegn");
      return;
    }
    setError("");
    setLoading(true);
    const result = await joinWorkspace(inviteCode.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/onboarding/profile");
    }
  };

  // After creating workspace, show invite code then continue
  if (resultCode) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing["4xl"] }]}>
        <View style={styles.content}>
          <Text style={styles.title}>Bedrift opprettet!</Text>
          <Text style={styles.subtitle}>Del denne koden med kollegaer:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{resultCode}</Text>
          </View>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/onboarding/profile")}
          >
            <Text style={styles.buttonText}>Fortsett</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (mode === "choose") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing["4xl"] }]}>
        <View style={styles.content}>
          <Text style={styles.title}>Velg bedrift</Text>
          <Text style={styles.subtitle}>
            Opprett en ny bedrift eller bli med i en eksisterende
          </Text>

          <View style={styles.options}>
            <Pressable style={styles.optionCard} onPress={() => setMode("create")}>
              <Building2 size={32} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.optionTitle}>Opprett ny bedrift</Text>
              <Text style={styles.optionDesc}>
                Start en ny workspace for din bedrift
              </Text>
            </Pressable>

            <Pressable style={styles.optionCard} onPress={() => setMode("join")}>
              <UserPlus size={32} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.optionTitle}>Bli med i eksisterende</Text>
              <Text style={styles.optionDesc}>
                Bruk en invitasjonskode fra din leder
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing["4xl"] }]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {mode === "create" ? "Ny bedrift" : "Bli med"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "create"
            ? "Skriv inn navnet på bedriften"
            : "Skriv inn 6-tegns invitasjonskode"}
        </Text>

        <View style={styles.form}>
          {mode === "create" ? (
            <TextInput
              style={styles.input}
              placeholder="Bedriftsnavn"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          ) : (
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="ABC123"
              placeholderTextColor={colors.textMuted}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={mode === "create" ? handleCreate : handleJoin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "create" ? "Opprett" : "Bli med"}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => { setMode("choose"); setError(""); }} style={styles.link}>
          <Text style={styles.linkBold}>Tilbake</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
    justifyContent: "center",
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h1,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing["3xl"],
  },
  options: {
    gap: spacing.lg,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing["2xl"],
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.sm,
  },
  optionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  optionDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
    textAlign: "center",
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  codeInput: {
    textAlign: "center",
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    letterSpacing: 4,
  },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing["2xl"],
    alignItems: "center",
    marginBottom: spacing["2xl"],
    ...shadows.sm,
  },
  codeText: {
    fontFamily: typography.fonts.bold,
    fontSize: 36,
    color: colors.primary,
    letterSpacing: 6,
  },
  error: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.small,
    color: colors.danger,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.button,
    color: "#fff",
  },
  link: {
    marginTop: spacing["2xl"],
    alignItems: "center",
  },
  linkBold: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.small,
    color: colors.primary,
  },
});
