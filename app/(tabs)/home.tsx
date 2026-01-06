import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Dumbbell, Flame, Moon, Play, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
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
import { useTabBarInset } from "../../src/hooks/useTabBarInset";
import { auth, db } from "../../src/services/firebaseConfig";
import { RoutineService } from "../../src/services/routineService";
import { WorkoutService } from "../../src/services/workoutService";
import { COLORS, FONT_SIZE, TYPOGRAPHY } from "../../src/theme/theme";
import { Routine } from "../../src/types/routine";
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

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [communityRoutines, setCommunityRoutines] = useState<Routine[]>([]);
  const [selectedRoutineForTraining, setSelectedRoutineForTraining] = useState<Routine | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [nextWorkout, setNextWorkout] = useState<{ routineId: string; dayIndex: number; isRestDay: boolean } | null>(null);

  // New: Health metrics modal state
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);


  // Floating button animation
  const buttonWidth = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed
  const [isButtonExpanded, setIsButtonExpanded] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  const { startWorkout, activeWorkout } = useWorkout();

  // Rotating border glow animation - OPTIMIZED: Use transform rotation
  // Note: useNativeDriver: true only works with transform/opacity on RN
  // The interpolated width/left values cannot use native driver
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, [rotateAnimation]);

  // Reset button animation when screen is focused
  const loadData = useCallback(async (isInitial = false) => {
    const user = auth.currentUser;
    if (!user) {
      if (isInitial) setLoading(false);
      return;
    }

    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUserData(snap.data() as UserData);
      }

      const routines = await RoutineService.getUserRoutines(user.uid);
      setUserRoutines(routines);

      const community = await RoutineService.getCommunityRoutines();
      setCommunityRoutines(community);

      // Load next workout (lightweight query)
      const workout = await WorkoutService.getWorkoutForToday(user.uid);
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
      // Refresh data to catch any changes from routine editor
      loadData();

      setIsButtonExpanded(true);
      setShowFloatingButton(true);
      buttonWidth.setValue(1);

      // Collapse after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(buttonWidth, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setIsButtonExpanded(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }, [buttonWidth, loadData])
  );

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

  // Memoized handlers for RoutineCard callbacks (performance optimization)
  // MUST be declared before any conditional returns to follow Rules of Hooks
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
        setShowFloatingButton(false);
        startWorkout(routine, nextWorkout.dayIndex);
        router.push(`../routines/${nextWorkout.routineId}/train?dayIndex=${nextWorkout.dayIndex}` as any);
      }
    }
  }, [nextWorkout, userRoutines, startWorkout, router]);

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
          {userRoutines.length === 0 && (
            <AnimatedSection delay={50} style={styles.section}>
              <TouchableOpacity
                style={styles.noRoutineCard}
                onPress={() => router.push('/routines/create' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.noRoutineIcon}>
                  <Dumbbell size={28} color={COLORS.primary} />
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
            <AnimatedSection delay={50} style={styles.section}>
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
          <RecentWorkouts onViewAll={() => router.push("/workout-history" as any)} />

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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {communityRoutines.map((routine, index) => {
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
                })}
              </ScrollView>
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
          <Animated.View
            style={[
              styles.floatingButtonContainer,
              {
                bottom: tabBarInset + 6,
                width: buttonWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: [48, isTodayRestDay ? 140 : 230],
                }),
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
              style={{
                position: 'absolute',
                width: 250,
                height: 250,
                top: -101,
                left: buttonWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-101, -10],
                }),
                transform: [
                  {
                    rotate: rotateAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
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

            {/* Button Content (Static Center) */}
            <View
              style={[
                styles.floatingButtonInner,
                { backgroundColor: isTodayRestDay ? COLORS.success + '20' : COLORS.surface },
              ]}
            >
              <TouchableOpacity
                style={styles.floatingButton}
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
                  <Animated.View
                    style={{
                      opacity: buttonWidth,
                      overflow: "hidden",
                      width: buttonWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, isTodayRestDay ? 80 : 185],
                      }),
                    }}
                  >
                    <Text
                      style={[
                        styles.floatingButtonText,
                        isTodayRestDay && { color: COLORS.success }
                      ]}
                      numberOfLines={1}
                    >
                      {isTodayRestDay ? t('home.rest_button') : t('home.start_today')}
                    </Text>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Upper Floating Button - Empty Workout */}
        {showFloatingButton && !activeWorkout && (
          <Animated.View
            style={[
              styles.floatingButtonContainerRight,
              {
                bottom: isTodayRestDay ? tabBarInset + 6 : tabBarInset + 6 + 48 + 12, // Move down on rest days
                width: buttonWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: [48, 120],
                }),
              },
            ]}
          >
            {/* Rotating Border Glow */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                top: -76,
                left: buttonWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-76, -10],
                }),
                transform: [
                  {
                    rotate: rotateAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            </Animated.View>

            {/* Button Content */}
            <Animated.View
              style={[
                styles.floatingButtonInnerOutline,
                {
                  backgroundColor: COLORS.surface, // Solid background to hide glow
                },
              ]}
            >
              <TouchableOpacity
                style={styles.floatingButton}
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
                  <Animated.View
                    style={{
                      opacity: buttonWidth,
                      overflow: "hidden",
                      width: buttonWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 55],
                      }),
                    }}
                  >
                    <Text style={styles.floatingButtonText} numberOfLines={1}>
                      {t('home.empty_workout')}
                    </Text>
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
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
    marginBottom: 8,
    textAlign: "center",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  statIcon: {
    marginRight: 2,
  },
  statValue: {
    ...TYPOGRAPHY.numberBig,
    fontSize: FONT_SIZE.xxxl,
    color: COLORS.textPrimary,
    lineHeight: 36,
  },
  statUnit: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    alignSelf: "flex-start",
    marginLeft: 24,
    height: 48,
    borderRadius: 24,
    overflow: "hidden", // Mask the rotating gradient
    backgroundColor: COLORS.surface, // Fallback background
    elevation: 12, // Higher elevation
    shadowColor: COLORS.primary, // Blue glow shadow
    shadowOffset: { width: 0, height: 0 }, // Centered glow
    shadowOpacity: 0.6, // Stronger glow
    shadowRadius: 16, // Wider spread
  },
  floatingButtonContainerRight: {
    position: "absolute",
    alignSelf: "flex-start",
    marginLeft: 24,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  floatingButtonInner: {
    flex: 1,
    borderRadius: 22, // Slightly smaller radius
    margin: 2, // Create the 2px border space
    justifyContent: 'center',
  },
  floatingButtonInnerOutline: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
  },
  floatingButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  floatingButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  restDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    gap: 16,
  },
  restDayIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayContent: {
    flex: 1,
    gap: 4,
  },
  restDayTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.success,
  },
  restDayMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  noRoutineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    gap: 16,
  },
  noRoutineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRoutineContent: {
    flex: 1,
    gap: 4,
  },
  noRoutineTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  noRoutineMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

});