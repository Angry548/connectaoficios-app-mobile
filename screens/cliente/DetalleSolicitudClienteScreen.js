import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { solicitudService } from '../../services/solicitudService';
import { userService } from '../../services/userService';

const ESTADOS = {
  PENDIENTE: {
    texto: 'Pendiente',
    color: '#B45309',
    fondo: '#FEF3C7',
    icono: 'time-outline',
  },
  ACEPTADA: {
    texto: 'Aceptada',
    color: '#0F766E',
    fondo: '#E6F4F1',
    icono: 'checkmark-circle-outline',
  },
  RECHAZADA: {
    texto: 'Rechazada',
    color: '#B42318',
    fondo: '#FEE4E2',
    icono: 'close-circle-outline',
  },
  EN_PROCESO: {
    texto: 'En proceso',
    color: '#175CD3',
    fondo: '#EFF8FF',
    icono: 'sync-outline',
  },
  COMPLETADA: {
    texto: 'Completada',
    color: '#027A48',
    fondo: '#ECFDF3',
    icono: 'checkmark-done-outline',
  },
  CANCELADA: {
    texto: 'Cancelada',
    color: '#475467',
    fondo: '#F2F4F7',
    icono: 'ban-outline',
  },
};

const ESTADOS_CANCELABLES = [
  'PENDIENTE',
  'ACEPTADA',
  'EN_PROCESO',
];

const obtenerEstiloEstado = (estado) => {
  return (
    ESTADOS[String(estado || '').toUpperCase()] || {
      texto: 'Sin estado',
      color: '#475467',
      fondo: '#F2F4F7',
      icono: 'help-circle-outline',
    }
  );
};

const formatearFecha = (
  valor,
  conHora = false
) => {
  if (!valor) {
    return 'Sin definir';
  }

  if (
    !conHora &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
  ) {
    const [anio, mes, dia] =
      String(valor).split('-');

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

  return fecha.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatearHora = (valor) => {
  if (!valor) {
    return 'Sin definir';
  }

  return String(valor).substring(0, 5);
};

const obtenerMensajeError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.mensaje ||
    error?.response?.data?.title ||
    error?.message ||
    'No se pudo cargar el detalle de la solicitud.'
  );
};

const FilaDato = ({
  icono,
  etiqueta,
  valor,
}) => {
  return (
    <View style={styles.filaDato}>
      <View style={styles.iconoDato}>
        <Ionicons
          name={icono}
          size={19}
          color="#0D9488"
        />
      </View>

      <View style={styles.datoContenido}>
        <Text style={styles.datoEtiqueta}>
          {etiqueta}
        </Text>

        <Text style={styles.datoValor}>
          {valor || 'Sin definir'}
        </Text>
      </View>
    </View>
  );
};

