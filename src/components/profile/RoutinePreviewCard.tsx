import { Dumbbell } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../theme/theme';

interface RoutinePreviewCardProps {
    name: string;
    daysPerWeek: number;
    onPress: () => void;
}

export const RoutinePreviewCard: React.FC<RoutinePreviewCardProps> = ({
    name,
    daysPerWeek,
    onPress,
}) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View>
                <View style={styles.iconContainer}>
                    <Dumbbell size={28} color={COLORS.primary} strokeWidth={2.5} />
                </View>

                <Text style={styles.name} numberOfLines={2}>
                    {name}
                </Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.days}>{daysPerWeek} días</Text>
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
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(41, 98, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
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
