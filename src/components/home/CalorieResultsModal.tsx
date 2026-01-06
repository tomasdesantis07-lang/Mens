import { Activity, Flame, Scale, Sparkles, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../theme/theme';
import { HealthMetrics, getWeightClass } from '../../utils/healthUtils';
import { PrimaryButton } from '../common/PrimaryButton';

interface CalorieResultsModalProps {
    visible: boolean;
    onClose: () => void;
    onViewDetails?: () => void;
    metrics: HealthMetrics | null;
}

const BMI_COLORS = {
    underweight: '#FFB74D',
    normal: COLORS.success,
    overweight: '#FFB74D',
    obese: COLORS.error,
};

const BMI_LABELS = {
    underweight: 'Bajo peso',
    normal: 'Peso saludable',
    overweight: 'Sobrepeso',
    obese: 'Obesidad',
};

export const CalorieResultsModal: React.FC<CalorieResultsModalProps> = ({
    visible,
    onClose,
    onViewDetails,
    metrics,
}) => {
    const { t } = useTranslation();

    if (!metrics) return null;

    const weightClass = getWeightClass(metrics.bmi);
    const bmiColor = BMI_COLORS[weightClass];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Sparkles size={32} color={COLORS.primary} />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>Tu Diagnóstico Biométrico</Text>
                    <Text style={styles.subtitle}>
                        Hemos calculado tus métricas basándonos en tus datos físicos
                    </Text>

                    {/* Metrics Grid */}
                    <View style={styles.metricsGrid}>
                        {/* BMI Card */}
                        <View style={[styles.metricCard, { borderColor: bmiColor + '40' }]}>
                            <View style={[styles.metricIcon, { backgroundColor: bmiColor + '20' }]}>
                                <Scale size={20} color={bmiColor} />
                            </View>
                            <Text style={styles.metricValue}>{metrics.bmi}</Text>
                            <Text style={styles.metricLabel}>IMC</Text>
                            <View style={[styles.badge, { backgroundColor: bmiColor + '20' }]}>
                                <Text style={[styles.badgeText, { color: bmiColor }]}>
                                    {BMI_LABELS[weightClass]}
                                </Text>
                            </View>
                        </View>

                        {/* BMR Card */}
                        <View style={styles.metricCard}>
                            <View style={[styles.metricIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Flame size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.metricValue}>{metrics.bmr.toLocaleString()}</Text>
                            <Text style={styles.metricLabel}>TMB (kcal/día)</Text>
                            <Text style={styles.metricDescription}>Metabolismo Basal</Text>
                        </View>
                    </View>

                    {/* TDEE Highlight */}
                    <View style={styles.tdeeCard}>
                        <View style={styles.tdeeHeader}>
                            <Activity size={24} color={COLORS.success} />
                            <Text style={styles.tdeeTitle}>Gasto Calórico Diario</Text>
                        </View>
                        <Text style={styles.tdeeValue}>{metrics.tdee.toLocaleString()}</Text>
                        <Text style={styles.tdeeUnit}>kcal/día</Text>
                        <Text style={styles.tdeeDescription}>
                            Esta es la cantidad de calorías que necesitás consumir para mantener tu peso actual
                        </Text>
                    </View>

                    {/* Actions */}
                    <PrimaryButton
                        title="Entendido"
                        onPress={onClose}
                        style={{ marginTop: 16 }}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    metricCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    metricIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    metricValue: {
        ...TYPOGRAPHY.numberMedium,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    metricLabel: {
        ...TYPOGRAPHY.label,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    metricDescription: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textTertiary,
        textAlign: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        ...TYPOGRAPHY.caption,
        fontWeight: '600',
    },
    tdeeCard: {
        backgroundColor: COLORS.success + '10',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    tdeeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tdeeTitle: {
        ...TYPOGRAPHY.h4,
        color: COLORS.success,
    },
    tdeeValue: {
        ...TYPOGRAPHY.numberBig,
        color: COLORS.textPrimary,
        fontSize: 48,
    },
    tdeeUnit: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    tdeeDescription: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default CalorieResultsModal;
