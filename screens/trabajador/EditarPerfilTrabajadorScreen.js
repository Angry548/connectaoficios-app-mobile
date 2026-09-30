import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import perfilTrabajadorService from '../../services/perfilTrabajadorService';

export default function EditarPerfilTrabajadorScreen({
  navigation,
}) {
  const { usuario } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [perfilExistente, setPerfilExistente] = useState(false);

  const [oficioPrincipal, setOficioPrincipal] = useState('');
  const [descripcionProfesional, setDescripcionProfesional] =
    useState('');
  const [experienciaLaboral, setExperienciaLaboral] =
    useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [zonaPrincipalId, setZonaPrincipalId] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, [usuario?.id]);

  const cargarPerfil = async () => {
    try {
      setCargando(true);

      if (!usuario?.id) {
        return;
      }

      const data =
        await perfilTrabajadorService.obtenerPerfilPorTrabajador(
          usuario.id
        );

      setPerfilExistente(true);

      setOficioPrincipal(data.oficioPrincipal || '');
      setDescripcionProfesional(
        data.descripcionProfesional || ''
      );
      setExperienciaLaboral(
        data.experienciaLaboral || ''
      );
      setFotoUrl(data.fotoUrl || '');

      setZonaPrincipalId(
        data.zonaPrincipalId
          ? String(data.zonaPrincipalId)
          : ''
      );
    } catch (error) {
      if (error.response?.status === 404) {
        setPerfilExistente(false);
      } else {
        console.log(
          'Error al cargar perfil para editar:',
          error
        );

        Alert.alert(
          'Error',
          'No fue posible cargar la información del perfil.'
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const validarFormulario = () => {
    if (!oficioPrincipal.trim()) {
      Alert.alert(
        'Campo obligatorio',
        'El oficio principal es obligatorio.'
      );
      return false;
    }

    if (oficioPrincipal.trim().length > 100) {
      Alert.alert(
        'Oficio demasiado largo',
        'El oficio principal no puede superar los 100 caracteres.'
      );
      return false;
    }

    if (descripcionProfesional.length > 1000) {
      Alert.alert(
        'Descripción demasiado larga',
        'La descripción profesional no puede superar los 1000 caracteres.'
      );
      return false;
    }

    if (experienciaLaboral.length > 2000) {
      Alert.alert(
        'Experiencia demasiado larga',
        'La experiencia laboral no puede superar los 2000 caracteres.'
      );
      return false;
    }

    if (!zonaPrincipalId.trim()) {
      Alert.alert(
        'Campo obligatorio',
        'La zona principal es obligatoria.'
      );
      return false;
    }

    const zonaId = Number(zonaPrincipalId);

    if (!Number.isInteger(zonaId) || zonaId <= 0) {
      Alert.alert(
        'Zona inválida',
        'El ID de la zona principal debe ser un número válido.'
      );
      return false;
    }

    return true;
  };

  const manejarGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        oficioPrincipal: oficioPrincipal.trim(),
        descripcionProfesional:
          descripcionProfesional.trim(),
        experienciaLaboral:
          experienciaLaboral.trim(),
        fotoUrl: fotoUrl.trim() || null,
        zonaPrincipalId: Number(zonaPrincipalId),
      };

      if (perfilExistente) {
        await perfilTrabajadorService.modificarPerfil(
          datos
        );
      } else {
        await perfilTrabajadorService.crearPerfil(datos);
      }

      Alert.alert(
        'Perfil guardado',
        perfilExistente
          ? 'Tu perfil profesional fue actualizado correctamente.'
          : 'Tu perfil profesional fue creado correctamente.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.log(
        'Error al guardar perfil profesional:',
        error
      );

      const mensaje =
        error.response?.data?.message ||
        'No fue posible guardar el perfil profesional.';

      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
              Editar perfil
            </Text>

            <Text style={styles.subtituloHeader}>
              Información profesional
            </Text>
          </View>
        </View>

        <View style={styles.cargandoContainer}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text style={styles.textoCargando}>
            Cargando información...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            {perfilExistente
              ? 'Editar perfil'
              : 'Crear perfil profesional'}
          </Text>

          <Text style={styles.subtituloHeader}>
            Información profesional
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introduccion}>
          <View style={styles.iconoIntroduccion}>
            <Ionicons
              name="briefcase-outline"
              size={28}
              color="#0D9488"
            />
          </View>

          <View style={styles.introduccionTexto}>
            <Text style={styles.tituloIntroduccion}>
              Tu perfil profesional
            </Text>

            <Text style={styles.descripcionIntroduccion}>
              Completa la información que los clientes
              podrán consultar sobre tus servicios.
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Información principal
          </Text>

          <Text style={styles.etiqueta}>
            Oficio principal *
          </Text>

          <TextInput
            style={styles.input}
            value={oficioPrincipal}
            onChangeText={setOficioPrincipal}
            placeholder="Ej. Electricista"
            placeholderTextColor="#94A3B8"
            maxLength={100}
          />

          <Text style={styles.contador}>
            {oficioPrincipal.length}/100
          </Text>

          <Text style={styles.etiqueta}>
            Descripción profesional
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.inputMultilinea,
            ]}
            value={descripcionProfesional}
            onChangeText={setDescripcionProfesional}
            placeholder="Describe tus servicios y habilidades..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />

          <Text style={styles.contador}>
            {descripcionProfesional.length}/1000
          </Text>

          <Text style={styles.etiqueta}>
            Experiencia laboral
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.inputMultilinea,
            ]}
            value={experienciaLaboral}
            onChangeText={setExperienciaLaboral}
            placeholder="Cuéntanos sobre tu experiencia..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text style={styles.contador}>
            {experienciaLaboral.length}/2000
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Ubicación
          </Text>

          <Text style={styles.etiqueta}>
            ID de zona principal *
          </Text>

          <TextInput
            style={styles.input}
            value={zonaPrincipalId}
            onChangeText={setZonaPrincipalId}
            placeholder="Ej. 1"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.ayuda}>
            Ingresa el ID de la zona de cobertura asignada.
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Foto
          </Text>

          <Text style={styles.etiqueta}>
            URL de la foto
          </Text>

          <TextInput
            style={styles.input}
            value={fotoUrl}
            onChangeText={setFotoUrl}
            placeholder="https://..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.ayuda}>
            Campo opcional. Puedes agregar una URL de imagen.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.botonGuardar,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={manejarGuardar}
          disabled={guardando}
          activeOpacity={0.8}
        >
          {guardando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="save-outline"
              size={21}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.textoBotonGuardar}>
            {guardando
              ? 'Guardando...'
              : 'Guardar perfil'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },

  introduccion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoIntroduccion: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  introduccionTexto: {
    flex: 1,
  },

  tituloIntroduccion: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },

  descripcionIntroduccion: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  seccion: {
    marginTop: 25,
  },

  tituloSeccion: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  etiqueta: {
    color: '#172B3A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 15,
    color: '#172B3A',
    fontSize: 13,
  },

  inputMultilinea: {
    minHeight: 120,
    paddingTop: 14,
    paddingBottom: 14,
  },

  contador: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },

  ayuda: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },

  botonGuardar: {
    minHeight: 55,
    backgroundColor: '#0D9488',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },

  botonDeshabilitado: {
    opacity: 0.7,
  },

  textoBotonGuardar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  cargandoContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoCargando: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
});