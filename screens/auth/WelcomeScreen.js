import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.contenido}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoTexto}>CO</Text>
          </View>

          <Text style={styles.nombreAplicacion}>ConnectaOficios</Text>

          <Text style={styles.descripcion}>
            Encuentra servicios de confianza o conecta con clientes que
            necesitan de tu trabajo.
          </Text>
        </View>

        <View style={styles.acciones}>
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotonPrincipal}>Crear cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotonSecundario}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pie}>
          Servicios y oportunidades en un solo lugar
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contenido: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoTexto: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nombreAplicacion: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 14,
  },
  descripcion: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  acciones: {
    width: '100%',
    gap: 12,
  },
  botonPrincipal: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  botonSecundario: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  textoBotonSecundario: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  pie: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 20,
  },
});