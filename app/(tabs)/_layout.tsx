import { Tabs } from "expo-router";
import {
  BarChart3,
  Crown,
  Dumbbell,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { COLORS } from "../../src/theme/theme";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ color }) => (
            <BarChart3 color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="communities"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color }) => (
            <Users color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Dumbbell color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="premium"
        options={{
          title: "Premium",
          tabBarIcon: ({ color }) => (
            <Crown color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <User color={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}