import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { conversacionService } from '../../services/conversacionService';

const formatearFecha = (valor) => {
  if (!valor) {
    return '';
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  const ahora = new Date();
  const mismoDia = fecha.toDateString() === ahora.toDateString();

  if (mismoDia) {
    return fecha.toLocaleTimeString('es-SV', {
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

export default function ConversacionesScreen({ navigation }) {
  const [conversaciones, setConversaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(null);

  const cargarConversaciones = useCallback(async () => {
    try {
      setError(null);

      const resultado = await conversacionService.listar();

      setConversaciones(resultado);
    } catch (excepcion) {
      setError(
        excepcion.message ||
          'No se pudieron cargar tus conversaciones.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  const refrescar = useCallback(async () => {
    setActualizando(true);
    await cargarConversaciones();
  }, [cargarConversaciones]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener(
      'focus',
      () => {
        setCargando(true);
        cargarConversaciones();
      }
    );

    return unsubscribe;
  }, [navigation, cargarConversaciones]);

  const abrirChat = (conversacion) => {
    navigation.navigate('Chat', {
      conversacionId: conversacion.id,
      solicitudId: conversacion.solicitudId,
      interlocutor:
        conversacion.interlocutorNombre ||
        conversacion.clienteNombre ||
        conversacion.trabajadorNombre,
      soloLectura: Boolean(conversacion.soloLectura),
    });
  };

  const reintentar = () => {
    setCargando(true);
    setError(null);
    cargarConversaciones();
  };

  const renderizarConversacion = ({ item }) => {
    const sinLeer = Number(item.mensajesNoLeidos || 0) > 0;
    const ultimoMensaje =
      item.ultimoMensaje?.contenido ||
      item.ultimoMensaje ||
      'Sin mensajes todavia';

    return (
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() => abrirChat(item)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.avatar,
            sinLeer && styles.avatarSinLeer,
          ]}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={sinLeer ? '#FFFFFF' : '#0D9488'}
          />

          {sinLeer ? (
            <View style={styles.contadorNoLeidos}>
              <Text style={styles.contadorTexto}>
                {item.mensajesNoLeidos > 99
                  ? '99+'
                  : item.mensajesNoLeidos}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.conversacionTexto}>
          <View style={styles.conversacionEncabezado}>
            <Text
              style={[
                styles.interlocutor,
                sinLeer && styles.interlocutorSinLeer,
              ]}
              numberOfLines={1}
            >
              {item.interlocutorNombre ||
                item.clienteNombre ||
                item.trabajadorNombre ||
                'Conversacion'}
            </Text>

            <Text style={styles.fecha}>
              {formatearFecha(
                item.ultimoMensaje?.fechaEnvio ||
                  item.fechaActualizacion ||
                  item.fechaCreacion
              )}
            </Text>
          </View>

          {item.solicitudId ? (
            <Text style={styles.servicio}>
              Solicitud #{String(item.solicitudId)}
            </Text>
          ) : null}

          <Text
            style={[
              styles.ultimoMensaje,
              sinLeer && styles.ultimoMensajeSinLeer,
            ]}
            numberOfLines={2}
          >
            {ultimoMensaje}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderizarVacio = () => (
    <View style={styles.estadoVacio}>
      <View style={styles.iconoVacio}>
        <Ionicons
          name="chatbubbles-outline"
          size={38}
          color="#0D9488"
        />
      </View>

      <Text style={styles.tituloVacio}>
        Todavia no tienes conversaciones
      </Text>

      <Text style={styles.textoVacio}>
        Cuando un cliente o trabajador abra un chat sobre una
        solicitud, aparecera aqui.
      </Text>
    </View>
  );

  const renderizarError = () => (
    <View style={styles.estadoVacio}>
      <View style={[styles.iconoVacio, styles.iconoError]}>
        <Ionicons
          name="cloud-offline-outline"
          size={38}
          color="#DC2626"
        />
      </View>

      <Text style={styles.tituloVacio}>
        No pudimos cargar tus conversaciones
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
  );

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
            Mis conversaciones
          </Text>

          <Text style={styles.subtituloHeader}>
            Chats asociados a tus solicitudes
          </Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text style={styles.textoCarga}>
            Cargando conversaciones...
          </Text>
        </View>
      ) : error ? (
        renderizarError()
      ) : (
        <FlatList
          style={styles.lista}
          data={conversaciones}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderizarConversacion}
          contentContainerStyle={
            conversaciones.length === 0
              ? styles.listaVacia
              : styles.listaContenido
          }
          ListEmptyComponent={renderizarVacio}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={styles.separador} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={refrescar}
              colors={['#0D9488']}
              tintColor="#0D9488"
            />
          }
        />
      )}
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
    gap: 12,
  },
  textoCarga: {
    color: '#64748B',
    fontSize: 13,
  },
  lista: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  listaContenido: {
    padding: 20,
    paddingBottom: 36,
  },
  listaVacia: {
    flexGrow: 1,
  },
  separador: {
    height: 12,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  avatarSinLeer: {
    backgroundColor: '#0D9488',
  },
  contadorNoLeidos: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contadorTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  conversacionTexto: {
    flex: 1,
  },
  conversacionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  interlocutor: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  interlocutorSinLeer: {
    fontWeight: '800',
  },
  fecha: {
    color: '#94A3B8',
    fontSize: 11,
  },
  servicio: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  ultimoMensaje: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  ultimoMensajeSinLeer: {
    color: '#334155',
    fontWeight: '700',
  },
  estadoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
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
});
