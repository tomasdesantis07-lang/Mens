import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { LogBox, StatusBar, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { CustomSplashScreen } from '../src/components/splash/CustomSplashScreen';
import { initI18n } from '../src/config/i18n';
import { AuthProvider } from '../src/context/AuthContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { auth, db } from '../src/services/firebaseConfig';
import { COLORS } from '../src/theme/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
    'setLayoutAnimationEnabledExperimental', // New Arch compatibility
    'Mismatch between C++ code version', // Reanimated version mismatch (usually dev client issue)
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [showCustomSplash, setShowCustomSplash] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            try {
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
                            } catch (error) {
                                console.error('Error checking user data:', error);
                                setIsNewUser(false);
                            }
                        } else {
                            // No user logged in, treat as new user
                            setIsNewUser(true);
                        }
                        unsubscribe();
                        resolve();
                    });
                });

                // DEV: Minimum splash screen delay to see animation (5 seconds)
                // TODO: Remove this in production or reduce to ~2 seconds
                await new Promise(resolve => setTimeout(resolve, 5000));

                // Mark app as ready
                setAppIsReady(true);
            } catch (error) {
                console.error('Error initializing app:', error);
                // Even on error, mark as ready to allow app to load
                setAppIsReady(true);
            }
        };

        initializeApp();
    }, []);

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
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
            {appIsReady && (
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
    );
}
