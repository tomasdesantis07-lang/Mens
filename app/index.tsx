import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MensLogo } from '../src/components/common/BrandIcons';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../src/services/firebaseConfig';
import { RoutineMigrationService } from '../src/services/migrationService';
import { COLORS, LETTER_SPACING, TYPOGRAPHY } from '../src/theme/theme';

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  /* 
    Refactored Logic for "MENS Zero Friction"
    - If User is totally new (no Auth) -> Terms Screen (via handleStart)
    - If User has Auth but no Profile (or incomplete) -> Identity Screen (Data Tunnel)
    - If User has Profile -> Home
  */

  useEffect(() => {
    const checkUserStatus = async () => {
      // Wait for auth loading to complete
      if (!loading) {
        if (user) {
          setCheckingOnboarding(true);
          try {
            // Check if user has completed onboarding
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Verify that critical onboarding fields are present
              const hasCompletedOnboarding =
                userData?.username &&
                userData?.displayName &&
                userData?.healthCompleted; // New flag from OnboardingContext

              if (hasCompletedOnboarding) {
                router.replace('/(tabs)/home');
              } else {
                // User exists but tunnel incomplete -> Go to Identity
                // Ideally we could restore state, but for now restart tunnel
                router.replace('/onboarding/identity');
              }
            } else {
              // User has Auth but no Firestore doc -> Tunnel Start
              router.replace('/onboarding/identity');
            }
          } catch (error) {
            console.error('Error checking user status:', error);
            router.replace('/onboarding/identity');
          } finally {
            setCheckingOnboarding(false);
          }
        }
        // If no user, we just stay here and show the Welcome Screen
      }
    };

    checkUserStatus();
  }, [user, loading]);

  const handleStart = () => {
    // Flow: Start -> Language -> Terms -> Auth
    router.push('/language');
  };

  // Block hardware back button on Welcome screen (prevents going back after logout)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back behavior
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  // Don't show anything while checking auth state or onboarding status
  if (loading || checkingOnboarding) {
    return null;
  }

  // If user is logged in, don't show welcome screen (will redirect)
  if (user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MensLogo
        size={130}
        style={styles.logo}
      />

      <Text style={styles.title}>{t('welcome.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>{t('welcome.start')}</Text>
      </TouchableOpacity>


      {/* DEV TOOL: Explicitly positioned to be visible */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 50, right: 20, zIndex: 999, backgroundColor: 'red', padding: 8, borderRadius: 8 }}
        onPress={async () => {
          await RoutineMigrationService.uploadRoutineTemplates();
          alert('Database Repaired with Rest Days! Please restart app.');
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>FEED DB</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    ...TYPOGRAPHY.display,
    color: COLORS.textPrimary,
    letterSpacing: LETTER_SPACING.widest,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginTop: 8,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 40,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
});