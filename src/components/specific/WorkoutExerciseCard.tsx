import { ArrowLeftRight, Check, Dumbbell, GripVertical, Info, Plus } from "lucide-react-native";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
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
    onLongPress?: () => void; // For drag-and-drop
}

// Fixed heights for reliable animation
const ROW_HEIGHT = 54;
const HEADER_HEIGHT = 40;
// Isolated Input Component to prevent re-renders while typing
const IsolatedInput = memo(({
    value,
    onChange,
    placeholder,
    isCompleted
}: {
    value: number;
    onChange: (val: number) => void;
    placeholder: string;
    isCompleted: boolean;
}) => {
    // Initial value from props
    const [localValue, setLocalValue] = React.useState(value > 0 ? value.toString() : "");

    // Sync from props if external change happens (e.g. initial load or reset)
    // We only update if the prop value is significantly different to avoid cursor jumps,
    // but here we mostly rely on local state for the typing session.
    React.useEffect(() => {
        setLocalValue(value > 0 ? value.toString() : "");
    }, [value]);

    const handleChangeText = (text: string) => {
        // Allow decimals
        setLocalValue(text);
    };

    const handleEndEditing = () => {
        const num = parseFloat(localValue);
        if (!isNaN(num) && num !== value) {
            onChange(num);
        } else if (localValue === "" && value !== 0) {
            onChange(0);
        }
    };

    return (
        <TextInput
            style={[styles.input, isCompleted && styles.inputCompleted]}
            keyboardType="numeric"
            value={localValue}
            onChangeText={handleChangeText}
            onEndEditing={handleEndEditing}
            editable={!isCompleted}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textTertiary}
            selectTextOnFocus
        />
    );
});

// Optimized SetRow - Uses IsolatedInput
const SetRow = memo(({ set, index, isCompleted, lastSet, exerciseId, onLogSet, onToggleSet }: any) => {
    // Memoized handlers to avoid re-creating functions for IsolatedInput
    const handleWeightChange = useCallback((val: number) => {
        onLogSet(exerciseId, set.setIndex, "weight", val);
    }, [exerciseId, set.setIndex, onLogSet]);

    const handleRepsChange = useCallback((val: number) => {
        onLogSet(exerciseId, set.setIndex, "reps", val);
    }, [exerciseId, set.setIndex, onLogSet]);

    return (
        <View style={[styles.setRow, isCompleted && styles.setRowCompleted]}>
            <View style={styles.setNumberContainer}><Text style={styles.setNumber}>{index + 1}</Text></View>
            <View style={styles.historyContainer}>
                <Text style={styles.historyText}>{lastSet ? `${lastSet.weight}kg x ${lastSet.reps}` : "-"}</Text>
            </View>

            <IsolatedInput
                value={set.weight}
                onChange={handleWeightChange}
                placeholder="0"
                isCompleted={isCompleted}
            />

            <IsolatedInput
                value={set.reps}
                onChange={handleRepsChange}
                placeholder="0"
                isCompleted={isCompleted}
            />

            <TouchableOpacity
                onPress={() => onToggleSet(set.setIndex)}
                style={[styles.checkButton, isCompleted && styles.checkButtonActive]}
                activeOpacity={0.7}
            >
                <Check size={16} color={isCompleted ? COLORS.textInverse : COLORS.textSecondary} />
            </TouchableOpacity>
        </View>
    );
});

const FOOTER_HEIGHT = 60;

