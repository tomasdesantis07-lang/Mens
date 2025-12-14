import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Dumbbell, Flame, Play } from "lucide-react-native";
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
import { DaySelectorSheet } from "../../src/components/specific/DaySelectorSheet";
import { RoutineCard } from "../../src/components/specific/RoutineCard";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTabBarInset } from "../../src/hooks/useTabBarInset";
import { auth, db } from "../../src/services/firebaseConfig";
import { RoutineService } from "../../src/services/routineService";
import { WorkoutService } from "../../src/services/workoutService";
import { COLORS } from "../../src/theme/theme";
import { Routine } from "../../src/types/routine";

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
  totalVolume30d: number;
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
  const [nextWorkout, setNextWorkout] = useState<{ routineId: string; dayIndex: number } | null>(null);


  // Floating button animation
  const buttonWidth = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed
  const [isButtonExpanded, setIsButtonExpanded] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  const { startWorkout, activeWorkout } = useWorkout();

  // Rotating border glow animation
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, [rotateAnimation]);

  // Reset button animation when screen is focused
  useFocusEffect(
    useCallback(() => {
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
    }, [buttonWidth])
  );

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
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

        // Load metrics and next workout
        const userMetrics = await WorkoutService.calculateUserMetrics(user.uid);
        setMetrics(userMetrics);

        const workout = await WorkoutService.getWorkoutForToday(user.uid);
        setNextWorkout(workout);
      } catch (e) {
        console.log("Error loading data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleCreateRoutine = () => {
    router.push("../routines/create" as any);
  };

  const handleSelectDay = (dayIndex: number) => {
    if (selectedRoutineForTraining) {
      startWorkout(selectedRoutineForTraining, dayIndex);
      setSelectedRoutineForTraining(null);
      router.push(`../routines/${selectedRoutineForTraining.id}/train?dayIndex=${dayIndex}` as any);
    }
  };

  const handleQuickStart = () => {
    if (nextWorkout) {
      const routine = userRoutines.find(r => r.id === nextWorkout.routineId);
      if (routine) {
        setShowFloatingButton(false); // Hide button when starting workout
        startWorkout(routine, nextWorkout.dayIndex);
        router.push(`../routines/${nextWorkout.routineId}/train?dayIndex=${nextWorkout.dayIndex}` as any);
      }
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: tabBarInset },
        ]}
      >
        {/* Animated Header */}
        <AnimatedHeader>
          <Text style={styles.greeting}>{t('home.greeting', { name: displayName })}</Text>
        </AnimatedHeader>

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
                    <Text style={styles.statLabel}>{t('home.volume_30d')}</Text>
                    <View style={styles.statValueRow}>
                      <Dumbbell size={24} color={COLORS.primary} style={styles.statIcon} />
                      <Text style={styles.statValue}>
                        {(metrics.totalVolume30d / 1000).toFixed(1)}k
                      </Text>
                    </View>
                    <Text style={styles.statUnit}>{t('home.kg_lifted')}</Text>
                  </View>
                </View>
              </AnimatedCard>
            </View>
          </AnimatedSection>
        )}

        {/* My Routines Section */}
        <AnimatedSection delay={100} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.my_routines')}</Text>

          {userRoutines.length === 0 ? (
            <AnimatedCard index={0} delay={150}>
              <Text style={styles.emptyText}>
                {t('home.no_routines')}
              </Text>
            </AnimatedCard>
          ) : (
            userRoutines.map((routine, index) => {
              // Calculate total exercise count
              const exerciseCount = routine.days.reduce(
                (total, day) => total + day.exercises.length,
                0
              );

              return (
                <AnimatedCard key={routine.id} index={index} delay={150}>
                  <RoutineCard
                    name={routine.name}
                    days={routine.daysPerWeek}
                    exerciseCount={exerciseCount}
                    isCurrentPlan={routine.isCurrentPlan}
                    variant="user"
                    onPress={() => setSelectedRoutineForTraining(routine)}
                    onEdit={() => router.push(`../routines/edit/${routine.id}` as any)}
                  />
                </AnimatedCard>
              );
            })
          )}

          <AnimatedCard index={userRoutines.length} delay={150}>
            <TouchableOpacity
              style={styles.newRoutineCard}
              onPress={handleCreateRoutine}
            >
              <Text style={styles.newRoutineText}>{t('home.new_routine')}</Text>
            </TouchableOpacity>
          </AnimatedCard>
        </AnimatedSection>

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
      {nextWorkout && showFloatingButton && !activeWorkout && (
        <Animated.View
          style={[
            styles.floatingButtonContainer,
            {
              bottom: tabBarInset + 6,
              width: buttonWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [48, 200], // collapsed: 48px, expanded: 200px
              }),
            },
          ]}
        >
          {/* Rotating Gradient Layer (Behind) */}
          <Animated.View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 500, // Large enough to cover the button when rotating
              height: 500,
              marginLeft: -250, // Center it
              marginTop: -250,
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
              colors={[COLORS.primary, '#2962FF33', COLORS.primary, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Button Content (Static Center) */}
          <Animated.View
            style={[
              styles.floatingButtonInner,
              {
                backgroundColor: buttonWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(11, 14, 20, 0.1)', COLORS.surface], // Transparent when collapsed
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleQuickStart}
              activeOpacity={0.8}
            >
              <Animated.View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: buttonWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 6],
                  }),
                }}
              >
                <Play size={18} color={COLORS.textPrimary} fill={COLORS.textPrimary} />
                <Animated.View
                  style={{
                    opacity: buttonWidth,
                    overflow: "hidden",
                    width: buttonWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 160],
                    }),
                  }}
                >
                  <Text style={styles.floatingButtonText} numberOfLines={1}>
                    Start Today Workout
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
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
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
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 36,
  },
  statUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    alignSelf: "center",
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
  floatingButtonInner: {
    flex: 1,
    borderRadius: 22, // Slightly smaller radius
    margin: 2, // Create the 2px border space
    justifyContent: 'center',
  },
  floatingButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
});