import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
  BarChart3,
  Crown,
  Dumbbell,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../src/theme/theme";

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <MaterialTopTabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          paddingTop: insets.top,
        },
        tabBarShowLabel: false,
        tabBarIndicatorStyle: {
          backgroundColor: COLORS.primary,
          height: 3,
        },
        tabBarShowIcon: true,
      }}
    >
      <MaterialTopTabs.Screen
        name="stats"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ color }) => (
            <BarChart3 color={color} size={26} />
          ),
        }}
      />

      <MaterialTopTabs.Screen
        name="communities"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color }) => (
            <Users color={color} size={26} />
          ),
        }}
      />

      <MaterialTopTabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Dumbbell color={color} size={26} />
          ),
        }}
      />

      <MaterialTopTabs.Screen
        name="premium"
        options={{
          title: "Premium",
          tabBarIcon: ({ color }) => (
            <Crown color={color} size={26} />
          ),
        }}
      />

      <MaterialTopTabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <User color={color} size={26} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}