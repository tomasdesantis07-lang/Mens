import { Dumbbell, Sparkles } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../theme/theme';

interface RoutinePreviewCardProps {
    name: string;
    daysPerWeek: number;
    isGeneratedForUser?: boolean;
    onPress: () => void;
}

export const RoutinePreviewCard: React.FC<RoutinePreviewCardProps> = ({
    name,
    daysPerWeek,
    isGeneratedForUser,
    onPress,
}) => {
    const { t } = useTranslation();

    return (
        <TouchableOpacity
            style={[styles.container, isGeneratedForUser && styles.containerForYou]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View>
                {/* Header with Icon and Badge */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Dumbbell size={28} color={COLORS.primary} strokeWidth={2.5} />
                    </View>

                    {isGeneratedForUser && (
                        <View style={styles.badge}>
                            <Sparkles size={10} color={COLORS.textInverse} style={{ marginRight: 2 }} />
                            <Text style={styles.badgeText}>
                                {t('common.for_you')}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.name} numberOfLines={2}>
                    {name}
                </Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.days}>{daysPerWeek} {t('common.days')}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        aspectRatio: 1,
        justifyContent: 'space-between',
    },
    containerForYou: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(41, 98, 255, 0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(41, 98, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textInverse,
        textTransform: 'uppercase',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 12,
    },
    footer: {
        marginTop: 8,
    },
    days: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});
