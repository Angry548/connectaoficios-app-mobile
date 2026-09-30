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

const NOTIFICACIONES_INICIALES = [
  {
    id: '1',
    tipo: 'SOLICITUD', 
    titulo: 'Solicitud Aceptada',
    mensaje: 'El trabajador Juan Pérez ha aceptado tu solicitud de plomería.',
    fecha: 'Hace 5 min',
    leida: false,
  },
  {
    id: '2',
    tipo: 'ALERTA', 
    titulo: 'Recordatorio de Servicio',
    mensaje: 'Tu servicio programado comenzará en 1 hora.',
    fecha: 'Hace 2 horas',
    leida: false,
  },
  {
    id: '3',
    tipo: 'INFO', 
    titulo: 'Perfil Actualizado',
    mensaje: 'Los cambios en tu cuenta se guardaron correctamente.',
    fecha: 'Ayer',
    leida: true,
  },
  {
    id: '4',
    tipo: 'PROMO',
    titulo: '¡Descuento disponible!',
    mensaje: 'Obtén un 15% de descuento en tu próximo servicio con el código APP2026.',
    fecha: 'Hace 3 días',
    leida: true,
  },
];

const NotificacionesClienteScreen = ({ navigation }) => {
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_INICIALES);
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

  const obtenerBadgeTipo = (tipo) => {
    switch (tipo) {
      case 'SOLICITUD':
        return { label: 'Solicitud', color: '#0D6EFD', bg: '#E7F1FF' };
      case 'ALERTA':
        return { label: 'Alerta', color: '#DC3545', bg: '#F8D7DA' };
      case 'PROMO':
        return { label: 'Promoción', color: '#198754', bg: '#D1E7DD' };
      case 'INFO':
      default:
        return { label: 'Info', color: '#6C757D', bg: '#E2E3E5' };
    }
  };

  const renderItem = ({ item }) => {
    const badge = obtenerBadgeTipo(item.tipo);

    return (
      <TouchableOpacity
        style={[styles.tarjeta, !item.leida && styles.tarjetaNoLeida]}
        onPress={() => marcarComoLeida(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.headerTarjeta}>
          <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.fechaText}>{item.fecha}</Text>
        </View>

        <Text style={[styles.tituloText, !item.leida && styles.textoNegrita]}>
          {item.titulo}
        </Text>
        <Text style={styles.mensajeText}>{item.mensaje}</Text>

        {!item.leida && <View style={styles.indicadorNoLeida} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitulo}>Sin notificaciones por ahora</Text>
      <Text style={styles.emptySubtitulo}>
        Te avisaremos aquí cuando haya novedades sobre tus solicitudes o cuenta.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.tituloPantalla}>Notificaciones</Text>
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

export default NotificacionesClienteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tituloPantalla: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
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
    borderColor: '#E9ECEF',
    position: 'relative',
  },
  tarjetaNoLeida: {
    backgroundColor: '#F0F7FF',
    borderColor: '#B6D4FE',
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