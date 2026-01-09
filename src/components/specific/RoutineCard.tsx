import { Calendar, Dumbbell, Edit, Zap } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, FONT_SIZE, TYPOGRAPHY } from "../../theme/theme";
import { translateIfKey } from "../../utils/translationHelpers";

interface RoutineCardProps {
    name: string;
    days: number;
    exerciseCount: number;
    isCurrentPlan?: boolean;
    variant?: "user" | "community";
    recommended?: boolean;
    rating?: number;
    onPress: () => void;
    onEdit?: () => void;
}

const RoutineCardComponent: React.FC<RoutineCardProps> = ({
    name,
    days,
    exerciseCount,
    isCurrentPlan = false,
    variant = "user",
    recommended = false,
    rating,
    onPress,
    onEdit,
}) => {
    const { t } = useTranslation();
    const isUser = variant === "user";

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.nameContainer}>
                    <Text style={styles.name}>{translateIfKey(name)}</Text>
                    {isCurrentPlan && (
                        <Zap
                            size={18}
                            color={COLORS.primary}
                            fill={COLORS.primary}
                            style={styles.zapIcon}
                        />
                    )}
                </View>
                {isUser && onEdit && (
                    <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                        <Edit size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
                {isUser && recommended && !onEdit && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t('routine_card.created_for_you')}</Text>
                    </View>
                )}
                {!isUser && (
                    <View style={styles.badgeCommunity}>
                        <Text style={styles.badgeText}>{t('routine_card.recommended')}</Text>
                    </View>
                )}
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Calendar color={COLORS.textSecondary} size={16} />
                    <Text style={styles.statText}>{days} {t('routine_card.days')}</Text>
                </View>
                <View style={styles.statItem}>
                    <Dumbbell color={COLORS.textSecondary} size={16} />
                    <Text style={styles.statText}>
                        {exerciseCount} {exerciseCount === 1 ? t('routine_card.exercise') : t('routine_card.exercises')}
                    </Text>
                </View>
                {!isUser && rating && (
                    <View style={styles.statItem}>
                        <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Text style={styles.buttonText}>
                    {isUser ? t('routine_card.train') : t('routine_card.start')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// Custom comparison function to prevent re-renders when only callbacks change
// This allows React.memo to work effectively even with inline callbacks
const arePropsEqual = (prevProps: RoutineCardProps, nextProps: RoutineCardProps) => {
    return (
        prevProps.name === nextProps.name &&
        prevProps.days === nextProps.days &&
        prevProps.exerciseCount === nextProps.exerciseCount &&
        prevProps.isCurrentPlan === nextProps.isCurrentPlan &&
        prevProps.variant === nextProps.variant &&
        prevProps.recommended === nextProps.recommended &&
        prevProps.rating === nextProps.rating
        // Note: We intentionally ignore onPress and onEdit functions
    );
};

// Memoized export to prevent unnecessary re-renders
export const RoutineCard = React.memo(RoutineCardComponent, arePropsEqual);

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    nameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    name: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    zapIcon: {
        marginLeft: 4,
    },
    editButton: {
        padding: 4,
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeCommunity: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        ...TYPOGRAPHY.caption,
        fontFamily: TYPOGRAPHY.button.fontFamily,
        color: COLORS.textInverse,
    },
    stats: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: FONT_SIZE.sm + 1, // 13px
        color: COLORS.textSecondary,
    },
    ratingText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: FONT_SIZE.sm + 1,
        color: COLORS.textPrimary,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
    },
    buttonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.textInverse,
    },
});
