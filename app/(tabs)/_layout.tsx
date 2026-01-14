import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from "expo-router";
import {
  BarChart3,
  Bell,
  Home,
  Settings,
  ShoppingBag,
  User,
  Users
} from "lucide-react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from "react-native";
import PagerView, { PagerViewOnPageScrollEvent } from "react-native-pager-view";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useEvent,
  useSharedValue,
  withSpring,
  type SharedValue
} from "react-native-reanimated";
import { AnimatedTabIcon } from "../../src/components/common/AnimatedTabIcon";
import { SectionAppBar } from "../../src/components/common/SectionAppBar";
import { ActiveWorkoutOverlay } from "../../src/components/workout/ActiveWorkoutOverlay";
import { COLORS } from "../../src/theme/theme";
import { MensHaptics } from "../../src/utils/haptics";
import { showToast } from "../../src/utils/toast";

// Screen imports
import CommunitiesScreen from "./communities";
import HomeScreen from "./home";
import PremiumScreen from "./premium";
import ProfileScreen from "./profile";
import StatsScreen from "./stats";

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

// Tab configuration
const TAB_CONFIG = [
  { name: 'stats', component: StatsScreen, icon: BarChart3 },
  { name: 'communities', component: CommunitiesScreen, icon: Users },
  { name: 'home', component: HomeScreen, icon: Home },
  { name: 'premium', component: PremiumScreen, icon: ShoppingBag },
  { name: 'profile', component: ProfileScreen, icon: User },
];

const INITIAL_TAB_INDEX = 2;

export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const pagerRef = useRef<PagerView>(null);

  // UI Thread Shared Value for exact scroll position (0, 0.5, 1, etc.)
  const scrollPosition = useSharedValue(INITIAL_TAB_INDEX);
  const [currentIndex, setCurrentIndex] = useState(INITIAL_TAB_INDEX);
  const isNavigatingRef = useRef(false);

  // Determine header props based on current index
  const getHeaderProps = (index: number) => {
    switch (index) {
      case 0: // Stats
        return {
          title: t('stats.analytics_title'),
          rightIcon: (
            <View>
              <Bell size={22} color={COLORS.textPrimary} strokeWidth={2} />
              <View style={styles.notificationDot} />
            </View>
          ),
          onRightPress: () => showToast.success("Notificaciones próximamente"),
        };
      case 1: // Communities
        return {
          title: t('communities.title'),
          rightIcon: (
            <View>
              <Bell size={22} color={COLORS.textPrimary} strokeWidth={2} />
              <View style={styles.notificationDot} />
            </View>
          ),
          onRightPress: () => showToast.success("Notificaciones próximamente"),
        };
      case 2: // Home
        return {
          title: "MENS",
          rightIcon: (
            <View>
              <Bell size={22} color={COLORS.textPrimary} strokeWidth={2} />
              <View style={styles.notificationDot} />
            </View>
          ),
          onRightPress: () => showToast.success("Notificaciones próximamente"),
        };
      case 3: // Premium
        return {
          title: t('premium.title'),
          rightIcon: (
            <View>
              <Bell size={22} color={COLORS.textPrimary} strokeWidth={2} />
              <View style={styles.notificationDot} />
            </View>
          ),
          onRightPress: () => showToast.success("Notificaciones próximamente"),
        };
      case 4: // Profile
        return {
          title: t('profile.title'),
          rightIcon: <Settings size={24} color={COLORS.textPrimary} strokeWidth={2} />,
          onRightPress: () => router.push('/settings'),
        };
      default:
        return { title: "", rightIcon: null, onRightPress: undefined };
    }
  };

  const headerProps = getHeaderProps(currentIndex);

  // Sync URL with pager state ONLY on initial mount or deep link
  useEffect(() => {
    const tabName = pathname.split('/').pop() || 'home';
    const tabIndex = TAB_CONFIG.findIndex(t => t.name === tabName);

    // Only set initial index if valid and distinct, to handle deep links
    if (tabIndex !== -1 && tabIndex !== currentIndex) {
      setCurrentIndex(tabIndex);
      // Use a slight delay to ensure pager is ready
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(tabIndex);
        scrollPosition.value = tabIndex;
      }, 0);
    }
  }, []); // Empty dependency array - run only ONCE on mount

  // Worklet handler for scroll events - runs purely on UI thread
  const onPageScroll = useEvent<PagerViewOnPageScrollEvent>(
    (event) => {
      'worklet';
      scrollPosition.value = event.position + event.offset;
    },
    ['onPageScroll']
  );

  // Handle page change from swipe - Local state update only
  const onPageSelected = useCallback((e: any) => {
    const newIndex = e.nativeEvent.position;
    setCurrentIndex(newIndex);
    // We DO NOT update router here to prevent re-render loops
    // The URL will stay as is, but the UI is correct
  }, []);

  const handleTabPress = useCallback((index: number) => {
    MensHaptics.selection();

    if (index !== currentIndex) {
      setCurrentIndex(index);
      // INSTANT page change - no scrolling through intermediate pages
      pagerRef.current?.setPageWithoutAnimation(index);
      // Animate the tab bar indicator smoothly (withSpring handled in FluidTabBar)
      scrollPosition.value = index;
    }
  }, [currentIndex, scrollPosition]);

  return (
    <View style={styles.container}>
      <AnimatedPagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={INITIAL_TAB_INDEX}
        onPageScroll={onPageScroll}
        onPageSelected={onPageSelected}
        overdrag={true} // Allow bounce effect at edges
        offscreenPageLimit={1} // Keep nearby pages in memory
      >
        {(TAB_CONFIG || []).map((tab) => (
          <View key={tab.name} style={styles.page}>
            <tab.component />
          </View>
        ))}
      </AnimatedPagerView>

      <View style={styles.appBarContainer} pointerEvents="box-none">
        <SectionAppBar
          title={headerProps.title}
          rightIcon={headerProps.rightIcon}
          onRightPress={headerProps.onRightPress}
          style={{ elevation: 50, zIndex: 9999 }}
        />
      </View>

      {/* Real-time fluid tab bar */}
      <FluidTabBar
        tabs={TAB_CONFIG}
        scrollPosition={scrollPosition}
        onTabPress={handleTabPress}
        currentIndex={currentIndex}
      />

      <ActiveWorkoutOverlay />
    </View>
  );
}

