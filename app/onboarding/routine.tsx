import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, Info } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { RoutineService } from '../../src/services/routineService';
import { COLORS, TYPOGRAPHY } from '../../src/theme/theme';
import { RoutineTemplate, TemplateEquipment } from '../../src/types/routineTemplate';
import { Equipment } from '../../src/types/user';

const RoutineSelectionScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const { data, updateData, saveAndFinish, isSaving } = useOnboarding();

    const [templates, setTemplates] = React.useState<RoutineTemplate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedCategory, setSelectedCategory] = React.useState<TemplateEquipment>('Gym Completo');
    const [selectedRoutineId, setSelectedRoutineId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const fetched = await RoutineService.getRoutineTemplates();
                setTemplates(fetched);
            } catch (error) {
                console.error("Failed to fetch templates", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const filteredTemplates = templates.filter(t => t.equipment === selectedCategory);



    const handleSelectRoutine = (template: RoutineTemplate) => {
        setSelectedRoutineId(template.id || null);

        let mappedEquipment: Equipment = 'full_gym';
        if (template.equipment === 'En casa-Sin equipo') {
            mappedEquipment = 'bodyweight';
        }

        // Update context with the routine details
        updateData({
            daysPerWeek: template.daysPerWeek,
            equipment: mappedEquipment,
            selectedRoutineTemplateId: template.id
        });
    };

    const handleFinish = async (isTemplateOnly: boolean) => {
        if (!selectedRoutineId) return;

        updateData({ isTemplateOnly });

        try {
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
                <Text style={styles.title}>{t('onboarding.routine_selection.title')}</Text>
                <Text style={styles.subtitle}>
                    {t('onboarding.routine_selection.subtitle')}
                </Text>

                {/* Category Chips */}
                <View style={styles.chipsContainer}>
                    <TouchableOpacity
                        style={[styles.chip, selectedCategory === 'Gym Completo' && styles.chipSelected]}
                        onPress={() => setSelectedCategory('Gym Completo')}
                    >
                        <Text style={[styles.chipText, selectedCategory === 'Gym Completo' && styles.chipTextSelected]}>
                            {t('onboarding.routine_selection.gym_label')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, selectedCategory === 'En casa-Sin equipo' && styles.chipSelected]}
                        onPress={() => setSelectedCategory('En casa-Sin equipo')}
                    >
                        <Text style={[styles.chipText, selectedCategory === 'En casa-Sin equipo' && styles.chipTextSelected]}>
                            {t('onboarding.routine_selection.calisthenics_label')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Templates List */}
                <View style={styles.grid}>
                    {loading ? (
                        <Text style={{ color: COLORS.textSecondary }}>{t('onboarding.routine_selection.loading')}</Text>
                    ) : filteredTemplates.map((item) => {
                        const isSelected = selectedRoutineId === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, isSelected && styles.cardSelected]}
                                onPress={() => handleSelectRoutine(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                                        <Calendar size={20} color={isSelected ? COLORS.textInverse : COLORS.primary} />
                                    </View>
                                    {isSelected && <Check size={20} color={COLORS.primary} />}
                                </View>

                                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                                    {t(item.name)}
                                </Text>
                                <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                                    {item.daysPerWeek} {t('common.days_per_week')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    {!loading && filteredTemplates.length === 0 && (
                        <Text style={{ color: COLORS.textSecondary }}>{t('onboarding.routine_selection.empty_category')}</Text>
                    )}
                </View>

                {/* Info Note */}
                <View style={styles.infoBox}>
                    <Info size={16} color={COLORS.textTertiary} style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>
                        {t('onboarding.routine_selection.info')}
                    </Text>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <PrimaryButton
                    title={isSaving ? t('onboarding.routine_selection.saving') : t('onboarding.routine_selection.start_button')}
                    onPress={() => handleFinish(false)}
                    disabled={!selectedRoutineId || isSaving}
                    loading={isSaving}
                    style={{ marginBottom: 12 }}
                />
                {selectedRoutineId && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => handleFinish(true)}
                        disabled={isSaving}
                    >
                        <Text style={styles.secondaryButtonText}>{t('onboarding.routine_selection.template_only')}</Text>
                    </TouchableOpacity>
                )}
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
        paddingBottom: 150, // Extra padding for double buttons footer
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
    chipsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        ...TYPOGRAPHY.label,
        color: COLORS.textSecondary,
    },
    chipTextSelected: {
        color: COLORS.textInverse,
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
        paddingBottom: 34, // Safe area
    },
    secondaryButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...TYPOGRAPHY.button,
        color: COLORS.primary,
    }
});

export default RoutineSelectionScreen;
