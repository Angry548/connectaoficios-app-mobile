import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { servicioService } from '../../services/servicioService';

export default function MisServiciosScreen({ navigation }) {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  const cargarServicios = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargando(true);
    }

    setError('');

    try {
      const data = await servicioService.listarMisServicios();
      setServicios(data);
    } catch (err) {
      const mensaje =
        err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        err?.message ||
        'No se pudieron cargar los servicios.';

      setError(mensaje);
      setServicios([]);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarServicios();
    }, [cargarServicios])
  );

  const actualizar = async () => {
    setActualizando(true);
    await cargarServicios(false);
  };

  const obtenerNombreEstado = (estado) => {
    if (!estado) {
      return 'Sin estado';
    }

    return estado
      .toString()
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  };

  const obtenerTarifa = (servicio) => {
    const minima = Number(servicio.tarifaMinima);
    const maxima =
      servicio.tarifaMaxima !== null &&
      servicio.tarifaMaxima !== undefined
        ? Number(servicio.tarifaMaxima)
        : null;

    if (maxima !== null && !Number.isNaN(maxima)) {
      return `$${minima.toFixed(2)} - $${maxima.toFixed(2)}`;
    }

    return `Desde $${minima.toFixed(2)}`;
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />
          <Text style={styles.textoCarga}>Cargando servicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View>
          <Text style={styles.titulo}>Mis servicios</Text>
          <Text style={styles.subtitulo}>
            Administra los servicios que ofreces
          </Text>
        </View>

        <Pressable
          style={styles.botonAgregarSuperior}
          onPress={() => navigation.navigate('CrearServicio')}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

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
        {error ? (
          <View style={styles.errorContenedor}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />

            <Text style={styles.errorTitulo}>
              No se pudieron cargar tus servicios
            </Text>

            <Text style={styles.errorTexto}>{error}</Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargarServicios()}
            >
              <Text style={styles.botonReintentarTexto}>
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : servicios.length === 0 ? (
          <View style={styles.vacio}>
            <View style={styles.iconoVacio}>
              <Ionicons
                name="briefcase-outline"
                size={46}
                color="#2563EB"
              />
            </View>

            <Text style={styles.vacioTitulo}>
              Aún no tienes servicios
            </Text>

            <Text style={styles.vacioTexto}>
              Publica tu primer servicio para comenzar a mostrar tu trabajo
              dentro de ConnectaOficios.
            </Text>

            <Pressable
              style={styles.botonCrear}
              onPress={() => navigation.navigate('CrearServicio')}
            >
              <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
              <Text style={styles.botonCrearTexto}>
                Crear mi primer servicio
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.resultados}>
              {servicios.length === 1
                ? '1 servicio publicado'
                : `${servicios.length} servicios publicados`}
            </Text>

            {servicios.map((servicio) => (
              <View key={servicio.id} style={styles.tarjeta}>
                <View style={styles.tarjetaEncabezado}>
                  <View style={styles.iconoServicio}>
                    <Ionicons
                      name="construct-outline"
                      size={25}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.informacionPrincipal}>
                    <Text style={styles.tituloServicio}>
                      {servicio.titulo}
                    </Text>

                    <View style={styles.estado}>
                      <View style={styles.puntoEstado} />
                      <Text style={styles.estadoTexto}>
                        {obtenerNombreEstado(servicio.estado)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text
                  style={styles.descripcion}
                  numberOfLines={3}
                >
                  {servicio.descripcion}
                </Text>

                <View style={styles.separador} />

                <View style={styles.tarifaContenedor}>
                  <View>
                    <Text style={styles.tarifaEtiqueta}>
                      Tarifa
                    </Text>
                    <Text style={styles.tarifa}>
                      {obtenerTarifa(servicio)}
                    </Text>
                  </View>

                  <View style={styles.idCategoria}>
                    <Ionicons
                      name="pricetag-outline"
                      size={16}
                      color="#667085"
                    />
                    <Text style={styles.idCategoriaTexto}>
                      Categoría {servicio.categoriaId}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <Pressable
              style={styles.botonCrearInferior}
              onPress={() => navigation.navigate('CrearServicio')}
            >
              <Ionicons name="add" size={21} color="#2563EB" />
              <Text style={styles.botonCrearInferiorTexto}>
                Agregar otro servicio
              </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
  },
  botonAgregarSuperior: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 20,
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
    fontSize: 15,
    color: '#667085',
  },
  resultados: {
    marginBottom: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#667085',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  tarjetaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoServicio: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  informacionPrincipal: {
    flex: 1,
  },
  tituloServicio: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  puntoEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#12B76A',
    marginRight: 6,
  },
  estadoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#027A48',
  },
  descripcion: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: '#475467',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 16,
  },
  tarifaContenedor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tarifaEtiqueta: {
    fontSize: 12,
    color: '#98A2B3',
  },
  tarifa: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  idCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idCategoriaTexto: {
    marginLeft: 5,
    fontSize: 12,
    color: '#667085',
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 60,
  },
  iconoVacio: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  vacioTitulo: {
    fontSize: 21,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  vacioTexto: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: '#667085',
    textAlign: 'center',
  },
  botonCrear: {
    marginTop: 24,
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCrearTexto: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonCrearInferior: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  botonCrearInferiorTexto: {
    marginLeft: 7,
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  errorTitulo: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  errorTexto: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  botonReintentarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});