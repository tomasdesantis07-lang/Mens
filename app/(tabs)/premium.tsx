import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PremiumScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MENS Premium</Text>
      <Text style={styles.text}>
        Aquí más adelante vas a mostrar los beneficios y planes Premium.
      </Text>
    </View>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0E14',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  text: {
    color: '#E5E7EB',
    fontSize: 14,
  },
});