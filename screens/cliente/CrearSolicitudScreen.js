import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { solicitudService } from '../../services/solicitudService';

const HORAS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`
);

export default function CrearSolicitudScreen({ navigation, route }) {
  const servicio = route?.params?.servicio;

  const [fechaPropuesta, setFechaPropuesta] = useState('');
  const [horaAproximada, setHoraAproximada] = useState('09:00');
  const [direccion, setDireccion] = useState('');
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const limpiarFormulario = () => {
    setFechaPropuesta('');
    setHoraAproximada('09:00');
    setDireccion('');
    setDescripcionTrabajo('');
  };

  const validarFormulario = () => {
    if (!fechaPropuesta.trim()) {
      Alert.alert(
        'Fecha requerida',
        'Indica la fecha en la que necesitas el servicio.'
      );
      return false;
    }

    if (!horaAproximada) {
      Alert.alert(
        'Hora requerida',
        'Selecciona la hora aproximada.'
      );
      return false;
    }

    if (!direccion.trim()) {
      Alert.alert(
        'Direccion requerida',
        'Ingresa la direccion donde se realizara el trabajo.'
      );
      return false;
    }

    if (!descripcionTrabajo.trim()) {
      Alert.alert(
        'Descripcion requerida',
        'Describe el trabajo que necesitas.'
      );
      return false;
    }

    if (!servicio?.id) {
      Alert.alert(
        'Servicio no disponible',
        'No fue posible identificar el servicio solicitado.'
      );
      return false;
    }

    return true;
  };

  const registrarSolicitud = async () => {
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);

    try {
      await solicitudService.crear({
        servicioId: servicio.id,
        fechaPropuesta: fechaPropuesta.trim(),
        horaAproximada,
        direccion,
        descripcionTrabajo,
      });

      limpiarFormulario();

      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud se registro en estado Pendiente. El trabajador sera notificado.',
        [
          {
            text: 'Ver mis solicitudes',
            onPress: () =>
              navigation.navigate('MisSolicitudes'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'No se pudo enviar la solicitud',
        error.message ||
          'Inténtalo nuevamente en unos instantes.'
      );
    } finally {
      setEnviando(false);
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
            Nueva solicitud
          </Text>

          <Text style={styles.subtituloHeader}>
            Describe el trabajo que necesitas
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tarjetaServicio}>
            <View style={styles.iconoServicio}>
              <Ionicons
                name="briefcase-outline"
                size={22}
                color="#0D9488"
              />
            </View>

            <View style={styles.servicioTexto}>
              <Text style={styles.servicioTitulo}>
                {servicio?.nombre ||
                  'Servicio seleccionado'}
              </Text>

              <Text style={styles.servicioDescripcion}>
                {servicio?.descripcion ||
                  'Completa los datos para enviar tu solicitud.'}
              </Text>
            </View>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.label}>
              Fecha propuesta
            </Text>

            <TextInput
              style={styles.input}
              placeholder="2026-03-15"
              placeholderTextColor="#94A3B8"
              value={fechaPropuesta}
              onChangeText={setFechaPropuesta}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!enviando}
            />

            <Text style={styles.label}>
              Hora aproximada
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horasFila}
            >
              {HORAS.map((hora) => (
                <TouchableOpacity
                  key={hora}
                  style={[
                    styles.hora,
                    horaAproximada === hora &&
                      styles.horaSeleccionada,
                  ]}
                  onPress={() => setHoraAproximada(hora)}
                  disabled={enviando}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.horaTexto,
                      horaAproximada === hora &&
                        styles.horaTextoSeleccionado,
                    ]}
                  >
                    {hora}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>
              Direccion
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Colonia, calle y numero"
              placeholderTextColor="#94A3B8"
              value={direccion}
              onChangeText={setDireccion}
              editable={!enviando}
            />

            <Text style={styles.label}>
              Descripcion del trabajo
            </Text>

            <TextInput
              style={[styles.input, styles.inputMultilinea]}
              placeholder="Detalla lo que necesitas"
              placeholderTextColor="#94A3B8"
              value={descripcionTrabajo}
              onChangeText={setDescripcionTrabajo}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!enviando}
            />

            <TouchableOpacity
              style={[
                styles.boton,
                enviando && styles.botonDeshabilitado,
              ]}
              onPress={registrarSolicitud}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>
                  Enviar solicitud
                </Text>
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
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contenido: {
    padding: 20,
    paddingBottom: 36,
  },
  tarjetaServicio: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoServicio: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  servicioTexto: {
    flex: 1,
  },
  servicioTitulo: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  servicioDescripcion: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginTop: 14,
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
  inputMultilinea: {
    minHeight: 116,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  horasFila: {
    gap: 8,
    paddingBottom: 17,
  },
  hora: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  horaSeleccionada: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  horaTexto: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  horaTextoSeleccionado: {
    color: '#FFFFFF',
  },
  boton: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#0D9488',
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
});
