import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
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
// PERFORMANCE: Entry animations DISABLED for PagerView compatibility
// All wrappers now render children directly without animation
// This prevents JS thread blocking when swiping between tabs
// ============================================

// ============================================
// ANIMATED CARD WRAPPER (No animation - performance)
// ============================================
interface AnimatedCardProps {
    children: React.ReactNode;
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    style,
}) => {
    return <View style={style}>{children}</View>;
};

// ============================================
// ANIMATED POP-IN (No animation - performance)
// ============================================
interface AnimatedPopInProps {
    children: React.ReactNode;
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedPopIn: React.FC<AnimatedPopInProps> = ({
    children,
    style,
}) => {
    return <View style={style}>{children}</View>;
};

// ============================================
// ANIMATED SLIDE-IN (No animation - performance)
// ============================================
interface AnimatedSlideInProps {
    children: React.ReactNode;
    direction?: "up" | "down" | "right" | "left";
    index?: number;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedSlideIn: React.FC<AnimatedSlideInProps> = ({
    children,
    style,
}) => {
    return <View style={style}>{children}</View>;
};

// ============================================
// ANIMATED SECTION (No animation - performance)
// ============================================
interface AnimatedSectionProps {
    children: React.ReactNode;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
    children,
    style,
}) => {
    return <View style={style}>{children}</View>;
};

// ============================================
// ANIMATED HEADER (No animation - performance)
// ============================================
interface AnimatedHeaderProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
    children,
    style,
}) => {
    return <View style={style}>{children}</View>;
};

// ============================================
// ANIMATED LIST ITEM (No animation - performance)
// ============================================
interface AnimatedListItemProps {
    children: React.ReactNode;
    index: number;
    style?: StyleProp<ViewStyle>;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
    children,
    style,
}) => {
    return <View style={style}>{children}</View>;
};

// ============================================
// BOUNCE ON PRESS HOOK (Still active - user interaction)
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
// PULSE ANIMATION HOOK (Still active - user interaction)
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
