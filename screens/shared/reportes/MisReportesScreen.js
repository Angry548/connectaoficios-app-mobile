import PaginationControls from '../../../components/PaginationControls';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import reporteService from '../../../services/reporteService';

const ESTADOS = {
  PENDIENTE: {
    texto: 'Pendiente',
    color: '#B54708',
    fondo: '#FEF0C7',
    icono:
      'time-outline',
  },

  EN_REVISION: {
    texto: 'En revisión',
    color: '#175CD3',
    fondo: '#EFF8FF',
    icono:
      'search-outline',
  },

  RESUELTO: {
    texto: 'Resuelto',
    color: '#027A48',
    fondo: '#ECFDF3',
    icono:
      'checkmark-circle-outline',
  },

  RECHAZADO: {
    texto: 'Rechazado',
    color: '#B42318',
    fondo: '#FEE4E2',
    icono:
      'close-circle-outline',
  },
};

const FILTROS_ESTADO = [
  {
    valor: '',
    texto: 'Todos',
  },
  {
    valor: 'PENDIENTE',
    texto: 'Pendientes',
  },
  {
    valor: 'EN_REVISION',
    texto: 'En revisión',
  },
  {
    valor: 'RESUELTO',
    texto: 'Resueltos',
  },
  {
    valor: 'RECHAZADO',
    texto: 'Rechazados',
  },
];

const obtenerEstado = (
  estado
) => {
  return (
    ESTADOS[
      String(
        estado || ''
      ).toUpperCase()
    ] || {
      texto: 'Sin estado',
      color: '#475467',
      fondo: '#F2F4F7',
      icono:
        'help-circle-outline',
    }
  );
};

