import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
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

export default function MisSolicitudesScreen({ navigation }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setError(null);

      const resultado =
        await solicitudService.listarPorCliente();

      setSolicitudes(resultado);
    } catch (excepcion) {
      setError(
        excepcion.message ||
          'No se pudieron cargar tus solicitudes.'
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

  const abrirDetalle = (solicitud) => {
    navigation.navigate('DetalleSolicitudCliente', {
      solicitudId: solicitud.id,
    });
  };

  const reintentar = () => {
    setCargando(true);
    setError(null);
    cargarSolicitudes();
  };

  const renderizarSolicitud = ({ item }) => {
    const estiloEstado = obtenerEstiloEstado(item.estado);

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
              color="#0D9488"
            />
          </View>

          <View style={styles.datosPrincipales}>
            <Text style={styles.tituloServicio}>
              {item.servicio?.nombre ||
                item.servicioNombre ||
                'Servicio'}
            </Text>

            <Text style={styles.descripcionServicio}>
              {item.descripcionTrabajo ||
                'Sin descripcion registrada'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color="#94A3B8"
          />
        </View>

        <View style={styles.tarjetaPie}>
          <View style={styles.datoPie}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#64748B"
            />

            <Text style={styles.textoDato}>
              {formatearFecha(item.fechaPropuesta)}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: estiloEstado.fondo },
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

  const renderizarVacio = () => (
    <View style={styles.estadoVacio}>
      <View style={styles.iconoVacio}>
        <Ionicons
          name="document-text-outline"
          size={38}
          color="#0D9488"
        />
      </View>

      <Text style={styles.tituloVacio}>
        Aun no tienes solicitudes
      </Text>

      <Text style={styles.textoVacio}>
        Cuando solicites un servicio, aqui podras seguir su
        estado y historial.
      </Text>
    </View>
  );

  const renderizarError = () => (
    <View style={styles.estadoVacio}>
      <View style={[styles.iconoVacio, styles.iconoError]}>
        <Ionicons
          name="cloud-offline-outline"
          size={38}
          color="#DC2626"
        />
      </View>

      <Text style={styles.tituloVacio}>
        No pudimos cargar tus solicitudes
      </Text>

      <Text style={styles.textoVacio}>
        {error}
      </Text>

      <TouchableOpacity
        style={styles.botonReintentar}
        onPress={reintentar}
        activeOpacity={0.85}
      >
        <Ionicons
          name="refresh-outline"
          size={18}
          color="#FFFFFF"
        />

        <Text style={styles.textoBotonReintentar}>
          Reintentar
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#12344D"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.headerTexto}>
          <Text style={styles.tituloHeader}>
            Mis solicitudes
          </Text>

          <Text style={styles.subtituloHeader}>
            Seguimiento de tus servicios
          </Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text style={styles.textoCarga}>
            Cargando solicitudes...
          </Text>
        </View>
      ) : error ? (
        renderizarError()
      ) : (
        <FlatList
          style={styles.lista}
          data={solicitudes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderizarSolicitud}
          contentContainerStyle={
            solicitudes.length === 0
              ? styles.listaVacia
              : styles.listaContenido
          }
          ListEmptyComponent={renderizarVacio}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={refrescar}
              colors={['#0D9488']}
              tintColor="#0D9488"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12344D',
  },
  header: {
    backgroundColor: '#12344D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#1E506B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  headerTexto: {
    flex: 1,
  },
  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  subtituloHeader: {
    color: '#D6E4EC',
    fontSize: 12,
    marginTop: 2,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  textoCarga: {
    color: '#64748B',
    fontSize: 13,
  },
  lista: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  listaContenido: {
    padding: 20,
    paddingBottom: 36,
  },
  listaVacia: {
    flexGrow: 1,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginBottom: 12,
  },
  tarjetaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoServicio: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  datosPrincipales: {
    flex: 1,
    marginRight: 8,
  },
  tituloServicio: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '800',
  },
  descripcionServicio: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  tarjetaPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  datoPie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoDato: {
    color: '#64748B',
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
    fontWeight: '800',
  },
  estadoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  iconoVacio: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconoError: {
    backgroundColor: '#FEE2E2',
  },
  tituloVacio: {
    color: '#172B3A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  textoVacio: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 20,
  },
  textoBotonReintentar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
