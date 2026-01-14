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
import { QueryProvider } from '../src/context/QueryContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { WorkoutTimerProvider } from '../src/context/WorkoutTimerContext';
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

    // Safety timeout: unexpected hangs (fonts, auth, etc) shouldn't kill the app forever
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            setAppIsReady((prev) => {
                if (!prev) {
                    console.warn("[RootLayout] Safety timeout triggered - forcing App Ready");
                    return true;
                }
                return prev;
            });
        }, 8000); // 8 seconds max wait

        return () => clearTimeout(safetyTimer);
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Wait for fonts to load
                if (!fontsLoaded) return;

                // Initialize i18n
                await initI18n();

                // Authentication Check with Timeout
                const authCheck = new Promise<void>((resolve) => {
                    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
                        if (user) {
                            try {
                                const userDoc = await getDoc(doc(db, 'users', user.uid));
                                setIsNewUser(!userDoc.exists());
                                setSessionKey(user.uid);
                            } catch (error) {
                                console.error('Error checking user data:', error);
                                setSessionKey(`error-${Date.now()}`);
                            }
                        } else {
                            setIsNewUser(true);
                            setSessionKey(`guest-${Date.now()}`);
                        }
                        unsubscribe();
                        resolve();
                    });
                });

                // Race auth check against a 5s timeout so we don't hang on bad network
                const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 5000));
                await Promise.race([authCheck, timeoutPromise]);

                // Minimum splash delay for sleekness
                await new Promise(resolve => setTimeout(resolve, 1500));

                setAppIsReady(true);
            } catch (error) {
                console.error('Error initializing app:', error);
                setAppIsReady(true);
            }
        };

        initializeApp();
    }, [fontsLoaded]);

    // Hide native splash once component is mounted (custom splash takes over)
    useEffect(() => {
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
                        <QueryProvider>
                            <SettingsProvider>
                                <WorkoutTimerProvider>
                                    <WorkoutProvider>
                                        <OnboardingProvider>
                                            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                                            <Stack screenOptions={{
                                                headerShown: false,
                                                contentStyle: { backgroundColor: 'transparent' }, // Enable stack-level transparency
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
                                                        animation: 'slide_from_bottom',
                                                        animationDuration: 200,
                                                        gestureEnabled: true,
                                                        contentStyle: { backgroundColor: 'transparent' },
                                                        presentation: 'transparentModal',
                                                    }}
                                                />
                                                <Stack.Screen name="routines/edit/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                                            </Stack>
                                            <Toast />
                                        </OnboardingProvider>
                                    </WorkoutProvider>
                                </WorkoutTimerProvider>
                            </SettingsProvider>
                        </QueryProvider>
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
