import { Calendar, Dumbbell } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../theme/theme";
import { RoutineDay } from "../../types/routine";

interface RoutineDayCardProps {
    day: RoutineDay;
    onPress: () => void;
    variant?: "empty" | "filled";
}

export const RoutineDayCard: React.FC<RoutineDayCardProps> = ({
    day,
    onPress,
    variant,
}) => {
    const { t } = useTranslation();
    const exerciseCount = day.exercises.length;
    const isEmpty = variant === "empty" || exerciseCount === 0;

    return (
        <TouchableOpacity
            style={[styles.card, isEmpty && styles.cardEmpty]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <Text style={[styles.label, isEmpty && styles.labelEmpty]}>
                    {day.label}
                </Text>
                {!isEmpty && (
                    <View style={styles.badge}>
                        <Dumbbell color={COLORS.textInverse} size={12} />
                        <Text style={styles.badgeText}>{exerciseCount}</Text>
                    </View>
                )}
            </View>

            {isEmpty ? (
                <View style={styles.emptyState}>
                    <Calendar color={COLORS.textTertiary} size={20} />
                    <Text style={styles.emptyText}>{t('routine_day_card.no_exercises')}</Text>
                </View>
            ) : (
                <View style={styles.preview}>
                    <Text style={styles.previewText}>
                        {exerciseCount} {t('routine_day_card.exercise', { count: exerciseCount })}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        padding: 16,
        minHeight: 100,
    },
    cardEmpty: {
        borderColor: COLORS.border,
        borderStyle: "dashed",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
        flex: 1,
    },
    labelEmpty: {
        color: COLORS.textSecondary,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textInverse,
    },
    emptyState: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.textTertiary,
    },
    preview: {
        marginTop: 4,
    },
    previewText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});
