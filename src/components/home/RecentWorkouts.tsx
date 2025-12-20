import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Dumbbell, Flame } from 'lucide-react-native';
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
            const sessions = await WorkoutService.getRecentSessions(user.uid, 10);
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

    const calculateDuration = (workout: WorkoutSession): number => {
        // Estimate based on sets (avg 2 min per set including rest)
        let totalSets = 0;
        workout.exercises.forEach(exercise => {
            totalSets += exercise.sets.length;
        });
        return Math.max(15, totalSets * 2); // Minimum 15 min
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
                        <View style={styles.workoutCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardTitleRow}>
                                    <Text style={styles.workoutName} numberOfLines={1}>
                                        {workout.routineName}
                                    </Text>
                                    <Text style={styles.dayBadge}>
                                        Día {workout.dayIndex + 1}
                                    </Text>
                                </View>
                                <Text style={styles.dateText}>
                                    {formatRelativeDate(workout.performedAt)}
                                </Text>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Flame size={14} color={COLORS.accent} />
                                    <Text style={styles.statValue}>
                                        {calculateTotalVolume(workout).toLocaleString()}
                                    </Text>
                                    <Text style={styles.statUnit}>kg</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Clock size={14} color={COLORS.textSecondary} />
                                    <Text style={styles.statValue}>
                                        {calculateDuration(workout)}
                                    </Text>
                                    <Text style={styles.statUnit}>min</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Dumbbell size={14} color={COLORS.textSecondary} />
                                    <Text style={styles.statValue}>
                                        {workout.exercises.length}
                                    </Text>
                                    <Text style={styles.statUnit}>ejercicios</Text>
                                </View>
                            </View>
                        </View>
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
        marginBottom: 12,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    workoutName: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 8,
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
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: TYPOGRAPHY.button.fontWeight,
        color: COLORS.textPrimary,
    },
    statUnit: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: COLORS.border,
        marginHorizontal: 12,
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
