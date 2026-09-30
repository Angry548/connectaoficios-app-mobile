import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { conversacionService } from '../../services/conversacionService';
import { mensajeService } from '../../services/mensajeService';

const formatearHora = (valor) => {
  if (!valor) {
    return '';
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  return fecha.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatearSeparador = (valor) => {
  if (!valor) {
    return '';
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  const ahora = new Date();

  if (fecha.toDateString() === ahora.toDateString()) {
    return 'Hoy';
  }

  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);

  if (fecha.toDateString() === ayer.toDateString()) {
    return 'Ayer';
  }

  return fecha.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function ChatScreen({ navigation, route }) {
  const { usuario } = useAuth();

  const conversacionIdParam = route?.params?.conversacionId;
  const solicitudIdParam = route?.params?.solicitudId;
  const soloLecturaParam = route?.params?.soloLectura ?? false;

  const [conversacionId, setConversacionId] = useState(
    conversacionIdParam ?? null
  );
  const [interlocutor, setInterlocutor] = useState(
    route?.params?.interlocutor || 'Conversacion'
  );
  const [mensajes, setMensajes] = useState([]);
  const [contenido, setContenido] = useState('');
  const [soloLectura, setSoloLectura] = useState(soloLecturaParam);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const listaRef = useRef(null);
  const_intervaloRef = useRef(null);

  const usuarioId = usuario?.id ? Number(usuario.id) : null;

  const marcarLeidos = useCallback(async (id) => {
    try {
      await mensajeService.marcarConversacionLeida(id);
    } catch {
      // El marcado de leidos no debe interrumpir la navegacion.
    }
  }, []);

  const cargarMensajes = useCallback(
    async (id) => {
      if (!id) {
        return;
      }

      try {
        const historial =
          await mensajeService.listarPorConversacion(id);

        setMensajes(historial);
        setError(null);
      } catch (excepcion) {
        setError(
          excepcion.message ||
            'No se pudo cargar el historial de mensajes.'
        );
      }
    },
    []
  );

  const resolverConversacion = useCallback(async () => {
    if (conversacionId) {
      return conversacionId;
    }

    if (!solicitudIdParam) {
      throw new Error(
        'No fue posible identificar la conversación solicitada.'
      );
    }

    const conversacion =
      await conversacionService.obtenerPorSolicitud(
        solicitudIdParam
      );

    if (!conversacion?.id) {
      throw new Error(
        'No se encontró una conversación para esta solicitud.'
      );
    }

    setConversacionId(conversacion.id);

    if (conversacion.interlocutorNombre) {
      setInterlocutor(conversacion.interlocutorNombre);
    }

    if (conversacion.soloLectura !== undefined) {
      setSoloLectura(Boolean(conversacion.soloLectura));
    }

    return conversacion.id;
  }, [conversacionId, solicitudIdParam]);

  const inicializar = useCallback(async () => {
    setCargando(true);

    try {
      const id = await resolverConversacion();

      await cargarMensajes(id);
      await marcarLeidos(id);
    } catch (excepcion) {
      setError(
        excepcion.message ||
          'No se pudo abrir la conversación.'
      );
    } finally {
      setCargando(false);
    }
  }, [resolverConversacion, cargarMensajes, marcarLeidos]);

  useEffect(() => {
    inicializar();
  }, [inicializar]);

  useEffect(() => {
    if (!conversacionId || cargando) {
      return;
    }

    // Sondeo periodico como alternativa diferida al canal en tiempo
    // real, que sera habilitado cuando la API lo publique.
    _intervaloRef.current = setInterval(() => {
      cargarMensajes(conversacionId);
    }, 15000);

    return () => {
      if (_intervaloRef.current) {
        clearInterval(_intervaloRef.current);
        _intervaloRef.current = null;
      }
    };
  }, [conversacionId, cargando, cargarMensajes]);

  const enviarMensaje = async () => {
    const texto = contenido.trim();

    if (!texto) {
      return;
    }

    if (!conversacionId) {
      return;
    }

    setEnviando(true);

    try {
      const mensaje = await mensajeService.enviar(
        conversacionId,
        texto
      );

      setMensajes((previos) => [...previos, mensaje]);
      setContenido('');
    } catch (excepcion) {
      Alert.alert(
        'No se pudo enviar el mensaje',
        excepcion.message ||
          'Inténtalo nuevamente en unos instantes.'
      );
    } finally {
      setEnviando(false);
    }
  };

  const reintentar = () => {
    setError(null);
    setCargando(true);
    inicializar();
  };

  const esPropio = (mensaje) => {
    if (mensaje.remitenteId !== undefined && usuarioId) {
      return Number(mensaje.remitenteId) === usuarioId;
    }

    return Boolean(mensaje.mio ?? mensaje.propio);
  };

  const renderizarMensaje = ({ item, index }) => {
    const propio = esPropio(item);
    const anterior = mensajes[index - 1];
    const nuevoDia =
      !anterior ||
      formatearSeparador(anterior.fechaEnvio) !==
        formatearSeparador(item.fechaEnvio);

    return (
      <View>
        {nuevoDia ? (
          <View style={styles.contenedorSeparador}>
            <Text style={styles.separadorFecha}>
              {formatearSeparador(item.fechaEnvio)}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.burbuja,
            propio ? styles.burbujaPropia : styles.burbujaAjena,
          ]}
        >
          <Text
            style={[
              styles.mensajeTexto,
              propio && styles.mensajeTextoPropio,
            ]}
          >
            {item.contenido}
          </Text>

          <Text
            style={[
              styles.mensajeHora,
              propio && styles.mensajeHoraPropia,
            ]}
          >
            {formatearHora(item.fechaEnvio)}
          </Text>
        </View>
      </View>
    );
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
            Abriendo conversación...
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
            No pudimos abrir el chat
          </Text>

          <Text style={styles.textoVacio}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={reintentar}
            activeOpacity={0.85}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.textoBotonReintentar}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

        <View style={styles.avatar}>
          <Ionicons
            name="person-outline"
            size={20}
            color="#0D9488"
          />
        </View>

        <View style={styles.headerTexto}>
          <Text
            style={styles.tituloHeader}
            numberOfLines={1}
          >
            {interlocutor}
          </Text>

          <Text style={styles.subtituloHeader}>
            {solicitudIdParam
              ? `Solicitud #${String(solicitudIdParam)}`
              : 'Conversacion'}
          </Text>
        </View>
      </View>

      {soloLectura ? (
        <View style={styles.avisoSoloLectura}>
          <Ionicons
            name="lock-closed-outline"
            size={15}
            color="#92400E"
          />

          <Text style={styles.textoAviso}>
            Esta conversación está en modo solo lectura.
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listaRef}
          style={styles.lista}
          data={mensajes}
          keyExtractor={(item, index) =>
            String(item.id ?? `mensaje-${index}`)
          }
          renderItem={renderizarMensaje}
          contentContainerStyle={
            mensajes.length === 0
              ? styles.listaVacia
              : styles.listaContenido
          }
          ListEmptyComponent={
            <View style={styles.estadoVacio}>
              <View style={styles.iconoVacio}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={38}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloVacio}>
                Aún no hay mensajes
              </Text>

              <Text style={styles.textoVacio}>
                Escribe el primer mensaje para coordinar los
                detalles del trabajo.
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            listaRef.current?.scrollToEnd({
              animated: true,
            })
          }
          showsVerticalScrollIndicator={false}
        />

        {soloLectura ? null : (
          <View style={styles.barraEscritura}>
            <View style={styles.inputContenedor}>
              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje"
                placeholderTextColor="#94A3B8"
                value={contenido}
                onChangeText={setContenido}
                multiline
                maxLength={2000}
                editable={!enviando}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.botonEnviar,
                (enviando || !contenido.trim()) &&
                  styles.botonEnviarDeshabilitado,
              ]}
              onPress={enviarMensaje}
              disabled={enviando || !contenido.trim()}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
    paddingBottom: 18,
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#1E506B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTexto: {
    flex: 1,
  },
  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  subtituloHeader: {
    color: '#D6E4EC',
    fontSize: 11,
    marginTop: 2,
  },
  avisoSoloLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textoAviso: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
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
  lista: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listaContenido: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  listaVacia: {
    flexGrow: 1,
  },
  contenedorSeparador: {
    alignItems: 'center',
    marginVertical: 14,
  },
  separadorFecha: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  burbuja: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 17,
    marginBottom: 8,
  },
  burbujaPropia: {
    alignSelf: 'flex-end',
    backgroundColor: '#0D9488',
    borderBottomRightRadius: 5,
  },
  burbujaAjena: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 5,
  },
  mensajeTexto: {
    color: '#172B3A',
    fontSize: 14,
    lineHeight: 20,
  },
  mensajeTextoPropio: {
    color: '#FFFFFF',
  },
  mensajeHora: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  mensajeHoraPropia: {
    color: '#E6FFFB',
    textAlign: 'right',
  },
  estadoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconoVacio: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginTop: 7,
  },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 20,
  },
  textoBotonReintentar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  barraEscritura: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  inputContenedor: {
    flex: 1,
    minHeight: 46,
    maxHeight: 130,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 23,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    color: '#172B3A',
    fontSize: 14,
    paddingVertical: 12,
  },
  botonEnviar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonEnviarDeshabilitado: {
    opacity: 0.45,
  },
});
