import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { solicitudService } from '../../services/solicitudService';
import { userService } from '../../services/userService';

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
    color: '#B91C1C',
    fondo: '#FEE2E2',
    icono: 'close-circle-outline',
  },
  EN_PROCESO: {
    texto: 'En proceso',
    color: '#1D4ED8',
    fondo: '#DBEAFE',
    icono: 'sync-outline',
  },
  COMPLETADA: {
    texto: 'Completada',
    color: '#15803D',
    fondo: '#DCFCE7',
    icono: 'checkmark-done-outline',
  },
  CANCELADA: {
    texto: 'Cancelada',
    color: '#64748B',
    fondo: '#E2E8F0',
    icono: 'ban-outline',
  },
};

const FILTROS = [
  { clave: 'TODAS', texto: 'Todas' },
  { clave: 'PENDIENTE', texto: 'Pendientes' },
  { clave: 'ACEPTADA', texto: 'Aceptadas' },
  { clave: 'EN_PROCESO', texto: 'En proceso' },
  { clave: 'COMPLETADA', texto: 'Completadas' },
  { clave: 'RECHAZADA', texto: 'Rechazadas' },
  { clave: 'CANCELADA', texto: 'Canceladas' },
];

const obtenerEstiloEstado = (estado) => {
  return (
    ESTADOS[String(estado || '').toUpperCase()] || {
      texto: 'Sin estado',
      color: '#475569',
      fondo: '#E2E8F0',
      icono: 'help-circle-outline',
    }
  );
};

const formatearFecha = (valor) => {
  if (!valor) {
    return 'Fecha por definir';
  }

  const partes = String(valor).split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return String(valor);
};

