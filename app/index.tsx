import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../src/services/firebaseConfig';
import { COLORS, LETTER_SPACING, TYPOGRAPHY } from '../src/theme/theme';

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!loading && user) {
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
              (userData?.experienceLevel || userData?.level); // Support both new and legacy field

            if (hasCompletedOnboarding) {
              // User has completed onboarding, go to home
              router.replace('/(tabs)/home');
            } else {
              // User document exists but is incomplete, complete onboarding
              router.replace('/onboarding');
            }
          } else {
            // User needs to complete onboarding
            router.replace('/onboarding');
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // On error, assume onboarding needed
          router.replace('/onboarding');
        } finally {
          setCheckingOnboarding(false);
        }
      }
    };

    checkUserStatus();
  }, [user, loading]);

  const handleStart = () => {
    router.push('/language');
  };

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
      <Image
        source={require('../assets/images/logo.png')}
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