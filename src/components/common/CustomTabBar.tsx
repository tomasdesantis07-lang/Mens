import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../../theme/theme';
import { MensHaptics } from '../../utils/haptics';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const translateX = useSharedValue(0);
    const [containerWidth, setContainerWidth] = useState(0);

    const tabCount = state.routes.length;
    const tabWidth = containerWidth / tabCount;

    useEffect(() => {
        if (containerWidth > 0) {
            // Calculate center position of the tab minus half the indicator width
            const targetPosition = state.index * tabWidth + tabWidth / 2 - 24;
            translateX.value = withSpring(targetPosition, {
                damping: 35,
                stiffness: 120,
            });
        }
    }, [state.index, containerWidth, tabWidth]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    return (
        <View style={styles.tabBarContainer}>
            <BlurView
                intensity={95}
                tint="dark"
                style={styles.blurContainer}
            >
                <View style={styles.tabsRow} onLayout={onLayout}>
                    {/* Sliding circle indicator */}
                    <Animated.View style={[styles.indicatorWrapper, indicatorStyle]}>
                        <View style={styles.indicator} />
                    </Animated.View>

                    {/* Tab buttons */}
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                MensHaptics.selection();
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                onPress={onPress}
                                style={styles.tab}
                            >
                                {options.tabBarIcon?.({
                                    focused: isFocused,
                                    color: isFocused ? COLORS.primary : COLORS.textSecondary,
                                    size: 26,
                                })}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 60,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    blurContainer: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(10, 10, 15, 0.4)',
    },
    indicatorWrapper: {
        position: 'absolute',
        top: 6,
        left: 0,
        height: 48,
        width: 48,
    },
    indicator: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '25',
        borderWidth: 1.5,
        borderColor: COLORS.primary + '40',
    },
    tabsRow: {
        flexDirection: 'row',
        flex: 1,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
