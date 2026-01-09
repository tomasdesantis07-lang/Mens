import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { X as CloseIcon, Lightbulb } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    LayoutAnimation,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomInput } from "../../src/components/common/CustomInput";
import { PrimaryButton } from "../../src/components/common/PrimaryButton";
import { DayEditorSheet } from "../../src/components/specific/DayEditorSheet";
import { DraggableWeeksGrid } from "../../src/components/specific/DraggableWeeksGrid";
import { useWorkout } from "../../src/context/WorkoutContext";
import { auth, db } from "../../src/services/firebaseConfig";
import { RoutineService } from "../../src/services/routineService";
import { COLORS } from "../../src/theme/theme";
import { createEmptyDraft, RoutineDay, RoutineDraft } from "../../src/types/routine";
import { showToast } from "../../src/utils/toast";

const ManualEditorScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { activeWorkout } = useWorkout();
    const [draft, setDraft] = useState<RoutineDraft>(createEmptyDraft());
    const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
    const [isEditorVisible, setIsEditorVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

    const handleRoutineNameChange = (name: string) => {
        setDraft((prev) => ({ ...prev, name }));
    };

    const handleDayPress = (dayIndex: number) => {
        setEditingDayIndex(dayIndex);
        setIsEditorVisible(true);
    };

    const handleDaySave = (updatedDay: RoutineDay) => {
        if (editingDayIndex !== null) {
            setDraft((prev) => ({
                ...prev,
                days: prev.days.map((day, index) =>
                    index === editingDayIndex ? updatedDay : day
                ),
            }));
        }
    };

    const handleCloseEditor = () => {
        setIsEditorVisible(false);
        setEditingDayIndex(null);
    };

    const handleCreateRoutine = async () => {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user logged in");
            showToast.error(t('routines.error_no_user'));
            return;
        }

        setIsSaving(true);
        try {
            await RoutineService.createRoutine(user.uid, draft);

            // Calculate training days
            const trainingDays = draft.days.filter(day => day.exercises.length > 0).length;

            if (trainingDays > 0) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { daysPerWeek: trainingDays });
            }

            showToast.success(t('routines.success_create'), t('common.success'));
            router.replace("/(tabs)/home");
        } catch (error) {
            console.error("Error creating routine:", error);
            showToast.error(t('routines.error_create'));
        } finally {
            setIsSaving(false);
        }
    };

    const hasExercises = draft.days.some((day) => day.exercises.length > 0);
    const canCreate = draft.name.trim().length > 0 && hasExercises;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← {t('common.back')}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('routines.manual_title')}</Text>
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
                            Agregá ejercicios a <Text style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>al menos un día</Text> para crear la rutina
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

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('routines.days_label')}</Text>

                    <Text style={styles.sectionHint}>
                        {t('routines.days_hint_drag', 'Mantén presionado para mover un día')}
                    </Text>

                    <DraggableWeeksGrid
                        days={draft.days}
                        onReorder={(from, to) => {
                            setDraft(prev => {
                                const newDays = [...prev.days];
                                const temp = newDays[from].exercises;
                                newDays[from] = { ...newDays[from], exercises: newDays[to].exercises };
                                newDays[to] = { ...newDays[to], exercises: temp };
                                return { ...prev, days: newDays };
                            });
                        }}
                        onDayPress={handleDayPress}
                    />
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 + (activeWorkout ? 60 : 0) }]}>
                <PrimaryButton
                    title={t('routines.create_action')}
                    onPress={handleCreateRoutine}
                    disabled={!canCreate}
                    loading={isSaving}
                    style={styles.createButton}
                />
            </View>

            {editingDayIndex !== null && (
                <DayEditorSheet
                    day={draft.days[editingDayIndex]}
                    visible={isEditorVisible}
                    onSave={handleDaySave}
                    onClose={handleCloseEditor}
                />
            )}
        </View>
    );
};

export default ManualEditorScreen;

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
    closeCardButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
    },
});
