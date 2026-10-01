import React from 'react';
import NotificacionesScreen from '../shared/NotificacionesScreen';

export default function NotificacionesTrabajadorScreen(
  props
) {
  return (
    <NotificacionesScreen
      {...props}
      rol="TRABAJADOR"
    />
  );
}