import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

function LoginPendienteScreen() {
  return null;
}

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Registro',
        }}
      />

      <Stack.Screen
        name="Login"
        component={LoginPendienteScreen}
        options={{
          title: 'Iniciar sesión',
        }}
      />
    </Stack.Navigator>
  );
}