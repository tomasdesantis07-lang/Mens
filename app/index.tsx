import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../src/theme/theme';

const WelcomeScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.png')} // tu logo está en assets/images
        style={styles.logo}
      />

      <Text style={styles.title}>MENS</Text>
      <Text style={styles.subtitle}>Master Energy, Nutrition & Strength</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/auth')}
      >
        <Text style={styles.buttonText}>Empezar</Text>
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