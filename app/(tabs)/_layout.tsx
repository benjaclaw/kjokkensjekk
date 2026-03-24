import { useCallback, useRef, useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import {
  LayoutDashboard,
  Thermometer,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors } from "../../src/theme";

import HomeScreen from "./index";
import TemperatureScreen from "./temperature";
import ChecklistsScreen from "./checklists";
import DeviationsScreen from "./deviations";
import OverviewScreen from "./overview";

const TABS = [
  { title: "Hjem", Icon: LayoutDashboard },
  { title: "Temperatur", Icon: Thermometer },
  { title: "Sjekklister", Icon: ClipboardCheck },
  { title: "Avvik", Icon: AlertTriangle },
  { title: "Oversikt", Icon: BarChart3 },
] as const;

const SCREENS = [
  HomeScreen,
  TemperatureScreen,
  ChecklistsScreen,
  DeviationsScreen,
  OverviewScreen,
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const index = e.nativeEvent.position;
      setActiveIndex(index);
      void Haptics.selectionAsync();
    },
    [],
  );

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
        overdrag
      >
        {SCREENS.map((Screen, index) => (
          <View key={index} style={styles.page}>
            <Screen />
          </View>
        ))}
      </PagerView>

      <View
        style={[
          styles.tabBar,
          {
            height: 56 + insets.bottom,
            paddingBottom: 4 + insets.bottom,
          },
        ]}
      >
        {TABS.map((tab, index) => {
          const isActive = index === activeIndex;
          const color = isActive ? colors.primary : colors.textMuted;
          return (
            <Pressable
              key={tab.title}
              style={styles.tabItem}
              onPress={() => handleTabPress(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.title}
            >
              <tab.Icon size={24} color={color} strokeWidth={1.5} />
              <Text
                style={[styles.tabLabel, { color }]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
});
