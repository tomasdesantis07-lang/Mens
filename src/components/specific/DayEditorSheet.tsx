import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const [editedDay, setEditedDay] = useState<RoutineDay>(day);

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
                            <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>{t('day_editor.title')}</Text>
                        <View style={{ width: 70 }} />
                    </View>

                    <TextInput
                        style={styles.dayLabelInput}
                        placeholder={t('day_editor.day_label_placeholder')}
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
                    {editedDay.exercises.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {t('day_editor.empty_state')}
                            </Text>
                            <Text style={styles.emptyHint}>
                                {t('day_editor.empty_hint')}
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

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddExercise}
                    >
                        <Plus color={COLORS.primary} size={20} />
                        <Text style={styles.addButtonText}>{t('day_editor.add_exercise')}</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                    <PrimaryButton
                        title={t('day_editor.save_day')}
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
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    cancelButton: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: "600",
        width: 70,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    dayLabelInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyHint: {
        fontSize: 14,
        color: COLORS.textTertiary,
        textAlign: "center",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: "dashed",
        padding: 16,
        marginTop: 16,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.primary,
        marginLeft: 8,
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
