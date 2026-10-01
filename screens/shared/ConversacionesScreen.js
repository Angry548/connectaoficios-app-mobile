import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
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

import {
  perfilTrabajadorService,
} from '../../services/perfilTrabajadorService';

import {
  secureStorage,
} from '../../storage/secureStorage';

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

const obtenerMensajeError = (error) => {
  const data = error?.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  return (
    data?.message ||
    data?.mensaje ||
    data?.error ||
    error?.message ||
    'No fue posible cargar las conversaciones.'
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

export default function ConversacionesScreen({
  navigation,
}) {
  const [
    conversaciones,
    setConversaciones,
  ] = useState([]);

  const [
    usuarioId,
    setUsuarioId,
  ] = useState(null);

  const [
    usuarios,
    setUsuarios,
  ] = useState({});

  const [
    fotos,
    setFotos,
  ] = useState({});

  const [
    noLeidos,
    setNoLeidos,
  ] = useState({});

  const [
    busqueda,
    setBusqueda,
  ] = useState('');

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    refrescando,
    setRefrescando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (esRefresh) {
        setRefrescando(true);
      } else {
        setCargando(true);
      }

      setError('');

      try {
        const miId =
          await obtenerMiId();

        const pagina =
          await conversacionService
            .obtenerConversacionesPaginadas({
              pagina: 0,
              tamanio: 100,
            });

        const lista =
          pagina?.contenido ?? [];

        setUsuarioId(miId);
        setConversaciones(lista);

        const idsOtrosUsuarios = [
          ...new Set(
            lista
              .map((conversacion) =>
                Number(
                  conversacion.clienteId
                ) === Number(miId)
                  ? Number(
                      conversacion.trabajadorId
                    )
                  : Number(
                      conversacion.clienteId
                    )
              )
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )
          ),
        ];

        const idsTrabajadoresVisibles = [
          ...new Set(
            lista
              .filter(
                (conversacion) =>
                  Number(
                    conversacion.clienteId
                  ) === Number(miId)
              )
              .map(
                (conversacion) =>
                  Number(
                    conversacion.trabajadorId
                  )
              )
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )
          ),
        ];

        const [
          usuariosObtenidos,
          conteos,
          perfilesTrabajadores,
        ] = await Promise.all([
          userService
            .obtenerUsuariosPorIds(
              idsOtrosUsuarios
            ),

          Promise.all(
            lista.map(
              async (conversacion) => {
                try {
                  const cantidad =
                    await mensajeService
                      .contarNoLeidos(
                        conversacion.id
                      );

                  return [
                    conversacion.id,
                    cantidad,
                  ];
                } catch {
                  return [
                    conversacion.id,
                    0,
                  ];
                }
              }
            )
          ),

          Promise.all(
            idsTrabajadoresVisibles.map(
              async (trabajadorId) => {
                try {
                  const perfil =
                    await perfilTrabajadorService
                      .obtenerPerfilPorTrabajador(
                        trabajadorId
                      );

                  return [
                    trabajadorId,
                    perfil?.fotoUrl ?? null,
                  ];
                } catch {
                  return [
                    trabajadorId,
                    null,
                  ];
                }
              }
            )
          ),
        ]);

        setUsuarios(
          usuariosObtenidos ?? {}
        );

        const mapaConteos = {};

        conteos.forEach(
          ([id, cantidad]) => {
            mapaConteos[id] =
              cantidad;
          }
        );

        setNoLeidos(mapaConteos);

        const mapaFotos = {};

        perfilesTrabajadores.forEach(
          ([trabajadorId, fotoUrl]) => {
            mapaFotos[trabajadorId] =
              fotoUrl;
          }
        );

        setFotos(mapaFotos);
      } catch (err) {
        setError(
          obtenerMensajeError(err)
        );
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const conversacionesFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return conversaciones;
      }

      return conversaciones.filter(
        (conversacion) => {
          const otroId =
            Number(
              conversacion.clienteId
            ) === Number(usuarioId)
              ? conversacion.trabajadorId
              : conversacion.clienteId;

          const nombre =
            usuarios?.[otroId]
              ?.nombre
              ?.toLowerCase() ??
            '';

          const solicitud =
            String(
              conversacion.solicitudId ??
                ''
            );

          return (
            nombre.includes(texto) ||
            solicitud.includes(texto)
          );
        }
      );
    }, [
      conversaciones,
      busqueda,
      usuarioId,
      usuarios,
    ]);

  const obtenerDatosConversacion = (
    conversacion
  ) => {
    const soyCliente =
      Number(
        conversacion.clienteId
      ) === Number(usuarioId);

    const otroId =
      soyCliente
        ? Number(
            conversacion.trabajadorId
          )
        : Number(
            conversacion.clienteId
          );

    const nombre =
      usuarios?.[otroId]?.nombre ??
      (
        soyCliente
          ? `Trabajador #${otroId}`
          : `Cliente #${otroId}`
      );

    const foto =
      soyCliente
        ? fotos?.[
            Number(
              conversacion.trabajadorId
            )
          ] ?? null
        : null;

    return {
      soyCliente,
      otroId,
      nombre,
      foto,
    };
  };

  const abrirChat = (
    conversacion
  ) => {
    const datos =
      obtenerDatosConversacion(
        conversacion
      );

    navigation.navigate(
      'Chat',
      {
        conversacionId:
          conversacion.id,
        solicitudId:
          conversacion.solicitudId,
        nombreUsuario:
          datos.nombre,
        fotoUsuario:
          datos.foto,
      }
    );
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

          <View
            style={
              styles.encabezadoTexto
            }
          >
            <Text
              style={styles.titulo}
            >
              Conversaciones
            </Text>

            <Text
              style={styles.subtitulo}
            >
              Tus chats de servicios
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
            Cargando conversaciones...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.contenedor}
    >
      <View
        style={styles.encabezado}
      >
        <Pressable
          style={styles.botonVolver}
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

        <View
          style={
            styles.encabezadoTexto
          }
        >
          <Text
            style={styles.titulo}
          >
            Conversaciones
          </Text>

          <Text
            style={styles.subtitulo}
          >
            Tus chats de servicios
          </Text>
        </View>

        <View
          style={styles.espacio}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contenido
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() =>
              cargar(true)
            }
          />
        }
      >
        <View style={styles.buscador}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#667085"
          />

          <TextInput
            style={
              styles.inputBusqueda
            }
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar conversación..."
            placeholderTextColor="#98A2B3"
            returnKeyType="search"
          />

          {busqueda ? (
            <Pressable
              onPress={() =>
                setBusqueda('')
              }
            >
              <Ionicons
                name="close-circle"
                size={21}
                color="#98A2B3"
              />
            </Pressable>
          ) : null}
        </View>

        <View
          style={
            styles.resultadosCabecera
          }
        >
          <Text
            style={
              styles.resultadosTitulo
            }
          >
            Conversaciones
          </Text>

          {!error ? (
            <Text
              style={
                styles.resultadosCantidad
              }
            >
              {
                conversacionesFiltradas.length
              }
            </Text>
          ) : null}
        </View>

        {error ? (
          <View
            style={
              styles.estadoContenedor
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={45}
              color="#B42318"
            />

            <Text
              style={styles.estadoTitulo}
            >
              No pudimos cargar las conversaciones
            </Text>

            <Text
              style={styles.estadoTexto}
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.botonReintentar
              }
              onPress={() =>
                cargar()
              }
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
        ) : conversacionesFiltradas
            .length === 0 ? (
          <View
            style={
              styles.estadoContenedor
            }
          >
            <Ionicons
              name={
                busqueda
                  ? 'search-outline'
                  : 'chatbubbles-outline'
              }
              size={45}
              color="#98A2B3"
            />

            <Text
              style={styles.estadoTitulo}
            >
              {busqueda
                ? 'No encontramos conversaciones'
                : 'No tienes conversaciones'}
            </Text>

            <Text
              style={styles.estadoTexto}
            >
              {busqueda
                ? 'Prueba con otro nombre o número de solicitud.'
                : 'Tus conversaciones de servicios aparecerán aquí.'}
            </Text>
          </View>
        ) : (
          conversacionesFiltradas.map(
            (conversacion) => {
              const datos =
                obtenerDatosConversacion(
                  conversacion
                );

              const cantidad =
                noLeidos[
                  conversacion.id
                ] ?? 0;

              return (
                <Pressable
                  key={
                    conversacion.id
                  }
                  style={
                    styles.tarjeta
                  }
                  onPress={() =>
                    abrirChat(
                      conversacion
                    )
                  }
                >
                  <View
                    style={
                      styles.avatarContenedor
                    }
                  >
                    {datos.foto ? (
                      <Image
                        source={{
                          uri: datos.foto,
                        }}
                        style={
                          styles.avatarFoto
                        }
                      />
                    ) : (
                      <View
                        style={
                          styles.avatarVacio
                        }
                      >
                        <Ionicons
                          name="person"
                          size={22}
                          color="#2563EB"
                        />
                      </View>
                    )}

                    {conversacion
                      .puedeEnviarMensajes ? (
                      <View
                        style={
                          styles.estadoPunto
                        }
                      />
                    ) : null}
                  </View>

                  <View
                    style={
                      styles.tarjetaInformacion
                    }
                  >
                    <View
                      style={
                        styles.tarjetaSuperior
                      }
                    >
                      <Text
                        style={
                          styles.nombreUsuario
                        }
                        numberOfLines={1}
                      >
                        {datos.nombre}
                      </Text>

                      <Text
                        style={
                          styles.fecha
                        }
                      >
                        {formatearFecha(
                          conversacion
                            .fechaCreacion
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.solicitudFila
                      }
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={14}
                        color="#667085"
                      />

                      <Text
                        style={
                          styles.solicitudTexto
                        }
                        numberOfLines={1}
                      >
                        Solicitud #
                        {
                          conversacion
                            .solicitudId
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.tarjetaInferior
                      }
                    >
                      <View
                        style={[
                          styles.estadoChat,
                          conversacion
                            .puedeEnviarMensajes
                            ? styles.estadoChatActivo
                            : styles.estadoChatLectura,
                        ]}
                      >
                        <Ionicons
                          name={
                            conversacion
                              .puedeEnviarMensajes
                              ? 'chatbubble-ellipses-outline'
                              : 'lock-closed-outline'
                          }
                          size={13}
                          color={
                            conversacion
                              .puedeEnviarMensajes
                              ? '#0D9488'
                              : '#667085'
                          }
                        />

                        <Text
                          style={[
                            styles.estadoChatTexto,
                            conversacion
                              .puedeEnviarMensajes
                              ? styles.estadoChatTextoActivo
                              : styles.estadoChatTextoLectura,
                          ]}
                        >
                          {conversacion
                            .puedeEnviarMensajes
                            ? 'Chat activo'
                            : 'Solo lectura'}
                        </Text>
                      </View>

                      {cantidad > 0 ? (
                        <View
                          style={
                            styles.noLeidos
                          }
                        >
                          <Text
                            style={
                              styles.noLeidosTexto
                            }
                          >
                            {cantidad > 99
                              ? '99+'
                              : cantidad}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={21}
                    color="#98A2B3"
                  />
                </Pressable>
              );
            }
          )
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

  buscador: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputBusqueda: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 15,
    color: '#101828',
  },

  resultadosCabecera: {
    marginTop: 25,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultadosTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },

  resultadosCantidad: {
    marginLeft: 8,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    color: '#0D9488',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarContenedor: {
    width: 52,
    height: 52,
    marginRight: 12,
    position: 'relative',
  },

  avatarFoto: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
  },

  avatarVacio: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoPunto: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#12B76A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  tarjetaInformacion: {
    flex: 1,
    marginRight: 8,
  },

  tarjetaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  nombreUsuario: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
    marginRight: 8,
  },

  fecha: {
    fontSize: 10,
    color: '#98A2B3',
  },

  solicitudFila: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  solicitudTexto: {
    marginLeft: 5,
    fontSize: 12,
    color: '#667085',
  },

  tarjetaInferior: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  estadoChat: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  estadoChatActivo: {
    backgroundColor: '#E6F4F1',
  },

  estadoChatLectura: {
    backgroundColor: '#F2F4F7',
  },

  estadoChatTexto: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
  },

  estadoChatTextoActivo: {
    color: '#0D9488',
  },

  estadoChatTextoLectura: {
    color: '#667085',
  },

  noLeidos: {
    minWidth: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },

  noLeidosTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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

  estadoContenedor: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 30,
    alignItems: 'center',
  },

  estadoTitulo: {
    marginTop: 13,
    fontSize: 17,
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