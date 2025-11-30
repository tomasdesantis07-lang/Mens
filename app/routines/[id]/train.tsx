import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Edit, Info, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../../../src/components/common/PrimaryButton";
import { useWorkout } from "../../../src/context/WorkoutContext";
import { auth } from "../../../src/services/firebaseConfig";
import { RoutineService } from "../../../src/services/routineService";
import { WorkoutService } from "../../../src/services/workoutService";
import { COLORS } from "../../../src/theme/theme";
import { Routine } from "../../../src/types/routine";
import { WorkoutExerciseLog, WorkoutSession } from "../../../src/types/workout";
import { showToast } from "../../../src/utils/toast";

const TrainScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id, dayIndex } = useLocalSearchParams<{ id: string; dayIndex?: string }>();

    const [loading, setLoading] = useState(true);
    const [routine, setRoutine] = useState<Routine | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
        dayIndex ? parseInt(dayIndex) : 0
    );

    // State for the current workout log
    // We map exerciseId -> list of sets
    // State for the current workout log
    // We map exerciseId -> list of sets
    const {
        activeWorkout,
        logSet,
        toggleSetComplete,
        addSet,
        removeSet,
        finishWorkout,
        cancelWorkout,
        elapsedSeconds,
        startRestTimer
    } = useWorkout();

    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadRoutineAndHistory = async () => {
            if (!id) return;
            try {
                const data = await RoutineService.getRoutineById(id);
                setRoutine(data);

                // If the routine exists and has days, ensure selectedDayIndex is valid
                if (data && data.days.length > 0) {
                    // If the passed dayIndex is invalid or not present, default to the first available day
                    const dayExists = data.days.some(d => d.dayIndex === selectedDayIndex);
                    if (!dayExists) {
                        setSelectedDayIndex(data.days[0].dayIndex);
                    }
                }

                if (auth.currentUser) {
                    const last = await WorkoutService.getLastWorkoutSessionForRoutine(
                        auth.currentUser.uid,
                        id,
                        selectedDayIndex
                    );
                    setLastSession(last);
                }
            } catch (error) {
                console.error("Error loading routine:", error);
                showToast.error("Error al cargar la rutina");
            } finally {
                setLoading(false);
            }
        };
        loadRoutineAndHistory();
    }, [id, selectedDayIndex]);





    const handleToggleSet = (exerciseId: string, setIndex: number, restSeconds: number) => {
        const key = `${exerciseId}-${setIndex}`;
        const wasCompleted = activeWorkout?.completedSets.has(key);

        toggleSetComplete(exerciseId, setIndex);

        // If we are marking as complete (not unchecking), trigger haptics and start rest timer
        if (!wasCompleted) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startRestTimer(restSeconds);
        }
    };

    const getLastSessionSet = (exerciseId: string, setIndex: number) => {
        if (!lastSession) return null;
        // Try to find matching exercise by routineExerciseId
        const exLog = lastSession.exercises.find(e => e.routineExerciseId === exerciseId);
        if (!exLog) return null;
        return exLog.sets.find(s => s.setIndex === setIndex);
    };

    const handleFinishWorkout = async () => {
        if (!routine || !auth.currentUser || !activeWorkout) return;

        const currentDay = routine.days.find((d) => d.dayIndex === selectedDayIndex);
        if (!currentDay) return;

        setIsSaving(true);
        try {
            // Build the workout session object from Context data
            const exercisesLog: WorkoutExerciseLog[] = currentDay.exercises.map((ex) => {
                const sets = activeWorkout.logs[ex.id] || [];
                return {
                    routineExerciseId: ex.id,
                    name: ex.name,
                    targetSets: ex.sets,
                    targetReps: ex.reps,
                    sets: sets,
                };
            });

            await WorkoutService.createWorkoutSession({
                userId: auth.currentUser.uid,
                routineId: routine.id,
                routineName: routine.name,
                dayIndex: selectedDayIndex,
                exercises: exercisesLog,
            });

            showToast.success("¡Entrenamiento guardado!", "Buen trabajo");
            finishWorkout(); // Clear context
            router.replace("/(tabs)/home");
        } catch (error) {
            console.error("Error saving workout:", error);
            showToast.error("Error al guardar el entrenamiento");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelWorkout = () => {
        // In a real app, show confirmation alert
        cancelWorkout();
        router.back();
    };

    const formatElapsedTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const navigateToEdit = () => {
        if (routine) {
            router.push(`../../routines/edit/${routine.id}` as any);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
        );
    }

    if (!routine) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <Text style={styles.errorText}>No se encontró la rutina</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentDay = routine.days.find((d) => d.dayIndex === selectedDayIndex);

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>↓ Minimizar</Text>
                    </TouchableOpacity>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatElapsedTime(elapsedSeconds)}</Text>
                    </View>
                    <TouchableOpacity onPress={navigateToEdit} style={styles.editButton}>
                        <Edit size={16} color={COLORS.primary} />
                        <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerTitle}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.dayLabel}>
                        {currentDay ? currentDay.label : `Día ${selectedDayIndex + 1}`}
                    </Text>
                </View>
            </View>

            {/* Day Selector (if multiple days) */}
            {routine.days.length > 1 && (
                <View style={styles.daySelector}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {routine.days.map((day) => (
                            <TouchableOpacity
                                key={day.dayIndex}
                                style={[
                                    styles.dayChip,
                                    selectedDayIndex === day.dayIndex && styles.dayChipSelected,
                                ]}
                                onPress={() => setSelectedDayIndex(day.dayIndex)}
                            >
                                <Text
                                    style={[
                                        styles.dayChipText,
                                        selectedDayIndex === day.dayIndex && styles.dayChipTextSelected,
                                    ]}
                                >
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {currentDay?.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseTitleRow}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                {exercise.notes && (
                                    <TouchableOpacity
                                        onPress={() => showToast.info(exercise.notes || "")}
                                        style={styles.noteButton}
                                    >
                                        <Info size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.exerciseTarget}>
                                Meta: {exercise.sets} series x {exercise.reps} reps • Descanso: {exercise.restSeconds}s
                            </Text>
                            {exercise.notes && (
                                <Text style={styles.exerciseNotes} numberOfLines={2}>
                                    📝 {exercise.notes}
                                </Text>
                            )}
                        </View>

                        <View style={styles.setsHeader}>
                            <Text style={[styles.colHeader, { width: 40 }]}>Set</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>Previo</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>Kg</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {activeWorkout?.logs[exercise.id]?.map((set, index) => {
                            const isCompleted = activeWorkout.completedSets.has(`${exercise.id}-${set.setIndex}`);
                            const lastSet = getLastSessionSet(exercise.id, set.setIndex);

                            return (
                                <View key={set.setIndex} style={[
                                    styles.setRow,
                                    isCompleted && styles.setRowCompleted
                                ]}>
                                    <View style={styles.setNumberContainer}>
                                        <Text style={styles.setNumber}>{index + 1}</Text>
                                    </View>

                                    {/* Previous History */}
                                    <View style={styles.historyContainer}>
                                        <Text style={styles.historyText}>
                                            {lastSet ? `${lastSet.weight}kg x ${lastSet.reps}` : "-"}
                                        </Text>
                                    </View>

                                    <TextInput
                                        style={[styles.input, isCompleted && styles.inputCompleted]}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={set.weight > 0 ? set.weight.toString() : ""}
                                        onChangeText={(val) =>
                                            logSet(exercise.id, set.setIndex, "weight", parseFloat(val) || 0)
                                        }
                                        editable={!isCompleted}
                                    />

                                    <TextInput
                                        style={[styles.input, isCompleted && styles.inputCompleted]}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={set.reps > 0 ? set.reps.toString() : ""}
                                        onChangeText={(val) =>
                                            logSet(exercise.id, set.setIndex, "reps", parseFloat(val) || 0)
                                        }
                                        editable={!isCompleted}
                                    />

                                    <TouchableOpacity
                                        onPress={() => handleToggleSet(exercise.id, set.setIndex, exercise.restSeconds)}
                                        style={[styles.checkButton, isCompleted && styles.checkButtonActive]}
                                    >
                                        <Check size={16} color={isCompleted ? COLORS.textInverse : COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}

                        <TouchableOpacity
                            style={styles.addSetButton}
                            onPress={() => addSet(exercise.id)}
                        >
                            <Plus size={16} color={COLORS.primary} />
                            <Text style={styles.addSetText}>Agregar serie</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <PrimaryButton
                    title="Finalizar sesión"
                    onPress={handleFinishWorkout}
                    loading={isSaving}
                />
                <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelWorkoutButton}>
                    <Text style={styles.cancelWorkoutText}>Cancelar entrenamiento</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TrainScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    headerTitle: {
        marginTop: 4,
    },
    backButton: {
        paddingVertical: 8,
    },
    backButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: "500",
    },
    routineName: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    dayLabel: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    editButtonText: {
        color: COLORS.primary,
        fontWeight: "600",
        fontSize: 14,
    },
    daySelector: {
        marginBottom: 16,
        paddingHorizontal: 24,
    },
    dayChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dayChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayChipText: {
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    dayChipTextSelected: {
        color: COLORS.textInverse,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    errorText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        textAlign: "center",
        marginTop: 40,
    },

    exerciseCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    exerciseHeader: {
        marginBottom: 16,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    exerciseTarget: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    setsHeader: {
        flexDirection: "row",
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    colHeader: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    setRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    setRowCompleted: {
        opacity: 0.8,
    },
    exerciseTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    noteButton: {
        padding: 4,
    },
    exerciseNotes: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: "italic",
        marginTop: 4,
    },
    historyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    historyText: {
        fontSize: 11,
        color: COLORS.textTertiary,
        fontVariant: ["tabular-nums"],
    },
    inputCompleted: {
        backgroundColor: COLORS.surface,
        color: COLORS.textSecondary,
    },
    checkButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    checkButtonActive: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    setNumberContainer: {
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    setNumber: {
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    input: {
        flex: 1,
        backgroundColor: "transparent",
        borderRadius: 0,
        paddingVertical: 8,
        paddingHorizontal: 8,
        color: COLORS.textPrimary,
        textAlign: "center",
        borderWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        fontSize: 16,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    removeSetButton: {
        width: 40,
        alignItems: "center",
    },
    addSetButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    addSetText: {
        color: COLORS.primary,
        fontWeight: "600",
        fontSize: 14,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
    cancelWorkoutButton: {
        alignItems: "center",
        paddingVertical: 12,
    },
    cancelWorkoutText: {
        color: COLORS.error,
        fontWeight: "600",
        fontSize: 14,
    },
    timerContainer: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timerText: {
        color: COLORS.primary,
        fontWeight: "700",
        fontSize: 16,
        fontVariant: ["tabular-nums"],
    },
});
