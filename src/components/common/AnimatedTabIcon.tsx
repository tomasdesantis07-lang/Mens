import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface AnimatedTabIconProps {
    icon: React.ReactNode;
    focused: boolean;
    color: string;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
    icon,
    focused,
}) => {
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withSpring(focused ? 1 : 0.5, {
            damping: 15,
            stiffness: 150,
        });
    }, [focused]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={animatedIconStyle}>
                {icon}
            </Animated.View>
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
});
