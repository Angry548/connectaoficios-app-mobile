import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ClienteNavigator from './ClienteNavigator';
import TrabajadorNavigator from './TrabajadorNavigator';

export default function MainNavigator() {
  const { rol } = useAuth();

  if (!rol) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator
          size="large"
          color="#0D9488"
        />
      </View>
    );
  }

  if (rol === 'CLIENTE') {
    return <ClienteNavigator />;
  }

  if (rol === 'TRABAJADOR') {
    return <TrabajadorNavigator />;
  }

  return null;
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});