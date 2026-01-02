import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../src/components/common/PrimaryButton';
import { COLORS, LETTER_SPACING, TYPOGRAPHY } from '../src/theme/theme';

const PreOnboardingScreen: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();

    const handleContinue = () => {
        router.replace('/onboarding');
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{t('onboarding.pre_onboarding.title')}</Text>

                <Text style={styles.message}>
                    {t('onboarding.pre_onboarding.message')}
                </Text>

                <View style={styles.separator} />

                <Text style={styles.timeEstimate}>
                    {t('onboarding.pre_onboarding.time_estimate')}
                </Text>

                <Text style={styles.thanks}>
                    {t('onboarding.pre_onboarding.thanks')}
                </Text>
            </View>

            <View style={styles.footer}>
                <PrimaryButton
                    title={t('onboarding.pre_onboarding.continue')}
                    onPress={handleContinue}
                />
            </View>
        </View>
    );
};

export default PreOnboardingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        marginBottom: 24,
        letterSpacing: LETTER_SPACING.wide,
    },
    message: {
        ...TYPOGRAPHY.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: 24,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        width: 60,
        marginBottom: 24,
    },
    timeEstimate: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    thanks: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    footer: {
        paddingBottom: 20,
    },
});
