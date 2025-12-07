import { BlurView } from 'expo-blur';
import { LogOut, Settings, UserPen } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../theme/theme';

interface ProfileMenuSheetProps {
    visible: boolean;
    onClose: () => void;
    onSettings: () => void;
    onEditProfile: () => void;
    onSignOut: () => void;
}

export const ProfileMenuSheet: React.FC<ProfileMenuSheetProps> = ({
    visible,
    onClose,
    onSettings,
    onEditProfile,
    onSignOut,
}) => {
    const { t } = useTranslation();

    const menuItems = [
        {
            icon: Settings,
            label: t('profile.menu.settings'),
            onPress: () => {
                onClose();
                onSettings();
            },
        },
        {
            icon: UserPen,
            label: t('profile.menu.edit_profile'),
            onPress: () => {
                onClose();
                onEditProfile();
            },
        },
        {
            icon: LogOut,
            label: t('profile.menu.sign_out'),
            onPress: () => {
                Alert.alert(
                    t('profile.menu.sign_out_confirm.title'),
                    t('profile.menu.sign_out_confirm.message'),
                    [
                        {
                            text: t('profile.menu.sign_out_confirm.cancel'),
                            style: 'cancel',
                        },
                        {
                            text: t('profile.menu.sign_out_confirm.confirm'),
                            style: 'destructive',
                            onPress: () => {
                                onClose();
                                onSignOut();
                            },
                        },
                    ]
                );
            },
            danger: true,
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.menuContainer}>
                    <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.menuItem,
                                        index < menuItems.length - 1 && styles.menuItemBorder,
                                    ]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                >
                                    <Icon
                                        size={20}
                                        color={item.danger ? COLORS.error : COLORS.textPrimary}
                                        strokeWidth={2}
                                    />
                                    <Text
                                        style={[
                                            styles.menuItemText,
                                            item.danger && styles.menuItemTextDanger,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </BlurView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 20,
    },
    menuContainer: {
        width: 220,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    blurContainer: {
        backgroundColor: 'rgba(10, 10, 15, 0.4)',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 12,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    menuItemTextDanger: {
        color: COLORS.error,
    },
});
