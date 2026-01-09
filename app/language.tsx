import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { changeLanguage } from "../src/config/i18n";
import { COLORS } from "../src/theme/theme";

const LanguageScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const handleLanguageSelect = async (lang: "es" | "en") => {
        await changeLanguage(lang);
        // Navigate directly to auth screen (terms checkbox is now inline)
        router.replace("/auth");
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.title}>{t('language_selection.title')}</Text>

            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleLanguageSelect("es")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.flag}>🇪🇸</Text>
                    <Text style={styles.optionText}>{t('language_selection.spanish')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleLanguageSelect("en")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.flag}>🇺🇸</Text>
                    <Text style={styles.optionText}>{t('language_selection.english')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LanguageScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 48,
        textAlign: "center",
    },
    optionsContainer: {
        width: "100%",
        gap: 16,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    flag: {
        fontSize: 32,
        marginRight: 16,
    },
    optionText: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
});
