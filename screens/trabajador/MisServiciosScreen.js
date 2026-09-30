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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { servicioService } from '../../services/servicioService';

export default function MisServiciosScreen({
  navigation,
}) {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  const cargarServicios = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const [
          serviciosObtenidos,
          categoriasObtenidas,
        ] = await Promise.all([
          servicioService.listarMisServicios(),
          servicioService.listarCategorias(),
        ]);

        setServicios(
          Array.isArray(serviciosObtenidos)
            ? serviciosObtenidos
            : []
        );

        setCategorias(
          Array.isArray(categoriasObtenidas)
            ? categoriasObtenidas
            : []
        );
      } catch (err) {
        const mensaje =
          err?.response?.data?.message ||
          err?.response?.data?.mensaje ||
          err?.message ||
          'No se pudieron cargar los servicios.';

        setError(mensaje);
        setServicios([]);
        setCategorias([]);
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

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
      .replace(
        /\b\w/g,
        (letra) => letra.toUpperCase()
      );
  };

  const obtenerNombreCategoria = (
    categoriaId
  ) => {
    const categoria = categorias.find(
      (item) =>
        Number(item.id) ===
        Number(categoriaId)
    );

    return categoria?.nombre ?? 'Sin categoría';
  };

  const obtenerTarifa = (servicio) => {
    const minima = Number(
      servicio.tarifaMinima
    );

    const maxima =
      servicio.tarifaMaxima !== null &&
      servicio.tarifaMaxima !== undefined
        ? Number(servicio.tarifaMaxima)
        : null;

    if (
      maxima !== null &&
      !Number.isNaN(maxima)
    ) {
      return `$${minima.toFixed(
        2
      )} - $${maxima.toFixed(2)}`;
    }

    return `Desde $${minima.toFixed(2)}`;
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />

          <Text style={styles.textoCarga}>
            Cargando servicios...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={styles.encabezadoPrincipal}>
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
              Mis servicios
            </Text>

            <Text style={styles.subtitulo}>
              Administra los servicios que ofreces
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.botonAgregarSuperior}
          onPress={() =>
            navigation.navigate(
              'CrearServicio'
            )
          }
        >
          <Ionicons
            name="add"
            size={26}
            color="#FFFFFF"
          />
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

            <Text style={styles.errorTexto}>
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() =>
                cargarServicios()
              }
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
              Publica tu primer servicio para comenzar a mostrar tu trabajo dentro de ConnectaOficios.
            </Text>

            <Pressable
              style={styles.botonCrear}
              onPress={() =>
                navigation.navigate(
                  'CrearServicio'
                )
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.botonCrearTexto
                }
              >
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
              <View
                key={servicio.id}
                style={styles.tarjeta}
              >
                <View
                  style={
                    styles.tarjetaEncabezado
                  }
                >
                  <View
                    style={
                      styles.iconoServicio
                    }
                  >
                    <Ionicons
                      name="construct-outline"
                      size={25}
                      color="#2563EB"
                    />
                  </View>

                  <View
                    style={
                      styles.informacionPrincipal
                    }
                  >
                    <Text
                      style={
                        styles.tituloServicio
                      }
                    >
                      {servicio.titulo}
                    </Text>

                    <Text
                      style={
                        styles.estadoTexto
                      }
                    >
                      {obtenerNombreEstado(
                        servicio.estado
                      )}
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.descripcion}
                  numberOfLines={3}
                >
                  {servicio.descripcion}
                </Text>

                <View
                  style={styles.separador}
                />

                <View
                  style={
                    styles.tarifaContenedor
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.tarifaEtiqueta
                      }
                    >
                      Tarifa
                    </Text>

                    <Text
                      style={styles.tarifa}
                    >
                      {obtenerTarifa(
                        servicio
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.categoriaContenedor
                    }
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={15}
                      color="#667085"
                    />

                    <Text
                      style={
                        styles.categoriaTexto
                      }
                    >
                      {obtenerNombreCategoria(
                        servicio.categoriaId
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.acciones}>
                  <Pressable
                    style={
                      styles.botonAccion
                    }
                    onPress={() =>
                      navigation.navigate(
                        'EditarServicio',
                        {
                          servicioId:
                            servicio.id,
                        }
                      )
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color="#2563EB"
                    />

                    <Text
                      style={
                        styles.botonAccionTexto
                      }
                    >
                      Editar
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.botonAccion
                    }
                    onPress={() =>
                      navigation.navigate(
                        'Disponibilidad',
                        {
                          servicioId:
                            servicio.id,
                        }
                      )
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={19}
                      color="#2563EB"
                    />

                    <Text
                      style={
                        styles.botonAccionTexto
                      }
                    >
                      Horarios
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.botonAccion
                    }
                    onPress={() =>
                      navigation.navigate(
                        'ZonaCobertura',
                        {
                          servicioId:
                            servicio.id,
                        }
                      )
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={19}
                      color="#2563EB"
                    />

                    <Text
                      style={
                        styles.botonAccionTexto
                      }
                    >
                      Zonas
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable
              style={
                styles.botonCrearInferior
              }
              onPress={() =>
                navigation.navigate(
                  'CrearServicio'
                )
              }
            >
              <Ionicons
                name="add"
                size={21}
                color="#2563EB"
              />

              <Text
                style={
                  styles.botonCrearInferiorTexto
                }
              >
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
  botonAgregarSuperior: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
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
  resultados: {
    marginBottom: 13,
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
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
  informacionPrincipal: {
    flex: 1,
  },
  tituloServicio: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  estadoTexto: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#027A48',
  },
  descripcion: {
    marginTop: 15,
    fontSize: 14,
    lineHeight: 20,
    color: '#475467',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 15,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  categoriaContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
  },
  categoriaTexto: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
    textAlign: 'right',
  },
  acciones: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 17,
  },
  botonAccion: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  botonAccionTexto: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
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
  botonCrear: {
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCrearTexto: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  botonCrearInferior: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCrearInferiorTexto: {
    marginLeft: 7,
    color: '#2563EB',
    fontWeight: '700',
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