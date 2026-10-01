import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { servicioService } from '../../services/servicioService';
import { userService } from '../../services/userService';

export default function BuscarServiciosScreen({
  navigation,
}) {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [trabajadores, setTrabajadores] = useState({});
  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  const obtenerContenidoPagina = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.contenido)) return data.contenido;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.elementos)) return data.elementos;
    return [];
  };

  const obtenerMensajeError = (err) => {
    const data = err?.response?.data;

    return (
      data?.message ||
      data?.mensaje ||
      err?.message ||
      'No se pudieron cargar los servicios.'
    );
  };

  const cargarCategorias = useCallback(async () => {
    try {
      const data =
        await servicioService.listarCategorias();

      setCategorias(data);
    } catch {
      setCategorias([]);
    }
  }, []);

  const cargarTrabajadores = useCallback(
    async (serviciosObtenidos) => {
      const perfilesIds = [
        ...new Set(
          serviciosObtenidos
            .map((servicio) =>
              Number(servicio.perfilTrabajadorId)
            )
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            )
        ),
      ];

      const resultado = {};

      await Promise.all(
        perfilesIds.map(async (perfilId) => {
          try {
            const perfil =
              await servicioService.obtenerPerfilTrabajadorPorId(
                perfilId
              );

            const trabajadorId = Number(
              perfil?.trabajadorId
            );

            if (
              !Number.isInteger(trabajadorId) ||
              trabajadorId <= 0
            ) {
              return;
            }

            let usuario = null;

            try {
              usuario =
                await userService.obtenerUsuarioPorId(
                  trabajadorId
                );
            } catch {
              usuario = null;
            }

            resultado[perfilId] = {
              perfil,
              usuario,
              trabajadorId,
            };
          } catch {
            resultado[perfilId] = null;
          }
        })
      );

      setTrabajadores(resultado);
    },
    []
  );

  const cargarServicios = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const data = await servicioService.listar({
          texto: texto.trim() || null,
          categoriaId,
          estado: 'ACTIVO',
          page: 0,
          size: 50,
        });

        const serviciosObtenidos =
          obtenerContenidoPagina(data);

        setServicios(serviciosObtenidos);

        await cargarTrabajadores(
          serviciosObtenidos
        );
      } catch (err) {
        setServicios([]);
        setTrabajadores({});
        setError(obtenerMensajeError(err));
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [
      texto,
      categoriaId,
      cargarTrabajadores,
    ]
  );

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarServicios();
    }, 350);

    return () => clearTimeout(temporizador);
  }, [cargarServicios]);

  const actualizar = async () => {
    setActualizando(true);
    await cargarServicios(false);
  };

  const seleccionarCategoria = (id) => {
    setCategoriaId((actual) =>
      Number(actual) === Number(id)
        ? null
        : Number(id)
    );
  };

  const limpiarFiltros = () => {
    setTexto('');
    setCategoriaId(null);
  };

  const obtenerNombreCategoria = (id) => {
    return (
      categorias.find(
        (categoria) =>
          Number(categoria.id) === Number(id)
      )?.nombre ?? `Categoría ${id}`
    );
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
      Number.isFinite(maxima) &&
      maxima !== null
    ) {
      return `$${minima.toFixed(
        2
      )} - $${maxima.toFixed(2)}`;
    }

    if (Number.isFinite(minima)) {
      return `Desde $${minima.toFixed(2)}`;
    }

    return 'Consultar tarifa';
  };

  const obtenerTrabajador = (servicio) => {
    return trabajadores[
      Number(servicio.perfilTrabajadorId)
    ];
  };

  const hayFiltros = useMemo(
    () =>
      !!texto.trim() ||
      categoriaId !== null,
    [texto, categoriaId]
  );

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
            Explorar servicios
          </Text>

          <Text style={styles.subtitulo}>
            Encuentra el servicio que necesitas
          </Text>
        </View>

        <View style={styles.espacio} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
      >
        <View style={styles.buscador}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#667085"
          />

          <TextInput
            style={styles.inputBusqueda}
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar servicios..."
            placeholderTextColor="#98A2B3"
            returnKeyType="search"
          />

          {texto ? (
            <Pressable
              onPress={() => setTexto('')}
            >
              <Ionicons
                name="close-circle"
                size={21}
                color="#98A2B3"
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtrosCabecera}>
          <Text style={styles.filtrosTitulo}>
            Categorías
          </Text>

          {hayFiltros ? (
            <Pressable
              onPress={limpiarFiltros}
            >
              <Text style={styles.limpiarTexto}>
                Limpiar filtros
              </Text>
            </Pressable>
          ) : null}
        </View>

        {categorias.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.categorias
            }
          >
            <Pressable
              style={[
                styles.categoria,
                categoriaId === null &&
                  styles.categoriaSeleccionada,
              ]}
              onPress={() =>
                setCategoriaId(null)
              }
            >
              <Text
                style={[
                  styles.categoriaTexto,
                  categoriaId === null &&
                    styles.categoriaTextoSeleccionada,
                ]}
              >
                Todas
              </Text>
            </Pressable>

            {categorias.map((categoria) => {
              const seleccionada =
                Number(categoriaId) ===
                Number(categoria.id);

              return (
                <Pressable
                  key={categoria.id}
                  style={[
                    styles.categoria,
                    seleccionada &&
                      styles.categoriaSeleccionada,
                  ]}
                  onPress={() =>
                    seleccionarCategoria(
                      categoria.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoriaTexto,
                      seleccionada &&
                        styles.categoriaTextoSeleccionada,
                    ]}
                  >
                    {categoria.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.resultadosCabecera}>
          <Text style={styles.resultadosTitulo}>
            Servicios disponibles
          </Text>

          {!cargando && !error ? (
            <Text
              style={styles.resultadosCantidad}
            >
              {servicios.length}
            </Text>
          ) : null}
        </View>

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" />

            <Text style={styles.cargandoTexto}>
              Buscando servicios...
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
              No pudimos cargar los servicios
            </Text>

            <Text style={styles.estadoTexto}>
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
          <View style={styles.estadoContenedor}>
            <Ionicons
              name="search-outline"
              size={45}
              color="#98A2B3"
            />

            <Text style={styles.estadoTitulo}>
              No encontramos servicios
            </Text>

            <Text style={styles.estadoTexto}>
              Prueba con otro término o selecciona una categoría diferente.
            </Text>

            {hayFiltros ? (
              <Pressable
                style={styles.botonSecundario}
                onPress={limpiarFiltros}
              >
                <Text
                  style={
                    styles.botonSecundarioTexto
                  }
                >
                  Limpiar filtros
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          servicios.map((servicio) => {
            const trabajador =
              obtenerTrabajador(servicio);

            const nombreTrabajador =
              trabajador?.usuario?.nombre ||
              'Profesional';

            const fotoTrabajador =
              trabajador?.perfil?.fotoUrl;

            return (
              <Pressable
                key={servicio.id}
                style={styles.tarjeta}
                onPress={() =>
                  navigation.navigate(
                    'DetalleServicio',
                    {
                      servicioId:
                        servicio.id,
                    }
                  )
                }
              >
                <View
                  style={
                    styles.tarjetaSuperior
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
                      color="#0D9488"
                    />
                  </View>

                  <View
                    style={
                      styles.tarjetaInformacion
                    }
                  >
                    <Text
                      style={
                        styles.servicioTitulo
                      }
                      numberOfLines={2}
                    >
                      {servicio.titulo}
                    </Text>

                    <View
                      style={
                        styles.categoriaFila
                      }
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color="#667085"
                      />

                      <Text
                        style={
                          styles.categoriaNombre
                        }
                      >
                        {obtenerNombreCategoria(
                          servicio.categoriaId
                        )}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#98A2B3"
                  />
                </View>

                <View
                  style={
                    styles.trabajadorFila
                  }
                >
                  {fotoTrabajador ? (
                    <Image
                      source={{
                        uri: fotoTrabajador,
                      }}
                      style={
                        styles.trabajadorFoto
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.trabajadorFotoVacia
                      }
                    >
                      <Ionicons
                        name="person"
                        size={17}
                        color="#2563EB"
                      />
                    </View>
                  )}

                  <View
                    style={
                      styles.trabajadorDatos
                    }
                  >
                    <Text
                      style={
                        styles.trabajadorEtiqueta
                      }
                    >
                      Ofrecido por
                    </Text>

                    <Text
                      style={
                        styles.trabajadorNombre
                      }
                      numberOfLines={1}
                    >
                      {nombreTrabajador}
                    </Text>
                  </View>

                  {trabajador?.perfil
                    ?.oficioPrincipal ? (
                    <Text
                      style={
                        styles.trabajadorOficio
                      }
                      numberOfLines={1}
                    >
                      {
                        trabajador.perfil
                          .oficioPrincipal
                      }
                    </Text>
                  ) : null}
                </View>

                <Text
                  style={
                    styles.servicioDescripcion
                  }
                  numberOfLines={3}
                >
                  {servicio.descripcion}
                </Text>

                <View
                  style={
                    styles.tarjetaInferior
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
                    style={styles.verDetalle}
                  >
                    <Text
                      style={
                        styles.verDetalleTexto
                      }
                    >
                      Ver detalle
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#2563EB"
                    />
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
  buscador: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBusqueda: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 15,
    color: '#101828',
  },
  filtrosCabecera: {
    marginTop: 21,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtrosTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  limpiarTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  categorias: {
    gap: 8,
    paddingRight: 12,
  },
  categoria: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  categoriaSeleccionada: {
    borderColor: '#0D9488',
    backgroundColor: '#E6F4F1',
  },
  categoriaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475467',
  },
  categoriaTextoSeleccionada: {
    color: '#0D9488',
  },
  resultadosCabecera: {
    marginTop: 25,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultadosTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  resultadosCantidad: {
    marginLeft: 8,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    color: '#0D9488',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  cargando: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 12,
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
  botonSecundario: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  botonSecundarioTexto: {
    color: '#344054',
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
  },
  servicioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  categoriaFila: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriaNombre: {
    marginLeft: 5,
    fontSize: 13,
    color: '#667085',
  },
  trabajadorFila: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  trabajadorFoto: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
  },
  trabajadorFotoVacia: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trabajadorDatos: {
    flex: 1,
    marginLeft: 10,
  },
  trabajadorEtiqueta: {
    fontSize: 11,
    color: '#98A2B3',
  },
  trabajadorNombre: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: '#344054',
  },
  trabajadorOficio: {
    maxWidth: 120,
    marginLeft: 8,
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '600',
  },
  servicioDescripcion: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#475467',
  },
  tarjetaInferior: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tarifaEtiqueta: {
    fontSize: 12,
    color: '#98A2B3',
  },
  tarifa: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  verDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verDetalleTexto: {
    marginRight: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});