const formatearFecha = (
  valor
) => {
  if (!valor) {
    return 'Sin fecha';
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return String(valor);
  }

  return fecha
    .toLocaleString(
      'es-SV',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
};

export default function MisReportesScreen({
  navigation,
}) {
  const [
    reportes,
    setReportes,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    texto,
    setTexto,
  ] = useState('');

  const [
    textoAplicado,
    setTextoAplicado,
  ] = useState('');

  const [
    estado,
    setEstado,
  ] = useState('');

  const [
    pagina,
    setPagina,
  ] = useState(0);

  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(0);

  const [
    totalElementos,
    setTotalElementos,
  ] = useState(0);

  const cargar =
    useCallback(
      async (
        mostrarCarga = true
      ) => {
        if (mostrarCarga) {
          setCargando(true);
        }

        setError('');

        try {
          const respuesta =
            await reporteService
              .obtenerMisReportes({
                texto:
                  textoAplicado,
                estado,
                page:
                  pagina,
                size: 10,
              });

          setReportes(
            respuesta.contenido
          );

          setTotalPaginas(
            respuesta.totalPaginas
          );

          setTotalElementos(
            respuesta.totalElementos
          );
        } catch (err) {
          setReportes([]);

          setError(
            err?.message ||
              'No fue posible cargar tus reportes.'
          );
        } finally {
          setCargando(false);
          setActualizando(
            false
          );
        }
      },
      [
        textoAplicado,
        estado,
        pagina,
      ]
    );

  useEffect(() => {
    cargar();
  }, [cargar]);

  useFocusEffect(
    useCallback(() => {
      cargar(false);

      return undefined;
    }, [cargar])
  );

  const aplicarBusqueda = () => {
    Keyboard.dismiss();

    setPagina(0);

    setTextoAplicado(
      texto.trim()
    );
  };

  const cambiarEstado = (
    nuevoEstado
  ) => {
    setPagina(0);
    setEstado(
      nuevoEstado
    );
  };

  const actualizar =
    async () => {
      setActualizando(true);
      await cargar(false);
    };

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View
          style={styles.cargando}
        >
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text
            style={styles.cargandoTexto}
          >
            Cargando reportes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.contenedor}
      edges={['top']}
    >
      <View
        style={styles.encabezado}
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
          style={styles.encabezadoTexto}
        >
          <Text
            style={styles.titulo}
          >
            Mis reportes
          </Text>

          <Text
            style={styles.subtitulo}
          >
            Consulta el estado de tus reportes
          </Text>
        </View>

        <View
          style={styles.iconoSuperior}
        >
          <Ionicons
            name="flag-outline"
            size={23}
            color="#0D9488"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={
              actualizar
            }
          />
        }
      >
        <View
          style={styles.busqueda}
        >
          <View
            style={styles.inputBusqueda}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#94A3B8"
            />

            <TextInput
              style={styles.input}
              value={texto}
              onChangeText={
                setTexto
              }
              placeholder="Buscar por motivo o descripción"
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              onSubmitEditing={
                aplicarBusqueda
              }
            />
          </View>

          <Pressable
            style={styles.botonBuscar}
            onPress={
              aplicarBusqueda
            }
          >
            <Ionicons
              name="search"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filtros
          }
        >
          {FILTROS_ESTADO.map(
            (filtro) => {
              const activo =
                estado ===
                filtro.valor;

              return (
                <Pressable
                  key={
                    filtro.valor ||
                    'TODOS'
                  }
                  style={[
                    styles.filtro,

                    activo &&
                      styles.filtroActivo,
                  ]}
                  onPress={() =>
                    cambiarEstado(
                      filtro.valor
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filtroTexto,

                      activo &&
                        styles.filtroTextoActivo,
                    ]}
                  >
                    {filtro.texto}
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>

        <View
          style={styles.resumen}
        >
          <Text
            style={styles.resumenTitulo}
          >
            Reportes registrados
          </Text>

          <Text
            style={styles.resumenCantidad}
          >
            {totalElementos}{' '}
            {totalElementos === 1
              ? 'reporte'
              : 'reportes'}
          </Text>
        </View>

        {error ? (
          <View
            style={styles.estadoVacio}
          >
            <Ionicons
              name="alert-circle-outline"
              size={46}
              color="#B42318"
            />

            <Text
              style={styles.estadoTitulo}
            >
              No se pudieron cargar
            </Text>

            <Text
              style={styles.estadoTexto}
            >
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() =>
                cargar()
              }
            >
              <Text
                style={styles.botonReintentarTexto}
              >
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : reportes.length ===
          0 ? (
          <View
            style={styles.estadoVacio}
          >
            <View
              style={styles.iconoVacio}
            >
              <Ionicons
                name="flag-outline"
                size={40}
                color="#0D9488"
              />
            </View>

            <Text
              style={styles.estadoTitulo}
            >
              No hay reportes
            </Text>

            <Text
              style={styles.estadoTexto}
            >
              No encontramos reportes que coincidan con los filtros seleccionados.
            </Text>
          </View>
        ) : (
          <View
            style={styles.lista}
          >
            {reportes.map(
              (reporte) => {
                const estilo =
                  obtenerEstado(
                    reporte.estado
                  );

                return (
                  <Pressable
                    key={
                      reporte.id
                    }
                    style={
                      styles.tarjeta
                    }
                    onPress={() =>
                      navigation.navigate(
                        'DetalleReporte',
                        {
                          reporteId:
                            reporte.id,
                        }
                      )
                    }
                  >
                    <View
                      style={styles.tarjetaSuperior}
                    >
                      <View
                        style={styles.tipoIcono}
                      >
                        <Ionicons
                          name={
                            reporte.tipo ===
                            'SERVICIO'
                              ? 'briefcase-outline'
                              : 'person-outline'
                          }
                          size={21}
                          color="#0D9488"
                        />
                      </View>

                      <View
                        style={styles.tarjetaTituloContenido}
                      >
                        <Text
                          style={styles.motivo}
                          numberOfLines={2}
                        >
                          {reporte.motivo}
                        </Text>

                        <Text
                          style={styles.tipoTexto}
                        >
                          {reporte.tipo ===
                          'SERVICIO'
                            ? 'Servicio'
                            : 'Usuario'}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#94A3B8"
                      />
                    </View>

                    <Text
                      style={styles.descripcion}
                      numberOfLines={2}
                    >
                      {reporte.descripcion}
                    </Text>

                    <View
                      style={styles.tarjetaInferior}
                    >
                      <View
                        style={[
                          styles.estadoBadge,
                          {
                            backgroundColor:
                              estilo.fondo,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            estilo.icono
                          }
                          size={14}
                          color={
                            estilo.color
                          }
                        />

                        <Text
                          style={[
                            styles.estadoTextoBadge,
                            {
                              color:
                                estilo.color,
                            },
                          ]}
                        >
                          {estilo.texto}
                        </Text>
                      </View>

                      <Text
                        style={styles.fecha}
                      >
                        {formatearFecha(
                          reporte.fechaCreacion
                        )}
                      </Text>
                    </View>
                  </Pressable>
                );
              }
            )}
          </View>
        )}

        {!cargando && !error ? <PaginationControls hideButtons currentPage={pagina} totalPages={totalPaginas}
          totalItems={totalElementos} currentItemCount={reportes.length} pageSize={10} /> : null}
        {totalPaginas > 1 && (
          <View
            style={styles.paginacion}
          >
            <Pressable
              style={[
                styles.botonPagina,

                pagina <= 0 &&
                  styles.botonPaginaDeshabilitado,
              ]}
              disabled={
                pagina <= 0
              }
              onPress={() =>
                setPagina(
                  (
                    actual
                  ) =>
                    Math.max(
                      0,
                      actual - 1
                    )
                )
              }
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={
                  pagina <= 0
                    ? '#98A2B3'
                    : '#0D9488'
                }
              />

              <Text
                style={[
                  styles.botonPaginaTexto,

                  pagina <= 0 &&
                    styles.botonPaginaTextoDeshabilitado,
                ]}
              >
                Anterior
              </Text>
            </Pressable>

            <Text
              style={styles.numeroPagina}
            >
              Página {pagina + 1} de{' '}
              {totalPaginas}
            </Text>

            <Pressable
              style={[
                styles.botonPagina,

                pagina + 1 >=
                  totalPaginas &&
                  styles.botonPaginaDeshabilitado,
              ]}
              disabled={
                pagina + 1 >=
                totalPaginas
              }
              onPress={() =>
                setPagina(
                  (
                    actual
                  ) =>
                    actual + 1
                )
              }
            >
              <Text
                style={[
                  styles.botonPaginaTexto,

                  pagina + 1 >=
                    totalPaginas &&
                    styles.botonPaginaTextoDeshabilitado,
                ]}
              >
                Siguiente
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={
                  pagina + 1 >=
                  totalPaginas
                    ? '#98A2B3'
                    : '#0D9488'
                }
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
    },

    encabezado: {
      minHeight: 82,
      paddingHorizontal: 18,
      backgroundColor:
        '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
    },

    botonVolver: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor:
        '#F1F5F9',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    encabezadoTexto: {
      flex: 1,
    },

    titulo: {
      color: '#172B3A',
      fontSize: 20,
      fontWeight: '800',
    },

    subtitulo: {
      color: '#64748B',
      fontSize: 12,
      marginTop: 2,
    },

    iconoSuperior: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#E6F4F1',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    scroll: {
      flex: 1,
    },

    contenido: {
      padding: 18,
      paddingBottom: 38,
    },

    busqueda: {
      flexDirection: 'row',
      gap: 9,
    },

    inputBusqueda: {
      flex: 1,
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        '#D0D5DD',
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
      gap: 8,
    },

    input: {
      flex: 1,
      color: '#172B3A',
      fontSize: 13,
      paddingVertical: 0,
    },

    botonBuscar: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor:
        '#0D9488',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    filtros: {
      gap: 8,
      paddingVertical: 15,
    },

    filtro: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#D0D5DD',
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal: 14,
      paddingVertical: 8,
    },

    filtroActivo: {
      backgroundColor:
        '#E6F4F1',
      borderColor:
        '#0D9488',
    },

    filtroTexto: {
      color: '#475467',
      fontSize: 12,
      fontWeight: '700',
    },

    filtroTextoActivo: {
      color: '#0D9488',
    },

    resumen: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 13,
    },

    resumenTitulo: {
      color: '#172B3A',
      fontSize: 16,
      fontWeight: '800',
    },

    resumenCantidad: {
      color: '#64748B',
      fontSize: 12,
    },

    lista: {
      gap: 12,
    },

    tarjeta: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#E2E8F0',
      padding: 16,
    },

    tarjetaSuperior: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    tipoIcono: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        '#E6F4F1',
      justifyContent:
        'center',
      alignItems: 'center',
      marginRight: 11,
    },

    tarjetaTituloContenido: {
      flex: 1,
      marginRight: 8,
    },

    motivo: {
      color: '#172B3A',
      fontSize: 14,
      fontWeight: '800',
    },

    tipoTexto: {
      color: '#64748B',
      fontSize: 11,
      marginTop: 2,
    },

    descripcion: {
      color: '#475467',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 12,
    },

    tarjetaInferior: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: 14,
    },

    estadoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
      gap: 4,
    },

    estadoTextoBadge: {
      fontSize: 10,
      fontWeight: '800',
    },

    fecha: {
      color: '#98A2B3',
      fontSize: 10,
    },

    estadoVacio: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#E2E8F0',
      minHeight: 270,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 28,
    },

    iconoVacio: {
      width: 70,
      height: 70,
      borderRadius: 22,
      backgroundColor:
        '#E6F4F1',
      justifyContent:
        'center',
      alignItems: 'center',
      marginBottom: 16,
    },

    estadoTitulo: {
      color: '#172B3A',
      fontSize: 17,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 12,
    },

    estadoTexto: {
      color: '#64748B',
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 6,
    },

    botonReintentar: {
      backgroundColor:
        '#0D9488',
      borderRadius: 13,
      paddingHorizontal: 18,
      paddingVertical: 11,
      marginTop: 18,
    },

    botonReintentarTexto: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },

    paginacion: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginTop: 20,
    },

    botonPagina: {
      minHeight: 42,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#A7F3D0',
      backgroundColor:
        '#ECFDF5',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 3,
    },

    botonPaginaDeshabilitado: {
      backgroundColor:
        '#F2F4F7',
      borderColor:
        '#EAECF0',
    },

    botonPaginaTexto: {
      color: '#0D9488',
      fontSize: 11,
      fontWeight: '800',
    },

    botonPaginaTextoDeshabilitado: {
      color: '#98A2B3',
    },

    numeroPagina: {
      color: '#475467',
      fontSize: 11,
      fontWeight: '700',
    },

    cargando: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    cargandoTexto: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 10,
    },
  });