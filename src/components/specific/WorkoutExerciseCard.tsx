import { ArrowLeftRight, Check, Dumbbell, GripVertical, Info, Plus, Trash2 } from "lucide-react-native";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    Animated as RNAnimated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Swipeable, TextInput } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { COLORS } from "../../theme/theme";
import { RoutineExercise } from "../../types/routine";
import { WorkoutSetLog } from "../../types/workout";
import { MensHaptics } from '../../utils/haptics';
import { showToast } from "../../utils/toast";
import { translateIfKey } from "../../utils/translationHelpers";

interface WorkoutExerciseCardProps {
    exercise: RoutineExercise;
    logs: WorkoutSetLog[];
    completedSets: Set<string>;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onLogSet: (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => void;
    onToggleSetComplete: (exerciseId: string, setIndex: number, restSeconds: number) => void;
    onAddSet: (exerciseId: string) => void;
    getLastSessionSet: (exerciseId: string, setIndex: number) => { weight: number; reps: number } | null;
    onReplace: (exerciseId: string) => void;
    onRemoveSet: (exerciseId: string, setIndex: number) => void;
    onLongPress?: () => void; // For drag-and-drop
}

// Fixed heights for reliable height-thread animation (decoupling from JS mounting)
const HEADER_H = 60;
const SETS_HEADER_H = 44;
const ROW_H = 54;
const FOOTER_H = 76;

// Isolated Input Component - Supports external updates
const IsolatedInput = memo(({
    initialValue,
    onChange,
    placeholder,
    isCompleted,
    testID
}: {
    initialValue: number;
    onChange: (val: number) => void;
    placeholder: string;
    isCompleted: boolean;
    testID?: string;
}) => {
    const [localValue, setLocalValue] = React.useState(initialValue > 0 ? initialValue.toString() : "");

    // Sync with external changes (e.g. "Copy Previous" or external updates)
    React.useEffect(() => {
        const numVal = parseFloat(localValue.replace(',', '.') || '0');
        if (numVal !== initialValue) {
            setLocalValue(initialValue > 0 ? initialValue.toString() : "");
        }
    }, [initialValue]);

    const handleChangeText = (text: string) => {
        setLocalValue(text);
    };

    const handleEndEditing = () => {
        const num = parseFloat(localValue.replace(',', '.'));
        if (!isNaN(num)) {
            onChange(num);
        } else if (localValue === "" && initialValue !== 0) {
            onChange(0);
        }
    };

    return (
        <TextInput
            testID={testID}
            style={[styles.input, isCompleted && styles.inputCompleted]}
            keyboardType="numeric"
            value={localValue}
            onChangeText={handleChangeText}
            onEndEditing={handleEndEditing}
            editable={!isCompleted}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textTertiary}
            selectTextOnFocus
            textContentType="none"
            autoComplete="off"
        />
    );
});

