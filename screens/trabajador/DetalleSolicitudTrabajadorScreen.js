import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { solicitudService } from '../../services/solicitudService';
import { userService } from '../../services/userService';

const ESTADOS = {
  PENDIENTE: {
    texto: 'Pendiente',
    color: '#B54708',
    fondo: '#FFFAEB',
    borde: '#FEDF89',
    icono: 'time-outline',
  },
  ACEPTADA: {
    texto: 'Aceptada',
    color: '#027A48',
    fondo: '#ECFDF3',
    borde: '#ABEFC6',
    icono: 'checkmark-circle-outline',
  },
  RECHAZADA: {
    texto: 'Rechazada',
    color: '#B42318',
    fondo: '#FEF3F2',
    borde: '#FECDCA',
    icono: 'close-circle-outline',
  },
  EN_PROCESO: {
    texto: 'En proceso',
    color: '#175CD3',
    fondo: '#EFF8FF',
    borde: '#B2DDFF',
    icono: 'sync-outline',
  },
  COMPLETADA: {
    texto: 'Completada',
    color: '#027A48',
    fondo: '#ECFDF3',
    borde: '#ABEFC6',
    icono: 'checkmark-done-outline',
  },
  CANCELADA: {
    texto: 'Cancelada',
    color: '#475467',
    fondo: '#F2F4F7',
    borde: '#D0D5DD',
    icono: 'ban-outline',
  },
};

const obtenerEstiloEstado = (estado) => {
  return (
    ESTADOS[String(estado || '').toUpperCase()] || {
      texto: 'Sin estado',
      color: '#475467',
      fondo: '#F2F4F7',
      borde: '#D0D5DD',
      icono: 'help-circle-outline',
    }
  );
};

