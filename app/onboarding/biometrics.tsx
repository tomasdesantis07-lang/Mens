import { useRouter } from 'expo-router';
import { ArrowLeft, Ruler, ShieldAlert, Weight } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { COLORS, TYPOGRAPHY } from '../../src/theme/theme';
import { calculateAge } from '../../src/utils/healthUtils';

const BiometricsScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { data, updateData } = useOnboarding();

    const isValid =
        !!data.biometrics.birthDate &&
        data.biometrics.birthDate.length === 14 && // Complete date: "YYYY / MM / DD"
        !!data.biometrics.weight &&
        !!data.biometrics.height &&
        !!data.biometrics.gender;

    const handleNext = () => {
        if (isValid) {
            // Navigate to step 3: Routine Selection (simplified for your new flow)
            // Based on your diagram, after biometrics we go to "3. Elegir rutina"
            router.push('/onboarding/routine');
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
                <Text style={styles.stepIndicator}>{t('onboarding.step_counter', { current: 2, total: 3 })}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{t('onboarding.step2_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step2_subtitle')}</Text>

                {/* Privacy Notice */}
                <View style={styles.privacyBox}>
                    <ShieldAlert size={16} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
                    <Text style={styles.privacyText}>{t('onboarding.privacy_warning')}</Text>
                </View>

                {/* Row 1: Birth Date & Gender */}
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{t('onboarding.birth_date_label')}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('onboarding.birth_date_placeholder')}
                                placeholderTextColor={COLORS.textTertiary}
                                keyboardType="numeric"
                                value={data.biometrics.birthDate || ""}
                                onChangeText={(text) => {
                                    let digits = text.replace(/[^0-9]/g, '').slice(0, 8);
                                    let formatted = '';

                                    if (digits.length > 0) {
                                        formatted = digits.slice(0, 4);
                                    }
                                    if (digits.length >= 4) {
                                        formatted += ' / ' + digits.slice(4, 6);
                                    }
                                    if (digits.length >= 6) {
                                        formatted += ' / ' + digits.slice(6, 8);
                                    }

                                    updateData({
                                        biometrics: { ...data.biometrics, birthDate: formatted || null }
                                    });
                                }}
                                maxLength={14}
                            />
                        </View>
                        {data.biometrics.birthDate && data.biometrics.birthDate.length === 14 && (
                            <Text style={styles.helperText}>
                                {calculateAge(data.biometrics.birthDate.replace(/ \/ /g, '-'))} {t('onboarding.years_old')}
                            </Text>
                        )}
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{t('onboarding.gender_label')}</Text>
                        <View style={styles.genderRow}>
                            <TouchableOpacity
                                style={[styles.genderBtn, data.biometrics.gender === 'male' && styles.genderBtnActive]}
                                onPress={() => updateData({ biometrics: { ...data.biometrics, gender: 'male' } })}
                            >
                                <Text style={[styles.genderText, data.biometrics.gender === 'male' && styles.genderTextActive]}>
                                    {t('onboarding.gender_male')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderBtn, data.biometrics.gender === 'female' && styles.genderBtnActive]}
                                onPress={() => updateData({ biometrics: { ...data.biometrics, gender: 'female' } })}
                            >
                                <Text style={[styles.genderText, data.biometrics.gender === 'female' && styles.genderTextActive]}>
                                    {t('onboarding.gender_female')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Row 2: Weight & Height */}
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{t('onboarding.weight_placeholder')}</Text>
                        <View style={styles.inputWrapper}>
                            <Weight size={18} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={COLORS.textTertiary}
                                keyboardType="numeric"
                                value={data.biometrics.weight?.toString() || ""}
                                onChangeText={(text) => {
                                    const val = parseInt(text.replace(/[^0-9]/g, '')) || null;
                                    updateData({ biometrics: { ...data.biometrics, weight: val } });
                                }}
                                maxLength={3}
                            />
                            <Text style={{ color: COLORS.textTertiary, marginLeft: 4 }}>kg</Text>
                        </View>
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>{t('onboarding.height_placeholder')}</Text>
                        <View style={styles.inputWrapper}>
                            <Ruler size={18} color={COLORS.textTertiary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={COLORS.textTertiary}
                                keyboardType="numeric"
                                value={data.biometrics.height?.toString() || ""}
                                onChangeText={(text) => {
                                    const val = parseInt(text.replace(/[^0-9]/g, '')) || null;
                                    updateData({ biometrics: { ...data.biometrics, height: val } });
                                }}
                                maxLength={3}
                            />
                            <Text style={{ color: COLORS.textTertiary, marginLeft: 4 }}>cm</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title={t('common.continue')}
                    onPress={handleNext}
                    disabled={!isValid}
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
        marginBottom: 24,
    },
    privacyBox: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    privacyText: {
        flex: 1,
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textTertiary,
        lineHeight: 18,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        ...TYPOGRAPHY.label,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        height: 52,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
    },
    helperText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
        marginTop: 4,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 8,
    },
    genderBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    genderText: {
        ...TYPOGRAPHY.button,
        color: COLORS.textSecondary,
    },
    genderTextActive: {
        color: COLORS.textInverse,
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

export default BiometricsScreen;
