import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { cerrarSesion } = useAuth();

  const mostrarProximamente = (modulo) => {
    Alert.alert(
      modulo,
      'Este módulo será incorporado en los próximos avances del proyecto.'
    );
  };

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar tu sesión en ConnectaOficios?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: cerrarSesion,
        },
      ]
    );
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContenido}
      >
        <View style={styles.header}>
          <View style={styles.headerSuperior}>
            <View style={styles.marcaContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoTexto}>CO</Text>
              </View>

              <View style={styles.marcaTextoContainer}>
                <Text style={styles.marca}>
                  ConnectaOficios
                </Text>

                <Text style={styles.marcaSubtitulo}>
                  Servicios a tu alcance
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.botonSalir}
              onPress={confirmarCerrarSesion}
              activeOpacity={0.8}
            >
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
              Conecta con personas, encuentra oportunidades y gestiona tus
              servicios desde un solo lugar.
            </Text>
          </View>
        </View>

        <View style={styles.contenido}>
          <Text style={styles.seccionEtiqueta}>
            EXPLORA CONNECTAOFICIOS
          </Text>

          <Text style={styles.seccionTitulo}>
            ¿Qué deseas hacer?
          </Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() =>
                mostrarProximamente('Servicios')
              }
              activeOpacity={0.85}
            >
              <View style={styles.icono}>
                <Text style={styles.iconoTexto}>
                  S
                </Text>
              </View>

              <Text style={styles.tarjetaTitulo}>
                Servicios
              </Text>

              <Text style={styles.tarjetaDescripcion}>
                Explora los oficios y servicios disponibles.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() =>
                mostrarProximamente('Solicitudes')
              }
              activeOpacity={0.85}
            >
              <View style={styles.icono}>
                <Text style={styles.iconoTexto}>
                  SO
                </Text>
              </View>

              <Text style={styles.tarjetaTitulo}>
                Solicitudes
              </Text>

              <Text style={styles.tarjetaDescripcion}>
                Consulta y administra tus solicitudes.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() =>
                mostrarProximamente('Mensajes')
              }
              activeOpacity={0.85}
            >
              <View style={styles.icono}>
                <Text style={styles.iconoTexto}>
                  M
                </Text>
              </View>

              <Text style={styles.tarjetaTitulo}>
                Mensajes
              </Text>

              <Text style={styles.tarjetaDescripcion}>
                Mantente en contacto durante el servicio.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() =>
                mostrarProximamente('Mi perfil')
              }
              activeOpacity={0.85}
            >
              <View style={styles.icono}>
                <Text style={styles.iconoTexto}>
                  P
                </Text>
              </View>

              <Text style={styles.tarjetaTitulo}>
                Mi perfil
              </Text>

              <Text style={styles.tarjetaDescripcion}>
                Consulta y administra la información de tu cuenta.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.destacado}>
            <View style={styles.destacadoTexto}>
              <Text style={styles.destacadoEtiqueta}>
                CONNECTAOFICIOS
              </Text>

              <Text style={styles.destacadoTitulo}>
                Trabajo y confianza conectados
              </Text>

              <Text style={styles.destacadoDescripcion}>
                Una plataforma pensada para acercar clientes y trabajadores
                de forma sencilla.
              </Text>
            </View>

            <View style={styles.destacadoMarca}>
              <Text style={styles.destacadoMarcaTexto}>
                CO
              </Text>
            </View>
          </View>

          <Text style={styles.version}>
            Avance de aplicación móvil
          </Text>
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
  scrollContenido: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#12344D',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marcaContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  marcaTextoContainer: {
    flex: 1,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  logoTexto: {
    color: '#12344D',
    fontWeight: '800',
    fontSize: 15,
  },
  marca: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  marcaSubtitulo: {
    color: '#B8CBD7',
    fontSize: 11,
    marginTop: 2,
  },
  botonSalir: {
    borderWidth: 1,
    borderColor: '#527084',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  textoSalir: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bienvenida: {
    marginTop: 34,
  },
  saludo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
  },
  descripcionBienvenida: {
    color: '#D6E4EC',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 340,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 27,
  },
  seccionEtiqueta: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  seccionTitulo: {
    color: '#172B3A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
    marginBottom: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  tarjeta: {
    width: '48.5%',
    minHeight: 175,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 17,
    padding: 15,
  },
  icono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconoTexto: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '800',
  },
  tarjetaTitulo: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  tarjetaDescripcion: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  destacado: {
    backgroundColor: '#E6F4F1',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  destacadoTexto: {
    flex: 1,
    paddingRight: 10,
  },
  destacadoEtiqueta: {
    color: '#0D9488',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  destacadoTitulo: {
    color: '#12344D',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  destacadoDescripcion: {
    color: '#527084',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  destacadoMarca: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destacadoMarcaTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  version: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});