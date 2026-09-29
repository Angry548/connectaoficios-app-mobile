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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { userService } from '../../services/userService';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [rolId, setRolId] = useState(null);
  const [cargando, setCargando] = useState(false);

  const limpiarFormulario = () => {
    setNombre('');
    setCorreo('');
    setPassword('');
    setConfirmarPassword('');
    setRolId(null);
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
      const datosUsuario = {
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        password,
        rolId,
      };

      await userService.registrar(datosUsuario);

      limpiarFormulario();

      Alert.alert(
        'Registro exitoso',
        'Tu cuenta fue creada correctamente. Ahora puedes iniciar sesión.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.navigate('Login'),
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.encabezado}>
            <Text style={styles.titulo}>Crear cuenta</Text>
            <Text style={styles.subtitulo}>
              Regístrate para comenzar a utilizar ConnectaOficios
            </Text>
          </View>

          <View style={styles.formulario}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre completo"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              editable={!cargando}
            />

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
            />

            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirma tu contraseña"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!cargando}
            />

            <Text style={styles.label}>Tipo de usuario</Text>

            <View style={styles.roles}>
              <TouchableOpacity
                style={[
                  styles.rol,
                  rolId === 1 && styles.rolSeleccionado,
                ]}
                onPress={() => setRolId(1)}
                disabled={cargando}
              >
                <Text
                  style={[
                    styles.rolTitulo,
                    rolId === 1 && styles.rolTextoSeleccionado,
                  ]}
                >
                  Cliente
                </Text>
                <Text
                  style={[
                    styles.rolDescripcion,
                    rolId === 1 && styles.rolTextoSeleccionado,
                  ]}
                >
                  Quiero contratar servicios
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rol,
                  rolId === 2 && styles.rolSeleccionado,
                ]}
                onPress={() => setRolId(2)}
                disabled={cargando}
              >
                <Text
                  style={[
                    styles.rolTitulo,
                    rolId === 2 && styles.rolTextoSeleccionado,
                  ]}
                >
                  Trabajador
                </Text>
                <Text
                  style={[
                    styles.rolDescripcion,
                    rolId === 2 && styles.rolTextoSeleccionado,
                  ]}
                >
                  Quiero ofrecer mis servicios
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.botonRegistrar,
                cargando && styles.botonDeshabilitado,
              ]}
              onPress={registrarUsuario}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonRegistrar}>
                  Crear cuenta
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.iniciarSesionContainer}>
              <Text style={styles.textoCuenta}>
                ¿Ya tienes una cuenta?{' '}
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={cargando}
              >
                <Text style={styles.enlace}>Iniciar sesión</Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContenido: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  encabezado: {
    marginBottom: 30,
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
  roles: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  rol: {
    flex: 1,
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
  },
  rolSeleccionado: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  rolTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  rolDescripcion: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  rolTextoSeleccionado: {
    color: '#FFFFFF',
  },
  botonRegistrar: {
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
  textoBotonRegistrar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iniciarSesionContainer: {
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
});