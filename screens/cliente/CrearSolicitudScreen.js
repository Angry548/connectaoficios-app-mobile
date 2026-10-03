import React, {
  useEffect,
  useMemo,
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
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  solicitudService,
} from '../../services/solicitudService';

const obtenerFechaMinima = () => {
  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = String(
    hoy.getMonth() + 1
  ).padStart(2, '0');
  const dia = String(
    hoy.getDate()
  ).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

const validarFecha = (fecha) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const [
    anio,
    mes,
    dia,
  ] = fecha.split('-').map(Number);

  const fechaCreada = new Date(
    anio,
    mes - 1,
    dia
  );

  return (
    fechaCreada.getFullYear() === anio &&
    fechaCreada.getMonth() ===
      mes - 1 &&
    fechaCreada.getDate() === dia
  );
};

const validarHora = (hora) => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    hora
  );
};

export default function CrearSolicitudScreen({
  route,
  navigation,
}) {
  const servicioId =
    route?.params?.servicioId;

  const trabajadorId =
    route?.params?.trabajadorId;

  const perfilTrabajadorId =
    route?.params?.perfilTrabajadorId;

  const servicioTitulo =
    route?.params?.servicioTitulo ||
    'Servicio';

  const trabajadorNombre =
    route?.params?.trabajadorNombre ||
    'Trabajador';

  const [fechaPropuesta, setFechaPropuesta] =
    useState('');

  const [
    horaAproximada,
    setHoraAproximada,
  ] = useState('');

  const [
    direccionServicio,
    setDireccionServicio,
  ] = useState('');

  const [
    descripcionTrabajo,
    setDescripcionTrabajo,
  ] = useState('');

  const [enviando, setEnviando] =
    useState(false);

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

  const fechaMinima = useMemo(
    () => obtenerFechaMinima(),
    []
  );

  const formularioValido = useMemo(() => {
    return (
      fechaPropuesta.trim().length > 0 &&
      horaAproximada.trim().length > 0 &&
      direccionServicio.trim().length > 0 &&
      descripcionTrabajo.trim().length > 0 &&
      !enviando
    );
  }, [
    fechaPropuesta,
    horaAproximada,
    direccionServicio,
    descripcionTrabajo,
    enviando,
  ]);

  const formatearFecha = (texto) => {
    const soloNumeros = texto.replace(
      /\D/g,
      ''
    );

    let resultado =
      soloNumeros.substring(0, 4);

    if (soloNumeros.length > 4) {
      resultado += `-${soloNumeros.substring(
        4,
        6
      )}`;
    }

    if (soloNumeros.length > 6) {
      resultado += `-${soloNumeros.substring(
        6,
        8
      )}`;
    }

    setFechaPropuesta(resultado);
  };

  const formatearHora = (texto) => {
    const soloNumeros = texto.replace(
      /\D/g,
      ''
    );

    let resultado =
      soloNumeros.substring(0, 2);

    if (soloNumeros.length > 2) {
      resultado += `:${soloNumeros.substring(
        2,
        4
      )}`;
    }

    setHoraAproximada(resultado);
  };

  const obtenerMensajeError = (err) => {
    const data = err?.response?.data;

    if (typeof data === 'string') {
      return data;
    }

    if (
      data?.message ||
      data?.mensaje ||
      data?.error
    ) {
      return (
        data.message ||
        data.mensaje ||
        data.error
      );
    }

    if (
      data &&
      typeof data === 'object'
    ) {
      const primerValor =
        Object.values(data)[0];

      if (Array.isArray(primerValor)) {
        return (
          primerValor[0] ||
          'No se pudo registrar la solicitud.'
        );
      }

      if (
        typeof primerValor === 'string'
      ) {
        return primerValor;
      }
    }

    return (
      err?.message ||
      'No se pudo registrar la solicitud.'
    );
  };

  const validarFormulario = () => {
    if (!servicioId) {
      Alert.alert(
        'Servicio no disponible',
        'No se recibió el identificador del servicio.'
      );

      return false;
    }

    if (!trabajadorId) {
      Alert.alert(
        'Trabajador no disponible',
        'No se pudo identificar al trabajador que ofrece este servicio.'
      );

      return false;
    }

    const fecha =
      fechaPropuesta.trim();

    const hora =
      horaAproximada.trim();

    const direccion =
      direccionServicio.trim();

    const descripcion =
      descripcionTrabajo.trim();

    if (!fecha) {
      Alert.alert(
        'Fecha requerida',
        'Ingresa la fecha propuesta para realizar el servicio.'
      );

      return false;
    }

    if (!validarFecha(fecha)) {
      Alert.alert(
        'Fecha no válida',
        'Ingresa la fecha con el formato AAAA-MM-DD.'
      );

      return false;
    }

    if (fecha < fechaMinima) {
      Alert.alert(
        'Fecha no válida',
        'La fecha propuesta no puede ser anterior a la fecha actual.'
      );

      return false;
    }

    if (!hora) {
      Alert.alert(
        'Hora requerida',
        'Ingresa una hora aproximada para el servicio.'
      );

      return false;
    }

    if (!validarHora(hora)) {
      Alert.alert(
        'Hora no válida',
        'Ingresa la hora con el formato HH:MM.'
      );

      return false;
    }

    if (!direccion) {
      Alert.alert(
        'Dirección requerida',
        'Ingresa la dirección donde se realizará el servicio.'
      );

      return false;
    }

    if (direccion.length > 255) {
      Alert.alert(
        'Dirección demasiado larga',
        'La dirección no puede superar los 255 caracteres.'
      );

      return false;
    }

    if (!descripcion) {
      Alert.alert(
        'Descripción requerida',
        'Describe brevemente el trabajo que necesitas.'
      );

      return false;
    }

    if (descripcion.length > 1000) {
      Alert.alert(
        'Descripción demasiado larga',
        'La descripción no puede superar los 1000 caracteres.'
      );

      return false;
    }

    return true;
  };

  const enviarSolicitud = async () => {
    if (enviando) {
      return;
    }

    Keyboard.dismiss();

    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);

    try {
      const clienteId =
        await solicitudService.obtenerMiId();

      const datos = {
        servicioId: Number(servicioId),
        clienteId: Number(clienteId),
        trabajadorId: Number(
          trabajadorId
        ),
        fechaPropuesta:
          fechaPropuesta.trim(),
        horaAproximada:
          `${horaAproximada.trim()}:00`,
        direccionServicio:
          direccionServicio.trim(),
        descripcionTrabajo:
          descripcionTrabajo.trim(),
      };

      const solicitudCreada =
        await solicitudService.crearSolicitud(
          datos
        );

      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud fue enviada correctamente al trabajador.',
        [
          {
            text: 'Ver solicitud',
            onPress: () => {
              navigation.replace(
                'DetalleSolicitudCliente',
                {
                  solicitudId:
                    solicitudCreada.idSolicitud,
                }
              );
            },
          },
          {
            text: 'Mis solicitudes',
            onPress: () => {
              navigation.navigate(
                'MisSolicitudes'
              );
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'No se pudo enviar',
        obtenerMensajeError(err)
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() =>
            navigation.goBack()
          }
          disabled={enviando}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            Solicitar servicio
          </Text>

          <Text style={styles.subtitulo}>
            Completa los datos de tu solicitud
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
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resumen}>
            <View
              style={styles.resumenIcono}
            >
              <Ionicons
                name="construct-outline"
                size={27}
                color="#FFFFFF"
              />
            </View>

            <View
              style={styles.resumenContenido}
            >
              <Text
                style={styles.resumenEtiqueta}
              >
                Servicio solicitado
              </Text>

              <Text
                style={styles.resumenTitulo}
              >
                {servicioTitulo}
              </Text>

              <View
                style={
                  styles.trabajadorFila
                }
              >
                <Ionicons
                  name="person-outline"
                  size={15}
                  color="#D6E4EC"
                />

                <Text
                  style={
                    styles.trabajadorTexto
                  }
                >
                  {trabajadorNombre}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tarjeta}>
            <View
              style={styles.seccionTituloFila}
            >
              <View
                style={styles.iconoSeccion}
              >
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color="#2563EB"
                />
              </View>

              <View>
                <Text
                  style={styles.seccionTitulo}
                >
                  Fecha y hora
                </Text>

                <Text
                  style={
                    styles.seccionSubtitulo
                  }
                >
                  Indica cuándo necesitas el servicio
                </Text>
              </View>
            </View>

            <Text style={styles.etiqueta}>
              Fecha propuesta
            </Text>

            <View
              style={styles.campoContenedor}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                style={styles.campo}
                value={fechaPropuesta}
                onChangeText={formatearFecha}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#98A2B3"
                keyboardType="number-pad"
                maxLength={10}
                editable={!enviando}
              />
            </View>

            <Text style={styles.ayuda}>
              Fecha mínima: {fechaMinima}
            </Text>

            <Text
              style={[
                styles.etiqueta,
                styles.etiquetaSeparada,
              ]}
            >
              Hora aproximada
            </Text>

            <View
              style={styles.campoContenedor}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                style={styles.campo}
                value={horaAproximada}
                onChangeText={formatearHora}
                placeholder="HH:MM"
                placeholderTextColor="#98A2B3"
                keyboardType="number-pad"
                maxLength={5}
                editable={!enviando}
              />
            </View>

            <Text style={styles.ayuda}>
              Ejemplo: 14:30
            </Text>
          </View>

          <View style={styles.tarjeta}>
            <View
              style={styles.seccionTituloFila}
            >
              <View
                style={styles.iconoSeccion}
              >
                <Ionicons
                  name="location-outline"
                  size={21}
                  color="#2563EB"
                />
              </View>

              <View style={styles.flex}>
                <Text
                  style={styles.seccionTitulo}
                >
                  Lugar del servicio
                </Text>

                <Text
                  style={
                    styles.seccionSubtitulo
                  }
                >
                  Indica dónde debe realizarse
                </Text>
              </View>
            </View>

            <Text style={styles.etiqueta}>
              Dirección
            </Text>

            <View
              style={[
                styles.campoContenedor,
                styles.campoMultilinea,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color="#667085"
                style={
                  styles.iconoMultilinea
                }
              />

              <TextInput
                style={[
                  styles.campo,
                  styles.textoMultilinea,
                ]}
                value={direccionServicio}
                onChangeText={
                  setDireccionServicio
                }
                placeholder="Ej. Colonia, calle, número de casa y referencias"
                placeholderTextColor="#98A2B3"
                multiline
                maxLength={255}
                editable={!enviando}
                textAlignVertical="top"
              />
            </View>

            <Text
              style={styles.contadorCaracteres}
            >
              {direccionServicio.length}/255
            </Text>
          </View>

          <View style={styles.tarjeta}>
            <View
              style={styles.seccionTituloFila}
            >
              <View
                style={styles.iconoSeccion}
              >
                <Ionicons
                  name="document-text-outline"
                  size={21}
                  color="#2563EB"
                />
              </View>

              <View style={styles.flex}>
                <Text
                  style={styles.seccionTitulo}
                >
                  Trabajo requerido
                </Text>

                <Text
                  style={
                    styles.seccionSubtitulo
                  }
                >
                  Explica qué necesitas realizar
                </Text>
              </View>
            </View>

            <Text style={styles.etiqueta}>
              Descripción del trabajo
            </Text>

            <View
              style={[
                styles.campoContenedor,
                styles.campoDescripcion,
              ]}
            >
              <TextInput
                style={[
                  styles.campo,
                  styles.textoDescripcion,
                ]}
                value={descripcionTrabajo}
                onChangeText={
                  setDescripcionTrabajo
                }
                placeholder="Describe el problema, trabajo o servicio que necesitas..."
                placeholderTextColor="#98A2B3"
                multiline
                maxLength={1000}
                editable={!enviando}
                textAlignVertical="top"
              />
            </View>

            <Text
              style={styles.contadorCaracteres}
            >
              {descripcionTrabajo.length}/1000
            </Text>
          </View>

          <View style={styles.aviso}>
            <Ionicons
              name="information-circle-outline"
              size={23}
              color="#2563EB"
            />

            <Text style={styles.avisoTexto}>
              El trabajador recibirá tu solicitud y podrá aceptarla o rechazarla. Podrás consultar su estado desde Mis solicitudes.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.botonEnviar,
              (!formularioValido ||
                enviando) &&
                styles.botonEnviarDeshabilitado,
              pressed &&
                formularioValido &&
                !enviando &&
                styles.botonEnviarPresionado,
            ]}
            onPress={enviarSolicitud}
            disabled={
              !formularioValido ||
              enviando
            }
          >
            {enviando ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.botonEnviarTexto
                  }
                >
                  Enviando solicitud...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.botonEnviarTexto
                  }
                >
                  Enviar solicitud
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.botonCancelar}
            onPress={() =>
              navigation.goBack()
            }
            disabled={enviando}
          >
            <Text
              style={styles.botonCancelarTexto}
            >
              Cancelar
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    paddingHorizontal: 8,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 2,
    fontSize: 11,
    color: '#667085',
    textAlign: 'center',
  },
  espacio: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 45,
  },
  resumen: {
    backgroundColor: '#12344D',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resumenIcono: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumenContenido: {
    flex: 1,
    marginLeft: 14,
  },
  resumenEtiqueta: {
    fontSize: 11,
    color: '#B8CBD7',
    fontWeight: '600',
  },
  resumenTitulo: {
    marginTop: 3,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trabajadorFila: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trabajadorTexto: {
    marginLeft: 5,
    fontSize: 12,
    color: '#D6E4EC',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  seccionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },
  iconoSeccion: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  seccionSubtitulo: {
    marginTop: 2,
    fontSize: 11,
    color: '#667085',
  },
  etiqueta: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '600',
    color: '#344054',
  },
  etiquetaSeparada: {
    marginTop: 17,
  },
  campoContenedor: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  campo: {
    flex: 1,
    marginLeft: 9,
    paddingVertical: 12,
    fontSize: 14,
    color: '#101828',
  },
  ayuda: {
    marginTop: 6,
    fontSize: 11,
    color: '#667085',
  },
  campoMultilinea: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  iconoMultilinea: {
    marginTop: 14,
  },
  textoMultilinea: {
    minHeight: 96,
    paddingTop: 13,
    paddingBottom: 13,
  },
  campoDescripcion: {
    minHeight: 135,
    alignItems: 'flex-start',
  },
  textoDescripcion: {
    minHeight: 130,
    marginLeft: 0,
    paddingTop: 13,
    paddingBottom: 13,
  },
  contadorCaracteres: {
    marginTop: 6,
    fontSize: 10,
    color: '#98A2B3',
    textAlign: 'right',
  },
  aviso: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avisoTexto: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: '#1D4ED8',
  },
  botonEnviar: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  botonEnviarDeshabilitado: {
    opacity: 0.5,
  },
  botonEnviarPresionado: {
    opacity: 0.85,
  },
  botonEnviarTexto: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonCancelar: {
    minHeight: 50,
    marginTop: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCancelarTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667085',
  },
});