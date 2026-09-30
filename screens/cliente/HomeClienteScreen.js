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

export default function HomeClienteScreen({ navigation }) {
  const { cerrarSesion } = useAuth();

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerSuperior}>
            <View style={styles.marca}>
              <View style={styles.logo}>
                <Text style={styles.logoTexto}>CO</Text>
              </View>

              <View style={styles.marcaTexto}>
                <Text style={styles.nombreAplicacion}>
                  ConnectaOficios
                </Text>

                <Text style={styles.tipoCuenta}>
                  Cuenta de cliente
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botonSalir}
              onPress={manejarCerrarSesion}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.textoSalir}>
                Salir
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bienvenida}>
            <Text style={styles.saludo}>
              ¡Bienvenido!
            </Text>

            <Text style={styles.descripcionBienvenida}>
              Encuentra el servicio que necesitas y conecta con
              trabajadores.
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            ¿Qué necesitas?
          </Text>

          <Text style={styles.descripcionSeccion}>
            Explora las principales opciones disponibles para tu cuenta.
          </Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() =>
                navigation.navigate('BuscarServicios')
              }
              activeOpacity={0.8}
            >
              <View style={styles.icono}>
                <Ionicons
                  name="search-outline"
                  size={25}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloTarjeta}>
                Buscar servicios
              </Text>

              <Text style={styles.descripcionTarjeta}>
                Encuentra trabajadores y servicios según tus necesidades.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjeta}
              activeOpacity={0.8}
            >
              <View style={styles.icono}>
                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloTarjeta}>
                Mis solicitudes
              </Text>

              <Text style={styles.descripcionTarjeta}>
                Consulta los servicios que has solicitado.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjeta}
              activeOpacity={0.8}
            >
              <View style={styles.icono}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={25}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloTarjeta}>
                Mensajes
              </Text>

              <Text style={styles.descripcionTarjeta}>
                Mantén comunicación con los trabajadores.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() =>
                navigation.navigate('PerfilCliente')
              }
              activeOpacity={0.8}
            >
              <View style={styles.icono}>
                <Ionicons
                  name="person-outline"
                  size={25}
                  color="#0D9488"
                />
              </View>

              <Text style={styles.tituloTarjeta}>
                Mi perfil
              </Text>

              <Text style={styles.descripcionTarjeta}>
                Consulta la información asociada a tu cuenta.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tarjetaDestacada}>
          <View style={styles.iconoDestacado}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.contenidoDestacado}>
            <Text style={styles.tituloDestacado}>
              Encuentra talento para tus necesidades
            </Text>

            <Text style={styles.descripcionDestacada}>
              ConnectaOficios te permite conectar con trabajadores y
              gestionar tus solicitudes desde un solo lugar.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12344D',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contenido: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#12344D',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marca: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  logoTexto: {
    color: '#12344D',
    fontSize: 17,
    fontWeight: '800',
  },
  marcaTexto: {
    flex: 1,
  },
  nombreAplicacion: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  tipoCuenta: {
    color: '#D6E4EC',
    fontSize: 12,
    marginTop: 2,
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E506B',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 11,
    gap: 5,
  },
  textoSalir: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bienvenida: {
    marginTop: 31,
  },
  saludo: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  descripcionBienvenida: {
    color: '#D6E4EC',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 330,
  },
  seccion: {
    paddingHorizontal: 20,
    paddingTop: 27,
  },
  tituloSeccion: {
    color: '#172B3A',
    fontSize: 21,
    fontWeight: '800',
  },
  descripcionSeccion: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  tarjeta: {
    width: '48%',
    minHeight: 172,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  tituloTarjeta: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  descripcionTarjeta: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  tarjetaDestacada: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  iconoDestacado: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contenidoDestacado: {
    flex: 1,
  },
  tituloDestacado: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  descripcionDestacada: {
    color: '#E6FFFB',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});