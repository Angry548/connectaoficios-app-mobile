import React, {
  useCallback,
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import promocionService from '../../services/promocionService';
import planPromocionService from '../../services/planPromocionService';
import transaccionPagoService from '../../services/transaccionPagoService';

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
    return 'No disponible';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const obtenerColorEstado = (estado) => {
  switch (estado) {
    case 'ACTIVA':
    case 'APROBADA':
      return {
        fondo: '#ECFDF3',
        texto: '#027A48',
        icono: 'checkmark-circle-outline',
      };

    case 'PENDIENTE':
      return {
        fondo: '#FFFAEB',
        texto: '#B54708',
        icono: 'time-outline',
      };

    case 'RECHAZADA':
    case 'CANCELADA':
      return {
        fondo: '#FEF3F2',
        texto: '#B42318',
        icono: 'close-circle-outline',
      };

    case 'FINALIZADA':
      return {
        fondo: '#F2F4F7',
        texto: '#475467',
        icono: 'flag-outline',
      };

    default:
      return {
        fondo: '#F2F4F7',
        texto: '#475467',
        icono: 'information-circle-outline',
      };
  }
};

export default function DetallePromocionScreen({
  navigation,
  route,
}) {
  const promocionId = route.params?.promocionId;
  const servicioTitulo = route.params?.servicioTitulo;

  const [promocion, setPromocion] = useState(null);
  const [plan, setPlan] = useState(null);
  const [transacciones, setTransacciones] =
    useState([]);
  const [vigente, setVigente] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [cancelando, setCancelando] =
    useState(false);
  const [error, setError] = useState('');

  const cargarDetalle = useCallback(
    async (mostrarCarga = true) => {
      if (!promocionId) {
        setError(
          'No se recibió el identificador de la promoción.'
        );
        setCargando(false);
        setActualizando(false);
        return;
      }

      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const promocionRespuesta =
          await promocionService.obtenerPorId(
            promocionId
          );

        setPromocion(promocionRespuesta);

        const [
          planRespuesta,
          transaccionesRespuesta,
          vigenteRespuesta,
        ] = await Promise.all([
          planPromocionService.obtenerPorId(
            promocionRespuesta.planId
          ),
          transaccionPagoService.obtenerPorPromocion(
            promocionId
          ),
          promocionService.estaVigente(
            promocionId
          ),
        ]);

        setPlan(planRespuesta);
        setTransacciones(
          Array.isArray(transaccionesRespuesta)
            ? transaccionesRespuesta
            : []
        );
        setVigente(Boolean(vigenteRespuesta));
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            'No se pudo cargar el detalle de la promoción.'
          )
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [promocionId]
  );

  useFocusEffect(
    useCallback(() => {
      cargarDetalle();
    }, [cargarDetalle])
  );

  const actualizar = async () => {
    setActualizando(true);
    await cargarDetalle(false);
  };

  const transaccionPendiente = transacciones.find(
    (item) => item.estado === 'PENDIENTE'
  );

  const irAPago = () => {
    if (!promocion || !plan) {
      Alert.alert(
        'No se puede continuar',
        'No se pudo obtener la información necesaria para activar la promoción.'
      );
      return;
    }

    navigation.navigate('PagoPromocion', {
      promocionId: promocion.id,
      servicioTitulo:
        servicioTitulo ||
        `Servicio #${promocion.servicioId}`,
      planNombre:
        plan.nombre ||
        promocion.planNombre ||
        'Plan',
      duracionDias: plan.duracionDias,
      costoTotal: plan.precio,
    });
  };

  const cancelarTransaccion = () => {
    if (!transaccionPendiente) {
      return;
    }

    Alert.alert(
      'Cancelar transacción',
      'La transacción pendiente será cancelada y la promoción dejará de continuar con el proceso.',
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Cancelar transacción',
          style: 'destructive',
          onPress: async () => {
            setCancelando(true);

            try {
              await transaccionPagoService.cancelar(
                transaccionPendiente.id
              );

              Alert.alert(
                'Transacción cancelada',
                'La transacción fue cancelada correctamente.'
              );

              await cargarDetalle(false);
            } catch (err) {
              Alert.alert(
                'No se pudo cancelar',
                obtenerMensajeError(
                  err,
                  'No se pudo cancelar la transacción.'
                )
              );
            } finally {
              setCancelando(false);
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />

          <Text style={styles.textoCarga}>
            Cargando promoción...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const colorPromocion = obtenerColorEstado(
    promocion?.estado
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
            size={23}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            Detalle de promoción
          </Text>

          <Text style={styles.subtitulo}>
            Promoción #{promocionId}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorCaja}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color="#B42318"
            />

            <View style={styles.flex}>
              <Text style={styles.errorTitulo}>
                No se pudo cargar la promoción
              </Text>

              <Text style={styles.errorTexto}>
                {error}
              </Text>

              <Pressable
                style={styles.reintentar}
                onPress={() => cargarDetalle()}
              >
                <Text style={styles.reintentarTexto}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          </View>
        ) : promocion ? (
          <>
            <View style={styles.tarjetaPrincipal}>
              <View style={styles.iconoPrincipal}>
                <Ionicons
                  name="megaphone-outline"
                  size={30}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.nombrePlan}>
                {promocion.planNombre ||
                  plan?.nombre ||
                  'Promoción'}
              </Text>

              <Text style={styles.servicio}>
                {servicioTitulo ||
                  `Servicio #${promocion.servicioId}`}
              </Text>

              <View
                style={[
                  styles.estadoGrande,
                  {
                    backgroundColor:
                      colorPromocion.fondo,
                  },
                ]}
              >
                <Ionicons
                  name={colorPromocion.icono}
                  size={18}
                  color={colorPromocion.texto}
                />

                <Text
                  style={[
                    styles.estadoGrandeTexto,
                    {
                      color:
                        colorPromocion.texto,
                    },
                  ]}
                >
                  {obtenerNombreEstado(
                    promocion.estado
                  )}
                </Text>
              </View>

              {promocion.estado === 'ACTIVA' ? (
                <View style={styles.vigencia}>
                  <View
                    style={[
                      styles.puntoVigencia,
                      {
                        backgroundColor: vigente
                          ? '#12B76A'
                          : '#98A2B3',
                      },
                    ]}
                  />

                  <Text style={styles.vigenciaTexto}>
                    {vigente
                      ? 'Promoción vigente'
                      : 'Promoción no vigente'}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.seccionTitulo}>
              Plan contratado
            </Text>

            <View style={styles.tarjeta}>
              <View style={styles.filaIcono}>
                <View style={styles.iconoDato}>
                  <Ionicons
                    name="rocket-outline"
                    size={20}
                    color="#2563EB"
                  />
                </View>

                <View style={styles.flex}>
                  <Text style={styles.datoEtiqueta}>
                    Plan
                  </Text>

                  <Text style={styles.datoValor}>
                    {plan?.nombre ||
                      promocion.planNombre ||
                      'No disponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              <View style={styles.datosDobles}>
                <View style={styles.datoDoble}>
                  <Text style={styles.datoEtiqueta}>
                    Duración
                  </Text>

                  <Text style={styles.datoValor}>
                    {plan?.duracionDias
                      ? `${plan.duracionDias} días`
                      : 'No disponible'}
                  </Text>
                </View>

                <View style={styles.datoDoble}>
                  <Text style={styles.datoEtiqueta}>
                    Precio
                  </Text>

                  <Text style={styles.precio}>
                    {plan
                      ? `$${Number(
                          plan.precio
                        ).toFixed(2)}`
                      : 'No disponible'}
                  </Text>
                </View>
              </View>

              {plan?.descripcion ? (
                <>
                  <View style={styles.divisor} />

                  <Text style={styles.datoEtiqueta}>
                    Descripción
                  </Text>

                  <Text style={styles.descripcion}>
                    {plan.descripcion}
                  </Text>
                </>
              ) : null}
            </View>

            <Text style={styles.seccionTitulo}>
              Vigencia
            </Text>

            <View style={styles.tarjeta}>
              <View style={styles.filaDato}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#667085"
                />

                <View style={styles.flex}>
                  <Text style={styles.datoEtiqueta}>
                    Fecha de creación
                  </Text>

                  <Text style={styles.datoValor}>
                    {formatearFecha(
                      promocion.fechaCreacion
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              <View style={styles.filaDato}>
                <Ionicons
                  name="play-circle-outline"
                  size={20}
                  color="#667085"
                />

                <View style={styles.flex}>
                  <Text style={styles.datoEtiqueta}>
                    Fecha de inicio
                  </Text>

                  <Text style={styles.datoValor}>
                    {formatearFecha(
                      promocion.fechaInicio
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              <View style={styles.filaDato}>
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color="#667085"
                />

                <View style={styles.flex}>
                  <Text style={styles.datoEtiqueta}>
                    Fecha de finalización
                  </Text>

                  <Text style={styles.datoValor}>
                    {formatearFecha(
                      promocion.fechaFin
                    )}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.seccionTituloFila}>
              <Text style={styles.seccionTituloSinMargen}>
                Transacciones
              </Text>

              <Text style={styles.contador}>
                {transacciones.length}
              </Text>
            </View>

            {transacciones.length === 0 ? (
              <View style={styles.vacio}>
                <Ionicons
                  name="card-outline"
                  size={30}
                  color="#667085"
                />

                <Text style={styles.vacioTitulo}>
                  Sin transacciones
                </Text>

                <Text style={styles.vacioTexto}>
                  No hay transacciones registradas para
                  esta promoción.
                </Text>
              </View>
            ) : (
              transacciones.map((transaccion) => {
                const colorTransaccion =
                  obtenerColorEstado(
                    transaccion.estado
                  );

                return (
                  <View
                    key={transaccion.id}
                    style={styles.tarjetaTransaccion}
                  >
                    <View
                      style={
                        styles.transaccionSuperior
                      }
                    >
                      <View
                        style={
                          styles.iconoTransaccion
                        }
                      >
                        <Ionicons
                          name="card-outline"
                          size={21}
                          color="#2563EB"
                        />
                      </View>

                      <View style={styles.flex}>
                        <Text
                          style={
                            styles.transaccionTitulo
                          }
                        >
                          Transacción #{transaccion.id}
                        </Text>

                        <Text
                          style={
                            styles.transaccionFecha
                          }
                        >
                          {formatearFecha(
                            transaccion.fecha
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.estadoPequeno,
                          {
                            backgroundColor:
                              colorTransaccion.fondo,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.estadoPequenoTexto,
                            {
                              color:
                                colorTransaccion.texto,
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
                        styles.transaccionImporte
                      }
                    >
                      <Text
                        style={
                          styles.transaccionImporteEtiqueta
                        }
                      >
                        Importe
                      </Text>

                      <Text
                        style={
                          styles.transaccionImporteValor
                        }
                      >
                        $
                        {Number(
                          transaccion.monto
                        ).toFixed(2)}{' '}
                        {transaccion.moneda}
                      </Text>
                    </View>

                    {transaccion.referenciaExterna ? (
                      <View
                        style={
                          styles.referenciaCaja
                        }
                      >
                        <Text
                          style={
                            styles.referenciaEtiqueta
                          }
                        >
                          Referencia
                        </Text>

                        <Text
                          style={
                            styles.referenciaValor
                          }
                        >
                          {
                            transaccion.referenciaExterna
                          }
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}

            {promocion.estado === 'PENDIENTE' ? (
              <Pressable
                style={styles.botonActivar}
                onPress={irAPago}
              >
                <Ionicons
                  name="card-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.botonActivarTexto}>
                  Activar promoción
                </Text>
              </Pressable>
            ) : null}

            {transaccionPendiente ? (
              <Pressable
                style={[
                  styles.botonCancelar,
                  cancelando &&
                    styles.botonDeshabilitado,
                ]}
                disabled={cancelando}
                onPress={cancelarTransaccion}
              >
                {cancelando ? (
                  <ActivityIndicator
                    color="#B42318"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color="#B42318"
                    />

                    <Text
                      style={
                        styles.botonCancelarTexto
                      }
                    >
                      Cancelar transacción pendiente
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}

            {promocion.estado === 'PENDIENTE' ? (
              <View style={styles.informacion}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#175CD3"
                />

                <Text style={styles.informacionTexto}>
                  Para activar esta promoción debes
                  completar el pago simulado. No se
                  realizará ningún cobro real.
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
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

  scroll: {
    flex: 1,
  },

  contenido: {
    padding: 20,
    paddingBottom: 36,
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

  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 22,
  },

  iconoPrincipal: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  nombrePlan: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 19,
    textAlign: 'center',
  },

  servicio: {
    color: '#667085',
    fontSize: 13,
    marginTop: 5,
  },

  estadoGrande: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },

  estadoGrandeTexto: {
    fontSize: 12,
    fontWeight: '700',
  },

  vigencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },

  puntoVigencia: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  vigenciaTexto: {
    color: '#475467',
    fontSize: 12,
  },

  seccionTitulo: {
    color: '#101828',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 11,
  },

  seccionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
    marginTop: 4,
  },

  seccionTituloSinMargen: {
    flex: 1,
    color: '#101828',
    fontWeight: '700',
    fontSize: 16,
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
    fontWeight: '700',
    fontSize: 12,
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },

  filaIcono: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoDato: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  datoEtiqueta: {
    color: '#667085',
    fontSize: 12,
    marginBottom: 3,
  },

  datoValor: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '600',
  },

  datosDobles: {
    flexDirection: 'row',
    gap: 12,
  },

  datoDoble: {
    flex: 1,
  },

  precio: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 16,
  },

  descripcion: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 20,
  },

  divisor: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 14,
  },

  tarjetaTransaccion: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  transaccionSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoTransaccion: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  transaccionTitulo: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '700',
  },

  transaccionFecha: {
    color: '#667085',
    fontSize: 11,
    marginTop: 3,
  },

  estadoPequeno: {
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  estadoPequenoTexto: {
    fontSize: 9,
    fontWeight: '700',
  },

  transaccionImporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  transaccionImporteEtiqueta: {
    color: '#667085',
    fontSize: 13,
  },

  transaccionImporteValor: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '700',
  },

  referenciaCaja: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },

  referenciaEtiqueta: {
    color: '#667085',
    fontSize: 11,
  },

  referenciaValor: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  vacio: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },

  vacioTitulo: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },

  vacioTexto: {
    color: '#667085',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },

  botonActivar: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 12,
  },

  botonActivarTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  botonCancelar: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FDA29B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },

  botonCancelarTexto: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },

  botonDeshabilitado: {
    opacity: 0.5,
  },

  informacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF8FF',
    borderWidth: 1,
    borderColor: '#B2DDFF',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
  },

  informacionTexto: {
    flex: 1,
    color: '#175CD3',
    fontSize: 12,
    lineHeight: 18,
  },

  errorCaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 14,
    padding: 14,
  },

  errorTitulo: {
    color: '#B42318',
    fontWeight: '700',
    fontSize: 14,
  },

  errorTexto: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  reintentar: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  reintentarTexto: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
  },
});