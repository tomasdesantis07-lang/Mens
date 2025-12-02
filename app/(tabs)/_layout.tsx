import { Tabs } from "expo-router";
import {
  BarChart3,
  Crown,
  Dumbbell,
  User,
  Users,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ActiveWorkoutOverlay } from "../../src/components/workout/ActiveWorkoutOverlay";
import { COLORS } from "../../src/theme/theme";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
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
            title: t('tabs.stats'),
            tabBarIcon: ({ color }) => (
              <BarChart3 color={color} size={26} />
            ),
          }}
        />

        <Tabs.Screen
          name="communities"
          options={{
            title: t('tabs.communities'),
            tabBarIcon: ({ color }) => (
              <Users color={color} size={26} />
            ),
          }}
        />

        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color }) => (
              <Dumbbell color={color} size={26} />
            ),
          }}
        />

        <Tabs.Screen
          name="premium"
          options={{
            title: t('tabs.premium'),
            tabBarIcon: ({ color }) => (
              <Crown color={color} size={26} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color }) => (
              <User color={color} size={26} />
            ),
          }}
        />
      </Tabs>
      <ActiveWorkoutOverlay />
    </View>
  );
}