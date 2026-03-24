import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "../../src/theme";
import { useAuthStore } from "../../src/stores/authStore";

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const workspace = useAuthStore((s) => s.workspace);
  const setupProfile = useAuthStore((s) => s.setupProfile);

  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!displayName.trim()) {
      setError("Skriv inn et visningsnavn");
      return;
    }
    setError("");
    setLoading(true);
    const result = await setupProfile(displayName.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
    // Auth store listener in _layout will redirect to tabs
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing["4xl"] }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Hva heter du?</Text>
        <Text style={styles.subtitle}>
          Dette vises i «Registrert av»-felter
        </Text>

        {workspace ? (
          <View style={styles.workspaceBadge}>
            <Text style={styles.workspaceLabel}>Bedrift</Text>
            <Text style={styles.workspaceName}>{workspace.name}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="F.eks. Ola"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
            autoFocus
            autoComplete="name"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Kom i gang</Text>
            )}
          </Pressable>
        </View>
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
  workspaceBadge: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  workspaceLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  workspaceName: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.primary,
    marginTop: spacing.xs,
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
});
