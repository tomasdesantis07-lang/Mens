import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.text}>
        Acá después vas a mostrar el apodo, progreso, logros y ajustes.
      </Text>
    </View>
  );
};

export default ProfileScreen;

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