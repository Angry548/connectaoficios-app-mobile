import React from 'react';
import HomeDashboard from '../../components/HomeDashboard';

export default function HomeTrabajadorScreen({ navigation }) {
  return <HomeDashboard navigation={navigation} profesional
    destacado={{ titulo: 'Tu reputación', descripcion: 'Consulta las valoraciones y el reconocimiento de tu trabajo.', icono: 'star-outline', ruta: 'Reputacion' }}
    opciones={[
      { titulo: 'Promociones', descripcion: 'Administra tus opciones de promoción.', icono: 'megaphone-outline', ruta: 'Promociones' },
      { titulo: 'Historial de pagos', descripcion: 'Consulta la información de tus pagos.', icono: 'card-outline', ruta: 'HistorialPagos' },
      { titulo: 'Notificaciones', descripcion: 'Mantente al día con las novedades de tu trabajo.', icono: 'notifications-outline', ruta: 'NotificacionesTrabajador' },
    ]} />;
}
