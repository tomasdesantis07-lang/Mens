import { Pause, Play, RotateCcw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../theme/theme";

interface RestTimerProps {
    defaultSeconds?: number;
    onComplete?: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
    defaultSeconds = 60,
    onComplete,
}) => {
    const [seconds, setSeconds] = useState(defaultSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);
                        if (onComplete) onComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, seconds, onComplete]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(defaultSeconds);
    };

    const adjustTime = (amount: number) => {
        setSeconds((prev) => Math.max(0, prev + amount));
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.timerDisplay}>
                <Text style={styles.timeText}>{formatTime(seconds)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={() => adjustTime(-10)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>-10</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleTimer} style={styles.mainButton}>
                    {isActive ? (
                        <Pause color={COLORS.background} size={24} />
                    ) : (
                        <Play color={COLORS.background} size={24} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={resetTimer} style={styles.iconButton}>
                    <RotateCcw color={COLORS.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => adjustTime(30)} style={styles.adjustButton}>
                    <Text style={styles.adjustText}>+30</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        marginBottom: 16,
    },
    timerDisplay: {
        marginBottom: 16,
    },
    timeText: {
        fontSize: 48,
        fontWeight: "700",
        color: COLORS.primary,
        fontVariant: ["tabular-nums"],
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    mainButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    adjustButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
    },
    adjustText: {
        color: COLORS.textPrimary,
        fontWeight: "600",
        fontSize: 14,
    },
});
