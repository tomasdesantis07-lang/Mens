import { useFocusEffect } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Dumbbell, Flame, Moon, Play, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AnimatedCard,
  AnimatedHeader,
  AnimatedSection,
  AnimatedSlideIn,
} from "../../src/components/common/Animations";
import { SectionAppBar } from "../../src/components/common/SectionAppBar";
import { CalorieResultsModal } from "../../src/components/home/CalorieResultsModal";
import { RecentWorkouts } from "../../src/components/home/RecentWorkouts";
import { DaySelectorSheet } from "../../src/components/specific/DaySelectorSheet";
import { RoutineCard } from "../../src/components/specific/RoutineCard";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useWorkoutTimerContext } from "../../src/context/WorkoutTimerContext";
import { useRoutines } from "../../src/hooks/useRoutines";
import { useTabBarInset } from "../../src/hooks/useTabBarInset";
import { auth, db } from "../../src/services/firebaseConfig";
import { RoutineService } from "../../src/services/routineService";
import { WorkoutService } from "../../src/services/workoutService";
import { COLORS, FONT_SIZE, TYPOGRAPHY } from "../../src/theme/theme";
import { Routine } from "../../src/types/routine";
import { MensHaptics } from "../../src/utils/haptics";
import { calculateAge, calculateBMI, calculateBMR, calculateTDEE, getWeightClass, HealthMetrics } from "../../src/utils/healthUtils";

type UserData = {
  email?: string;
  displayName?: string;
  objective?: string | null;
  daysPerWeek?: number | null;
  level?: string | null;
  isPremium?: boolean;
};