// SetRow - Simple and reliable
const SetRow = memo(({ set, index, isCompleted, isActive, lastSet, exerciseId, onLogSet, onToggleSet, onRemove }: any) => {
    const [localComplete, setLocalComplete] = React.useState(isCompleted);

    const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
        const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.2],
            extrapolate: 'clamp',
        });

        const opacity = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
        });

        return (
            <View style={styles.deleteActionContainer}>
                <RNAnimated.View style={[styles.deleteActionContent, { opacity, transform: [{ scale }] }]}>
                    <Trash2 size={22} color="white" />
                </RNAnimated.View>
            </View>
        );
    };

    // Sync with parent state
    React.useEffect(() => {
        if (localComplete !== isCompleted) setLocalComplete(isCompleted);
    }, [isCompleted]);

    const handleWeightChange = useCallback((val: number) => {
        onLogSet(exerciseId, set.setIndex, "weight", val);
    }, [exerciseId, set.setIndex, onLogSet]);

    const handleRepsChange = useCallback((val: number) => {
        onLogSet(exerciseId, set.setIndex, "reps", val);
    }, [exerciseId, set.setIndex, onLogSet]);

    const handleToggle = () => {
        // 1. OPTIMISTIC UPDATE: Update Visuals IMMEDIATELY (0ms delay)
        const next = !localComplete;
        setLocalComplete(next);

        // 2. Feedback
        if (next) {
            MensHaptics.success();
        } else {
            MensHaptics.light();
        }

        // 3. Defer Logic: Let the paint finish before hitting the Context/Storage
        // This prevents the "heavy" logic from blocking the visual toggle
        requestAnimationFrame(() => {
            onToggleSet(set.setIndex);
        });
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            rightThreshold={30}
            friction={1.5}
            overshootFriction={8}
            activeOffsetX={[-15, 15]} // Allow horizontal swipe to register even over inputs
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    MensHaptics.medium(); // Medium haptic for delete confirmation
                    onRemove(set.setIndex);
                }
            }}
            containerStyle={{ overflow: 'visible' }}
        >

            <View style={{ backgroundColor: COLORS.card, borderRadius: 27 }}>
                <View style={[
                    styles.setRow,
                    isActive && styles.setRowActive,
                    localComplete && styles.setRowCompleted
                ]}>
                    <View style={styles.setNumberContainer}><Text style={styles.setNumber}>{index + 1}</Text></View>
                    <View style={styles.historyContainer}>
                        <Text style={styles.historyText}>{lastSet ? `${lastSet.weight}kg x ${lastSet.reps}` : "-"}</Text>
                    </View>

                    <IsolatedInput
                        initialValue={set.weight}
                        onChange={handleWeightChange}
                        placeholder="0"
                        isCompleted={localComplete}
                    />

                    <IsolatedInput
                        initialValue={set.reps}
                        onChange={handleRepsChange}
                        placeholder="0"
                        isCompleted={localComplete}
                    />

                    <Pressable
                        onPress={handleToggle}
                        hitSlop={8}
                    >
                        <View style={[styles.checkButton, localComplete && styles.checkButtonActive]}>
                            <Check size={16} color={localComplete ? COLORS.textInverse : COLORS.textSecondary} />
                        </View>
                    </Pressable>

                </View>
            </View>
        </Swipeable >
    );
}, (prev, next) => {
    // Standard optimization
    return prev.isCompleted === next.isCompleted &&
        prev.isActive === next.isActive &&
        prev.set.weight === next.set.weight &&
        prev.set.reps === next.set.reps &&
        prev.set.setIndex === next.set.setIndex &&
        prev.exerciseId === next.exerciseId;
});

