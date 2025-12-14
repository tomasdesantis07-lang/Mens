import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { AnimatedBrandLogo } from './AnimatedBrandLogo';

interface CustomSplashScreenProps {
    isReady: boolean;
    isNewUser: boolean;
    onAnimationComplete?: () => void;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({
    isReady,
    isNewUser,
    onAnimationComplete,
}) => {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);

    useEffect(() => {
        if (isReady) {
            // Start exit animation based on user type
            if (isNewUser) {
                // New User: Logo moves to Top Header position
                // Scale stays normal, moves up and slightly left
                scale.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) });
                translateY.value = withTiming(-200, { duration: 600, easing: Easing.inOut(Easing.ease) });
                translateX.value = withTiming(-50, { duration: 600, easing: Easing.inOut(Easing.ease) });
            } else {
                // Logged In User: Logo shrinks and slides down
                scale.value = withTiming(0.8, { duration: 400, easing: Easing.inOut(Easing.ease) });
                translateY.value = withTiming(
                    500,
                    {
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                    },
                    (finished) => {
                        if (finished && onAnimationComplete) {
                            runOnJS(onAnimationComplete)();
                        }
                    }
                );
            }

            // Fade out the splash screen background
            opacity.value = withTiming(0, {
                duration: 600,
                easing: Easing.inOut(Easing.ease),
            });
        }
    }, [isReady, isNewUser]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const logoStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
            { translateX: translateX.value },
        ],
    }));

    // Don't render if animation is complete and we're logged in
    if (!isReady && opacity.value === 0) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, containerStyle]} pointerEvents={isReady ? 'none' : 'auto'}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <AnimatedBrandLogo style={logoStyle} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
});
