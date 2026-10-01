import React from 'react';
import NotificacionesScreen from '../shared/NotificacionesScreen';

export default function NotificacionesClienteScreen(
  props
) {
  return (
    <NotificacionesScreen
      {...props}
      rol="CLIENTE"
    />
  );
}