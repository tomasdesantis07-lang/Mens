import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";
import { COMPONENTS } from "../../theme/theme";
import { MensHaptics } from "../../utils/haptics";

interface PrimaryButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    loading,
    style,
    disabled,
    onPress,
    ...props
}) => {
    const handlePress = (event: any) => {
        if (!loading && !disabled) {
            MensHaptics.light();
            onPress?.(event);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }, style]}
            disabled={loading || disabled}
            onPress={handlePress}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={COMPONENTS.button.solid.text} />
            ) : (
                <Text style={styles.primaryButtonText}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    primaryButton: {
        backgroundColor: COMPONENTS.button.solid.background,
        borderRadius: 999,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: "center",
        marginTop: 8,
    },
    primaryButtonText: {
        color: COMPONENTS.button.solid.text,
        fontSize: 16,
        fontWeight: "600",
    },
});
