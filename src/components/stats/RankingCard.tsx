import { TrendingUp, Trophy } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { UserRank } from "../../services/statsService";
import { COLORS } from "../../theme/theme";
import { GlassCard } from "../common/GlassCard";

interface RankingCardProps {
    rank: UserRank;
}

export const RankingCard: React.FC<RankingCardProps> = ({ rank }) => {
    const { t } = useTranslation();

    const getRankColor = (percentile: number): string => {
        if (percentile <= 10) return COLORS.accent; // Elite/Advanced
        if (percentile <= 30) return COLORS.primary; // Intermediate
        return COLORS.textSecondary; // Regular/Beginner
    };

    return (
        <GlassCard style={styles.card}>
            <View style={styles.header}>
                <Trophy size={24} color={getRankColor(rank.percentile)} />
                <Text style={styles.title}>{t('stats.your_rank')}</Text>
            </View>

            <View style={styles.rankContainer}>
                <Text style={[styles.percentile, { color: getRankColor(rank.percentile) }]}>
                    {t('stats.top_percentage_value', { value: rank.percentile })}
                </Text>
                <Text style={styles.label}>{rank.label}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.messageContainer}>
                <TrendingUp size={16} color={COLORS.textSecondary} />
                <Text style={styles.message}>
                    {t('stats.rank_message', {
                        percentile: rank.percentile,
                        nextThreshold: rank.nextRankThreshold
                    })}
                </Text>
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    rankContainer: {
        alignItems: "center",
        paddingVertical: 12,
    },
    percentile: {
        fontSize: 36,
        fontWeight: "800",
        marginBottom: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    messageContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    message: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
});
