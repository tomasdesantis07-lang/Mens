import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../theme/theme";
import { Routine } from "../../types/routine";

interface DaySelectorSheetProps {
    visible: boolean;
    routine: Routine | null;
    onSelectDay: (dayIndex: number) => void;
    onClose: () => void;
}

export const DaySelectorSheet: React.FC<DaySelectorSheetProps> = ({
    visible,
    routine,
    onSelectDay,
    onClose,
}) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    if (!routine) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>{t('day_selector.title')}</Text>
                    <Text style={styles.subtitle}>{routine.name}</Text>

                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {routine.days.map((day) => (
                            <TouchableOpacity
                                key={day.dayIndex}
                                style={styles.dayOption}
                                onPress={() => onSelectDay(day.dayIndex)}
                            >
                                <View style={styles.dayInfo}>
                                    <Text style={styles.dayLabel}>{day.label}</Text>
                                    <Text style={styles.exerciseCount}>
                                        {day.exercises.length} {t('day_selector.exercise', { count: day.exercises.length })}
                                    </Text>
                                </View>
                                <Text style={styles.arrow}>→</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        maxHeight: "80%",
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 24,
    },
    list: {
        maxHeight: 400,
    },
    listContent: {
        paddingHorizontal: 24,
    },
    dayOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dayInfo: {
        gap: 4,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    exerciseCount: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    arrow: {
        fontSize: 20,
        color: COLORS.primary,
        fontWeight: "600",
    },
    cancelButton: {
        marginTop: 16,
        alignItems: "center",
        paddingVertical: 12,
    },
    cancelText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
});
