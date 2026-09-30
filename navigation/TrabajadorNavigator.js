import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTrabajadorScreen from '../screens/trabajador/HomeTrabajadorScreen';
import PerfilTrabajadorScreen from '../screens/trabajador/PerfilTrabajadorScreen';
import MisServiciosScreen from '../screens/trabajador/MisServiciosScreen';
import CrearServicioScreen from '../screens/trabajador/CrearServicioScreen';
import EditarServicioScreen from '../screens/trabajador/EditarServicioScreen';
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
        name="MisServicios"
        component={MisServiciosScreen}
      />

      <Stack.Screen
        name="CrearServicio"
        component={CrearServicioScreen}
      />

      <Stack.Screen
        name="EditarServicio"
        component={EditarServicioScreen}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}