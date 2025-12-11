import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Dumbbell, Flame, Play, TrendingUp } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  weeklyImprovementPercent: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const PADDING_H = 24;
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING_H * 2) - CARD_GAP) / 2;

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

  const { startWorkout } = useWorkout();

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
                style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
              >
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Flame size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statLabel}>{t('home.streak')}</Text>
                  <Text style={styles.statValue}>{metrics.streak}</Text>
                  <Text style={styles.statUnit}>{t('home.days')}</Text>
                </View>
              </AnimatedCard>

              {/* Dynamic Card: Show Improvement % if positive, otherwise Total Volume */}
              <AnimatedCard
                index={1}
                delay={150}
                style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
              >
                <View style={styles.statCard}>
                  {metrics.weeklyImprovementPercent > 0 ? (
                    <>
                      <View style={styles.statIconContainer}>
                        <TrendingUp size={22} color={COLORS.success} />
                      </View>
                      <Text style={styles.statLabel}>{t('home.weekly_improvement')}</Text>
                      <Text style={[styles.statValue, styles.statValueSuccess]}>
                        +{metrics.weeklyImprovementPercent}%
                      </Text>
                      <Text style={styles.statUnit}>{t('home.vs_last_week')}</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.statIconContainer}>
                        <Dumbbell size={22} color={COLORS.primary} />
                      </View>
                      <Text style={styles.statLabel}>{t('home.volume_30d')}</Text>
                      <Text style={styles.statValue}>
                        {(metrics.totalVolume30d / 1000).toFixed(1)}k
                      </Text>
                      <Text style={styles.statUnit}>{t('home.kg_lifted')}</Text>
                    </>
                  )}
                </View>
              </AnimatedCard>
            </View>

            {/* Quick Start Button */}
            {nextWorkout && (
              <AnimatedCard index={2} delay={200}>
                <TouchableOpacity
                  style={styles.quickStartButton}
                  onPress={handleQuickStart}
                >
                  <Play size={20} color={COLORS.primary} style={styles.quickStartIcon} />
                  <View style={styles.quickStartTextContainer}>
                    <Text style={styles.quickStartText}>{t('home.quick_start_button')}</Text>
                    <Text style={styles.quickStartSubtext}>
                      {userRoutines.find(r => r.id === nextWorkout.routineId)?.name} • {t('train.day_label', { number: nextWorkout.dayIndex + 1 })}
                    </Text>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>
            )}
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
            userRoutines.map((routine, index) => (
              <AnimatedCard key={routine.id} index={index} delay={150}>
                <RoutineCard
                  name={routine.name}
                  days={routine.daysPerWeek}
                  volume={0}
                  variant="user"
                  onPress={() => setSelectedRoutineForTraining(routine)}
                  onEdit={() => router.push(`../routines/edit/${routine.id}` as any)}
                />
              </AnimatedCard>
            ))
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
              {communityRoutines.map((routine, index) => (
                <AnimatedSlideIn key={routine.id} direction="right" index={index} delay={350}>
                  <View style={styles.communityCard}>
                    <RoutineCard
                      name={routine.name}
                      days={routine.daysPerWeek}
                      volume={0}
                      variant="community"
                      onPress={() => console.log("Start:", routine.name)}
                    />
                  </View>
                </AnimatedSlideIn>
              ))}
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
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statValueSuccess: {
    color: COLORS.success,
  },
  statUnit: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  quickStartButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  quickStartIcon: {
    marginRight: 12,
  },
  quickStartTextContainer: {
    flex: 1,
  },
  quickStartText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  quickStartSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});