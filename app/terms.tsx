import { useRouter } from 'expo-router';
import { CheckSquare, Square } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { COLORS, TYPOGRAPHY } from '../src/theme/theme';

const TermsScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const [accepted, setAccepted] = useState(false);
    const insets = useSafeAreaInsets();

    const handleContinue = () => {
        if (accepted) {
            // Navigate to Auth, but technically replace the current stack so they can't go back to Terms easily
            // Actually, standard nav to Auth is fine.
            router.replace('/auth');
        }
    };

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.logoText}>MENS</Text>
                    <Text style={styles.title}>{t('terms.title')}</Text>
                    <Text style={styles.subtitle}>{t('terms.subtitle')}</Text>
                </View>

                <ScrollView style={styles.termsBox} contentContainerStyle={styles.termsContent}>
                    <Text style={styles.termsText}>
                        {t('terms.legal_text_placeholder')}
                        {/* Real text usually much longer. Using a placeholder or translation key */}
                    </Text>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setAccepted(!accepted)}
                        activeOpacity={0.8}
                    >
                        {accepted ? (
                            <CheckSquare size={24} color={COLORS.primary} />
                        ) : (
                            <Square size={24} color={COLORS.textTertiary} />
                        )}
                        <Text style={styles.checkboxText}>
                            {t('terms.accept_label')} <Text style={styles.link} onPress={() => openLink('https://mens-app.com/terms')}>{t('terms.terms_link')}</Text> {t('terms.and')} <Text style={styles.link} onPress={() => openLink('https://mens-app.com/privacy')}>{t('terms.privacy_link')}</Text>
                        </Text>
                    </TouchableOpacity>

                    <PrimaryButton
                        title={t('terms.continue')}
                        onPress={handleContinue}
                        disabled={!accepted}
                        style={{ marginTop: 24 }}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    logoText: {
        color: COLORS.primary,
        fontSize: 24,
        fontFamily: 'Mens-Display',
        marginBottom: 16,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    termsBox: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    termsContent: {
        padding: 16,
    },
    termsText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    footer: {
        marginBottom: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Top align for multi-line text
        gap: 12,
    },
    checkboxText: {
        flex: 1,
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textPrimary,
        lineHeight: 24, // Align with icon
    },
    link: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    }
});

export default TermsScreen;
