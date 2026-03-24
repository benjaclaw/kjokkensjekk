import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SystemUI from "expo-system-ui";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "../src/theme";
import { useAppStore } from "../src/stores/appStore";
import { useAuthStore } from "../src/stores/authStore";
import { setupAllNotifications } from "../src/services/notificationService";

SplashScreen.preventAutoHideAsync().catch(() => {});

function useAuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnboarded = useAuthStore((s) => s.isOnboarded);
  const authLoading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboardingGroup = segments[0] === "onboarding";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (isAuthenticated && !isOnboarded && !inOnboardingGroup) {
      router.replace("/onboarding/workspace");
    } else if (isAuthenticated && isOnboarded && (inAuthGroup || inOnboardingGroup)) {
      router.replace("/");
    }
  }, [isAuthenticated, isOnboarded, authLoading, segments, router]);
}

export default function RootLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authLoading = useAuthStore((s) => s.loading);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const deviations = useAppStore((s) => s.deviations);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
    void hydrate();
    void initializeAuth();
  }, [hydrate, initializeAuth]);

  useEffect(() => {
    if (hydrated) {
      void setupAllNotifications(deviations);
    }
  }, [hydrated, deviations]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, authLoading]);

  useAuthRedirect();

  if ((!fontsLoaded && !fontError) || !hydrated || authLoading) {
    return <View style={styles.loading} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