const WorkoutExerciseCardComponent: React.FC<WorkoutExerciseCardProps> = ({
    exercise, logs, completedSets, isExpanded, onToggleExpand, onLogSet, onToggleSetComplete, onRemoveSet, onAddSet, getLastSessionSet, onReplace, onLongPress,
}) => {
    const { t } = useTranslation();
    // Removed InteractionManager delay - render sets immediately for instant feel
    const isContentReady = true;

    // OPTIMISTIC ACTIVE SET: Calculate initial state from props...
    const [optimisticCompleted, setOptimisticCompleted] = React.useState<Set<string>>(completedSets);

    // Sync with props when they eventually update (server confirmed)
    React.useEffect(() => {
        setOptimisticCompleted(completedSets);
    }, [completedSets]);

    // Derived from LOCAL optimistic state (0ms latency for grey highlight)
    // const activeSetIndex = useMemo(() => {
    //    return logs.findIndex(s => !optimisticCompleted.has(`${exercise.id}-${s.setIndex}`));
    // }, [logs, optimisticCompleted, exercise.id]);

    // Handler for immediate local updates from children
    const handleOptimisticToggle = useCallback((setIndex: number, isComplete: boolean) => {
        setOptimisticCompleted(prev => {
            const next = new Set(prev);
            const key = `${exercise.id}-${setIndex}`;
            if (isComplete) next.add(key);
            else next.delete(key);
            return next;
        });
    }, [exercise.id]);

    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const containerStyle = useAnimatedStyle(() => ({
        backgroundColor: withTiming(isExpanded ? COLORS.card : COLORS.background, { duration: 200 }),
        borderColor: withTiming(isExpanded ? COLORS.border : 'transparent', { duration: 200 }),
    }));

    const headerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderBottomColor: withTiming(isExpanded ? COLORS.border : 'transparent', { duration: 200 }),
        paddingBottom: withTiming(isExpanded ? 10 : 0, { duration: 200 }),
    }));

    const doneCount = useMemo(() =>
        logs.filter(s => optimisticCompleted.has(`${exercise.id}-${s.setIndex}`)).length
        , [logs.length, optimisticCompleted]);

    return (
        <Animated.View style={[styles.containerBase, containerStyle]}>
            <View style={styles.headerRow}>
                {onLongPress && (
                    <TouchableOpacity
                        onLongPress={onLongPress}
                        delayLongPress={150} // Quick but intentional
                        style={styles.dragHandle}
                        activeOpacity={0.6}
                    >
                        <GripVertical size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => {
                        MensHaptics.light();
                        onToggleExpand(exercise.id);
                    }}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                    style={{ flex: 1 }}
                >
                    <Animated.View style={[styles.header, headerStyle]}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconBox}>
                                <Dumbbell size={20} color={COLORS.textSecondary} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {translateIfKey(exercise.name, t)}
                                </Text>
                                <Text style={styles.subtitle}>{doneCount}/{logs.length} {t('train.set')}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onReplace(exercise.id); }} style={styles.actionBtn}>
                                <ArrowLeftRight size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            {exercise.notes && (
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); showToast.info(exercise.notes || ""); }} style={styles.actionBtn}>
                                    <Info size={18} color={COLORS.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </View>
            {/* Native Accordion */}
            <View
                style={[
                    styles.contentWrapper,
                    {
                        display: isExpanded ? 'flex' : 'none',
                        opacity: isExpanded ? 1 : 0,
                    }
                ]}
            >
                {(isExpanded || isContentReady) && (
                    <View style={styles.contentContainer}>
                        <View style={styles.setsHeader}>
                            <Text style={[styles.colHeader, { width: 40 }]}>{t('train.set')}</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.prev')}</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.kg')}</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.reps')}</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {logs.map((set, index) => (
                            <View
                                key={`${exercise.exerciseId}-${set.setIndex}`}
                                style={{ marginVertical: 4 }}
                            >
                                <SetRow
                                    set={set}
                                    index={index}
                                    isCompleted={optimisticCompleted.has(`${exercise.id}-${set.setIndex}`)}
                                    isActive={false} // Feature disabled for performance
                                    lastSet={getLastSessionSet(exercise.id, set.setIndex)}
                                    exerciseId={exercise.id}
                                    onLogSet={onLogSet}
                                    onToggleSet={(idx: any) => {
                                        // 1. Notify Parent Optimistically (Updates Grey Highlight)
                                        const isNowComplete = !optimisticCompleted.has(`${exercise.id}-${idx}`);
                                        handleOptimisticToggle(idx, isNowComplete);

                                        // 2. Trigger Real Logic
                                        onToggleSetComplete(exercise.id, idx, exercise.restSeconds);
                                    }}
                                    onRemove={(idx: number) => onRemoveSet(exercise.id, idx)}
                                />
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addSetButton}
                            onPress={() => onAddSet(exercise.id)}
                            activeOpacity={0.7}
                        >
                            <Plus size={16} color={COLORS.primary} />
                            <Text style={styles.addSetText}>{t('train.add_set')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

const arePropsEqual = (prev: WorkoutExerciseCardProps, next: WorkoutExerciseCardProps) => {
    // Critical: Keep this extremely tight to avoid unnecessary re-renders during high-freq taps
    if (prev.isExpanded !== next.isExpanded) return false;
    if (prev.exercise.id !== next.exercise.id) return false;
    // We only re-render if logs length changes or specific completion status for THIS exercise changes
    if (prev.logs.length !== next.logs.length) return false;

    // Quick check: total completion count
    const prevDone = prev.logs.filter(s => prev.completedSets.has(`${prev.exercise.id}-${s.setIndex}`)).length;
    const nextDone = next.logs.filter(s => next.completedSets.has(`${next.exercise.id}-${s.setIndex}`)).length;
    if (prevDone !== nextDone) return false;

    // Deep check only if counts are same but specific sets might have changed
    for (const log of prev.logs) {
        if (prev.completedSets.has(`${prev.exercise.id}-${log.setIndex}`) !==
            next.completedSets.has(`${next.exercise.id}-${log.setIndex}`)) {
            return false;
        }
        // Also check values to ensure input sync
        if (log.weight !== next.logs.find(l => l.setIndex === log.setIndex)?.weight ||
            log.reps !== next.logs.find(l => l.setIndex === log.setIndex)?.reps) {
            return false;
        }
    }

    return true;
};

export const WorkoutExerciseCard = memo(WorkoutExerciseCardComponent, arePropsEqual);

const styles = StyleSheet.create({
    containerBase: {
        width: '100%',
        overflow: 'hidden',
        borderWidth: 1,
        borderRadius: 16,
        // Removed root padding to allow highlights to span wider without horizontal clipping
    },
    contentWrapper: { width: '100%' }, // Removed overflow: hidden to prevent clipping pills
    contentContainer: { paddingBottom: 16, paddingHorizontal: 16 }, // Padding moved here
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, // Padding moved here
    deleteActionContainer: {
        width: 80,
        height: '100%',
        backgroundColor: COLORS.error,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 27, // Match row rounding
        borderBottomRightRadius: 27,
    },
    deleteActionContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragHandle: { paddingVertical: 16, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        paddingVertical: 10,
        borderBottomWidth: 1, // Static width, color animated for performance
    },
    headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginRight: 12 },
    headerInfo: { flex: 1 },
    title: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 2 },
    subtitle: { fontSize: 12, color: COLORS.textSecondary },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginLeft: 4 },
    setsHeader: { flexDirection: "row", marginBottom: 8, marginTop: 16, height: 20 },
    colHeader: { fontSize: 11, fontWeight: "700", color: COLORS.textTertiary, textTransform: "uppercase", textAlign: "center" },
    setRow: {
        flexDirection: "row",
        alignItems: "center",
        height: 54,
        gap: 8, // Reduced from 12
        paddingHorizontal: 12, // Reduced from 16
        borderRadius: 27, // Perfect pill shape
        marginHorizontal: -8, // Expand backgrounds into the content padding for "floating" look
        overflow: 'hidden',
    },
    setRowActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Significantly lighter than background
    },
    setRowCompleted: {
        backgroundColor: 'rgba(74, 222, 128, 0.15)', // Light green tint
        opacity: 0.9 // Keep opacity high enough to see color, but content slightly dimmed
    },
    setNumberContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
    setNumber: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 12 },
    historyContainer: { flex: 1, alignItems: "center" },
    historyText: { fontSize: 11, color: COLORS.textTertiary, fontVariant: ["tabular-nums"] },
    input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 6, paddingVertical: 8, color: COLORS.textPrimary, textAlign: "center", fontSize: 16, fontWeight: "600" },
    inputCompleted: { backgroundColor: 'transparent', color: COLORS.textSecondary },
    checkButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
    checkButtonActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    addSetButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 44, gap: 8, marginTop: 16, borderRadius: 8, backgroundColor: COLORS.surface + '40' },
    addSetText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
});
