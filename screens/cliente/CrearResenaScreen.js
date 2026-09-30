import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import resenaService from '../../services/resenaService';

const CrearResenaScreen = ({ route, navigation }) => {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const solicitudId = route?.params?.solicitudId;

  const seleccionarCalificacion = (valor) => {
    setCalificacion(valor);
  };

  const validarFormulario = () => {
    if (!solicitudId) {
      Alert.alert(
        'Error',
        'No se recibió el identificador de la solicitud.'
      );
      return false;
    }

    if (calificacion < 1 || calificacion > 5) {
      Alert.alert(
        'Calificación requerida',
        'Seleccioná una calificación de 1 a 5 estrellas.'
      );
      return false;
    }

    if (comentario.trim().length > 2000) {
      Alert.alert(
        'Comentario demasiado largo',
        'El comentario no puede superar los 2000 caracteres.'
      );
      return false;
    }

    return true;
  };

  const guardarResena = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        solicitudId: Number(solicitudId),
        calificacion,
        comentario: comentario.trim(),
      };

      await resenaService.crearResena(datos);

      Alert.alert(
        'Reseña creada',
        'Tu reseña fue registrada correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error al crear reseña:', error);

      Alert.alert(
        'No se pudo crear la reseña',
        error.response?.data?.message ||
          'Ocurrió un error al registrar la reseña.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.botonRegresar}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#172B3A"
            />
          </TouchableOpacity>

          <Text style={styles.tituloHeader}>
            Crear reseña
          </Text>

          <View style={styles.espacioHeader} />
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.iconoContainer}>
            <Ionicons
              name="star"
              size={36}
              color="#F59E0B"
            />
          </View>

          <Text style={styles.titulo}>
            ¿Cómo fue tu experiencia?
          </Text>

          <Text style={styles.descripcion}>
            Calificá el servicio recibido y compartí tu experiencia.
          </Text>

          <View style={styles.estrellasContainer}>
            {[1, 2, 3, 4, 5].map((estrella) => (
              <TouchableOpacity
                key={estrella}
                onPress={() => seleccionarCalificacion(estrella)}
                style={styles.botonEstrella}
                accessibilityLabel={`Calificar con ${estrella} estrellas`}
              >
                <Ionicons
                  name={
                    estrella <= calificacion
                      ? 'star'
                      : 'star-outline'
                  }
                  size={42}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.textoCalificacion}>
            {calificacion === 0
              ? 'Seleccioná una calificación'
              : `${calificacion} de 5 estrellas`}
          </Text>

          <View style={styles.campoContainer}>
            <Text style={styles.label}>
              Comentario
            </Text>

            <TextInput
              style={styles.inputComentario}
              placeholder="Contanos cómo fue el servicio..."
              placeholderTextColor="#94A3B8"
              value={comentario}
              onChangeText={setComentario}
              multiline
              numberOfLines={6}
              maxLength={2000}
              textAlignVertical="top"
              editable={!guardando}
            />

            <Text style={styles.contador}>
              {comentario.length}/2000
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.botonGuardar,
              guardando && styles.botonDeshabilitado,
            ]}
            onPress={guardarResena}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Publicar reseña
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  contenido: {
    padding: 16,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  botonRegresar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  tituloHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#172B3A',
    marginHorizontal: 10,
  },

  espacioHeader: {
    width: 42,
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  iconoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  titulo: {
    fontSize: 23,
    fontWeight: '700',
    color: '#172B3A',
    textAlign: 'center',
  },

  descripcion: {
    fontSize: 15,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

  estrellasContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },

  botonEstrella: {
    paddingHorizontal: 4,
  },

  textoCalificacion: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
    marginBottom: 24,
  },

  campoContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172B3A',
    marginBottom: 8,
  },

  inputComentario: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#172B3A',
    backgroundColor: '#F8FAFC',
  },

  contador: {
    textAlign: 'right',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 5,
  },

  botonGuardar: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  botonDeshabilitado: {
    opacity: 0.7,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default CrearResenaScreen;