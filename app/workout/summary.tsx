import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, Clock, Dumbbell, Trophy } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../../src/components/common/PrimaryButton";
import { COLORS } from "../../src/theme/theme";

const WorkoutSummaryScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { duration, volume, exerciseCount, totalExercises } = useLocalSearchParams<{
        duration: string;
        volume: string;
        exerciseCount: string;
        totalExercises: string;
    }>();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} ${t('workout_summary.minutes')}`;
    };

    const formatVolume = (kg: number) => {
        if (kg >= 1000) {
            return `${(kg / 1000).toFixed(1)}k kg`;
        }
        return `${Math.round(kg)} kg`;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: insets.bottom + 32 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Victory Header */}
                <View style={styles.header}>
                    <View style={styles.trophyContainer}>
                        <Trophy size={64} color={COLORS.primary} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.title}>{t('workout_summary.title')}</Text>
                    <Text style={styles.subtitle}>{t('workout_summary.subtitle')}</Text>
                </View>

                {/* Metrics Cards */}
                <View style={styles.metricsGrid}>
                    {/* Duration */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricIconContainer}>
                            <Clock size={24} color={COLORS.primary} strokeWidth={2} />
                        </View>
                        <Text style={styles.metricLabel}>{t('workout_summary.duration')}</Text>
                        <Text style={styles.metricValue}>
                            {formatDuration(parseInt(duration || "0"))}
                        </Text>
                    </View>

                    {/* Volume */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricIconContainer}>
                            <Dumbbell size={24} color={COLORS.primary} strokeWidth={2} />
                        </View>
                        <Text style={styles.metricLabel}>{t('workout_summary.volume')}</Text>
                        <Text style={styles.metricValue}>
                            {formatVolume(parseFloat(volume || "0"))}
                        </Text>
                    </View>

                    {/* Exercises */}
                    <View style={styles.metricCard}>
                        <View style={styles.metricIconContainer}>
                            <CheckCircle size={24} color={COLORS.success} strokeWidth={2} />
                        </View>
                        <Text style={styles.metricLabel}>{t('workout_summary.exercises')}</Text>
                        <Text style={styles.metricValue}>
                            {exerciseCount}/{totalExercises}
                        </Text>
                        <Text style={styles.metricSubtitle}>{t('workout_summary.completed')}</Text>
                    </View>
                </View>

                {/* Motivational Message */}
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>
                        💪 {t('workout_summary.motivation')}
                    </Text>
                </View>
            </ScrollView>

            {/* Action Button */}
            <View style={[styles.footerAction, { paddingBottom: insets.bottom + 24 }]}>
                <PrimaryButton
                    title={t('workout_summary.back_to_system')}
                    onPress={() => router.replace("/(tabs)/home")}
                    style={styles.button}
                />
            </View>
        </View>
    );
};

export default WorkoutSummaryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingHorizontal: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 48,
    },
    trophyContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: COLORS.textPrimary,
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: "center",
        fontWeight: "500",
    },
    metricsGrid: {
        gap: 16,
        marginBottom: 32,
    },
    metricCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    metricIconContainer: {
        marginBottom: 16,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 36,
        fontWeight: "900",
        color: COLORS.textPrimary,
        fontVariant: ["tabular-nums"],
    },
    metricSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    messageContainer: {
        backgroundColor: COLORS.primary + "20",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.primary + "40",
    },
    messageText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        textAlign: "center",
        lineHeight: 22,
        fontWeight: "500",
    },
    footerAction: {
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    button: {
        width: "100%",
    },
});
