import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell } from 'lucide-react-native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutAnimation,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRecentWorkouts } from '../../hooks/useRecentWorkouts';
import { COLORS, FONT_SIZE, TYPOGRAPHY } from '../../theme/theme';
import { WorkoutSession } from '../../types/workout'; // ensure this is imported if used in props or types
import { translateIfKey } from '../../utils/translationHelpers';
import { AnimatedCard } from '../common/Animations';

interface RecentWorkoutsProps {
    onViewAll?: () => void;
}

const VISIBLE_COUNT = 2;

// --- Helper Functions (Moved outside to be stable) ---
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

// --- Memoized Item Component ---
const RecentWorkoutItem = memo(({
    workout,
    index,
    onPress,
    t
}: {
    workout: WorkoutSession;
    index: number;
    onPress: () => void;
    t: any
}) => {
    // Memoized derived data for this specific item
    const volume = useMemo(() => (calculateTotalVolume(workout) / 1000).toFixed(1), [workout]);
    const duration = useMemo(() => formatDuration(getDurationMinutes(workout)), [workout]);
    const exerciseCount = workout.exercises.length;

    // Memoize date formatting - safely handles Firestore Timestamps and cached JSON
    const formattedDate = useMemo(() => {
        const timestamp = workout.performedAt;
        if (!timestamp) return '';

        // Handle both Firestore Timestamp (.toDate()) and cached JSON (._seconds or direct Date)
        let date: Date;
        if (typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp._seconds) {
            // Firestore Timestamp serialized to JSON has _seconds and _nanoseconds
            date = new Date(timestamp._seconds * 1000);
        } else if (timestamp.seconds) {
            // Alternative format
            date = new Date(timestamp.seconds * 1000);
        } else {
            // Assume it's already a Date-like or timestamp number
            date = new Date(timestamp);
        }

        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('recent_workouts.today') || 'Hoy';
        if (diffDays === 1) return t('recent_workouts.yesterday') || 'Ayer';
        if (diffDays < 7) return `${diffDays} ${t('recent_workouts.days_ago') || 'días'}`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }, [workout.performedAt, t]);

    return (
        <AnimatedCard delay={100 + index * 50}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
            >
                <View style={styles.workoutCard}>
                    {/* Header: Name + Date */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.workoutName} numberOfLines={1}>
                            {translateIfKey(workout.routineName)}
                        </Text>
                        <Text style={styles.dateText}>
                            {formattedDate}
                        </Text>
                    </View>

                    {/* Stats Row: Centered columns */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{exerciseCount}</Text>
                            <Text style={styles.statLabel}>{t('common.exercises')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{duration}</Text>
                            <Text style={styles.statLabel}>{t('common.duration')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{volume}k</Text>
                            <Text style={styles.statLabel}>kg</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </AnimatedCard>
    );
});

const RecentWorkoutsComponent: React.FC<RecentWorkoutsProps> = ({ onViewAll }) => {
    const { t } = useTranslation();
    const { recentSessions: workouts, loading } = useRecentWorkouts(5);
    const [expanded, setExpanded] = useState(false);

    const handleToggleExpand = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    }, []);

    // Stabilize the onPress handler for items
    const handleItemPress = useCallback(() => {
        if (onViewAll) {
            onViewAll();
        } else {
            handleToggleExpand();
        }
    }, [onViewAll, handleToggleExpand]);

    const visibleWorkouts = useMemo(() => {
        return expanded ? workouts : workouts.slice(0, VISIBLE_COUNT);
    }, [expanded, workouts]);

    const hasMore = workouts.length > VISIBLE_COUNT;
    const moreCount = workouts.length;

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

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{t('recent_workouts.title') || 'Entrenamientos Recientes'}</Text>

            <View style={styles.workoutsList}>
                {visibleWorkouts.map((workout, index) => (
                    <RecentWorkoutItem
                        key={workout.id}
                        workout={workout}
                        index={index}
                        onPress={handleItemPress} // Use stable handler
                        t={t}
                    />
                ))}

                {/* Blur overlay for "more" items */}
                {hasMore && !expanded && (
                    <View style={styles.blurContainer}>
                        <View style={[styles.workoutCard, styles.peekCard]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.workoutName} numberOfLines={1}>
                                    {translateIfKey(workouts[VISIBLE_COUNT]?.routineName)}
                                </Text>
                            </View>
                        </View>
                        <LinearGradient
                            colors={['transparent', COLORS.background]}
                            style={styles.gradient}
                        />
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={handleItemPress}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.viewAllText}>
                                {t('recent_workouts.view_all') || 'Ver Todos'} ({moreCount})
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
