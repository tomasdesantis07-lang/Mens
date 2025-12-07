import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../services/firebaseConfig';
import { WorkoutService } from '../../services/workoutService';
import { COLORS } from '../../theme/theme';
import { Routine } from '../../types/routine';
import { WorkoutSession } from '../../types/workout';

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
    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && routine) {
            loadLastSession();
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
                // Get the most recent session
                const sorted = sessions.sort((a, b) => b.performedAt.seconds - a.performedAt.seconds);
                setLastSession(sorted[0]);
            }
        } catch (error) {
            console.error('Error loading last session:', error);
        } finally {
            setLoading(false);
        }
    };

    const getExerciseStats = (exerciseId: string, dayIndex: number) => {
        if (!lastSession || lastSession.dayIndex !== dayIndex) return null;

        const exerciseLog = lastSession.exercises.find(e => e.exerciseId === exerciseId);
        if (!exerciseLog || exerciseLog.sets.length === 0) return null;

        // Get average or first set data
        const firstSet = exerciseLog.sets[0];
        return {
            weight: firstSet.weight,
            reps: firstSet.reps,
        };
    };

    if (!routine) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
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
                            <Text style={styles.title}>{routine.name}</Text>
                            <Text style={styles.subtitle}>
                                {routine.daysPerWeek} días de entrenamiento
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <X size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {routine.days.map((day, dayIndex) => (
                            <View key={dayIndex} style={styles.daySection}>
                                <Text style={styles.dayTitle}>
                                    Día {dayIndex + 1}
                                    {day.label ? `: ${day.label}` : ''}
                                </Text>

                                {day.exercises.length === 0 ? (
                                    <Text style={styles.emptyText}>Sin ejercicios</Text>
                                ) : (
                                    <View style={styles.exercisesList}>
                                        {day.exercises.map((exercise, exIndex) => {
                                            const lastStats = getExerciseStats(exercise.id, dayIndex);
                                            const hasTarget = exercise.sets.length > 0 &&
                                                (exercise.sets[0].targetReps || exercise.sets[0].targetWeight);

                                            return (
                                                <View key={exIndex} style={styles.exerciseItem}>
                                                    <Text style={styles.exerciseName}>
                                                        {exIndex + 1}. {exercise.name || 'Ejercicio sin nombre'}
                                                    </Text>
                                                    <Text style={styles.exerciseDetails}>
                                                        {exercise.sets.length} series
                                                        {hasTarget ? (
                                                            <>
                                                                {exercise.sets[0].targetReps &&
                                                                    ` • ${exercise.sets[0].targetReps} reps`}
                                                                {exercise.sets[0].targetWeight &&
                                                                    ` • ${exercise.sets[0].targetWeight} kg`}
                                                            </>
                                                        ) : lastStats ? (
                                                            <>
                                                                {lastStats.reps && ` • ${lastStats.reps} reps`}
                                                                {lastStats.weight && ` • ${lastStats.weight} kg`}
                                                                <Text style={styles.lastSessionLabel}> (última sesión)</Text>
                                                            </>
                                                        ) : (
                                                            <Text style={styles.noDataLabel}> • Sin datos</Text>
                                                        )}
                                                    </Text>
                                                    {exercise.notes && exercise.notes.trim() !== '' && (
                                                        <Text style={styles.exerciseNotes}>
                                                            📝 {exercise.notes}
                                                        </Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    sheetContainer: {
        maxHeight: '80%',
        minHeight: '40%', // Ensure it has some height even if content is empty
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(10, 10, 15, 0.95)', // More opaque background
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
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
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
        paddingVertical: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 40,
        flexGrow: 1,
    },
    daySection: {
        marginBottom: 28,
    },
    dayTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textTertiary,
        fontStyle: 'italic',
        paddingVertical: 8,
    },
    exercisesList: {
        gap: 16,
    },
    exerciseItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    exerciseName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    lastSessionLabel: {
        fontSize: 11,
        color: COLORS.textTertiary,
        fontStyle: 'italic',
    },
    noDataLabel: {
        fontSize: 12,
        color: COLORS.textTertiary,
        fontStyle: 'italic',
    },
    exerciseNotes: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 6,
        fontStyle: 'italic',
    },
});
