
import { Tabs } from "expo-router";
import {
  BarChart3,
  Home,
  ShoppingBag,
  User,
  Users
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { AnimatedTabIcon } from "../../src/components/common/AnimatedTabIcon";
import { CustomTabBar } from "../../src/components/common/CustomTabBar";
import { ActiveWorkoutOverlay } from "../../src/components/workout/ActiveWorkoutOverlay";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="home"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
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
                icon={<Home color={color} size={26} />}
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
                icon={<ShoppingBag color={color} size={26} />}
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