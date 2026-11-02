import { crearHistorialChat, unirMensajes } from '../../services/historialChat';
import { useUnreadMessages } from '../../context/UnreadMessagesContext';
import { mensajeError } from '../../services/mensajesError';
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
  FlatList,
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
  useFocusEffect,
} from '@react-navigation/native';

import { jwtDecode } from 'jwt-decode';

import {
  conversacionService,
} from '../../services/conversacionService';

import {
  mensajeService,
} from '../../services/mensajeService';

import {
  userService,
} from '../../services/userService';

import UserAvatar from '../../components/UserAvatar';
import { obtenerFotoInterlocutor } from '../../services/avatarConversacion';

import {
  secureStorage,
} from '../../storage/secureStorage';

const obtenerMensajeError = (error, fallback = "Ocurrió un error al procesar el chat.") => mensajeError(error, fallback);

const obtenerMiId = async () => {
  const token =
    await secureStorage.obtenerToken();

  if (!token) {
    throw new Error(
      'No existe una sesión activa.'
    );
  }

  const payload = jwtDecode(token);

  const valor =
    payload?.sub ??
    payload?.nameid ??
    payload?.id ??
    payload?.userId ??
    payload?.usuarioId ??
    payload?.[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ];

  const id = Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'No se pudo identificar al usuario.'
    );
  }

  return id;
};

