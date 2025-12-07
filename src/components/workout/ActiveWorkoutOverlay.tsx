import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { Clock, Dumbbell } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWorkout } from "../../context/WorkoutContext";
import { COLORS } from "../../theme/theme";

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_BOTTOM = 20;

export const ActiveWorkoutOverlay: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
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

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT - 1 } // -1 to overlap slightly
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <BlurView
                intensity={95}
                tint="dark"
                style={StyleSheet.absoluteFill}
            />

            {/* Rest indicator bar */}
            {isResting && (
                <View style={styles.restIndicator} />
            )}

            {/* Main content */}
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Dumbbell size={18} color={COLORS.primary} strokeWidth={2.5} />
                </View>

                <View style={styles.info}>
                    <Text style={styles.routineName} numberOfLines={1}>
                        {activeWorkout.routine.name}
                    </Text>
                    <View style={styles.metaRow}>
                        {isResting ? (
                            <>
                                <Clock size={11} color={COLORS.accent} />
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

            {/* Separator line */}
            <View style={styles.separator} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(10, 10, 15, 0.4)', // Match tab bar
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderBottomWidth: 0, // No bottom border to blend
        borderColor: 'rgba(255, 255, 255, 0.15)', // Match tab bar
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
        zIndex: 999,
    },
    restIndicator: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.accent,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(41, 98, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        gap: 3,
    },
    routineName: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    duration: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontVariant: ["tabular-nums"],
    },
    restText: {
        fontSize: 11,
        color: COLORS.accent,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: "600",
    },
    separator: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        marginHorizontal: 16,
        marginBottom: 4,
    },
});
