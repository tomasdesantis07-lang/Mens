import * as Haptics from "expo-haptics";
import { ArrowLeftRight, Check, ChevronDown, ChevronUp, Info, Plus } from "lucide-react-native";
import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../theme/theme";
import { RoutineExercise } from "../../types/routine";
import { WorkoutSetLog } from "../../types/workout";
import { showToast } from "../../utils/toast";

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

    const completedCount = logs.filter((set) =>
        completedSets.has(`${exercise.id}-${set.setIndex}`)
    ).length;
    const totalSets = logs.length;

    const handleToggleSet = useCallback((setIndex: number) => {
        const key = `${exercise.id}-${setIndex}`;
        const wasCompleted = completedSets.has(key);

        onToggleSetComplete(exercise.id, setIndex, exercise.restSeconds);

        if (!wasCompleted) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, [exercise.id, exercise.restSeconds, completedSets, onToggleSetComplete]);

    return (
        <View style={styles.exerciseCard}>
            {/* Collapsible Header */}
            <TouchableOpacity
                style={styles.exerciseCollapsibleHeader}
                onPress={onToggleExpand}
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
                            {completedCount}/{totalSets} {t('train.set')} • {exercise.sets.length} × {exercise.reps}
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

                    {logs.map((set, index) => {
                        const isCompleted = completedSets.has(`${exercise.id}-${set.setIndex}`);
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
                                        onLogSet(exercise.id, set.setIndex, "weight", parseFloat(val) || 0)
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
                                        onLogSet(exercise.id, set.setIndex, "reps", parseFloat(val) || 0)
                                    }
                                    editable={!isCompleted}
                                />

                                <TouchableOpacity
                                    onPress={() => handleToggleSet(set.setIndex)}
                                    style={[styles.checkButton, isCompleted && styles.checkButtonActive]}
                                >
                                    <Check size={16} color={isCompleted ? COLORS.textInverse : COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    <TouchableOpacity
                        style={styles.addSetButton}
                        onPress={() => onAddSet(exercise.id)}
                    >
                        <Plus size={16} color={COLORS.primary} />
                        <Text style={styles.addSetText}>{t('train.add_set')}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// Memoized export to prevent re-renders when parent state changes
export const WorkoutExerciseCard = memo(WorkoutExerciseCardComponent, (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
        prevProps.exercise.id === nextProps.exercise.id &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.logs === nextProps.logs &&
        prevProps.completedSets === nextProps.completedSets
    );
});

const styles = StyleSheet.create({
    exerciseCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
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
