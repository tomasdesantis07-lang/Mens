import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from "react-native-reanimated";

// ============================================
// TIMING CONFIGURATIONS
// ============================================
export const TIMING_CONFIG = {
    fast: { duration: 200, easing: Easing.out(Easing.cubic) },
    normal: { duration: 300, easing: Easing.out(Easing.cubic) },
    slow: { duration: 400, easing: Easing.out(Easing.cubic) },
};

// ============================================
// ANIMATION DURATIONS
// ============================================
export const DURATIONS = {
    fast: 200,
    normal: 300,
    slow: 400,
};

// ============================================
// STAGGER DELAYS
// ============================================
export const STAGGER = {
    fast: 50,
    normal: 80,
    slow: 120,
};

// ============================================
// ANIMATED CARD WRAPPER (con repeat on focus)
// ============================================
interface AnimatedCardProps {
    children: React.ReactNode;
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    index = 0,
    delay = 0,
    style,
}) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    const baseDelay = delay + index * STAGGER.normal;

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            translateY.value = 20;

            opacity.value = withDelay(
                baseDelay,
                withTiming(1, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) })
            );
            translateY.value = withDelay(
                baseDelay,
                withTiming(0, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) })
            );
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[{ width: '100%' }, animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// ANIMATED POP-IN (con repeat on focus)
// ============================================
interface AnimatedPopInProps {
    children: React.ReactNode;
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedPopIn: React.FC<AnimatedPopInProps> = ({
    children,
    index = 0,
    delay = 0,
    style,
}) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);

    const baseDelay = delay + index * STAGGER.fast;

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            opacity.value = withDelay(
                baseDelay,
                withTiming(1, { duration: DURATIONS.fast, easing: Easing.out(Easing.cubic) })
            );
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// ANIMATED SLIDE-IN (con repeat on focus)
// ============================================
interface AnimatedSlideInProps {
    children: React.ReactNode;
    direction?: "up" | "down" | "right";
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedSlideIn: React.FC<AnimatedSlideInProps> = ({
    children,
    direction = "up",
    index = 0,
    delay = 0,
    style,
}) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(direction === "right" ? 30 : 0);
    const translateY = useSharedValue(direction === "down" ? 20 : direction === "up" ? -20 : 0);

    const baseDelay = delay + index * STAGGER.normal;

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            translateX.value = direction === "right" ? 30 : 0;
            translateY.value = direction === "down" ? 20 : direction === "up" ? -20 : 0;

            opacity.value = withDelay(
                baseDelay,
                withTiming(1, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) })
            );
            translateX.value = withDelay(
                baseDelay,
                withTiming(0, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) })
            );
            translateY.value = withDelay(
                baseDelay,
                withTiming(0, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) })
            );
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// ANIMATED SECTION (con repeat on focus)
// ============================================
interface AnimatedSectionProps {
    children: React.ReactNode;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
    children,
    delay = 0,
    style,
}) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            opacity.value = withDelay(
                delay,
                withTiming(1, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) })
            );
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// ANIMATED HEADER (con repeat on focus)
// ============================================
interface AnimatedHeaderProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
    children,
    style,
}) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(15);

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            translateY.value = 15;

            opacity.value = withTiming(1, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) });
            translateY.value = withTiming(0, { duration: DURATIONS.normal, easing: Easing.out(Easing.cubic) });
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// ANIMATED LIST ITEM (con repeat on focus)
// ============================================
interface AnimatedListItemProps {
    children: React.ReactNode;
    index: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
    children,
    index,
    style,
}) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    const delay = Math.min(index * STAGGER.fast, 400);

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            translateY.value = 20;

            opacity.value = withDelay(
                delay,
                withTiming(1, { duration: DURATIONS.fast, easing: Easing.out(Easing.cubic) })
            );
            translateY.value = withDelay(
                delay,
                withTiming(0, { duration: DURATIONS.fast, easing: Easing.out(Easing.cubic) })
            );
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// BOUNCE ON PRESS HOOK
// ============================================
export const useBounceAnimation = () => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const bounce = () => {
        scale.value = withSequence(
            withTiming(0.97, { duration: 100, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 100, easing: Easing.out(Easing.cubic) })
        );
    };

    return { animatedStyle, bounce };
};

// ============================================
// PULSE ANIMATION HOOK
// ============================================
export const usePulseAnimation = () => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const pulse = () => {
        scale.value = withSequence(
            withTiming(1.02, { duration: 150, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })
        );
        opacity.value = withSequence(
            withTiming(0.9, { duration: 150, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })
        );
    };

    return { animatedStyle, pulse };
};
