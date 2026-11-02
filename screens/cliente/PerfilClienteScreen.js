import AccountIdentityCard from '../../components/profile/AccountIdentityCard';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import UserAvatar from '../../components/UserAvatar';
import ProfileHeader from '../../components/profile/ProfileHeader';
import { perfilStyles as styles } from '../../components/profile/profileStyles';
import { perfilClienteService, mensajeErrorPerfilCliente } from '../../services/perfilClienteService';
import { useAuth } from '../../context/AuthContext';

const formatearFecha = (fecha) => {
  if (!fecha) return null;
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? null : valor.toLocaleDateString('es-SV');
};

export default function PerfilClienteScreen({ navigation }) {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const controlador = useRef(null);

  const cargarPerfil = useCallback(async (mostrarCarga = true) => {
    controlador.current?.abort();
    const controller = new AbortController();
    controlador.current = controller;
    setCargando(mostrarCarga);
    setActualizando(!mostrarCarga);
    setError('');
    try {
      const resultado = await perfilClienteService.obtenerMiPerfil({ signal: controller.signal });
      if (!controller.signal.aborted) setPerfil(resultado);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err?.response?.status === 404) setPerfil(null);
      else setError(mensajeErrorPerfilCliente(err, 'No se pudo cargar el perfil. Intenta nuevamente.'));
    } finally {
      if (!controller.signal.aborted) {
        setCargando(false);
        setActualizando(false);
      }
    }
  }, [usuario?.id]);

  useFocusEffect(useCallback(() => {
    cargarPerfil();
    return () => controlador.current?.abort();
  }, [cargarPerfil]));

  const editar = () => navigation.navigate('EditarPerfilCliente', { perfil, modoCreacion: !perfil });
  const creacion = formatearFecha(perfil?.fechaCreacion);
  const actualizacion = formatearFecha(perfil?.fechaActualizacion);

  if (cargando) return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.textoCarga}>Cargando perfil...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.contenedor}>
      <ProfileHeader titulo="Mi perfil" subtitulo="Tu información personal y fotografía"
        onBack={() => navigation.goBack()} onEdit={perfil && !error ? editar : undefined} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={actualizando} onRefresh={() => cargarPerfil(false)} />}>
        {error ? (
          <View style={styles.errorContenedor}>
            <Ionicons name="alert-circle-outline" size={42} color="#B42318" />
            <Text style={styles.errorTitulo}>No se pudo cargar tu perfil</Text>
            <Text accessibilityRole="alert" style={styles.errorTexto}>{error}</Text>
            <Pressable style={styles.botonReintentar} onPress={() => cargarPerfil()}>
              <Text style={styles.botonReintentarTexto}>Intentar nuevamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.tarjetaPrincipal}>
              <View style={styles.perfilSuperior}>
                <UserAvatar fotoUrl={perfil?.fotoUrl} nombre={usuario?.nombre} size={72} style={styles.foto} />
                <View style={styles.datosPrincipales}>
                  <Text style={styles.oficio}>{usuario?.nombre || 'Cliente'}</Text>
                  <View style={styles.ubicacionFila}>
                    <Ionicons name="person-circle-outline" size={16} color="#667085" />
                    <Text style={styles.ubicacionTexto}>Cliente</Text>
                  </View>
                </View>
              </View>
            </View>
            <AccountIdentityCard />
            {!perfil ? (
              <View style={styles.vacio}>
                <View style={styles.iconoVacio}>
                  <Ionicons name="person-outline" size={46} color="#2563EB" />
                </View>
                <Text style={styles.vacioTitulo}>Crea tu perfil</Text>
                <Text style={styles.vacioTexto}>No tienes un perfil creado todavía. Agrega una fotografía para completar tu presentación.</Text>
                <Pressable style={styles.botonCrear} onPress={editar}>
                  <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
                  <Text style={styles.botonCrearTexto}>Crear perfil</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {creacion || actualizacion ? (
                  <View style={styles.tarjeta}>
                    <View style={styles.seccionTituloFila}>
                      <View style={styles.iconoSeccion}>
                        <Ionicons name="calendar-outline" size={22} color="#2563EB" />
                      </View>
                      <Text style={styles.seccionTitulo}>Información del perfil</Text>
                    </View>
                    {creacion ? <Text style={styles.textoContenido}>Creado: {creacion}</Text> : null}
                    {actualizacion ? <Text style={styles.textoContenido}>Actualizado: {actualizacion}</Text> : null}
                  </View>
                ) : null}
                <Pressable style={styles.botonEditar} onPress={editar}>
                  <Ionicons name="create-outline" size={21} color="#2563EB" />
                  <Text style={styles.botonEditarTexto}>Editar perfil</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
