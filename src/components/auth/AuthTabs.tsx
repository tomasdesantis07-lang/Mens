import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../theme/theme";

interface AuthTabsProps {
    mode: "login" | "register";
    setMode: (mode: "login" | "register") => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({ mode, setMode }) => {
    const isRegister = mode === "register";

    return (
        <View style={styles.tabsRow}>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setMode("register")}
            >
                <Text
                    style={[styles.tabText, isRegister && styles.tabTextActive]}
                >
                    Crear cuenta
                </Text>
                {isRegister && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setMode("login")}
            >
                <Text
                    style={[styles.tabText, !isRegister && styles.tabTextActive]}
                >
                    Iniciar sesión
                </Text>
                {!isRegister && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    tabsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
    },
    tabText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    tabTextActive: {
        color: COLORS.textPrimary,
        fontWeight: "700",
    },
    tabIndicator: {
        marginTop: 4,
        height: 2,
        width: "60%",
        backgroundColor: COLORS.primary,
        borderRadius: 999,
    },
});
