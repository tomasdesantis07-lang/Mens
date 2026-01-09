import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
    FadeIn,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
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

const WorkoutTimerDisplay: React.FC<{ startTime: number | null }> = memo(({ startTime }: { startTime: number | null }) => {
    const elapsedSeconds = useWorkoutTimer(startTime);

    const formatElapsedTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return <Text style={styles.timerText}>{formatElapsedTime(elapsedSeconds)}</Text>;
});

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

    const hasActiveSession = activeWorkout && activeWorkout.routine.id === id;
    const [loading, setLoading] = useState(!hasActiveSession);
    const [routine, setRoutine] = useState<Routine | null>(hasActiveSession ? activeWorkout.routine : null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
        activeWorkout?.dayIndex ?? (dayIndex ? parseInt(dayIndex) : 0)
    );

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

    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
    const flatListRef = useRef<any>(null);

    const isViewingActiveSession = activeWorkout
        && (routine || activeWorkout.routine)
        && (activeWorkout.routine.id === id || activeWorkout.routine.id === routine?.id)
        && activeWorkout.dayIndex === selectedDayIndex;

    const displayRoutine = isViewingActiveSession ? activeWorkout?.routine : routine;
    const currentDay = displayRoutine?.days.find((d: any) => d.dayIndex === selectedDayIndex);

    useEffect(() => {
        if (expandedExerciseId && currentDay?.exercises) {
            const index = currentDay.exercises.findIndex((e: any) => e.id === expandedExerciseId);
            if (index !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.3,
                    });
                }, 100);
            }
        }
    }, [expandedExerciseId, currentDay]);

    const openedRow = useRef<Swipeable | null>(null);
    const closeOpenedRow = useCallback(() => {
        if (openedRow.current) openedRow.current.close();
    }, []);

    const emptySet = useMemo(() => new Set<string>(), []);

    const handleToggleExpand = useCallback((exerciseId: string) => {
        setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
    }, []);

    const [replacementModalVisible, setReplacementModalVisible] = useState(false);
    const [exerciseToReplace, setExerciseToReplace] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<CatalogExercise[]>([]);
    const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);

    const translateY = useSharedValue(0);
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.4;
    const dismissScreen = () => router.back();

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationY > DISMISS_THRESHOLD) {
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
                    runOnJS(dismissScreen)();
                });
            } else {
                translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    useEffect(() => {
        if (!id) return;
        const interaction = InteractionManager.runAfterInteractions(() => {
            const loadData = async () => {
                if (!routine) {
                    try {
                        const data = await RoutineService.getRoutineById(id);
                        setRoutine(data);
                        setLoading(false);
                    } catch (error) {
                        setLoading(false);
                    }
                }
            };
            loadData();
        });
        return () => interaction.cancel();
    }, [id, routine]);

    const handleToggleSet = useCallback((exerciseId: string, setIndex: number, restSeconds: number) => {
        toggleSetComplete(exerciseId, setIndex);
        startRestTimer(restSeconds);
    }, [toggleSetComplete, startRestTimer]);

    const getLastSessionSet = useCallback((exerciseId: string, setIndex: number) => {
        if (!lastSession) return null;
        const exLog = lastSession.exercises.find(e => e.routineExerciseId === exerciseId);
        if (!exLog) return null;
        const foundSet = exLog.sets.find(s => s.setIndex === setIndex);
        if (!foundSet) return null;
        return { weight: foundSet.weight, reps: foundSet.reps };
    }, [lastSession]);

    const handleFinishWorkout = async () => {
        if (!routine || !auth.currentUser || !activeWorkout) return;
        setIsSaving(true);
        try {
            const currentDay = activeWorkout.routine.days.find((d) => d.dayIndex === selectedDayIndex);
            if (!currentDay) return;
            const exercisesLog: WorkoutExerciseLog[] = currentDay.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                routineExerciseId: ex.id,
                name: ex.name,
                targetSets: ex.sets.length,
                targetReps: ex.reps,
                sets: activeWorkout.logs[ex.id] || [],
            }));
            await WorkoutService.createWorkoutSession({
                userId: auth.currentUser.uid,
                routineId: routine.id,
                routineName: routine.name,
                dayIndex: selectedDayIndex,
                durationSeconds: Math.floor((Date.now() - (activeWorkout?.startTime || Date.now())) / 1000),
                exercises: exercisesLog,
            });
            finishWorkout();
            router.replace("/(tabs)/home" as any);
        } catch (error) {
            setIsSaving(true); // reset
            setIsSaving(false);
        }
    };

    const handleCancelWorkout = () => setShowCancelDialog(true);
    const confirmCancelWorkout = () => {
        setShowCancelDialog(false);
        cancelWorkout();
        router.back();
    };


    const handleInitiateReplace = (exerciseId: string) => {
        const currentDay = activeWorkout?.routine.days.find(d => d.dayIndex === activeWorkout.dayIndex);
        const exercise = currentDay?.exercises.find(e => e.id === exerciseId);
        if (exercise?.exerciseId) {
            setRecommendations(ExerciseRecommendationService.getRecommendedSubstitutes(exercise.exerciseId));
        }
        setExerciseToReplace(exerciseId);
        setReplacementModalVisible(true);
    };

    const handleConfirmReplace = (exercises: any[]) => {
        if (exerciseToReplace && exercises.length > 0) {
            const { exercise: newExercise, translatedName } = exercises[0];
            replaceExercise(exerciseToReplace, {
                id: newExercise.id,
                name: translatedName,
                targetZone: newExercise.primaryMuscles[0]
            });
        }
        setReplacementModalVisible(false);
    };

    const handleAddExercises = (exercises: any[]) => {
        exercises.forEach(({ exercise, translatedName }) => {
            addExerciseToSession({
                id: uuidv4(),
                exerciseId: exercise.id,
                name: translatedName,
                sets: [{ setIndex: 1, targetReps: 10, targetWeight: 0 }],
                reps: "10",
                restSeconds: 60,
                targetZone: exercise.primaryMuscles[0],
                notes: "",
                order: 0
            });
        });
        setAddExerciseModalVisible(false);
    };


    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<RoutineExercise>) => (
        <ScaleDecorator>
            <Swipeable
                renderRightActions={() => (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeExerciseFromSession(item.id)}
                    >
                        <Trash2 size={24} color={COLORS.error} />
                    </TouchableOpacity>
                )}
            >
                <TouchableOpacity onLongPress={drag} disabled={isActive} activeOpacity={1}>
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
    ), [activeWorkout?.logs, activeWorkout?.completedSets, expandedExerciseId, handleToggleExpand, logSet, handleToggleSet, addSet, getLastSessionSet, handleInitiateReplace, removeExerciseFromSession, emptySet]);

    return (
        /* @ts-ignore */
        <Animated.View
            style={[styles.container, { paddingTop: Math.max(insets.top, 20) }, animatedStyle]}
            entering={FadeIn.duration(300)}
        >
            {loading ? (
                <View style={styles.loaderContainer}><ActivityIndicator color={COLORS.primary} size="large" /></View>
            ) : !routine && !activeWorkout ? (
                <View style={styles.loaderContainer}><Text>{t('train.routine_not_found')}</Text></View>
            ) : (
                <>
                    <GestureDetector gesture={panGesture}>
                        <View style={styles.header}>
                            <View style={styles.dragHandle}><View style={styles.dragIndicator} /></View>
                            <View style={styles.headerTop}>
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    style={styles.minimizeButton}
                                >
                                    <Text style={styles.backButtonText}>↓ {t('train.minimize')}</Text>
                                </TouchableOpacity>

                                <View style={styles.timerWrapper}>
                                    <View style={styles.timerContainer}>
                                        <WorkoutTimerDisplay startTime={activeWorkout?.startTime ?? null} />
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.routineName}>{displayRoutine ? translateIfKey(displayRoutine.name) : ''}</Text>
                        </View>
                    </GestureDetector>

                    <DraggableFlatList
                        ref={flatListRef}
                        data={currentDay?.exercises || []}
                        onDragEnd={({ from, to }) => reorderExercises(from, to)}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
                        ListFooterComponent={
                            <TouchableOpacity style={styles.addExerciseButton} onPress={() => setAddExerciseModalVisible(true)}>
                                <Plus size={20} color={COLORS.primary} /><Text style={styles.addExerciseButtonText}>{t('train.add_exercise')}</Text>
                            </TouchableOpacity>
                        }
                    />

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                        <PrimaryButton title={t('train.finish_session')} onPress={handleFinishWorkout} loading={isSaving} />
                        <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelWorkoutButton}><Text style={styles.cancelWorkoutText}>{t('train.cancel_workout')}</Text></TouchableOpacity>
                    </View>
                </>
            )}
            <ConfirmDialog visible={showCancelDialog} onConfirm={confirmCancelWorkout} onCancel={() => setShowCancelDialog(false)} title={t('train.cancel_dialog.title')} message={t('train.cancel_dialog.message')} variant="danger" />
            <ExercisePickerModal visible={replacementModalVisible} onClose={() => setReplacementModalVisible(false)} onSelect={handleConfirmReplace} onCustomExercise={() => showToast.info(t('train.custom_exercise_hint') || "Selecciona un ejercicio existente")} recommendedExercises={recommendations} multiSelect={false} />
            <ExercisePickerModal visible={addExerciseModalVisible} onClose={() => setAddExerciseModalVisible(false)} onSelect={handleAddExercises} onCustomExercise={() => showToast.info(t('train.custom_exercise_hint') || "Selecciona un ejercicio existente")} multiSelect={true} />
        </Animated.View>
    );
};

export default TrainScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    dragHandle: { alignItems: 'center', paddingVertical: 8 },
    dragIndicator: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
    header: { paddingHorizontal: 24, paddingBottom: 16 },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center', // Center everything
        marginBottom: 12,
        height: 40,
        width: '100%',
    },
    minimizeButton: {
        position: 'absolute',
        left: 0,
        zIndex: 10,
    },
    timerWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    backButtonText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
    routineName: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary, marginTop: 4 },
    footer: { paddingHorizontal: 24, paddingTop: 16, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 },
    cancelWorkoutButton: { alignItems: "center", paddingVertical: 12 },
    cancelWorkoutText: { color: COLORS.error, fontWeight: "600", fontSize: 14 },
    timerContainer: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    timerText: { color: COLORS.primary, fontWeight: "700", fontSize: 16, fontVariant: ['tabular-nums'] },
    deleteButton: { backgroundColor: COLORS.error + '20', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: 16 },
    addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: 16, marginVertical: 16, gap: 8, backgroundColor: COLORS.surface },
    addExerciseButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' }
});
