/**
 * DeleteAccountDialog.tsx - MENS Branded Account Deletion Confirmation
 * 
 * A high-security dialog that requires the user to type their username
 * exactly to confirm account deletion. Includes password confirmation for re-auth.
 */

import { Eye, EyeOff, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { COLORS, FONT_FAMILY, TYPOGRAPHY } from "../../theme/theme";

interface DeleteAccountDialogProps {
    visible: boolean;
    username: string;
    onConfirm: (password: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
    visible,
    username,
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!visible) {
            setInputValue("");
            setPassword("");
            setHasTriedSubmit(false);
        }
    }, [visible]);

    const isMatch = inputValue.trim() === username.trim();
    const isPasswordValid = password.length > 0;
    const canSubmit = isMatch && isPasswordValid;

    const showError = hasTriedSubmit && !isMatch && inputValue.length > 0;

    const handleConfirm = () => {
        setHasTriedSubmit(true);
        if (canSubmit) {
            onConfirm(password);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.dialogContainer}>
                        {/* Danger Icon */}
                        <View style={styles.iconContainer}>
                            <Trash2
                                size={32}
                                color={COLORS.error}
                                strokeWidth={2.5}
                            />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>ELIMINAR CUENTA</Text>

                        {/* Warning Message */}
                        <Text style={styles.message}>
                            Esta acción es <Text style={styles.bold}>permanente</Text>.
                            Se borrarán todos tus datos.
                            {"\n\n"}
                            Escribe <Text style={styles.accent}>@{username}</Text> y tu contraseña para confirmar:
                        </Text>

                        {/* Username Input */}
                        <Text style={styles.label}>Usuario</Text>
                        <TextInput
                            style={[
                                styles.input,
                                showError && styles.inputError,
                                isMatch && styles.inputSuccess,
                            ]}
                            placeholder={`Escribe: ${username}`}
                            placeholderTextColor={COLORS.textTertiary}
                            value={inputValue}
                            onChangeText={setInputValue}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />

                        {/* Password Input */}
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Tu contraseña actual"
                                placeholderTextColor={COLORS.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={COLORS.textTertiary} />
                                ) : (
                                    <Eye size={20} color={COLORS.textTertiary} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Error Feedback */}
                        {showError && (
                            <Text style={styles.errorText}>
                                El nombre de usuario no coincide
                            </Text>
                        )}

                        {/* Match Feedback */}
                        {isMatch && !showError && (
                            <Text style={styles.matchText}>
                                ✓ Usuario verificado
                            </Text>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                                activeOpacity={0.8}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.confirmButton,
                                    (!canSubmit || isLoading) && styles.confirmButtonDisabled,
                                ]}
                                onPress={handleConfirm}
                                activeOpacity={0.8}
                                disabled={!canSubmit || isLoading}
                            >
                                <Text style={[
                                    styles.confirmButtonText,
                                    (!canSubmit || isLoading) && styles.confirmButtonTextDisabled,
                                ]}>
                                    {isLoading ? "Eliminando..." : "Eliminar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },
    dialogContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: COLORS.error + "40",
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${COLORS.error}15`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: `${COLORS.error}30`,
        alignSelf: "center",
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.error,
        marginBottom: 12,
        textAlign: "center",
        letterSpacing: 1,
    },
    message: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    bold: {
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
    },
    accent: {
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.accent,
    },
    label: {
        ...TYPOGRAPHY.label,
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: "100%",
        height: 52,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: FONT_FAMILY.regular,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    passwordContainer: {
        width: "100%",
        height: 52,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    passwordInput: {
        flex: 1,
        height: "100%",
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: FONT_FAMILY.regular,
        color: COLORS.textPrimary,
    },
    eyeButton: {
        padding: 12,
    },
    inputError: {
        borderColor: COLORS.error,
        backgroundColor: `${COLORS.error}10`,
    },
    inputSuccess: {
        borderColor: COLORS.success,
        backgroundColor: `${COLORS.success}10`,
    },
    errorText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.error,
        marginBottom: 16,
        textAlign: "center",
    },
    matchText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.success,
        marginBottom: 16,
        textAlign: "center",
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
        marginTop: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.textPrimary,
    },
    confirmButton: {
        backgroundColor: COLORS.error,
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    confirmButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.textInverse,
    },
    confirmButtonTextDisabled: {
        color: COLORS.textTertiary,
    },
});
