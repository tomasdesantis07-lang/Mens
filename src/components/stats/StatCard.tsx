import { TrendingDown, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../theme/theme";

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: number; // Percentage change (positive or negative)
    unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, unit }) => {
    const hasTrend = trend !== undefined && trend !== 0;
    const isPositive = trend && trend > 0;

    return (
        <View style={styles.card}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.valueContainer}>
                <Text style={styles.value}>{value}</Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
            {hasTrend && (
                <View style={styles.trendContainer}>
                    {isPositive ? (
                        <TrendingUp size={16} color={COLORS.success} />
                    ) : (
                        <TrendingDown size={16} color={COLORS.error} />
                    )}
                    <Text style={[styles.trendText, isPositive ? styles.trendPositive : styles.trendNegative]}>
                        {isPositive ? '+' : ''}{trend}%
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
        flex: 1,
        minWidth: 150,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    valueContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 8,
    },
    value: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.primary,
        fontVariant: ["tabular-nums"],
    },
    unit: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    trendContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    trendText: {
        fontSize: 13,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    trendPositive: {
        color: COLORS.success,
    },
    trendNegative: {
        color: COLORS.error,
    },
});
