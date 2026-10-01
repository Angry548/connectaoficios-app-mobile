import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function PerfilTrabajadorScreen({ navigation }) {
  const { usuario, cerrarSesion } = useAuth();

  const manejarCerrarSesion = async () => {
    await cerrarSesion();
  };

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
            Ajustes
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        

        

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Seguridad
          </Text>

          <TouchableOpacity
            style={styles.opcion}
            onPress={() =>
              navigation.navigate('ChangePassword')
            }
            activeOpacity={0.8}
          >
            <View style={styles.iconoOpcion}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#0D9488"
              />
            </View>

            <View style={styles.textoOpcion}>
              <Text style={styles.tituloOpcion}>
                Cambiar contraseña
              </Text>

              <Text style={styles.descripcionOpcion}>
                Actualiza la contraseña utilizada para acceder a tu cuenta.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward-outline"
              size={21}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.botonCerrarSesion}
          onPress={manejarCerrarSesion}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#DC2626"
          />

          <Text style={styles.textoCerrarSesion}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contenido: {
    padding: 20,
    paddingBottom: 36,
  },
  perfil: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  datosPrincipales: {
    flex: 1,
  },
  nombre: {
    color: '#172B3A',
    fontSize: 18,
    fontWeight: '800',
  },
  correo: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  rolContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 9,
    gap: 4,
  },
  rol: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },
  seccion: {
    marginTop: 25,
  },
  tituloSeccion: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  opcion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  opcionSeparada: {
    marginTop: 10,
  },
  iconoOpcion: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  textoOpcion: {
    flex: 1,
    marginRight: 8,
  },
  tituloOpcion: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '800',
  },
  descripcionOpcion: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  botonCerrarSesion: {
    minHeight: 54,
    backgroundColor: '#FEF2F2',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  textoCerrarSesion: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});