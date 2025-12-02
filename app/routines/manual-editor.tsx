import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import { RoutineDayCard } from "../../src/components/specific/RoutineDayCard";
import { useWorkout } from "../../src/context/WorkoutContext";
import { auth } from "../../src/services/firebaseConfig";
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
            {/* Header */}
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
                        {t('routines.days_hint_add')}
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
                            {t('routines.info_add_exercises')}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 + (activeWorkout ? 60 : 0) }]}>
                <PrimaryButton
                    title={t('routines.create_action')}
                    onPress={handleCreateRoutine}
                    disabled={!canCreate}
                    loading={isSaving}
                    style={styles.createButton}
                />
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
});
