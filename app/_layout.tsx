import { DelaGothicOne_400Regular } from '@expo-google-fonts/dela-gothic-one';
import { Inter_400Regular, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { LogBox, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { CustomSplashScreen } from '../src/components/splash/CustomSplashScreen';
import { initI18n } from '../src/config/i18n';
import { AuthProvider } from '../src/context/AuthContext';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { auth, db } from '../src/services/firebaseConfig';
import { COLORS } from '../src/theme/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
    'Mismatch between C++ code version', // Reanimated version mismatch (usually dev client issue)
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    // Load custom fonts with Antigravity aliases
    const [fontsLoaded] = useFonts({
        'Mens-Display': DelaGothicOne_400Regular,
        'Mens-UI-Reg': Inter_400Regular,
        'Mens-UI-Bold': Inter_700Bold,
        'Mens-UI-Black': Inter_900Black,
    });

    const [appIsReady, setAppIsReady] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [showCustomSplash, setShowCustomSplash] = useState(true);

    const [sessionKey, setSessionKey] = useState<string>('init');

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Wait for fonts to load
                if (!fontsLoaded) return;

                // Initialize i18n first
                await initI18n();

                // Check authentication status and user data
                await new Promise<void>((resolve) => {
                    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
                        if (user) {
                            // User is logged in, check if they have data in Firestore
                            try {
                                const userDoc = await getDoc(doc(db, 'users', user.uid));
                                setIsNewUser(!userDoc.exists());
                                // Update session key to user ID to ensure providers use this user's context
                                setSessionKey(user.uid);
                            } catch (error) {
                                console.error('Error checking user data:', error);
                                setIsNewUser(false);
                                setSessionKey(`error-${Date.now()}`);
                            }
                        } else {
                            // No user logged in, treat as new user
                            setIsNewUser(true);
                            // Generate a random key for guest/logout state to clear previous user data
                            setSessionKey(`guest-${Date.now()}`);
                        }
                        unsubscribe();
                        resolve();
                    });
                });

                // DEV: Minimum splash screen delay to see animation (5 seconds)
                // TODO: Remove this in production or reduce to ~2 seconds
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Mark app as ready
                setAppIsReady(true);
            } catch (error) {
                console.error('Error initializing app:', error);
                // Even on error, mark as ready to allow app to load
                setAppIsReady(true);
            }
        };

        initializeApp();
    }, [fontsLoaded]);

    // Hide native splash once component is mounted (custom splash takes over)
    useEffect(() => {
        // Small delay to ensure custom splash is rendered first
        const timer = setTimeout(() => {
            SplashScreen.hideAsync();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Always render the custom splash, it handles its own visibility
    // When app is not ready, we show splash over a black background
    // When app is ready, splash animates out

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
                {appIsReady && (
                    <AuthProvider>
                        <SettingsProvider>
                            <WorkoutProvider>
                                <OnboardingProvider>
                                    <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                                    <Stack screenOptions={{
                                        headerShown: false,
                                        contentStyle: { backgroundColor: COLORS.background },
                                        animation: 'fade_from_bottom', // Smother than just fade
                                        animationDuration: 200
                                    }}>
                                        <Stack.Screen name="index" />
                                        <Stack.Screen name="language" />
                                        <Stack.Screen name="terms" />
                                        <Stack.Screen name="auth" />
                                        <Stack.Screen name="forgot" />
                                        <Stack.Screen name="onboarding/identity" />
                                        <Stack.Screen name="onboarding/biometrics" />
                                        <Stack.Screen name="onboarding/routine" />
                                        <Stack.Screen name="warning" />
                                        <Stack.Screen name="(tabs)" />
                                        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
                                        <Stack.Screen name="routines/create" />
                                        <Stack.Screen name="routines/manual-editor" />
                                        <Stack.Screen
                                            name="routines/[id]/train"
                                            options={{
                                                presentation: 'transparentModal',
                                                animation: 'slide_from_bottom',
                                                contentStyle: { backgroundColor: 'transparent' },
                                            }}
                                        />
                                        <Stack.Screen name="routines/edit/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                                    </Stack>
                                    <Toast />
                                </OnboardingProvider>
                            </WorkoutProvider>
                        </SettingsProvider>
                    </AuthProvider>
                )}

                {/* Custom Splash Screen - always rendered, handles its own animation */}
                {showCustomSplash && (
                    <CustomSplashScreen
                        isReady={appIsReady}
                        isNewUser={isNewUser}
                        onAnimationComplete={() => setShowCustomSplash(false)}
                    />
                )}
            </View>
        </GestureHandlerRootView>
    );
}
