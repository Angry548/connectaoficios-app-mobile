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
import { promocionService } from '../../services/promocionService';

const ESTADO_ETIQUETAS = {
  PENDIENTE: { texto: 'Pendiente', color: '#B45309', fondo: '#FEF3C7' },
  ACTIVA: { texto: 'Activa', color: '#0D9488', fondo: '#E6F4F1' },
  FINALIZADA: { texto: 'Finalizada', color: '#64748B', fondo: '#F1F5F9' },
  CANCELADA: { texto: 'Cancelada', color: '#DC2626', fondo: '#FEF2F2' },
};

export default function PromocionesScreen({ navigation }) {
  const [planes, setPlanes] = useState([]);
  const [misPromociones, setMisPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setError(null);

      const [planesDisponibles, promocionesTrabajador] = await Promise.all([
        promocionService.obtenerPlanesDisponibles(),
        promocionService.obtenerMisPromociones(),
      ]);

      setPlanes(planesDisponibles);
      setMisPromociones(promocionesTrabajador);
    } catch (err) {
      setError(
        'No fue posible cargar las promociones. Intenta nuevamente.'
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarRefrescar = () => {
    setRefrescando(true);
    cargarDatos();
  };

  const formatearPrecio = (precio) => {
    return `$${Number(precio).toFixed(2)}`;
  };

  const irADetalle = (promocionId) => {
    navigation.navigate('DetallePromocion', { promocionId });
  };

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
          <Text style={styles.tituloHeader}>Promociones</Text>
          <Text style={styles.subtituloHeader}>
            Destaca tus servicios frente a más clientes
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
            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Planes disponibles</Text>
              <Text style={styles.descripcionSeccion}>
                Elige el período que mejor se adapte a tu servicio.
              </Text>

              {planes.length === 0 ? (
                <Text style={styles.textoVacio}>
                  No hay planes de promoción disponibles por el momento.
                </Text>
              ) : (
                planes.map((plan) => (
                  <View key={plan.id} style={styles.tarjetaPlan}>
                    <View style={styles.iconoPlan}>
                      <Ionicons name="star-outline" size={22} color="#0D9488" />
                    </View>

                    <View style={styles.datosPlan}>
                      <Text style={styles.nombrePlan}>{plan.nombre}</Text>

                      {!!plan.descripcion && (
                        <Text style={styles.descripcionPlan}>
                          {plan.descripcion}
                        </Text>
                      )}

                      <Text style={styles.duracionPlan}>
                        {plan.duracionDias} días de duración
                      </Text>
                    </View>

                    <Text style={styles.precioPlan}>
                      {formatearPrecio(plan.precio)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.seccion}>
              <Text style={styles.tituloSeccion}>Mis promociones</Text>
              <Text style={styles.descripcionSeccion}>
                Consulta el estado de las promociones que has contratado.
              </Text>

              {misPromociones.length === 0 ? (
                <Text style={styles.textoVacio}>
                  Todavía no has contratado ninguna promoción.
                </Text>
              ) : (
                misPromociones.map((promocion) => {
                  const etiqueta =
                    ESTADO_ETIQUETAS[promocion.estado] ??
                    ESTADO_ETIQUETAS.PENDIENTE;

                  return (
                    <TouchableOpacity
                      key={promocion.id}
                      style={styles.tarjetaPromocion}
                      activeOpacity={0.8}
                      onPress={() => irADetalle(promocion.id)}
                    >
                      <View style={styles.datosPromocion}>
                        <Text style={styles.nombrePromocion}>
                          {promocion.planNombre}
                        </Text>

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

                      <Ionicons
                        name="chevron-forward-outline"
                        size={21}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
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
    fontSize: 21,
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
  seccion: {
    marginBottom: 26,
  },
  tituloSeccion: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
  },
  descripcionSeccion: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  textoVacio: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  tarjetaPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginBottom: 10,
  },
  iconoPlan: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  datosPlan: {
    flex: 1,
  },
  nombrePlan: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '800',
  },
  descripcionPlan: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  duracionPlan: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  precioPlan: {
    color: '#0D9488',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  tarjetaPromocion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginBottom: 10,
  },
  datosPromocion: {
    flex: 1,
  },
  nombrePromocion: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  badgeEstado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
});