import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeClienteScreen from '../screens/cliente/HomeClienteScreen';
import PerfilClienteScreen from '../screens/cliente/PerfilClienteScreen';
import BuscarServiciosScreen from '../screens/cliente/BuscarServiciosScreen';
import DetalleServicioScreen from '../screens/cliente/DetalleServicioScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';

const Stack = createNativeStackNavigator();

export default function ClienteNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="HomeCliente"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HomeCliente"
        component={HomeClienteScreen}
      />

      <Stack.Screen
        name="PerfilCliente"
        component={PerfilClienteScreen}
      />

      <Stack.Screen
        name="BuscarServicios"
        component={BuscarServiciosScreen}
      />

      <Stack.Screen
        name="DetalleServicio"
        component={DetalleServicioScreen}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}