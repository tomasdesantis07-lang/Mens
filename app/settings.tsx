import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
    ChevronLeft,
    Crown,
    Globe,
    LogOut,
    Ruler,
    Scale,
    Timer,
    Trash2,
    User,
    Vibrate,
    Volume2,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Removed ScrollView/Platform/Image unused imports if any
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsRow } from '../src/components/settings/SettingsRow';
import { useSettings } from '../src/context/SettingsContext';
import { auth } from '../src/services/firebaseConfig';
import { COLORS, FONT_FAMILY } from '../src/theme/theme';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const {
        weightUnit,
        setWeightUnit,
        hapticsEnabled,
        setHapticsEnabled,
        autoTimer,
        setAutoTimer,
        soundsEnabled,
        setSoundsEnabled,
    } = useSettings();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.replace('/auth' as any);
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert(t('common.error'), t('profile.logout_error') || "Error al cerrar sesión");
        }
    };

    const confirmSignOut = () => {
        Alert.alert(
            t('profile.menu.sign_out') || "Cerrar Sesión",
            t('profile.menu.sign_out_confirm.message') || "¿Estás seguro que deseas cerrar sesión?",
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('profile.menu.sign_out_confirm.confirm') || "Cerrar Sesión",
                    style: 'destructive',
                    onPress: handleSignOut
                },
            ]
        );
    };

    const checkDeleteAccount = () => {
        Alert.alert(
            t('settings.delete_account'),
            t('settings.delete_account_warning'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.delete_confirm'),
                    style: 'destructive',
                    onPress: () => {
                        console.log("Delete account logic to be implemented");
                    }
                },
            ]
        );
    };

    // Language display
    const currentLanguage = i18n.language.startsWith('es') ? 'Español' : 'English';

    const toggleLanguage = () => {
        const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    const SectionTitle = ({ title }: { title: string }) => (
        <Text style={styles.sectionTitle}>{title}</Text>
    );

    return (
        <View style={styles.container}>
            <BlurView
                intensity={80}
                tint="dark"
                style={[styles.header, { paddingTop: insets.top }]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: 40 }} />
            </BlurView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{
                    paddingTop: insets.top + 60,
                    paddingBottom: 40,
                }}
            >
                {/* PROFILE & SUBSCRIPTION */}
                <SectionTitle title={t('settings.section_profile')} />
                <View style={styles.sectionContainer}>
                    <SettingsRow
                        label={t('settings.edit_profile')}
                        icon={User}
                        onPress={() => console.log('Edit Profile')}
                    />
                    <SettingsRow
                        label={t('settings.physical_data')}
                        icon={Ruler}
                        value="178cm / 80kg"
                        onPress={() => console.log('Physical Data')}
                    />
                    <SettingsRow
                        label={t('settings.subscription')}
                        icon={Crown}
                        value={t('settings.free_plan')}
                        type="link"
                        onPress={() => console.log('Subscription')}
                    />
                </View>

                {/* WORKOUT SYSTEM */}
                <SectionTitle title={t('settings.section_workout')} />
                <View style={styles.sectionContainer}>
                    <SettingsRow
                        label={t('settings.weight_units')}
                        icon={Scale}
                        value={weightUnit.toUpperCase()}
                        onPress={() => setWeightUnit(weightUnit === 'kg' ? 'lb' : 'kg')}
                    />
                    <SettingsRow
                        label={t('settings.haptics')}
                        icon={Vibrate}
                        type="switch"
                        switchValue={hapticsEnabled}
                        onSwitchChange={setHapticsEnabled}
                    />
                    <SettingsRow
                        label={t('settings.auto_timer')}
                        icon={Timer}
                        type="switch"
                        switchValue={autoTimer}
                        onSwitchChange={setAutoTimer}
                    />
                </View>

                {/* APP GENERAL */}
                <SectionTitle title={t('settings.section_general')} />
                <View style={styles.sectionContainer}>
                    <SettingsRow
                        label={t('settings.language')}
                        icon={Globe}
                        value={currentLanguage}
                        onPress={toggleLanguage}
                    />
                    <SettingsRow
                        label={t('settings.sounds')}
                        icon={Volume2}
                        type="switch"
                        switchValue={soundsEnabled}
                        onSwitchChange={setSoundsEnabled}
                    />
                </View>

                {/* ACCOUNT (DANGER ZONE) */}
                <SectionTitle title={t('settings.section_account')} />
                <View style={styles.sectionContainer}>
                    <SettingsRow
                        label={t('profile.menu.sign_out') || "Cerrar Sesión"}
                        icon={LogOut}
                        isDestructive
                        onPress={confirmSignOut}
                    />
                    <SettingsRow
                        label={t('settings.delete_account')}
                        icon={Trash2}
                        isDestructive
                        onPress={checkDeleteAccount}
                    />
                </View>

                <Text style={styles.versionText}>
                    v{Constants.expoConfig?.version || '1.0.0'}
                </Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 13,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
        marginLeft: 24,
        marginTop: 32,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    sectionContainer: {
        marginTop: 4,
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.textTertiary,
        fontSize: 12,
        marginTop: 32,
        marginBottom: 20,
    },
});
