import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { COLORS } from "../../theme/theme";

interface SkeletonProps {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

/**
 * Animated skeleton placeholder for loading states.
 * Replaces boring spinners with a more premium loading experience.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = "100%",
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius },
                animatedStyle,
                style,
            ]}
        />
    );
};

/**
 * Skeleton for a workout session card in the history list.
 */
export const SkeletonSessionCard: React.FC = () => (
    <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
            <Skeleton width="60%" height={18} />
            <Skeleton width={70} height={14} />
        </View>
        <View style={styles.sessionStats}>
            <View style={styles.statItem}>
                <Skeleton width={40} height={24} />
                <Skeleton width={60} height={12} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Skeleton width={50} height={24} />
                <Skeleton width={50} height={12} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Skeleton width={45} height={24} />
                <Skeleton width={30} height={12} style={{ marginTop: 6 }} />
            </View>
        </View>
    </View>
);

/**
 * Skeleton for an exercise card in the training screen.
 */
export const SkeletonExerciseCard: React.FC = () => (
    <View style={styles.exerciseCard}>
        <View style={styles.exerciseHeader}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
        </View>
    </View>
);

/**
 * Skeleton for a stat card on the home screen.
 */
export const SkeletonStatCard: React.FC = () => (
    <View style={styles.statCard}>
        <Skeleton width={60} height={12} />
        <Skeleton width={50} height={32} style={{ marginTop: 10 }} />
        <Skeleton width={40} height={12} style={{ marginTop: 6 }} />
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.surface,
    },
    sessionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
    },
    sessionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sessionStats: {
        flexDirection: "row",
        alignItems: "center",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.border,
        marginHorizontal: 8,
    },
    exerciseCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 16,
    },
    exerciseHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
        alignItems: "center",
        justifyContent: "center",
        height: 100,
    },
});
