import { useIsFocused } from '@react-navigation/native';
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckSquare, Edit3, Plus, Trash2 } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    LayoutAnimation,
    Platform,
    Animated as RNAnimated,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { Gesture, Swipeable } from "react-native-gesture-handler";
import Animated, {
    FadeInDown,
    FadeOut,
    LinearTransition,
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
import { useWorkout } from "../../../src/context/WorkoutContext";
import { useWorkoutTick, useWorkoutTimerContext } from "../../../src/context/WorkoutTimerContext";
import { ExerciseRecommendationService } from "../../../src/services/ExerciseRecommendationService";
import { auth } from "../../../src/services/firebaseConfig";
import { RoutineService } from "../../../src/services/routineService";
import { WorkoutService } from "../../../src/services/workoutService";
import { COLORS } from "../../../src/theme/theme";
import { CatalogExercise } from "../../../src/types/exercise";
import { Routine } from "../../../src/types/routine";
import { WorkoutExerciseLog, WorkoutSession } from "../../../src/types/workout";
import { MensHaptics } from "../../../src/utils/haptics";
import { showToast } from "../../../src/utils/toast";
import { translateIfKey } from "../../../src/utils/translationHelpers";

const WorkoutTimerDisplay: React.FC<{ startTime: number | null }> = memo(({ startTime }: { startTime: number | null }) => {
    const { elapsedTime } = useWorkoutTick();


    const formatElapsedTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return <Text style={styles.timerText}>{formatElapsedTime(elapsedTime)}</Text>;
});

// Skeleton UI for loading state - COLLAPSED style to match actual cards
const ExerciseCardSkeleton: React.FC = memo(() => (
    <View style={skeletonStyles.card}>
        <View style={skeletonStyles.header}>
            <View style={skeletonStyles.iconPlaceholder} />
            <View style={skeletonStyles.textContainer}>
                <View style={skeletonStyles.titleBar} />
                <View style={skeletonStyles.subtitleBar} />
            </View>
        </View>
    </View>
));

const WorkoutSkeleton: React.FC = memo(() => (
    <View style={skeletonStyles.container}>
        {[1, 2, 3, 4].map((i) => (
            <ExerciseCardSkeleton key={i} />
        ))}
    </View>
));

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

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
        replaceExercise,
        reorderExercises,
        addExerciseToSession,
        removeExerciseFromSession,
        setIsMinimized
    } = useWorkout();
    const { startRest } = useWorkoutTimerContext();
    const isFocused = useIsFocused();

    // Focus management: when entering screen, it's not minimized
    useEffect(() => {
        if (isFocused) {
            setIsMinimized(false);
        }
    }, [isFocused, setIsMinimized]);

    // ===== CRITICAL OPTIMIZATION: Immediate sync from context =====
    // When coming from ActiveWorkoutOverlay, data is already in context - use it immediately
    const hasActiveSession = activeWorkout && activeWorkout.routine.id === id;

    // Synchronous state initialization - no loading delay when context has data
    const [routine, setRoutine] = useState<Routine | null>(
        hasActiveSession ? activeWorkout.routine : null
    );
    const selectedDayIndex = hasActiveSession
        ? activeWorkout.dayIndex
        : (dayIndex ? parseInt(dayIndex) : 0);

    // ===== PROGRESSIVE RENDERING: Defer heavy list until transition completes =====
    // If we have active session data, render list immediately (coming from overlay)
    // Otherwise wait for transition (deep link case)
    const [isListReady, setIsListReady] = useState(hasActiveSession);

    useEffect(() => {
        if (isListReady) return; // Already ready, skip
        // For deep link case only - wait minimal time
        const timeout = setTimeout(() => {
            setIsListReady(true);
        }, 50); // Minimal delay, just let first paint happen
        return () => clearTimeout(timeout);
    }, []);

    // ===== Deep link fallback: Only fetch if no context data =====
    // This path is rarely taken - only for direct URL access
    const needsFirebaseFetch = !hasActiveSession && !routine;

    useEffect(() => {
        if (!needsFirebaseFetch || !id) return;

        let cancelled = false;

        // Fetch routine data for deep link case
        const fetchRoutine = async () => {
            try {
                const data = await RoutineService.getRoutineById(id);
                if (!cancelled && data) {
                    setRoutine(data);
                    startWorkout(data, selectedDayIndex);
                }
            } catch (error) {
                console.error('Failed to load routine:', error);
            }
        };

        fetchRoutine();

        return () => { cancelled = true; };
    }, [id, needsFirebaseFetch, selectedDayIndex, startWorkout]);

    // Derived values - memoized and computed synchronously from context
    const displayRoutine = hasActiveSession ? activeWorkout.routine : routine;
    const effectiveDayIndex = hasActiveSession ? activeWorkout.dayIndex : selectedDayIndex;

    const currentDay = useMemo(() =>
        displayRoutine?.days.find((d: any) => d.dayIndex === effectiveDayIndex),
        [displayRoutine, effectiveDayIndex]
    );

    const exercises = useMemo(() => currentDay?.exercises || [], [currentDay]);

    // All exercises collapsed by default - user expands manually
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);

    // Fetch Last Session for History Display
    useEffect(() => {
        const loadLastSession = async () => {
            if (routine?.id && auth.currentUser?.uid) {
                try {
                    // Fix: Use correct method name and pass selectedDayIndex
                    const session = await WorkoutService.getLastWorkoutSessionForRoutine(
                        auth.currentUser.uid,
                        routine.id,
                        selectedDayIndex
                    );
                    setLastSession(session);
                } catch (e) {
                    console.log("Error loading last session", e);
                }
            }
        };
        loadLastSession();
    }, [routine?.id, selectedDayIndex]);

    const [isSaving, setIsSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const flatListRef = useRef<any>(null);

    // Scroll to expanded exercise
    // Scroll to expanded exercise with centering logic
    useEffect(() => {
        if (expandedExerciseId && exercises.length > 0 && isListReady) {
            const index = exercises.findIndex((e: any) => e.id === expandedExerciseId);
            if (index !== -1) {
                // Wait slightly for layout change to begin
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.15, // Places it near top with breathing room
                    });
                }, 50);
            }
        }
    }, [expandedExerciseId, exercises, isListReady]);

    const emptySet = useMemo(() => new Set<string>(), []);

    const handleToggleExpand = useCallback((exerciseId: string) => {
        // Native LayoutAnimation for 100% smooth "Accordion" effect
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
    }, []);

    const [replacementModalVisible, setReplacementModalVisible] = useState(false);
    const [exerciseToReplace, setExerciseToReplace] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<CatalogExercise[]>([]);
    const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);

    // ===== Defer modal mounting until after list is ready =====
    const [modalsReady, setModalsReady] = useState(false);
    useEffect(() => {
        if (isListReady) {
            // Extra delay to ensure smooth list rendering first
            const timeout = setTimeout(() => setModalsReady(true), 300);
            return () => clearTimeout(timeout);
        }
    }, [isListReady]);

    const translateY = useSharedValue(0);
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.4;
    const VELOCITY_THRESHOLD = 800; // pixels per second - fast swipe
    const dismissScreen = () => router.back();

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) translateY.value = event.translationY;
        })
        .onEnd((event) => {
            // Dismiss if: crossed threshold OR fast swipe down
            const shouldDismiss =
                event.translationY > DISMISS_THRESHOLD ||
                (event.velocityY > VELOCITY_THRESHOLD && event.translationY > 50);

            if (shouldDismiss) {
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

    const handleToggleSet = useCallback((exerciseId: string, setIndex: number, restSeconds: number) => {
        const isNowCompleting = !activeWorkout?.completedSets.has(`${exerciseId}-${setIndex}`);

        toggleSetComplete(exerciseId, setIndex);
        MensHaptics.success();
        startRest(restSeconds);

        // Auto-advance logic: If this was the last set, move to next exercise
        if (isNowCompleting) {
            const exercise = exercises.find(e => e.id === exerciseId);
            if (exercise) {
                const exerciseSets = activeWorkout?.logs[exerciseId] || [];
                const allSetsDone = exerciseSets.every(s =>
                    s.setIndex === setIndex || activeWorkout?.completedSets.has(`${exerciseId}-${s.setIndex}`)
                );

                if (allSetsDone) {
                    // Small delay so user sees the checkmark before collapse
                    setTimeout(() => {
                        const currentIndex = exercises.findIndex(e => e.id === exerciseId);
                        // Find the next exercise that still has work to do
                        const nextExercise = exercises.slice(currentIndex + 1).find(e => {
                            const sets = activeWorkout?.logs[e.id] || [];
                            const isDone = sets.length > 0 && sets.every(s => activeWorkout?.completedSets.has(`${e.id}-${s.setIndex}`));
                            return !isDone;
                        });

                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setExpandedExerciseId(nextExercise ? nextExercise.id : null);
                    }, 400);
                }
            }
        }
    }, [toggleSetComplete, startRest, activeWorkout, exercises]);

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

    const flashListExtraData = useMemo(() => [
        activeWorkout?.logs,
        activeWorkout?.completedSets,
        expandedExerciseId,
        isEditMode
    ], [activeWorkout?.logs, activeWorkout?.completedSets, expandedExerciseId, isEditMode]);

    const renderFlashListItem = useCallback(({ item, index }: { item: any, index: number }) => (
        <TrainingListItem
            item={item}
            index={index}
            logs={activeWorkout?.logs[item.id] || []}
            isExpanded={expandedExerciseId === item.id}
            completedSets={activeWorkout?.completedSets || emptySet}
            onToggleExpand={handleToggleExpand}
            onLogSet={logSet}
            onToggleSetComplete={handleToggleSet}
            onAddSet={addSet}
            getLastSessionSet={getLastSessionSet}
            onReplace={handleInitiateReplace}
            onRemove={removeExerciseFromSession}
            onRemoveSet={removeSet}
        />
    ), [activeWorkout?.logs, activeWorkout?.completedSets, emptySet, expandedExerciseId, handleToggleExpand, logSet, handleToggleSet, addSet, getLastSessionSet, handleInitiateReplace, removeExerciseFromSession, removeSet]);

    const renderDraggableItem = useCallback(({ item, drag, isActive }: RenderItemParams<any>) => (
        <ScaleDecorator activeScale={1.03}>
            <View style={{ marginBottom: 4, opacity: isActive ? 0.8 : 1 }}>
                {/* In Edit Mode, we disable Swipeable to avoid gesture conflicts */}
                <WorkoutExerciseCard
                    exercise={item}
                    logs={activeWorkout?.logs[item.id] || []}
                    // Lock completed sets logic in edit mode if desired, or keep as is.
                    completedSets={activeWorkout?.completedSets || emptySet}
                    isExpanded={false} // Force collapsed in edit mode
                    onToggleExpand={() => { }} // Disable expand in edit mode
                    onLogSet={() => { }} // Disable editing
                    onToggleSetComplete={() => { }}
                    onAddSet={() => { }}
                    getLastSessionSet={() => null}
                    onReplace={() => { }}
                    onRemoveSet={() => { }}
                    onLongPress={drag} // Enable drag
                />
            </View>
        </ScaleDecorator>
    ), [activeWorkout?.logs, activeWorkout?.completedSets, emptySet]);




    return (
        /* @ts-ignore */
        <Animated.View
            style={[styles.container, { paddingTop: Math.max(insets.top, 20) }, animatedStyle]}
        // REMOVED: FadeIn.duration(300) - This was blocking the native slide animation
        >
            {!displayRoutine ? (
                // Only show full skeleton for deep link access without context data
                <WorkoutSkeleton />
            ) : (
                <>
                    {/* Header renders IMMEDIATELY - lightweight, no heavy components */}
                    <View style={styles.header}>
                        <View style={styles.dragHandle}><View style={styles.dragIndicator} /></View>
                        <View style={styles.headerTop}>
                            <TouchableOpacity
                                onPress={() => {
                                    MensHaptics.light();
                                    setIsMinimized(true);
                                    // Use explicit animation instead of pan gesture
                                    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
                                        runOnJS(router.back)();
                                    });
                                }}
                                style={styles.minimizeButton}
                            >
                                <Text style={styles.backButtonText}>↓ {t('train.minimize')}</Text>
                            </TouchableOpacity>

                            <View style={styles.timerWrapper}>
                                <View style={styles.timerContainer}>
                                    <WorkoutTimerDisplay startTime={activeWorkout?.startTime ?? null} />
                                </View>
                            </View>

                            {/* Edit Mode Toggle */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (isEditMode) {
                                        // Exit edit mode
                                        setIsEditMode(false);
                                    } else {
                                        // Enter edit mode - collapse all for better drag performance
                                        setExpandedExerciseId(null);
                                        setIsEditMode(true);
                                        MensHaptics.light();
                                        showToast.info(t('train.reorder_mode_active') || "Reorder Mode Active");
                                    }
                                }}
                                style={styles.editButton}
                            >
                                {isEditMode ? (
                                    <CheckSquare size={22} color={COLORS.primary} />
                                ) : (
                                    <Edit3 size={20} color={COLORS.textSecondary} />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.routineName}>{translateIfKey(displayRoutine.name)}</Text>
                    </View>

                    {/* OPTIMIZED: Dual List Engine - FlashList (View) / DraggableFlatList (Edit) */}
                    {isListReady ? (
                        isEditMode ? (
                            <DraggableFlatList
                                data={exercises}
                                keyExtractor={(item) => item.id}
                                onDragEnd={({ data }) => {
                                    reorderExercises(data.map(e => e.id));
                                }}
                                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}
                                activationDistance={10}
                                renderItem={renderDraggableItem}
                                ListFooterComponent={<View style={{ height: 80 }} />}
                            />
                        ) : (
                            // @ts-ignore - Force bypass broken type definition
                            <FlashList
                                ref={flatListRef}
                                data={exercises}
                                keyExtractor={(item: any) => item.id}
                                {...({ estimatedItemSize: 160 } as any)} // Force prop injection
                                extraData={flashListExtraData}
                                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}
                                removeClippedSubviews={true}
                                drawDistance={500} // Render ahead for smooth scroll
                                renderItem={renderFlashListItem}
                                // Native-side layout animation for item resizing/reordering
                                itemLayoutAnimation={LinearTransition}
                                ListFooterComponent={
                                    <TouchableOpacity
                                        style={styles.addExerciseButton}
                                        onPress={() => setAddExerciseModalVisible(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Plus size={20} color={COLORS.primary} />
                                        <Text style={styles.addExerciseButtonText}>{t('train.add_exercise')}</Text>
                                    </TouchableOpacity>
                                }
                            />
                        )
                    ) : (
                        <View style={{ flex: 1, paddingHorizontal: 24 }}>
                            <WorkoutSkeleton />
                        </View>
                    )}

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24), position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
                        <PrimaryButton title={t('train.finish_session')} onPress={handleFinishWorkout} loading={isSaving} />
                        <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelWorkoutButton}>
                            <Text style={styles.cancelWorkoutText}>{t('train.cancel_workout')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Defer heavy modals until after initial render to prioritize main UI */}
                    {modalsReady && (
                        <>
                            <ConfirmDialog visible={showCancelDialog} onConfirm={confirmCancelWorkout} onCancel={() => setShowCancelDialog(false)} title={t('train.cancel_dialog.title') || ""} message={t('train.cancel_dialog.message') || ""} variant="danger" />
                            <ExercisePickerModal visible={replacementModalVisible} onClose={() => setReplacementModalVisible(false)} onSelect={handleConfirmReplace} onCustomExercise={() => showToast.info(t('train.custom_exercise_hint') || "Selecciona un ejercicio existente")} recommendedExercises={recommendations} multiSelect={false} />
                            <ExercisePickerModal visible={addExerciseModalVisible} onClose={() => setAddExerciseModalVisible(false)} onSelect={handleAddExercises} onCustomExercise={() => showToast.info(t('train.custom_exercise_hint') || "Selecciona un ejercicio existente")} multiSelect={true} />
                        </>
                    )}
                </>
            )}
        </Animated.View>
    );
};

