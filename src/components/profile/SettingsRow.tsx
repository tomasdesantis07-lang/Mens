import { ChevronRight, LucideIcon } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../theme/theme';

interface SettingsRowProps {
    icon: LucideIcon;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
    icon: Icon,
    label,
    value,
    onPress,
    isDestructive = false,
    hasSwitch = false,
    switchValue = false,
    onSwitchChange,
}) => {
    const textColor = isDestructive ? COLORS.error : COLORS.textPrimary;
    const iconColor = isDestructive ? COLORS.error : COLORS.textSecondary;

    const content = (
        <View style={styles.container}>
            <View style={styles.leftContent}>
                <View style={[styles.iconContainer, isDestructive && styles.iconContainerDestructive]}>
                    <Icon size={20} color={iconColor} />
                </View>
                <Text style={[styles.label, { color: textColor }]}>{label}</Text>
            </View>

            <View style={styles.rightContent}>
                {value && !hasSwitch && (
                    <Text style={styles.value}>{value}</Text>
                )}
                {hasSwitch ? (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor={switchValue ? '#fff' : COLORS.textTertiary}
                    />
                ) : (
                    <ChevronRight size={20} color={COLORS.textTertiary} />
                )}
            </View>
        </View>
    );

    if (hasSwitch) {
        return content;
    }

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerDestructive: {
        backgroundColor: COLORS.error + '15',
    },
    label: {
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    value: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
});
