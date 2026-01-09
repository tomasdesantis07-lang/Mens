import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { Clock, Dumbbell } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRestTimer, useWorkout, useWorkoutTimer } from "../../context/WorkoutContext";
import { COLORS, FONT_SIZE, TYPOGRAPHY } from "../../theme/theme";
import { translateIfKey } from "../../utils/translationHelpers";

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_BOTTOM = 20;

export const ActiveWorkoutOverlay: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { activeWorkout, restEndTime, isResting } = useWorkout();
    const { t } = useTranslation();
    const elapsedSeconds = useWorkoutTimer(activeWorkout?.startTime ?? null);
    const restSeconds = useRestTimer(restEndTime || null);

    const isNavigating = React.useRef(false);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handlePress = () => {
        if (!activeWorkout) return;
        if (isNavigating.current) return;
        isNavigating.current = true;

        router.push(`/routines/${activeWorkout.routine.id}/train` as any);

        // Reset the lock after a short delay (enough for navigation to start)
        setTimeout(() => {
            isNavigating.current = false;
        }, 1000);
    };

    // Only hide if no active workout. The shared transition handles the visual hand-off.
    if (!activeWorkout) return null;

    return (
        <TouchableOpacity
            style={[
                styles.containerWrapper,
                { bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + 8 },
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View
                style={styles.container}
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
                            {translateIfKey(activeWorkout.routine.name)}
                        </Text>
                        <View style={styles.metaRow}>
                            {isResting ? (
                                <>
                                    <Clock size={11} color={COLORS.accent} />
                                    <Text style={styles.restText}>
                                        Descanso: {formatTime(restSeconds)}
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
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        position: 'absolute',
        left: 40,
        right: 40,
        zIndex: 999,
        // Shadow for the wrapper because children are overflows
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    container: {
        backgroundColor: COLORS.surface, // Solid fallback for transition smoothness
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
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
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(41, 98, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        gap: 3,
    },
    routineName: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textPrimary,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    duration: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
        fontVariant: ["tabular-nums"],
    },
    restText: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: TYPOGRAPHY.button.fontWeight,
        color: COLORS.accent,
        fontVariant: ["tabular-nums"],
    },
    badge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: {
        ...TYPOGRAPHY.button,
        fontSize: FONT_SIZE.xl,
        color: COLORS.primary,
    },
});
