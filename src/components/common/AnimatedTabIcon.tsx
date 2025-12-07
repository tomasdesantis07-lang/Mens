import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";

interface AnimatedTabIconProps {
    icon: React.ReactNode;
    focused: boolean;
    color: string;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
    icon,
    focused,
    color,
}) => {
    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.7);
    const rippleScale = useSharedValue(0);
    const rippleOpacity = useSharedValue(0);

    // Liquid bounce effect values
    const translateY = useSharedValue(0);

    useEffect(() => {
        if (focused) {
            // Icon pop and bounce
            scale.value = withSpring(1.2, {
                damping: 10,
                stiffness: 200,
            });
            opacity.value = withTiming(1, { duration: 200 });

            // Liquid ripple effect
            rippleScale.value = 0;
            rippleOpacity.value = 0.5;

            rippleScale.value = withSpring(1.5, {
                damping: 20,
                stiffness: 90,
            });
            rippleOpacity.value = withTiming(0, { duration: 800 });

            // Subtle floating/bobbing when active (liquid feel)
            translateY.value = withRepeat(
                withSequence(
                    withTiming(-2, { duration: 1500 }),
                    withTiming(2, { duration: 1500 })
                ),
                -1,
                true
            );

        } else {
            scale.value = withSpring(1, {
                damping: 12,
                stiffness: 180,
            });
            opacity.value = withTiming(0.6, { duration: 200 });
            translateY.value = withSpring(0);

            // Reset ripple
            rippleScale.value = withTiming(0);
            rippleOpacity.value = withTiming(0);
        }
    }, [focused]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ],
        opacity: opacity.value,
    }));

    const rippleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
    }));

    // Glow effect behind the icon
    const glowStyle = useAnimatedStyle(() => ({
        opacity: focused ? withTiming(0.3, { duration: 500 }) : withTiming(0, { duration: 300 }),
        transform: [{ scale: focused ? withSpring(1.2) : withSpring(0.5) }],
    }));

    return (
        <View style={styles.container}>
            {/* Liquid Ripple/Glow Background */}
            <Animated.View style={[styles.glow, glowStyle, { backgroundColor: color }]} />
            <Animated.View style={[styles.ripple, rippleStyle, { borderColor: color }]} />

            <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
                {icon}
            </Animated.View>

            {/* Small dot indicator */}
            {focused && (
                <Animated.View
                    entering={FadeIn.springify().damping(12)}
                    style={[styles.dot, { backgroundColor: color }]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
    },
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },
    ripple: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        zIndex: 1,
    },
    glow: {
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        zIndex: 0,
        // @ts-ignore
        filter: 'blur(10px)',
    },
    dot: {
        position: 'absolute',
        bottom: -6,
        width: 3,
        height: 3,
        borderRadius: 1.5,
    }
});
