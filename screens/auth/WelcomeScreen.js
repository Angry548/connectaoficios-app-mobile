import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#12344D" />

      <View style={styles.hero}>
        <View style={styles.decoracionUno} />
        <View style={styles.decoracionDos} />

        <View style={styles.marca}>
          <View style={styles.logo}>
            <Text style={styles.logoTexto}>CO</Text>
          </View>

          <Text style={styles.nombreAplicacion}>ConnectaOficios</Text>

          <Text style={styles.eslogan}>
            El oficio que necesitas, más cerca de ti
          </Text>
        </View>
      </View>

      <View style={styles.contenido}>
        <View>
          <Text style={styles.titulo}>
            Conectamos necesidades con talento
          </Text>

          <Text style={styles.descripcion}>
            Encuentra trabajadores para los servicios que necesitas o
            promociona tu experiencia y conecta con nuevos clientes.
          </Text>

          <View style={styles.beneficios}>
            <View style={styles.beneficio}>
              <View style={styles.iconoBeneficio}>
                <Text style={styles.iconoTexto}>01</Text>
              </View>

              <View style={styles.beneficioContenido}>
                <Text style={styles.beneficioTitulo}>
                  Encuentra servicios
                </Text>

                <Text style={styles.beneficioDescripcion}>
                  Conecta con trabajadores según tus necesidades.
                </Text>
              </View>
            </View>

            <View style={styles.beneficio}>
              <View style={styles.iconoBeneficio}>
                <Text style={styles.iconoTexto}>02</Text>
              </View>

              <View style={styles.beneficioContenido}>
                <Text style={styles.beneficioTitulo}>
                  Ofrece tu trabajo
                </Text>

                <Text style={styles.beneficioDescripcion}>
                  Presenta tus servicios y encuentra nuevos clientes.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.acciones}>
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotonPrincipal}>
              Crear una cuenta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.textoBotonSecundario}>
              Ya tengo una cuenta
            </Text>
          </TouchableOpacity>

          <Text style={styles.pie}>
            Servicios, oportunidades y confianza en un solo lugar.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  hero: {
    height: '37%',
    minHeight: 270,
    backgroundColor: '#12344D',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  decoracionUno: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#1E506B',
    top: -70,
    right: -50,
  },
  decoracionDos: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#0D9488',
    bottom: -55,
    left: -35,
  },
  marca: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoTexto: {
    color: '#12344D',
    fontSize: 28,
    fontWeight: '800',
  },
  nombreAplicacion: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  eslogan: {
    color: '#D6E4EC',
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center',
  },
  contenido: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  titulo: {
    color: '#172B3A',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
  },
  descripcion: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  beneficios: {
    marginTop: 22,
    gap: 14,
  },
  beneficio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoBeneficio: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  iconoTexto: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '800',
  },
  beneficioContenido: {
    flex: 1,
  },
  beneficioTitulo: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '700',
  },
  beneficioDescripcion: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  acciones: {
    marginTop: 28,
  },
  botonPrincipal: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundario: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 11,
  },
  textoBotonSecundario: {
    color: '#12344D',
    fontSize: 16,
    fontWeight: '700',
  },
  pie: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 15,
  },
});