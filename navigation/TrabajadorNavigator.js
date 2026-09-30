import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTrabajadorScreen from '../screens/trabajador/HomeTrabajadorScreen';
import PerfilTrabajadorScreen from '../screens/trabajador/PerfilTrabajadorScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';

const Stack = createNativeStackNavigator();

export default function TrabajadorNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="HomeTrabajador"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HomeTrabajador"
        component={HomeTrabajadorScreen}
      />

      <Stack.Screen
        name="PerfilTrabajador"
        component={PerfilTrabajadorScreen}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}