import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeTrabajadorScreen from '../screens/trabajador/HomeTrabajadorScreen';
import PerfilTrabajadorScreen from '../screens/trabajador/PerfilTrabajadorScreen';

import MiPerfilProfesionalScreen from '../screens/trabajador/MiPerfilProfesionalScreen';
import EditarPerfilTrabajadorScreen from '../screens/trabajador/EditarPerfilTrabajadorScreen';

import MisServiciosScreen from '../screens/trabajador/MisServiciosScreen';
import CrearServicioScreen from '../screens/trabajador/CrearServicioScreen';
import EditarServicioScreen from '../screens/trabajador/EditarServicioScreen';
import DisponibilidadScreen from '../screens/trabajador/DisponibilidadScreen';
import ZonaCoberturaScreen from '../screens/trabajador/ZonaCoberturaScreen';

import SolicitudesRecibidasScreen from '../screens/trabajador/SolicitudesRecibidasScreen';
import DetalleSolicitudTrabajadorScreen from '../screens/trabajador/DetalleSolicitudTrabajadorScreen';

import NotificacionesTrabajadorScreen from '../screens/trabajador/NotificacionesTrabajadorScreen';

import PromocionesScreen from '../screens/trabajador/PromocionesScreen';
import DetallePromocionScreen from '../screens/trabajador/DetallePromocionScreen';
import HistorialPagosScreen from '../screens/trabajador/HistorialPagosScreen';
import ReputacionScreen from '../screens/trabajador/ReputacionScreen';

import ConversacionesScreen from '../screens/shared/ConversacionesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
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
        name="MiPerfilProfesional"
        component={MiPerfilProfesionalScreen}
      />

      <Stack.Screen
        name="EditarPerfilTrabajador"
        component={EditarPerfilTrabajadorScreen}
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
        name="Disponibilidad"
        component={DisponibilidadScreen}
      />

      <Stack.Screen
        name="ZonaCobertura"
        component={ZonaCoberturaScreen}
      />

      <Stack.Screen
        name="SolicitudesRecibidas"
        component={SolicitudesRecibidasScreen}
      />

      <Stack.Screen
        name="DetalleSolicitudTrabajador"
        component={DetalleSolicitudTrabajadorScreen}
      />

      <Stack.Screen
        name="NotificacionesTrabajador"
        component={NotificacionesTrabajadorScreen}
      />

      <Stack.Screen
        name="Conversaciones"
        component={ConversacionesScreen}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
      />

      <Stack.Screen
        name="Promociones"
        component={PromocionesScreen}
      />

      <Stack.Screen
        name="DetallePromocion"
        component={DetallePromocionScreen}
      />

      <Stack.Screen
        name="HistorialPagos"
        component={HistorialPagosScreen}
      />

      <Stack.Screen
        name="Reputacion"
        component={ReputacionScreen}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}