import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "../../../src/components/common/ConfirmDialog";
import { CustomInput } from "../../../src/components/common/CustomInput";
import { PrimaryButton } from "../../../src/components/common/PrimaryButton";
import { DayEditorSheet } from "../../../src/components/specific/DayEditorSheet";
import { RoutineDayCard } from "../../../src/components/specific/RoutineDayCard";
import { useWorkout } from "../../../src/context/WorkoutContext";
import { RoutineService } from "../../../src/services/routineService";
import { COLORS } from "../../../src/theme/theme";
import { RoutineDay, RoutineDraft } from "../../../src/types/routine";
import { showToast } from "../../../src/utils/toast";

const EditRoutineScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { activeWorkout } = useWorkout();

    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState<RoutineDraft | null>(null);
    const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const loadRoutine = async () => {
            if (!id) return;

            try {
                const routine = await RoutineService.getRoutineById(id);
                if (routine) {
                    const existingDays = routine.days;
                    const allDays: RoutineDay[] = Array.from({ length: 7 }, (_, i) => {
                        const existingDay = existingDays.find(d => d.dayIndex === i);
                        return existingDay || {
                            dayIndex: i,
                            label: t('train.day_label', { number: i + 1 }),
                            exercises: [],
                        };
                    });

                    setDraft({
                        name: routine.name,
                        days: allDays,
                    });
                }
            } catch (error) {
                console.error("Error loading routine:", error);
            } finally {
                setLoading(false);
            }
        };

        loadRoutine();
    }, [id, t]);

    const handleRoutineNameChange = (name: string) => {
        if (draft) {
            setDraft((prev) => prev ? { ...prev, name } : null);
        }
    };

    const handleDayPress = (dayIndex: number) => {
        setEditingDayIndex(dayIndex);
        setIsEditorVisible(true);
    };

    const handleDaySave = (updatedDay: RoutineDay) => {
        if (editingDayIndex !== null && draft) {
            setDraft((prev) => prev ? ({
                ...prev,
                days: prev.days.map((day, index) =>
                    index === editingDayIndex ? updatedDay : day
                ),
            }) : null);
        }
    };

    const handleCloseEditor = () => {
        setIsEditorVisible(false);
        setEditingDayIndex(null);
    };

    const handleSaveRoutine = async () => {
        if (!id || !draft) return;

        setIsSaving(true);
        try {
            await RoutineService.updateRoutine(id, draft);
            showToast.success(t('routines.success_update'), t('common.success'));
            router.back();
        } catch (error) {
            console.error("Error updating routine:", error);
            showToast.error(t('routines.error_update'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRoutine = () => {
        setShowDeleteDialog(true);
    };

    const confirmDeleteRoutine = async () => {
        if (!id) return;

        setShowDeleteDialog(false);
        setIsSaving(true);
        try {
            await RoutineService.deleteRoutine(id);
            showToast.success(t('routines.success_delete'));
            router.replace("/(tabs)/home");
        } catch (error) {
            console.error("Error deleting routine:", error);
            showToast.error(t('routines.error_delete'));
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
        );
    }

    if (!draft) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <Text style={styles.errorText}>{t('routines.error_load')}</Text>
            </View>
        );
    }

    const hasExercises = draft.days.some((day) => day.exercises.length > 0);
    const canSave = draft.name.trim().length > 0 && hasExercises;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← {t('common.back')}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('routines.edit_title')}</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Routine Name Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('routines.name_label')}</Text>
                    <CustomInput
                        placeholder={t('routines.name_placeholder')}
                        value={draft.name}
                        onChangeText={handleRoutineNameChange}
                        style={styles.nameInput}
                    />
                </View>

                {/* Days Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('routines.days_label')}</Text>
                    <Text style={styles.sectionHint}>
                        {t('routines.days_hint_edit')}
                    </Text>

                    <View style={styles.daysGrid}>
                        {draft.days.map((day) => (
                            <View key={day.dayIndex} style={styles.dayCardWrapper}>
                                <RoutineDayCard
                                    day={day}
                                    onPress={() => handleDayPress(day.dayIndex)}
                                    variant={day.exercises.length === 0 ? "empty" : "filled"}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Info Card */}
                {!hasExercises && (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            {t('routines.info_save_exercises')}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 + (activeWorkout ? 60 : 0) }]}>
                <PrimaryButton
                    title={t('routines.save_changes')}
                    onPress={handleSaveRoutine}
                    disabled={!canSave}
                    loading={isSaving}
                    style={styles.createButton}
                />

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteRoutine}
                    disabled={isSaving}
                >
                    <Text style={styles.deleteButtonText}>{t('routines.delete_routine')}</Text>
                </TouchableOpacity>
            </View>

            {/* Day Editor Modal */}
            {editingDayIndex !== null && (
                <DayEditorSheet
                    day={draft.days[editingDayIndex]}
                    visible={isEditorVisible}
                    onSave={handleDaySave}
                    onClose={handleCloseEditor}
                />
            )}

            {/* Delete Routine Confirmation Dialog */}
            <ConfirmDialog
                visible={showDeleteDialog}
                title={t('routines.delete_confirm_title')}
                message={t('routines.delete_confirm_message')}
                confirmText={t('routines.delete_confirm_action')}
                cancelText={t('common.cancel')}
                onConfirm={confirmDeleteRoutine}
                onCancel={() => setShowDeleteDialog(false)}
                variant="danger"
            />
        </View>
    );
};

export default EditRoutineScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    backButton: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: "600",
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    sectionHint: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    nameInput: {
        marginBottom: 0,
    },
    daysGrid: {
        gap: 12,
    },
    dayCardWrapper: {
        marginBottom: 0,
    },
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    bottomBar: {
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    createButton: {
        width: "100%",
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    deleteButton: {
        marginTop: 16,
        alignItems: "center",
        paddingVertical: 12,
    },
    deleteButtonText: {
        color: COLORS.error,
        fontSize: 16,
        fontWeight: "600",
    },
});
