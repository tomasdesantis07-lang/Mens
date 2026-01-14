import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { memo, useMemo, useState } from "react";
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
import { AnimatedCard, AnimatedSection } from "../../src/components/common/Animations";
import { ConsistencyHeatmap } from "../../src/components/stats/ConsistencyHeatmap";
import { MuscleBreakdown } from "../../src/components/stats/MuscleBreakdown";
import { RankingCard } from "../../src/components/stats/RankingCard";
import { useTabBarInset } from "../../src/hooks/useTabBarInset";
import { useUserAnalytics } from "../../src/hooks/useUserAnalytics";
import { auth } from "../../src/services/firebaseConfig";
import { MuscleDistribution, StatsService, UserRank, VolumeDataPoint } from "../../src/services/statsService";
import { WorkoutService } from "../../src/services/workoutService";
import { COLORS, FONT_FAMILY } from "../../src/theme/theme";

const StatsScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const userId = auth.currentUser?.uid;

  // Real-time analytics from Firestore (instant load)
  const { analytics, loading: analyticsLoading } = useUserAnalytics();

  // Additional stats that still need to be calculated (for consistency heatmap, etc.)
  const [consistency, setConsistency] = useState<Map<string, number>>(new Map());
  const [muscleDistribution, setMuscleDistribution] = useState<MuscleDistribution[]>([]);
  const [volumeProgression, setVolumeProgression] = useState<VolumeDataPoint[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  // Fetch additional stats using React Query for 0ms cache hits
  const results = useQueries({
    queries: [
      {
        queryKey: ["stats", "workout", userId],
        queryFn: () => WorkoutService.getUserStats(userId!),
        enabled: !!userId,
      },
      {
        queryKey: ["stats", "muscles", userId],
        queryFn: () => StatsService.getMuscleDistribution(userId!),
        enabled: !!userId,
      },
      {
        queryKey: ["stats", "volume", userId],
        queryFn: () => StatsService.getVolumeProgression(userId!, 8),
        enabled: !!userId,
      },
      {
        queryKey: ["stats", "rank", userId],
        queryFn: () => StatsService.getUserRank(userId!),
        enabled: !!userId,
      },
      {
        queryKey: ["history", userId],
        queryFn: () => WorkoutService.getAllUserWorkoutSessions(userId!),
        enabled: !!userId,
      },
    ],
  });

  const [
    { data: workoutStats, isLoading: statsLoading },
    { data: muscles = [] },
    { data: volume = [] },
    { data: rank = null },
    { data: history = [] },
  ] = results;

  // Derived state from cached history
  useMemo(() => {
    if (!history || !workoutStats) return;

    // Convert consistency timestamps to Map
    const consistencyMap = new Map<string, number>();
    workoutStats.consistency.forEach((timestamp) => {
      const date = new Date(timestamp).toISOString().split("T")[0];
      consistencyMap.set(date, (consistencyMap.get(date) || 0) + 1);
    });
    setConsistency(consistencyMap);
    setWorkoutHistory(history);
  }, [history, workoutStats]);

  // Memoized heatmap calculation
  const heatmapData = useMemo(() => {
    return StatsService.calculateHeatmapData(history);
  }, [history]);


  // Show loading only if no cache exists for crucial data
  const isLoading = analyticsLoading && (statsLoading || !workoutStats);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: 80 + insets.top }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t("stats.loading")}</Text>
        </View>
      </View>
    );
  }

  // Check if user has any data (from analytics or calculated stats)
  const hasData = analytics !== null || consistency.size > 0 || muscles.length > 0;

  if (!hasData) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 80 + insets.top, paddingBottom: tabBarInset }]}
          showsVerticalScrollIndicator={false}
        >
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

  // Format total volume for display
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toFixed(0);
  };

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 80 + insets.top, paddingBottom: tabBarInset }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header subtitle */}
        {/* Header subtitle */}

        {/* Quick Stats from Analytics (Instant Load) */}
        {analytics && (
          <AnimatedSection delay={50} style={styles.section}>
            <View style={styles.quickStatsRow}>
              {/* Total Volume Card */}
              <AnimatedCard style={styles.quickStatCard}>
                <Text style={styles.quickStatLabel}>{t("stats.total_volume")}</Text>
                <Text style={styles.quickStatValue}>
                  {formatVolume(analytics.totalVolume)}
                </Text>
                <Text style={styles.quickStatUnit}>kg</Text>
              </AnimatedCard>

              {/* Consistency Score Card */}
              <AnimatedCard style={styles.quickStatCard}>
                <Text style={styles.quickStatLabel}>{t("stats.consistency")}</Text>
                <Text style={[styles.quickStatValue, { color: COLORS.success }]}>
                  {analytics.consistencyScore}
                </Text>
                <Text style={styles.quickStatUnit}>%</Text>
              </AnimatedCard>

              {/* Personal Records Count */}
              <AnimatedCard style={styles.quickStatCard}>
                <Text style={styles.quickStatLabel}>{t("stats.records")}</Text>
                <Text style={[styles.quickStatValue, { color: COLORS.warning }]}>
                  {analytics.personalRecords?.length || 0}
                </Text>
                <Text style={styles.quickStatUnit}>PRs</Text>
              </AnimatedCard>
            </View>
          </AnimatedSection>
        )}

        {/* Section 1: Consistency & Body Heatmap (unified card) */}
        <AnimatedSection delay={100} style={styles.section}>
          <ConsistencyHeatmap data={consistency} muscleData={heatmapData} />
        </AnimatedSection>

        {muscles.length > 0 && (
          <AnimatedSection delay={250} style={styles.section}>
            <MuscleBreakdown data={muscles} />
          </AnimatedSection>
        )}

        {/* Section 3: Progress - Volume Chart */}
        {volume.length > 0 && (
          <AnimatedSection delay={300} style={styles.section}>
            <AnimatedCard style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t("stats.volume_progression_title")}</Text>
              <LineChart
                data={volume.map(point => ({
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
            {rank && (
              <View style={styles.statusItem}>
                <RankingCard rank={rank} />
              </View>
            )}

            {/* Top 3 Personal Records */}
            {analytics?.personalRecords && analytics.personalRecords.length > 0 && (
              <View style={styles.statusItem}>
                <AnimatedCard style={styles.prCard}>
                  <Text style={styles.prCardTitle}>{t("stats.top_prs")}</Text>
                  {analytics.personalRecords.slice(0, 3).map((pr, index) => (
                    <View key={index} style={styles.prRow}>
                      <Text style={styles.prName} numberOfLines={1}>
                        {pr.exerciseName}
                      </Text>
                      <Text style={styles.prValue}>
                        {pr.weight}kg × {pr.reps}
                      </Text>
                    </View>
                  ))}
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
    fontFamily: FONT_FAMILY.bold,
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
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textInverse,
  },
  // Quick Stats (from analytics)
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: "center",
  },
  quickStatLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.heavy,
    color: COLORS.primary,
  },
  quickStatUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    fontFamily: FONT_FAMILY.bold,
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
  // PR Card
  prCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  prCardTitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  prName: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  prValue: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.warning,
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
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 36,
    fontFamily: FONT_FAMILY.heavy,
    color: COLORS.primary,
  },
  streakUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default memo(StatsScreen);