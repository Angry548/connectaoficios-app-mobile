import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect } from '@react-navigation/native';
import transaccionPagoService from '../../services/transaccionPagoService';
import promocionService from '../../services/promocionService';
import { servicioService } from '../../services/servicioService';

const ELEMENTOS_POR_PAGINA = 5;

const FILTROS = [
  {
    clave: 'TODAS',
    texto: 'Todas',
  },
  {
    clave: 'PENDIENTE',
    texto: 'Pendientes',
  },
  {
    clave: 'APROBADA',
    texto: 'Aprobadas',
  },
  {
    clave: 'RECHAZADA',
    texto: 'Rechazadas',
  },
  {
    clave: 'CANCELADA',
    texto: 'Canceladas',
  },
];

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const obtenerMensajeError = (
  error,
  mensajePredeterminado
) => {
  const data = error?.response?.data;

  if (
    typeof data === 'string' &&
    data.trim()
  ) {
    return data.trim();
  }

  if (
    typeof data?.message === 'string' &&
    data.message.trim()
  ) {
    return data.message.trim();
  }

  if (
    typeof data?.mensaje === 'string' &&
    data.mensaje.trim()
  ) {
    return data.mensaje.trim();
  }

  if (
    typeof error?.message === 'string' &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return mensajePredeterminado;
};

const formatearMonto = (monto, moneda) => {
  const numero = Number(monto);

  if (!Number.isFinite(numero)) {
    return `${moneda || ''} ${
      monto ?? '0.00'
    }`.trim();
  }

  const codigo = String(
    moneda || 'USD'
  ).toUpperCase();

  try {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: codigo,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numero);
  } catch {
    return `${codigo} ${numero.toFixed(2)}`;
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return 'Fecha no disponible';
  }

  const fechaObjeto = new Date(fecha);

  if (Number.isNaN(fechaObjeto.getTime())) {
    return String(fecha);
  }

  return fechaObjeto.toLocaleDateString(
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

const obtenerConfiguracionEstado = (
  estado
) => {
  switch (estado) {
    case 'APROBADA':
      return {
        icono: 'checkmark-circle-outline',
        color: '#027A48',
        fondo: '#ECFDF3',
      };

    case 'PENDIENTE':
      return {
        icono: 'time-outline',
        color: '#B54708',
        fondo: '#FFFAEB',
      };

    case 'RECHAZADA':
      return {
        icono: 'close-circle-outline',
        color: '#B42318',
        fondo: '#FEF3F2',
      };

    case 'CANCELADA':
      return {
        icono: 'ban-outline',
        color: '#475467',
        fondo: '#F2F4F7',
      };

    default:
      return {
        icono: 'help-circle-outline',
        color: '#667085',
        fondo: '#F2F4F7',
      };
  }
};

export default function HistorialPagosScreen({
  navigation,
}) {
  const [
    transacciones,
    setTransacciones,
  ] = useState([]);

  const [
    promociones,
    setPromociones,
  ] = useState([]);

  const [
    servicios,
    setServicios,
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
    cancelandoId,
    setCancelandoId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState('TODAS');

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const cargarDatos = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const [
          transaccionesRespuesta,
          promocionesRespuesta,
          serviciosRespuesta,
        ] = await Promise.all([
          transaccionPagoService.obtenerMisTransacciones(),
          promocionService.obtenerMisPromociones(),
          servicioService.listarMisServicios(),
        ]);

        const listaTransacciones =
          Array.isArray(transaccionesRespuesta)
            ? transaccionesRespuesta
            : [];

        const listaPromociones =
          Array.isArray(promocionesRespuesta)
            ? promocionesRespuesta
            : [];

        const listaServicios =
          Array.isArray(serviciosRespuesta)
            ? serviciosRespuesta
            : [];

        const ordenadas = [
          ...listaTransacciones,
        ].sort((a, b) => {
          const fechaA = new Date(
            a?.fecha || 0
          ).getTime();

          const fechaB = new Date(
            b?.fecha || 0
          ).getTime();

          return fechaB - fechaA;
        });

        setTransacciones(ordenadas);
        setPromociones(listaPromociones);
        setServicios(listaServicios);
      } catch (err) {
        const mensaje =
          obtenerMensajeError(
            err,
            'No se pudo cargar el historial de pagos.'
          );

        setError(mensaje);
        setTransacciones([]);
        setPromociones([]);
        setServicios([]);
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const actualizar = async () => {
    setActualizando(true);
    setPaginaActual(1);

    await cargarDatos(false);
  };

  const obtenerPromocion = useCallback(
    (promocionId) =>
      promociones.find(
        (promocion) =>
          Number(promocion.id) ===
          Number(promocionId)
      ) ?? null,
    [promociones]
  );

  const obtenerServicio = useCallback(
    (servicioId) =>
      servicios.find(
        (servicio) =>
          Number(servicio.id) ===
          Number(servicioId)
      ) ?? null,
    [servicios]
  );

  const obtenerNombrePromocion = useCallback(
    (transaccion) => {
      const promocion = obtenerPromocion(
        transaccion.promocionId
      );

      return (
        promocion?.planNombre ||
        promocion?.nombrePlan ||
        'Promoción'
      );
    },
    [obtenerPromocion]
  );

  const obtenerNombreServicio = useCallback(
    (transaccion) => {
      const servicio = obtenerServicio(
        transaccion.servicioId
      );

      return (
        servicio?.titulo ||
        servicio?.nombre ||
        'Servicio'
      );
    },
    [obtenerServicio]
  );

  const transaccionesFiltradas =
    useMemo(() => {
      const texto =
        normalizarTexto(busqueda);

      return transacciones.filter(
        (transaccion) => {
          if (
            filtroEstado !== 'TODAS' &&
            transaccion?.estado !==
              filtroEstado
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const nombrePromocion =
            obtenerNombrePromocion(
              transaccion
            );

          const nombreServicio =
            obtenerNombreServicio(
              transaccion
            );

          const valores = [
            transaccion?.id,
            transaccion?.promocionId,
            transaccion?.servicioId,
            transaccion?.monto,
            transaccion?.moneda,
            transaccion?.referenciaExterna,
            transaccion?.estado,
            nombrePromocion,
            nombreServicio,
            obtenerNombreEstado(
              transaccion?.estado
            ),
            formatearMonto(
              transaccion?.monto,
              transaccion?.moneda
            ),
            formatearFecha(
              transaccion?.fecha
            ),
          ];

          return valores.some(
            (valor) =>
              normalizarTexto(
                valor
              ).includes(texto)
          );
        }
      );
    }, [
      transacciones,
      busqueda,
      filtroEstado,
      obtenerNombrePromocion,
      obtenerNombreServicio,
    ]);

  const totalPaginas = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(
          transaccionesFiltradas.length /
            ELEMENTOS_POR_PAGINA
        )
      ),
    [transaccionesFiltradas]
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda,
    filtroEstado,
  ]);

  useEffect(() => {
    if (
      paginaActual > totalPaginas
    ) {
      setPaginaActual(totalPaginas);
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);

  const transaccionesPagina =
    useMemo(() => {
      const inicio =
        (paginaActual - 1) *
        ELEMENTOS_POR_PAGINA;

      const fin =
        inicio +
        ELEMENTOS_POR_PAGINA;

      return transaccionesFiltradas.slice(
        inicio,
        fin
      );
    }, [
      transaccionesFiltradas,
      paginaActual,
    ]);

  const rangoInicio =
    transaccionesFiltradas.length === 0
      ? 0
      : (paginaActual - 1) *
          ELEMENTOS_POR_PAGINA +
        1;

  const rangoFin = Math.min(
    paginaActual *
      ELEMENTOS_POR_PAGINA,
    transaccionesFiltradas.length
  );

  const cambiarPagina = (
    nuevaPagina
  ) => {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > totalPaginas
    ) {
      return;
    }

    setPaginaActual(nuevaPagina);
  };

  const confirmarCancelacion = (
    transaccion
  ) => {
    Alert.alert(
      'Cancelar transacción',
      '¿Deseas cancelar esta transacción pendiente?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelandoId(
              transaccion.id
            );

            try {
              const actualizada =
                await transaccionPagoService
                  .cancelar(
                    transaccion.id
                  );

              setTransacciones(
                (actuales) =>
                  actuales.map(
                    (item) =>
                      item.id ===
                      actualizada.id
                        ? actualizada
                        : item
                  )
              );

              Alert.alert(
                'Transacción cancelada',
                'La transacción fue cancelada correctamente.'
              );
            } catch (err) {
              Alert.alert(
                'No se pudo cancelar',
                obtenerMensajeError(
                  err,
                  'No se pudo cancelar la transacción.'
                )
              );
            } finally {
              setCancelandoId(null);
            }
          },
        },
      ]
    );
  };

  const renderTransaccion = (
    transaccion
  ) => {
    const configuracionEstado =
      obtenerConfiguracionEstado(
        transaccion.estado
      );

    const estaCancelando =
      cancelandoId ===
      transaccion.id;

    const nombrePromocion =
      obtenerNombrePromocion(
        transaccion
      );

    const nombreServicio =
      obtenerNombreServicio(
        transaccion
      );

    return (
      <View
        key={transaccion.id}
        style={styles.tarjeta}
      >
        <View
          style={
            styles.tarjetaEncabezado
          }
        >
          <View
            style={styles.iconoPago}
          >
            <Ionicons
              name="card-outline"
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
                styles.tituloTransaccion
              }
            >
              Transacción #{transaccion.id}
            </Text>

            <Text
              style={styles.fecha}
            >
              {formatearFecha(
                transaccion.fecha
              )}
            </Text>
          </View>
        </View>

        <View
          style={styles.separador}
        />

        <View
          style={
            styles.montoContenedor
          }
        >
          <View>
            <Text
              style={
                styles.montoEtiqueta
              }
            >
              Monto
            </Text>

            <Text
              style={styles.monto}
            >
              {formatearMonto(
                transaccion.monto,
                transaccion.moneda
              )}
            </Text>
          </View>

          <View
            style={[
              styles.estadoContenedor,
              {
                backgroundColor:
                  configuracionEstado.fondo,
              },
            ]}
          >
            <Ionicons
              name={
                configuracionEstado.icono
              }
              size={15}
              color={
                configuracionEstado.color
              }
            />

            <Text
              style={[
                styles.estadoTexto,
                {
                  color:
                    configuracionEstado.color,
                },
              ]}
            >
              {obtenerNombreEstado(
                transaccion.estado
              )}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.informacionPago
          }
        >
          <View
            style={
              styles.informacionFila
            }
          >
            <View
              style={
                styles.informacionIcono
              }
            >
              <Ionicons
                name="megaphone-outline"
                size={17}
                color="#667085"
              />
            </View>

            <Text
              style={
                styles.informacionEtiqueta
              }
            >
              Promoción
            </Text>

            <Text
              style={
                styles.informacionValor
              }
              numberOfLines={2}
            >
              {nombrePromocion}
            </Text>
          </View>

          <View
            style={
              styles.informacionFila
            }
          >
            <View
              style={
                styles.informacionIcono
              }
            >
              <Ionicons
                name="briefcase-outline"
                size={17}
                color="#667085"
              />
            </View>

            <Text
              style={
                styles.informacionEtiqueta
              }
            >
              Servicio
            </Text>

            <Text
              style={
                styles.informacionValor
              }
              numberOfLines={2}
            >
              {nombreServicio}
            </Text>
          </View>

          <View
            style={
              styles.informacionFila
            }
          >
            <View
              style={
                styles.informacionIcono
              }
            >
              <Ionicons
                name="cash-outline"
                size={17}
                color="#667085"
              />
            </View>

            <Text
              style={
                styles.informacionEtiqueta
              }
            >
              Moneda
            </Text>

            <Text
              style={
                styles.informacionValor
              }
            >
              {transaccion.moneda ||
                'No disponible'}
            </Text>
          </View>

          {transaccion
            .referenciaExterna ? (
            <View
              style={
                styles.informacionFila
              }
            >
              <View
                style={
                  styles.informacionIcono
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={17}
                  color="#667085"
                />
              </View>

              <Text
                style={
                  styles.informacionEtiqueta
                }
              >
                Referencia
              </Text>

              <Text
                style={
                  styles.referenciaValor
                }
                numberOfLines={2}
              >
                {
                  transaccion
                    .referenciaExterna
                }
              </Text>
            </View>
          ) : null}
        </View>

        {transaccion.estado ===
        'PENDIENTE' ? (
          <View
            style={styles.acciones}
          >
            <Pressable
              style={[
                styles.botonCancelar,
                estaCancelando &&
                  styles.botonDeshabilitado,
              ]}
              onPress={() =>
                confirmarCancelacion(
                  transaccion
                )
              }
              disabled={
                estaCancelando
              }
            >
              {estaCancelando ? (
                <ActivityIndicator
                  size="small"
                  color="#B42318"
                />
              ) : (
                <Ionicons
                  name="close-circle-outline"
                  size={19}
                  color="#B42318"
                />
              )}

              <Text
                style={
                  styles.botonCancelarTexto
                }
              >
                {estaCancelando
                  ? 'Cancelando...'
                  : 'Cancelar transacción'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
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

          <Text
            style={
              styles.textoCarga
            }
          >
            Cargando pagos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.contenedor}
    >
      <View
        style={styles.encabezado}
      >
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
            <Text
              style={styles.titulo}
            >
              Historial de pagos
            </Text>

            <Text
              style={styles.subtitulo}
            >
              Consulta tus transacciones
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={actualizar}
          />
        }
      >
        {error ? (
          <View
            style={
              styles.errorContenedor
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />

            <Text
              style={
                styles.errorTitulo
              }
            >
              No se pudieron cargar tus pagos
            </Text>

            <Text
              style={
                styles.errorTexto
              }
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.botonReintentar
              }
              onPress={() =>
                cargarDatos()
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
        ) : transacciones.length ===
          0 ? (
          <View style={styles.vacio}>
            <View
              style={
                styles.iconoVacio
              }
            >
              <Ionicons
                name="receipt-outline"
                size={46}
                color="#2563EB"
              />
            </View>

            <Text
              style={
                styles.vacioTitulo
              }
            >
              Aún no tienes pagos
            </Text>

            <Text
              style={
                styles.vacioTexto
              }
            >
              Cuando realices el pago de una promoción, tus transacciones aparecerán aquí.
            </Text>
          </View>
        ) : (
          <>
            <View
              style={
                styles.buscador
              }
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                style={
                  styles.inputBusqueda
                }
                value={busqueda}
                onChangeText={
                  setBusqueda
                }
                placeholder="Buscar transacciones"
                placeholderTextColor="#98A2B3"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {busqueda ? (
                <Pressable
                  style={
                    styles.botonLimpiar
                  }
                  onPress={() =>
                    setBusqueda('')
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#98A2B3"
                  />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              style={
                styles.filtrosScroll
              }
              contentContainerStyle={
                styles.filtros
              }
              showsHorizontalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="always"
            >
              {FILTROS.map(
                (filtro) => {
                  const seleccionado =
                    filtroEstado ===
                    filtro.clave;

                  return (
                    <Pressable
                      key={
                        filtro.clave
                      }
                      style={[
                        styles.filtro,
                        seleccionado &&
                          styles.filtroSeleccionado,
                      ]}
                      onPress={() =>
                        setFiltroEstado(
                          filtro.clave
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filtroTexto,
                          seleccionado &&
                            styles.filtroTextoSeleccionado,
                        ]}
                      >
                        {
                          filtro.texto
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </ScrollView>

            {transaccionesFiltradas
              .length === 0 ? (
              <View
                style={
                  styles.vacioBusqueda
                }
              >
                <View
                  style={
                    styles.iconoVacio
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={42}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={
                    styles.vacioTitulo
                  }
                >
                  No encontramos resultados
                </Text>

                <Text
                  style={
                    styles.vacioTexto
                  }
                >
                  Prueba con otra búsqueda o selecciona otro estado.
                </Text>

                <Pressable
                  style={
                    styles.botonLimpiarFiltros
                  }
                  onPress={() => {
                    setBusqueda('');
                    setFiltroEstado(
                      'TODAS'
                    );
                  }}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color="#2563EB"
                  />

                  <Text
                    style={
                      styles.botonLimpiarFiltrosTexto
                    }
                  >
                    Limpiar filtros
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text
                  style={
                    styles.resultados
                  }
                >
                  {transaccionesFiltradas
                    .length === 1
                    ? '1 transacción encontrada'
                    : `${transaccionesFiltradas.length} transacciones encontradas`}
                </Text>

                {transaccionesPagina.map(
                  renderTransaccion
                )}

                {totalPaginas > 1 ? (
                  <View
                    style={
                      styles.paginacion
                    }
                  >
                    <Text
                      style={
                        styles.paginacionResumen
                      }
                    >
                      Mostrando{' '}
                      {rangoInicio}-
                      {rangoFin} de{' '}
                      {
                        transaccionesFiltradas.length
                      }
                    </Text>

                    <View
                      style={
                        styles.paginacionControles
                      }
                    >
                      <Pressable
                        style={[
                          styles.botonPagina,
                          paginaActual ===
                            1 &&
                            styles.botonPaginaDeshabilitado,
                        ]}
                        onPress={() =>
                          cambiarPagina(
                            paginaActual -
                              1
                          )
                        }
                        disabled={
                          paginaActual ===
                          1
                        }
                      >
                        <Ionicons
                          name="chevron-back"
                          size={19}
                          color={
                            paginaActual ===
                            1
                              ? '#98A2B3'
                              : '#2563EB'
                          }
                        />
                      </Pressable>

                      <View
                        style={
                          styles.numeroPagina
                        }
                      >
                        <Text
                          style={
                            styles.numeroPaginaTexto
                          }
                        >
                          {
                            paginaActual
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.totalPaginasTexto
                        }
                      >
                        de{' '}
                        {
                          totalPaginas
                        }
                      </Text>

                      <Pressable
                        style={[
                          styles.botonPagina,
                          paginaActual ===
                            totalPaginas &&
                            styles.botonPaginaDeshabilitado,
                        ]}
                        onPress={() =>
                          cambiarPagina(
                            paginaActual +
                              1
                          )
                        }
                        disabled={
                          paginaActual ===
                          totalPaginas
                        }
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={19}
                          color={
                            paginaActual ===
                            totalPaginas
                              ? '#98A2B3'
                              : '#2563EB'
                          }
                        />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </>
            )}
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
  },

  encabezadoPrincipal: {
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

  buscador: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  inputBusqueda: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: '#101828',
  },

  botonLimpiar: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filtrosScroll: {
    flexGrow: 0,
    marginTop: 13,
    marginBottom: 17,
  },

  filtros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  filtro: {
    height: 38,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filtroSeleccionado: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },

  filtroTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
  },

  filtroTextoSeleccionado: {
    color: '#2563EB',
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

  iconoPago: {
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

  tituloTransaccion: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },

  fecha: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '500',
    color: '#667085',
  },

  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 15,
  },

  montoContenedor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  montoEtiqueta: {
    fontSize: 12,
    color: '#98A2B3',
  },

  monto: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },

  estadoContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },

  estadoTexto: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '700',
  },

  informacionPago: {
    marginTop: 17,
    gap: 10,
  },

  informacionFila: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },

  informacionIcono: {
    width: 27,
    alignItems: 'flex-start',
  },

  informacionEtiqueta: {
    width: 82,
    fontSize: 12,
    color: '#98A2B3',
  },

  informacionValor: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#475467',
    textAlign: 'right',
  },

  referenciaValor: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#475467',
    textAlign: 'right',
  },

  acciones: {
    marginTop: 17,
  },

  botonCancelar: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#FECDCA',
    backgroundColor: '#FEF3F2',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  botonCancelarTexto: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#B42318',
  },

  botonDeshabilitado: {
    opacity: 0.55,
  },

  paginacion: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 14,
    padding: 14,
    marginTop: 2,
  },

  paginacionResumen: {
    fontSize: 12,
    color: '#667085',
    textAlign: 'center',
    marginBottom: 12,
  },

  paginacionControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botonPagina: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botonPaginaDeshabilitado: {
    borderColor: '#EAECF0',
    backgroundColor: '#F9FAFB',
  },

  numeroPagina: {
    minWidth: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  numeroPaginaTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  totalPaginasTexto: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
  },

  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },

  vacioBusqueda: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 55,
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
    textAlign: 'center',
  },

  vacioTexto: {
    marginTop: 8,
    color: '#667085',
    lineHeight: 20,
    textAlign: 'center',
  },

  botonLimpiarFiltros: {
    marginTop: 20,
    minHeight: 46,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botonLimpiarFiltrosTexto: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
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
    textAlign: 'center',
  },

  errorTexto: {
    marginTop: 7,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 20,
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