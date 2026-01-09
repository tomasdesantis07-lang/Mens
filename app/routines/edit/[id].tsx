import { useLocalSearchParams, useRouter } from "expo-router";
import { X as CloseIcon, Lightbulb } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    LayoutAnimation,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "../../../src/components/common/ConfirmDialog";
import { CustomInput } from "../../../src/components/common/CustomInput";
import { PrimaryButton } from "../../../src/components/common/PrimaryButton";
import { DayEditorSheet } from "../../../src/components/specific/DayEditorSheet";
import { DraggableWeeksGrid } from "../../../src/components/specific/DraggableWeeksGrid";
import { useWorkout } from "../../../src/context/WorkoutContext";
import { auth } from "../../../src/services/firebaseConfig";
import { RoutineService } from "../../../src/services/routineService";
import { COLORS } from "../../../src/theme/theme";
import { RoutineDay, RoutineDraft } from "../../../src/types/routine";
import { MensHaptics } from "../../../src/utils/haptics";
import { showToast } from "../../../src/utils/toast";
import { translateIfKey } from "../../../src/utils/translationHelpers";

const EditRoutineScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { activeWorkout } = useWorkout();

    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState<RoutineDraft | null>(null);
    const [isCurrentPlan, setIsCurrentPlan] = useState(false);
    const [userRoutineCount, setUserRoutineCount] = useState(0);
    const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showTip, setShowTip] = useState(true);
    const [showInfo, setShowInfo] = useState(true);

    const dismissTip = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowTip(false);
    };

    const dismissInfo = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowInfo(false);
    };

    useEffect(() => {
        const loadRoutine = async () => {
            if (!id) return;

            try {
                const user = auth.currentUser;
                if (user) {
                    const allRoutines = await RoutineService.getUserRoutines(user.uid);
                    setUserRoutineCount(allRoutines.length);
                }

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
                        name: translateIfKey(routine.name), // Convert key to text for editing
                        days: allDays.map(day => ({
                            ...day,
                            label: translateIfKey(day.label), // Convert day labels too
                            // Keep exercise names as translation keys for dynamic translation
                            exercises: day.exercises
                        })),
                    });
                    setIsCurrentPlan(routine.isCurrentPlan || false);
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

    const handleToggleCurrentPlan = async (value: boolean) => {
        if (!id) return;

        const user = auth.currentUser;
        if (!user) return;

        if (!value && isCurrentPlan) {
            showToast.info(
                t('routines.current_plan_change_info'),
                t('common.cancel')
            );
            return;
        }

        if (value) {
            // OPTIMISTIC UI: Update immediately
            const previousState = isCurrentPlan;
            setIsCurrentPlan(true);
            MensHaptics.success();
            showToast.success(t('routines.current_plan_activated'), t('common.success'));

            // Sync to server in background
            try {
                await RoutineService.setRoutineAsCurrent(user.uid, id);
            } catch (error) {
                console.error('Error toggling current plan:', error);
                // ROLLBACK on failure
                setIsCurrentPlan(previousState);
                MensHaptics.error();
                showToast.error('Error al actualizar el plan actual');
            }
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
                {(!hasExercises && showInfo) && (
                    <View style={styles.infoCard}>
                        <Lightbulb size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <Text style={styles.infoText}>
                            Agregá ejercicios a <Text style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>al menos un día</Text> para guardar la rutina
                        </Text>
                        <TouchableOpacity onPress={dismissInfo} style={styles.closeCardButton}>
                            <CloseIcon size={16} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    </View>
                )}

                {showTip && (
                    <View style={styles.tipCard}>
                        <Lightbulb size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <Text style={styles.tipText}>
                            Los <Text style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>días vacíos</Text> se consideran automáticamente días de <Text style={{ color: COLORS.success, fontWeight: '700' }}>descanso</Text>.
                        </Text>
                        <TouchableOpacity onPress={dismissTip} style={styles.closeCardButton}>
                            <CloseIcon size={16} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('routines.name_label')}</Text>
                    <CustomInput
                        placeholder={t('routines.name_placeholder')}
                        value={draft.name}
                        onChangeText={handleRoutineNameChange}
                        style={styles.nameInput}
                    />
                </View>

                {userRoutineCount > 1 && (
                    <View style={styles.section}>
                        <View style={styles.currentPlanRow}>
                            <View style={styles.currentPlanInfo}>
                                <Text style={styles.sectionLabel}>{t('routines.current_plan_label')}</Text>
                                <Text style={styles.sectionHint}>
                                    {t('routines.current_plan_hint')}
                                </Text>
                            </View>
                            <Switch
                                value={isCurrentPlan}
                                onValueChange={handleToggleCurrentPlan}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.card}
                            />
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('routines.days_label')}</Text>

                    <Text style={styles.sectionHint}>
                        {t('routines.days_hint_drag', 'Mantén presionado para mover un día')}
                    </Text>

                    <DraggableWeeksGrid
                        days={draft.days}
                        onReorder={(from, to) => {
                            if (draft) {
                                setDraft(prev => {
                                    if (!prev) return null;
                                    const newDays = [...prev.days];
                                    const temp = newDays[from].exercises;
                                    newDays[from] = { ...newDays[from], exercises: newDays[to].exercises };
                                    newDays[to] = { ...newDays[to], exercises: temp };
                                    return { ...prev, days: newDays };
                                });
                            }
                        }}
                        onDayPress={handleDayPress}
                    />
                </View>
            </ScrollView>

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

            {editingDayIndex !== null && draft && (
                <DayEditorSheet
                    day={draft.days[editingDayIndex]}
                    visible={isEditorVisible}
                    onSave={handleDaySave}
                    onClose={handleCloseEditor}
                />
            )}

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
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        paddingRight: 40,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        position: 'relative',
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        flex: 1,
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
    tipCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        paddingRight: 40,
        marginBottom: 24,
        flexDirection: "row",
        alignItems: "center",
        position: 'relative',
    },
    tipText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        flex: 1,
    },
    currentPlanRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    currentPlanInfo: {
        flex: 1,
        marginRight: 16,
    },
    closeCardButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
    },
});
