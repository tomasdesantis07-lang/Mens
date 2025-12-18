import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../theme/theme';

interface SettingsRowProps {
    label: string;
    icon: React.ElementType;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    type?: 'link' | 'switch' | 'info';
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
    label,
    icon: Icon,
    value,
    onPress,
    isDestructive = false,
    type = 'link',
    switchValue,
    onSwitchChange,
}) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            disabled={type === 'switch' && !onPress} // Enable press if explicit onPress, otherwise disable for switch rows (switch handles it)
            activeOpacity={0.7}
        >
            <View style={styles.leftContent}>
                <View style={styles.iconContainer}>
                    <Icon
                        size={20}
                        color={isDestructive ? COLORS.error : COLORS.textSecondary}
                    />
                </View>
                <Text
                    style={[
                        styles.label,
                        isDestructive && { color: COLORS.error },
                    ]}
                >
                    {label}
                </Text>
            </View>

            <View style={styles.rightContent}>
                {type === 'switch' && (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ false: COLORS.cardAlt, true: COLORS.primary }}
                        thumbColor={COLORS.textPrimary}
                        ios_backgroundColor={COLORS.cardAlt}
                    />
                )}

                {type === 'link' && (
                    <View style={styles.valueContainer}>
                        {value && <Text style={styles.value}>{value}</Text>}
                        <ChevronRight size={20} color={COLORS.textTertiary} />
                    </View>
                )}

                {type === 'info' && value && (
                    <Text style={styles.value}>{value}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: COLORS.card, // Fallback if not transparent
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    value: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