export default function DetalleSolicitudClienteScreen({
  navigation,
  route,
}) {
  const solicitudId =
    route?.params?.solicitudId;

  const [solicitud, setSolicitud] =
    useState(null);

  const [trabajador, setTrabajador] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [cancelando, setCancelando] =
    useState(false);

  const [motivo, setMotivo] =
    useState('');

  const [error, setError] =
    useState(null);

  const [alturaTeclado, setAlturaTeclado] =
    useState(0);

  useEffect(() => {
    const mostrarTeclado = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setAlturaTeclado(
          event.endCoordinates.height
        );
      }
    );

    const ocultarTeclado = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setAlturaTeclado(0);
      }
    );

    return () => {
      mostrarTeclado.remove();
      ocultarTeclado.remove();
    };
  }, []);

  const cargarDetalle = useCallback(
    async (mostrarCarga = true) => {
      if (!solicitudId) {
        setError(
          'No fue posible identificar la solicitud.'
        );
        setCargando(false);
        return;
      }

      if (mostrarCarga) {
        setCargando(true);
      }

      try {
        setError(null);

        const detalle =
          await solicitudService.obtenerSolicitudPorId(
            solicitudId
          );

        setSolicitud(detalle);

        const trabajadorId = Number(
          detalle?.trabajadorId
        );

        if (
          Number.isInteger(trabajadorId) &&
          trabajadorId > 0
        ) {
          try {
            const usuario =
              await userService.obtenerUsuarioPorId(
                trabajadorId
              );

            setTrabajador(usuario);
          } catch {
            setTrabajador(null);
          }
        } else {
          setTrabajador(null);
        }
      } catch (err) {
        setSolicitud(null);
        setTrabajador(null);
        setError(obtenerMensajeError(err));
      } finally {
        setCargando(false);
      }
    },
    [solicitudId]
  );

  useFocusEffect(
    useCallback(() => {
      cargarDetalle(false);
    }, [cargarDetalle])
  );

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const ejecutarCancelacion = () => {
    const motivoLimpio = motivo.trim();

    if (!motivoLimpio) {
      Alert.alert(
        'Motivo requerido',
        'Debes indicar el motivo de la cancelación.'
      );
      return;
    }

    if (motivoLimpio.length > 500) {
      Alert.alert(
        'Motivo demasiado largo',
        'El motivo no puede superar los 500 caracteres.'
      );
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Cancelar solicitud',
      '¿Estás seguro de que deseas cancelar esta solicitud?',
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Cancelar solicitud',
          style: 'destructive',
          onPress: async () => {
            setCancelando(true);

            try {
              await solicitudService.cancelarSolicitud(
                solicitudId,
                motivoLimpio
              );

              setMotivo('');

              await cargarDetalle(false);

              Alert.alert(
                'Solicitud cancelada',
                'La solicitud fue cancelada correctamente.'
              );
            } catch (err) {
              Alert.alert(
                'No se pudo cancelar',
                obtenerMensajeError(err)
              );
            } finally {
              setCancelando(false);
            }
          },
        },
      ]
    );
  };

  const abrirChat = () => {
    Keyboard.dismiss();

    navigation.navigate('Chat', {
      solicitudId,
    });
  };

  const abrirCalificacion = () => {
    Keyboard.dismiss();

    navigation.navigate('CrearResena', {
      solicitudId: solicitud.idSolicitud,
      servicioId: solicitud.servicioId,
      servicioTitulo: solicitud.servicioTitulo,
      trabajadorId: solicitud.trabajadorId,
      trabajadorNombre:
        trabajador?.nombre ||
        `Trabajador #${solicitud.trabajadorId}`,
    });
  };

  const estadoActual = String(
    solicitud?.estado || ''
  ).toUpperCase();

  const puedeCancelar =
    ESTADOS_CANCELABLES.includes(
      estadoActual
    );

  const chatDisponible = [
    'ACEPTADA',
    'EN_PROCESO',
  ].includes(estadoActual);

  const puedeCalificar =
    estadoActual === 'COMPLETADA';

  if (cargando) {
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
              Detalle de solicitud
            </Text>

            <Text style={styles.subtitulo}>
              Información del servicio
            </Text>
          </View>

          <View style={styles.espacio} />
        </View>

        <View style={styles.cargando}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text style={styles.cargandoTexto}>
            Cargando solicitud...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !solicitud) {
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
              Detalle de solicitud
            </Text>

            <Text style={styles.subtitulo}>
              Información del servicio
            </Text>
          </View>

          <View style={styles.espacio} />
        </View>

        <View style={styles.errorPantalla}>
          <View style={styles.iconoError}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />
          </View>

          <Text style={styles.estadoTitulo}>
            No pudimos cargar la solicitud
          </Text>

          <Text style={styles.estadoTexto}>
            {error ||
              'No se encontró la solicitud.'}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={() => cargarDetalle()}
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

  const estiloEstado =
    obtenerEstiloEstado(solicitud.estado);

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => {
            Keyboard.dismiss();
            navigation.goBack();
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
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

        <View style={styles.espacio} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contenido,
            alturaTeclado > 0 && {
              paddingBottom:
                alturaTeclado + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={styles.tarjetaPrincipal}>
            <View style={styles.tarjetaSuperior}>
              <View style={styles.iconoServicio}>
                <Ionicons
                  name="briefcase-outline"
                  size={25}
                  color="#0D9488"
                />
              </View>

              <View
                style={styles.servicioInformacion}
              >
                <Text
                  style={styles.servicioTitulo}
                  numberOfLines={2}
                >
                  {solicitud.servicioTitulo ||
                    'Servicio'}
                </Text>

                <Text
                  style={styles.solicitudNumero}
                >
                  Solicitud #
                  {solicitud.idSolicitud}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      estiloEstado.fondo,
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
                    styles.badgeTexto,
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

          <View style={styles.tarjeta}>
            <View style={styles.tituloSeccionFila}>
              <View style={styles.iconoSeccion}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloSeccion}>
                Información del servicio
              </Text>
            </View>

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

            <FilaDato
              icono="person-outline"
              etiqueta="Trabajador"
              valor={
                trabajador?.nombre ||
                `Trabajador #${solicitud.trabajadorId}`
              }
            />

            <View
              style={styles.descripcionContenedor}
            >
              <Text
                style={styles.descripcionEtiqueta}
              >
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
            <View style={styles.tituloSeccionFila}>
              <View style={styles.iconoSeccion}>
                <Ionicons
                  name="git-branch-outline"
                  size={20}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloSeccion}>
                Seguimiento
              </Text>
            </View>

            <FilaDato
              icono="add-circle-outline"
              etiqueta="Registrada el"
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
              <View style={styles.motivoAlerta}>
                <View
                  style={
                    styles.motivoAlertaIcono
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#B42318"
                  />
                </View>

                <View
                  style={
                    styles.motivoAlertaContenido
                  }
                >
                  <Text
                    style={
                      styles.motivoAlertaTitulo
                    }
                  >
                    Motivo del rechazo
                  </Text>

                  <Text
                    style={
                      styles.motivoAlertaTexto
                    }
                  >
                    {solicitud.motivoRechazo}
                  </Text>
                </View>
              </View>
            ) : null}

            {solicitud.motivoCancelacion ? (
              <View
                style={styles.motivoCancelacion}
              >
                <View
                  style={
                    styles.motivoCancelacionIcono
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#475467"
                  />
                </View>

                <View
                  style={
                    styles.motivoAlertaContenido
                  }
                >
                  <Text
                    style={
                      styles.motivoCancelacionTitulo
                    }
                  >
                    Motivo de cancelación
                  </Text>

                  <Text
                    style={
                      styles.motivoCancelacionTexto
                    }
                  >
                    {
                      solicitud.motivoCancelacion
                    }
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {chatDisponible ? (
            <View style={styles.tarjeta}>
              <View
                style={styles.tituloSeccionFila}
              >
                <View
                  style={styles.iconoSeccion}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color="#0D9488"
                  />
                </View>

                <Text
                  style={styles.tituloSeccion}
                >
                  Comunicación
                </Text>
              </View>

              <Text style={styles.ayuda}>
                Comunícate con el trabajador
                para coordinar los detalles del
                servicio.
              </Text>

              <Pressable
                style={styles.botonChat}
                onPress={abrirChat}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.botonChatTexto}
                >
                  Abrir conversación
                </Text>
              </Pressable>
            </View>
          ) : null}

          {puedeCalificar ? (
            <View style={styles.tarjetaCalificacion}>
              <View
                style={styles.tituloSeccionFila}
              >
                <View
                  style={styles.iconoSeccionEstrella}
                >
                  <Ionicons
                    name="star"
                    size={20}
                    color="#F59E0B"
                  />
                </View>

                <Text
                  style={styles.tituloSeccion}
                >
                  Califica el servicio
                </Text>
              </View>

              <Text style={styles.ayuda}>
                El servicio fue completado.
                Comparte tu experiencia y califica
                el trabajo realizado.
              </Text>

              <View
                style={styles.estrellasVista}
              >
                {[1, 2, 3, 4, 5].map(
                  (estrella) => (
                    <Ionicons
                      key={estrella}
                      name="star"
                      size={23}
                      color="#F59E0B"
                    />
                  )
                )}
              </View>

              <Pressable
                style={styles.botonCalificar}
                onPress={abrirCalificacion}
              >
                <Ionicons
                  name="star-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.botonCalificarTexto
                  }
                >
                  Calificar servicio
                </Text>
              </Pressable>
            </View>
          ) : null}

          {puedeCancelar ? (
            <View style={styles.tarjeta}>
              <View
                style={styles.tituloSeccionFila}
              >
                <View
                  style={[
                    styles.iconoSeccion,
                    styles.iconoSeccionRojo,
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#B42318"
                  />
                </View>

                <Text
                  style={styles.tituloSeccion}
                >
                  Cancelar solicitud
                </Text>
              </View>

              <Text style={styles.ayuda}>
                Indica el motivo por el que
                deseas cancelar esta solicitud.
              </Text>

              <TextInput
                style={styles.campoMotivo}
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Escribe el motivo de la cancelación..."
                placeholderTextColor="#98A2B3"
                multiline
                maxLength={500}
                editable={!cancelando}
                textAlignVertical="top"
                scrollEnabled
              />

              <View style={styles.contadorFila}>
                <Text style={styles.contador}>
                  {motivo.length}/500
                </Text>
              </View>

              <Pressable
                style={[
                  styles.botonCancelar,
                  cancelando &&
                    styles.botonDeshabilitado,
                ]}
                onPress={ejecutarCancelacion}
                disabled={cancelando}
              >
                {cancelando ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="close-circle-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                )}

                <Text
                  style={
                    styles.botonCancelarTexto
                  }
                >
                  {cancelando
                    ? 'Cancelando...'
                    : 'Cancelar solicitud'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!puedeCancelar &&
          !chatDisponible &&
          !puedeCalificar ? (
            <View style={styles.estadoFinal}>
              <Ionicons
                name={
                  estadoActual === 'RECHAZADA'
                    ? 'close-circle-outline'
                    : 'information-circle-outline'
                }
                size={23}
                color={
                  estadoActual === 'RECHAZADA'
                    ? '#B42318'
                    : '#667085'
                }
              />

              <Text
                style={styles.estadoFinalTexto}
              >
                {estadoActual === 'RECHAZADA'
                  ? 'Esta solicitud fue rechazada.'
                  : estadoActual ===
                      'CANCELADA'
                    ? 'Esta solicitud fue cancelada.'
                    : 'Esta solicitud ya no admite cambios.'}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  flex: {
    flex: 1,
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

  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cargandoTexto: {
    marginTop: 12,
    fontSize: 14,
    color: '#667085',
  },

  errorPantalla: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconoError: {
    width: 76,
    height: 76,
    borderRadius: 23,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoTitulo: {
    marginTop: 15,
    fontSize: 18,
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
    marginTop: 20,
    backgroundColor: '#2563EB',
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  tarjetaPrincipal: {
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

  servicioInformacion: {
    flex: 1,
    marginRight: 8,
  },

  servicioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },

  solicitudNumero: {
    marginTop: 4,
    fontSize: 12,
    color: '#667085',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },

  badgeTexto: {
    fontSize: 11,
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

  tarjetaCalificacion: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
  },

  tituloSeccionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  iconoSeccion: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  iconoSeccionEstrella: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  iconoSeccionRojo: {
    backgroundColor: '#FEE4E2',
  },

  tituloSeccion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },

  filaDato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
  },

  iconoDato: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  datoContenido: {
    flex: 1,
  },

  datoEtiqueta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
  },

  datoValor: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    color: '#101828',
  },

  descripcionContenedor: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },

  descripcionEtiqueta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
  },

  descripcionTexto: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#344054',
  },

  motivoAlerta: {
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: '#FEF3F2',
    padding: 13,
    flexDirection: 'row',
  },

  motivoAlertaIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  motivoAlertaContenido: {
    flex: 1,
  },

  motivoAlertaTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B42318',
  },

  motivoAlertaTexto: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#912018',
  },

  motivoCancelacion: {
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: '#F2F4F7',
    padding: 13,
    flexDirection: 'row',
  },

  motivoCancelacionIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  motivoCancelacionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },

  motivoCancelacionTexto: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#475467',
  },

  ayuda: {
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    marginBottom: 13,
  },

  botonChat: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  botonChatTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  estrellasVista: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 5,
  },

  botonCalificar: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  botonCalificarTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  campoMotivo: {
    minHeight: 112,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 14,
    lineHeight: 20,
    color: '#101828',
  },

  contadorFila: {
    alignItems: 'flex-end',
    marginTop: 6,
  },

  contador: {
    fontSize: 11,
    color: '#98A2B3',
  },

  botonCancelar: {
    marginTop: 13,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#B42318',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  botonCancelarTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  estadoFinal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  estadoFinalTexto: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#475467',
  },
});