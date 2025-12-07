import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { COLORS } from "../../theme/theme";

interface ProgressChartProps {
    exerciseName: string;
    dataPoints: Array<{ date: string; value: number }>;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ exerciseName, dataPoints }) => {
    const { t } = useTranslation();

    if (dataPoints.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>{t('stats.strength_progression')}</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{t('stats.no_data')}</Text>
                    <Text style={styles.emptyHint}>{t('stats.complete_more')}</Text>
                </View>
            </View>
        );
    }

    // Format data for the chart (take last 10 data points max)
    const recentData = dataPoints.slice(-10);
    const chartData = recentData.map((point, index) => ({
        value: point.value,
        label: index === 0 || index === recentData.length - 1
            ? new Date(point.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
            : '',
        dataPointText: point.value.toString(),
    }));

    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{t('stats.strength_progression')}</Text>
                    <Text style={styles.subtitle}>{exerciseName}</Text>
                </View>
                <View style={styles.currentValue}>
                    <Text style={styles.currentValueLabel}>{t('stats.estimated_1rm')}</Text>
                    <Text style={styles.currentValueText}>
                        {chartData[chartData.length - 1]?.value || 0} kg
                    </Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    height={180}
                    width={300}
                    spacing={chartData.length > 1 ? 280 / (chartData.length - 1) : 280}
                    initialSpacing={10}
                    endSpacing={10}
                    color={COLORS.primary}
                    thickness={3}
                    startFillColor={COLORS.primary}
                    endFillColor={COLORS.primary + '20'}
                    startOpacity={0.4}
                    endOpacity={0.1}
                    areaChart
                    curved
                    hideRules
                    hideYAxisText
                    yAxisColor={COLORS.border}
                    xAxisColor={COLORS.border}
                    xAxisLabelTextStyle={{
                        color: COLORS.textSecondary,
                        fontSize: 10,
                        fontWeight: '600',
                    }}
                    dataPointsColor={COLORS.primary}
                    dataPointsRadius={4}
                    textColor={COLORS.textPrimary}
                    textFontSize={11}
                    textShiftY={-10}
                    textShiftX={-8}
                    maxValue={maxValue + 10}
                    noOfSections={4}
                    yAxisOffset={minValue > 10 ? minValue - 10 : 0}
                />
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    currentValue: {
        alignItems: "flex-end",
    },
    currentValueLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    currentValueText: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.primary,
        fontVariant: ["tabular-nums"],
    },
    chartContainer: {
        alignItems: "center",
        marginTop: 8,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    emptyHint: {
        fontSize: 12,
        color: COLORS.textTertiary,
    },
});
