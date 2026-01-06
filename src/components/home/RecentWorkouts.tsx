import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutAnimation,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../../services/firebaseConfig';
import { WorkoutService } from '../../services/workoutService';
import { COLORS, FONT_SIZE, TYPOGRAPHY } from '../../theme/theme';
import { WorkoutSession } from '../../types/workout';
import { AnimatedCard } from '../common/Animations';

interface RecentWorkoutsProps {
    onViewAll?: () => void;
}

const VISIBLE_COUNT = 2;

const RecentWorkoutsComponent: React.FC<RecentWorkoutsProps> = ({ onViewAll }) => {
    const { t } = useTranslation();
    const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadWorkouts = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Use optimized query with limit instead of fetching all sessions
            const sessions = await WorkoutService.getRecentSessions(user.uid, 5);
            setWorkouts(sessions);
        } catch (error) {
            console.error('Error loading recent workouts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWorkouts();
    }, [loadWorkouts]);

    const formatRelativeDate = (timestamp: any): string => {
        const date = timestamp.toDate();
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('recent_workouts.today') || 'Hoy';
        if (diffDays === 1) return t('recent_workouts.yesterday') || 'Ayer';
        if (diffDays < 7) return `${diffDays} ${t('recent_workouts.days_ago') || 'días'}`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const calculateTotalVolume = (workout: WorkoutSession): number => {
        let totalVolume = 0;
        workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                totalVolume += set.weight * set.reps;
            });
        });
        return Math.round(totalVolume);
    };

    const getDurationMinutes = (workout: WorkoutSession): number => {
        // Use real duration if available
        if (workout.durationSeconds && workout.durationSeconds > 0) {
            return Math.round(workout.durationSeconds / 60);
        }
        // Fallback estimate for old sessions without durationSeconds
        let totalSets = 0;
        workout.exercises.forEach(exercise => {
            totalSets += exercise.sets.length;
        });
        return Math.max(15, totalSets * 2);
    };

    const formatDuration = (minutes: number): string => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const handleToggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    if (loading) {
        return null; // Or a skeleton
    }

    if (workouts.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>{t('recent_workouts.title') || 'Entrenamientos Recientes'}</Text>
                <AnimatedCard delay={100}>
                    <View style={styles.emptyCard}>
                        <Dumbbell size={32} color={COLORS.textTertiary} />
                        <Text style={styles.emptyText}>
                            {t('recent_workouts.empty') || 'No hay entrenamientos registrados aún'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {t('recent_workouts.empty_hint') || 'Completa tu primer entrenamiento para verlo aquí'}
                        </Text>
                    </View>
                </AnimatedCard>
            </View>
        );
    }

    const visibleWorkouts = expanded ? workouts : workouts.slice(0, VISIBLE_COUNT);
    const hasMore = workouts.length > VISIBLE_COUNT;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{t('recent_workouts.title') || 'Entrenamientos Recientes'}</Text>

            <View style={styles.workoutsList}>
                {visibleWorkouts.map((workout, index) => (
                    <AnimatedCard key={workout.id} delay={100 + index * 50}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={onViewAll || handleToggleExpand}
                        >
                            <View style={styles.workoutCard}>
                                {/* Header: Name + Date */}
                                <View style={styles.cardHeader}>
                                    <Text style={styles.workoutName} numberOfLines={1}>
                                        {workout.routineName}
                                    </Text>
                                    <Text style={styles.dateText}>
                                        {formatRelativeDate(workout.performedAt)}
                                    </Text>
                                </View>

                                {/* Stats Row: Centered columns */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{workout.exercises.length}</Text>
                                        <Text style={styles.statLabel}>{t('common.exercises')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{formatDuration(getDurationMinutes(workout))}</Text>
                                        <Text style={styles.statLabel}>{t('common.duration')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {(calculateTotalVolume(workout) / 1000).toFixed(1)}k
                                        </Text>
                                        <Text style={styles.statLabel}>kg</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </AnimatedCard>
                ))}

                {/* Blur overlay for "more" items */}
                {hasMore && !expanded && (
                    <View style={styles.blurContainer}>
                        <View style={[styles.workoutCard, styles.peekCard]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.workoutName} numberOfLines={1}>
                                    {workouts[VISIBLE_COUNT]?.routineName}
                                </Text>
                            </View>
                        </View>
                        <LinearGradient
                            colors={['transparent', COLORS.background]}
                            style={styles.gradient}
                        />
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={onViewAll || handleToggleExpand}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.viewAllText}>
                                {t('recent_workouts.view_all') || 'Ver Todos'} ({workouts.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Collapse button when expanded */}
                {expanded && workouts.length > VISIBLE_COUNT && (
                    <TouchableOpacity
                        style={styles.collapseButton}
                        onPress={handleToggleExpand}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.collapseText}>
                            {t('recent_workouts.show_less') || 'Mostrar menos'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
};

// Memoized export to prevent unnecessary re-renders
export const RecentWorkouts = memo(RecentWorkoutsComponent);

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: FONT_SIZE.xl,
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    workoutsList: {
        gap: 12,
    },
    workoutCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    workoutName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 12,
    },
    dayBadge: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
    },
    dateText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statUnit: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.border,
        marginHorizontal: 8,
    },
    // Empty state
    emptyCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    emptySubtext: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textTertiary,
        textAlign: 'center',
    },
    // Blur effect
    blurContainer: {
        position: 'relative',
        height: 80,
        overflow: 'hidden',
    },
    peekCard: {
        opacity: 0.5,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
    },
    viewAllButton: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewAllText: {
        ...TYPOGRAPHY.button,
        color: COLORS.primary,
    },
    collapseButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    collapseText: {
        ...TYPOGRAPHY.button,
        color: COLORS.textSecondary,
    },
});
