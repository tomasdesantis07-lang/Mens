import { useRouter } from "expo-router";
import { Clock, Dumbbell } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkout } from "../../context/WorkoutContext";
import { COLORS } from "../../theme/theme";

export const ActiveWorkoutOverlay: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { activeWorkout, elapsedSeconds, restTimerDuration, isResting } = useWorkout();

    if (!activeWorkout) return null;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handlePress = () => {
        router.push(`/routines/${activeWorkout.routine.id}/train` as any);
    };

    return (
        <TouchableOpacity
            style={[styles.container, { bottom: insets.bottom + 80 }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            {/* Rest Timer - Prominent Display */}
            {isResting && (
                <View style={styles.restTimerBanner}>
                    <Clock size={20} color={COLORS.textInverse} />
                    <Text style={styles.restTimerText}>
                        Descanso: {formatTime(restTimerDuration)}
                    </Text>
                </View>
            )}

            {/* Main Workout Info */}
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Dumbbell size={24} color={COLORS.primary} />
                </View>

                <View style={styles.info}>
                    <Text style={styles.routineName} numberOfLines={1}>
                        {activeWorkout.routine.name}
                    </Text>
                    <Text style={styles.duration}>
                        Tiempo: {formatTime(elapsedSeconds)}
                    </Text>
                </View>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>En curso</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 16,
        right: 16,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    restTimerBanner: {
        backgroundColor: COLORS.accent,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
    },
    restTimerText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        gap: 4,
    },
    routineName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    duration: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontVariant: ["tabular-nums"],
    },
    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: COLORS.textInverse,
        fontSize: 12,
        fontWeight: "600",
    },
});
