import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnimatedCard,
  AnimatedHeader,
  AnimatedPopIn,
  AnimatedSection,
} from '../../src/components/common/Animations';
import { ConsistencyHeatmap } from '../../src/components/stats/ConsistencyHeatmap';
import { ProgressChart } from '../../src/components/stats/ProgressChart';
import { StatCard } from '../../src/components/stats/StatCard';
import { useTabBarInset } from '../../src/hooks/useTabBarInset';
import { auth } from '../../src/services/firebaseConfig';
import { WorkoutService } from '../../src/services/workoutService';
import { COLORS } from '../../src/theme/theme';
import { WorkoutSession } from '../../src/types/workout';
import {
  calculateConsistency,
  calculateCurrentStreak,
  calculateEstimated1RM,
  calculateVolume,
} from '../../src/utils/statsUtils';

const StatsScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const allSessions = await WorkoutService.getAllUserWorkoutSessions(userId);
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const volumeData = calculateVolume(sessions);
  const consistencyData = calculateConsistency(sessions);
  const progressData = calculateEstimated1RM(sessions);
  const streak = calculateCurrentStreak(sessions);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('stats.loading')}</Text>
      </View>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <AnimatedHeader>
          <Text style={styles.title}>{t('stats.title')}</Text>
        </AnimatedHeader>
        <AnimatedPopIn delay={100}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('stats.empty_title')}</Text>
            <Text style={styles.emptyText}>
              {t('stats.empty_text')}
            </Text>
            <Text style={styles.emptyHint}>
              {t('stats.empty_hint')}
            </Text>
          </View>
        </AnimatedPopIn>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: tabBarInset }]}
    >
      {/* Header */}
      <AnimatedHeader>
        <Text style={styles.title}>{t('stats.title')}</Text>
        <Text style={styles.subtitle}>
          {t('stats.subtitle')}
        </Text>
      </AnimatedHeader>

      {/* Section 1: Volume & Streak */}
      <View style={styles.section}>
        <AnimatedSection delay={100}>
          <Text style={styles.sectionTitle}>{t('stats.key_metrics')}</Text>
        </AnimatedSection>
        <View style={styles.statsRow}>
          <AnimatedPopIn index={0} delay={150} style={{ flex: 1 }}>
            <StatCard
              label={t('stats.weekly_volume')}
              value={volumeData.current.toLocaleString('es-AR')}
              unit="kg"
              trend={volumeData.percentageChange}
            />
          </AnimatedPopIn>
          <AnimatedPopIn index={1} delay={150} style={{ flex: 1 }}>
            <StatCard
              label={t('stats.current_streak')}
              value={streak}
              unit={streak === 1 ? t('stats.week') : t('stats.weeks')}
            />
          </AnimatedPopIn>
        </View>
      </View>

      {/* Section 2: Consistency Heatmap */}
      <View style={styles.section}>
        <AnimatedCard delay={300}>
          <ConsistencyHeatmap data={consistencyData} />
        </AnimatedCard>
      </View>

      {/* Section 3: Strength Progression */}
      <View style={styles.section}>
        <AnimatedCard delay={400}>
          <ProgressChart
            exerciseName={progressData.exerciseName}
            dataPoints={progressData.dataPoints}
          />
        </AnimatedCard>
      </View>

      {/* Footer note */}
      <AnimatedSection delay={500}>
        <Text style={styles.footerNote}>
          {t('stats.footer_note')}
        </Text>
      </AnimatedSection>
    </ScrollView>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 40,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerNote: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});