import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
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
import { notificacionService } from '../../services/notificacionService';

const TAMANO_PAGINA = 10;

const CONFIGURACION_TIPO = {
  NUEVA_SOLICITUD: {
    icono: 'document-text-outline',
    fondo: '#EFF6FF',
    color: '#2563EB',
  },
  CAMBIO_ESTADO_SOLICITUD: {
    icono: 'swap-horizontal-outline',
    fondo: '#F0FDFA',
    color: '#0D9488',
  },
  NUEVO_MENSAJE: {
    icono: 'chatbubble-ellipses-outline',
    fondo: '#F5F3FF',
    color: '#7C3AED',
  },
  NUEVA_RESENA: {
    icono: 'star-outline',
    fondo: '#FFFAEB',
    color: '#DC6803',
  },
  PROMOCION: {
    icono: 'megaphone-outline',
    fondo: '#FFF1F3',
    color: '#E11D48',
  },
  SISTEMA: {
    icono: 'notifications-outline',
    fondo: '#F2F4F7',
    color: '#475467',
  },
};

const obtenerConfiguracion = (tipo) =>
  CONFIGURACION_TIPO[tipo] ??
  CONFIGURACION_TIPO.SISTEMA;

const obtenerMensajeError = (
  error,
  predeterminado
) =>
  error?.response?.data?.message ||
  error?.response?.data?.mensaje ||
  error?.message ||
  predeterminado;

