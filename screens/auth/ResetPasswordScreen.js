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
import { passwordService } from '../../services/passwordService';

export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] =
    useState('');
  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [
    mostrarConfirmarPassword,
    setMostrarConfirmarPassword,
  ] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

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
    if (
      !token.trim() ||
      !password ||
      !confirmarPassword
    ) {
      Alert.alert(
        'Campos requeridos',
        'Completa todos los campos.'
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña inválida',
        'La nueva contraseña debe contener al menos 6 caracteres.'
      );
      return false;
    }

    if (password !== confirmarPassword) {
      Alert.alert(
        'Contraseñas diferentes',
        'La nueva contraseña y su confirmación no coinciden.'
      );
      return false;
    }

    return true;
  };

  const manejarRestablecimiento = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const data =
        await passwordService.restablecerPassword(
          token,
          password
        );

      Alert.alert(
        'Contraseña actualizada',
        data?.message ||
          'Tu contraseña fue restablecida correctamente.',
        [
          {
            text: 'Iniciar sesión',
            onPress: () =>
              navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        error.message ||
        'No fue posible restablecer la contraseña.';

      Alert.alert(
        'Error de recuperación',
        mensaje
      );
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
              Nueva contraseña
            </Text>

            <Text style={styles.subtitulo}>
              Ingresa el código recibido por correo y define
              una nueva contraseña para tu cuenta.
            </Text>

            <Text style={styles.label}>
              Código de recuperación
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ingresa el código recibido"
              placeholderTextColor="#94A3B8"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!cargando}
            />

            <Text style={styles.label}>
              Nueva contraseña
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa la nueva contraseña"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                editable={!cargando}
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

            <Text style={styles.label}>
              Confirmar nueva contraseña
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirma la nueva contraseña"
                placeholderTextColor="#94A3B8"
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                secureTextEntry={!mostrarConfirmarPassword}
                autoCapitalize="none"
                editable={!cargando}
                returnKeyType="done"
                onSubmitEditing={manejarRestablecimiento}
              />

              <TouchableOpacity
                style={styles.botonOjo}
                onPress={() =>
                  setMostrarConfirmarPassword(
                    !mostrarConfirmarPassword
                  )
                }
                disabled={cargando}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    mostrarConfirmarPassword
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
              onPress={manejarRestablecimiento}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>
                  Restablecer contraseña
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.volver}
            onPress={() =>
              navigation.navigate('ForgotPassword')
            }
            disabled={cargando}
          >
            <Text style={styles.textoVolver}>
              Solicitar un nuevo código
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
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 26,
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