import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Thermometer,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react-native";
import { colors } from "../../src/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hjem",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="temperature"
        options={{
          title: "Temperatur",
          tabBarIcon: ({ color, size }) => (
            <Thermometer size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: "Sjekklister",
          tabBarIcon: ({ color, size }) => (
            <ClipboardCheck size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="deviations"
        options={{
          title: "Avvik",
          tabBarIcon: ({ color, size }) => (
            <AlertTriangle size={size} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