const formatearHora = (fecha) => {
  if (!fecha) {
    return '';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  return valor.toLocaleTimeString(
    'es-SV',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return '';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  const hoy = new Date();

  if (
    valor.toDateString() ===
    hoy.toDateString()
  ) {
    return 'Hoy';
  }

  const ayer = new Date();

  ayer.setDate(
    ayer.getDate() - 1
  );

  if (
    valor.toDateString() ===
    ayer.toDateString()
  ) {
    return 'Ayer';
  }

  return valor.toLocaleDateString(
    'es-SV',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );
};

const obtenerClaveFecha = (fecha) => {
  if (!fecha) {
    return '';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  return valor.toDateString();
};

export default function ChatScreen({
  route,
  navigation,
}) {
  const { refrescarNoLeidos } = useUnreadMessages();
  const conversacionIdRecibido =
    route?.params?.conversacionId;

  const solicitudId =
    route?.params?.solicitudId;

  const nombreInicial =
    route?.params?.nombreUsuario ??
    'Conversación';

  const fotoInicial =
    route?.params?.fotoUsuario ??
    null;

  const scrollRef = useRef(null);

  const intervaloRef =
    useRef(null);

  const primeraCargaRef =
    useRef(true);

  const tecladoVisibleRef =
    useRef(false);

  const [
    conversacion,
    setConversacion,
  ] = useState(null);

  const [
    mensajes,
    setMensajes,
  ] = useState([]);

  const [
    usuarioId,
    setUsuarioId,
  ] = useState(null);

  const [
    nombreUsuario,
    setNombreUsuario,
  ] = useState(nombreInicial);

  const [
    fotoUsuario,
    setFotoUsuario,
  ] = useState(fotoInicial);

  const [
    texto,
    setTexto,
  ] = useState('');

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    alturaTeclado,
    setAlturaTeclado,
  ] = useState(0);

  const irAlFinal = useCallback(
    (animado = false) => {
      requestAnimationFrame(() => {
        scrollRef.current
          ?.scrollToOffset({
            offset: 0,
            animated: animado,
          });
      });
    },
    []
  );

  useEffect(() => {
    const eventoMostrar =
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow';

    const eventoOcultar =
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide';

    const mostrar =
      Keyboard.addListener(
        eventoMostrar,
        (event) => {
          const altura =
            event?.endCoordinates
              ?.height ?? 0;

          tecladoVisibleRef.current =
            true;

          setAlturaTeclado(
            altura
          );

          setTimeout(() => {
            irAlFinal(true);
          }, 100);
        }
      );

    const ocultar =
      Keyboard.addListener(
        eventoOcultar,
        () => {
          tecladoVisibleRef.current =
            false;

          setAlturaTeclado(0);
        }
      );

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, [irAlFinal]);

  const obtenerConversacion =
    useCallback(async () => {
      const idConversacion =
        Number(
          conversacionIdRecibido
        );

      if (
        Number.isInteger(
          idConversacion
        ) &&
        idConversacion > 0
      ) {
        return conversacionService
          .obtenerConversacionPorId(
            idConversacion
          );
      }

      const idSolicitud =
        Number(solicitudId);

      if (
        Number.isInteger(
          idSolicitud
        ) &&
        idSolicitud > 0
      ) {
        return conversacionService
          .obtenerOCrearPorSolicitud(
            idSolicitud
          );
      }

      throw new Error(
        'No se recibió una conversación ni una solicitud válida.'
      );
    }, [
      conversacionIdRecibido,
      solicitudId,
    ]);

  const historialRef = useRef(crearHistorialChat());
  const sesionRef = useRef(0);
  const activoRef = useRef(false);
  const cercaDelFinalRef = useRef(true);
  const desplazamientoManualRef = useRef(false);
  const inicioRef = useRef(null);
  const totalRef = useRef(null);
  const consultasRef = useRef(new Set());
  const leidosRef = useRef(new Set());
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [sinAnteriores, setSinAnteriores] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

  const incorporar = useCallback(async (lista, miId, sesion) => {
    if (!activoRef.current || sesion !== sesionRef.current) return;
    setMensajes(actuales => unirMensajes(actuales, lista));
    const pendientes = lista.filter(m => !m.leido && Number(m.remitenteId) !== Number(miId) && !leidosRef.current.has(String(m.id)));
    pendientes.forEach(m => leidosRef.current.add(String(m.id)));
    // El contrato Java solo ofrece lectura individual, no batch/conversación.
    await mensajeService.marcarMensajesRecibidosComoLeidos(pendientes, miId);
    void refrescarNoLeidos();
    pendientes.forEach(m => leidosRef.current.delete(String(m.id)));
  }, [refrescarNoLeidos]);

  const cargarMensajes = useCallback(async (idConversacion, miId, mostrarError = false) => {
    if (!idConversacion || !activoRef.current) return;
    const sesion = sesionRef.current;
    const clave = sesion + ':recientes';
    if (consultasRef.current.has(clave)) return;
    consultasRef.current.add(clave);
    try {
      const resultado = await historialRef.current.recientes(idConversacion, totalRef.current);
      if (!activoRef.current || sesion !== sesionRef.current) return;
      totalRef.current = resultado.total;
      if (inicioRef.current === null) inicioRef.current = resultado.inicio;
      setSinAnteriores(inicioRef.current === 0);
      const desplazar = primeraCargaRef.current || cercaDelFinalRef.current;
      primeraCargaRef.current = false;
      await incorporar(resultado.mensajes, miId, sesion);
      if (activoRef.current && sesion === sesionRef.current && desplazar) irAlFinal(false);
    } catch (err) {
      if (activoRef.current && sesion === sesionRef.current && mostrarError) setError(obtenerMensajeError(err));
    } finally {
      consultasRef.current.delete(clave);
    }
  }, [irAlFinal, incorporar]);

  const cargarAnteriores = async () => {
    if (!desplazamientoManualRef.current || !activoRef.current || !conversacion?.id || inicioRef.current === null || inicioRef.current <= 0) return;
    const sesion = sesionRef.current;
    const clave = sesion + ':anteriores';
    if (consultasRef.current.has(clave)) return;
    consultasRef.current.add(clave);
    setCargandoAnteriores(true);
    setErrorHistorial('');
    try {
      const resultado = await historialRef.current.anteriores(conversacion.id, inicioRef.current);
      if (!activoRef.current || sesion !== sesionRef.current) return;
      inicioRef.current = resultado.inicio;
      setSinAnteriores(resultado.inicio === 0);
      await incorporar(resultado.mensajes, usuarioId, sesion);
    } catch (err) {
      if (activoRef.current && sesion === sesionRef.current) setErrorHistorial(obtenerMensajeError(err));
    } finally {
      consultasRef.current.delete(clave);
      if (activoRef.current && sesion === sesionRef.current) setCargandoAnteriores(false);
    }
  };

  const cargarChat =
    useCallback(async () => {
      const sesion = sesionRef.current;
      setCargando(true);
      setError('');

      try {
        const miId =
          await obtenerMiId();

        const conversacionObtenida =
          await obtenerConversacion();

        if (
          !conversacionObtenida?.id
        ) {
          throw new Error(
            'No se pudo obtener la conversación.'
          );
        }

        if (!activoRef.current || sesion !== sesionRef.current) return;
        setUsuarioId(miId);
        setConversacion(
          conversacionObtenida
        );

        const otroId =
          Number(
            conversacionObtenida
              .clienteId
          ) === Number(miId)
            ? conversacionObtenida
                .trabajadorId
            : conversacionObtenida
                .clienteId;

        try {
          const usuario =
            await userService
              .obtenerUsuarioPorId(
                otroId
              );

          if (usuario?.nombre) {
            setNombreUsuario(
              usuario.nombre
            );
          } else {
            setNombreUsuario(
              nombreInicial
            );
          }
        } catch {
          setNombreUsuario(
            nombreInicial
          );
        }

        if (!activoRef.current || sesion !== sesionRef.current) return;
        setFotoUsuario(obtenerFotoInterlocutor(conversacionObtenida, miId));

        await cargarMensajes(
          conversacionObtenida.id,
          miId,
          true
        );
      } catch (err) {
        if (!activoRef.current || sesion !== sesionRef.current) return;
        setConversacion(null);

        setError(
          obtenerMensajeError(err)
        );
      } finally {
        if (activoRef.current && sesion === sesionRef.current) setCargando(false);
      }
    }, [
      obtenerConversacion,
      nombreInicial,
      cargarMensajes,
    ]);

  useFocusEffect(
    useCallback(() => {
      primeraCargaRef.current =
        true;

      activoRef.current = true;
      sesionRef.current++;
      inicioRef.current = null;
      totalRef.current = null;
      cercaDelFinalRef.current = true;
      desplazamientoManualRef.current = false;
      setMensajes([]);
      setSinAnteriores(false);
      setCargandoAnteriores(false);
      setErrorHistorial('');
      cargarChat();

      return () => {
        activoRef.current = false;
        void refrescarNoLeidos();
        sesionRef.current++;
        if (
          intervaloRef.current
        ) {
          clearInterval(
            intervaloRef.current
          );

          intervaloRef.current =
            null;
        }
      };
    }, [cargarChat])
  );

  useEffect(() => {
    if (
      !usuarioId ||
      !conversacion?.id
    ) {
      return undefined;
    }

    intervaloRef.current =
      setInterval(() => {
        cargarMensajes(
          conversacion.id,
          usuarioId,
          false
        );
      }, 5000);

    return () => {
      if (
        intervaloRef.current
      ) {
        clearInterval(
          intervaloRef.current
        );

        intervaloRef.current =
          null;
      }
    };
  }, [
    usuarioId,
    conversacion?.id,
    cargarMensajes,
  ]);

  const enviar = async () => {
    const contenido =
      texto.trim();

    if (
      !contenido ||
      enviando ||
      !conversacion
        ?.puedeEnviarMensajes
    ) {
      return;
    }

    if (
      contenido.length >
      mensajeService
        .MAXIMO_CARACTERES
    ) {
      Alert.alert(
        'Mensaje demasiado largo',
        `El mensaje no puede superar los ${mensajeService.MAXIMO_CARACTERES} caracteres.`
      );

      return;
    }

    setEnviando(true);
    const sesion = sesionRef.current;

    try {
      const nuevoMensaje =
        await mensajeService
          .enviarMensaje(
            conversacion.id,
            contenido
          );

      if (!activoRef.current || sesion !== sesionRef.current) return;
      setTexto('');

      setMensajes(actuales => unirMensajes(actuales, [nuevoMensaje]));
      cercaDelFinalRef.current = true;

      setTimeout(() => {
        irAlFinal(true);
      }, 100);
    } catch (err) {
      Alert.alert(
        'No se pudo enviar',
        obtenerMensajeError(err)
      );
    } finally {
      setEnviando(false);
    }
  };

  const volver = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View
          style={styles.encabezado}
        >
          <Pressable
            style={styles.botonVolver}
            onPress={volver}
          >
            <Ionicons
              name="arrow-back"
              size={24}
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
              Chat
            </Text>

            <Text
              style={styles.subtitulo}
            >
              Conversación del servicio
            </Text>
          </View>

          <View
            style={styles.espacio}
          />
        </View>

        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
          />

          <Text
            style={styles.textoCarga}
          >
            Cargando conversación...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error &&
    !conversacion
  ) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View
          style={styles.encabezado}
        >
          <Pressable
            style={styles.botonVolver}
            onPress={volver}
          >
            <Ionicons
              name="arrow-back"
              size={24}
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
              Chat
            </Text>

            <Text
              style={styles.subtitulo}
            >
              Conversación del servicio
            </Text>
          </View>

          <View
            style={styles.espacio}
          />
        </View>

        <View
          style={
            styles.errorContenedor
          }
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={45}
            color="#B42318"
          />

          <Text
            style={styles.errorTitulo}
          >
            No se pudo cargar el chat
          </Text>

          <Text
            style={styles.errorTexto}
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.botonReintentar
            }
            onPress={cargarChat}
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
      </SafeAreaView>
    );
  }

  const puedeEnviar =
    Boolean(
      conversacion
        ?.puedeEnviarMensajes
    );



  return (
    <SafeAreaView
      style={styles.contenedor}
    >
      <View
        style={styles.encabezadoChat}
      >
        <Pressable
          style={styles.botonVolver}
          onPress={volver}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#101828"
          />
        </Pressable>

        <View
          style={
            styles.avatarEncabezado
          }
        >
          <UserAvatar fotoUrl={fotoUsuario} nombre={nombreUsuario} size={42} />
        </View>

        <View
          style={
            styles.datosEncabezado
          }
        >
          <Text
            style={
              styles.nombreEncabezado
            }
            numberOfLines={1}
          >
            {nombreUsuario}
          </Text>

          <View
            style={
              styles.estadoEncabezado
            }
          >
            <View
              style={[
                styles.puntoEstado,
                puedeEnviar
                  ? styles.puntoActivo
                  : styles.puntoLectura,
              ]}
            />

            <Text
              style={
                styles.estadoEncabezadoTexto
              }
            >
              {puedeEnviar
                ? 'Chat activo'
                : 'Solo lectura'}
            </Text>
          </View>
        </View>

        <View
          style={styles.espacio}
        />
      </View>

      <View
        style={styles.areaChat}
      >
        <FlatList
          ref={scrollRef}
          style={styles.listaMensajes}
          contentContainerStyle={styles.contenidoMensajes}
          data={[...mensajes].reverse()}
          inverted
          keyExtractor={item => String(item.id)}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onScrollBeginDrag={() => { desplazamientoManualRef.current = true; }}
          onEndReached={cargarAnteriores}
          onEndReachedThreshold={0.15}
          onScroll={({ nativeEvent }) => {
            const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
            cercaDelFinalRef.current = contentOffset.y < 80;
            if (contentSize.height - layoutMeasurement.height - contentOffset.y < 80) cargarAnteriores();
          }}
          scrollEventThrottle={16}
          ListFooterComponent={cargandoAnteriores ? <View style={{ padding: 12 }}><ActivityIndicator size="small" /><Text style={styles.textoCarga}>Cargando mensajes anteriores...</Text></View>
            : errorHistorial ? <Text style={styles.textoCarga}>{errorHistorial}</Text>
            : sinAnteriores && mensajes.length ? <Text style={styles.textoCarga}>Inicio de la conversación</Text> : null}
          ListEmptyComponent={

            <View
              style={
                styles.chatVacio
              }
            >
              <View
                style={
                  styles.chatVacioIcono
                }
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={37}
                  color="#0D9488"
                />
              </View>

              <Text
                style={
                  styles.chatVacioTitulo
                }
              >
                Inicia la conversación
              </Text>

              <Text
                style={
                  styles.chatVacioTexto
                }
              >
                {puedeEnviar
                  ? 'Envía un mensaje para coordinar los detalles del servicio.'
                  : 'Esta conversación todavía no tiene mensajes.'}
              </Text>
            </View>
          }
          renderItem={({ item: mensaje, index }) => {
                  const anterior = mensajes[mensajes.length - index - 2];
                  const mostrarFecha = !anterior || obtenerClaveFecha(mensaje.fechaEnvio) !== obtenerClaveFecha(anterior.fechaEnvio);
                  const esMio =
                    Number(
                      mensaje.remitenteId
                    ) ===
                    Number(usuarioId);

                  return (
                    <React.Fragment
                      key={mensaje.id}
                    >
                      {mostrarFecha ? (
                        <View
                          style={
                            styles.fechaSeparador
                          }
                        >
                          <Text
                            style={
                              styles.fechaSeparadorTexto
                            }
                          >
                            {formatearFecha(
                              mensaje.fechaEnvio
                            )}
                          </Text>
                        </View>
                      ) : null}

                      <View
                        style={[
                          styles.mensajeFila,
                          esMio
                            ? styles.mensajeFilaMio
                            : styles.mensajeFilaOtro,
                        ]}
                      >
                        <View
                          style={[
                            styles.burbuja,
                            esMio
                              ? styles.burbujaMia
                              : styles.burbujaOtro,
                          ]}
                        >
                          <Text
                            style={[
                              styles.mensajeTexto,
                              esMio
                                ? styles.mensajeTextoMio
                                : styles.mensajeTextoOtro,
                            ]}
                          >
                            {
                              mensaje.contenido
                            }
                          </Text>

                          <View
                            style={
                              styles.mensajePie
                            }
                          >
                            <Text
                              style={[
                                styles.hora,
                                esMio
                                  ? styles.horaMia
                                  : styles.horaOtro,
                              ]}
                            >
                              {formatearHora(
                                mensaje.fechaEnvio
                              )}
                            </Text>

                            {esMio ? (
                              <Ionicons
                                name={
                                  mensaje.leido
                                    ? 'checkmark-done'
                                    : 'checkmark'
                                }
                                size={15}
                                color={
                                  mensaje.leido
                                    ? '#60A5FA'
                                    : '#D1FAE5'
                                }
                                style={
                                  styles.check
                                }
                              />
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </React.Fragment>
                  );
          }}
        />

        {!puedeEnviar ? (
          <View
            style={
              styles.soloLectura
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#667085"
            />

            <Text
              style={
                styles.soloLecturaTexto
              }
            >
              Esta conversación está en modo lectura.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.compositor
            }
          >
            <View
              style={
                styles.inputContenedor
              }
            >
              <TextInput
                style={styles.input}
                value={texto}
                onChangeText={setTexto}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#98A2B3"
                multiline
                maxLength={
                  mensajeService
                    .MAXIMO_CARACTERES
                }
                textAlignVertical="center"
                blurOnSubmit={false}
              />
            </View>

            <Pressable
              style={[
                styles.botonEnviar,
                (
                  !texto.trim() ||
                  enviando
                ) &&
                  styles.botonEnviarDeshabilitado,
              ]}
              disabled={
                !texto.trim() ||
                enviando
              }
              onPress={enviar}
            >
              {enviando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>
        )}

        {alturaTeclado > 0 ? (
          <View
            style={{
              height: alturaTeclado,
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  encabezadoChat: {
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

  avatarEncabezado: {
    width: 46,
    height: 46,
    marginLeft: 11,
  },

  avatarFoto: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F2F4F7',
  },

  avatarVacio: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  datosEncabezado: {
    flex: 1,
    marginLeft: 11,
  },

  nombreEncabezado: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },

  estadoEncabezado: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  puntoActivo: {
    backgroundColor: '#12B76A',
  },

  puntoLectura: {
    backgroundColor: '#98A2B3',
  },

  estadoEncabezadoTexto: {
    fontSize: 11,
    color: '#667085',
  },

  areaChat: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  listaMensajes: {
    flex: 1,
  },

  contenidoMensajes: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
  },

  grupoMensajes: {
    width: '100%',
  },

  fechaSeparador: {
    alignItems: 'center',
    marginVertical: 10,
  },

  fechaSeparadorTexto: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: '600',
    color: '#667085',
  },

  mensajeFila: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 7,
  },

  mensajeFilaMio: {
    justifyContent: 'flex-end',
  },

  mensajeFilaOtro: {
    justifyContent: 'flex-start',
  },

  burbuja: {
    maxWidth: '82%',
    minWidth: 75,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 6,
    borderRadius: 15,
  },

  burbujaMia: {
    backgroundColor: '#0D9488',
    borderBottomRightRadius: 4,
  },

  burbujaOtro: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderBottomLeftRadius: 4,
  },

  mensajeTexto: {
    fontSize: 14,
    lineHeight: 20,
  },

  mensajeTextoMio: {
    color: '#FFFFFF',
  },

  mensajeTextoOtro: {
    color: '#344054',
  },

  mensajePie: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  hora: {
    fontSize: 9,
  },

  horaMia: {
    color: '#CCFBF1',
  },

  horaOtro: {
    color: '#98A2B3',
  },

  check: {
    marginLeft: 3,
  },

  compositor: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  inputContenedor: {
    flex: 1,
    minHeight: 48,
    maxHeight: 112,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },

  input: {
    minHeight: 46,
    maxHeight: 108,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 10,
    color: '#101828',
    fontSize: 14,
    lineHeight: 19,
  },

  botonEnviar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  botonEnviarDeshabilitado: {
    opacity: 0.45,
  },

  soloLectura: {
    minHeight: 58,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  soloLecturaTexto: {
    marginLeft: 7,
    fontSize: 12,
    color: '#667085',
    fontWeight: '600',
  },

  chatVacio: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 25,
  },

  chatVacioIcono: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatVacioTitulo: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },

  chatVacioTexto: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    textAlign: 'center',
  },

  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCarga: {
    marginTop: 12,
    color: '#667085',
    fontSize: 13,
  },

  errorContenedor: {
    margin: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 30,
    alignItems: 'center',
  },

  errorTitulo: {
    marginTop: 13,
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  errorTexto: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    textAlign: 'center',
  },

  botonReintentar: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },

  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
