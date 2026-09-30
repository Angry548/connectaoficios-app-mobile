import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { promocionService } from '../../services/promocionService';

const ESTADO_ETIQUETAS = {
  PENDIENTE: {
    texto: 'Pendiente de pago',
    color: '#B45309',
    fondo: '#FEF3C7',
    icono: 'time-outline',
  },
  ACTIVA: {
    texto: 'Activa',
    color: '#0D9488',
    fondo: '#E6F4F1',
    icono: 'checkmark-circle-outline',
  },
  FINALIZADA: {
    texto: 'Finalizada',
    color: '#64748B',
    fondo: '#F1F5F9',
    icono: 'flag-outline',
  },
  CANCELADA: {
    texto: 'Cancelada',
    color: '#DC2626',
    fondo: '#FEF2F2',
    icono: 'close-circle-outline',
  },
};

const formatearFecha = (fechaTexto) => {
  if (!fechaTexto) {
    return 'Sin definir';
  }

  const fecha = new Date(fechaTexto);

  return fecha.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function DetallePromocionScreen({ route, navigation }) {
  const { promocionId } = route.params;

  const [promocion, setPromocion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarPromocion = useCallback(async () => {
    try {
      setError(null);
      const datos = await promocionService.obtenerPromocionPorId(promocionId);
      setPromocion(datos);
    } catch (err) {
      setError(
        'No fue posible cargar el detalle de la promoción.'
      );
    } finally {
      setCargando(false);
    }
  }, [promocionId]);

  useEffect(() => {
    cargarPromocion();
  }, [cargarPromocion]);

  const etiqueta = promocion
    ? ESTADO_ETIQUETAS[promocion.estado] ?? ESTADO_ETIQUETAS.PENDIENTE
    : null;

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
          <Text style={styles.tituloHeader}>Detalle de promoción</Text>
          <Text style={styles.subtituloHeader}>
            Información de tu promoción contratada
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
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
            <View style={styles.tarjetaPrincipal}>
              <View style={styles.iconoPrincipal}>
                <Ionicons name="star" size={26} color="#FFFFFF" />
              </View>

              <Text style={styles.nombrePlan}>{promocion.planNombre}</Text>

              <View
                style={[
                  styles.badgeEstado,
                  { backgroundColor: etiqueta.fondo },
                ]}
              >
                <Ionicons
                  name={etiqueta.icono}
                  size={14}
                  color={etiqueta.color}
                />
                <Text style={[styles.textoBadge, { color: etiqueta.color }]}>
                  {etiqueta.texto}
                </Text>
              </View>
            </View>

            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Vigencia</Text>

              <View style={styles.fila}>
                <View style={styles.iconoFila}>
                  <Ionicons
                    name="play-outline"
                    size={18}
                    color="#0D9488"
                  />
                </View>

                <View style={styles.textoFila}>
                  <Text style={styles.etiquetaFila}>Fecha de inicio</Text>
                  <Text style={styles.valorFila}>
                    {formatearFecha(promocion.fechaInicio)}
                  </Text>
                </View>
              </View>

              <View style={[styles.fila, styles.filaSeparada]}>
                <View style={styles.iconoFila}>
                  <Ionicons name="flag-outline" size={18} color="#0D9488" />
                </View>

                <View style={styles.textoFila}>
                  <Text style={styles.etiquetaFila}>Fecha de fin</Text>
                  <Text style={styles.valorFila}>
                    {formatearFecha(promocion.fechaFin)}
                  </Text>
                </View>
              </View>

              {promocion.estado === 'ACTIVA' && (
                <View style={[styles.fila, styles.filaSeparada]}>
                  <View style={styles.iconoFila}>
                    <Ionicons
                      name={
                        promocion.vigente
                          ? 'eye-outline'
                          : 'eye-off-outline'
                      }
                      size={18}
                      color="#0D9488"
                    />
                  </View>

                  <View style={styles.textoFila}>
                    <Text style={styles.etiquetaFila}>
                      Visibilidad destacada
                    </Text>
                    <Text style={styles.valorFila}>
                      {promocion.vigente
                        ? 'Tu servicio se muestra destacado'
                        : 'La promoción ya no está vigente'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Servicio promocionado</Text>

              <View style={styles.fila}>
                <View style={styles.iconoFila}>
                  <Ionicons
                    name="briefcase-outline"
                    size={18}
                    color="#0D9488"
                  />
                </View>

                <View style={styles.textoFila}>
                  <Text style={styles.etiquetaFila}>Identificador</Text>
                  <Text style={styles.valorFila}>
                    #{promocion.servicioId}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Registrada el</Text>
              <Text style={styles.fechaCreacion}>
                {formatearFecha(promocion.fechaCreacion)}
              </Text>
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
  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    alignItems: 'center',
  },
  iconoPrincipal: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  nombrePlan: {
    color: '#172B3A',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 10,
  },
  badgeEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  textoBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  seccion: {
    marginTop: 22,
  },
  tituloSeccion: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
  },
  filaSeparada: {
    marginTop: 10,
  },
  iconoFila: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  textoFila: {
    flex: 1,
  },
  etiquetaFila: {
    color: '#64748B',
    fontSize: 11,
  },
  valorFila: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  fechaCreacion: {
    color: '#64748B',
    fontSize: 13,
  },
});