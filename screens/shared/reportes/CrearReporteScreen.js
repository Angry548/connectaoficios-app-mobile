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
  StatusBar,
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

import reporteService from '../../../services/reporteService';

export default function CrearReporteScreen({
  route,
  navigation,
}) {
  const tipo =
    String(
      route?.params?.tipo || ''
    ).toUpperCase();

  const usuarioReportadoId =
    route?.params?.usuarioReportadoId ??
    null;

  const servicioId =
    route?.params?.servicioId ??
    null;

  const objetivoNombre =
    route?.params?.objetivoNombre ||
    (
      tipo === 'SERVICIO'
        ? 'Servicio'
        : 'Usuario'
    );

  const objetivoSubtitulo =
    route?.params?.objetivoSubtitulo ||
    '';

  const [
    motivo,
    setMotivo,
  ] = useState('');

  const [
    descripcion,
    setDescripcion,
  ] = useState('');

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    alturaTeclado,
    setAlturaTeclado,
  ] = useState(0);

  useEffect(() => {
    const mostrarTeclado =
      Keyboard.addListener(
        'keyboardDidShow',
        (event) => {
          setAlturaTeclado(
            event.endCoordinates
              .height
          );
        }
      );

    const ocultarTeclado =
      Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setAlturaTeclado(
            0
          );
        }
      );

    return () => {
      mostrarTeclado.remove();
      ocultarTeclado.remove();
    };
  }, []);

  const destinoValido =
    useMemo(() => {
      if (tipo === 'USUARIO') {
        const id =
          Number(
            usuarioReportadoId
          );

        return (
          Number.isInteger(id) &&
          id > 0
        );
      }

      if (tipo === 'SERVICIO') {
        const id =
          Number(
            servicioId
          );

        return (
          Number.isInteger(id) &&
          id > 0
        );
      }

      return false;
    }, [
      tipo,
      usuarioReportadoId,
      servicioId,
    ]);

  const obtenerTipoTexto = () => {
    if (tipo === 'USUARIO') {
      return 'Usuario';
    }

    if (tipo === 'SERVICIO') {
      return 'Servicio';
    }

    return 'Reporte';
  };

  const obtenerIconoTipo = () => {
    if (tipo === 'USUARIO') {
      return 'person-outline';
    }

    return 'briefcase-outline';
  };

  const validar = () => {
    if (!destinoValido) {
      Alert.alert(
        'Reporte no válido',
        'No fue posible identificar correctamente el contenido que deseas reportar.'
      );

      return false;
    }

    const motivoLimpio =
      motivo.trim();

    const descripcionLimpia =
      descripcion.trim();

    if (!motivoLimpio) {
      Alert.alert(
        'Motivo requerido',
        'Indica el motivo del reporte.'
      );

      return false;
    }

    if (
      motivoLimpio.length < 3
    ) {
      Alert.alert(
        'Motivo demasiado corto',
        'El motivo debe contener al menos 3 caracteres.'
      );

      return false;
    }

    if (
      motivoLimpio.length > 200
    ) {
      Alert.alert(
        'Motivo demasiado largo',
        'El motivo no puede superar los 200 caracteres.'
      );

      return false;
    }

    if (!descripcionLimpia) {
      Alert.alert(
        'Descripción requerida',
        'Describe lo ocurrido para que el equipo administrativo pueda revisar el caso.'
      );

      return false;
    }

    if (
      descripcionLimpia.length <
      10
    ) {
      Alert.alert(
        'Descripción demasiado corta',
        'La descripción debe contener al menos 10 caracteres.'
      );

      return false;
    }

    if (
      descripcionLimpia.length >
      2000
    ) {
      Alert.alert(
        'Descripción demasiado larga',
        'La descripción no puede superar los 2000 caracteres.'
      );

      return false;
    }

    return true;
  };

  const enviarReporte = async () => {
    if (!validar()) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Enviar reporte',
      '¿Deseas enviar este reporte al equipo administrativo de ConnectaOficios?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Enviar',
          onPress:
            confirmarEnvio,
        },
      ]
    );
  };

  const confirmarEnvio =
    async () => {
      setEnviando(true);

      try {
        await reporteService
          .crearReporte({
            tipo,

            usuarioReportadoId:
              tipo === 'USUARIO'
                ? Number(
                    usuarioReportadoId
                  )
                : null,

            servicioId:
              tipo === 'SERVICIO'
                ? Number(
                    servicioId
                  )
                : null,

            motivo,

            descripcion,
          });

        setMotivo('');
        setDescripcion('');

        Alert.alert(
          'Reporte enviado',
          'Tu reporte fue registrado correctamente y quedó pendiente de revisión.',
          [
            {
              text: 'Aceptar',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert(
          'No se pudo enviar',
          error?.message ||
            'Ocurrió un error al enviar el reporte.'
        );
      } finally {
        setEnviando(false);
      }
    };

  return (
    <SafeAreaView
      style={styles.contenedor}
      edges={['top']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#12344D"
      />

      <View
        style={styles.encabezado}
      >
        <Pressable
          style={styles.botonVolver}
          onPress={() => {
            Keyboard.dismiss();
            navigation.goBack();
          }}
          disabled={enviando}
        >
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        <View
          style={styles.encabezadoTexto}
        >
          <Text
            style={styles.titulo}
          >
            Enviar reporte
          </Text>

          <Text
            style={styles.subtitulo}
          >
            Informa un posible incumplimiento
          </Text>
        </View>
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
          <View
            style={styles.aviso}
          >
            <View
              style={styles.avisoIcono}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={25}
                color="#0D9488"
              />
            </View>

            <View
              style={styles.avisoContenido}
            >
              <Text
                style={styles.avisoTitulo}
              >
                Tu reporte será revisado
              </Text>

              <Text
                style={styles.avisoTexto}
              >
                Proporciona información clara y objetiva para facilitar la revisión administrativa.
              </Text>
            </View>
          </View>

          <View
            style={styles.tarjeta}
          >
            <Text
              style={styles.tituloSeccion}
            >
              Contenido reportado
            </Text>

            <View
              style={styles.objetivo}
            >
              <View
                style={styles.objetivoIcono}
              >
                <Ionicons
                  name={
                    obtenerIconoTipo()
                  }
                  size={24}
                  color="#0D9488"
                />
              </View>

              <View
                style={styles.objetivoContenido}
              >
                <Text
                  style={styles.objetivoTipo}
                >
                  {obtenerTipoTexto()}
                </Text>

                <Text
                  style={styles.objetivoNombre}
                  numberOfLines={2}
                >
                  {objetivoNombre}
                </Text>

                {Boolean(
                  objetivoSubtitulo
                ) && (
                  <Text
                    style={styles.objetivoSubtitulo}
                    numberOfLines={2}
                  >
                    {objetivoSubtitulo}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View
            style={styles.tarjeta}
          >
            <Text
              style={styles.tituloSeccion}
            >
              Información del reporte
            </Text>

            <Text
              style={styles.label}
            >
              Motivo
            </Text>

            <TextInput
              style={styles.input}
              value={motivo}
              onChangeText={
                setMotivo
              }
              placeholder="Ej. Información engañosa"
              placeholderTextColor="#94A3B8"
              maxLength={200}
              editable={!enviando}
              returnKeyType="next"
            />

            <Text
              style={styles.contador}
            >
              {motivo.length}/200
            </Text>

            <Text
              style={[
                styles.label,
                styles.labelDescripcion,
              ]}
            >
              Descripción
            </Text>

            <TextInput
              style={styles.textarea}
              value={descripcion}
              onChangeText={
                setDescripcion
              }
              placeholder="Describe detalladamente qué ocurrió y por qué consideras que debe ser revisado."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              maxLength={2000}
              editable={!enviando}
              scrollEnabled
            />

            <Text
              style={styles.contador}
            >
              {descripcion.length}/2000
            </Text>
          </View>

          <View
            style={styles.informacion}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#475467"
            />

            <Text
              style={styles.informacionTexto}
            >
              El reporte quedará inicialmente en estado Pendiente. El equipo administrativo podrá revisarlo y comunicar una resolución.
            </Text>
          </View>

          <Pressable
            style={[
              styles.botonEnviar,

              (
                enviando ||
                !destinoValido
              ) &&
                styles.botonDeshabilitado,
            ]}
            onPress={
              enviarReporte
            }
            disabled={
              enviando ||
              !destinoValido
            }
          >
            {enviando ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.botonEnviarTexto}
                >
                  Enviar reporte
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor:
        '#12344D',
    },

    flex: {
      flex: 1,
    },

    encabezado: {
      backgroundColor:
        '#12344D',
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
      backgroundColor:
        '#1E506B',
      justifyContent:
        'center',
      alignItems: 'center',
      marginRight: 13,
    },

    encabezadoTexto: {
      flex: 1,
    },

    titulo: {
      color: '#FFFFFF',
      fontSize: 21,
      fontWeight: '800',
    },

    subtitulo: {
      color: '#D6E4EC',
      fontSize: 12,
      marginTop: 2,
    },

    scroll: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },

    contenido: {
      padding: 20,
      paddingBottom: 40,
    },

    aviso: {
      flexDirection: 'row',
      backgroundColor:
        '#ECFDF3',
      borderWidth: 1,
      borderColor:
        '#ABEFC6',
      borderRadius: 18,
      padding: 16,
    },

    avisoIcono: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor:
        '#D1FADF',
      justifyContent:
        'center',
      alignItems: 'center',
      marginRight: 12,
    },

    avisoContenido: {
      flex: 1,
    },

    avisoTitulo: {
      color: '#05603A',
      fontSize: 14,
      fontWeight: '800',
    },

    avisoTexto: {
      color: '#067647',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 3,
    },

    tarjeta: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#E2E8F0',
      padding: 18,
      marginTop: 18,
    },

    tituloSeccion: {
      color: '#172B3A',
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 14,
    },

    objetivo: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    objetivoIcono: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor:
        '#E6F4F1',
      justifyContent:
        'center',
      alignItems: 'center',
      marginRight: 13,
    },

    objetivoContenido: {
      flex: 1,
    },

    objetivoTipo: {
      color: '#0D9488',
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    objetivoNombre: {
      color: '#172B3A',
      fontSize: 15,
      fontWeight: '800',
      marginTop: 2,
    },

    objetivoSubtitulo: {
      color: '#64748B',
      fontSize: 12,
      marginTop: 3,
    },

    label: {
      color: '#344054',
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 7,
    },

    labelDescripcion: {
      marginTop: 18,
    },

    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        '#CBD5E1',
      borderRadius: 14,
      paddingHorizontal: 15,
      color: '#172B3A',
      fontSize: 14,
      backgroundColor:
        '#FFFFFF',
    },

    textarea: {
      minHeight: 145,
      maxHeight: 220,
      borderWidth: 1,
      borderColor:
        '#CBD5E1',
      borderRadius: 14,
      paddingHorizontal: 15,
      paddingVertical: 14,
      color: '#172B3A',
      fontSize: 14,
      lineHeight: 20,
      backgroundColor:
        '#FFFFFF',
    },

    contador: {
      color: '#94A3B8',
      fontSize: 11,
      textAlign: 'right',
      marginTop: 5,
    },

    informacion: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      backgroundColor:
        '#F2F4F7',
      borderRadius: 15,
      padding: 14,
      marginTop: 18,
      gap: 9,
    },

    informacionTexto: {
      flex: 1,
      color: '#475467',
      fontSize: 12,
      lineHeight: 18,
    },

    botonEnviar: {
      minHeight: 56,
      borderRadius: 16,
      backgroundColor:
        '#0D9488',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 22,
    },

    botonDeshabilitado: {
      opacity: 0.55,
    },

    botonEnviarTexto: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });