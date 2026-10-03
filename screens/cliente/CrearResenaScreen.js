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

import resenaService from '../../services/resenaService';
import solicitudService from '../../services/solicitudService';

const obtenerMensajeError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.mensaje ||
    error?.response?.data?.title ||
    error?.message ||
    'Ocurrió un error al registrar la reseña.'
  );
};

const CrearResenaScreen = ({
  route,
  navigation,
}) => {
  const solicitudId =
    route?.params?.solicitudId;

  const servicioTitulo =
    route?.params?.servicioTitulo ||
    'Servicio contratado';

  const trabajadorNombre =
    route?.params?.trabajadorNombre ||
    'Trabajador';

  const [solicitud, setSolicitud] =
    useState(null);

  const [calificacion, setCalificacion] =
    useState(0);

  const [comentario, setComentario] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState(null);

  const cargarSolicitud = useCallback(
    async () => {
      const id = Number(solicitudId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setError(
          'No se recibió una solicitud válida.'
        );
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError(null);

        const detalle =
          await solicitudService.obtenerSolicitudPorId(
            id
          );

        setSolicitud(detalle);

        if (
          String(
            detalle?.estado || ''
          ).toUpperCase() !== 'COMPLETADA'
        ) {
          setError(
            'Solo puedes calificar un servicio cuando la solicitud está completada.'
          );
        }
      } catch (err) {
        setSolicitud(null);
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.mensaje ||
            err?.response?.data?.title ||
            err?.message ||
            'No se pudo verificar la solicitud.'
        );
      } finally {
        setCargando(false);
      }
    },
    [solicitudId]
  );

  useEffect(() => {
    cargarSolicitud();
  }, [cargarSolicitud]);

  const seleccionarCalificacion = (
    valor
  ) => {
    if (guardando) {
      return;
    }

    setCalificacion(valor);
  };

  const validarFormulario = () => {
    if (!solicitud?.idSolicitud) {
      Alert.alert(
        'Solicitud no disponible',
        'No se pudo identificar la solicitud.'
      );
      return false;
    }

    const estado = String(
      solicitud.estado || ''
    ).toUpperCase();

    if (estado !== 'COMPLETADA') {
      Alert.alert(
        'Servicio no completado',
        'Solo puedes calificar un servicio cuando la solicitud está completada.'
      );
      return false;
    }

    if (
      calificacion < 1 ||
      calificacion > 5
    ) {
      Alert.alert(
        'Calificación requerida',
        'Seleccioná una calificación de 1 a 5 estrellas.'
      );
      return false;
    }

    if (
      comentario.trim().length > 1000
    ) {
      Alert.alert(
        'Comentario demasiado largo',
        'El comentario no puede superar los 1000 caracteres.'
      );
      return false;
    }

    return true;
  };

  const guardarResena = async () => {
    if (!validarFormulario()) {
      return;
    }

    Keyboard.dismiss();

    try {
      setGuardando(true);

      const datos = {
        solicitudId: Number(
          solicitud.idSolicitud
        ),
        calificacion,
        comentario:
          comentario.trim() || null,
      };

      await resenaService.crearResena(
        datos
      );

      Alert.alert(
        'Reseña publicada',
        'Tu calificación y reseña fueron registradas correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      const mensaje =
        obtenerMensajeError(err);

      const duplicada =
        mensaje
          .toLowerCase()
          .includes('ya posee una reseña') ||
        mensaje
          .toLowerCase()
          .includes('ya tiene una reseña');

      Alert.alert(
        duplicada
          ? 'Servicio ya calificado'
          : 'No se pudo publicar',
        duplicada
          ? 'Esta solicitud ya fue calificada anteriormente.'
          : mensaje
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.botonRegresar}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#101828"
            />
          </Pressable>

          <View style={styles.headerCentro}>
            <Text style={styles.tituloHeader}>
              Calificar servicio
            </Text>

            <Text style={styles.subtituloHeader}>
              Tu experiencia
            </Text>
          </View>

          <View style={styles.espacioHeader} />
        </View>

        <View style={styles.cargando}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text style={styles.cargandoTexto}>
            Verificando solicitud...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.botonRegresar}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#101828"
            />
          </Pressable>

          <View style={styles.headerCentro}>
            <Text style={styles.tituloHeader}>
              Calificar servicio
            </Text>

            <Text style={styles.subtituloHeader}>
              Tu experiencia
            </Text>
          </View>

          <View style={styles.espacioHeader} />
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorIcono}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />
          </View>

          <Text style={styles.errorTitulo}>
            No puedes calificar este servicio
          </Text>

          <Text style={styles.errorTexto}>
            {error}
          </Text>

          <Pressable
            style={styles.botonVolverError}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Ionicons
              name="arrow-back-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.botonVolverErrorTexto
              }
            >
              Volver al detalle
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.botonRegresar}
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

        <View style={styles.headerCentro}>
          <Text style={styles.tituloHeader}>
            Calificar servicio
          </Text>

          <Text style={styles.subtituloHeader}>
            Tu experiencia
          </Text>
        </View>

        <View style={styles.espacioHeader} />
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
          contentContainerStyle={
            styles.contenido
          }
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resumenServicio}>
            <View style={styles.iconoServicio}>
              <Ionicons
                name="briefcase-outline"
                size={24}
                color="#0D9488"
              />
            </View>

            <View style={styles.resumenContenido}>
              <Text
                style={styles.resumenTitulo}
                numberOfLines={2}
              >
                {servicioTitulo ||
                  solicitud?.servicioTitulo ||
                  'Servicio contratado'}
              </Text>

              <Text
                style={styles.resumenTrabajador}
              >
                {trabajadorNombre}
              </Text>

              <View
                style={styles.estadoCompletado}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#027A48"
                />

                <Text
                  style={
                    styles.estadoCompletadoTexto
                  }
                >
                  Servicio completado
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.iconoContainer}>
              <Ionicons
                name="star"
                size={36}
                color="#F59E0B"
              />
            </View>

            <Text style={styles.titulo}>
              ¿Cómo fue tu experiencia?
            </Text>

            <Text style={styles.descripcion}>
              Calificá el servicio recibido y
              compartí tu experiencia con otros
              clientes.
            </Text>

            <View
              style={styles.estrellasContainer}
            >
              {[1, 2, 3, 4, 5].map(
                (estrella) => (
                  <Pressable
                    key={estrella}
                    onPress={() =>
                      seleccionarCalificacion(
                        estrella
                      )
                    }
                    style={styles.botonEstrella}
                    disabled={guardando}
                  >
                    <Ionicons
                      name={
                        estrella <=
                        calificacion
                          ? 'star'
                          : 'star-outline'
                      }
                      size={42}
                      color="#F59E0B"
                    />
                  </Pressable>
                )
              )}
            </View>

            <Text
              style={styles.textoCalificacion}
            >
              {calificacion === 0
                ? 'Seleccioná una calificación'
                : calificacion === 1
                  ? '1 de 5 estrellas'
                  : `${calificacion} de 5 estrellas`}
            </Text>

            <View style={styles.separador} />

            <View style={styles.campoContainer}>
              <View style={styles.labelFila}>
                <Text style={styles.label}>
                  Comentario
                </Text>

                <Text
                  style={styles.opcional}
                >
                  Opcional
                </Text>
              </View>

              <TextInput
                style={styles.inputComentario}
                placeholder="Contanos cómo fue el servicio..."
                placeholderTextColor="#98A2B3"
                value={comentario}
                onChangeText={setComentario}
                multiline
                maxLength={1000}
                textAlignVertical="top"
                editable={!guardando}
                scrollEnabled
              />

              <Text style={styles.contador}>
                {comentario.length}/1000
              </Text>
            </View>

            <View style={styles.informacion}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#2563EB"
              />

              <Text
                style={styles.informacionTexto}
              >
                Tu calificación quedará asociada
                a este servicio y al perfil del
                trabajador.
              </Text>
            </View>

            <Pressable
              style={[
                styles.botonGuardar,
                (guardando ||
                  calificacion === 0) &&
                  styles.botonDeshabilitado,
              ]}
              onPress={guardarResena}
              disabled={
                guardando ||
                calificacion === 0
              }
            >
              {guardando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#FFFFFF"
                />
              )}

              <Text style={styles.textoBoton}>
                {guardando
                  ? 'Publicando...'
                  : 'Publicar reseña'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  flex: {
    flex: 1,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },

  botonRegresar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCentro: {
    flex: 1,
    alignItems: 'center',
  },

  tituloHeader: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },

  subtituloHeader: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },

  espacioHeader: {
    width: 44,
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

  errorContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIcono: {
    width: 76,
    height: 76,
    borderRadius: 23,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitulo: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  errorTexto: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
    textAlign: 'center',
  },

  botonVolverError: {
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  botonVolverErrorTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  resumenServicio: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 16,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoServicio: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  resumenContenido: {
    flex: 1,
  },

  resumenTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },

  resumenTrabajador: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
  },

  estadoCompletado: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#ECFDF3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  estadoCompletadoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#027A48',
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  iconoContainer: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  descripcion: {
    fontSize: 14,
    lineHeight: 21,
    color: '#667085',
    textAlign: 'center',
    marginTop: 8,
  },

  estrellasContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },

  botonEstrella: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },

  textoCalificacion: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#667085',
    marginTop: 10,
  },

  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 22,
  },

  campoContainer: {
    marginBottom: 18,
  },

  labelFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },

  opcional: {
    marginLeft: 7,
    fontSize: 12,
    color: '#98A2B3',
  },

  inputComentario: {
    minHeight: 140,
    maxHeight: 210,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 14,
    lineHeight: 20,
    color: '#101828',
    backgroundColor: '#F9FAFB',
  },

  contador: {
    textAlign: 'right',
    fontSize: 11,
    color: '#98A2B3',
    marginTop: 6,
  },

  informacion: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#EFF8FF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  informacionTexto: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#175CD3',
  },

  botonGuardar: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },

  botonDeshabilitado: {
    opacity: 0.55,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CrearResenaScreen;