export default function SolicitudesRecibidasScreen({
  navigation,
}) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [clientes, setClientes] = useState({});
  const [filtro, setFiltro] = useState('TODAS');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setError(null);

      const resultado =
        await solicitudService.obtenerMisSolicitudesTrabajador();

      setSolicitudes(resultado);

      const idsClientes = [
        ...new Set(
          resultado
            .map((item) => Number(item.clienteId))
            .filter((id) => Number.isInteger(id) && id > 0)
        ),
      ];

      const resultadosUsuarios =
        await Promise.all(
          idsClientes.map(async (id) => {
            try {
              const usuario =
                await userService.obtenerUsuarioPorId(id);

              return [id, usuario];
            } catch {
              return [id, null];
            }
          })
        );

      setClientes(
        Object.fromEntries(resultadosUsuarios)
      );
    } catch (excepcion) {
      setError(
        excepcion.message ||
          'No se pudieron cargar las solicitudes recibidas.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  const refrescar = useCallback(async () => {
    setActualizando(true);
    await cargarSolicitudes();
  }, [cargarSolicitudes]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener(
      'focus',
      () => {
        setCargando(true);
        cargarSolicitudes();
      }
    );

    return unsubscribe;
  }, [navigation, cargarSolicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    if (filtro === 'TODAS') {
      return solicitudes;
    }

    return solicitudes.filter(
      (solicitud) =>
        String(solicitud.estado).toUpperCase() === filtro
    );
  }, [solicitudes, filtro]);

  const pendientes = useMemo(() => {
    return solicitudes.filter(
      (solicitud) =>
        String(solicitud.estado).toUpperCase() ===
        'PENDIENTE'
    ).length;
  }, [solicitudes]);

  const abrirDetalle = (solicitud) => {
    navigation.navigate(
      'DetalleSolicitudTrabajador',
      {
        solicitudId: solicitud.idSolicitud,
      }
    );
  };

  const renderizarSolicitud = ({ item }) => {
    const estiloEstado =
      obtenerEstiloEstado(item.estado);

    const cliente = clientes[item.clienteId];

    return (
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() => abrirDetalle(item)}
        activeOpacity={0.8}
      >
        <View style={styles.tarjetaEncabezado}>
          <View style={styles.iconoServicio}>
            <Ionicons
              name="briefcase-outline"
              size={21}
              color="#2563EB"
            />
          </View>

          <View style={styles.datosPrincipales}>
            <Text style={styles.tituloServicio}>
              {item.servicioTitulo || 'Servicio'}
            </Text>

            <View style={styles.filaCliente}>
              <Ionicons
                name="person-outline"
                size={13}
                color="#667085"
              />

              <Text style={styles.nombreCliente}>
                {cliente?.nombre ||
                  `Cliente #${item.clienteId}`}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color="#98A2B3"
          />
        </View>

        <Text
          style={styles.descripcion}
          numberOfLines={2}
        >
          {item.descripcionTrabajo ||
            'Sin descripción registrada'}
        </Text>

        <View style={styles.tarjetaPie}>
          <View style={styles.datoPie}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#667085"
            />

            <Text style={styles.textoDato}>
              {formatearFecha(item.fechaPropuesta)}
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
              size={13}
              color={estiloEstado.color}
            />

            <Text
              style={[
                styles.badgeTexto,
                { color: estiloEstado.color },
              ]}
            >
              {estiloEstado.texto}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#101828"
          />
        </TouchableOpacity>

        <View style={styles.headerTexto}>
          <Text style={styles.tituloHeader}>
            Solicitudes recibidas
          </Text>

          <Text style={styles.subtituloHeader}>
            {pendientes > 0
              ? `${pendientes} pendiente${
                  pendientes === 1 ? '' : 's'
                } por revisar`
              : 'Gestiona tus solicitudes'}
          </Text>
        </View>
      </View>

      <View style={styles.contenedorLista}>
        {!cargando && !error ? (
          <View style={styles.filtrosContenedor}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtros}
            >
              {FILTROS.map((item) => {
                const seleccionado =
                  filtro === item.clave;

                return (
                  <TouchableOpacity
                    key={item.clave}
                    style={[
                      styles.filtro,
                      seleccionado &&
                        styles.filtroSeleccionado,
                    ]}
                    onPress={() =>
                      setFiltro(item.clave)
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.textoFiltro,
                        seleccionado &&
                          styles.textoFiltroSeleccionado,
                      ]}
                    >
                      {item.texto}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text style={styles.textoCarga}>
              Cargando solicitudes...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.estadoVacio}>
            <View
              style={[
                styles.iconoVacio,
                styles.iconoError,
              ]}
            >
              <Ionicons
                name="cloud-offline-outline"
                size={38}
                color="#D92D20"
              />
            </View>

            <Text style={styles.tituloVacio}>
              No pudimos cargar las solicitudes
            </Text>

            <Text style={styles.textoVacio}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={() => {
                setCargando(true);
                cargarSolicitudes();
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.textoBoton}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={solicitudesFiltradas}
            keyExtractor={(item) =>
              String(item.idSolicitud)
            }
            renderItem={renderizarSolicitud}
            contentContainerStyle={
              solicitudesFiltradas.length === 0
                ? styles.listaVacia
                : styles.listaContenido
            }
            ListEmptyComponent={
              <View style={styles.estadoVacio}>
                <View style={styles.iconoVacio}>
                  <Ionicons
                    name="file-tray-outline"
                    size={38}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.tituloVacio}>
                  No hay solicitudes
                </Text>

                <Text style={styles.textoVacio}>
                  No tienes solicitudes en este estado.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={actualizando}
                onRefresh={refrescar}
                colors={['#2563EB']}
                tintColor="#2563EB"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
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

  headerTexto: {
    flex: 1,
  },

  tituloHeader: {
    fontSize: 23,
    fontWeight: '700',
    color: '#101828',
  },

  subtituloHeader: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },

  contenedorLista: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  filtrosContenedor: {
    paddingTop: 17,
  },

  filtros: {
    paddingHorizontal: 18,
    gap: 8,
  },

  filtro: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filtroSeleccionado: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  textoFiltro: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },

  textoFiltroSeleccionado: {
    color: '#FFFFFF',
  },

  listaContenido: {
    padding: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },

  listaVacia: {
    flexGrow: 1,
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 17,
    marginBottom: 14,
  },

  tarjetaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoServicio: {
    width: 47,
    height: 47,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  datosPrincipales: {
    flex: 1,
    marginRight: 8,
  },

  tituloServicio: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '700',
  },

  filaCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },

  nombreCliente: {
    color: '#667085',
    fontSize: 12,
  },

  descripcion: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 15,
  },

  tarjetaPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    paddingTop: 15,
    marginTop: 15,
  },

  datoPie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  textoDato: {
    color: '#667085',
    fontSize: 12,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },

  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },

  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },

  textoCarga: {
    marginTop: 12,
    color: '#667085',
  },

  estadoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },

  iconoVacio: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconoError: {
    backgroundColor: '#FEF3F2',
  },

  tituloVacio: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  textoVacio: {
    marginTop: 8,
    color: '#667085',
    lineHeight: 20,
    textAlign: 'center',
  },

  botonReintentar: {
    marginTop: 22,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});