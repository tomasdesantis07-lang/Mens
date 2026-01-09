import { Plus } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomExerciseService } from "../../services/customExerciseService";
import { auth } from "../../services/firebaseConfig";
import { COLORS } from "../../theme/theme";
import { CatalogExercise } from "../../types/exercise";
import {
    createEmptyExercise,
    RoutineDay,
    RoutineExercise,
} from "../../types/routine";
import { showToast } from "../../utils/toast";
import { PrimaryButton } from "../common/PrimaryButton";
import { CreateExerciseModal } from "./CreateExerciseModal";
import { ExercisePickerModal } from "./ExercisePickerModal";
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
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [showCreateExercise, setShowCreateExercise] = useState(false);
    const [customExercises, setCustomExercises] = useState<CatalogExercise[]>([]);
    const [isLoadingCustom, setIsLoadingCustom] = useState(false);
    const [exerciseBeingEdited, setExerciseBeingEdited] = useState<CatalogExercise | undefined>(undefined);

    const loadCustomExercises = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const exercises = await CustomExerciseService.getUserCustomExercises(user.uid);
            setCustomExercises(exercises);
        } catch (error) {
            console.error("Failed to load custom exercises", error);
        }
    }, []);

    React.useEffect(() => {
        if (visible) {
            setEditedDay(day);
            // Auto-expand first exercise when opening
            setExpandedExerciseId(day.exercises[0]?.id || null);
            loadCustomExercises();
        }
    }, [visible, day, loadCustomExercises]);

    const handleLabelChange = (label: string) => {
        setEditedDay((prev) => ({ ...prev, label }));
    };

    const handleAddExercise = () => {
        setShowExercisePicker(true);
    };

    const handleExerciseSelect = (exercises: Array<{ exercise: CatalogExercise, translatedName: string }>) => {
        const newExercises = exercises.map(({ exercise, translatedName }, index) => {
            const newEx = createEmptyExercise(editedDay.exercises.length + index);
            newEx.exerciseId = exercise.id;
            newEx.targetZone = exercise.primaryMuscles[0];
            newEx.name = translatedName;
            return newEx;
        });

        setEditedDay((prev) => ({
            ...prev,
            exercises: [...prev.exercises, ...newExercises],
        }));
        setShowExercisePicker(false);
        // Expand the last added one
        if (newExercises.length > 0) {
            setExpandedExerciseId(newExercises[newExercises.length - 1].id);
        }
    };

    const handleCustomExercise = () => {
        setShowExercisePicker(false);
        setExerciseBeingEdited(undefined);
        setShowCreateExercise(true);
    };

    const handleEditCustomExercise = (exercise: CatalogExercise) => {
        setShowExercisePicker(false);
        setExerciseBeingEdited(exercise);
        setShowCreateExercise(true);
    };

    const handleSaveCustomExercise = async (exerciseData: Omit<CatalogExercise, "id">) => {
        const user = auth.currentUser;
        if (!user) return;

        setIsLoadingCustom(true);
        try {
            if (exerciseBeingEdited) {
                // Update existing
                await CustomExerciseService.updateCustomExercise(user.uid, exerciseBeingEdited.id, exerciseData);
                showToast.success('Ejercicio actualizado');
            } else {
                // Create new
                const newExercise = await CustomExerciseService.createCustomExercise(user.uid, exerciseData);
                // Auto-select the newly created exercise
                handleExerciseSelect([{ exercise: newExercise, translatedName: newExercise.nameKey }]);
                showToast.success(t('create_exercise.success_created'));
            }

            // Refresh list
            await loadCustomExercises();
            setShowCreateExercise(false);
        } catch (error) {
            console.error(error);
            showToast.error(exerciseBeingEdited ? 'Error al actualizar' : t('create_exercise.error_create'));
        } finally {
            setIsLoadingCustom(false);
        }
    };

    const handleUpdateExercise = useCallback((index: number, exercise: RoutineExercise) => {
        setEditedDay((prev) => ({
            ...prev,
            exercises: prev.exercises.map((ex, i) => (i === index ? exercise : ex)),
        }));
    }, []);

    const handleDeleteExercise = useCallback((index: number) => {
        setEditedDay((prev) => ({
            ...prev,
            exercises: prev.exercises.filter((_, i) => i !== index),
        }));
    }, []);

    const handleToggleExpand = useCallback((id: string) => {
        LayoutAnimation.configureNext({
            duration: 250,
            update: {
                type: LayoutAnimation.Types.easeInEaseOut,
            },
            create: {
                duration: 250,
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity,
            },
            delete: {
                duration: 250,
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity,
            },
        });
        setExpandedExerciseId((prev) => (prev === id ? null : id));
    }, []);

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
                                index={index}
                                exercise={exercise}
                                onUpdate={handleUpdateExercise}
                                onDelete={handleDeleteExercise}
                                isExpanded={expandedExerciseId === exercise.id}
                                onToggleExpand={handleToggleExpand}
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

            {/* Exercise Picker Modal */}
            <ExercisePickerModal
                visible={showExercisePicker}
                onSelect={handleExerciseSelect}
                onCustomExercise={handleCustomExercise}
                onEditCustomExercise={handleEditCustomExercise}
                onClose={() => setShowExercisePicker(false)}
                customExercises={customExercises}
            />

            {/* Create/Edit Custom Exercise Modal */}
            <CreateExerciseModal
                visible={showCreateExercise}
                onClose={() => setShowCreateExercise(false)}
                onSave={handleSaveCustomExercise}
                loading={isLoadingCustom}
                initialData={exerciseBeingEdited}
            />
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
