import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const StatsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>
      <Text style={styles.text}>Acá después irán tus métricas de entrenamiento.</Text>
    </View>
  );
};

export default StatsScreen;

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