import React from 'react';
import HomeDashboard from '../../components/HomeDashboard';

export default function HomeClienteScreen({ navigation }) {
  return <HomeDashboard navigation={navigation}
    destacado={{ titulo: 'Ranking de trabajadores', descripcion: 'Conoce a los profesionales mejor posicionados por su reputación.', icono: 'trophy-outline', ruta: 'RankingTrabajadores' }}
    opciones={[
      { titulo: 'Notificaciones', descripcion: 'Consulta las novedades de tu cuenta.', icono: 'notifications-outline', ruta: 'NotificacionesCliente' },
    ]} />;
}