const formatearFecha = (fecha) => {
  if (!fecha) {
    return '';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  return valor.toLocaleString(
    'es-SV',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

export default function NotificacionesScreen({
  navigation,
  rol,
}) {
  const [notificaciones, setNotificaciones] =
    useState([]);
  const [filtro, setFiltro] =
    useState('TODAS');
  const [cargando, setCargando] =
    useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [cargandoMas, setCargandoMas] =
    useState(false);
  const [marcandoTodas, setMarcandoTodas] =
    useState(false);
  const [error, setError] =
    useState('');
  const [paginaActual, setPaginaActual] =
    useState(0);
  const [ultimaPagina, setUltimaPagina] =
    useState(true);
  const [totalElementos, setTotalElementos] =
    useState(0);
  const [cantidadNoLeidas, setCantidadNoLeidas] =
    useState(0);

  const filtroLeida = useMemo(() => {
    if (filtro === 'NO_LEIDAS') {
      return false;
    }

    if (filtro === 'LEIDAS') {
      return true;
    }

    return null;
  }, [filtro]);

  const cargar = useCallback(
    async ({
      pagina = 0,
      agregar = false,
      refrescando = false,
    } = {}) => {
      if (agregar) {
        setCargandoMas(true);
      } else if (refrescando) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      if (!agregar) {
        setError('');
      }

      try {
        const [
          paginaResultado,
          noLeidas,
        ] = await Promise.all([
          notificacionService.listar({
            pagina,
            tamano: TAMANO_PAGINA,
            leida: filtroLeida,
          }),
          notificacionService.contarNoLeidas(),
        ]);

        setCantidadNoLeidas(noLeidas);
        setPaginaActual(
          paginaResultado.pagina
        );
        setUltimaPagina(
          paginaResultado.ultima
        );
        setTotalElementos(
          paginaResultado.totalElementos
        );

        if (agregar) {
          setNotificaciones(
            (actuales) => {
              const mapa = new Map();

              [
                ...actuales,
                ...paginaResultado.contenido,
              ].forEach((item) => {
                mapa.set(
                  Number(item.id),
                  item
                );
              });

              return Array.from(
                mapa.values()
              );
            }
          );
        } else {
          setNotificaciones(
            paginaResultado.contenido
          );
        }
      } catch (err) {
        const mensaje =
          obtenerMensajeError(
            err,
            'No se pudieron cargar las notificaciones.'
          );

        if (!agregar) {
          setError(mensaje);
          setNotificaciones([]);
        } else {
          Alert.alert(
            'No se pudieron cargar más',
            mensaje
          );
        }
      } finally {
        setCargando(false);
        setActualizando(false);
        setCargandoMas(false);
      }
    },
    [filtroLeida]
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const actualizar = async () => {
    await cargar({
      pagina: 0,
      refrescando: true,
    });
  };

  const cargarMas = async () => {
    if (
      cargando ||
      actualizando ||
      cargandoMas ||
      ultimaPagina
    ) {
      return;
    }

    await cargar({
      pagina: paginaActual + 1,
      agregar: true,
    });
  };

  const cambiarFiltro = (nuevoFiltro) => {
    if (nuevoFiltro === filtro) {
      return;
    }

    setFiltro(nuevoFiltro);
    setNotificaciones([]);
    setPaginaActual(0);
    setUltimaPagina(true);
  };

  const actualizarLocal = (
    id,
    cambios
  ) => {
    setNotificaciones(
      (actuales) =>
        actuales.map((item) =>
          Number(item.id) === Number(id)
            ? {
                ...item,
                ...cambios,
              }
            : item
        )
    );
  };

  const marcarLectura = async (
    notificacion
  ) => {
    try {
      if (notificacion.leida) {
        await notificacionService
          .marcarComoNoLeida(
            notificacion.id
          );

        if (filtro === 'LEIDAS') {
          setNotificaciones(
            (actuales) =>
              actuales.filter(
                (item) =>
                  Number(item.id) !==
                  Number(notificacion.id)
              )
          );

          setTotalElementos(
            (actual) =>
              Math.max(actual - 1, 0)
          );
        } else {
          actualizarLocal(
            notificacion.id,
            {
              leida: false,
            }
          );
        }

        setCantidadNoLeidas(
          (actual) => actual + 1
        );

        return;
      }

      await notificacionService
        .marcarComoLeida(
          notificacion.id
        );

      if (filtro === 'NO_LEIDAS') {
        setNotificaciones(
          (actuales) =>
            actuales.filter(
              (item) =>
                Number(item.id) !==
                Number(notificacion.id)
            )
        );

        setTotalElementos(
          (actual) =>
            Math.max(actual - 1, 0)
        );
      } else {
        actualizarLocal(
          notificacion.id,
          {
            leida: true,
          }
        );
      }

      setCantidadNoLeidas(
        (actual) =>
          Math.max(actual - 1, 0)
      );
    } catch (err) {
      Alert.alert(
        'No se pudo actualizar',
        obtenerMensajeError(
          err,
          'No se pudo cambiar el estado de la notificación.'
        )
      );
    }
  };

  const marcarTodas = () => {
    if (
      cantidadNoLeidas <= 0 ||
      marcandoTodas
    ) {
      return;
    }

    Alert.alert(
      'Marcar todas como leídas',
      '¿Deseas marcar todas tus notificaciones como leídas?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Marcar todas',
          onPress: async () => {
            setMarcandoTodas(true);

            try {
              await notificacionService
                .marcarTodasComoLeidas();

              setCantidadNoLeidas(0);

              if (
                filtro === 'NO_LEIDAS'
              ) {
                setNotificaciones([]);
                setTotalElementos(0);
              } else {
                setNotificaciones(
                  (actuales) =>
                    actuales.map(
                      (item) => ({
                        ...item,
                        leida: true,
                      })
                    )
                );
              }
            } catch (err) {
              Alert.alert(
                'No se pudieron actualizar',
                obtenerMensajeError(
                  err,
                  'No se pudieron marcar las notificaciones como leídas.'
                )
              );
            } finally {
              setMarcandoTodas(false);
            }
          },
        },
      ]
    );
  };

  const abrirNotificacion = async (
    notificacion
  ) => {
    if (!notificacion.leida) {
      try {
        await notificacionService
          .marcarComoLeida(
            notificacion.id
          );

        actualizarLocal(
          notificacion.id,
          {
            leida: true,
          }
        );

        setCantidadNoLeidas(
          (actual) =>
            Math.max(actual - 1, 0)
        );
      } catch (err) {
        Alert.alert(
          'No se pudo abrir',
          obtenerMensajeError(
            err,
            'No se pudo actualizar la notificación.'
          )
        );

        return;
      }
    }

    if (!notificacion.referenciaId) {
      return;
    }

    if (
      notificacion.tipo ===
        'NUEVA_SOLICITUD' ||
      notificacion.tipo ===
        'CAMBIO_ESTADO_SOLICITUD'
    ) {
      if (rol === 'TRABAJADOR') {
        navigation.navigate(
          'DetalleSolicitudTrabajador',
          {
            solicitudId:
              notificacion.referenciaId,
          }
        );
      } else {
        navigation.navigate(
          'DetalleSolicitudCliente',
          {
            solicitudId:
              notificacion.referenciaId,
          }
        );
      }

      return;
    }

    if (
      notificacion.tipo ===
      'PROMOCION'
    ) {
      if (rol === 'TRABAJADOR') {
        navigation.navigate(
          'DetallePromocion',
          {
            promocionId:
              notificacion.referenciaId,
          }
        );
      }

      return;
    }

    if (
      notificacion.tipo ===
      'NUEVA_RESENA'
    ) {
      if (rol === 'TRABAJADOR') {
        navigation.navigate(
          'Reputacion'
        );
      }
    }
  };

  const renderNotificacion = ({
    item,
  }) => {
    const configuracion =
      obtenerConfiguracion(item.tipo);

    return (
      <Pressable
        style={[
          styles.tarjeta,
          !item.leida &&
            styles.tarjetaNoLeida,
        ]}
        onPress={() =>
          abrirNotificacion(item)
        }
      >
        <View
          style={[
            styles.iconoContenedor,
            {
              backgroundColor:
                configuracion.fondo,
            },
          ]}
        >
          <Ionicons
            name={configuracion.icono}
            size={24}
            color={configuracion.color}
          />
        </View>

        <View style={styles.tarjetaContenido}>
          <View
            style={
              styles.tarjetaEncabezado
            }
          >
            <Text
              style={[
                styles.tituloNotificacion,
                !item.leida &&
                  styles.tituloNoLeido,
              ]}
              numberOfLines={2}
            >
              {item.titulo}
            </Text>

            {!item.leida ? (
              <View
                style={styles.puntoNoLeida}
              />
            ) : null}
          </View>

          <Text
            style={styles.mensaje}
            numberOfLines={4}
          >
            {item.mensaje}
          </Text>

          <View style={styles.tarjetaPie}>
            <View
              style={
                styles.fechaContenedor
              }
            >
              <Ionicons
                name="time-outline"
                size={14}
                color="#98A2B3"
              />

              <Text style={styles.fecha}>
                {formatearFecha(
                  item.fechaCreacion
                )}
              </Text>
            </View>

            <Pressable
              style={styles.botonLectura}
              onPress={(event) => {
                event.stopPropagation?.();
                marcarLectura(item);
              }}
            >
              <Ionicons
                name={
                  item.leida
                    ? 'mail-unread-outline'
                    : 'checkmark-circle-outline'
                }
                size={16}
                color="#2563EB"
              />

              <Text
                style={
                  styles.botonLecturaTexto
                }
              >
                {item.leida
                  ? 'No leída'
                  : 'Leída'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
          />

          <Text style={styles.textoCarga}>
            Cargando notificaciones...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.contenedor}
    >
      <View style={styles.encabezado}>
        <View
          style={
            styles.encabezadoPrincipal
          }
        >
          <Pressable
            style={styles.botonVolver}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#101828"
            />
          </Pressable>

          <View
            style={
              styles.encabezadoTexto
            }
          >
            <Text style={styles.titulo}>
              Notificaciones
            </Text>

            <Text
              style={styles.subtitulo}
            >
              {cantidadNoLeidas === 0
                ? 'No tienes notificaciones pendientes'
                : cantidadNoLeidas === 1
                  ? '1 notificación sin leer'
                  : `${cantidadNoLeidas} notificaciones sin leer`}
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.botonMarcarTodas,
            cantidadNoLeidas === 0 &&
              styles.botonDeshabilitado,
          ]}
          onPress={marcarTodas}
          disabled={
            cantidadNoLeidas === 0 ||
            marcandoTodas
          }
        >
          {marcandoTodas ? (
            <ActivityIndicator
              size="small"
              color="#2563EB"
            />
          ) : (
            <Ionicons
              name="checkmark-done-outline"
              size={22}
              color="#2563EB"
            />
          )}
        </Pressable>
      </View>

      <View style={styles.filtros}>
        <Pressable
          style={[
            styles.filtro,
            filtro === 'TODAS' &&
              styles.filtroActivo,
          ]}
          onPress={() =>
            cambiarFiltro('TODAS')
          }
        >
          <Text
            style={[
              styles.filtroTexto,
              filtro === 'TODAS' &&
                styles.filtroTextoActivo,
            ]}
          >
            Todas
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filtro,
            filtro === 'NO_LEIDAS' &&
              styles.filtroActivo,
          ]}
          onPress={() =>
            cambiarFiltro('NO_LEIDAS')
          }
        >
          <Text
            style={[
              styles.filtroTexto,
              filtro === 'NO_LEIDAS' &&
                styles.filtroTextoActivo,
            ]}
          >
            No leídas
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filtro,
            filtro === 'LEIDAS' &&
              styles.filtroActivo,
          ]}
          onPress={() =>
            cambiarFiltro('LEIDAS')
          }
        >
          <Text
            style={[
              styles.filtroTexto,
              filtro === 'LEIDAS' &&
                styles.filtroTextoActivo,
            ]}
          >
            Leídas
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View
          style={
            styles.errorContenedor
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color="#B42318"
          />

          <Text style={styles.errorTitulo}>
            No se pudieron cargar tus notificaciones
          </Text>

          <Text style={styles.errorTexto}>
            {error}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={() => cargar()}
          >
            <Text
              style={
                styles.botonReintentarTexto
              }
            >
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={
            renderNotificacion
          }
          contentContainerStyle={[
            styles.contenido,
            notificaciones.length ===
              0 &&
              styles.contenidoVacio,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={actualizar}
            />
          }
          onEndReached={cargarMas}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            notificaciones.length > 0 ? (
              <Text
                style={styles.resultados}
              >
                {totalElementos === 1
                  ? '1 notificación'
                  : `${totalElementos} notificaciones`}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.vacio}>
              <View
                style={styles.iconoVacio}
              >
                <Ionicons
                  name={
                    filtro ===
                    'NO_LEIDAS'
                      ? 'checkmark-done-outline'
                      : 'notifications-outline'
                  }
                  size={46}
                  color="#2563EB"
                />
              </View>

              <Text
                style={
                  styles.vacioTitulo
                }
              >
                {filtro ===
                'NO_LEIDAS'
                  ? 'Todo está al día'
                  : 'Sin notificaciones'}
              </Text>

              <Text
                style={styles.vacioTexto}
              >
                {filtro ===
                'NO_LEIDAS'
                  ? 'No tienes notificaciones pendientes por leer.'
                  : filtro ===
                      'LEIDAS'
                    ? 'Todavía no tienes notificaciones leídas.'
                    : 'Cuando ocurra algo importante en ConnectaOficios aparecerá aquí.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            cargandoMas ? (
              <View
                style={
                  styles.cargandoMas
                }
              >
                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={
                    styles.cargandoMasTexto
                  }
                >
                  Cargando más...
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  encabezado: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  encabezadoPrincipal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  encabezadoTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 23,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  botonMarcarTodas: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  botonDeshabilitado: {
    opacity: 0.45,
  },
  filtros: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },
  filtro: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  filtroActivo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filtroTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
  },
  filtroTextoActivo: {
    color: '#2563EB',
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
  },
  contenidoVacio: {
    flexGrow: 1,
  },
  resultados: {
    marginBottom: 13,
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EAECF0',
    flexDirection: 'row',
  },
  tarjetaNoLeida: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },
  iconoContenedor: {
    width: 47,
    height: 47,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tarjetaContenido: {
    flex: 1,
  },
  tarjetaEncabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tituloNotificacion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#344054',
    lineHeight: 20,
  },
  tituloNoLeido: {
    fontWeight: '700',
    color: '#101828',
  },
  puntoNoLeida: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginLeft: 8,
    marginTop: 5,
  },
  mensaje: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },
  tarjetaPie: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  fechaContenedor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fecha: {
    marginLeft: 5,
    fontSize: 11,
    color: '#98A2B3',
  },
  botonLectura: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonLecturaTexto: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
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
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  iconoVacio: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacioTitulo: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  vacioTexto: {
    marginTop: 8,
    color: '#667085',
    lineHeight: 20,
    textAlign: 'center',
  },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  errorTitulo: {
    marginTop: 13,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  errorTexto: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 20,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cargandoMas: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargandoMasTexto: {
    marginLeft: 8,
    fontSize: 12,
    color: '#667085',
  },
});