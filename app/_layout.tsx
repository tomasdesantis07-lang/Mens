import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { initI18n } from '../src/config/i18n';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { COLORS } from '../src/theme/theme';

export default function RootLayout() {
    const [isI18nInitialized, setIsI18nInitialized] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            await initI18n();
            setIsI18nInitialized(true);
        };

        initializeApp();
    }, []);

    if (!isI18nInitialized) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <WorkoutProvider>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="language" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="forgot" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />

                {/* Routines Screens defined explicitly */}
                <Stack.Screen name="routines/create" />
                <Stack.Screen name="routines/manual-editor" />
                <Stack.Screen name="routines/[id]/train" />
                <Stack.Screen
                    name="routines/edit/[id]"
                    options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom'
                    }}
                />
            </Stack>
            <Toast />
        </WorkoutProvider>
    );
}
