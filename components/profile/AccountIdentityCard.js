import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { editorStyles as styles } from './profileStyles';

export default function AccountIdentityCard({ editable = false, disabled = false, value, onChange }) {
  const { usuario } = useAuth();
  const nombre = value?.nombre ?? usuario?.nombre ?? '';
  const correo = value?.correo ?? usuario?.correo ?? '';
  const ocupado = disabled;
  const setNombre = nombre => onChange?.({ nombre, correo });
  const setCorreo = correo => onChange?.({ nombre, correo });

  return <View style={styles.tarjeta}>
    <View style={styles.seccionEncabezado}>
      <View style={styles.iconoSeccion}><Ionicons name="person-circle-outline" size={22} color="#2563EB" /></View>
      <View style={styles.seccionTexto}>
        <Text style={styles.seccionTitulo}>Datos de tu cuenta</Text>
        <Text style={styles.seccionSubtitulo}>{editable ? 'Nombre y correo de acceso' : 'Identidad asociada a tu cuenta'}</Text>
      </View>
    </View>
    <Text style={styles.label}>Nombre</Text>
    {editable ? <TextInput accessibilityLabel="Nombre" style={styles.input} value={nombre} onChangeText={setNombre}
      autoComplete="name" maxLength={100} editable={!ocupado} /> : <Text style={{ color: '#101828', marginBottom: 16 }}>{usuario?.nombre || 'Sin nombre disponible'}</Text>}
    <Text style={[styles.label, editable && { marginTop: 16 }]}>Correo</Text>
    {editable ? <TextInput accessibilityLabel="Correo electrónico" style={styles.input} value={correo} onChangeText={setCorreo}
      keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={150} editable={!ocupado} />
      : <Text style={{ color: '#101828', marginBottom: 16 }}>{usuario?.correo || 'Sin correo disponible'}</Text>}
    <Text style={[styles.label, editable && { marginTop: 16 }]}>Rol</Text>
    <Text style={{ color: '#667085' }}>{usuario?.rol === 'TRABAJADOR' ? 'Trabajador' : 'Cliente'}</Text>
  </View>;
}
