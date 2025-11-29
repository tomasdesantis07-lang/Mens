import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { COLORS, COMPONENTS } from "../../theme/theme";

interface CustomInputProps extends TextInputProps { }

export const CustomInput: React.FC<CustomInputProps> = (props) => {
    return (
        <TextInput
            placeholderTextColor={COMPONENTS.input.placeholder}
            {...props}
            style={[styles.input, props.style]}
        />
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: COMPONENTS.input.background,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.textPrimary,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COMPONENTS.input.border,
    },
});
