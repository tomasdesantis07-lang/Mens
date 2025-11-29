import { ChevronDown, ChevronUp, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../theme/theme";
import { RoutineExercise } from "../../types/routine";

interface ExerciseRowProps {
    exercise: RoutineExercise;
    onUpdate: (exercise: RoutineExercise) => void;
    onDelete: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
    exercise,
    onUpdate,
    onDelete,
}) => {
    const [showNotes, setShowNotes] = useState(false);

    const handleFieldChange = (field: keyof RoutineExercise, value: any) => {
        onUpdate({ ...exercise, [field]: value });
    };

    return (
        <View style={styles.container}>
            {/* Exercise Name */}
            <View style={styles.row}>
                <TextInput
                    style={styles.nameInput}
                    placeholder="Nombre del ejercicio"
                    placeholderTextColor={COLORS.textTertiary}
                    value={exercise.name}
                    onChangeText={(text) => handleFieldChange("name", text)}
                />
                <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                    <Trash2 color={COLORS.accent} size={20} />
                </TouchableOpacity>
            </View>

            {/* Sets, Reps, Rest */}
            <View style={styles.statsRow}>
                <View style={styles.statInput}>
                    <Text style={styles.label}>Series</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="3"
                        placeholderTextColor={COLORS.textTertiary}
                        keyboardType="numeric"
                        value={String(exercise.sets)}
                        onChangeText={(text) =>
                            handleFieldChange("sets", parseInt(text) || 0)
                        }
                    />
                </View>

                <View style={styles.statInput}>
                    <Text style={styles.label}>Reps</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="8-12"
                        placeholderTextColor={COLORS.textTertiary}
                        value={exercise.reps}
                        onChangeText={(text) => handleFieldChange("reps", text)}
                    />
                </View>

                <View style={styles.statInput}>
                    <Text style={styles.label}>Descanso (s)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="90"
                        placeholderTextColor={COLORS.textTertiary}
                        keyboardType="numeric"
                        value={String(exercise.restSeconds)}
                        onChangeText={(text) =>
                            handleFieldChange("restSeconds", parseInt(text) || 0)
                        }
                    />
                </View>
            </View>

            {/* Notes Toggle */}
            <TouchableOpacity
                style={styles.notesToggle}
                onPress={() => setShowNotes(!showNotes)}
            >
                <Text style={styles.notesToggleText}>
                    {showNotes ? "Ocultar notas" : "Agregar notas"}
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
                    placeholder="Ej: Tempo 3-1-1, drop set al final..."
                    placeholderTextColor={COLORS.textTertiary}
                    multiline
                    numberOfLines={3}
                    value={exercise.notes || ""}
                    onChangeText={(text) => handleFieldChange("notes", text)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    nameInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        padding: 0,
    },
    deleteButton: {
        padding: 4,
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    statInput: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 4,
        textTransform: "uppercase",
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 8,
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    notesToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 4,
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
