import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../theme/theme";
import {
    createEmptyExercise,
    RoutineDay,
    RoutineExercise,
} from "../../types/routine";
import { PrimaryButton } from "../common/PrimaryButton";
import { ExerciseRow } from "./ExerciseRow";

interface DayEditorSheetProps {
    day: RoutineDay;
    visible: boolean;
    onSave: (day: RoutineDay) => void;
    onClose: () => void;
}

export const DayEditorSheet: React.FC<DayEditorSheetProps> = ({
    day,
    visible,
    onSave,
    onClose,
}) => {
    const insets = useSafeAreaInsets();
    const [editedDay, setEditedDay] = useState<RoutineDay>(day);

    // Reset edited day when modal opens
    React.useEffect(() => {
        if (visible) {
            setEditedDay(day);
        }
    }, [visible, day]);

    const handleLabelChange = (label: string) => {
        setEditedDay((prev) => ({ ...prev, label }));
    };

    const handleAddExercise = () => {
        const newExercise = createEmptyExercise(editedDay.exercises.length);
        setEditedDay((prev) => ({
            ...prev,
            exercises: [...prev.exercises, newExercise],
        }));
    };

    const handleUpdateExercise = (index: number, exercise: RoutineExercise) => {
        setEditedDay((prev) => ({
            ...prev,
            exercises: prev.exercises.map((ex, i) => (i === index ? exercise : ex)),
        }));
    };

    const handleDeleteExercise = (index: number) => {
        setEditedDay((prev) => ({
            ...prev,
            exercises: prev.exercises.filter((_, i) => i !== index),
        }));
    };

    const handleSave = () => {
        onSave(editedDay);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.cancelButton}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Editar Día</Text>
                        <View style={{ width: 70 }} />
                    </View>

                    {/* Day Label Input */}
                    <TextInput
                        style={styles.dayLabelInput}
                        placeholder="Nombre del día (ej: Pecho / Tríceps)"
                        placeholderTextColor={COLORS.textTertiary}
                        value={editedDay.label}
                        onChangeText={handleLabelChange}
                    />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Exercise List */}
                    {editedDay.exercises.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                Aún no hay ejercicios en este día
                            </Text>
                            <Text style={styles.emptyHint}>
                                Tocá "Agregar ejercicio" para comenzar
                            </Text>
                        </View>
                    ) : (
                        editedDay.exercises.map((exercise, index) => (
                            <ExerciseRow
                                key={exercise.id}
                                exercise={exercise}
                                onUpdate={(updated) => handleUpdateExercise(index, updated)}
                                onDelete={() => handleDeleteExercise(index)}
                            />
                        ))
                    )}

                    {/* Add Exercise Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddExercise}
                    >
                        <Plus color={COLORS.primary} size={20} />
                        <Text style={styles.addButtonText}>Agregar ejercicio</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Bottom Bar */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                    <PrimaryButton
                        title="Guardar día"
                        onPress={handleSave}
                        style={styles.saveButton}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    cancelButton: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    dayLabelInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: "600",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: COLORS.textTertiary,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: "dashed",
        padding: 16,
        marginTop: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.primary,
    },
    bottomBar: {
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    saveButton: {
        width: "100%",
    },
});
