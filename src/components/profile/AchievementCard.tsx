import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../theme/theme';

interface AchievementCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    unlocked?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
    icon: Icon,
    title,
    description,
    unlocked = false,
}) => {
    return (
        <View style={[styles.container, !unlocked && styles.containerLocked]}>
            <View style={[styles.iconContainer, !unlocked && styles.iconContainerLocked]}>
                <Icon
                    size={24}
                    color={unlocked ? COLORS.primary : COLORS.textTertiary}
                    strokeWidth={2}
                />
            </View>
            <Text style={[styles.title, !unlocked && styles.titleLocked]} numberOfLines={1}>
                {title}
            </Text>
            <Text style={[styles.description, !unlocked && styles.descriptionLocked]} numberOfLines={2}>
                {description}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 8,
    },
    containerLocked: {
        opacity: 0.5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(41, 98, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerLocked: {
        backgroundColor: COLORS.surface,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    titleLocked: {
        color: COLORS.textSecondary,
    },
    description: {
        fontSize: 11,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    descriptionLocked: {
        color: COLORS.textTertiary,
    },
});
