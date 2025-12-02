import { AlertTriangle } from "lucide-react-native";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../theme/theme";

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "warning";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
    variant = "warning",
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            {/* Backdrop with opacity */}
            <View style={styles.backdrop}>
                {/* Dialog Container */}
                <View style={styles.dialogContainer}>
                    {/* Icon */}
                    <View style={[
                        styles.iconContainer,
                        variant === "danger" && styles.iconContainerDanger
                    ]}>
                        <AlertTriangle
                            size={32}
                            color={variant === "danger" ? COLORS.error : COLORS.warning}
                            strokeWidth={2.5}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                variant === "danger" && styles.confirmButtonDanger
                            ]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    dialogContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 400,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${COLORS.warning}20`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    iconContainerDanger: {
        backgroundColor: `${COLORS.error}20`,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: "center",
    },
    message: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    confirmButton: {
        backgroundColor: COLORS.warning,
    },
    confirmButtonDanger: {
        backgroundColor: COLORS.error,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textInverse,
    },
});
