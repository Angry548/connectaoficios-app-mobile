import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] =
    useState('');
  const [rolId, setRolId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [
    mostrarConfirmarPassword,
    setMostrarConfirmarPassword,
  ] = useState(false);

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

  const limpiarFormulario = () => {
    setNombre('');
    setCorreo('');
    setPassword('');
    setConfirmarPassword('');
    setRolId(null);
    setMostrarPassword(false);
    setMostrarConfirmarPassword(false);
  };

  const validarFormulario = () => {
    if (
      !nombre.trim() ||
      !correo.trim() ||
      !password ||
      !confirmarPassword
    ) {
      Alert.alert(
        'Campos requeridos',
        'Completa todos los campos para continuar.'
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

    if (password !== confirmarPassword) {
      Alert.alert(
        'Contraseñas diferentes',
        'Las contraseñas ingresadas no coinciden.'
      );
      return false;
    }

    if (!rolId) {
      Alert.alert(
        'Rol requerido',
        'Selecciona si deseas registrarte como Cliente o Trabajador.'
      );
      return false;
    }

    return true;
  };

  const registrarUsuario = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      await userService.registrar({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        password,
        rolId,
      });

      limpiarFormulario();

      Alert.alert(
        'Cuenta creada',
        'Tu registro se completó correctamente. Ya puedes iniciar sesión.',
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
        error.response?.data?.title ||
        'No se pudo completar el registro. Inténtalo nuevamente.';

      Alert.alert('Error de registro', mensaje);
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
          <View style={styles.encabezado}>
            <Text style={styles.etiquetaMarca}>
              CONNECTAOFICIOS
            </Text>

            <Text style={styles.titulo}>
              Crea tu cuenta
            </Text>

            <Text style={styles.subtitulo}>
              Elige cómo deseas formar parte de nuestra comunidad.
            </Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.label}>
              Nombre completo
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Tu nombre completo"
              placeholderTextColor="#94A3B8"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              editable={!cargando}
              returnKeyType="next"
            />

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
                placeholder="Crea una contraseña"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
                editable={!cargando}
                returnKeyType="next"
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
              Confirmar contraseña
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#94A3B8"
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
                secureTextEntry={!mostrarConfirmarPassword}
                autoCapitalize="none"
                editable={!cargando}
                returnKeyType="done"
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

            <Text style={styles.label}>
              Quiero utilizar ConnectaOficios como
            </Text>

            <View style={styles.roles}>
              <TouchableOpacity
                style={[
                  styles.rol,
                  rolId === 1 && styles.rolSeleccionado,
                ]}
                onPress={() => setRolId(1)}
                disabled={cargando}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.indicadorRol,
                    rolId === 1 &&
                      styles.indicadorRolSeleccionado,
                  ]}
                >
                  <Text
                    style={[
                      styles.numeroRol,
                      rolId === 1 &&
                        styles.numeroRolSeleccionado,
                    ]}
                  >
                    C
                  </Text>
                </View>

                <Text
                  style={[
                    styles.rolTitulo,
                    rolId === 1 &&
                      styles.rolTituloSeleccionado,
                  ]}
                >
                  Cliente
                </Text>

                <Text style={styles.rolDescripcion}>
                  Necesito contratar servicios.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rol,
                  rolId === 2 && styles.rolSeleccionado,
                ]}
                onPress={() => setRolId(2)}
                disabled={cargando}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.indicadorRol,
                    rolId === 2 &&
                      styles.indicadorRolSeleccionado,
                  ]}
                >
                  <Text
                    style={[
                      styles.numeroRol,
                      rolId === 2 &&
                        styles.numeroRolSeleccionado,
                    ]}
                  >
                    T
                  </Text>
                </View>

                <Text
                  style={[
                    styles.rolTitulo,
                    rolId === 2 &&
                      styles.rolTituloSeleccionado,
                  ]}
                >
                  Trabajador
                </Text>

                <Text style={styles.rolDescripcion}>
                  Quiero ofrecer mis servicios.
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.boton,
                cargando && styles.botonDeshabilitado,
              ]}
              onPress={registrarUsuario}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>
                  Crear mi cuenta
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.textoSecundario}>
                ¿Ya tienes una cuenta?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Login')
                }
                disabled={cargando}
              >
                <Text style={styles.enlace}>
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  encabezado: {
    marginBottom: 22,
  },
  etiquetaMarca: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  titulo: {
    color: '#172B3A',
    fontSize: 29,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    minHeight: 51,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#172B3A',
    fontSize: 15,
    marginBottom: 17,
  },
  passwordContainer: {
    minHeight: 51,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  passwordInput: {
    flex: 1,
    minHeight: 49,
    paddingLeft: 14,
    paddingRight: 8,
    color: '#172B3A',
    fontSize: 15,
  },
  botonOjo: {
    width: 50,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
    marginBottom: 22,
  },
  rol: {
    flex: 1,
    minHeight: 142,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 13,
  },
  rolSeleccionado: {
    backgroundColor: '#ECFDF9',
    borderColor: '#0D9488',
    borderWidth: 2,
  },
  indicadorRol: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  indicadorRolSeleccionado: {
    backgroundColor: '#0D9488',
  },
  numeroRol: {
    color: '#475569',
    fontWeight: '800',
  },
  numeroRolSeleccionado: {
    color: '#FFFFFF',
  },
  rolTitulo: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  rolTituloSeleccionado: {
    color: '#0F766E',
  },
  rolDescripcion: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  boton: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 22,
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
});