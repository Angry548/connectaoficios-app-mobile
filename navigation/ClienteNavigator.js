import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeClienteScreen from '../screens/cliente/HomeClienteScreen';
import PerfilClienteScreen from '../screens/cliente/PerfilClienteScreen';
import EditarPerfilClienteScreen from '../screens/cliente/EditarPerfilClienteScreen';

import BuscarServiciosScreen from '../screens/cliente/BuscarServiciosScreen';
import DetalleServicioScreen from '../screens/cliente/DetalleServicioScreen';
import PerfilPublicoTrabajadorScreen from '../screens/cliente/PerfilPublicoTrabajadorScreen';
import ResenasTrabajadorScreen from '../screens/cliente/ResenasTrabajadorScreen';
import CrearResenaScreen from '../screens/cliente/CrearResenaScreen';
import RankingTrabajadoresScreen from '../screens/cliente/RankingTrabajadoresScreen';

import CrearSolicitudScreen from '../screens/cliente/CrearSolicitudScreen';
import MisSolicitudesScreen from '../screens/cliente/MisSolicitudesScreen';
import DetalleSolicitudClienteScreen from '../screens/cliente/DetalleSolicitudClienteScreen';

import NotificacionesClienteScreen from '../screens/cliente/NotificacionesClienteScreen';

import ConversacionesScreen from '../screens/shared/ConversacionesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
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
        name="EditarPerfilCliente"
        component={EditarPerfilClienteScreen}
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
        name="PerfilPublicoTrabajador"
        component={PerfilPublicoTrabajadorScreen}
      />

      <Stack.Screen
        name="ResenasTrabajador"
        component={ResenasTrabajadorScreen}
      />

      <Stack.Screen
        name="CrearResena"
        component={CrearResenaScreen}
      />

      <Stack.Screen
        name="RankingTrabajadores"
        component={RankingTrabajadoresScreen}
      />

      <Stack.Screen
        name="CrearSolicitud"
        component={CrearSolicitudScreen}
      />

      <Stack.Screen
        name="MisSolicitudes"
        component={MisSolicitudesScreen}
      />

      <Stack.Screen
        name="DetalleSolicitudCliente"
        component={DetalleSolicitudClienteScreen}
      />

      <Stack.Screen
        name="NotificacionesCliente"
        component={NotificacionesClienteScreen}
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
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}