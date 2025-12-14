import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../../theme/theme";

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

/**
 * Premium glass-morphism card component with gradient background
 * Simulates a dark background with subtle top light and cobalt gradient
 */
export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
    return (
        <LinearGradient
            colors={[
                COLORS.primary + "15", // Very subtle cobalt tint at top (light effect)
                COLORS.card, // Main dark background
                COLORS.card, // Main dark background
                COLORS.primary + "08", // Even more subtle cobalt at bottom
            ]}
            locations={[0, 0.1, 0.9, 1]}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
        // Subtle shadow for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
