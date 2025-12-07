import { BlurView } from "expo-blur";
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
import { StyleSheet, View } from "react-native";
import { AnimatedTabIcon } from "../../src/components/common/AnimatedTabIcon";
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
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            height: 60,
            borderRadius: 30,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: 0,
            paddingTop: 0,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.25,
            shadowRadius: 10,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={95}
              tint="dark"
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 30,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.15)",
                backgroundColor: "rgba(10, 10, 15, 0.4)",
              }}
            />
          ),
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="stats"
          options={{
            title: t('tabs.stats'),
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                icon={<BarChart3 color={color} size={26} />}
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="communities"
          options={{
            title: t('tabs.communities'),
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                icon={<Users color={color} size={26} />}
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                icon={<Dumbbell color={color} size={26} />}
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="premium"
          options={{
            title: t('tabs.premium'),
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                icon={<Crown color={color} size={26} />}
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                icon={<User color={color} size={26} />}
                focused={focused}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <ActiveWorkoutOverlay />
    </View>
  );
}