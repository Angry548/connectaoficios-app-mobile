import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BrandMark from './BrandMark';
import { useAuth } from '../context/AuthContext';

export default function HomeDashboard({ navigation, profesional = false, destacado, opciones }) {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre?.trim();
  const abrir = ruta => navigation.navigate(ruta);
  return (
    <SafeAreaView style={styles.contenedor} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#12344D" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.marca}>
            <BrandMark size={42} />
            <View style={styles.marcaTexto}>
              <Text style={styles.nombreMarca}>ConnectaOficios</Text>
              <Text style={styles.rol}>{profesional ? 'Tu espacio de trabajo' : 'Servicios y confianza'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Ajustes" style={styles.ajustes}
              onPress={() => abrir(profesional ? 'PerfilTrabajador' : 'AjustesCliente')}>
              <Ionicons name="settings-outline" size={23} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.saludo}>{nombre ? `Hola, ${nombre}` : '¡Bienvenido!'}</Text>
          <Text style={styles.subtitulo}>{profesional
            ? 'Gestiona tu trabajo y conecta con nuevos clientes.'
            : '¿Qué servicio necesitas hoy?'}</Text>
        </View>
        <View style={styles.seccion}>
          <Text style={styles.titulo}>{profesional ? 'Impulsa tu trabajo' : 'Descubre talento'}</Text>
          <Pressable accessibilityRole="button" style={styles.destacado} onPress={() => abrir(destacado.ruta)}>
            <Ionicons name={destacado.icono} size={30} color="#FFFFFF" />
            <View style={styles.destacadoTexto}>
              <Text style={styles.destacadoTitulo}>{destacado.titulo}</Text>
              <Text style={styles.destacadoDescripcion}>{destacado.descripcion}</Text>
            </View>
            <Ionicons name="arrow-forward-outline" size={23} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.tituloHerramientas}>{profesional ? 'Herramientas para tu día' : 'Al día con tu cuenta'}</Text>
          {opciones.map(opcion => (
            <Pressable accessibilityRole="button" key={opcion.ruta} style={styles.tarjeta} onPress={() => abrir(opcion.ruta)}>
              <View style={styles.icono}><Ionicons name={opcion.icono} size={23} color="#0D9488" /></View>
              <View style={styles.tarjetaTexto}>
                <Text style={styles.tarjetaTitulo}>{opcion.titulo}</Text>
                <Text style={styles.descripcion}>{opcion.descripcion}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#94A3B8" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#12344D' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: { paddingBottom: 24 },
  header: { backgroundColor: '#12344D', padding: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  marca: { flexDirection: 'row', alignItems: 'center' },
  marcaTexto: { flex: 1, marginLeft: 12 },
  nombreMarca: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  rol: { color: '#D6E4EC', fontSize: 12, marginTop: 2 },
  ajustes: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#1E506B', marginLeft: 8 },
  saludo: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 23 },
  subtitulo: { color: '#D6E4EC', fontSize: 14, lineHeight: 21, marginTop: 6 },
  seccion: { padding: 20 },
  titulo: { fontSize: 21, fontWeight: '800', color: '#172B3A', marginBottom: 14 },
  destacado: { backgroundColor: '#0D9488', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center' },
  destacadoTexto: { flex: 1, marginHorizontal: 14 },
  destacadoTitulo: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  destacadoDescripcion: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, marginTop: 5 },
  tituloHerramientas: { fontSize: 17, fontWeight: '700', color: '#172B3A', marginTop: 25, marginBottom: 13 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 17, padding: 16, marginBottom: 12 },
  icono: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4F1', marginRight: 13 },
  tarjetaTexto: { flex: 1, marginRight: 8 },
  tarjetaTitulo: { fontSize: 15, fontWeight: '700', color: '#172B3A' },
  descripcion: { fontSize: 12, lineHeight: 18, color: '#64748B', marginTop: 4 },
});
