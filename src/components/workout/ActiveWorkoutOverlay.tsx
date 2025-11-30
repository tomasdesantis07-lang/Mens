import { usePathname, useRouter } from "expo-router";
import { Clock, Dumbbell } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkout } from "../../context/WorkoutContext";
import { COLORS } from "../../theme/theme";

export const ActiveWorkoutOverlay: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { activeWorkout, elapsedSeconds, restTimerDuration, isResting } = useWorkout();

    // Hide if no active workout or if we're on the train screen
    if (!activeWorkout || pathname.includes('/train')) return null;

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

    // Calculate position above tab bar (standard tab bar height ~49px)
    const bottomPosition = 49 + insets.bottom;

    return (
        <TouchableOpacity
            style={[styles.container, { bottom: bottomPosition }]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            {/* Progress indicator / Rest timer bar */}
            {isResting && (
                <View style={styles.restIndicator} />
            )}

            {/* Main content */}
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Dumbbell size={20} color={COLORS.primary} strokeWidth={2.5} />
                </View>

                <View style={styles.info}>
                    <Text style={styles.routineName} numberOfLines={1}>
                        {activeWorkout.routine.name}
                    </Text>
                    <View style={styles.metaRow}>
                        {isResting ? (
                            <>
                                <Clock size={12} color={COLORS.accent} />
                                <Text style={styles.restText}>
                                    Descanso: {formatTime(restTimerDuration)}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.duration}>
                                {formatTime(elapsedSeconds)}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>→</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
    },
    restIndicator: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.accent,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        minHeight: 56,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        gap: 4,
    },
    routineName: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    duration: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontVariant: ["tabular-nums"],
    },
    restText: {
        fontSize: 12,
        color: COLORS.accent,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    badge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: "600",
    },
});
