import React, { useEffect, useState } from 'react';
import {
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
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { iniciarSesion } = useAuth();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    const mostrarTeclado = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setAlturaTeclado(event.endCoordinates.height);
      }
    );

    const ocultarTeclado = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setAlturaTeclado(0);
      }
    );

    return () => {
      mostrarTeclado.remove();
      ocultarTeclado.remove();
    };
  }, []);

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

      await iniciarSesion();
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContenido,
            alturaTeclado > 0 && {
              paddingBottom: alturaTeclado + 24,
            },
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.marca}>
            <View style={styles.logo}>
              <Text style={styles.logoTexto}>CO</Text>
            </View>

            <Text style={styles.nombreMarca}>
              ConnectaOficios
            </Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.titulo}>
              Bienvenido de nuevo
            </Text>

            <Text style={styles.subtitulo}>
              Ingresa a tu cuenta para continuar.
            </Text>

            <View style={styles.formulario}>
              <Text style={styles.label}>
                Correo electrónico
              </Text>

              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94A3B8"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
                returnKeyType="next"
              />

              <Text style={styles.label}>
                Contraseña
              </Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!mostrarPassword}
                  autoCapitalize="none"
                  editable={!cargando}
                  returnKeyType="done"
                  onSubmitEditing={manejarLogin}
                />

                <TouchableOpacity
                  style={styles.botonOjo}
                  onPress={() =>
                    setMostrarPassword(!mostrarPassword)
                  }
                  disabled={cargando}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      mostrarPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={23}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.boton,
                  cargando && styles.botonDeshabilitado,
                ]}
                onPress={manejarLogin}
                disabled={cargando}
                activeOpacity={0.85}
              >
                {cargando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoBoton}>
                    Iniciar sesión
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.registroContainer}>
              <Text style={styles.textoSecundario}>
                ¿Aún no tienes una cuenta?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Register')
                }
                disabled={cargando}
              >
                <Text style={styles.enlace}>
                  Crear cuenta
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.volver}
            onPress={() =>
              navigation.navigate('Welcome')
            }
            disabled={cargando}
          >
            <Text style={styles.textoVolver}>
              Volver a la bienvenida
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  marca: {
    alignItems: 'center',
    marginBottom: 27,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#12344D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTexto: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  nombreMarca: {
    color: '#12344D',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titulo: {
    color: '#172B3A',
    fontSize: 25,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 26,
  },
  formulario: {
    width: '100%',
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#172B3A',
    fontSize: 15,
    marginBottom: 18,
  },
  passwordContainer: {
    minHeight: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    paddingLeft: 14,
    paddingRight: 8,
    color: '#172B3A',
    fontSize: 15,
  },
  botonOjo: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boton: {
    minHeight: 54,
    backgroundColor: '#0D9488',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registroContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  textoSecundario: {
    color: '#64748B',
    fontSize: 13,
  },
  enlace: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  volver: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  textoVolver: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});