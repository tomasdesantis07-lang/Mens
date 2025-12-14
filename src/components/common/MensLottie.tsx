import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

interface MensLottieProps {
    source: any; // JSON animation file or require()
    loop?: boolean;
    autoPlay?: boolean;
    speed?: number;
    style?: any;
}

/**
 * Wrapper component for Lottie animations with auto-play functionality
 * @example
 * <MensLottie source={require('../../assets/animations/success.json')} />
 */
export const MensLottie: React.FC<MensLottieProps> = ({
    source,
    loop = false,
    autoPlay = true,
    speed = 1,
    style,
}) => {
    const animationRef = useRef<LottieView>(null);

    useEffect(() => {
        if (autoPlay && animationRef.current) {
            animationRef.current.play();
        }
    }, [autoPlay]);

    return (
        <View style={[styles.container, style]}>
            <LottieView
                ref={animationRef}
                source={source}
                loop={loop}
                speed={speed}
                style={styles.animation}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
    animation: {
        width: "100%",
        height: "100%",
    },
});
