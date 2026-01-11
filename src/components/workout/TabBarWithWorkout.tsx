import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Clock, Dumbbell } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWorkout } from "../../context/WorkoutContext";
import { useWorkoutTimerContext } from "../../context/WorkoutTimerContext";
import { COLORS } from "../../theme/theme";
import { translateIfKey } from "../../utils/translationHelpers";

export const TabBarWithWorkout: React.FC = () => {
    const router = useRouter();
    const { activeWorkout } = useWorkout();
    const { elapsedTime, restRemaining, isResting } = useWorkoutTimerContext();
    const { t } = useTranslation();

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handlePress = () => {
        if (activeWorkout) {
            router.push(`/routines/${activeWorkout.routine.id}/train` as any);
        }
    };

    return (
        <View style={[
            styles.container,
            activeWorkout && styles.containerExpanded
        ]}>
            <BlurView
                intensity={95}
                tint="dark"
                style={StyleSheet.absoluteFillObject}
            />

            {/* Workout info section - only shown when active */}
            {activeWorkout && (
                <TouchableOpacity
                    style={styles.workoutSection}
                    onPress={handlePress}
                    activeOpacity={0.8}
                >
                    {/* Rest indicator bar */}
                    {isResting && (
                        <View style={styles.restIndicator} />
                    )}

                    <View style={styles.workoutContent}>
                        <View style={styles.iconContainer}>
                            <Dumbbell size={18} color={COLORS.primary} strokeWidth={2.5} />
                        </View>

                        <View style={styles.info}>
                            <Text style={styles.routineName} numberOfLines={1}>
                                {translateIfKey(activeWorkout.routine.name)}
                            </Text>
                            <View style={styles.metaRow}>
                                {isResting ? (
                                    <>
                                        <Clock size={11} color={COLORS.accent} />
                                        <Text style={styles.restText}>
                                            Descanso: {formatTime(restRemaining)}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.duration}>
                                        {formatTime(elapsedTime)}
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
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        bottom: 4,  // Small gap from bottom curve
        left: 16,   // More horizontal margin
        right: 16,  // More horizontal margin
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
    },
    containerExpanded: {
        // When expanded, the container grows upward
    },
    workoutSection: {
        paddingTop: 12,
    },
    workoutContent: {
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
        marginTop: 4,
    },
    restIndicator: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.accent,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
});
