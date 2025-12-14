import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { COLORS } from '../../theme/theme';

interface AnimatedBrandLogoProps {
    style?: any;
}

// Original SVG viewBox is 375 x 375, we scale it down
const SVG_SIZE = 200;

// MENS logo path extracted from logoMensWhite.svg
const LOGO_PATH = "M 219.367188 366.730469 C 217.796875 366.769531 189.75 262.882812 180.824219 233.582031 C 165.78125 184.226562 145.890625 126.246094 128.503906 101.523438 C 123.539062 94.464844 112.351562 81.183594 110.761719 81.328125 C 109.128906 81.472656 94.539062 97.011719 87.0625 121.210938 C 78.28125 149.644531 75.4375 163.125 85.734375 203.457031 C 88.1875 213.070312 97.761719 240.589844 99.148438 242.027344 C 99.402344 242.355469 99.265625 242.722656 98.644531 242.835938 C 96.742188 243.253906 77.105469 220.859375 70.527344 210.785156 C 40.476562 164.773438 36.792969 113.816406 61.320312 60.335938 C 83.292969 12.441406 115.089844 6.953125 115.089844 6.953125 C 116.875 6.304688 143.960938 24.5 167.5 55.523438 C 188.707031 83.472656 192.039062 91.710938 192.125 91.617188 C 192.222656 91.523438 201.457031 76.40625 214.265625 61.328125 C 238.632812 32.636719 261.515625 27.507812 262.613281 27.582031 C 262.613281 27.582031 307.183594 63.359375 315.066406 128.1875 C 320.621094 173.859375 309.945312 218.597656 308.742188 221.058594 C 307.953125 222.671875 298.691406 180.875 291.695312 160.3125 C 271.441406 100.785156 260.03125 90.96875 259.28125 90.894531 C 234.25 103.960938 210.304688 131.972656 208.902344 160.628906 C 228.253906 248.136719 233.65625 277.625 219.375 366.726562 Z M 219.367188 366.730469";

// Approximate path length (calculated from the path)
const PATH_LENGTH = 1200;
const DASH_LENGTH = 200; // Length of the visible "light" segment

// Create animated path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const AnimatedBrandLogo: React.FC<AnimatedBrandLogoProps> = ({ style }) => {
    // Floating animation
    const translateY = useSharedValue(0);

    // Dash offset for the traveling light effect
    const dashOffset = useSharedValue(0);

    useEffect(() => {
        // Start floating animation (vertical movement)
        translateY.value = withRepeat(
            withTiming(-15, {
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );

        // Animate dash offset to make the light travel around the path
        dashOffset.value = withRepeat(
            withTiming(PATH_LENGTH, {
                duration: 2500,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const floatingStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Animated props for the traveling glows (all use same offset)
    const animatedGlowProps = useAnimatedProps(() => ({
        strokeDashoffset: dashOffset.value,
    }));

    return (
        <Animated.View style={[styles.container, floatingStyle, style]}>
            {/* === GLOW LAYERS (BEHIND THE LOGO) === */}

            {/* Outer glow layer (widest, most transparent) */}
            <View style={styles.glowLayer}>
                <Svg
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    viewBox="0 0 375 375"
                >
                    <Defs>
                        <LinearGradient id="outerGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="30%" stopColor={COLORS.accent} stopOpacity="0.3" />
                            <Stop offset="50%" stopColor={COLORS.primary} stopOpacity="0.5" />
                            <Stop offset="70%" stopColor={COLORS.accent} stopOpacity="0.3" />
                            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <AnimatedPath
                        d={LOGO_PATH}
                        stroke="url(#outerGlow)"
                        strokeWidth={20}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={`${DASH_LENGTH} ${PATH_LENGTH - DASH_LENGTH}`}
                        animatedProps={animatedGlowProps}
                    />
                </Svg>
            </View>

            {/* Middle glow layer */}
            <View style={styles.glowLayer}>
                <Svg
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    viewBox="0 0 375 375"
                >
                    <Defs>
                        <LinearGradient id="middleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="35%" stopColor={COLORS.accent} stopOpacity="0.6" />
                            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
                            <Stop offset="65%" stopColor={COLORS.accent} stopOpacity="0.6" />
                            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <AnimatedPath
                        d={LOGO_PATH}
                        stroke="url(#middleGlow)"
                        strokeWidth={12}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={`${DASH_LENGTH} ${PATH_LENGTH - DASH_LENGTH}`}
                        animatedProps={animatedGlowProps}
                    />
                </Svg>
            </View>

            {/* Inner core (brightest) */}
            <View style={styles.glowLayer}>
                <Svg
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    viewBox="0 0 375 375"
                >
                    <Defs>
                        <LinearGradient id="coreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.9" />
                            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.9" />
                            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <AnimatedPath
                        d={LOGO_PATH}
                        stroke="url(#coreGlow)"
                        strokeWidth={6}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={`${DASH_LENGTH} ${PATH_LENGTH - DASH_LENGTH}`}
                        animatedProps={animatedGlowProps}
                    />
                </Svg>
            </View>

            {/* === LOGO (IN FRONT) === */}
            <View style={styles.logoLayer}>
                <Svg
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    viewBox="0 0 375 375"
                >
                    <Path
                        d={LOGO_PATH}
                        fill="#FFFFFF"
                        fillRule="nonzero"
                    />
                </Svg>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SVG_SIZE + 40,
        height: SVG_SIZE + 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowLayer: {
        position: 'absolute',
        width: SVG_SIZE,
        height: SVG_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    logoLayer: {
        position: 'absolute',
        width: SVG_SIZE,
        height: SVG_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // Logo always on top
    },
});
