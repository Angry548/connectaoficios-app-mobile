import React, {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    color: '#B91C1C',
    fondo: '#FEE2E2',
    icono: 'close-circle-outline',
  },
  EN_PROCESO: {
    texto: 'En proceso',
    color: '#1D4ED8',
    fondo: '#DBEAFE',
    icono: 'sync-outline',
  },
  COMPLETADA: {
    texto: 'Completada',
    color: '#15803D',
    fondo: '#DCFCE7',
    icono: 'checkmark-done-outline',
  },
  CANCELADA: {
    texto: 'Cancelada',
    color: '#64748B',
    fondo: '#E2E8F0',
    icono: 'ban-outline',
  },
};

const obtenerEstiloEstado = (estado) => {
  return (
    ESTADOS[String(estado || '').toUpperCase()] || {
      texto: 'Sin estado',
      color: '#475569',
      fondo: '#E2E8F0',
      icono: 'help-circle-outline',
    }
  );
};

const formatearFecha = (valor, conHora = false) => {
  if (!valor) {
    return 'Sin definir';
  }

  if (!conHora && /^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
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
        size={17}
        color="#0D9488"
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
        style={styles.container}
        edges={['top']}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#12344D"
        />

        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
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
        style={styles.container}
        edges={['top']}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#12344D"
        />

        <View style={styles.centro}>
          <View style={styles.iconoError}>
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color="#DC2626"
            />
          </View>

          <Text style={styles.tituloError}>
            No pudimos cargar la solicitud
          </Text>

          <Text style={styles.textoError}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.textoBoton}>
              Volver
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estado =
    String(solicitud.estado || '').toUpperCase();

  const estiloEstado =
    obtenerEstiloEstado(estado);

  const chatDisponible = [
    'ACEPTADA',
    'EN_PROCESO',
  ].includes(estado);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#12344D"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.headerTexto}>
          <Text style={styles.tituloHeader}>
            Detalle de solicitud
          </Text>

          <Text style={styles.subtituloHeader}>
            Solicitud #{solicitud.idSolicitud}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tarjetaEstado}>
          <View style={styles.iconoEstado}>
            <Ionicons
              name="briefcase-outline"
              size={25}
              color="#0D9488"
            />
          </View>

          <View style={styles.estadoContenido}>
            <Text style={styles.tituloServicio}>
              {solicitud.servicioTitulo ||
                'Servicio'}
            </Text>

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
                size={13}
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
          <Text style={styles.tituloSeccion}>
            Información del cliente
          </Text>

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
          <Text style={styles.tituloSeccion}>
            Información del servicio
          </Text>

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
            valor={solicitud.direccionServicio}
          />

          <View style={styles.descripcion}>
            <Text style={styles.datoEtiqueta}>
              Descripción del trabajo
            </Text>

            <Text style={styles.descripcionTexto}>
              {solicitud.descripcionTrabajo ||
                'Sin descripción registrada'}
            </Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            Seguimiento
          </Text>

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
            <FilaDato
              icono="close-circle-outline"
              etiqueta="Motivo del rechazo"
              valor={solicitud.motivoRechazo}
            />
          ) : null}

          {solicitud.motivoCancelacion ? (
            <FilaDato
              icono="information-circle-outline"
              etiqueta="Motivo de cancelación"
              valor={solicitud.motivoCancelacion}
            />
          ) : null}
        </View>

        {chatDisponible ? (
          <TouchableOpacity
            style={styles.botonChat}
            onPress={abrirChat}
            activeOpacity={0.85}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Conversar con el cliente
            </Text>
          </TouchableOpacity>
        ) : null}

        {estado === 'PENDIENTE' ? (
          <View style={styles.acciones}>
            <TouchableOpacity
              style={[
                styles.botonAceptar,
                procesando &&
                  styles.botonDeshabilitado,
              ]}
              onPress={confirmarAceptar}
              disabled={procesando}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.textoBoton}>
                Aceptar solicitud
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botonRechazar,
                procesando &&
                  styles.botonDeshabilitado,
              ]}
              onPress={() =>
                setModalRechazoVisible(true)
              }
              disabled={procesando}
              activeOpacity={0.85}
            >
              <Ionicons
                name="close-circle-outline"
                size={21}
                color="#DC2626"
              />

              <Text
                style={styles.textoBotonRechazar}
              >
                Rechazar solicitud
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {estado === 'ACEPTADA' ? (
          <TouchableOpacity
            style={[
              styles.botonAceptar,
              procesando &&
                styles.botonDeshabilitado,
            ]}
            onPress={confirmarIniciar}
            disabled={procesando}
            activeOpacity={0.85}
          >
            <Ionicons
              name="play-circle-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Iniciar servicio
            </Text>
          </TouchableOpacity>
        ) : null}

        {estado === 'EN_PROCESO' ? (
          <TouchableOpacity
            style={[
              styles.botonCompletar,
              procesando &&
                styles.botonDeshabilitado,
            ]}
            onPress={confirmarCompletar}
            disabled={procesando}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Marcar como completado
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal
        visible={modalRechazoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!procesando) {
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
                color="#DC2626"
              />
            </View>

            <Text style={styles.modalTitulo}>
              Rechazar solicitud
            </Text>

            <Text style={styles.modalTexto}>
              Indica al cliente el motivo por el que no puedes
              aceptar esta solicitud.
            </Text>

            <TextInput
              style={styles.campoMotivo}
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              placeholder="Escribe el motivo del rechazo"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              editable={!procesando}
              textAlignVertical="top"
            />

            <Text style={styles.contador}>
              {motivoRechazo.length}/500
            </Text>

            <View style={styles.modalBotones}>
              <TouchableOpacity
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
              </TouchableOpacity>

              <TouchableOpacity
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
                  <Text style={styles.textoBoton}>
                    Rechazar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12344D',
  },
  header: {
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
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 40,
  },
  centro: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  textoCarga: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
  tarjetaEstado: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconoEstado: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  estadoContenido: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tituloServicio: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 7,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '800',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 17,
    marginBottom: 14,
  },
  tituloSeccion: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 13,
  },
  filaDato: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
  },
  iconoDato: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  datoTexto: {
    flex: 1,
  },
  datoEtiqueta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  datoValor: {
    color: '#172B3A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  descripcion: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 7,
    paddingTop: 13,
  },
  descripcionTexto: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  acciones: {
    gap: 10,
  },
  botonAceptar: {
    minHeight: 51,
    borderRadius: 14,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  botonCompletar: {
    minHeight: 51,
    borderRadius: 14,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonRechazar: {
    minHeight: 51,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonChat: {
    minHeight: 51,
    borderRadius: 14,
    backgroundColor: '#12344D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  botonPrimario: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 18,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  textoBotonRechazar: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
  iconoError: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tituloError: {
    color: '#172B3A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  textoError: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalContenido: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  modalIcono: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitulo: {
    color: '#172B3A',
    fontSize: 18,
    fontWeight: '800',
  },
  modalTexto: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  campoMotivo: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    padding: 12,
    color: '#172B3A',
    fontSize: 13,
  },
  contador: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  botonModalCancelar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonModalRechazar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoModalCancelar: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
});