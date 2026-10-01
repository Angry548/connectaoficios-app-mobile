import React, {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
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
import {
  userService,
} from '../../services/userService';
import {
  reputacionService,
} from '../../services/reputacionService';
import { servicioService } from '../../services/servicioService';

export default function PerfilPublicoTrabajadorScreen({
  route,
  navigation,
}) {
  const trabajadorId =
    route?.params?.trabajadorId;

  const [perfil, setPerfil] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [reputacion, setReputacion] =
    useState(null);
  const [totalServicios, setTotalServicios] =
    useState(0);
  const [cargando, setCargando] =
    useState(true);
  const [error, setError] = useState('');

  const cargarPerfil = useCallback(
    async () => {
      if (!trabajadorId) {
        setError(
          'No se recibió el identificador del trabajador.'
        );
        setCargando(false);
        return;
      }

      setCargando(true);
      setError('');

      try {
        const perfilObtenido =
          await perfilTrabajadorService.obtenerPerfilPorTrabajador(
            trabajadorId
          );

        setPerfil(perfilObtenido);

        const [
          resultadoUsuario,
          resultadoReputacion,
          resultadoServicios,
        ] = await Promise.allSettled([
          userService.obtenerUsuarioPorId(
            trabajadorId
          ),
          reputacionService.obtenerPorPerfilTrabajador(
            perfilObtenido.id
          ),
          servicioService.listarPorTrabajador(
            perfilObtenido.id,
            0,
            1
          ),
        ]);

        if (
          resultadoUsuario.status ===
          'fulfilled'
        ) {
          setUsuario(
            resultadoUsuario.value
          );
        } else {
          setUsuario(null);
        }

        if (
          resultadoReputacion.status ===
          'fulfilled'
        ) {
          setReputacion(
            resultadoReputacion.value
          );
        } else {
          setReputacion(null);
        }

        if (
          resultadoServicios.status ===
          'fulfilled'
        ) {
          setTotalServicios(
            Number(
              resultadoServicios.value
                ?.totalElementos ?? 0
            )
          );
        } else {
          setTotalServicios(0);
        }
      } catch (err) {
        const mensaje =
          err?.response?.data?.message ||
          err?.response?.data?.mensaje ||
          err?.message ||
          'No se pudo cargar el perfil del trabajador.';

        setError(mensaje);
        setPerfil(null);
        setUsuario(null);
        setReputacion(null);
        setTotalServicios(0);
      } finally {
        setCargando(false);
      }
    },
    [trabajadorId]
  );

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();

      return undefined;
    }, [cargarPerfil])
  );

  const obtenerUbicacion = () => {
    return [
      perfil?.localidad,
      perfil?.municipio,
      perfil?.departamento,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const obtenerPromedio = () => {
    const total = Number(
      reputacion?.totalResenas ?? 0
    );

    if (total <= 0) {
      return 'Nuevo';
    }

    return Number(
      reputacion?.promedioCalificacion ?? 0
    ).toFixed(1);
  };

  const obtenerTextoResenas = () => {
    const total = Number(
      reputacion?.totalResenas ?? 0
    );

    if (total <= 0) {
      return 'Sin reseñas';
    }

    return total === 1
      ? '1 reseña'
      : `${total} reseñas`;
  };

  const obtenerInsignia = () => {
    return (
      reputacion?.insignia ||
      'NUEVO_TRABAJADOR'
    ).replaceAll('_', ' ');
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />

          <Text style={styles.textoCarga}>
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            Perfil profesional
          </Text>

          <Text style={styles.subtitulo}>
            Información del trabajador
          </Text>
        </View>

        <View style={styles.espacio} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorContenedor}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />

            <Text style={styles.errorTitulo}>
              No se pudo cargar el perfil
            </Text>

            <Text style={styles.errorTexto}>
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={cargarPerfil}
            >
              <Text
                style={styles.botonReintentarTexto}
              >
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.tarjetaPrincipal}>
              {perfil?.fotoUrl ? (
                <Image
                  source={{
                    uri: perfil.fotoUrl,
                  }}
                  style={styles.foto}
                />
              ) : (
                <View style={styles.fotoVacia}>
                  <Ionicons
                    name="person"
                    size={45}
                    color="#2563EB"
                  />
                </View>
              )}

              <Text style={styles.nombre}>
                {usuario?.nombre ||
                  'Trabajador'}
              </Text>

              <Text style={styles.oficio}>
                {perfil?.oficioPrincipal ||
                  'Profesional'}
              </Text>

              <View style={styles.ubicacionFila}>
                <Ionicons
                  name="location-outline"
                  size={17}
                  color="#667085"
                />

                <Text
                  style={styles.ubicacionTexto}
                >
                  {obtenerUbicacion() ||
                    'Ubicación no especificada'}
                </Text>
              </View>
            </View>

            <View style={styles.tarjetaReputacion}>
              <View
                style={styles.reputacionColumna}
              >
                <View
                  style={
                    styles.reputacionIconoFila
                  }
                >
                  <Ionicons
                    name="star"
                    size={22}
                    color="#F59E0B"
                  />

                  <Text
                    style={
                      styles.reputacionNumero
                    }
                  >
                    {obtenerPromedio()}
                  </Text>
                </View>

                <Text
                  style={styles.reputacionTexto}
                >
                  {obtenerTextoResenas()}
                </Text>
              </View>

              <View
                style={styles.divisorEstadistica}
              />

              <View
                style={styles.reputacionColumna}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={22}
                  color="#0D9488"
                />

                <Text
                  style={styles.estadisticaNumero}
                >
                  {totalServicios}
                </Text>

                <Text
                  style={styles.estadisticaTexto}
                >
                  Servicios
                </Text>
              </View>

              <View
                style={styles.divisorEstadistica}
              />

              <View
                style={styles.reputacionColumna}
              >
                <Ionicons
                  name="ribbon-outline"
                  size={22}
                  color="#2563EB"
                />

                <Text
                  style={styles.insigniaTexto}
                  numberOfLines={2}
                >
                  {obtenerInsignia()}
                </Text>
              </View>
            </View>

            <View style={styles.tarjeta}>
              <View
                style={styles.seccionEncabezado}
              >
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="person-circle-outline"
                    size={23}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={styles.seccionTitulo}
                >
                  Sobre mí
                </Text>
              </View>

              <Text style={styles.contenidoTexto}>
                {perfil?.descripcionProfesional ||
                  'El trabajador todavía no ha agregado una descripción profesional.'}
              </Text>
            </View>

            <View style={styles.tarjeta}>
              <View
                style={styles.seccionEncabezado}
              >
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="briefcase-outline"
                    size={23}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={styles.seccionTitulo}
                >
                  Experiencia laboral
                </Text>
              </View>

              <Text style={styles.contenidoTexto}>
                {perfil?.experienciaLaboral ||
                  'El trabajador todavía no ha agregado información sobre su experiencia.'}
              </Text>
            </View>

            <View style={styles.tarjeta}>
              <View
                style={styles.seccionEncabezado}
              >
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="location-outline"
                    size={23}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={styles.seccionTitulo}
                >
                  Zona principal
                </Text>
              </View>

              <Text style={styles.zonaTitulo}>
                {perfil?.localidad ||
                  perfil?.municipio ||
                  'Sin localidad'}
              </Text>

              <Text style={styles.zonaTexto}>
                {[
                  perfil?.municipio,
                  perfil?.departamento,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  'Ubicación no especificada'}
              </Text>
            </View>

            <Pressable
              style={styles.botonResenas}
              onPress={() =>
                navigation.navigate(
                  'ResenasTrabajador',
                  {
                    trabajadorId,
                    perfilTrabajadorId:
                      perfil?.id,
                  }
                )
              }
            >
              <Ionicons
                name="star-outline"
                size={21}
                color="#2563EB"
              />

              <View
                style={
                  styles.botonResenasContenido
                }
              >
                <Text
                  style={
                    styles.botonResenasTexto
                  }
                >
                  Ver reseñas del trabajador
                </Text>

                <Text
                  style={
                    styles.botonResenasSubtexto
                  }
                >
                  Opiniones de otros clientes
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#2563EB"
              />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  encabezado: {
    minHeight: 76,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encabezadoTexto: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  espacio: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarga: {
    marginTop: 12,
    color: '#667085',
  },
  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    alignItems: 'center',
  },
  foto: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#F2F4F7',
  },
  fotoVacia: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    marginTop: 15,
    fontSize: 21,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  oficio: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
  },
  ubicacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  ubicacionTexto: {
    marginLeft: 5,
    fontSize: 13,
    color: '#667085',
    textAlign: 'center',
  },
  tarjetaReputacion: {
    minHeight: 112,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  reputacionColumna: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  reputacionIconoFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reputacionNumero: {
    marginLeft: 5,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  reputacionTexto: {
    marginTop: 5,
    fontSize: 10,
    color: '#667085',
    textAlign: 'center',
  },
  divisorEstadistica: {
    width: 1,
    backgroundColor: '#EAECF0',
  },
  estadisticaNumero: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  estadisticaTexto: {
    marginTop: 2,
    fontSize: 10,
    color: '#667085',
    textAlign: 'center',
  },
  insigniaTexto: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  seccionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoSeccion: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  seccionTitulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  contenidoTexto: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: '#475467',
  },
  zonaTitulo: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  zonaTexto: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
  },
  botonResenas: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  botonResenasContenido: {
    flex: 1,
    marginLeft: 9,
  },
  botonResenasTexto: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },
  botonResenasSubtexto: {
    marginTop: 2,
    color: '#667085',
    fontSize: 11,
  },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorTitulo: {
    marginTop: 13,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  errorTexto: {
    marginTop: 7,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});