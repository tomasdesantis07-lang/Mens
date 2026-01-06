import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";
import { COLORS, COMPONENTS } from "../../theme/theme";
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

    const isDisabled = loading || disabled;

    return (
        <TouchableOpacity
            style={[
                styles.primaryButton,
                isDisabled && styles.disabledButton,
                style
            ]}
            disabled={isDisabled}
            onPress={handlePress}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={COMPONENTS.button.solid.text} />
            ) : (
                <Text style={[
                    styles.primaryButtonText,
                    isDisabled && styles.disabledButtonText
                ]}>
                    {title}
                </Text>
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
    disabledButton: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    primaryButtonText: {
        color: COMPONENTS.button.solid.text,
        fontSize: 16,
        fontWeight: "600",
    },
    disabledButtonText: {
        color: COLORS.textTertiary,
    },
});

