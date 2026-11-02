import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ProfileHeader from './ProfileHeader';
import { perfilStyles } from './profileStyles';

function SettingsItem({ icono, titulo, descripcion, onPress, peligro, disabled, cargando }) {
  const color = peligro ? '#B42318' : '#2563EB';
  return (
    <Pressable accessibilityRole="button" style={[styles.item, disabled && styles.disabled]}
      onPress={onPress} disabled={disabled}>
      <View style={[perfilStyles.iconoSeccion, peligro && styles.iconoPeligro]}>
        {cargando ? <ActivityIndicator color={color} /> : <Ionicons name={icono} size={22} color={color} />}
      </View>
      <View style={styles.textos}>
        <Text style={[styles.itemTitulo, peligro && styles.textoPeligro]}>{titulo}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={21} color="#98A2B3" />
    </Pressable>
  );
}

export default function SettingsScreen({ navigation, profesional = false }) {
  const { cerrarSesion } = useAuth();
  const [saliendo, setSaliendo] = useState(false);
  const salir = async () => {
    if (saliendo) return;
    setSaliendo(true);
    try { await cerrarSesion(); }
    catch { Alert.alert('No se pudo cerrar la sesión', 'Intenta nuevamente.'); }
    finally { setSaliendo(false); }
  };

  return (
    <SafeAreaView style={perfilStyles.contenedor}>
      <ProfileHeader titulo="Ajustes" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={perfilStyles.contenido} showsVerticalScrollIndicator={false}>
        <Text style={styles.seccion}>Perfil</Text>
        <SettingsItem icono="person-circle-outline" titulo={profesional ? 'Perfil profesional' : 'Mi perfil'}
          descripcion={profesional ? 'Consulta y actualiza tu información profesional.' : 'Consulta tu información personal y actualiza tu fotografía.'}
          onPress={() => navigation.navigate(profesional ? 'MiPerfilProfesional' : 'PerfilCliente')} />
        <Text style={styles.seccion}>Seguridad</Text>
        <SettingsItem icono="lock-closed-outline" titulo="Cambiar contraseña"
          descripcion="Actualiza la contraseña de tu cuenta."
          onPress={() => navigation.navigate('ChangePassword')} />
        <Text style={styles.seccion}>Cuenta</Text>
        <SettingsItem icono="log-out-outline" titulo="Cerrar sesión" descripcion="Finaliza la sesión actual."
          peligro onPress={salir} disabled={saliendo} cargando={saliendo} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seccion: { fontSize: 16, fontWeight: '700', color: '#101828', marginTop: 12, marginBottom: 10 },
  item: { ...perfilStyles.tarjeta, flexDirection: 'row', alignItems: 'center' },
  textos: { flex: 1, marginRight: 8 },
  itemTitulo: { fontSize: 14, fontWeight: '700', color: '#101828' },
  descripcion: { fontSize: 12, lineHeight: 18, color: '#667085', marginTop: 3 },
  iconoPeligro: { backgroundColor: '#FEF2F2' },
  textoPeligro: { color: '#B42318' },
  disabled: { opacity: 0.65 },
});
