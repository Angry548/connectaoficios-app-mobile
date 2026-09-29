import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function EstructuraInicialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>ConnectaOficios</Text>
      <Text style={styles.texto}>
        Aplicación móvil configurada correctamente
      </Text>
    </View>
  );
}

export default function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EstructuraInicial"
        component={EstructuraInicialScreen}
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