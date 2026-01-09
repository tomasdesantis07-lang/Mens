import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight, Edit2, Moon, Play, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../../services/firebaseConfig';
import { WorkoutService } from '../../services/workoutService';
import { COLORS, TYPOGRAPHY } from '../../theme/theme';
import { Routine } from '../../types/routine';
import { WorkoutSession } from '../../types/workout';
import { translateIfKey } from '../../utils/translationHelpers';

interface RoutinePreviewSheetProps {
    visible: boolean;
    routine: Routine | null;
    onClose: () => void;
}

export const RoutinePreviewSheet: React.FC<RoutinePreviewSheetProps> = ({
    visible,
    routine,
    onClose,
}) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
    const [loading, setLoading] = useState(false);

    // Get today's day of week (Monday=0, Tuesday=1, ..., Sunday=6)
    const jsDay = new Date().getDay();
    const todayDayIndex = jsDay === 0 ? 6 : jsDay - 1;

    useEffect(() => {
        if (visible && routine) {
            loadLastSession();
        } else {
            // Reset state when closing
            setLastSession(null);
        }
    }, [visible, routine]);

    const loadLastSession = async () => {
        if (!routine) return;

        const userId = auth.currentUser?.uid;
        if (!userId) return;

        setLoading(true);
        try {
            const sessions = await WorkoutService.getWorkoutSessionsByRoutine(userId, routine.id);
            if (sessions.length > 0) {
                // Get the most recent session (already sorted newest first)
                const mostRecent = sessions[0];
                setLastSession(mostRecent);
            }
        } catch (error) {
            console.error('Error loading last session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayPress = (dayIndex: number) => {
        if (!routine) return;

        onClose();
        // Navigate to training screen with pre-selected day
        router.push({
            pathname: '/routines/[id]/train',
            params: { id: routine.id, dayIndex: dayIndex.toString() }
        } as any);
    };

    const formatLastTrainedDate = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('recent_workouts.today') || 'Hoy';
        if (diffDays === 1) return t('recent_workouts.yesterday') || 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Get weekday names from translations
    const weekdays = t('common.weekdays', { returnObjects: true }) as string[];

    // Build complete 7 days array, filling in rest days where routine has no data
    const allDays = Array.from({ length: 7 }, (_, index) => {
        const routineDay = routine?.days.find(d => d.dayIndex === index);
        return {
            dayIndex: index,
            dayName: weekdays[index] || `Día ${index + 1}`,
            label: routineDay?.label || '',
            exercises: routineDay?.exercises || [],
            isRestDay: !routineDay || routineDay.exercises.length === 0,
        };
    });

    if (!routine) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.sheetContainer}>
                    <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{translateIfKey(routine.name)}</Text>
                            <Text style={styles.subtitle}>
                                {routine.daysPerWeek} {t('routine_card.days_per_week') || 'días/semana'}
                                {lastSession && (
                                    <Text style={styles.lastTrained}>
                                        {' • '}Último: {formatLastTrainedDate(lastSession.performedAt)}
                                    </Text>
                                )}
                            </Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => {
                                    onClose();
                                    router.push(`/routines/edit/${routine.id}` as any);
                                }}
                                activeOpacity={0.7}
                            >
                                <Edit2 size={20} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Cargando...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.content}
                            contentContainerStyle={styles.contentContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Days List - Always show 7 days */}
                            {allDays.map((day) => {
                                const isToday = day.dayIndex === todayDayIndex;
                                const exerciseCount = day.exercises.length;

                                return (
                                    <TouchableOpacity
                                        key={day.dayIndex}
                                        style={[
                                            styles.dayCard,
                                            isToday && !day.isRestDay && styles.dayCardActive,
                                            isToday && day.isRestDay && styles.dayCardRest
                                        ]}
                                        onPress={() => !day.isRestDay && handleDayPress(day.dayIndex)}
                                        activeOpacity={day.isRestDay ? 1 : 0.7}
                                        disabled={day.isRestDay}
                                    >
                                        {/* Today Badge */}
                                        {isToday && (
                                            <View style={[styles.nextBadge, day.isRestDay && styles.restBadge]}>
                                                <Text style={styles.nextBadgeText}>
                                                    {t('home.today_badge')}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.dayCardContent}>
                                            <View style={styles.dayInfo}>
                                                <Text style={[
                                                    styles.dayTitle,
                                                    isToday && !day.isRestDay && styles.dayTitleActive
                                                ]}>
                                                    {day.dayName}
                                                </Text>
                                                {day.isRestDay ? (
                                                    <Text style={styles.restDayLabel}>{t('home.rest_day_title')}</Text>
                                                ) : day.label ? (
                                                    <Text style={styles.dayLabel}>{translateIfKey(day.label)}</Text>
                                                ) : null}
                                                <Text style={styles.exerciseCount}>
                                                    {day.isRestDay
                                                        ? t('routines.rest_days_tip').split(',')[0]
                                                        : `${exerciseCount} ${exerciseCount === 1
                                                            ? t('routine_card.exercise')
                                                            : t('routine_card.exercises')}`
                                                    }
                                                </Text>
                                            </View>

                                            <View style={styles.dayAction}>
                                                {day.isRestDay ? (
                                                    <Moon size={20} color={COLORS.success} />
                                                ) : isToday ? (
                                                    <View style={styles.playButton}>
                                                        <Play size={18} color={COLORS.textInverse} fill={COLORS.textInverse} />
                                                    </View>
                                                ) : (
                                                    <ChevronRight size={20} color={COLORS.textTertiary} />
                                                )}
                                            </View>
                                        </View>

                                        {/* Preview of exercises */}
                                        {day.exercises.length > 0 && (
                                            <View style={styles.exercisePreview}>
                                                {day.exercises.slice(0, 3).map((ex, i) => (
                                                    <Text key={i} style={styles.exercisePreviewText} numberOfLines={1}>
                                                        • {translateIfKey(ex.name, t) || t('routine_card.no_name')}
                                                    </Text>
                                                ))}
                                                {day.exercises.length > 3 && (
                                                    <Text style={styles.moreExercises}>
                                                        {t('routine_card.more_exercises', { count: day.exercises.length - 3 })}
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        maxHeight: '80%',
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(10, 10, 15, 0.98)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerContent: {
        flex: 1,
        marginRight: 16,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
    lastTrained: {
        color: COLORS.textTertiary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    loadingText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    content: {
        maxHeight: 400,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 24,
        gap: 12,
        flexGrow: 1,
    },
    // Day Cards
    dayCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
        overflow: 'hidden',
    },
    dayCardActive: {
        backgroundColor: COLORS.primary + '15',
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    dayCardRest: {
        backgroundColor: COLORS.success + '10',
        borderColor: COLORS.success,
        borderWidth: 2,
        opacity: 0.85,
    },
    nextBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 8,
    },
    restBadge: {
        backgroundColor: COLORS.success,
    },
    nextBadgeText: {
        ...TYPOGRAPHY.caption,
        fontWeight: '700',
        color: COLORS.textInverse,
        letterSpacing: 1,
    },
    dayCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dayInfo: {
        flex: 1,
        gap: 2,
    },
    dayTitle: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dayTitleActive: {
        color: COLORS.primary,
    },
    dayLabel: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    restDayLabel: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.success,
        fontWeight: '500',
    },
    exerciseCount: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    dayAction: {
        marginLeft: 12,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Exercise Preview
    exercisePreview: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        gap: 4,
    },
    exercisePreviewText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textTertiary,
    },
    moreExercises: {
        ...TYPOGRAPHY.caption,
        color: COLORS.primary,
        marginTop: 4,
    },
    emptyDays: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
