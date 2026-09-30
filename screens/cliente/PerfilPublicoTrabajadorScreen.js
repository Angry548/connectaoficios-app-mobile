import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

import perfilTrabajadorService from '../../services/perfilTrabajadorService';

const PerfilPublicoTrabajadorScreen = ({ route, navigation }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const perfilTrabajadorId = route?.params?.perfilTrabajadorId;

  const cargarPerfil = async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      if (!perfilTrabajadorId) {
        throw new Error('No se recibió el identificador del perfil.');
      }

      const data =
        await perfilTrabajadorService.obtenerPerfilPorId(
          perfilTrabajadorId
        );

      setPerfil(data);
    } catch (error) {
      console.error('Error al cargar perfil público:', error);

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'No se pudo cargar el perfil del trabajador.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [perfilTrabajadorId])
  );

  const obtenerNombreZona = () => {
    if (!perfil) {
      return 'Zona no especificada';
    }

    const partes = [
      perfil.localidad,
      perfil.municipio,
      perfil.departamento,
    ].filter(Boolean);

    return partes.length > 0
      ? partes.join(', ')
      : 'Zona no especificada';
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.textoCargando}>
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!perfil) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.vacioContainer}>
          <Ionicons
            name="person-outline"
            size={64}
            color="#64748B"
          />

          <Text style={styles.tituloVacio}>
            Perfil no disponible
          </Text>

          <Text style={styles.descripcionVacio}>
            No fue posible encontrar la información pública de este
            trabajador.
          </Text>

          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.textoBotonVolver}>
              Volver
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => cargarPerfil(false)}
          />
        }
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
            Perfil del trabajador
          </Text>

          <View style={styles.espacioHeader} />
        </View>

        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatar}>
            {perfil.fotoUrl ? (
              <View style={styles.avatarConFoto}>
                <Ionicons
                  name="person"
                  size={42}
                  color="#FFFFFF"
                />
              </View>
            ) : (
              <Ionicons
                name="person"
                size={42}
                color="#FFFFFF"
              />
            )}
          </View>

          <Text style={styles.nombre}>
            {perfil.nombre || 'Trabajador'}
          </Text>

          <Text style={styles.oficio}>
            {perfil.oficioPrincipal || 'Oficio no especificado'}
          </Text>

          <View style={styles.ubicacion}>
            <Ionicons
              name="location-outline"
              size={18}
              color="#0D9488"
            />

            <Text style={styles.textoUbicacion}>
              {obtenerNombreZona()}
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Sobre el trabajador
          </Text>

          <View style={styles.tarjeta}>
            <View style={styles.encabezadoTarjeta}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#0D9488"
              />

              <Text style={styles.subtitulo}>
                Descripción profesional
              </Text>
            </View>

            <Text style={styles.texto}>
              {perfil.descripcionProfesional ||
                'Este trabajador aún no ha agregado una descripción profesional.'}
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Experiencia laboral
          </Text>

          <View style={styles.tarjeta}>
            <View style={styles.encabezadoTarjeta}>
              <Ionicons
                name="briefcase-outline"
                size={22}
                color="#0D9488"
              />

              <Text style={styles.subtitulo}>
                Experiencia
              </Text>
            </View>

            <Text style={styles.texto}>
              {perfil.experienciaLaboral ||
                'Este trabajador aún no ha agregado información sobre su experiencia laboral.'}
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Información del servicio
          </Text>

          <View style={styles.tarjeta}>
            <View style={styles.fila}>
              <Ionicons
                name="construct-outline"
                size={22}
                color="#0D9488"
              />

              <View style={styles.contenidoFila}>
                <Text style={styles.etiqueta}>
                  Oficio principal
                </Text>

                <Text style={styles.valor}>
                  {perfil.oficioPrincipal ||
                    'No especificado'}
                </Text>
              </View>
            </View>

            <View style={styles.separador} />

            <View style={styles.fila}>
              <Ionicons
                name="location-outline"
                size={22}
                color="#0D9488"
              />

              <View style={styles.contenidoFila}>
                <Text style={styles.etiqueta}>
                  Zona principal
                </Text>

                <Text style={styles.valor}>
                  {obtenerNombreZona()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.botonResenas}
          onPress={() =>
            navigation.navigate('ResenasTrabajador', {
              perfilTrabajadorId: perfil.id,
            })
          }
        >
          <Ionicons
            name="star-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.textoBotonResenas}>
            Ver reseñas
          </Text>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
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

  tarjetaPerfil: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#12344D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  avatarConFoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  nombre: {
    fontSize: 24,
    fontWeight: '700',
    color: '#172B3A',
    textAlign: 'center',
  },

  oficio: {
    fontSize: 17,
    color: '#0D9488',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  ubicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  textoUbicacion: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 5,
    textAlign: 'center',
  },

  seccion: {
    marginBottom: 20,
  },

  tituloSeccion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172B3A',
    marginBottom: 10,
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  encabezadoTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#172B3A',
    marginLeft: 8,
  },

  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  contenidoFila: {
    flex: 1,
    marginLeft: 12,
  },

  etiqueta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 3,
  },

  valor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172B3A',
  },

  separador: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },

  botonResenas: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },

  textoBotonResenas: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginLeft: 10,
  },

  cargandoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCargando: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 15,
  },

  vacioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  tituloVacio: {
    fontSize: 21,
    fontWeight: '700',
    color: '#172B3A',
    marginTop: 16,
    textAlign: 'center',
  },

  descripcionVacio: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },

  botonVolver: {
    backgroundColor: '#12344D',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 22,
  },

  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PerfilPublicoTrabajadorScreen;