// ----------------------------------------------------------------------
// FLUID TAB BAR COMPONENT
// ----------------------------------------------------------------------

interface FluidTabBarProps {
  tabs: typeof TAB_CONFIG;
  scrollPosition: SharedValue<number>;
  onTabPress: (index: number) => void;
  currentIndex: number;
}

const FluidTabBar = memo<FluidTabBarProps>(({
  tabs,
  scrollPosition,
  onTabPress,
  currentIndex
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const tabCount = tabs.length;

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  // Create a smoothed version of the scroll position for the indicator
  const smoothedPosition = useDerivedValue(() => {
    return withSpring(scrollPosition.value, {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
    });
  });

  // Calculate indicator position and stretching purely on UI thread
  const indicatorStyle = useAnimatedStyle(() => {
    if (containerWidth === 0) return {};

    const tabWidth = containerWidth / tabCount;
    // Follow the smoothed position for a more "elastic" feel
    const translateX = (smoothedPosition.value * tabWidth) + (tabWidth / 2) - 24;

    // Optional: add a subtle horizontal stretch based on velocity (change in position)
    // We can use the difference between scrollPosition and smoothedPosition
    const diff = Math.abs(scrollPosition.value - smoothedPosition.value);
    const scaleX = 1 + (diff * 0.4); // Subtle stretch
    const scaleY = 1 - (diff * 0.15); // Subtle squash

    return {
      transform: [
        { translateX },
        { scaleX },
        { scaleY }
      ]
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
        <View style={styles.tabsRow} onLayout={onLayout}>
          {/* The Fluid Indicator */}
          <Animated.View style={[styles.indicatorWrapper, indicatorStyle]}>
            <View style={styles.indicator} />
          </Animated.View>

          {/* Tab Buttons */}
          {tabs.map((tab, index) => {
            const isFocused = currentIndex === index;

            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => onTabPress(index)}
                activeOpacity={0.7}
              >
                <AnimatedTabIcon
                  icon={<tab.icon color={isFocused ? COLORS.primary : COLORS.textSecondary} size={26} />}
                  focused={isFocused}
                  color={isFocused ? COLORS.primary : COLORS.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pager: {
    flex: 1,
    zIndex: 0,
    elevation: 0,
  },
  page: {
    flex: 1,
  },
  // Tab Bar Styles
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(10, 10, 15, 0.4)',
  },
  indicatorWrapper: {
    position: 'absolute',
    top: 6,
    left: 0,
    height: 48,
    width: 48,
    zIndex: 0,
  },
  indicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '25',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
  },
  tabsRow: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  appBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 9999,      // Extremely high zIndex
    elevation: 50,     // High elevation for Android
    backgroundColor: 'transparent',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
});