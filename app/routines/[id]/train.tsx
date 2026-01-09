import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native"; // Removed Edit import
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    InteractionManager,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Gesture, GestureDetector, Swipeable } from "react-native-gesture-handler";
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
import { ExercisePickerModal } from "../../../src/components/specific/ExercisePickerModal";
import { WorkoutExerciseCard } from "../../../src/components/specific/WorkoutExerciseCard";
import { useWorkout, useWorkoutTimer } from "../../../src/context/WorkoutContext";
import { ExerciseRecommendationService } from "../../../src/services/ExerciseRecommendationService";
import { auth } from "../../../src/services/firebaseConfig";
import { RoutineService } from "../../../src/services/routineService";
import { WorkoutService } from "../../../src/services/workoutService";
import { COLORS } from "../../../src/theme/theme";
import { CatalogExercise } from "../../../src/types/exercise";
import { Routine, RoutineExercise } from "../../../src/types/routine";
import { WorkoutExerciseLog, WorkoutSession } from "../../../src/types/workout";
import { showToast } from "../../../src/utils/toast";
import { translateIfKey } from "../../../src/utils/translationHelpers";

import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

const TrainScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id, dayIndex } = useLocalSearchParams<{ id: string; dayIndex?: string }>();

    const {
        activeWorkout,
        startWorkout,
        logSet,
        toggleSetComplete,
        addSet,
        removeSet,
        finishWorkout,
        cancelWorkout,
        startRestTimer,
        replaceExercise,
        reorderExercises,
        addExerciseToSession,
        removeExerciseFromSession
    } = useWorkout();

    // Optimistic initialization: Check if we already have the data in context
    const hasActiveSession = activeWorkout && activeWorkout.routine.id === id;

    const [loading, setLoading] = useState(!hasActiveSession);
    const [routine, setRoutine] = useState<Routine | null>(hasActiveSession ? activeWorkout.routine : null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
        activeWorkout?.dayIndex ?? (dayIndex ? parseInt(dayIndex) : 0)
    );

    // Automatically start workout if not active
    useEffect(() => {
        if (!loading && routine) {
            const isSameSession = activeWorkout
                && activeWorkout.routine.id === routine.id
                && activeWorkout.dayIndex === selectedDayIndex;

            if (!isSameSession) {
                startWorkout(routine, selectedDayIndex);
            }
            setLoading(false);
        }
    }, [loading, routine, selectedDayIndex]);

    const elapsedSeconds = useWorkoutTimer(activeWorkout?.startTime ?? null);

    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
    const flatListRef = useRef<any>(null);

    // Auto-scroll when expanding an exercise
    useEffect(() => {
        if (expandedExerciseId && currentDay?.exercises) {
            const index = currentDay.exercises.findIndex(e => e.id === expandedExerciseId);
            if (index !== -1) {
                // Small timeout to allow the card to begin expanding and layout to update
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.3, // Centers it slightly above the middle for better visibility of the first sets
                    });
                }, 100);
            }
        }
    }, [expandedExerciseId]);

    const openedRow = useRef<Swipeable | null>(null);

    const closeOpenedRow = useCallback(() => {
        if (openedRow.current) {
            openedRow.current.close();
        }
    }, []);

    const emptySet = useMemo(() => new Set<string>(), []);

    const handleToggleExpand = useCallback((exerciseId: string) => {
        setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
    }, []);

    // Replacement state
    const [replacementModalVisible, setReplacementModalVisible] = useState(false);
    const [exerciseToReplace, setExerciseToReplace] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<CatalogExercise[]>([]);

    // Add Exercise state
    const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);

    // Drag to dismiss gesture
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const translateY = useSharedValue(0);
    const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.4;

    const dismissScreen = () => {
        router.back();
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > DISMISS_THRESHOLD) {
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
                    runOnJS(dismissScreen)();
                });
            } else {
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
        if (!id) return;

        // Use InteractionManager to defer data loading until after screen transition
        const interaction = InteractionManager.runAfterInteractions(() => {
            const loadData = async () => {
                // 1. Load Routine (only if not already loaded from context)
                if (!routine) {
                    try {
                        const data = await RoutineService.getRoutineById(id);
                        setRoutine(data);

                        if (data && data.days.length > 0) {
                            const dayExists = data.days.some(d => d.dayIndex === selectedDayIndex);
                            if (!dayExists) {
                                setSelectedDayIndex(data.days[0].dayIndex);
                            }
                        }
                        setLoading(false);
                    } catch (error) {
                        console.error("Error loading routine:", error);
                        showToast.error(t('train.error_load'));
                        setLoading(false);
                    }
                }
            };

            const loadHistory = async () => {
                // 2. Load History (Non-blocking)
                if (auth.currentUser) {
                    try {
                        const last = await WorkoutService.getLastWorkoutSessionForRoutine(
                            auth.currentUser.uid,
                            id,
                            selectedDayIndex
                        );
                        setLastSession(last);
                    } catch (error) {
                        console.error("Error loading history:", error);
                        // Fail silently for history, not critical
                    }
                }
            };

            loadData();
            loadHistory();
        });

        return () => interaction.cancel();
    }, [id, selectedDayIndex]);

    const handleToggleSet = useCallback((exerciseId: string, setIndex: number, restSeconds: number) => {
        toggleSetComplete(exerciseId, setIndex);
        startRestTimer(restSeconds);
    }, [toggleSetComplete, startRestTimer]);

    const getLastSessionSet = useCallback((exerciseId: string, setIndex: number): { weight: number; reps: number } | null => {
        if (!lastSession) return null;
        const exLog = lastSession.exercises.find(e => e.routineExerciseId === exerciseId);
        if (!exLog) return null;
        const foundSet = exLog.sets.find(s => s.setIndex === setIndex);
        if (!foundSet) return null;
        return { weight: foundSet.weight, reps: foundSet.reps };
    }, [lastSession]);

    const handleFinishWorkout = async () => {
        if (!routine || !auth.currentUser || !activeWorkout) return;

        const currentDay = activeWorkout.routine.days.find((d) => d.dayIndex === selectedDayIndex);
        if (!currentDay) return;

        setIsSaving(true);
        try {
            const exercisesLog: WorkoutExerciseLog[] = currentDay.exercises.map((ex) => {
                const sets = activeWorkout.logs[ex.id] || [];
                return {
                    exerciseId: ex.exerciseId,
                    routineExerciseId: ex.id,
                    name: ex.name,
                    targetSets: ex.sets.length,
                    targetReps: ex.reps,
                    sets: sets,
                };
            });

            const sessionId = await WorkoutService.createWorkoutSession({
                userId: auth.currentUser.uid,
                routineId: routine.id,
                routineName: routine.name,
                dayIndex: selectedDayIndex,
                durationSeconds: elapsedSeconds,
                exercises: exercisesLog,
            });

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

            finishWorkout();

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

    const handleInitiateReplace = (exerciseId: string) => {
        const currentDay = activeWorkout?.routine.days.find(d => d.dayIndex === activeWorkout.dayIndex);
        const exercise = currentDay?.exercises.find(e => e.id === exerciseId);

        if (exercise && exercise.exerciseId) {
            const recs = ExerciseRecommendationService.getRecommendedSubstitutes(exercise.exerciseId);
            setRecommendations(recs);
        } else {
            setRecommendations([]);
        }
        setExerciseToReplace(exerciseId);
        setReplacementModalVisible(true);
    };

    const handleConfirmReplace = (exercises: Array<{ exercise: CatalogExercise, translatedName: string }>) => {
        if (exerciseToReplace && exercises.length > 0) {
            const { exercise: newExercise, translatedName } = exercises[0];
            replaceExercise(exerciseToReplace, {
                id: newExercise.id,
                name: translatedName,
                targetZone: newExercise.primaryMuscles[0]
            });
            showToast.success(t('train.replaced_success') || "Ejercicio reemplazado");
        }
        setReplacementModalVisible(false);
        setExerciseToReplace(null);
    };

    const handleAddExercises = (selectedExercises: Array<{ exercise: CatalogExercise, translatedName: string }>) => {
        let nextOrder = currentDay?.exercises.length ?? 0;

        selectedExercises.forEach(({ exercise, translatedName }) => {
            const newRoutineExercise: RoutineExercise = {
                id: uuidv4(),
                exerciseId: exercise.id,
                name: translatedName,
                sets: [
                    { setIndex: 1, targetReps: 10, targetWeight: 0 },
                    { setIndex: 2, targetReps: 10, targetWeight: 0 },
                    { setIndex: 3, targetReps: 10, targetWeight: 0 }
                ],
                reps: "10",
                restSeconds: 60,
                targetZone: exercise.primaryMuscles[0],
                notes: "",
                order: nextOrder++
            };
            addExerciseToSession(newRoutineExercise);
        });
        setAddExerciseModalVisible(false);
        showToast.success(t('train.exercises_added') || "Ejercicios añadidos");
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

    const isViewingActiveSession = activeWorkout
        && routine
        && activeWorkout.routine.id === routine.id
        && activeWorkout.dayIndex === selectedDayIndex;

    const displayRoutine = isViewingActiveSession ? activeWorkout.routine : routine;
    const currentDay = displayRoutine.days.find((d) => d.dayIndex === selectedDayIndex);

    // Render item for DraggableFlatList
    const renderItem = ({ item, drag, isActive }: RenderItemParams<RoutineExercise>) => {
        const renderRightActions = () => {
            return (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                        closeOpenedRow();
                        removeExerciseFromSession(item.id);
                    }}
                >
                    <Trash2 size={24} color={COLORS.error} />
                </TouchableOpacity>
            );
        };

        let currentRef: Swipeable | null = null;

        return (
            <ScaleDecorator>
                <Swipeable
                    ref={ref => { currentRef = ref; }}
                    renderRightActions={renderRightActions}
                    onSwipeableWillOpen={() => {
                        if (openedRow.current && openedRow.current !== currentRef) {
                            openedRow.current.close();
                        }
                        openedRow.current = currentRef;
                    }}
                    onSwipeableClose={() => {
                        if (openedRow.current === currentRef) {
                            openedRow.current = null;
                        }
                    }}
                >
                    <TouchableOpacity
                        onLongPress={drag}
                        disabled={isActive}
                        activeOpacity={1}
                        style={{ opacity: isActive ? 0.8 : 1 }}
                    >
                        <WorkoutExerciseCard
                            exercise={item}
                            logs={activeWorkout?.logs[item.id] || []}
                            completedSets={activeWorkout?.completedSets || emptySet}
                            isExpanded={expandedExerciseId === item.id}
                            onToggleExpand={() => handleToggleExpand(item.id)}
                            onLogSet={logSet}
                            onToggleSetComplete={handleToggleSet}
                            onAddSet={addSet}
                            getLastSessionSet={getLastSessionSet}
                            onReplace={handleInitiateReplace}
                        />
                    </TouchableOpacity>
                </Swipeable>
            </ScaleDecorator>
        );
    };

    return (
        <Animated.View style={[styles.container, { paddingTop: insets.top + 20 }, animatedStyle]}>
            {/* Drag handle zone */}
            <GestureDetector gesture={panGesture}>
                <View>
                    <View style={styles.dragHandle}>
                        <View style={styles.dragIndicator} />
                    </View>

                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Text style={styles.backButtonText}>↓ {t('train.minimize')}</Text>
                            </TouchableOpacity>
                            <View style={styles.timerContainer}>
                                <Text style={styles.timerText}>{formatElapsedTime(elapsedSeconds)}</Text>
                            </View>
                            {/* Empty view to balance layout since we removed Edit button */}
                            <View style={{ width: 80 }} />
                        </View>
                        <View style={styles.headerTitle}>
                            <Text style={styles.routineName}>{translateIfKey(displayRoutine.name)}</Text>
                            <Text style={styles.dayLabel}>
                                {currentDay ? translateIfKey(currentDay.label) : t('train.day_label', { number: selectedDayIndex + 1 })}
                            </Text>
                        </View>
                    </View>
                </View>
            </GestureDetector>

            <DraggableFlatList
                ref={flatListRef}
                data={currentDay?.exercises || []}
                onDragEnd={({ from, to }) => reorderExercises(from, to)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                containerStyle={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
                onScrollToIndexFailed={(info) => {
                    // Fallback if scroll fails (common with dynamic heights)
                    setTimeout(() => {
                        flatListRef.current?.scrollToOffset({
                            offset: info.averageItemLength * info.index,
                            animated: true
                        });
                    }, 100);
                }}
                ListFooterComponent={
                    <TouchableOpacity
                        style={styles.addExerciseButton}
                        onPress={() => setAddExerciseModalVisible(true)}
                    >
                        <Plus size={20} color={COLORS.primary} />
                        <Text style={styles.addExerciseButtonText}>{t('train.add_exercise')}</Text>
                    </TouchableOpacity>
                }
            />

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) + 8 }]}>
                <PrimaryButton
                    title={t('train.finish_session')}
                    onPress={handleFinishWorkout}
                    loading={isSaving}
                />
                <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelWorkoutButton}>
                    <Text style={styles.cancelWorkoutText}>{t('train.cancel_workout')}</Text>
                </TouchableOpacity>
            </View>

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

            {/* Replacement Modal */}
            <ExercisePickerModal
                visible={replacementModalVisible}
                onClose={() => setReplacementModalVisible(false)}
                onSelect={handleConfirmReplace}
                onCustomExercise={() => showToast.info(t('train.custom_exercise_hint') || "Selecciona un ejercicio existente")}
                recommendedExercises={recommendations}
                multiSelect={false}
            />

            {/* Add Exercise Modal */}
            <ExercisePickerModal
                visible={addExerciseModalVisible}
                onClose={() => setAddExerciseModalVisible(false)}
                onSelect={handleAddExercises}
                onCustomExercise={() => showToast.info(t('train.custom_exercise_hint') || "Selecciona un ejercicio existente")}
                multiSelect={true}
            />
        </Animated.View>
    );
};

export default TrainScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 40,
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
    errorText: {
        color: COLORS.textPrimary,
        fontSize: 18,
        textAlign: "center",
        marginTop: 40,
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
    deleteButton: {
        backgroundColor: COLORS.error + '20',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 16,
        marginBottom: 16,
        marginLeft: 10,
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        borderRadius: 16,
        marginVertical: 16,
        gap: 8,
        backgroundColor: COLORS.surface,
    },
    addExerciseButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    }
});
