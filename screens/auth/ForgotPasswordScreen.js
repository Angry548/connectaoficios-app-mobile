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
import { passwordService } from '../../services/passwordService';

export default function ForgotPasswordScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
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
    if (!correo.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa tu correo electrónico.'
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

  const manejarSolicitud = async () => {
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const data =
        await passwordService.solicitarRecuperacion(correo);

      Alert.alert(
        'Solicitud enviada',
        data?.message ||
          'Si existe una cuenta asociada al correo indicado, recibirás instrucciones para restablecer la contraseña.',
        [
          {
            text: 'Continuar',
            onPress: () =>
              navigation.navigate('ResetPassword'),
          },
        ]
      );
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        error.message ||
        'No fue posible procesar la solicitud.';

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
              Recupera tu cuenta
            </Text>

            <Text style={styles.subtitulo}>
              Ingresa el correo asociado a tu cuenta y te
              enviaremos un código temporal de recuperación.
            </Text>

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
              returnKeyType="done"
              onSubmitEditing={manejarSolicitud}
            />

            <TouchableOpacity
              style={[
                styles.boton,
                cargando && styles.botonDeshabilitado,
              ]}
              onPress={manejarSolicitud}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>
                  Enviar código
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.informacion}>
              Por seguridad, no indicaremos si el correo está
              registrado en la plataforma.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.volver}
            onPress={() => navigation.navigate('Login')}
            disabled={cargando}
          >
            <Text style={styles.textoVolver}>
              Volver al inicio de sesión
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
  boton: {
    minHeight: 54,
    backgroundColor: '#0D9488',
    borderRadius: 13,
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
  informacion: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 18,
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