const WorkoutExerciseCardComponent: React.FC<WorkoutExerciseCardProps> = ({
    exercise, logs, completedSets, isExpanded, onToggleExpand, onLogSet, onToggleSetComplete, onAddSet, getLastSessionSet, onReplace, onLongPress,
}) => {
    const { t } = useTranslation();

    const doneCount = useMemo(() =>
        logs.filter(s => completedSets.has(`${exercise.id}-${s.setIndex}`)).length
        , [logs.length, completedSets.size]);

    // Exact height calculation
    const contentHeight = (logs.length * ROW_HEIGHT) + HEADER_HEIGHT + FOOTER_HEIGHT;

    // Use SharedValue for height interpolation
    const progress = useSharedValue(isExpanded ? 1 : 0);

    // STABLE ANIMATION: Using withTiming avoids spring oscillation bugs
    React.useEffect(() => {
        progress.value = withTiming(isExpanded ? 1 : 0, {
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Standard, predictable ease
        });
    }, [isExpanded]);

    const contentStyle = useAnimatedStyle(() => ({
        height: progress.value * contentHeight,
        opacity: progress.value,
        overflow: 'hidden',
    }));

    // Simplify container animation to avoid List layout thrashing
    const containerStyle = useAnimatedStyle(() => ({
        backgroundColor: isExpanded ? COLORS.card : COLORS.background,
        // Removed dynamic margins to prevent jumping
        borderWidth: isExpanded ? 1 : 0,
        borderColor: isExpanded ? COLORS.border : 'transparent',
        borderRadius: isExpanded ? 16 : 0,
        paddingHorizontal: isExpanded ? 16 : 0,
        marginBottom: 8, // Fixed margin
    }));

    return (
        <Animated.View style={[styles.containerBase, containerStyle]}>
            <View style={styles.headerRow}>
                {/* Drag Handle */}
                {onLongPress && (
                    <TouchableOpacity
                        onPressIn={onLongPress}
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
                    activeOpacity={1}
                    delayPressIn={0}
                    style={[styles.header, isExpanded && styles.headerExpanded, { flex: 1 }]}
                >
                    <View style={styles.headerLeft}>
                        <View style={styles.iconBox}><Dumbbell size={20} color={COLORS.textSecondary} /></View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.title} numberOfLines={1}>{translateIfKey(exercise.name, t)}</Text>
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
                </TouchableOpacity>
            </View>

            <Animated.View style={contentStyle}>
                <View style={styles.setsHeader}>
                    <Text style={[styles.colHeader, { width: 40 }]}>{t('train.set')}</Text>
                    <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.prev')}</Text>
                    <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.kg')}</Text>
                    <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.reps')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {logs.map((set, index) => (
                    <SetRow
                        key={set.setIndex}
                        set={set}
                        index={index}
                        isCompleted={completedSets.has(`${exercise.id}-${set.setIndex}`)}
                        lastSet={getLastSessionSet(exercise.id, set.setIndex)}
                        exerciseId={exercise.id}
                        onLogSet={onLogSet}
                        onToggleSet={(idx: any) => onToggleSetComplete(exercise.id, idx, exercise.restSeconds)}
                    />
                ))}

                <TouchableOpacity style={styles.addSetButton} onPress={() => onAddSet(exercise.id)}>
                    <Plus size={16} color={COLORS.primary} /><Text style={styles.addSetText}>{t('train.add_set')}</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

export const WorkoutExerciseCard = memo(WorkoutExerciseCardComponent, (prev, next) => {
    if (prev.isExpanded !== next.isExpanded) return false;
    if (prev.exercise.id !== next.exercise.id) return false;
    if (prev.logs.length !== next.logs.length) return false;
    const prevDone = prev.logs.filter(s => prev.completedSets.has(`${prev.exercise.id}-${s.setIndex}`)).length;
    const nextDone = next.logs.filter(s => next.completedSets.has(`${next.exercise.id}-${s.setIndex}`)).length;
    return prevDone === nextDone;
});

const styles = StyleSheet.create({
    containerBase: { width: '100%', overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    dragHandle: { paddingVertical: 16, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 60, paddingVertical: 10 },
    headerExpanded: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
    headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginRight: 12 },
    headerInfo: { flex: 1 },
    title: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 2 },
    subtitle: { fontSize: 12, color: COLORS.textSecondary },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, marginLeft: 4 },
    setsHeader: { flexDirection: "row", marginBottom: 8, marginTop: 16, height: 20 },
    colHeader: { fontSize: 11, fontWeight: "700", color: COLORS.textTertiary, textTransform: "uppercase", textAlign: "center" },
    setRow: { flexDirection: "row", alignItems: "center", height: 54, gap: 12 },
    setRowCompleted: { opacity: 0.5 },
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
