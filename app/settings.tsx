import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
    ChevronLeft,
    Crown,
    FileText,
    Globe,
    LogOut,
    Scale,
    Timer,
    Trash2,
    User,
    Vibrate,
    Volume2
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { DeleteAccountDialog } from '../src/components/common/DeleteAccountDialog';
import { SettingsRow } from '../src/components/settings/SettingsRow';
import { useSettings } from '../src/context/SettingsContext';
import { AuthService } from '../src/services/authService';
import { auth, db } from '../src/services/firebaseConfig';
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

    // Delete account dialog state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [username, setUsername] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch username on mount
    useEffect(() => {
        const fetchUsername = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        // Use displayName or email prefix as fallback
                        setUsername(data.displayName || data.username || user.email?.split('@')[0] || 'usuario');
                    }
                } catch (error) {
                    console.error('Error fetching username:', error);
                    setUsername(user.email?.split('@')[0] || 'usuario');
                }
            }
        };
        fetchUsername();
    }, []);

    const handleSignOut = async () => {
        try {
            await AuthService.cleanLocalData();
            await signOut(auth);
            // Navigate to root which will redirect to auth based on auth state
            router.replace('/');
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

    const handleDeleteAccount = async (password: string) => {
        setIsDeleting(true);
        try {
            await AuthService.deleteAccount(password);
            setShowDeleteDialog(false);
            Toast.show({
                type: 'success',
                text1: 'Cuenta eliminada',
                text2: 'Tu cuenta ha sido eliminada permanentemente.',
            });
            // Navigate to root which will detect no auth and show welcome
            setTimeout(() => {
                router.replace('/');
            }, 500);
        } catch (error: any) {
            console.error('Error deleting account:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'No se pudo eliminar la cuenta.',
            });
        } finally {
            setIsDeleting(false);
        }
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
                        label={t('settings.health_card')}
                        icon={FileText}
                        onPress={() => console.log('Health Card')}
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
                        onPress={() => setShowDeleteDialog(true)}
                    />
                </View>

                <Text style={styles.versionText}>
                    v{Constants.expoConfig?.version || '1.0.0'}
                </Text>

            </ScrollView>

            {/* Delete Account Confirmation Dialog */}
            <DeleteAccountDialog
                visible={showDeleteDialog}
                username={username}
                onConfirm={handleDeleteAccount}
                onCancel={() => setShowDeleteDialog(false)}
                isLoading={isDeleting}
            />
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
