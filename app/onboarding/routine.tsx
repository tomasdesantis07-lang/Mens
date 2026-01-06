import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, Info } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { COLORS, TYPOGRAPHY } from '../../src/theme/theme';

const RoutineSelectionScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { data, updateData, saveAndFinish, isSaving } = useOnboarding();

    const [selectedfrequency, setSelectedFrequency] = useState<number | null>(null);

    const frequencies = [
        { days: 2, title: t('routine_selection.options.2_days.title'), desc: t('routine_selection.options.2_days.desc') },
        { days: 3, title: t('routine_selection.options.3_days.title'), desc: t('routine_selection.options.3_days.desc') },
        { days: 4, title: t('routine_selection.options.4_days.title'), desc: t('routine_selection.options.4_days.desc') },
        { days: 5, title: t('routine_selection.options.5_days.title'), desc: t('routine_selection.options.5_days.desc') },
        { days: 6, title: t('routine_selection.options.6_days.title'), desc: t('routine_selection.options.6_days.desc') },
    ];

    const handleSelectFrequency = (days: number) => {
        setSelectedFrequency(days);
        updateData({ daysPerWeek: days });
    };

    const handleFinish = async () => {
        if (!selectedfrequency) return;

        try {
            // saveAndFinish will now use the daysPerWeek in context 
            // to assign a routine via OnboardingContext logic
            await saveAndFinish();
            router.replace('/(tabs)/home');
        } catch (error) {
            console.error('Error finishing onboarding:', error);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepIndicator}>{t('onboarding.step_counter', { current: 3, total: 3 })}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{t('routine_selection.title')}</Text>
                <Text style={styles.subtitle}>
                    {t('routine_selection.subtitle')}
                </Text>

                <View style={styles.grid}>
                    {frequencies.map((item) => {
                        const isSelected = selectedfrequency === item.days;
                        return (
                            <TouchableOpacity
                                key={item.days}
                                style={[styles.card, isSelected && styles.cardSelected]}
                                onPress={() => handleSelectFrequency(item.days)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                        <Calendar size={20} color={isSelected ? COLORS.textInverse : COLORS.primary} />
                                    </View>
                                    {isSelected && <Check size={20} color={COLORS.primary} />}
                                </View>

                                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                                    {item.desc}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Info Note */}
                <View style={styles.infoBox}>
                    <Info size={16} color={COLORS.textTertiary} style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>
                        {t('routine_selection.info')}
                    </Text>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title={isSaving ? t('routine_selection.saving') : t('routine_selection.start_button')}
                    onPress={handleFinish}
                    disabled={!selectedfrequency || isSaving}
                    loading={isSaving}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backButton: {
        marginRight: 16,
    },
    stepIndicator: {
        ...TYPOGRAPHY.label,
        color: COLORS.textTertiary,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        ...TYPOGRAPHY.bodyLarge,
        color: COLORS.textSecondary,
        marginBottom: 32,
    },
    grid: {
        gap: 12,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'column',
    },
    cardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10', // 10% opacity primary
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.cardAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerSelected: {
        backgroundColor: COLORS.primary,
    },
    cardTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    cardTitleSelected: {
        color: COLORS.primary,
    },
    cardDesc: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
    cardDescSelected: {
        color: COLORS.textSecondary,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 24,
        padding: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
    },
    infoText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textTertiary,
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
});

export default RoutineSelectionScreen;
