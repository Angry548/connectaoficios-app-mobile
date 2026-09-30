import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
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

import resenaService from '../../services/resenaService';

const ResenasTrabajadorScreen = ({ route, navigation }) => {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(null);

  const perfilTrabajadorId =
    route?.params?.perfilTrabajadorId;

  const cargarResenas = async (mostrarCarga = true) => {
    try {
      setError(null);

      if (mostrarCarga) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      if (!perfilTrabajadorId) {
        throw new Error(
          'No se recibió el identificador del perfil del trabajador.'
        );
      }

      const data =
        await resenaService.obtenerResenasPorTrabajador(
          perfilTrabajadorId
        );

      setResenas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);

      setError(
        error.response?.data?.message ||
          error.message ||
          'No se pudieron cargar las reseñas.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarResenas();
    }, [perfilTrabajadorId])
  );

  const renderEstrellas = (calificacion) => {
    return (
      <View style={styles.estrellas}>
        {[1, 2, 3, 4, 5].map((estrella) => (
          <Ionicons
            key={estrella}
            name={
              estrella <= calificacion
                ? 'star'
                : 'star-outline'
            }
            size={18}
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return 'Fecha no disponible';
    }

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return 'Fecha no disponible';
    }

    return fechaConvertida.toLocaleDateString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const obtenerPromedio = () => {
    if (resenas.length === 0) {
      return '0.0';
    }

    const suma = resenas.reduce(
      (total, resena) =>
        total + Number(resena.calificacion || 0),
      0
    );

    return (suma / resenas.length).toFixed(1);
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text style={styles.textoCargando}>
            Cargando reseñas...
          </Text>
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
            onRefresh={() => cargarResenas(false)}
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
            Reseñas
          </Text>

          <View style={styles.espacioHeader} />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#64748B"
            />

            <Text style={styles.tituloError}>
              No se pudieron cargar las reseñas
            </Text>

            <Text style={styles.textoError}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={() => cargarResenas()}
            >
              <Text style={styles.textoBotonReintentar}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.resumen}>
              <View style={styles.resumenPrincipal}>
                <Text style={styles.promedio}>
                  {obtenerPromedio()}
                </Text>

                <View style={styles.estrellasResumen}>
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <Ionicons
                      key={estrella}
                      name={
                        estrella <=
                        Math.round(Number(obtenerPromedio()))
                          ? 'star'
                          : 'star-outline'
                      }
                      size={20}
                      color="#F59E0B"
                    />
                  ))}
                </View>

                <Text style={styles.totalResenas}>
                  {resenas.length}{' '}
                  {resenas.length === 1
                    ? 'reseña'
                    : 'reseñas'}
                </Text>
              </View>
            </View>

            {resenas.length === 0 ? (
              <View style={styles.vacioContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={60}
                  color="#64748B"
                />

                <Text style={styles.tituloVacio}>
                  Todavía no hay reseñas
                </Text>

                <Text style={styles.textoVacio}>
                  Este trabajador aún no cuenta con reseñas
                  publicadas.
                </Text>
              </View>
            ) : (
              <View style={styles.lista}>
                {resenas.map((resena) => (
                  <View
                    key={resena.id}
                    style={styles.tarjetaResena}
                  >
                    <View style={styles.encabezadoResena}>
                      <View style={styles.avatar}>
                        <Ionicons
                          name="person"
                          size={22}
                          color="#FFFFFF"
                        />
                      </View>

                      <View style={styles.infoResena}>
                        <Text style={styles.nombreCliente}>
                          Cliente
                        </Text>

                        {renderEstrellas(
                          Number(resena.calificacion)
                        )}
                      </View>

                      <Text style={styles.fecha}>
                        {formatearFecha(
                          resena.fechaCreacion
                        )}
                      </Text>
                    </View>

                    <Text style={styles.comentario}>
                      {resena.comentario?.trim()
                        ? resena.comentario
                        : 'Sin comentario.'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
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

  resumen: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    alignItems: 'center',
  },

  resumenPrincipal: {
    alignItems: 'center',
  },

  promedio: {
    fontSize: 38,
    fontWeight: '700',
    color: '#172B3A',
  },

  estrellasResumen: {
    flexDirection: 'row',
    marginTop: 4,
  },

  totalResenas: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },

  lista: {
    gap: 12,
  },

  tarjetaResena: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  encabezadoResena: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#12344D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoResena: {
    flex: 1,
    marginLeft: 10,
  },

  nombreCliente: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172B3A',
    marginBottom: 4,
  },

  estrellas: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fecha: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },

  comentario: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    marginTop: 14,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  tituloVacio: {
    fontSize: 20,
    fontWeight: '700',
    color: '#172B3A',
    marginTop: 16,
    textAlign: 'center',
  },

  textoVacio: {
    fontSize: 15,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  tituloError: {
    fontSize: 19,
    fontWeight: '700',
    color: '#172B3A',
    textAlign: 'center',
    marginTop: 14,
  },

  textoError: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

  botonReintentar: {
    backgroundColor: '#12344D',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 18,
  },

  textoBotonReintentar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ResenasTrabajadorScreen;