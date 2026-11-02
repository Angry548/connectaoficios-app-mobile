import React from 'react';
import SettingsScreen from '../../components/profile/SettingsScreen';

// Se conserva el nombre de ruta existente para no romper enlaces de navegación.
export default function PerfilTrabajadorScreen({ navigation }) {
  return <SettingsScreen navigation={navigation} profesional />;
}
