import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { solicitudService } from '../../services/solicitudService';

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

const ESTADOS_CANCELABLES = ['PENDIENTE', 'ACEPTADA'];

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

const FilaDato = ({ icono, etiqueta, valor }) => (
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

export default function DetalleSolicitudClienteScreen({
  navigation,
  route,
}) {
  const solicitudId = route?.params?.solicitudId;

  const [solicitud, setSolicitud] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(null);

  const cargarDetalle = useCallback(async () => {
    try {
      setError(null);

      const detalle = await solicitudService.obtenerDetalle(
        solicitudId
      );

      setSolicitud(detalle);

      try {
        const registros =
          await solicitudService.obtenerHistorial(solicitudId);

        setHistorial(registros);
      } catch {
        setHistorial([]);
      }
    } catch (excepcion) {
      setError(
        excepcion.message ||
          'No se pudo cargar el detalle de la solicitud.'
      );
    } finally {
      setCargando(false);
    }
  }, [solicitudId]);

  React.useEffect(() => {
    if (!solicitudId) {
      setError(
        'No fue posible identificar la solicitud solicitada.'
      );
      setCargando(false);
      return;
    }

    cargarDetalle();
  }, [solicitudId, cargarDetalle]);

  const confirmarCancelacion = () => {
    Alert.alert(
      'Cancelar solicitud',
      'Esta accion no se puede deshacer. Puedes indicar el motivo de la cancelacion.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar solicitud',
          style: 'destructive',
          onPress: ejecutarCancelacion,
        },
      ]
    );
  };

  const ejecutarCancelacion = async () => {
    setCancelando(true);

    try {
      await solicitudService.cancelar(solicitudId, motivo);

      setMotivo('');
      await cargarDetalle();
    } catch (excepcion) {
      Alert.alert(
        'No se pudo cancelar',
        excepcion.message ||
          'Inténtalo nuevamente en unos instantes.'
      );
    } finally {
      setCancelando(false);
    }
  };

  const abrirChat = () => {
    navigation.navigate('Chat', {
      solicitudId,
    });
  };

  const puedeCancelar =
    solicitud &&
    ESTADOS_CANCELABLES.includes(
      String(solicitud.estado).toUpperCase()
    );

  const chatDisponible = ['ACEPTADA', 'EN_PROCESO'].includes(
    String(solicitud?.estado || '').toUpperCase()
  );

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

  if (error) {
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
          <View style={[styles.iconoVacio, styles.iconoError]}>
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color="#DC2626"
            />
          </View>

          <Text style={styles.tituloVacio}>
            No pudimos cargar la solicitud
          </Text>

          <Text style={styles.textoVacio}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotonPrimario}>
              Volver
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estiloEstado = obtenerEstiloEstado(solicitud?.estado);

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
            Solicitud #{String(solicitud?.id ?? '')}
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
              name="document-text-outline"
              size={26}
              color="#0D9488"
            />
          </View>

          <View style={styles.estadoTexto}>
            <Text style={styles.estadoServicio}>
              {solicitud?.servicio?.nombre ||
                solicitud?.servicioNombre ||
                'Servicio'}
            </Text>

            <View
              style={[
                styles.badge,
                { backgroundColor: estiloEstado.fondo },
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
                  { color: estiloEstado.color },
                ]}
              >
                {estiloEstado.texto}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            Informacion del servicio
          </Text>

          <FilaDato
            icono="calendar-outline"
            etiqueta="Fecha propuesta"
            valor={formatearFecha(solicitud?.fechaPropuesta)}
          />

          <FilaDato
            icono="time-outline"
            etiqueta="Hora aproximada"
            valor={solicitud?.horaAproximada}
          />

          <FilaDato
            icono="location-outline"
            etiqueta="Direccion"
            valor={solicitud?.direccion}
          />

          <FilaDato
            icono="person-outline"
            etiqueta="Trabajador asignado"
            valor={solicitud?.trabajadorNombre}
          />

          <View style={styles.descripcion}>
            <Text style={styles.datoEtiqueta}>
              Descripcion del trabajo
            </Text>

            <Text style={styles.descripcionTexto}>
              {solicitud?.descripcionTrabajo ||
                'Sin descripcion registrada'}
            </Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            Seguimiento
          </Text>

          <FilaDato
            icono="time-outline"
            etiqueta="Registrada el"
            valor={formatearFecha(
              solicitud?.fechaCreacion,
              true
            )}
          />

          <FilaDato
            icono="refresh-outline"
            etiqueta="Ultima actualizacion"
            valor={formatearFecha(
              solicitud?.fechaActualizacion,
              true
            )}
          />

          {solicitud?.motivoCancelacion ? (
            <FilaDato
              icono="information-circle-outline"
              etiqueta="Motivo de cancelacion"
              valor={solicitud.motivoCancelacion}
            />
          ) : null}
        </View>

        {historial.length > 0 ? (
          <View style={styles.tarjeta}>
            <Text style={styles.tituloSeccion}>
              Historial de estados
            </Text>

            {historial.map((registro, indice) => {
              const estiloRegistro = obtenerEstiloEstado(
                registro.estado
              );

              return (
                <View
                  key={
                    registro.id ?? `${registro.estado}-${indice}`
                  }
                  style={styles.lineaHistorial}
                >
                  <View style={styles.marcaHistorial}>
                    <View
                      style={[
                        styles.puntoHistorial,
                        {
                          backgroundColor: estiloRegistro.color,
                        },
                      ]}
                    />

                    {indice < historial.length - 1 ? (
                      <View style={styles.lineaVertical} />
                    ) : null}
                  </View>

                  <View style={styles.historialTexto}>
                    <Text style={styles.historialEstado}>
                      {estiloRegistro.texto}
                    </Text>

                    <Text style={styles.historialFecha}>
                      {formatearFecha(
                        registro.fechaCambio ||
                          registro.fechaActualizacion,
                        true
                      )}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {chatDisponible ? (
          <TouchableOpacity
            style={styles.botonChat}
            onPress={abrirChat}
            activeOpacity={0.85}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Abrir chat con el trabajador
            </Text>
          </TouchableOpacity>
        ) : null}

        {puedeCancelar ? (
          <View style={styles.tarjetaCancelar}>
            <Text style={styles.tituloCancelar}>
              Cancelar solicitud
            </Text>

            <TextInput
              style={styles.inputMotivo}
              placeholder="Motivo de la cancelacion (opcional)"
              placeholderTextColor="#94A3B8"
              value={motivo}
              onChangeText={setMotivo}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!cancelando}
            />

            <TouchableOpacity
              style={[
                styles.botonCancelar,
                cancelando && styles.botonDeshabilitado,
              ]}
              onPress={confirmarCancelacion}
              disabled={cancelando}
              activeOpacity={0.85}
            >
              {cancelando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>
                  Cancelar solicitud
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12344D',
  },
  header: {
    backgroundColor: '#12344D',
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
    justifyContent: 'center',
    alignItems: 'center',
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
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 34,
    gap: 12,
  },
  textoCarga: {
    color: '#64748B',
    fontSize: 13,
  },
  iconoVacio: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoError: {
    backgroundColor: '#FEE2E2',
  },
  tituloVacio: {
    color: '#172B3A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  textoVacio: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  botonPrimario: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 20,
  },
  textoBotonPrimario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contenido: {
    padding: 20,
    paddingBottom: 36,
  },
  tarjetaEstado: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoEstado: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  estadoTexto: {
    flex: 1,
    gap: 7,
  },
  estadoServicio: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '800',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginTop: 14,
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
    marginBottom: 13,
  },
  iconoDato: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  descripcion: {
    marginTop: 3,
  },
  descripcionTexto: {
    color: '#172B3A',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },
  lineaHistorial: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  marcaHistorial: {
    alignItems: 'center',
    marginRight: 13,
    width: 14,
  },
  puntoHistorial: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: 4,
  },
  lineaVertical: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  historialTexto: {
    flex: 1,
    paddingBottom: 15,
  },
  historialEstado: {
    color: '#172B3A',
    fontSize: 13,
    fontWeight: '800',
  },
  historialFecha: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  botonChat: {
    minHeight: 54,
    backgroundColor: '#0D9488',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  tarjetaCancelar: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 18,
    marginTop: 18,
  },
  tituloCancelar: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 11,
  },
  inputMotivo: {
    minHeight: 82,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    color: '#172B3A',
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 13,
  },
  botonCancelar: {
    minHeight: 50,
    backgroundColor: '#DC2626',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});
