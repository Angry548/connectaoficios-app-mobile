import React, {
  useCallback,
  useEffect,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { solicitudService } from '../../services/solicitudService';

const ESTADOS = {
  PENDIENTE: {
    texto: 'Pendiente',
    color: '#B45309',
    fondo: '#FEF3C7',
    icono: 'time-outline',
  },
  ACEPTADA: {
    texto: 'Aceptada',
    color: '#0F766E',
    fondo: '#E6F4F1',
    icono: 'checkmark-circle-outline',
  },
  RECHAZADA: {
    texto: 'Rechazada',
    color: '#B42318',
    fondo: '#FEE4E2',
    icono: 'close-circle-outline',
  },
  EN_PROCESO: {
    texto: 'En proceso',
    color: '#175CD3',
    fondo: '#EFF8FF',
    icono: 'sync-outline',
  },
  COMPLETADA: {
    texto: 'Completada',
    color: '#027A48',
    fondo: '#ECFDF3',
    icono: 'checkmark-done-outline',
  },
  CANCELADA: {
    texto: 'Cancelada',
    color: '#475467',
    fondo: '#F2F4F7',
    icono: 'ban-outline',
  },
};

const obtenerEstiloEstado = (estado) => {
  return (
    ESTADOS[String(estado || '').toUpperCase()] || {
      texto: 'Sin estado',
      color: '#475467',
      fondo: '#F2F4F7',
      icono: 'help-circle-outline',
    }
  );
};

const formatearFecha = (valor) => {
  if (!valor) {
    return 'Sin definir';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
    const [anio, mes, dia] = String(valor).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return fecha.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatearHora = (valor) => {
  if (!valor) {
    return 'Sin definir';
  }

  return String(valor).substring(0, 5);
};

const obtenerMensajeError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.mensaje ||
    error?.response?.data?.title ||
    error?.message ||
    'No se pudieron cargar tus solicitudes.'
  );
};

export default function MisSolicitudesScreen({
  navigation,
}) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [error, setError] = useState(null);

  const cargarSolicitudes = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      try {
        setError(null);

        const resultado =
          await solicitudService.obtenerSolicitudesClientePaginadas(
            0,
            50
          );

        const contenido = Array.isArray(
          resultado?.contenido
        )
          ? resultado.contenido
          : [];

        setSolicitudes(contenido);
      } catch (err) {
        setSolicitudes([]);
        setError(obtenerMensajeError(err));
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      'focus',
      () => {
        cargarSolicitudes();
      }
    );

    return unsubscribe;
  }, [navigation, cargarSolicitudes]);

  const actualizar = async () => {
    setActualizando(true);
    await cargarSolicitudes(false);
  };

  const abrirDetalle = (solicitud) => {
    navigation.navigate(
      'DetalleSolicitudCliente',
      {
        solicitudId: solicitud.idSolicitud,
      }
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            Mis solicitudes
          </Text>

          <Text style={styles.subtitulo}>
            Seguimiento de tus servicios
          </Text>
        </View>

        <View style={styles.espacio} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            tintColor="#0D9488"
            colors={['#0D9488']}
          />
        }
      >
        <View style={styles.seccionCabecera}>
          <Text style={styles.seccionTitulo}>
            Solicitudes realizadas
          </Text>

          {!cargando && !error ? (
            <View style={styles.contadorSolicitudes}>
              <Text
                style={styles.contadorSolicitudesTexto}
              >
                {solicitudes.length}
              </Text>
            </View>
          ) : null}
        </View>

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator
              size="large"
              color="#0D9488"
            />

            <Text style={styles.cargandoTexto}>
              Cargando solicitudes...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.estadoContenedor}>
            <Ionicons
              name="alert-circle-outline"
              size={45}
              color="#B42318"
            />

            <Text style={styles.estadoTitulo}>
              No pudimos cargar tus solicitudes
            </Text>

            <Text style={styles.estadoTexto}>
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargarSolicitudes()}
            >
              <Text
                style={styles.botonReintentarTexto}
              >
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : solicitudes.length === 0 ? (
          <View style={styles.estadoContenedor}>
            <View style={styles.iconoVacio}>
              <Ionicons
                name="document-text-outline"
                size={38}
                color="#0D9488"
              />
            </View>

            <Text style={styles.estadoTitulo}>
              Aún no tienes solicitudes
            </Text>

            <Text style={styles.estadoTexto}>
              Cuando solicites un servicio,
              aquí podrás consultar su estado
              y darle seguimiento.
            </Text>

            <Pressable
              style={styles.botonExplorar}
              onPress={() =>
                navigation.navigate(
                  'BuscarServicios'
                )
              }
            >
              <Ionicons
                name="search-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.botonExplorarTexto}>
                Explorar servicios
              </Text>
            </Pressable>
          </View>
        ) : (
          solicitudes.map((solicitud) => {
            const estiloEstado =
              obtenerEstiloEstado(
                solicitud.estado
              );

            return (
              <Pressable
                key={String(
                  solicitud.idSolicitud
                )}
                style={styles.tarjeta}
                onPress={() =>
                  abrirDetalle(solicitud)
                }
              >
                <View
                  style={styles.tarjetaSuperior}
                >
                  <View
                    style={styles.iconoServicio}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={24}
                      color="#0D9488"
                    />
                  </View>

                  <View
                    style={
                      styles.tarjetaInformacion
                    }
                  >
                    <Text
                      style={styles.servicioTitulo}
                      numberOfLines={2}
                    >
                      {solicitud.servicioTitulo ||
                        'Servicio'}
                    </Text>

                    <Text
                      style={
                        styles.servicioDescripcion
                      }
                      numberOfLines={2}
                    >
                      {solicitud.descripcionTrabajo ||
                        'Sin descripción registrada'}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#98A2B3"
                  />
                </View>

                <View style={styles.datosFila}>
                  <View style={styles.dato}>
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color="#667085"
                    />

                    <Text
                      style={styles.datoTexto}
                    >
                      {formatearFecha(
                        solicitud.fechaPropuesta
                      )}
                    </Text>
                  </View>

                  <View style={styles.dato}>
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color="#667085"
                    />

                    <Text
                      style={styles.datoTexto}
                    >
                      {formatearHora(
                        solicitud.horaAproximada
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.tarjetaInferior}
                >
                  <View
                    style={styles.ubicacionFila}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#667085"
                    />

                    <Text
                      style={styles.ubicacionTexto}
                      numberOfLines={1}
                    >
                      {solicitud.direccionServicio ||
                        'Dirección no registrada'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          estiloEstado.fondo,
                      },
                    ]}
                  >
                    <Ionicons
                      name={estiloEstado.icono}
                      size={14}
                      color={estiloEstado.color}
                    />

                    <Text
                      style={[
                        styles.badgeTexto,
                        {
                          color:
                            estiloEstado.color,
                        },
                      ]}
                    >
                      {estiloEstado.texto}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
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
  },
  seccionCabecera: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  contadorSolicitudes: {
    marginLeft: 8,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  contadorSolicitudesTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  cargando: {
    paddingVertical: 70,
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 12,
    fontSize: 14,
    color: '#667085',
  },
  estadoContenedor: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 30,
    alignItems: 'center',
  },
  iconoVacio: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoTitulo: {
    marginTop: 13,
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  estadoTexto: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  botonExplorar: {
    marginTop: 20,
    minHeight: 46,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  botonExplorarTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
  },
  tarjetaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoServicio: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tarjetaInformacion: {
    flex: 1,
    marginRight: 8,
  },
  servicioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  servicioDescripcion: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#667085',
  },
  datosFila: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datoTexto: {
    marginLeft: 6,
    fontSize: 13,
    color: '#667085',
  },
  tarjetaInferior: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ubicacionFila: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  ubicacionTexto: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: '#667085',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
});