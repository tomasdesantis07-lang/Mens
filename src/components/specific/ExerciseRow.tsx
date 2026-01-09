import { ChevronDown, ChevronUp, Clock, Plus, Trash2, X } from "lucide-react-native";
import React, { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../theme/theme";
import { createEmptySet, PredefinedSet, RoutineExercise } from "../../types/routine";
import { translateIfKey } from "../../utils/translationHelpers";
import { RestTimePicker } from "./RestTimePicker";

interface ExerciseRowProps {
    index: number;
    exercise: RoutineExercise;
    onUpdate: (index: number, exercise: RoutineExercise) => void;
    onDelete: (index: number) => void;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
}

const ExerciseRowComponent: React.FC<ExerciseRowProps> = ({
    index,
    exercise,
    onUpdate,
    onDelete,
    isExpanded,
    onToggleExpand,
}) => {
    const { t } = useTranslation();
    const [showNotes, setShowNotes] = useState(false);
    const [showRestPicker, setShowRestPicker] = useState(false);

    const handleFieldChange = (field: keyof RoutineExercise, value: any) => {
        onUpdate(index, { ...exercise, [field]: value });
    };

    const handleSetChange = (setIndex: number, field: keyof PredefinedSet, value: any) => {
        const updatedSets = exercise.sets.map((set) =>
            set.setIndex === setIndex ? { ...set, [field]: value } : set
        );
        onUpdate(index, { ...exercise, sets: updatedSets });
    };

    const handleAddSet = () => {
        const newSet = createEmptySet(exercise.sets.length);
        onUpdate(index, { ...exercise, sets: [...exercise.sets, newSet] });
    };

    const handleRemoveSet = (setIndex: number) => {
        if (exercise.sets.length <= 1) return; // Keep at least one set
        const updatedSets = exercise.sets
            .filter((set) => set.setIndex !== setIndex)
            .map((set, index) => ({ ...set, setIndex: index })); // Reindex
        onUpdate(index, { ...exercise, sets: updatedSets });
    };

    const formatRestTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <View style={styles.container}>
            {/* Collapsible Header */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => onToggleExpand(exercise.id)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.expandIcon}>
                        {isExpanded ? (
                            <ChevronUp size={20} color={COLORS.primary} />
                        ) : (
                            <ChevronDown size={20} color={COLORS.textSecondary} />
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.exerciseNameHeader} numberOfLines={1}>
                            {translateIfKey(exercise.name, t) || t('exercise_row.name_placeholder')}
                        </Text>
                        {!isExpanded && (
                            <Text style={styles.exerciseMeta}>
                                {exercise.sets.length} {t('train.set')}
                            </Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        onDelete(index);
                    }}
                    style={styles.deleteButtonHeader}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Trash2 color={COLORS.error} size={18} />
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Expandable Content */}
            {isExpanded && (
                <View style={styles.content}>
                    {/* Exercise Name Input - Solo si es ejercicio personalizado */}
                    {!exercise.exerciseId && (
                        <TextInput
                            style={styles.nameInput}
                            placeholder={t('exercise_row.name_placeholder')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={exercise.name}
                            onChangeText={(text) => handleFieldChange("name", text)}
                        />
                    )}

                    {/* Rest Time */}
                    <TouchableOpacity style={[styles.restRow, exercise.exerciseId && { marginTop: 12 }]} onPress={() => setShowRestPicker(true)}>
                        <View style={styles.restInfo}>
                            <Clock size={16} color={COLORS.textSecondary} />
                            <Text style={styles.restLabel}>{t('exercise_row.rest_time', { time: formatRestTime(exercise.restSeconds) })}</Text>
                        </View>
                        <Text style={styles.editButton}>{t('exercise_row.edit_rest')}</Text>
                    </TouchableOpacity>

                    {/* Sets Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerText, { width: 40 }]}>{t('exercise_row.set_header')}</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>{t('exercise_row.kg_header')}</Text>
                        <Text style={[styles.headerText, { flex: 1 }]}>{t('exercise_row.reps_header')}</Text>
                        <View style={{ width: 32 }} />
                    </View>

                    {/* Sets Rows */}
                    {exercise.sets.map((set, setIndex) => (
                        <View key={set.setIndex} style={styles.setRow}>
                            <View style={styles.setNumberContainer}>
                                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                            </View>

                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="—"
                                placeholderTextColor={COLORS.textTertiary}
                                value={set.targetWeight !== undefined ? set.targetWeight.toString() : ""}
                                onChangeText={(val) =>
                                    handleSetChange(set.setIndex, "targetWeight", val ? parseFloat(val) : undefined)
                                }
                            />

                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="—"
                                placeholderTextColor={COLORS.textTertiary}
                                value={set.targetReps !== undefined ? set.targetReps.toString() : ""}
                                onChangeText={(val) =>
                                    handleSetChange(set.setIndex, "targetReps", val ? parseInt(val) : undefined)
                                }
                            />

                            <TouchableOpacity
                                onPress={() => handleRemoveSet(set.setIndex)}
                                style={styles.removeButton}
                                disabled={exercise.sets.length <= 1}
                            >
                                <X size={16} color={exercise.sets.length <= 1 ? COLORS.textTertiary : COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Add Set Button */}
                    <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
                        <Plus size={16} color={COLORS.primary} />
                        <Text style={styles.addSetText}>{t('exercise_row.add_set')}</Text>
                    </TouchableOpacity>

                    {/* Notes Toggle */}
                    <TouchableOpacity
                        style={styles.notesToggle}
                        onPress={() => setShowNotes(!showNotes)}
                    >
                        <Text style={styles.notesToggleText}>
                            {showNotes ? t('exercise_row.hide_notes') : t('exercise_row.add_notes')}
                        </Text>
                        {showNotes ? (
                            <ChevronUp color={COLORS.textSecondary} size={16} />
                        ) : (
                            <ChevronDown color={COLORS.textSecondary} size={16} />
                        )}
                    </TouchableOpacity>

                    {/* Notes Input */}
                    {showNotes && (
                        <TextInput
                            style={styles.notesInput}
                            placeholder={t('exercise_row.notes_placeholder')}
                            placeholderTextColor={COLORS.textTertiary}
                            multiline
                            numberOfLines={3}
                            value={exercise.notes || ""}
                            onChangeText={(text) => handleFieldChange("notes", text)}
                        />
                    )}
                </View>
            )}

            {/* Rest Time Picker Modal */}
            <RestTimePicker
                visible={showRestPicker}
                initialSeconds={exercise.restSeconds}
                onConfirm={(seconds) => {
                    handleFieldChange("restSeconds", seconds);
                    setShowRestPicker(false);
                }}
                onCancel={() => setShowRestPicker(false)}
            />
        </View>
    );
};

// Memoized to prevent unnecessary re-renders - Default shallow comparison is correct now
// because handlers are stable refs from parent and exercise object is immutable updated.
export const ExerciseRow = memo(ExerciseRowComponent);

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    expandIcon: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    exerciseNameHeader: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    exerciseMeta: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    deleteButtonHeader: {
        padding: 8,
        marginLeft: 8,
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    nameInput: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginTop: 12,
        marginBottom: 12,
    },
    restRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    restInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    restLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    editButton: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },
    tableHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingBottom: 8,
        gap: 8,
    },
    headerText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textAlign: "center",
        textTransform: "uppercase",
    },
    setRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    setNumberContainer: {
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    setNumber: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
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
    removeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    addSetButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    addSetText: {
        color: COLORS.primary,
        fontWeight: "600",
        fontSize: 14,
    },
    notesToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        marginTop: 4,
    },
    notesToggleText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    notesInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 8,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginTop: 8,
        minHeight: 60,
        textAlignVertical: "top",
    },
});
