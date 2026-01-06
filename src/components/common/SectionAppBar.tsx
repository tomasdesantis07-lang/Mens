import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_FAMILY } from '../../theme/theme';

interface SectionAppBarProps {
    title: string;
    showNotifications?: boolean;
    showPremium?: boolean;
}

export const SectionAppBar: React.FC<SectionAppBarProps> = ({
    title,
    showNotifications = true,
    showPremium = true,
}) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleNotifications = () => {
        // TODO: Navigate to notifications screen
        console.log('Notifications pressed');
    };

    const handlePremium = () => {
        // Navigate to premium tab
        router.push('/(tabs)/premium' as any);
    };

    return (
        <BlurView
            intensity={95}
            tint="dark"
            style={[styles.container, { paddingTop: insets.top + 12 }]}
        >
            <Text style={styles.title}>{title}</Text>

            <View style={styles.actions}>
                {showNotifications && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleNotifications}
                        activeOpacity={0.7}
                    >
                        <View style={styles.notificationBadge}>
                            <Bell size={22} color={COLORS.textPrimary} strokeWidth={2} />
                            {/* Notification dot indicator */}
                            <View style={styles.notificationDot} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(10, 10, 15, 0.4)',
    },
    title: {
        fontSize: 20,
        fontFamily: FONT_FAMILY.bold,
        color: COLORS.textPrimary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    notificationBadge: {
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.error,
        borderWidth: 1.5,
        borderColor: COLORS.background,
    },
    premiumButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: COLORS.warning + '20',
        borderWidth: 1,
        borderColor: COLORS.warning + '40',
    },
});
