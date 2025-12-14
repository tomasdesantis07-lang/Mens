import { AlertCircle } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { MuscleDistribution } from "../../services/statsService";
import { COLORS } from "../../theme/theme";

interface MuscleBreakdownProps {
    data: MuscleDistribution[];
}

export const MuscleBreakdown: React.FC<MuscleBreakdownProps> = ({ data }) => {
    const { t } = useTranslation();

    if (data.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>{t('stats.muscle_balance')}</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{t('stats.no_muscle_data')}</Text>
                </View>
            </View>
        );
    }

    // Find the muscle with lowest percentage (lagging muscle)
    const laggingMuscle = data.reduce((min, current) =>
        current.percentage < min.percentage ? current : min
        , data[0]);

    const isLagging = (muscle: MuscleDistribution) =>
        muscle.targetZone === laggingMuscle.targetZone && muscle.percentage < 15;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('stats.muscle_balance')}</Text>

            {/* Muscle bars */}
            <View style={styles.musclesContainer}>
                {data.map((muscle, index) => (
                    <View key={muscle.targetZone} style={styles.muscleRow}>
                        <View style={styles.muscleHeader}>
                            <Text style={styles.muscleName}>{muscle.targetZone}</Text>
                            <Text style={styles.musclePercentage}>
                                {muscle.percentage.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.barContainer}>
                            <View
                                style={[
                                    styles.barFill,
                                    {
                                        width: `${muscle.percentage}%`,
                                        backgroundColor: isLagging(muscle)
                                            ? COLORS.error
                                            : COLORS.primary
                                    }
                                ]}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* Lagging muscle insight */}
            {isLagging(laggingMuscle) && (
                <View style={styles.insightContainer}>
                    <AlertCircle size={16} color={COLORS.error} />
                    <Text style={styles.insightText}>
                        {t('stats.lagging_muscle_warning', {
                            muscle: laggingMuscle.targetZone,
                            percentage: laggingMuscle.percentage.toFixed(0)
                        })}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    emptyState: {
        paddingVertical: 20,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    musclesContainer: {
        gap: 16,
    },
    muscleRow: {
        gap: 6,
    },
    muscleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    muscleName: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    musclePercentage: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    barContainer: {
        height: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 4,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 4,
    },
    insightContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        padding: 12,
        backgroundColor: COLORS.error + "15",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.error + "30",
    },
    insightText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.error,
        fontWeight: "500",
    },
});
