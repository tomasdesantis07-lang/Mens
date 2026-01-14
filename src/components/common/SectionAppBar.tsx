import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import {
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_FAMILY } from '../../theme/theme';

interface SectionAppBarProps {
    title: string;
    rightIcon?: ReactNode;
    onRightPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export const SectionAppBar: React.FC<SectionAppBarProps> = ({
    title,
    rightIcon,
    onRightPress,
    style,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <BlurView
            intensity={95}
            tint="dark"
            style={[styles.container, { paddingTop: insets.top + 12 }, style]}
        >
            <Text style={styles.title}>{title}</Text>

            <View style={styles.actions}>
                {rightIcon && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onRightPress}
                        activeOpacity={0.7}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(10, 10, 15, 0.85)', // Increased opacity slightly for visibility test
        elevation: 10,
        zIndex: 10,
    },
    title: {
        fontSize: 20,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
});
