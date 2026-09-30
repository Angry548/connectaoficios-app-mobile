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

export default function ChangePasswordScreen({ navigation }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] =
    useState('');

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] =
    useState(false);

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
    if (!passwordActual) {
      Alert.alert(
        'Campo requerido',
        'Ingresa tu contraseña actual.'
      );
      return false;
    }

    if (!passwordNueva) {
      Alert.alert(
        'Campo requerido',
        'Ingresa una nueva contraseña.'
      );
      return false;
    }

    if (passwordNueva.length < 6) {
      Alert.alert(
        'Contraseña inválida',
        'La nueva contraseña debe contener al menos 6 caracteres.'
      );
      return false;
    }

    if (!confirmarPassword) {
      Alert.alert(
        'Campo requerido',
        'Confirma tu nueva contraseña.'
      );
      return false;
    }

    if (passwordNueva !== confirmarPassword) {
      Alert.alert(
        'Contraseñas diferentes',
        'La nueva contraseña y su confirmación no coinciden.'
      );
      return false;
    }

    if (passwordActual === passwordNueva) {
      Alert.alert(
        'Contraseña inválida',
        'La nueva contraseña debe ser diferente de la contraseña actual.'
      );
      return false;
    }

    return true;
  };

  const manejarCambio = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const data =
        await passwordService.cambiarPassword(
          passwordActual,
          passwordNueva
        );

      setPasswordActual('');
      setPasswordNueva('');
      setConfirmarPassword('');

      setMostrarActual(false);
      setMostrarNueva(false);
      setMostrarConfirmar(false);

      Alert.alert(
        'Contraseña actualizada',
        data?.message ||
          'La contraseña fue actualizada correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      let mensaje =
        'No fue posible cambiar la contraseña.';

      if (error.response?.status === 400) {
        mensaje =
          error.response?.data?.message ||
          'Verifica la contraseña actual y los datos ingresados.';
      } else if (error.response?.status === 401) {
        mensaje =
          'Tu sesión ya no es válida. Inicia sesión nuevamente.';
      } else if (error.response?.status === 403) {
        mensaje =
          'Tu cuenta no tiene permiso para realizar esta operación.';
      } else if (error.response?.status === 404) {
        mensaje =
          error.response?.data?.message ||
          'No fue posible encontrar el usuario.';
      } else if (error.response?.data?.message) {
        mensaje = error.response.data.message;
      } else if (!error.response && error.message) {
        mensaje = error.message;
      }

      Alert.alert(
        'No se pudo actualizar',
        mensaje
      );
    } finally {
      setCargando(false);
    }
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
          disabled={cargando}
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
            Seguridad
          </Text>

          <Text style={styles.subtituloHeader}>
            Protege el acceso a tu cuenta
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.contenedorFormulario}
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
          <View style={styles.tarjeta}>
            <View style={styles.iconoSeguridad}>
              <Ionicons
                name="shield-checkmark-outline"
                size={29}
                color="#0D9488"
              />
            </View>

            <Text style={styles.titulo}>
              Cambiar contraseña
            </Text>

            <Text style={styles.subtitulo}>
              Ingresa tu contraseña actual y establece una nueva
              para mantener protegida tu cuenta.
            </Text>

            <Text style={styles.label}>
              Contraseña actual
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#94A3B8"
                value={passwordActual}
                onChangeText={setPasswordActual}
                secureTextEntry={!mostrarActual}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />

              <TouchableOpacity
                style={styles.botonOjo}
                onPress={() =>
                  setMostrarActual(!mostrarActual)
                }
                disabled={cargando}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    mostrarActual
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={23}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              Nueva contraseña
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa la nueva contraseña"
                placeholderTextColor="#94A3B8"
                value={passwordNueva}
                onChangeText={setPasswordNueva}
                secureTextEntry={!mostrarNueva}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />

              <TouchableOpacity
                style={styles.botonOjo}
                onPress={() =>
                  setMostrarNueva(!mostrarNueva)
                }
                disabled={cargando}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    mostrarNueva
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={23}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.ayuda}>
              La contraseña debe contener al menos 6 caracteres.
            </Text>

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
                secureTextEntry={!mostrarConfirmar}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
                returnKeyType="done"
                onSubmitEditing={manejarCambio}
              />

              <TouchableOpacity
                style={styles.botonOjo}
                onPress={() =>
                  setMostrarConfirmar(!mostrarConfirmar)
                }
                disabled={cargando}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    mostrarConfirmar
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
                styles.botonActualizar,
                cargando &&
                  styles.botonDeshabilitado,
              ]}
              onPress={manejarCambio}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.textoBoton}>
                    Actualizar contraseña
                  </Text>
                </>
              )}
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
  contenedorFormulario: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconoSeguridad: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },
  titulo: {
    color: '#172B3A',
    fontSize: 23,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 25,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
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
  ayuda: {
    color: '#64748B',
    fontSize: 11,
    marginTop: -10,
    marginBottom: 18,
  },
  botonActualizar: {
    minHeight: 54,
    backgroundColor: '#0D9488',
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});