type UserMetrics = {
  streak: number;
  totalVolume7d: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const PADDING_H = 24;
const STAT_CARD_HEIGHT = 100;

// Helper component for the timer inside the shared element to avoid re-rendering layout
const ActiveTimer: React.FC<{ startTime: number | null }> = ({ startTime }) => {
  const { elapsedTime } = useWorkoutTimerContext();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  return <Text style={styles.activeTimerText}>{formatTime(elapsedTime)}</Text>;
};

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const AnyFlashList = FlashList as any;
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { routines: userRoutines, loading: routinesLoading } = useRoutines();
  const [communityRoutines, setCommunityRoutines] = useState<Routine[]>([]);
  const [selectedRoutineForTraining, setSelectedRoutineForTraining] = useState<Routine | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [nextWorkout, setNextWorkout] = useState<{ routineId: string; dayIndex: number; isRestDay: boolean } | null>(null);

  // New: Health metrics modal state
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);

  // Floating button animation
  const expandAnimation = useSharedValue(1); // 1 = expanded, 0 = collapsed
  const [isButtonExpanded, setIsButtonExpanded] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const rotateAnimation = useSharedValue(0);

  const { startWorkout, activeWorkout } = useWorkout();

  // Rotating border glow animation
  useEffect(() => {
    rotateAnimation.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1, // Infinite
      false // No reverse
    );
  }, []);

  // Reset button animation when screen is focused
  const loadData = useCallback(async (isInitial = false) => {
    const user = auth.currentUser;
    if (!user) {
      if (isInitial) setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);

      // Parallelize independent requests
      const [userSnap, community, workout] = await Promise.all([
        getDoc(userRef),
        RoutineService.getCommunityRoutines(),
        WorkoutService.getWorkoutForToday(user.uid)
      ]);

      if (userSnap.exists()) {
        setUserData(userSnap.data() as UserData);
      }

      setCommunityRoutines(community);
      setNextWorkout(workout);

    } catch (e) {
      console.log("Error loading data", e);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Reset button animation and REFRESH DATA when screen is focused
  useFocusEffect(
    useCallback(() => {
      // IMPERATIVE UI RESET
      setIsButtonExpanded(true);
      setShowFloatingButton(true);
      expandAnimation.value = 1;

      // Defer data loading to keep navigation smooth
      const interaction = InteractionManager.runAfterInteractions(() => {
        loadData();
      });

      // NO TIMER: Buttons stay expanded indefinitely as requested
      // const timer = setTimeout(...) REMOVED

      return () => {
        interaction.cancel();
      };
    }, [loadData])
  );

  // Animated styles
  const floatingBtnContainerStyle = useAnimatedStyle(() => {
    // We need to access nextWorkout here, but be careful about null safety if used inside calculation
    // However, hooks run on every render so values are fresh.
    const isRest = nextWorkout?.isRestDay ?? false;

    // Dynamic width based on content
    return {
      opacity: isRest ? 0.7 : 1,
    };
  }, [nextWorkout]);

  const floatingBtnRotateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotateAnimation.value * 360}deg` }
      ]
    };
  });

  const floatingBtnTextStyle = useAnimatedStyle(() => {
    const isRest = nextWorkout?.isRestDay ?? false;
    // Dynamic width based on content
    return {
      opacity: expandAnimation.value
    };
  }, [nextWorkout]);

  const emptyWorkoutBtnStyle = useAnimatedStyle(() => {
    // Dynamic width based on content
    return {};
  });

  const emptyWorkoutTextStyle = useAnimatedStyle(() => {
    // Dynamic width based on content
    return { opacity: expandAnimation.value };
  });

  const emptyWorkoutGlowStyle = useAnimatedStyle(() => {
    const left = interpolate(
      expandAnimation.value,
      [0, 1],
      [-76, -10]
    );
    return { left };
  });

  const floatingGradientLeftStyle = useAnimatedStyle(() => {
    const left = interpolate(
      expandAnimation.value,
      [0, 1],
      [-101, -10]
    );
    return { left };
  });


  // PHASE 1: Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // New: Check for new user and show health metrics modal
  useEffect(() => {
    if (loading || !userData) return;

    const checkNewUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const data = snap.data();

        // Check if this is a new user who hasn't seen the health modal yet
        if (data.hasSeenHealthModal) return;

        // Get biometrics from user data
        const biometrics = data.biometrics;
        if (!biometrics || !biometrics.weight || !biometrics.height || !biometrics.birthDate || !biometrics.gender) {
          return; // Missing biometric data, can't calculate
        }

        // Determine training days per week
        let trainingDays = data.daysPerWeek;

        // If daysPerWeek not set, calculate from user's active routine
        if (!trainingDays && userRoutines.length > 0) {
          // Use the first routine (or most recently used) to calculate training days
          const activeRoutine = userRoutines[0];
          // Count non-rest days in the routine
          trainingDays = activeRoutine.days?.filter((day: any) => !day.isRestDay).length || 3;

          // Update user profile with calculated daysPerWeek
          await updateDoc(userRef, { daysPerWeek: trainingDays });
        }

        // If still no training days (no routine created yet), don't show modal
        if (!trainingDays) {
          console.log('User has no routine yet, waiting to show health modal');
          return;
        }

        // Calculate health metrics
        const age = calculateAge(biometrics.birthDate?.replace(/ \/ /g, '-') || null);
        const bmi = calculateBMI(biometrics.weight, biometrics.height);
        const bmr = calculateBMR(biometrics.weight, biometrics.height, age, biometrics.gender);
        const tdee = calculateTDEE(bmr, trainingDays);
        const weightClass = getWeightClass(bmi);

        setHealthMetrics({ bmi, bmr, tdee, weightClass });

        // Show modal after a short delay for better UX
        setTimeout(() => {
          setShowHealthModal(true);
        }, 1500);

        // Mark as seen so we don't show again
        await updateDoc(userRef, { hasSeenHealthModal: true });
      } catch (e) {
        console.log('Error checking new user health modal', e);
      }
    };

    checkNewUser();
  }, [loading, userData, userRoutines]);

  // PHASE 2: Lazy load metrics AFTER initial paint
  // This prevents blocking the initial render with heavy calculations
  useEffect(() => {
    if (loading) return; // Wait for initial load to complete

    const loadMetrics = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userMetrics = await WorkoutService.calculateUserMetrics(user.uid);
        setMetrics(userMetrics);
      } catch (e) {
        console.log("Error loading metrics", e);
      }
    };

    // Use requestAnimationFrame to defer until after paint
    const timeoutId = setTimeout(loadMetrics, 100);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Memoized handlers for RoutineCard callbacks
  const handleRoutinePress = useCallback((routine: Routine) => {
    setSelectedRoutineForTraining(routine);
  }, []);

  const handleRoutineEdit = useCallback((routineId: string) => {
    router.push(`../routines/edit/${routineId}` as any);
  }, [router]);

  const handleCreateRoutine = useCallback(() => {
    router.push("../routines/create" as any);
  }, [router]);

  const handleSelectDay = useCallback((dayIndex: number) => {
    if (selectedRoutineForTraining) {
      startWorkout(selectedRoutineForTraining, dayIndex);
      setSelectedRoutineForTraining(null);
      router.push(`../routines/${selectedRoutineForTraining.id}/train?dayIndex=${dayIndex}` as any);
    }
  }, [selectedRoutineForTraining, startWorkout, router]);

  const handleQuickStart = useCallback(() => {
    if (nextWorkout) {
      const routine = userRoutines.find(r => r.id === nextWorkout.routineId);
      if (routine) {
        MensHaptics.heavy();
        setShowFloatingButton(false);
        startWorkout(routine, nextWorkout.dayIndex);
        router.push(`/routines/${nextWorkout.routineId}/train?dayIndex=${nextWorkout.dayIndex}` as any);
      }
    }
  }, [nextWorkout, userRoutines, startWorkout, router]);

  const handleViewHistory = useCallback(() => {
    router.push("/workout-history" as any);
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const displayName =
    userData?.displayName && userData.displayName.trim() !== ""
      ? userData.displayName
      : userData?.email ?? "Atleta";

  // Check if today is a rest day (from WorkoutService)
  const isTodayRestDay = nextWorkout?.isRestDay ?? false;

  return (
    <>
      <View style={styles.container}>
        {/* App Bar */}
        <SectionAppBar title="MENS" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 80 + insets.top, paddingBottom: tabBarInset },
          ]}
        >
          {/* Animated Header */}
          <AnimatedHeader>
            <Text style={styles.greeting}>{t('home.greeting', { name: displayName })}</Text>
          </AnimatedHeader>

          {/* No Routine Reminder Card */}
          {userRoutines.length === 0 && !activeWorkout && (
            <AnimatedSection delay={50} style={styles.heroSection}>
              <TouchableOpacity
                style={styles.noRoutineCard}
                onPress={() => router.push('/routines/create' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.noRoutineIcon}>
                  <Plus size={28} color={COLORS.primary} />
                </View>
                <View style={styles.noRoutineContent}>
                  <Text style={styles.noRoutineTitle}>Creá tu primera rutina</Text>
                  <Text style={styles.noRoutineMessage}>
                    Para empezar a entrenar, necesitás una rutina. ¡Creá la tuya ahora!
                  </Text>
                </View>
              </TouchableOpacity>
            </AnimatedSection>
          )}


          {/* Rest Day Message */}
          {isTodayRestDay && (
            <AnimatedSection delay={50} style={styles.heroSection}>
              <View style={styles.restDayCard}>
                <View style={styles.restDayIcon}>
                  <Moon size={28} color={COLORS.success} />
                </View>
                <View style={styles.restDayContent}>
                  <Text style={styles.restDayTitle}>{t('home.rest_day_title')}</Text>
                  <Text style={styles.restDayMessage}>{t('home.rest_day_message')}</Text>
                </View>
              </View>
            </AnimatedSection>
          )}

          {/* Stats Dashboard */}
          {metrics && (
            <AnimatedSection delay={50} style={styles.statsSection}>
              <View style={styles.statsGrid}>
                {/* Streak Card */}
                <AnimatedCard
                  index={0}
                  delay={100}
                  style={styles.statCardWrapper}
                >
                  <View style={styles.statCard}>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>{t('home.streak')}</Text>
                      <View style={styles.statValueRow}>
                        <Flame size={24} color={COLORS.primary} style={styles.statIcon} />
                        <Text style={styles.statValue}>{metrics.streak}</Text>
                      </View>
                      <Text style={styles.statUnit}>{t('home.days')}</Text>
                    </View>
                  </View>
                </AnimatedCard>

                {/* Volume Card */}
                <AnimatedCard
                  index={1}
                  delay={150}
                  style={styles.statCardWrapper}
                >
                  <View style={styles.statCard}>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>{t('home.volume_7d')}</Text>
                      <View style={styles.statValueRow}>
                        <Dumbbell size={24} color={COLORS.primary} style={styles.statIcon} />
                        <Text style={styles.statValue}>
                          {(metrics.totalVolume7d / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <Text style={styles.statUnit}>{t('home.kg_lifted')}</Text>
                    </View>
                  </View>
                </AnimatedCard>
              </View>
            </AnimatedSection>
          )}

          {/* Recent Workouts Section */}
          <RecentWorkouts onViewAll={handleViewHistory} />

          {/* Community Routines Section */}
          <AnimatedSection delay={300} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.community_routines')}</Text>

            {communityRoutines.length === 0 ? (
              <AnimatedCard index={0} delay={350}>
                <Text style={styles.emptyText}>
                  {t('home.no_community_routines')}
                </Text>
              </AnimatedCard>
            ) : (
              // OPTIMIZATION: FlashList for horizontal scrolling
              <View style={{ height: 180 }}>
                {/* Cast to any to resolve estimatedItemSize type conflict */}
                <AnyFlashList
                  data={communityRoutines}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  estimatedItemSize={280}
                  contentContainerStyle={{ paddingHorizontal: 24 }}
                  renderItem={({ item, index }: { item: Routine | any, index: number }) => {
                    const routine = item as Routine;
                    // Calculate total exercise count
                    const exerciseCount = routine.days.reduce(
                      (total, day) => total + day.exercises.length,
                      0
                    );

                    return (
                      <AnimatedSlideIn key={routine.id} direction="right" index={index} delay={350}>
                        <View style={styles.communityCard}>
                          <RoutineCard
                            name={routine.name}
                            days={routine.daysPerWeek}
                            exerciseCount={exerciseCount}
                            variant="community"
                            onPress={() => console.log("Start:", routine.name)}
                          />
                        </View>
                      </AnimatedSlideIn>
                    );
                  }}
                />
              </View>
            )}

            <AnimatedCard index={0} delay={500}>
              <TouchableOpacity
                style={styles.viewMore}
                onPress={() => console.log("View more community routines")}
              >
                <Text style={styles.viewMoreText}>{t('home.view_more')}</Text>
              </TouchableOpacity>
            </AnimatedCard>
          </AnimatedSection>
        </ScrollView>


        {/* Floating Quick Start Button */}
        {nextWorkout && showFloatingButton && !activeWorkout && !isTodayRestDay && (
          <View
            style={[
              styles.floatingButtonContainer,
              {
                bottom: tabBarInset + 6,
                opacity: isTodayRestDay ? 0.7 : 1,
              },
              isTodayRestDay && {
                shadowColor: COLORS.success,
                backgroundColor: COLORS.success + '30',
              },
            ]}
          >
            {/* Rotating Gradient Layer (Behind) */}
            <Animated.View
              style={[{
                position: 'absolute',
                width: 250,
                height: 250,
                top: -101,
              }, floatingGradientLeftStyle]}
            >
              <Animated.View
                style={[{
                  flex: 1,
                }, floatingBtnRotateStyle]}
              >
                <LinearGradient
                  colors={isTodayRestDay
                    ? [COLORS.success, 'transparent', COLORS.success, 'transparent']
                    : [COLORS.primary, '#2962FF33', COLORS.primary, 'transparent']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </Animated.View>

            {/* Button Content (Static Center) */}
            <View
              style={[
                styles.floatingButtonInner,
                {
                  backgroundColor: isTodayRestDay ? COLORS.success + '20' : COLORS.surface,
                  flex: 0,
                  width: 'auto'
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.floatingButton,
                  { flex: 0, width: 'auto' }
                ]}
                onPress={isTodayRestDay ? undefined : handleQuickStart}
                activeOpacity={isTodayRestDay ? 1 : 0.8}
                disabled={isTodayRestDay}
              >
                <Animated.View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {isTodayRestDay ? (
                    <Moon size={18} color={COLORS.success} />
                  ) : (
                    <Play size={18} color={COLORS.textPrimary} fill={COLORS.textPrimary} />
                  )}
                  <View>
                    <Text
                      style={[
                        styles.floatingButtonText,
                        isTodayRestDay && { color: COLORS.success }
                      ]}
                      numberOfLines={1}
                    >
                      {isTodayRestDay ? t('home.rest_button') : t('home.start_today')}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upper Floating Button - Empty Workout */}
        {showFloatingButton && !activeWorkout && (
          <View
            style={[
              styles.floatingButtonContainerRight,
              {
                bottom: (isTodayRestDay || !nextWorkout) ? tabBarInset + 6 : tabBarInset + 6 + 48 + 12,
              },
            ]}
          >
            {/* Rotating Border Glow */}
            <Animated.View
              style={[{
                position: 'absolute',
                width: 200,
                height: 200,
                top: -76,
              }, emptyWorkoutGlowStyle]}
            >
              <Animated.View
                style={[{
                  flex: 1,
                }, floatingBtnRotateStyle]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </Animated.View>

            {/* Button Content */}
            <View
              style={[
                styles.floatingButtonInnerOutline,
                {
                  backgroundColor: COLORS.surface,
                  flex: 0,
                  width: 'auto'
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.floatingButton,
                  { flex: 0, width: 'auto' }
                ]}
                onPress={() => console.log('Empty workout')}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Plus size={18} color={COLORS.textPrimary} strokeWidth={2.5} />
                  <View>
                    <Text style={styles.floatingButtonText} numberOfLines={1}>
                      {t('home.empty_workout')}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <DaySelectorSheet
          visible={!!selectedRoutineForTraining}
          routine={selectedRoutineForTraining}
          onClose={() => setSelectedRoutineForTraining(null)}
          onSelectDay={handleSelectDay}
        />

        {/* Health Metrics Modal for New Users */}
        <CalorieResultsModal
          visible={showHealthModal}
          onClose={() => setShowHealthModal(false)}
          metrics={healthMetrics}
        />
      </View>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  greeting: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 48,
  },
  heroSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addNewText: {
    ...TYPOGRAPHY.button,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  newRoutineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  newRoutineText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 24,
  },
  communityCard: {
    width: 280,
  },
  viewMore: {
    marginTop: 12,
    alignItems: "center",
  },
  viewMoreText: {
    ...TYPOGRAPHY.button,
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCardWrapper: {
    flex: 1,
    height: STAT_CARD_HEIGHT,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  statIcon: {
    marginTop: 2,
  },
  statUnit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  floatingButtonContainer: {
    position: "absolute",
    right: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "row",
    overflow: "hidden", // Important for expansion
  },
  floatingButtonContainerRight: {
    position: "absolute",
    right: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    // Overflow not hidden here so glow can show? No, glow is inside.
    overflow: "hidden",
  },
  floatingButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // added
  },
  floatingButtonInnerOutline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
  },
  floatingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: '100%', // ensure touch target
    width: '100%',
  },
  floatingButtonText: {
    ...TYPOGRAPHY.button,
    color: "#fff",
    marginLeft: 8,
    fontSize: 15,
  },
  activeTimerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  restDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  restDayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  restDayContent: {
    flex: 1,
  },
  restDayTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  restDayMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  noRoutineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  noRoutineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  noRoutineContent: {
    flex: 1,
  },
  noRoutineTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  noRoutineMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});