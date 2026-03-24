import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "../../src/theme";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Fyll inn e-post og passord");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing["4xl"] }]}>
        <Text style={styles.title}>Kjøkkensjekk</Text>
        <Text style={styles.subtitle}>Logg inn for å fortsette</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-post"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Passord"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Logg inn</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace("/auth/register")} style={styles.link}>
          <Text style={styles.linkText}>
            Har du ikke konto? <Text style={styles.linkBold}>Registrer deg</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing["4xl"],
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
  link: {
    marginTop: spacing["2xl"],
    alignItems: "center",
  },
  linkText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
  linkBold: {
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
});
