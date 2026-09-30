import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';

const NOTIFICACIONES_TRABAJADOR = [
  {
    id: '1',
    tipo: 'NUEVA_SOLICITUD', 
    titulo: '¡Nueva solicitud recibida!',
    mensaje: 'Carlos M. solicitó un servicio de Reparación Eléctrica.',
    fecha: 'Hace 2 min',
    leida: false,
    solicitudId: 'SOL-102',
  },
  {
    id: '2',
    tipo: 'CANCELACION', 
    titulo: 'Solicitud Cancelada',
    mensaje: 'El cliente ha cancelado la solicitud de Plomería #SOL-098. Motivo: Cambio de planes.',
    fecha: 'Hace 1 hora',
    leida: false,
    solicitudId: 'SOL-098',
  },
  {
    id: '3',
    tipo: 'PAGO',
    titulo: 'Pago acreditado',
    mensaje: 'Se ha procesado exitosamente el pago del servicio #SOL-085 por $45.00.',
    fecha: 'Ayer',
    leida: true,
  },
  {
    id: '4',
    tipo: 'VALORACION', 
    titulo: 'Nueva calificación recibida',
    mensaje: 'Ana G. te ha calificado con 5 estrellas ⭐ "Excelente trabajo y puntualidad".',
    fecha: 'Hace 2 días',
    leida: true,
  },
];

const NotificacionesTrabajadorScreen = ({ navigation }) => {
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_TRABAJADOR);
  const [refrescando, setRefrescando] = useState(false);

  const onRefresh = () => {
    setRefrescando(true);
    setTimeout(() => {
      setRefrescando(false);
    }, 1200);
  };

  const marcarComoLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((item) => (item.id === id ? { ...item, leida: true } : item))
    );
  };

  const obtenerConfigTipo = (tipo) => {
    switch (tipo) {
      case 'NUEVA_SOLICITUD':
        return { label: 'Nueva Solicitud', color: '#0D6EFD', bg: '#E7F1FF', esOperativa: true };
      case 'CANCELACION':
        return { label: 'Cancelada', color: '#DC3545', bg: '#F8D7DA', esOperativa: true };
      case 'PAGO':
        return { label: 'Finanzas', color: '#198754', bg: '#D1E7DD', esOperativa: false };
      case 'VALORACION':
        return { label: 'Reseña', color: '#FFC107', bg: '#FFF3CD', esOperativa: false };
      default:
        return { label: 'Sistema', color: '#6C757D', bg: '#E2E3E5', esOperativa: false };
    }
  };

  const renderItem = ({ item }) => {
    const config = obtenerConfigTipo(item.tipo);

    return (
      <TouchableOpacity
        style={[
          styles.tarjeta,
          !item.leida && styles.tarjetaNoLeida,
          config.esOperativa && styles.tarjetaOperativa,
        ]}
        onPress={() => marcarComoLeida(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.headerTarjeta}>
          <View style={[styles.badgeContainer, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.fechaText}>{item.fecha}</Text>
        </View>

        <Text style={[styles.tituloText, !item.leida && styles.textoNegrita]}>
          {item.titulo}
        </Text>
        <Text style={styles.mensajeText}>{item.mensaje}</Text>

        {/* Botón de acción directa si la notificación corresponde a una solicitud */}
        {item.solicitudId && (
          <TouchableOpacity
            style={styles.btnAccionDetalle}
            onPress={() => {
              marcarComoLeida(item.id);
              
              navigation?.navigate('DetalleSolicitudScreen', { id: item.solicitudId });
            }}
          >
            <Text style={styles.textoBtnAccion}>Ver Solicitud</Text>
          </TouchableOpacity>
        )}

        {!item.leida && <View style={styles.indicadorNoLeida} />}
      </TouchableOpacity>
    );
  };

  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛠️</Text>
      <Text style={styles.emptyTitulo}>Sin alertas de trabajo</Text>
      <Text style={styles.emptySubtitulo}>
        Aquí aparecerán las nuevas solicitudes, pagos y avisos del sistema cuando estén disponibles.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.tituloPantalla}>Panel de Eventos</Text>
          <Text style={styles.subtituloPantalla}>Notificaciones de trabajo</Text>
        </View>
        {notificaciones.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
            }
          >
            <Text style={styles.btnMarcarTodo}>Marcar leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          notificaciones.length === 0 ? styles.listaVaciaContent : styles.listaContent
        }
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={['#0D6EFD']} />
        }
      />
    </SafeAreaView>
  );
};

export default NotificacionesTrabajadorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tituloPantalla: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtituloPantalla: {
    fontSize: 12,
    color: '#6C757D',
  },
  btnMarcarTodo: {
    fontSize: 13,
    color: '#0D6EFD',
    fontWeight: '600',
  },
  listaContent: {
    padding: 16,
  },
  listaVaciaContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tarjeta: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  tarjetaNoLeida: {
    backgroundColor: '#F0F7FF',
    borderColor: '#B6D4FE',
  },
  tarjetaOperativa: {
    borderLeftWidth: 4,
    borderLeftColor: '#0D6EFD',
  },
  headerTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fechaText: {
    fontSize: 12,
    color: '#6C757D',
  },
  tituloText: {
    fontSize: 15,
    color: '#212529',
    marginBottom: 4,
  },
  textoNegrita: {
    fontWeight: 'bold',
  },
  mensajeText: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },
  btnAccionDetalle: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#0D6EFD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoBtnAccion: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  indicadorNoLeida: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D6EFD',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitulo: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
});