const formatearFecha = (valor, conHora = false) => {
  if (!valor) {
    return 'Sin definir';
  }

  if (
    !conHora &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
  ) {
    const [anio, mes, dia] = String(valor).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  if (conHora) {
    return fecha.toLocaleString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return fecha.toLocaleDateString('es-SV');
};

const formatearHora = (valor) => {
  if (!valor) {
    return 'Sin definir';
  }

  return String(valor).substring(0, 5);
};

const FilaDato = ({
  icono,
  etiqueta,
  valor,
}) => (
  <View style={styles.filaDato}>
    <View style={styles.iconoDato}>
      <Ionicons
        name={icono}
        size={18}
        color="#2563EB"
      />
    </View>

    <View style={styles.datoTexto}>
      <Text style={styles.datoEtiqueta}>
        {etiqueta}
      </Text>

      <Text style={styles.datoValor}>
        {valor || 'Sin definir'}
      </Text>
    </View>
  </View>
);

export default function DetalleSolicitudTrabajadorScreen({
  navigation,
  route,
}) {
  const solicitudId =
    route?.params?.solicitudId;

  const [solicitud, setSolicitud] =
    useState(null);

  const [cliente, setCliente] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    modalRechazoVisible,
    setModalRechazoVisible,
  ] = useState(false);

  const [
    motivoRechazo,
    setMotivoRechazo,
  ] = useState('');

  const cargarDetalle = useCallback(
    async () => {
      if (!solicitudId) {
        setError(
          'No se recibió el identificador de la solicitud.'
        );
        setCargando(false);
        return;
      }

      setError('');

      try {
        const solicitudObtenida =
          await solicitudService.obtenerSolicitudPorId(
            solicitudId
          );

        setSolicitud(solicitudObtenida);

        if (solicitudObtenida?.clienteId) {
          try {
            const usuario =
              await userService.obtenerUsuarioPorId(
                solicitudObtenida.clienteId
              );

            setCliente(usuario);
          } catch {
            setCliente(null);
          }
        }
      } catch (excepcion) {
        setError(
          excepcion.message ||
            'No se pudo cargar la solicitud.'
        );
      } finally {
        setCargando(false);
      }
    },
    [solicitudId]
  );

  React.useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const ejecutarAccion = async (
    tipo,
    accion
  ) => {
    if (procesando) {
      return;
    }

    setProcesando(true);

    try {
      await accion();
      await cargarDetalle();

      Alert.alert(
        'Solicitud actualizada',
        `La solicitud fue marcada como ${tipo.toLowerCase()} correctamente.`
      );
    } catch (excepcion) {
      Alert.alert(
        'No se pudo actualizar',
        excepcion.message ||
          'Inténtalo nuevamente en unos instantes.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const confirmarAceptar = () => {
    Alert.alert(
      'Aceptar solicitud',
      '¿Deseas aceptar esta solicitud de servicio?',
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Aceptar',
          onPress: () =>
            ejecutarAccion(
              'Aceptada',
              () =>
                solicitudService.aceptarSolicitud(
                  solicitudId
                )
            ),
        },
      ]
    );
  };

  const rechazar = async () => {
    const motivo =
      motivoRechazo.trim();

    if (!motivo) {
      Alert.alert(
        'Motivo requerido',
        'Debes indicar el motivo del rechazo.'
      );
      return;
    }

    Keyboard.dismiss();
    setProcesando(true);

    try {
      await solicitudService.rechazarSolicitud(
        solicitudId,
        motivo
      );

      setMotivoRechazo('');
      setModalRechazoVisible(false);

      await cargarDetalle();

      Alert.alert(
        'Solicitud rechazada',
        'La solicitud fue rechazada correctamente.'
      );
    } catch (excepcion) {
      Alert.alert(
        'No se pudo rechazar',
        excepcion.message ||
          'Inténtalo nuevamente.'
      );
    } finally {
      setProcesando(false);
    }
  };

  const confirmarIniciar = () => {
    Alert.alert(
      'Iniciar servicio',
      '¿Confirmas que deseas iniciar este servicio?',
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Iniciar',
          onPress: () =>
            ejecutarAccion(
              'En proceso',
              () =>
                solicitudService.iniciarSolicitud(
                  solicitudId
                )
            ),
        },
      ]
    );
  };

  const confirmarCompletar = () => {
    Alert.alert(
      'Completar servicio',
      '¿Confirmas que el trabajo ha sido completado?',
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Completar',
          onPress: () =>
            ejecutarAccion(
              'Completada',
              () =>
                solicitudService.completarSolicitud(
                  solicitudId
                )
            ),
        },
      ]
    );
  };

  const abrirChat = () => {
    navigation.navigate('Chat', {
      solicitudId,
    });
  };

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.textoCarga}>
            Cargando solicitud...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !solicitud) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
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
              Detalle de solicitud
            </Text>

            <Text style={styles.subtitulo}>
              Información del servicio solicitado
            </Text>
          </View>
        </View>

        <View style={styles.centro}>
          <View style={styles.iconoError}>
            <Ionicons
              name="cloud-offline-outline"
              size={42}
              color="#B42318"
            />
          </View>

          <Text style={styles.tituloError}>
            No pudimos cargar la solicitud
          </Text>

          <Text style={styles.textoError}>
            {error}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={cargarDetalle}
          >
            <Text
              style={styles.botonReintentarTexto}
            >
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const estado =
    String(
      solicitud.estado || ''
    ).toUpperCase();

  const estiloEstado =
    obtenerEstiloEstado(estado);

  const chatDisponible = [
    'ACEPTADA',
    'EN_PROCESO',
  ].includes(estado);

  return (
    <SafeAreaView
      style={styles.contenedor}
    >
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
            Detalle de solicitud
          </Text>

          <Text style={styles.subtitulo}>
            Solicitud #{solicitud.idSolicitud}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaEncabezado}>
            <View style={styles.iconoServicio}>
              <Ionicons
                name="briefcase-outline"
                size={25}
                color="#2563EB"
              />
            </View>

            <View style={styles.informacionPrincipal}>
              <Text style={styles.tituloServicio}>
                {solicitud.servicioTitulo ||
                  'Servicio'}
              </Text>

              <View
                style={[
                  styles.badgeEstado,
                  {
                    backgroundColor:
                      estiloEstado.fondo,
                    borderColor:
                      estiloEstado.borde,
                  },
                ]}
              >
                <Ionicons
                  name={estiloEstado.icono}
                  size={14}
                  color={estiloEstado.color}
                />

                <Text
                  style={[
                    styles.badgeEstadoTexto,
                    {
                      color:
                        estiloEstado.color,
                    },
                  ]}
                >
                  {estiloEstado.texto}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.tituloSeccionContenedor}>
            <Ionicons
              name="person-outline"
              size={19}
              color="#2563EB"
            />

            <Text style={styles.tituloSeccion}>
              Información del cliente
            </Text>
          </View>

          <View style={styles.separador} />

          <FilaDato
            icono="person-outline"
            etiqueta="Cliente"
            valor={
              cliente?.nombre ||
              `Cliente #${solicitud.clienteId}`
            }
          />

          {cliente?.telefono ? (
            <FilaDato
              icono="call-outline"
              etiqueta="Teléfono"
              valor={cliente.telefono}
            />
          ) : null}
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.tituloSeccionContenedor}>
            <Ionicons
              name="construct-outline"
              size={19}
              color="#2563EB"
            />

            <Text style={styles.tituloSeccion}>
              Información del servicio
            </Text>
          </View>

          <View style={styles.separador} />

          <FilaDato
            icono="calendar-outline"
            etiqueta="Fecha propuesta"
            valor={formatearFecha(
              solicitud.fechaPropuesta
            )}
          />

          <FilaDato
            icono="time-outline"
            etiqueta="Hora aproximada"
            valor={formatearHora(
              solicitud.horaAproximada
            )}
          />

          <FilaDato
            icono="location-outline"
            etiqueta="Dirección"
            valor={
              solicitud.direccionServicio
            }
          />

          <View style={styles.descripcion}>
            <Text style={styles.datoEtiqueta}>
              Descripción del trabajo
            </Text>

            <Text
              style={styles.descripcionTexto}
            >
              {solicitud.descripcionTrabajo ||
                'Sin descripción registrada'}
            </Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.tituloSeccionContenedor}>
            <Ionicons
              name="git-branch-outline"
              size={19}
              color="#2563EB"
            />

            <Text style={styles.tituloSeccion}>
              Seguimiento
            </Text>
          </View>

          <View style={styles.separador} />

          <FilaDato
            icono="time-outline"
            etiqueta="Solicitud recibida"
            valor={formatearFecha(
              solicitud.fechaCreacion,
              true
            )}
          />

          <FilaDato
            icono="refresh-outline"
            etiqueta="Última actualización"
            valor={formatearFecha(
              solicitud.fechaActualizacion,
              true
            )}
          />

          {solicitud.motivoRechazo ? (
            <View style={styles.avisoRechazo}>
              <Ionicons
                name="close-circle-outline"
                size={20}
                color="#B42318"
              />

              <View style={styles.avisoContenido}>
                <Text
                  style={styles.avisoRechazoTitulo}
                >
                  Motivo del rechazo
                </Text>

                <Text
                  style={styles.avisoRechazoTexto}
                >
                  {solicitud.motivoRechazo}
                </Text>
              </View>
            </View>
          ) : null}

          {solicitud.motivoCancelacion ? (
            <View style={styles.avisoCancelacion}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#475467"
              />

              <View style={styles.avisoContenido}>
                <Text
                  style={styles.avisoCancelacionTitulo}
                >
                  Motivo de cancelación
                </Text>

                <Text
                  style={styles.avisoCancelacionTexto}
                >
                  {solicitud.motivoCancelacion}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {chatDisponible ? (
          <Pressable
            style={styles.botonChat}
            onPress={abrirChat}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#2563EB"
            />

            <Text style={styles.botonChatTexto}>
              Conversar con el cliente
            </Text>
          </Pressable>
        ) : null}

        {estado === 'PENDIENTE' ? (
          <View style={styles.accionesVerticales}>
            <Pressable
              style={[
                styles.botonPrincipal,
                procesando &&
                  styles.botonDeshabilitado,
              ]}
              onPress={confirmarAceptar}
              disabled={procesando}
            >
              {procesando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color="#FFFFFF"
                  />

                  <Text
                    style={styles.textoBotonPrincipal}
                  >
                    Aceptar solicitud
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.botonRechazar,
                procesando &&
                  styles.botonDeshabilitado,
              ]}
              onPress={() =>
                setModalRechazoVisible(true)
              }
              disabled={procesando}
            >
              <Ionicons
                name="close-circle-outline"
                size={21}
                color="#B42318"
              />

              <Text
                style={styles.textoBotonRechazar}
              >
                Rechazar solicitud
              </Text>
            </Pressable>
          </View>
        ) : null}

        {estado === 'ACEPTADA' ? (
          <Pressable
            style={[
              styles.botonPrincipal,
              procesando &&
                styles.botonDeshabilitado,
            ]}
            onPress={confirmarIniciar}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="play-circle-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.textoBotonPrincipal}
                >
                  Iniciar servicio
                </Text>
              </>
            )}
          </Pressable>
        ) : null}

        {estado === 'EN_PROCESO' ? (
          <Pressable
            style={[
              styles.botonCompletar,
              procesando &&
                styles.botonDeshabilitado,
            ]}
            onPress={confirmarCompletar}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.textoBotonPrincipal}
                >
                  Marcar como completado
                </Text>
              </>
            )}
          </Pressable>
        ) : null}

        {estado === 'COMPLETADA' ? (
          <View style={styles.estadoFinal}>
            <View style={styles.estadoFinalIcono}>
              <Ionicons
                name="checkmark-done"
                size={25}
                color="#027A48"
              />
            </View>

            <View style={styles.estadoFinalContenido}>
              <Text
                style={styles.estadoFinalTitulo}
              >
                Servicio completado
              </Text>

              <Text
                style={styles.estadoFinalTexto}
              >
                El trabajo fue marcado como completado correctamente.
              </Text>
            </View>
          </View>
        ) : null}

        {estado === 'RECHAZADA' ? (
          <View style={styles.estadoFinalRechazado}>
            <View
              style={styles.estadoFinalIconoRechazado}
            >
              <Ionicons
                name="close"
                size={25}
                color="#B42318"
              />
            </View>

            <View style={styles.estadoFinalContenido}>
              <Text
                style={styles.estadoFinalTitulo}
              >
                Solicitud rechazada
              </Text>

              <Text
                style={styles.estadoFinalTexto}
              >
                Esta solicitud ya no requiere ninguna acción.
              </Text>
            </View>
          </View>
        ) : null}

        {estado === 'CANCELADA' ? (
          <View style={styles.estadoFinalCancelado}>
            <View
              style={styles.estadoFinalIconoCancelado}
            >
              <Ionicons
                name="ban-outline"
                size={24}
                color="#475467"
              />
            </View>

            <View style={styles.estadoFinalContenido}>
              <Text
                style={styles.estadoFinalTitulo}
              >
                Solicitud cancelada
              </Text>

              <Text
                style={styles.estadoFinalTexto}
              >
                Esta solicitud fue cancelada y ya no puede continuar.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={modalRechazoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!procesando) {
            Keyboard.dismiss();
            setModalRechazoVisible(false);
          }
        }}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <View style={styles.modalIcono}>
              <Ionicons
                name="close-circle-outline"
                size={30}
                color="#B42318"
              />
            </View>

            <Text style={styles.modalTitulo}>
              Rechazar solicitud
            </Text>

            <Text style={styles.modalTexto}>
              Indica al cliente el motivo por el que no puedes aceptar esta solicitud.
            </Text>

            <Text style={styles.campoEtiqueta}>
              Motivo del rechazo
            </Text>

            <TextInput
              style={styles.campoMotivo}
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              placeholder="Escribe el motivo del rechazo"
              placeholderTextColor="#98A2B3"
              multiline
              maxLength={500}
              editable={!procesando}
              textAlignVertical="top"
            />

            <Text style={styles.contador}>
              {motivoRechazo.length}/500
            </Text>

            <View style={styles.modalBotones}>
              <Pressable
                style={styles.botonModalCancelar}
                onPress={() => {
                  Keyboard.dismiss();
                  setModalRechazoVisible(false);
                  setMotivoRechazo('');
                }}
                disabled={procesando}
              >
                <Text
                  style={styles.textoModalCancelar}
                >
                  Volver
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.botonModalRechazar,
                  procesando &&
                    styles.botonDeshabilitado,
                ]}
                onPress={rechazar}
                disabled={procesando}
              >
                {procesando ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={styles.textoModalRechazar}
                  >
                    Rechazar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
  },

  textoCarga: {
    marginTop: 12,
    color: '#667085',
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
    alignItems: 'flex-start',
  },

  tituloServicio: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },

  badgeEstado: {
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  badgeEstadoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },

  tituloSeccionContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tituloSeccion: {
    marginLeft: 7,
    color: '#101828',
    fontSize: 15,
    fontWeight: '700',
  },

  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 15,
  },

  filaDato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
  },

  iconoDato: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  datoTexto: {
    flex: 1,
  },

  datoEtiqueta: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '600',
  },

  datoValor: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },

  descripcion: {
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    marginTop: 8,
    paddingTop: 14,
  },

  descripcionTexto: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },

  accionesVerticales: {
    gap: 10,
  },

  botonPrincipal: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  botonCompletar: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#039855',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  botonRechazar: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoBotonRechazar: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },

  botonChat: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 14,
  },

  botonChatTexto: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },

  botonDeshabilitado: {
    opacity: 0.55,
  },

  iconoError: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloError: {
    marginTop: 18,
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  textoError: {
    marginTop: 8,
    color: '#667085',
    lineHeight: 20,
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

  avisoRechazo: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  avisoCancelacion: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  avisoContenido: {
    flex: 1,
    marginLeft: 9,
  },

  avisoRechazoTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B42318',
  },

  avisoRechazoTexto: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: '#912018',
  },

  avisoCancelacionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },

  avisoCancelacionTexto: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: '#475467',
  },

  estadoFinal: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#ABEFC6',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  estadoFinalRechazado: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  estadoFinalCancelado: {
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  estadoFinalIcono: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#D1FADF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoFinalIconoRechazado: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoFinalIconoCancelado: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoFinalContenido: {
    flex: 1,
    marginLeft: 12,
  },

  estadoFinalTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },

  estadoFinalTexto: {
    marginTop: 3,
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  modalContenido: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  modalIcono: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitulo: {
    marginTop: 15,
    color: '#101828',
    fontSize: 19,
    fontWeight: '700',
  },

  modalTexto: {
    marginTop: 6,
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },

  campoEtiqueta: {
    marginTop: 18,
    marginBottom: 7,
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
  },

  campoMotivo: {
    minHeight: 115,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#101828',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },

  contador: {
    marginTop: 6,
    textAlign: 'right',
    color: '#98A2B3',
    fontSize: 11,
  },

  modalBotones: {
    marginTop: 19,
    flexDirection: 'row',
    gap: 10,
  },

  botonModalCancelar: {
    flex: 1,
    minHeight: 47,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoModalCancelar: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },

  botonModalRechazar: {
    flex: 1,
    minHeight: 47,
    borderRadius: 11,
    backgroundColor: '#D92D20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoModalRechazar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});