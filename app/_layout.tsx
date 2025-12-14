import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Animated, Image, StatusBar, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { initI18n } from '../src/config/i18n';
import { AuthProvider } from '../src/context/AuthContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { COLORS } from '../src/theme/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [isI18nInitialized, setIsI18nInitialized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const fadeAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        const initializeApp = async () => {
            await SplashScreen.hideAsync();
            await initI18n();
            setIsI18nInitialized(true);
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }).start(() => setShowSplash(false));
            }, 1000);
        };
        initializeApp();
    }, []);

    if (!isI18nInitialized || showSplash) {
        return (
            <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <Image source={require('../assets/images/splash-icon.png')} style={styles.splashLogo} resizeMode="contain" />
            </Animated.View>
        );
    }

    return (
        <AuthProvider>
            <WorkoutProvider>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background }, animation: 'fade' }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="language" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="forgot" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="routines/create" />
                    <Stack.Screen name="routines/manual-editor" />
                    <Stack.Screen name="routines/[id]/train" />
                    <Stack.Screen name="routines/edit/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                </Stack>
                <Toast />
            </WorkoutProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    splashContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
    splashLogo: { width: 300, height: 300 },
});
