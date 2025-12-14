import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedCard, AnimatedHeader, AnimatedSection } from "../../src/components/common/Animations";
import { ConsistencyHeatmap } from "../../src/components/stats/ConsistencyHeatmap";
import { MuscleBreakdown } from "../../src/components/stats/MuscleBreakdown";
import { RankingCard } from "../../src/components/stats/RankingCard";
import { useTabBarInset } from "../../src/hooks/useTabBarInset";
import { auth } from "../../src/services/firebaseConfig";
import { MuscleDistribution, StatsService, UserRank, VolumeDataPoint } from "../../src/services/statsService";
import { WorkoutService } from "../../src/services/workoutService";
import { COLORS } from "../../src/theme/theme";

const StatsScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const [loading, setLoading] = useState(true);
  const [consistency, setConsistency] = useState<Map<string, number>>(new Map());
  const [muscleDistribution, setMuscleDistribution] = useState<MuscleDistribution[]>([]);
  const [volumeProgression, setVolumeProgression] = useState<VolumeDataPoint[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [maxStreak, setMaxStreak] = useState(0);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  // Memoized calculation: only recalculates when workoutHistory changes
  const heatmapData = useMemo(() => {
    return StatsService.calculateHeatmapData(workoutHistory);
  }, [workoutHistory]);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Load all stats in parallel
      const [workoutStats, muscles, volume, rank, history] = await Promise.all([
        WorkoutService.getUserStats(userId),
        StatsService.getMuscleDistribution(userId),
        StatsService.getVolumeProgression(userId, 8),
        StatsService.getUserRank(userId),
        WorkoutService.getAllUserWorkoutSessions(userId),
      ])

      // Store history for memoized heatmap calculation
      setWorkoutHistory(history);

      // Convert consistency timestamps to Map
      const consistencyMap = new Map<string, number>();
      workoutStats.consistency.forEach((timestamp) => {
        const date = new Date(timestamp).toISOString().split("T")[0];
        consistencyMap.set(date, (consistencyMap.get(date) || 0) + 1);
      });

      setConsistency(consistencyMap);
      setMuscleDistribution(muscles);
      setVolumeProgression(volume);
      setUserRank(rank);
      setMaxStreak(workoutStats.maxStreak);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t("stats.loading")}</Text>
        </View>
      </View>
    );
  }

  const hasData = consistency.size > 0 || muscleDistribution.length > 0;

  if (!hasData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarInset }]}
          showsVerticalScrollIndicator={false}
        >
          <AnimatedHeader style={styles.header}>
            <Text style={styles.headerTitle}>{t("stats.analytics_title")}</Text>
          </AnimatedHeader>

          <AnimatedSection delay={100} style={styles.emptySection}>
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyTitle}>{t("stats.no_analytics_yet")}</Text>
              <Text style={styles.emptySubtitle}>{t("stats.empty_text")}</Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push("/(tabs)/home")}
              >
                <Text style={styles.ctaButtonText}>{t("stats.train_today_cta")}</Text>
              </TouchableOpacity>
            </View>
          </AnimatedSection>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarInset }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedHeader style={styles.header}>
          <Text style={styles.headerTitle}>{t("stats.analytics_title")}</Text>
          <Text style={styles.headerSubtitle}>{t("stats.performance_subtitle")}</Text>
        </AnimatedHeader>

        {/* Section 1: Consistency & Body Heatmap (unified card) */}
        <AnimatedSection delay={100} style={styles.section}>
          <ConsistencyHeatmap data={consistency} muscleData={heatmapData} />
        </AnimatedSection>

        {muscleDistribution.length > 0 && (
          <AnimatedSection delay={250} style={styles.section}>
            <MuscleBreakdown data={muscleDistribution} />
          </AnimatedSection>
        )}

        {/* Section 3: Progress - Volume Chart */}
        {volumeProgression.length > 0 && (
          <AnimatedSection delay={300} style={styles.section}>
            <AnimatedCard style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t("stats.volume_progression_title")}</Text>
              <LineChart
                data={volumeProgression.map(point => ({
                  value: point.value,
                  label: point.label,
                }))}
                width={300}
                height={180}
                color={COLORS.primary}
                thickness={3}
                startFillColor={COLORS.primary + "40"}
                endFillColor={COLORS.primary + "10"}
                startOpacity={0.9}
                endOpacity={0.2}
                initialSpacing={20}
                spacing={35}
                noOfSections={4}
                yAxisColor={COLORS.border}
                xAxisColor={COLORS.border}
                yAxisTextStyle={styles.chartAxisText}
                xAxisLabelTextStyle={styles.chartAxisText}
                hideDataPoints={false}
                dataPointsColor={COLORS.primary}
                dataPointsRadius={4}
                curved
                areaChart
              />
            </AnimatedCard>
          </AnimatedSection>
        )}

        {/* Section 4: Status - Ranking & Best Streak */}
        <AnimatedSection delay={400} style={styles.section}>
          <View style={styles.statusRow}>
            {userRank && (
              <View style={styles.statusItem}>
                <RankingCard rank={userRank} />
              </View>
            )}

            {maxStreak > 0 && (
              <View style={styles.statusItem}>
                <AnimatedCard style={styles.streakCard}>
                  <Text style={styles.streakLabel}>{t("stats.best_streak")}</Text>
                  <Text style={styles.streakValue}>{maxStreak}</Text>
                  <Text style={styles.streakUnit}>{t("stats.days")}</Text>
                </AnimatedCard>
              </View>
            )}
          </View>
        </AnimatedSection>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  emptySection: {
    marginTop: 40,
  },
  emptyStateContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textInverse,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  chartAxisText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusItem: {
    flex: 1,
  },
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
  },
  streakUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default StatsScreen;