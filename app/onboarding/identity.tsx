import { useRouter } from 'expo-router';
import { Check, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { AuthService } from '../../src/services/authService';
import { COLORS, TYPOGRAPHY } from '../../src/theme/theme';

const IdentityScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { data, updateData } = useOnboarding();

    // Local state for username validation
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Generate username suggestions
    const generateSuggestions = (base: string): string[] => {
        const clean = base.replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
        if (clean.length < 2) return [];

        const suggestions: string[] = [];
        const suffixes = [
            `${Math.floor(Math.random() * 100)}`,
            `_${Math.floor(Math.random() * 100)}`,
            `${Math.floor(Math.random() * 10)}`,
            `_`,
            `${Math.floor(Math.random() * 1000)}`,
        ];

        while (suggestions.length < 3) {
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const suggestion = `@${clean}${suffix}`.slice(0, 20);
            if (!suggestions.includes(suggestion)) {
                suggestions.push(suggestion);
            }
        }
        return suggestions;
    };

    // Check username logic
    useEffect(() => {
        const username = data.username;

        if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);

        if (!username || username.length < 4) { // @ + 3 chars
            setUsernameStatus('idle');
            setUsernameSuggestions([]);
            return;
        }

        setUsernameStatus('checking');

        usernameCheckTimeout.current = setTimeout(async () => {
            try {
                const isAvailable = await AuthService.checkUsernameAvailable(username);
                if (isAvailable) {
                    setUsernameStatus('available');
                    setUsernameSuggestions([]);
                } else {
                    setUsernameStatus('taken');
                    setUsernameSuggestions(generateSuggestions(username));
                }
            } catch (error) {
                console.error('Error checking username', error);
                setUsernameStatus('available'); // Fallback to optimistic
            }
        }, 500);

        return () => {
            if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
        }
    }, [data.username]);

    const isValid =
        data.displayName.trim().length > 0 &&
        /^@[a-z0-9_]{3,}$/.test(data.username) &&
        usernameStatus === 'available';

    const handleNext = () => {
        if (isValid) {
            router.push('/onboarding/biometrics');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.stepIndicator}>{t('onboarding.step_counter', { current: 1, total: 3 })}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.appTitle}>MENS</Text>
                <Text style={styles.title}>{t('onboarding.step1_title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step1_subtitle')}</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('onboarding.name_question')}</Text>
                    <View style={styles.inputWrapper}>
                        <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('onboarding.name_placeholder')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={data.displayName}
                            onChangeText={(text) => updateData({ displayName: text })}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('onboarding.username_question')}</Text>
                    <View style={[
                        styles.inputWrapper,
                        usernameStatus === 'taken' && { borderColor: COLORS.error, borderWidth: 1 },
                        usernameStatus === 'available' && { borderColor: COLORS.success, borderWidth: 1 }
                    ]}>
                        <Text style={styles.prefix}>@</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('onboarding.username_placeholder')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={data.username.startsWith('@') ? data.username.substring(1) : data.username}
                            onChangeText={(text) => {
                                const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                updateData({ username: '@' + clean });
                            }}
                            autoCapitalize="none"
                            maxLength={20}
                        />
                        {usernameStatus === 'checking' && (
                            <Text style={styles.checkingText}>{t('onboarding.username_checking')}</Text>
                        )}
                        {usernameStatus === 'available' && (
                            <Check size={18} color={COLORS.success} />
                        )}
                    </View>

                    {usernameStatus === 'taken' && (
                        <View>
                            <Text style={styles.errorText}>{t('onboarding.username_taken')}</Text>
                            {usernameSuggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <Text style={styles.suggestionsLabel}>{t('onboarding.username_suggestions')}</Text>
                                    <View style={styles.suggestionsRow}>
                                        {usernameSuggestions.map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={styles.chip}
                                                onPress={() => updateData({ username: s })}
                                            >
                                                <Text style={styles.chipText}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                    {usernameStatus === 'idle' && (
                        <Text style={styles.helperText}>{t('onboarding.username_helper')}</Text>
                    )}
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
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    stepIndicator: {
        ...TYPOGRAPHY.label,
        color: COLORS.textTertiary,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    appTitle: {
        fontFamily: 'Mens-Display',
        fontSize: 24,
        color: COLORS.primary,
        marginBottom: 8,
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
    formGroup: {
        marginBottom: 24,
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
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    prefix: {
        ...TYPOGRAPHY.body,
        color: COLORS.textTertiary,
        marginRight: 2,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
        height: '100%',
    },
    helperText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
        marginTop: 8,
    },
    checkingText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
        marginRight: 8,
    },
    errorText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.error,
        marginTop: 8,
    },
    suggestionsContainer: {
        marginTop: 12,
    },
    suggestionsLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: COLORS.cardAlt,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: COLORS.background, // Should be transparent gradient ideally? but background is fine logic wise
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    }
});

export default IdentityScreen;
