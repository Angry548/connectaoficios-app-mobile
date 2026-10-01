import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
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
import promocionService from '../../services/promocionService';
import planPromocionService from '../../services/planPromocionService';
import transaccionPagoService from '../../services/transaccionPagoService';
import { servicioService } from '../../services/servicioService';

const ESTADOS = [
  'TODAS',
  'PENDIENTE',
  'ACTIVA',
  'FINALIZADA',
  'CANCELADA',
];

const obtenerMensajeError = (
  error,
  mensajePredeterminado
) =>
  error?.response?.data?.message ||
  error?.response?.data?.mensaje ||
  error?.response?.data?.error ||
  error?.message ||
  mensajePredeterminado;

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

const formatearFecha = (fecha) => {
  if (!fecha) {
    return 'Pendiente';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const obtenerTituloServicio = (servicioId, servicios) => {
  const servicio = servicios.find(
    (item) => Number(item.id) === Number(servicioId)
  );

  return servicio?.titulo || `Servicio #${servicioId}`;
};

const obtenerColorEstado = (estado) => {
  switch (estado) {
    case 'ACTIVA':
      return {
        fondo: '#ECFDF3',
        texto: '#027A48',
      };

    case 'PENDIENTE':
      return {
        fondo: '#FFFAEB',
        texto: '#B54708',
      };

    case 'FINALIZADA':
      return {
        fondo: '#F2F4F7',
        texto: '#475467',
      };

    case 'CANCELADA':
      return {
        fondo: '#FEF3F2',
        texto: '#B42318',
      };

    default:
      return {
        fondo: '#F2F4F7',
        texto: '#475467',
      };
  }
};

export default function PromocionesScreen({
  navigation,
}) {
  const [promociones, setPromociones] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [error, setError] = useState('');

  const [busquedaPromociones, setBusquedaPromociones] =
    useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState('TODAS');

  const [mostrarCreacion, setMostrarCreacion] =
    useState(false);

  const [servicioSeleccionado, setServicioSeleccionado] =
    useState(null);

  const [textoPlan, setTextoPlan] = useState('');
  const [planes, setPlanes] = useState([]);
  const [planSeleccionado, setPlanSeleccionado] =
    useState(null);

  const [buscandoPlanes, setBuscandoPlanes] =
    useState(false);
  const [errorPlanes, setErrorPlanes] = useState('');
  const [resumen, setResumen] = useState(null);
  const [cargandoResumen, setCargandoResumen] =
    useState(false);
  const [procesando, setProcesando] = useState(false);

  const [alturaTeclado, setAlturaTeclado] = useState(0);

  const solicitudBusquedaRef = useRef(0);

  useEffect(() => {
    const mostrar = Keyboard.addListener(
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow',
      (event) => {
        setAlturaTeclado(
          event?.endCoordinates?.height ?? 0
        );
      }
    );

    const ocultar = Keyboard.addListener(
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide',
      () => {
        setAlturaTeclado(0);
      }
    );

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  const cargarDatos = useCallback(
  async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargando(true);
    }

    setError('');

    try {
      const [
        promocionesRespuesta,
        serviciosRespuesta,
      ] = await Promise.all([
        promocionService.obtenerMisPromociones(),
        servicioService.listarMisServicios(),
      ]);

      setPromociones(
        Array.isArray(promocionesRespuesta)
          ? promocionesRespuesta
          : []
      );

      const listaServicios =
        Array.isArray(serviciosRespuesta)
          ? serviciosRespuesta
          : Array.isArray(serviciosRespuesta?.servicios)
            ? serviciosRespuesta.servicios
            : Array.isArray(serviciosRespuesta?.content)
              ? serviciosRespuesta.content
              : [];

      setServicios(listaServicios);
    } catch (err) {
      setError(
        obtenerMensajeError(
          err,
          'No se pudieron cargar las promociones.'
        )
      );
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

      return () => {
        solicitudBusquedaRef.current += 1;
      };
    }, [cargarDatos])
  );

  useEffect(() => {
    if (!mostrarCreacion) {
      return undefined;
    }

    const texto = textoPlan.trim();

    if (texto.length === 0) {
      const numeroSolicitud =
        ++solicitudBusquedaRef.current;

      setBuscandoPlanes(true);
      setErrorPlanes('');

      const controller = new AbortController();

      planPromocionService
        .obtenerActivos(
          0,
          10,
          {
            signal: controller.signal,
          }
        )
        .then((respuesta) => {
          if (
            numeroSolicitud ===
            solicitudBusquedaRef.current
          ) {
            setPlanes(respuesta.planes ?? []);
          }
        })
        .catch((err) => {
          if (
            err?.name !== 'CanceledError' &&
            err?.code !== 'ERR_CANCELED' &&
            numeroSolicitud ===
              solicitudBusquedaRef.current
          ) {
            setErrorPlanes(
              obtenerMensajeError(
                err,
                'No se pudieron cargar los planes.'
              )
            );
            setPlanes([]);
          }
        })
        .finally(() => {
          if (
            numeroSolicitud ===
            solicitudBusquedaRef.current
          ) {
            setBuscandoPlanes(false);
          }
        });

      return () => {
        controller.abort();
      };
    }

    if (texto.length < 2) {
      solicitudBusquedaRef.current += 1;
      setPlanes([]);
      setBuscandoPlanes(false);
      setErrorPlanes('');
      return undefined;
    }

    const controller = new AbortController();

    const temporizador = setTimeout(async () => {
      const numeroSolicitud =
        ++solicitudBusquedaRef.current;

      setBuscandoPlanes(true);
      setErrorPlanes('');

      try {
        const respuesta =
          await planPromocionService.buscar(
            texto,
            0,
            10,
            {
              signal: controller.signal,
            }
          );

        if (
          numeroSolicitud ===
          solicitudBusquedaRef.current
        ) {
          setPlanes(respuesta.planes ?? []);
        }
      } catch (err) {
        if (
          err?.name !== 'CanceledError' &&
          err?.code !== 'ERR_CANCELED' &&
          numeroSolicitud ===
            solicitudBusquedaRef.current
        ) {
          setErrorPlanes(
            obtenerMensajeError(
              err,
              'No se pudieron buscar los planes.'
            )
          );
          setPlanes([]);
        }
      } finally {
        if (
          numeroSolicitud ===
          solicitudBusquedaRef.current
        ) {
          setBuscandoPlanes(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(temporizador);
      controller.abort();
    };
  }, [textoPlan, mostrarCreacion]);

  useEffect(() => {
    if (
      !servicioSeleccionado?.id ||
      !planSeleccionado?.id
    ) {
      setResumen(null);
      return undefined;
    }

    const controller = new AbortController();

    const cargarResumen = async () => {
      setCargandoResumen(true);

      try {
        const resultado =
          await promocionService.obtenerResumen(
            servicioSeleccionado.id,
            planSeleccionado.id,
            {
              signal: controller.signal,
            }
          );

        setResumen(resultado);
      } catch (err) {
        if (
          err?.name !== 'CanceledError' &&
          err?.code !== 'ERR_CANCELED'
        ) {
          setResumen(null);

          Alert.alert(
            'No se pudo obtener el resumen',
            obtenerMensajeError(
              err,
              'No se pudo calcular el resumen de la promoción.'
            )
          );
        }
      } finally {
        setCargandoResumen(false);
      }
    };

    cargarResumen();

    return () => {
      controller.abort();
    };
  }, [
    servicioSeleccionado,
    planSeleccionado,
  ]);

  const actualizar = async () => {
    setActualizando(true);
    await cargarDatos(false);
  };

  const abrirCreacion = () => {
    setMostrarCreacion(true);
    setServicioSeleccionado(null);
    setPlanSeleccionado(null);
    setTextoPlan('');
    setPlanes([]);
    setResumen(null);
    setErrorPlanes('');
  };

  const cerrarCreacion = () => {
    Keyboard.dismiss();
    solicitudBusquedaRef.current += 1;

    setMostrarCreacion(false);
    setServicioSeleccionado(null);
    setPlanSeleccionado(null);
    setTextoPlan('');
    setPlanes([]);
    setResumen(null);
    setErrorPlanes('');
  };

  const seleccionarPlan = (plan) => {
    setPlanSeleccionado(plan);
    setTextoPlan(plan.nombre);
    setPlanes([]);
    Keyboard.dismiss();
  };

  const crearPromocion = async () => {
    if (!servicioSeleccionado?.id) {
      Alert.alert(
        'Servicio requerido',
        'Selecciona el servicio que deseas promocionar.'
      );
      return;
    }

    if (!planSeleccionado?.id) {
      Alert.alert(
        'Plan requerido',
        'Selecciona un plan de promoción.'
      );
      return;
    }

    if (!resumen) {
      Alert.alert(
        'Resumen no disponible',
        'Espera a que se cargue el resumen de la promoción.'
      );
      return;
    }

    Alert.alert(
      'Confirmar promoción',
      `Se creará la promoción "${resumen.planNombre}" para "${resumen.servicioTitulo}" por $${Number(
        resumen.costoTotal
      ).toFixed(2)} USD.`,
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Continuar',
          onPress: async () => {
            setProcesando(true);

            try {
              const promocion =
                await promocionService.crear(
                  servicioSeleccionado.id,
                  planSeleccionado.id
                );

              await transaccionPagoService.crear(
                promocion.id,
                resumen.costoTotal,
                'USD'
              );

              Alert.alert(
                'Solicitud registrada',
                'La promoción y su transacción fueron registradas. La promoción permanecerá pendiente hasta que la transacción sea aprobada.'
              );

              cerrarCreacion();
              await cargarDatos(false);
            } catch (err) {
              Alert.alert(
                'No se pudo crear la promoción',
                obtenerMensajeError(
                  err,
                  'Ocurrió un error al registrar la promoción.'
                )
              );

              await cargarDatos(false);
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  const promocionesFiltradas = promociones.filter(
    (promocion) => {
      if (
        estadoSeleccionado !== 'TODAS' &&
        promocion.estado !== estadoSeleccionado
      ) {
        return false;
      }

      const texto =
        busquedaPromociones
          .trim()
          .toLowerCase();

      if (!texto) {
        return true;
      }

      return [
  promocion.planNombre,
  promocion.estado,
  promocion.servicioId?.toString(),
  obtenerTituloServicio(
    promocion.servicioId,
    servicios
  ),
].some((valor) =>
  valor
    ?.toString()
    .toLowerCase()
    .includes(texto)
);
    }
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />

          <Text style={styles.textoCarga}>
            Cargando promociones...
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
              Promociones
            </Text>

            <Text style={styles.subtitulo}>
              Promociona tus servicios
            </Text>
          </View>

          <Pressable
            style={styles.botonAgregar}
            onPress={abrirCreacion}
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contenido,
          {
            paddingBottom:
              alturaTeclado > 0
                ? alturaTeclado + 24
                : 32,
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
      >
        {mostrarCreacion ? (
          <View style={styles.tarjetaCreacion}>
            <View style={styles.tituloCreacionFila}>
              <View style={styles.iconoCreacion}>
                <Ionicons
                  name="megaphone-outline"
                  size={22}
                  color="#2563EB"
                />
              </View>

              <View style={styles.flex}>
                <Text style={styles.tituloTarjeta}>
                  Nueva promoción
                </Text>

                <Text style={styles.descripcionTarjeta}>
                  Selecciona un servicio y un plan
                </Text>
              </View>

              <Pressable
                style={styles.botonCerrar}
                onPress={cerrarCreacion}
                disabled={procesando}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#475467"
                />
              </Pressable>
            </View>

            <Text style={styles.etiqueta}>
              Servicio
            </Text>

            {servicios.length === 0 ? (
              <View style={styles.aviso}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#475467"
                />

                <Text style={styles.avisoTexto}>
                  No tienes servicios disponibles para
                  seleccionar.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  styles.listaHorizontal
                }
              >
                {servicios.map((servicio) => {
                  const seleccionado =
                    Number(
                      servicioSeleccionado?.id
                    ) === Number(servicio.id);

                  return (
                    <Pressable
                      key={servicio.id}
                      style={[
                        styles.opcionServicio,
                        seleccionado &&
                          styles.opcionServicioActiva,
                      ]}
                      onPress={() => {
                        setServicioSeleccionado(
                          servicio
                        );
                      }}
                    >
                      <Ionicons
                        name={
                          seleccionado
                            ? 'checkmark-circle'
                            : 'briefcase-outline'
                        }
                        size={19}
                        color={
                          seleccionado
                            ? '#FFFFFF'
                            : '#344054'
                        }
                      />

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.opcionServicioTexto,
                          seleccionado &&
                            styles.opcionServicioTextoActivo,
                        ]}
                      >
                        {servicio.titulo ??
                          `Servicio #${servicio.id}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Text style={styles.etiqueta}>
              Plan de promoción
            </Text>

            <View style={styles.buscador}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                style={styles.inputBuscador}
                value={textoPlan}
                onChangeText={(valor) => {
                  setTextoPlan(valor);

                  if (
                    planSeleccionado &&
                    valor !== planSeleccionado.nombre
                  ) {
                    setPlanSeleccionado(null);
                    setResumen(null);
                  }
                }}
                placeholder="Buscar plan..."
                placeholderTextColor="#98A2B3"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {buscandoPlanes ? (
                <ActivityIndicator size="small" />
              ) : textoPlan.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setTextoPlan('');
                    setPlanSeleccionado(null);
                    setResumen(null);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#98A2B3"
                  />
                </Pressable>
              ) : null}
            </View>

            {textoPlan.length === 1 ? (
              <Text style={styles.ayudaBusqueda}>
                Escribe al menos 2 caracteres para buscar.
              </Text>
            ) : null}

            {errorPlanes ? (
              <View style={styles.errorCaja}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#B42318"
                />

                <Text style={styles.errorTexto}>
                  {errorPlanes}
                </Text>
              </View>
            ) : null}

            {planes.length > 0 ? (
              <View style={styles.resultadosPlanes}>
                {planes.map((plan) => (
                  <Pressable
                    key={plan.id}
                    style={styles.planResultado}
                    onPress={() =>
                      seleccionarPlan(plan)
                    }
                  >
                    <View style={styles.planIcono}>
                      <Ionicons
                        name="rocket-outline"
                        size={20}
                        color="#2563EB"
                      />
                    </View>

                    <View style={styles.flex}>
                      <Text style={styles.planNombre}>
                        {plan.nombre}
                      </Text>

                      <Text style={styles.planDescripcion}>
                        {plan.duracionDias} días
                      </Text>
                    </View>

                    <Text style={styles.planPrecio}>
                      ${plan.precio.toFixed(2)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {planSeleccionado ? (
              <View style={styles.planSeleccionado}>
                <View style={styles.planSeleccionadoSuperior}>
                  <View style={styles.flex}>
                    <Text
                      style={
                        styles.planSeleccionadoNombre
                      }
                    >
                      {planSeleccionado.nombre}
                    </Text>

                    <Text
                      style={
                        styles.planSeleccionadoDescripcion
                      }
                    >
                      {planSeleccionado.descripcion ||
                        'Plan de promoción'}
                    </Text>
                  </View>

                  <Ionicons
                    name="checkmark-circle"
                    size={25}
                    color="#12B76A"
                  />
                </View>

                <View style={styles.planDatos}>
                  <View style={styles.planDato}>
                    <Text
                      style={styles.planDatoEtiqueta}
                    >
                      Duración
                    </Text>

                    <Text style={styles.planDatoValor}>
                      {planSeleccionado.duracionDias}{' '}
                      días
                    </Text>
                  </View>

                  <View style={styles.planDato}>
                    <Text
                      style={styles.planDatoEtiqueta}
                    >
                      Precio
                    </Text>

                    <Text style={styles.planDatoValor}>
                      $
                      {planSeleccionado.precio.toFixed(
                        2
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {cargandoResumen ? (
              <View style={styles.resumenCargando}>
                <ActivityIndicator size="small" />

                <Text style={styles.resumenCargandoTexto}>
                  Calculando resumen...
                </Text>
              </View>
            ) : resumen ? (
              <View style={styles.resumen}>
                <Text style={styles.resumenTitulo}>
                  Resumen
                </Text>

                <View style={styles.filaResumen}>
                  <Text style={styles.resumenEtiqueta}>
                    Servicio
                  </Text>

                  <Text style={styles.resumenValor}>
                    {resumen.servicioTitulo}
                  </Text>
                </View>

                <View style={styles.filaResumen}>
                  <Text style={styles.resumenEtiqueta}>
                    Plan
                  </Text>

                  <Text style={styles.resumenValor}>
                    {resumen.planNombre}
                  </Text>
                </View>

                <View style={styles.filaResumen}>
                  <Text style={styles.resumenEtiqueta}>
                    Duración
                  </Text>

                  <Text style={styles.resumenValor}>
                    {resumen.duracionDias} días
                  </Text>
                </View>

                <View style={styles.separador} />

                <View style={styles.filaResumen}>
                  <Text style={styles.totalEtiqueta}>
                    Total
                  </Text>

                  <Text style={styles.totalValor}>
                    $
                    {Number(
                      resumen.costoTotal
                    ).toFixed(2)}{' '}
                    USD
                  </Text>
                </View>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.botonPrincipal,
                (!servicioSeleccionado ||
                  !planSeleccionado ||
                  !resumen ||
                  procesando) &&
                  styles.botonDeshabilitado,
              ]}
              disabled={
                !servicioSeleccionado ||
                !planSeleccionado ||
                !resumen ||
                procesando
              }
              onPress={crearPromocion}
            >
              {procesando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="rocket-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.botonPrincipalTexto
                    }
                  >
                    Solicitar promoción
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.buscadorPrincipal}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#667085"
          />

          <TextInput
            style={styles.inputBuscador}
            value={busquedaPromociones}
            onChangeText={setBusquedaPromociones}
            placeholder="Buscar promociones..."
            placeholderTextColor="#98A2B3"
          />

          {busquedaPromociones ? (
            <Pressable
              onPress={() =>
                setBusquedaPromociones('')
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
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
        >
          {ESTADOS.map((estado) => {
            const seleccionado =
              estadoSeleccionado === estado;

            return (
              <Pressable
                key={estado}
                style={[
                  styles.filtro,
                  seleccionado &&
                    styles.filtroSeleccionado,
                ]}
                onPress={() =>
                  setEstadoSeleccionado(estado)
                }
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    seleccionado &&
                      styles.filtroTextoSeleccionado,
                  ]}
                >
                  {estado === 'TODAS'
                    ? 'Todas'
                    : obtenerNombreEstado(estado)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorCaja}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#B42318"
            />

            <View style={styles.flex}>
              <Text style={styles.errorTitulo}>
                No se pudieron cargar tus promociones
              </Text>

              <Text style={styles.errorTexto}>
                {error}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.seccionTituloFila}>
          <Text style={styles.seccionTitulo}>
            Mis promociones
          </Text>

          <Text style={styles.contador}>
            {promocionesFiltradas.length}
          </Text>
        </View>

        {promocionesFiltradas.length === 0 ? (
          <View style={styles.vacio}>
            <View style={styles.vacioIcono}>
              <Ionicons
                name="megaphone-outline"
                size={32}
                color="#667085"
              />
            </View>

            <Text style={styles.vacioTitulo}>
              No hay promociones
            </Text>

            <Text style={styles.vacioTexto}>
              {promociones.length === 0
                ? 'Cuando promociones un servicio aparecerá aquí.'
                : 'No hay promociones que coincidan con los filtros seleccionados.'}
            </Text>

            {promociones.length === 0 ? (
              <Pressable
                style={styles.botonVacio}
                onPress={abrirCreacion}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.botonVacioTexto}>
                  Crear promoción
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          promocionesFiltradas.map((promocion) => {
            const color = obtenerColorEstado(
              promocion.estado
            );

            return (
              <Pressable
                key={promocion.id}
                style={styles.tarjeta}
                onPress={() =>
  navigation.navigate(
    'DetallePromocion',
    {
      promocionId: promocion.id,
      servicioTitulo:
        obtenerTituloServicio(
          promocion.servicioId,
          servicios
        ),
    }
  )
}
              >
                <View style={styles.tarjetaSuperior}>
                  <View style={styles.iconoTarjeta}>
                    <Ionicons
                      name="megaphone-outline"
                      size={22}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.flex}>
                    <Text style={styles.tarjetaTitulo}>
                      {promocion.planNombre ||
                        `Promoción #${promocion.id}`}
                    </Text>

                    <Text
  style={
    styles.tarjetaSubtitulo
  }
>
  {obtenerTituloServicio(
    promocion.servicioId,
    servicios
  )}
</Text>
                  </View>

                  <View
                    style={[
                      styles.estado,
                      {
                        backgroundColor:
                          color.fondo,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.estadoTexto,
                        {
                          color: color.texto,
                        },
                      ]}
                    >
                      {obtenerNombreEstado(
                        promocion.estado
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.tarjetaDatos}>
                  <View style={styles.datoFila}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#667085"
                    />

                    <Text style={styles.datoTexto}>
                      Creada:{' '}
                      {formatearFecha(
                        promocion.fechaCreacion
                      )}
                    </Text>
                  </View>

                  {promocion.fechaInicio ? (
                    <View style={styles.datoFila}>
                      <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color="#667085"
                      />

                      <Text style={styles.datoTexto}>
                        Inicio:{' '}
                        {formatearFecha(
                          promocion.fechaInicio
                        )}
                      </Text>
                    </View>
                  ) : null}

                  {promocion.fechaFin ? (
                    <View style={styles.datoFila}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color="#667085"
                      />

                      <Text style={styles.datoTexto}>
                        Fin:{' '}
                        {formatearFecha(
                          promocion.fechaFin
                        )}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.tarjetaPie}>
                  <Text style={styles.verDetalle}>
                    Ver detalle
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#2563EB"
                  />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  encabezadoPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  encabezadoTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    fontSize: 13,
    color: '#667085',
    marginTop: 2,
  },
  botonAgregar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 20,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarga: {
    marginTop: 12,
    fontSize: 14,
    color: '#667085',
  },
  flex: {
    flex: 1,
  },
  tarjetaCreacion: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  tituloCreacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconoCreacion: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tituloTarjeta: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  descripcionTarjeta: {
    fontSize: 13,
    color: '#667085',
    marginTop: 3,
  },
  botonCerrar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    marginBottom: 9,
    marginTop: 4,
  },
  listaHorizontal: {
    paddingBottom: 16,
    gap: 8,
  },
  opcionServicio: {
    maxWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  opcionServicioActiva: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  opcionServicioTexto: {
    maxWidth: 160,
    fontSize: 13,
    fontWeight: '600',
    color: '#344054',
  },
  opcionServicioTextoActivo: {
    color: '#FFFFFF',
  },
  buscador: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 6,
  },
  buscadorPrincipal: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  inputBuscador: {
    flex: 1,
    color: '#101828',
    fontSize: 15,
    paddingHorizontal: 9,
    paddingVertical: 11,
  },
  ayudaBusqueda: {
    color: '#667085',
    fontSize: 12,
    marginBottom: 10,
  },
  resultadosPlanes: {
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 14,
  },
  planResultado: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  planIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  planNombre: {
    color: '#101828',
    fontWeight: '600',
    fontSize: 14,
  },
  planDescripcion: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
  },
  planPrecio: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 14,
  },
  planSeleccionado: {
    borderWidth: 1,
    borderColor: '#B2DDFF',
    backgroundColor: '#EFF8FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  planSeleccionadoSuperior: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planSeleccionadoNombre: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 15,
  },
  planSeleccionadoDescripcion: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    paddingRight: 10,
  },
  planDatos: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  planDato: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  planDatoEtiqueta: {
    color: '#667085',
    fontSize: 11,
  },
  planDatoValor: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 3,
  },
  resumenCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
  },
  resumenCargandoTexto: {
    color: '#667085',
    fontSize: 13,
  },
  resumen: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  resumenTitulo: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 9,
  },
  resumenEtiqueta: {
    color: '#667085',
    fontSize: 13,
  },
  resumenValor: {
    flex: 1,
    textAlign: 'right',
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 4,
    marginBottom: 12,
  },
  totalEtiqueta: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '700',
  },
  totalValor: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
  },
  botonPrincipal: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  botonPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  avisoTexto: {
    flex: 1,
    color: '#475467',
    fontSize: 13,
    lineHeight: 18,
  },
  filtros: {
    gap: 8,
    paddingBottom: 18,
  },
  filtro: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  filtroSeleccionado: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filtroTexto: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '600',
  },
  filtroTextoSeleccionado: {
    color: '#2563EB',
  },
  errorCaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 13,
    padding: 13,
    marginBottom: 16,
  },
  errorTitulo: {
    color: '#B42318',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  errorTexto: {
    flex: 1,
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
  },
  seccionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  seccionTitulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  contador: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 12,
    fontWeight: '700',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  tarjetaSuperior: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconoTarjeta: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  tarjetaTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    paddingRight: 6,
  },
  tarjetaSubtitulo: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
  },
  estado: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  estadoTexto: {
    fontSize: 10,
    fontWeight: '700',
  },
  tarjetaDatos: {
    marginTop: 14,
    gap: 8,
  },
  datoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datoTexto: {
    color: '#475467',
    fontSize: 13,
  },
  tarjetaPie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    marginTop: 14,
    paddingTop: 12,
  },
  verDetalle: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  vacio: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: 'center',
  },
  vacioIcono: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  vacioTitulo: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 16,
  },
  vacioTexto: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  botonVacio: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  botonVacioTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});