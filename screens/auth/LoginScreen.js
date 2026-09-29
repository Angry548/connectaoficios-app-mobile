import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { iniciarSesion } = useAuth();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const validarFormulario = () => {
    if (!correo.trim() || !password) {
      Alert.alert(
        'Campos requeridos',
        'Ingresa tu correo electrónico y contraseña.'
      );
      return false;
    }

    if (!correo.includes('@')) {
      Alert.alert(
        'Correo inválido',
        'Ingresa una dirección de correo electrónico válida.'
      );
      return false;
    }

    return true;
  };

  const manejarLogin = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      await authService.login(
        correo.trim().toLowerCase(),
        password
      );

      iniciarSesion();
    } catch (error) {
      let mensaje =
        'No fue posible iniciar sesión. Verifica tus credenciales.';

      if (!error.response) {
        mensaje =
          error.message ||
          'No fue posible establecer conexión con el servidor.';
      } else if (error.response.status === 401) {
        mensaje = 'Correo o contraseña incorrectos.';
      } else {
        mensaje =
          error.response?.data?.message ||
          error.response?.data?.mensaje ||
          error.response?.data?.title ||
          mensaje;
      }

      Alert.alert('Error de inicio de sesión', mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>Iniciar sesión</Text>

            <Text style={styles.subtitulo}>
              Ingresa a tu cuenta de ConnectaOficios
            </Text>
          </View>

          <View style={styles.formulario}>
            <Text style={styles.label}>Correo electrónico</Text>

            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!cargando}
            />

            <Text style={styles.label}>Contraseña</Text>

            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!cargando}
              onSubmitEditing={manejarLogin}
            />

            <TouchableOpacity
              style={[
                styles.botonLogin,
                cargando && styles.botonDeshabilitado,
              ]}
              onPress={manejarLogin}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonLogin}>
                  Iniciar sesión
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.registroContainer}>
              <Text style={styles.textoCuenta}>
                ¿No tienes una cuenta?{' '}
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={cargando}
              >
                <Text style={styles.enlace}>Crear cuenta</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.volverContainer}
              onPress={() => navigation.navigate('Welcome')}
              disabled={cargando}
            >
              <Text style={styles.enlaceVolver}>
                Volver a la bienvenida
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  encabezado: {
    marginBottom: 32,
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  formulario: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#111827',
    marginBottom: 18,
  },
  botonLogin: {
    minHeight: 52,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  textoBotonLogin: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  textoCuenta: {
    color: '#6B7280',
    fontSize: 14,
  },
  enlace: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  volverContainer: {
    alignItems: 'center',
    marginTop: 18,
  },
  enlaceVolver: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});