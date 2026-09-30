import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pagoService } from '../../services/pagoService';

const ESTADO_ETIQUETAS = {
  PENDIENTE: { texto: 'Pendiente', color: '#B45309', fondo: '#FEF3C7', icono: 'time-outline' },
  APROBADA: { texto: 'Aprobada', color: '#0D9488', fondo: '#E6F4F1', icono: 'checkmark-circle-outline' },
  RECHAZADA: { texto: 'Rechazada', color: '#DC2626', fondo: '#FEF2F2', icono: 'close-circle-outline' },
  CANCELADA: { texto: 'Cancelada', color: '#64748B', fondo: '#F1F5F9', icono: 'ban-outline' },
};

const formatearFecha = (fechaTexto) => {
  if (!fechaTexto) {
    return 'Sin fecha';
  }

  const fecha = new Date(fechaTexto);

  return fecha.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatearMonto = (monto, moneda) => {
  return `${Number(monto).toFixed(2)} ${moneda ?? ''}`.trim();
};

export default function HistorialPagosScreen({ navigation }) {
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarTransacciones = useCallback(async () => {
    try {
      setError(null);
      const datos = await pagoService.obtenerMisTransacciones();

      const ordenadas = [...datos].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );

      setTransacciones(ordenadas);
    } catch (err) {
      setError('No fue posible cargar el historial de pagos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarTransacciones();
  }, [cargarTransacciones]);

  const manejarRefrescar = () => {
    setRefrescando(true);
    cargarTransacciones();
  };

  const balance = pagoService.calcularBalance(transacciones);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#12344D" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTexto}>
          <Text style={styles.tituloHeader}>Historial de pagos</Text>
          <Text style={styles.subtituloHeader}>
            Movimientos por tus promociones contratadas
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefrescar}
            colors={['#0D9488']}
          />
        }
      >
        {cargando ? (
          <View style={styles.estadoCentro}>
            <ActivityIndicator size="large" color="#0D9488" />
          </View>
        ) : error ? (
          <View style={styles.estadoCentro}>
            <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
            <Text style={styles.textoError}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.tarjetaBalance}>
              <View style={styles.iconoBalance}>
                <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
              </View>

              <View style={styles.datosBalance}>
                <Text style={styles.etiquetaBalance}>Total aprobado</Text>
                <Text style={styles.montoBalance}>
                  ${balance.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Movimientos</Text>

              {transacciones.length === 0 ? (
                <Text style={styles.textoVacio}>
                  Todavía no tienes transacciones registradas.
                </Text>
              ) : (
                transacciones.map((transaccion) => {
                  const etiqueta =
                    ESTADO_ETIQUETAS[transaccion.estado] ??
                    ESTADO_ETIQUETAS.PENDIENTE;

                  return (
                    <View key={transaccion.id} style={styles.tarjetaMovimiento}>
                      <View
                        style={[
                          styles.iconoMovimiento,
                          { backgroundColor: etiqueta.fondo },
                        ]}
                      >
                        <Ionicons
                          name={etiqueta.icono}
                          size={20}
                          color={etiqueta.color}
                        />
                      </View>

                      <View style={styles.datosMovimiento}>
                        <Text style={styles.montoMovimiento}>
                          {formatearMonto(
                            transaccion.monto,
                            transaccion.moneda
                          )}
                        </Text>

                        <Text style={styles.fechaMovimiento}>
                          {formatearFecha(transaccion.fecha)}
                        </Text>

                        {!!transaccion.referenciaExterna && (
                          <Text style={styles.referenciaMovimiento}>
                            Ref. {transaccion.referenciaExterna}
                          </Text>
                        )}
                      </View>

                      <View
                        style={[
                          styles.badgeEstado,
                          { backgroundColor: etiqueta.fondo },
                        ]}
                      >
                        <Text
                          style={[
                            styles.textoBadge,
                            { color: etiqueta.color },
                          ]}
                        >
                          {etiqueta.texto}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '800',
  },
  subtituloHeader: {
    color: '#D6E4EC',
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contenido: {
    padding: 20,
    paddingBottom: 36,
  },
  estadoCentro: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  textoError: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  tarjetaBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 18,
    padding: 18,
  },
  iconoBalance: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  datosBalance: {
    flex: 1,
  },
  etiquetaBalance: {
    color: '#E6FFFB',
    fontSize: 12,
    fontWeight: '600',
  },
  montoBalance: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  seccion: {
    marginTop: 24,
  },
  tituloSeccion: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  textoVacio: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  tarjetaMovimiento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  iconoMovimiento: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  datosMovimiento: {
    flex: 1,
  },
  montoMovimiento: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  fechaMovimiento: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },
  referenciaMovimiento: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  badgeEstado: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  textoBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
});