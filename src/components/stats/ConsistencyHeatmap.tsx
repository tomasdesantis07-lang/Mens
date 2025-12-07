import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../theme/theme";

interface ConsistencyHeatmapProps {
    data: Map<string, number>; // date -> workout count
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ data }) => {
    const { t } = useTranslation();

    // Get last 12 weeks (84 days)
    const weeks: string[][] = [];
    const now = new Date();

    // Build weeks array (7 days each)
    for (let weekIndex = 11; weekIndex >= 0; weekIndex--) {
        const week: string[] = [];
        for (let dayIndex = 6; dayIndex >= 0; dayIndex--) {
            const daysBack = weekIndex * 7 + dayIndex;
            const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
            week.push(date.toISOString().split('T')[0]);
        }
        weeks.push(week.reverse());
    }

    const getIntensityColor = (count: number): string => {
        if (count === 0) return COLORS.surface;
        if (count === 1) return COLORS.primary + '40'; // 25% opacity
        if (count === 2) return COLORS.primary + '80'; // 50% opacity
        return COLORS.primary; // 100% opacity
    };

    const monthLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('stats.consistency')} (12 {t('stats.weeks')})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.heatmapContainer}>
                    {/* Day labels */}
                    <View style={styles.dayLabelsColumn}>
                        {monthLabels.map((label, index) => (
                            <Text key={index} style={styles.dayLabel}>{label}</Text>
                        ))}
                    </View>

                    {/* Heatmap grid */}
                    <View style={styles.grid}>
                        {weeks.map((week, weekIndex) => (
                            <View key={weekIndex} style={styles.column}>
                                {week.map((dateKey, dayIndex) => {
                                    const count = data.get(dateKey) || 0;
                                    return (
                                        <View
                                            key={dateKey}
                                            style={[
                                                styles.cell,
                                                { backgroundColor: getIntensityColor(count) }
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Legend */}
            <View style={styles.legend}>
                <Text style={styles.legendLabel}>-</Text>
                <View style={styles.legendColors}>
                    <View style={[styles.legendCell, { backgroundColor: COLORS.surface }]} />
                    <View style={[styles.legendCell, { backgroundColor: COLORS.primary + '40' }]} />
                    <View style={[styles.legendCell, { backgroundColor: COLORS.primary + '80' }]} />
                    <View style={[styles.legendCell, { backgroundColor: COLORS.primary }]} />
                </View>
                <Text style={styles.legendLabel}>+</Text>
            </View>
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
    scrollView: {
        marginBottom: 12,
    },
    heatmapContainer: {
        flexDirection: "row",
        gap: 8,
    },
    dayLabelsColumn: {
        justifyContent: "space-around",
        paddingVertical: 2,
    },
    dayLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: "600",
        width: 12,
        textAlign: "center",
    },
    grid: {
        flexDirection: "row",
        gap: 3,
    },
    column: {
        gap: 3,
    },
    cell: {
        width: 12,
        height: 12,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    legend: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        marginTop: 8,
    },
    legendLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    legendColors: {
        flexDirection: "row",
        gap: 3,
    },
    legendCell: {
        width: 12,
        height: 12,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
});