export default TrainScreen;

// Moved OUTSIDE TrainScreen for perfect memoization (prevents component re-creation)
const TrainingListItem = memo(({
    item, index, logs, isExpanded, completedSets, onToggleExpand,
    onLogSet, onToggleSetComplete, onAddSet, getLastSessionSet, onReplace, onRemove, onRemoveSet
}: any) => {
    const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>) => (
        <View style={styles.deleteActionContainer}>
            <RNAnimated.View
                style={[
                    styles.deleteActionInner,
                    {
                        opacity: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }]
                    }
                ]}
            >
                <Trash2 size={26} color="#FFFFFF" />
            </RNAnimated.View>
        </View>
    );

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            exiting={FadeOut.duration(300)}
            style={{ marginBottom: 12 }}
        >
            <Swipeable
                friction={2}
                enabled={!isExpanded} // Prevent swipe when expanded to avoid bugs
                rightThreshold={80} // increased threshold to prevent accidental deletes
                renderRightActions={renderRightActions}
                onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                        onRemove(item.id);
                        MensHaptics.success();
                    }
                }}
            >
                <WorkoutExerciseCard
                    exercise={item}
                    logs={logs}
                    completedSets={completedSets}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                    onLogSet={onLogSet}
                    onToggleSetComplete={onToggleSetComplete}
                    onAddSet={onAddSet}
                    getLastSessionSet={getLastSessionSet}
                    onReplace={onReplace}
                    onRemoveSet={onRemoveSet}
                />
            </Swipeable>
        </Animated.View>
    );
}, (prev, next) => {
    // Custom comparator for ultra-performance: only re-render if essential data changes
    return prev.isExpanded === next.isExpanded &&
        prev.logs === next.logs &&
        prev.completedSets === next.completedSets &&
        prev.item.id === next.item.id;
});

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
        // Positioned absolutely left
        position: 'absolute',
        left: 0,
        zIndex: 10,
        padding: 8,
    },
    editButton: {
        position: 'absolute',
        right: 0,
        zIndex: 10,
        padding: 8,
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
    deleteActionContainer: {
        backgroundColor: COLORS.error,
        justifyContent: 'center',
        alignItems: 'flex-end',
        flex: 1,
        borderRadius: 16,
        // Match card margin - 12 from container - card internal 12? 
        // We'll set card margin to 0 and handle it in the container for perfect alignment
    },
    deleteActionInner: {
        paddingRight: 24,
        justifyContent: 'center',
        height: '100%'
    },
    addExerciseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: 16, marginVertical: 16, gap: 8, backgroundColor: COLORS.surface },
    addExerciseButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' }
});

// Skeleton styles for loading state - matches collapsed card style
const skeletonStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        width: '100%',
    },
    card: {
        backgroundColor: 'transparent',
        paddingVertical: 10,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        opacity: 0.7,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    titleBar: {
        height: 16,
        width: '60%',
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        opacity: 0.6,
        marginBottom: 6,
    },
    subtitleBar: {
        height: 12,
        width: '30%',
        borderRadius: 6,
        backgroundColor: COLORS.surface,
        opacity: 0.4,
    },
});

