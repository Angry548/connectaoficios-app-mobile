import { mensajeError } from '../../services/mensajesError';
import AccountIdentityCard from '../../components/profile/AccountIdentityCard';
import ProfileHeader from '../../components/profile/ProfileHeader';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { perfilStyles } from '../../components/profile/profileStyles';
import React, {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
} from '@react-navigation/native';
import {
  perfilTrabajadorService,
} from '../../services/perfilTrabajadorService';

export default function MiPerfilProfesionalScreen({
  navigation,
}) {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [error, setError] = useState('');

  const cargarPerfil = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const resultado =
          await perfilTrabajadorService.obtenerMiPerfil();

        setPerfil(resultado);
      } catch (err) {
        if (err?.response?.status === 404) {
          setPerfil(null);
          setError('');
        } else {
          const mensaje =
            mensajeError(err, "No se pudo cargar tu perfil profesional.");

          setError(mensaje);
        }
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();

      return undefined;
    }, [cargarPerfil])
  );

  const actualizar = async () => {
    setActualizando(true);
    await cargarPerfil(false);
  };

  const obtenerUbicacion = () => {
    if (!perfil) {
      return '';
    }

    return [
      perfil.localidad,
      perfil.municipio,
      perfil.departamento,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const porcentaje = Math.min(
    Math.max(
      Number(
        perfil?.porcentajeCompletitud ?? 0
      ),
      0
    ),
    100
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />

          <Text style={styles.textoCarga}>
            Cargando perfil profesional...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <ProfileHeader titulo="Perfil profesional" subtitulo="Presenta tu experiencia y oficio"
        onBack={() => navigation.goBack()}
        onEdit={perfil ? () => navigation.navigate('EditarPerfilTrabajador', { perfil, modoCreacion: false }) : undefined} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
      >
        <AccountIdentityCard />
        {error ? (
          <View style={styles.errorContenedor}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />

            <Text style={styles.errorTitulo}>
              No se pudo cargar tu perfil
            </Text>

            <Text style={styles.errorTexto}>
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargarPerfil()}
            >
              <Text
                style={styles.botonReintentarTexto}
              >
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : !perfil ? (
          <View style={styles.vacio}>
            <View style={styles.iconoVacio}>
              <Ionicons
                name="person-outline"
                size={46}
                color="#2563EB"
              />
            </View>

            <Text style={styles.vacioTitulo}>
              Crea tu perfil profesional
            </Text>

            <Text style={styles.vacioTexto}>
              Agrega tu oficio, experiencia y zona
              principal para que los clientes puedan
              conocerte mejor.
            </Text>

            <Pressable
              style={styles.botonCrear}
              onPress={() =>
                navigation.navigate(
                  'EditarPerfilTrabajador',
                  {
                    modoCreacion: true,
                  }
                )
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.botonCrearTexto}>
                Crear perfil profesional
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.tarjetaPrincipal}>
              <View style={styles.perfilSuperior}>
                <UserAvatar fotoUrl={perfil.fotoUrl} nombre={usuario?.nombre} size={72} style={styles.foto} />

                <View style={styles.datosPrincipales}>
                  <Text style={styles.oficio}>
                    {perfil.oficioPrincipal ||
                      'Sin oficio principal'}
                  </Text>

                  <View style={styles.ubicacionFila}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#667085"
                    />

                    <Text
                      style={styles.ubicacionTexto}
                      numberOfLines={2}
                    >
                      {obtenerUbicacion() ||
                        'Sin zona principal'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.separador} />

              <View
                style={
                  styles.completitudEncabezado
                }
              >
                <Text
                  style={
                    styles.completitudEtiqueta
                  }
                >
                  Perfil completado
                </Text>

                <Text
                  style={
                    styles.completitudPorcentaje
                  }
                >
                  {porcentaje}%
                </Text>
              </View>

              <View
                style={styles.barraContenedor}
              >
                <View
                  style={[
                    styles.barraProgreso,
                    {
                      width: `${porcentaje}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.tarjeta}>
              <View style={styles.seccionTituloFila}>
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.seccionTitulo}>
                  Descripción profesional
                </Text>
              </View>

              <Text style={styles.textoContenido}>
                {perfil.descripcionProfesional ||
                  'Aún no has agregado una descripción profesional.'}
              </Text>
            </View>

            <View style={styles.tarjeta}>
              <View style={styles.seccionTituloFila}>
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="briefcase-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.seccionTitulo}>
                  Experiencia laboral
                </Text>
              </View>

              <Text style={styles.textoContenido}>
                {perfil.experienciaLaboral ||
                  'Aún no has agregado tu experiencia laboral.'}
              </Text>
            </View>

            <View style={styles.tarjeta}>
              <View style={styles.seccionTituloFila}>
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="location-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.seccionTitulo}>
                  Zona principal
                </Text>
              </View>

              <Text style={styles.zonaPrincipal}>
                {perfil.localidad ||
                  perfil.municipio ||
                  'Sin localidad'}
              </Text>

              <Text style={styles.zonaSecundaria}>
                {[
                  perfil.municipio,
                  perfil.departamento,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>

            <Pressable
              style={styles.botonEditar}
              onPress={() =>
                navigation.navigate(
                  'EditarPerfilTrabajador',
                  {
                    perfil,
                    modoCreacion: false,
                  }
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={21}
                color="#2563EB"
              />

              <Text
                style={styles.botonEditarTexto}
              >
                Editar perfil profesional
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...perfilStyles,
  completitudEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completitudEtiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475467',
  },
  completitudPorcentaje: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  barraContenedor: {
    height: 9,
    borderRadius: 10,
    backgroundColor: '#EAECF0',
    overflow: 'hidden',
    marginTop: 9,
  },
  barraProgreso: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  zonaPrincipal: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  zonaSecundaria: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
  },
});
