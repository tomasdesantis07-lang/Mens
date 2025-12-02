import { useRouter } from "expo-router";
import { Edit3, Sparkles } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../src/theme/theme";

const CreateRoutineScreen: React.FC = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        >
            <Text style={styles.title}>{t('routines.create_title')}</Text>
            <Text style={styles.subtitle}>
                {t('routines.create_subtitle')}
            </Text>

            <View style={styles.optionsContainer}>
                {/* Manual Creation - Enabled */}
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => router.push("../routines/manual-editor" as any)}
                >
                    <View style={styles.iconContainer}>
                        <Edit3 color={COLORS.primary} size={32} />
                    </View>
                    <Text style={styles.optionTitle}>{t('routines.create_manual')}</Text>
                    <Text style={styles.optionDescription}>
                        {t('routines.create_manual_desc')}
                    </Text>
                </TouchableOpacity>

                {/* AI Creation - Disabled */}
                <TouchableOpacity
                    style={[styles.optionCard, styles.optionCardDisabled]}
                    disabled
                >
                    <View style={styles.iconContainer}>
                        <Sparkles color={COLORS.textSecondary} size={32} />
                    </View>
                    <Text style={[styles.optionTitle, styles.textDisabled]}>
                        {t('routines.create_ai')}
                    </Text>
                    <Text style={[styles.optionDescription, styles.textDisabled]}>
                        {t('routines.create_ai_desc')}
                    </Text>
                    <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>{t('common.coming_soon')}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default CreateRoutineScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 32,
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        position: "relative",
    },
    optionCardDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    optionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    optionDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    textDisabled: {
        color: COLORS.textTertiary,
    },
    comingSoonBadge: {
        position: "absolute",
        top: 16,
        right: 16,
        backgroundColor: COLORS.warning,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    comingSoonText: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.background,
    },
    backButton: {
        marginTop: 24,
        alignItems: "center",
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
});
