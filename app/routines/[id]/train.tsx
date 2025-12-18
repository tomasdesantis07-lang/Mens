import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronDown, ChevronUp, Edit, Info, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "../../../src/components/common/ConfirmDialog";
import { PrimaryButton } from "../../../src/components/common/PrimaryButton";
import { useWorkout } from "../../../src/context/WorkoutContext";
import { auth } from "../../../src/services/firebaseConfig";
import { RoutineService } from "../../../src/services/routineService";
import { WorkoutService } from "../../../src/services/workoutService";
import { COLORS } from "../../../src/theme/theme";
import { Routine } from "../../../src/types/routine";
import { WorkoutExerciseLog, WorkoutSession } from "../../../src/types/workout";
import { showToast } from "../../../src/utils/toast";

import { useTranslation } from "react-i18next";

const TrainScreen: React.FC = () => {
    const { t } = useTranslation();
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
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

    // Drag to dismiss gesture
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const translateY = useSharedValue(0);
    const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.4; // 40% of screen to dismiss

    const dismissScreen = () => {
        router.back();
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            // Only allow dragging down (positive translateY)
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > DISMISS_THRESHOLD) {
                // Dismiss - animate out and navigate back
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
                    runOnJS(dismissScreen)();
                });
            } else {
                // Snap back to original position
                translateY.value = withSpring(0, {
                    damping: 20,
                    stiffness: 300,
                });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
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
                showToast.error(t('train.error_load'));
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
        if (!routine || !auth.currentUser || !activeWorkout) {
            console.log("Cannot finish workout - missing data:", {
                hasRoutine: !!routine,
                hasUser: !!auth.currentUser,
                hasActiveWorkout: !!activeWorkout
            });
            return;
        }

        const currentDay = routine.days.find((d) => d.dayIndex === selectedDayIndex);
        if (!currentDay) {
            console.log("Cannot find current day for index:", selectedDayIndex);
            return;
        }

        setIsSaving(true);
        try {
            // Build the workout session object from Context data
            const exercisesLog: WorkoutExerciseLog[] = currentDay.exercises.map((ex) => {
                const sets = activeWorkout.logs[ex.id] || [];
                return {
                    routineExerciseId: ex.id,
                    name: ex.name,
                    targetSets: ex.sets.length,
                    targetReps: ex.reps,
                    sets: sets,
                };
            });

            console.log("Attempting to save workout session...");
            console.log("User ID:", auth.currentUser.uid);
            console.log("Routine ID:", routine.id);
            console.log("Exercises count:", exercisesLog.length);

            const sessionId = await WorkoutService.createWorkoutSession({
                userId: auth.currentUser.uid,
                routineId: routine.id,
                routineName: routine.name,
                dayIndex: selectedDayIndex,
                exercises: exercisesLog,
            });

            console.log("Workout session saved successfully with ID:", sessionId);

            // Calculate metrics for summary screen
            let totalVolume = 0;
            let completedExerciseCount = 0;

            currentDay.exercises.forEach((ex) => {
                const sets = activeWorkout.logs[ex.id] || [];
                const hasCompletedSet = sets.some((set) =>
                    activeWorkout.completedSets.has(`${ex.id}-${set.setIndex}`)
                );

                if (hasCompletedSet) {
                    completedExerciseCount++;
                }

                sets.forEach((set) => {
                    if (activeWorkout.completedSets.has(`${ex.id}-${set.setIndex}`)) {
                        totalVolume += (set.weight || 0) * (set.reps || 0);
                    }
                });
            });

            finishWorkout(); // Clear context

            // Navigate to victory screen with metrics
            router.replace({
                pathname: "/workout/summary",
                params: {
                    duration: elapsedSeconds.toString(),
                    volume: totalVolume.toString(),
                    exerciseCount: completedExerciseCount.toString(),
                    totalExercises: currentDay.exercises.length.toString(),
                }
            } as any);
        } catch (error) {
            console.error("Error saving workout:", error);
            console.error("Error type:", typeof error);
            console.error("Error message:", error instanceof Error ? error.message : String(error));
            showToast.error(t('train.error_save'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelWorkout = () => {
        setShowCancelDialog(true);
    };

    const confirmCancelWorkout = () => {
        setShowCancelDialog(false);
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
            router.push(`/routines/edit/${routine.id}` as any);
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
                <Text style={styles.errorText}>{t('train.routine_not_found')}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>{t('train.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentDay = routine.days.find((d) => d.dayIndex === selectedDayIndex);

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, { paddingTop: insets.top + 20 }, animatedStyle]}>
                {/* Drag handle indicator */}
                <View style={styles.dragHandle}>
                    <View style={styles.dragIndicator} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Text style={styles.backButtonText}>↓ {t('train.minimize')}</Text>
                        </TouchableOpacity>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{formatElapsedTime(elapsedSeconds)}</Text>
                        </View>
                        <TouchableOpacity onPress={navigateToEdit} style={styles.editButton}>
                            <Edit size={16} color={COLORS.primary} />
                            <Text style={styles.editButtonText}>{t('train.edit')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerTitle}>
                        <Text style={styles.routineName}>{routine.name}</Text>
                        <Text style={styles.dayLabel}>
                            {currentDay ? currentDay.label : t('train.day_label', { number: selectedDayIndex + 1 })}
                        </Text>
                    </View>
                </View>



                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                    {currentDay?.exercises.map((exercise) => {
                        const isExpanded = expandedExerciseId === exercise.id;
                        const completedSets = activeWorkout?.logs[exercise.id]?.filter((set) =>
                            activeWorkout.completedSets.has(`${exercise.id}-${set.setIndex}`)
                        ).length || 0;
                        const totalSets = activeWorkout?.logs[exercise.id]?.length || 0;

                        return (
                            <View key={exercise.id} style={styles.exerciseCard}>
                                {/* Collapsible Header */}
                                <TouchableOpacity
                                    style={styles.exerciseCollapsibleHeader}
                                    onPress={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.headerLeftTrain}>
                                        <View style={styles.expandIconTrain}>
                                            {isExpanded ? (
                                                <ChevronUp size={20} color={COLORS.primary} />
                                            ) : (
                                                <ChevronDown size={20} color={COLORS.textSecondary} />
                                            )}
                                        </View>
                                        <View style={styles.headerInfoTrain}>
                                            <Text style={styles.exerciseNameHeader} numberOfLines={1}>
                                                {exercise.name}
                                            </Text>
                                            <Text style={styles.exerciseMetaTrain}>
                                                {completedSets}/{totalSets} {t('train.set')} • {exercise.sets.length} × {exercise.reps}
                                            </Text>
                                        </View>
                                    </View>
                                    {exercise.notes && (
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                showToast.info(exercise.notes || "");
                                            }}
                                            style={styles.noteButtonHeader}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Info size={18} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>

                                {/* Expandable Content */}
                                {isExpanded && (
                                    <View style={styles.exerciseExpandedContent}>
                                        <View style={styles.setsHeader}>
                                            <Text style={[styles.colHeader, { width: 40 }]}>{t('train.set')}</Text>
                                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.prev')}</Text>
                                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.kg')}</Text>
                                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.reps')}</Text>
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
                                            <Text style={styles.addSetText}>{t('train.add_set')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <PrimaryButton
                        title={t('train.finish_session')}
                        onPress={handleFinishWorkout}
                        loading={isSaving}
                    />
                    <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelWorkoutButton}>
                        <Text style={styles.cancelWorkoutText}>{t('train.cancel_workout')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Cancel Workout Confirmation Dialog */}
                <ConfirmDialog
                    visible={showCancelDialog}
                    title={t('train.cancel_dialog.title')}
                    message={t('train.cancel_dialog.message')}
                    confirmText={t('train.cancel_dialog.confirm')}
                    cancelText={t('train.cancel_dialog.cancel')}
                    onConfirm={confirmCancelWorkout}
                    onCancel={() => setShowCancelDialog(false)}
                    variant="danger"
                />
            </Animated.View>
        </GestureDetector>
    );
};

export default TrainScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 40, // Space at top to see previous screen
        overflow: 'hidden',
    },
    dragHandle: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 12,
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
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
    // Collapsible styles
    exerciseCollapsibleHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 16,
    },
    headerLeftTrain: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    expandIconTrain: {
        marginRight: 12,
    },
    headerInfoTrain: {
        flex: 1,
    },
    exerciseNameHeader: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    exerciseMetaTrain: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    noteButtonHeader: {
        padding: 8,
        marginLeft: 8,
    },
    exerciseExpandedContent: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 16,
    },
});
