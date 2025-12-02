import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../src/theme/theme';

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleStart = () => {
    router.push('/language');
  };

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
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
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
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});