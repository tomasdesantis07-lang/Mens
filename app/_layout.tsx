import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { COLORS } from '../src/theme/theme';

export default function RootLayout() {
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
                <Stack.Screen name="auth" />
                <Stack.Screen name="forgot" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="routines" />
            </Stack>
            <Toast />
        </WorkoutProvider>
    );
}
