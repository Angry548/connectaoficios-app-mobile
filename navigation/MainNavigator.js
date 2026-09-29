import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function EstructuraPrincipalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>ConnectaOficios</Text>
      <Text style={styles.texto}>
        Navegación principal configurada
      </Text>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EstructuraPrincipal"
        component={EstructuraPrincipalScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  texto: {
    fontSize: 16,
    textAlign: 'center',
  },
});