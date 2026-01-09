import { ArrowLeftRight, Check, Dumbbell, Info, Plus } from "lucide-react-native";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
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
    onToggleExpand: () => void;
    onLogSet: (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => void;
    onToggleSetComplete: (exerciseId: string, setIndex: number, restSeconds: number) => void;
    onAddSet: (exerciseId: string) => void;
    getLastSessionSet: (exerciseId: string, setIndex: number) => { weight: number; reps: number } | null;
    onReplace: (exerciseId: string) => void;
}

// Memoized Set Row Component
const SetRow = memo(({
    set,
    index,
    isCompleted,
    lastSet,
    exerciseId,
    onLogSet,
    onToggleSet,
    restSeconds // Add restSeconds prop
}: {
    set: WorkoutSetLog;
    index: number;
    isCompleted: boolean;
    lastSet: { weight: number; reps: number } | null;
    exerciseId: string;
    onLogSet: (exerciseId: string, setIndex: number, field: "weight" | "reps", value: number) => void;
    onToggleSet: (setIndex: number) => void;
    restSeconds: number;
}) => {
    return (
        <View style={[
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
                    onLogSet(exerciseId, set.setIndex, "weight", parseFloat(val) || 0)
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
                    onLogSet(exerciseId, set.setIndex, "reps", parseFloat(val) || 0)
                }
                editable={!isCompleted}
            />

            <TouchableOpacity
                onPress={() => onToggleSet(set.setIndex)}
                style={[styles.checkButton, isCompleted && styles.checkButtonActive]}
            >
                <Check size={16} color={isCompleted ? COLORS.textInverse : COLORS.textSecondary} />
            </TouchableOpacity>
        </View>
    );
}, (prev, next) => {
    // Deep comparison for lastSet because the parent creates a new object every time
    const lastSetEqual =
        (prev.lastSet === null && next.lastSet === null) ||
        (prev.lastSet !== null && next.lastSet !== null &&
            prev.lastSet.weight === next.lastSet.weight &&
            prev.lastSet.reps === next.lastSet.reps);

    return (
        prev.isCompleted === next.isCompleted &&
        prev.set.weight === next.set.weight &&
        prev.set.reps === next.set.reps &&
        prev.set.setIndex === next.set.setIndex &&
        lastSetEqual &&
        prev.onToggleSet === next.onToggleSet && // Should be stable via useCallback
        prev.onLogSet === next.onLogSet && // Should be stable via Context
        prev.restSeconds === next.restSeconds
    );
});

const WorkoutExerciseCardComponent: React.FC<WorkoutExerciseCardProps> = ({
    exercise,
    logs,
    completedSets,
    isExpanded,
    onToggleExpand,
    onLogSet,
    onToggleSetComplete,
    onAddSet,
    getLastSessionSet,
    onReplace,
}) => {
    const { t } = useTranslation();

    // PERFORMANCE: Pre-calculate completion count
    const completedCount = useMemo(() =>
        logs.filter((set) => completedSets.has(`${exercise.id}-${set.setIndex}`)).length,
        [logs, completedSets, exercise.id]
    );
    const totalSets = logs.length;

    // PERFORMANCE: Pre-calculate set data to avoid recalculation during map
    const setData = useMemo(() =>
        logs.map((set, index) => ({
            set,
            index,
            isCompleted: completedSets.has(`${exercise.id}-${set.setIndex}`),
            lastSet: getLastSessionSet(exercise.id, set.setIndex),
        })),
        [logs, completedSets, exercise.id, getLastSessionSet]
    );

    const handleToggleSet = useCallback((setIndex: number) => {
        const key = `${exercise.id}-${setIndex}`;
        const wasCompleted = completedSets.has(key);

        onToggleSetComplete(exercise.id, setIndex, exercise.restSeconds);

        if (!wasCompleted) {
            MensHaptics.medium();
        }
    }, [exercise.id, exercise.restSeconds, completedSets, onToggleSetComplete]);

    const handleToggleExpand = useCallback(() => {
        MensHaptics.light();
        onToggleExpand();
    }, [onToggleExpand]);

    return (
        <View style={[
            styles.exerciseRow,
            isExpanded && styles.exerciseRowExpanded
        ]}>
            {/* Collapsible Header */}
            <TouchableOpacity
                style={[
                    styles.exerciseCollapsibleHeader,
                    isExpanded && styles.headerExpanded
                ]}
                onPress={handleToggleExpand}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeftTrain}>
                    {/* Thumbnail placeholder - will hold exercise preview image */}
                    <View style={styles.thumbnailBox}>
                        <Dumbbell size={20} color={COLORS.textSecondary} />
                    </View>
                    <View style={styles.headerInfoTrain}>
                        <Text style={styles.exerciseNameHeader} numberOfLines={1}>
                            {translateIfKey(exercise.name, t)}
                        </Text>
                        <Text style={styles.exerciseMetaTrain}>
                            {completedCount}/{totalSets} {t('train.set')}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onReplace(exercise.id);
                        }}
                        style={styles.actionButtonHeader}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeftRight size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {exercise.notes && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                showToast.info(exercise.notes || "");
                            }}
                            style={styles.actionButtonHeader}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Info size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            {/* Expandable Content with Lyfta-style fast fade */}
            {isExpanded && (
                <Animated.View
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(100)}
                    style={styles.exerciseExpandedContent}
                >
                    <View style={styles.setsHeader}>
                        <Text style={[styles.colHeader, { width: 40 }]}>{t('train.set')}</Text>
                        <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.prev')}</Text>
                        <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.kg')}</Text>
                        <Text style={[styles.colHeader, { flex: 1 }]}>{t('train.reps')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {setData.map(({ set, index, isCompleted, lastSet }) => (
                        <SetRow
                            key={set.setIndex}
                            set={set}
                            index={index}
                            isCompleted={isCompleted}
                            lastSet={lastSet}
                            exerciseId={exercise.id}
                            onLogSet={onLogSet}
                            onToggleSet={handleToggleSet}
                            restSeconds={exercise.restSeconds}
                        />
                    ))}

                    <TouchableOpacity
                        style={styles.addSetButton}
                        onPress={() => {
                            MensHaptics.light();
                            onAddSet(exercise.id);
                        }}
                    >
                        <Plus size={16} color={COLORS.primary} />
                        <Text style={styles.addSetText}>{t('train.add_set')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
};

// Memoized export to prevent re-renders when parent state changes
export const WorkoutExerciseCard = memo(WorkoutExerciseCardComponent, (prevProps, nextProps) => {
    // Performance optimization: only re-render if something relevant changed for THIS component
    if (prevProps.exercise.id !== nextProps.exercise.id) return false;
    if (prevProps.isExpanded !== nextProps.isExpanded) return false;
    if (prevProps.logs !== nextProps.logs) return false;

    // Check if completion status actually changed for this specific exercise
    const prevCount = prevProps.logs.filter((s: any) => prevProps.completedSets.has(`${prevProps.exercise.id}-${s.setIndex}`)).length;
    const nextCount = nextProps.logs.filter((s: any) => nextProps.completedSets.has(`${nextProps.exercise.id}-${s.setIndex}`)).length;

    if (prevCount !== nextCount) return false;

    return true;
});

const styles = StyleSheet.create({
    // Collapsed: minimal row with bottom border only
    exerciseRow: {
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 12,
        paddingHorizontal: 0,
    },
    // Expanded: full card appearance
    exerciseRowExpanded: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginVertical: 8,
    },
    exerciseCollapsibleHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 0,
    },
    headerExpanded: {
        paddingBottom: 16,
    },
    headerLeftTrain: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    thumbnailBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        justifyContent: "center",
        alignItems: "center",
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonHeader: {
        padding: 8,
        marginLeft: 4,
    },
    exerciseExpandedContent: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 16,
    },
    hiddenContent: {
        height: 0,
        overflow: 'hidden',
        paddingTop: 0,
        borderTopWidth: 0,
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
    setNumberContainer: {
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    setNumber: {
        color: COLORS.textSecondary,
        fontWeight: "600",
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
});
