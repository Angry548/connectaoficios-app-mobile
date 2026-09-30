import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import perfilTrabajadorService from '../../services/perfilTrabajadorService';

export default function MiPerfilProfesionalScreen({ navigation }) {
  const { usuario } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      setError(false);

      if (!usuario?.id) {
        setError(true);
        return;
      }

      const data =
        await perfilTrabajadorService.obtenerPerfilPorTrabajador(
          usuario.id
        );

      setPerfil(data);
    } catch (e) {
      console.log('Error al cargar perfil profesional:', e);

      if (e.response?.status === 404) {
        setPerfil(null);
      } else {
        setError(true);
      }
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [usuario?.id])
  );

  const manejarEditar = () => {
    navigation.navigate('EditarPerfilTrabajador');
  };

  const manejarCrearPerfil = () => {
    navigation.navigate('EditarPerfilTrabajador');
  };

  const obtenerUbicacion = () => {
    if (!perfil) {
      return 'Zona no definida';
    }

    const partes = [
      perfil.localidad,
      perfil.municipio,
      perfil.departamento,
    ].filter(Boolean);

    return partes.length > 0
      ? partes.join(', ')
      : 'Zona no definida';
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
              Mi perfil profesional
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
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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
              Mi perfil profesional
            </Text>

            <Text style={styles.subtituloHeader}>
              Información profesional
            </Text>
          </View>
        </View>

        <View style={styles.mensajeContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color="#DC2626"
          />

          <Text style={styles.mensajeTitulo}>
            No pudimos cargar tu perfil
          </Text>

          <Text style={styles.mensajeTexto}>
            Ocurrió un problema al consultar la información
            profesional.
          </Text>

          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={cargarPerfil}
            activeOpacity={0.8}
          >
            <Text style={styles.textoBotonPrincipal}>
              Intentar nuevamente
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!perfil) {
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
              Mi perfil profesional
            </Text>

            <Text style={styles.subtituloHeader}>
              Información profesional
            </Text>
          </View>
        </View>

        <View style={styles.mensajeContainer}>
          <View style={styles.iconoVacio}>
            <Ionicons
              name="briefcase-outline"
              size={42}
              color="#0D9488"
            />
          </View>

          <Text style={styles.mensajeTitulo}>
            Aún no tienes un perfil profesional
          </Text>

          <Text style={styles.mensajeTexto}>
            Completa tu información profesional para que los
            clientes puedan conocer tus servicios.
          </Text>

          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={manejarCrearPerfil}
            activeOpacity={0.8}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.textoBotonPrincipal}>
              Crear perfil profesional
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const porcentaje = Number(
    perfil.porcentajeCompletitud || 0
  );

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
            Mi perfil profesional
          </Text>

          <Text style={styles.subtituloHeader}>
            Información profesional
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botonEditarHeader}
          onPress={manejarEditar}
          activeOpacity={0.7}
        >
          <Ionicons
            name="create-outline"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatar}>
            <Ionicons
              name="briefcase-outline"
              size={38}
              color="#0D9488"
            />
          </View>

          <View style={styles.datosPrincipales}>
            <Text style={styles.oficio}>
              {perfil.oficioPrincipal}
            </Text>

            <Text style={styles.nombreTrabajador}>
              {usuario?.nombre || 'Trabajador'}
            </Text>

            <View style={styles.ubicacion}>
              <Ionicons
                name="location-outline"
                size={15}
                color="#64748B"
              />

              <Text style={styles.textoUbicacion}>
                {obtenerUbicacion()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tarjetaCompletitud}>
          <View style={styles.filaCompletitud}>
            <View>
              <Text style={styles.tituloCompletitud}>
                Perfil completado
              </Text>

              <Text style={styles.subtituloCompletitud}>
                Mantén tu información actualizada.
              </Text>
            </View>

            <Text style={styles.porcentaje}>
              {porcentaje}%
            </Text>
          </View>

          <View style={styles.barraFondo}>
            <View
              style={[
                styles.barraProgreso,
                { width: `${Math.min(porcentaje, 100)}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Sobre mi trabajo
          </Text>

          <View style={styles.tarjeta}>
            <View style={styles.iconoSeccion}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#0D9488"
              />
            </View>

            <View style={styles.contenidoTarjeta}>
              <Text style={styles.tituloCampo}>
                Descripción profesional
              </Text>

              <Text style={styles.valorCampo}>
                {perfil.descripcionProfesional ||
                  'No has agregado una descripción profesional.'}
              </Text>
            </View>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.iconoSeccion}>
              <Ionicons
                name="time-outline"
                size={22}
                color="#0D9488"
              />
            </View>

            <View style={styles.contenidoTarjeta}>
              <Text style={styles.tituloCampo}>
                Experiencia laboral
              </Text>

              <Text style={styles.valorCampo}>
                {perfil.experienciaLaboral ||
                  'No has agregado información sobre tu experiencia.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Zona principal
          </Text>

          <View style={styles.tarjeta}>
            <View style={styles.iconoSeccion}>
              <Ionicons
                name="location-outline"
                size={22}
                color="#0D9488"
              />
            </View>

            <View style={styles.contenidoTarjeta}>
              <Text style={styles.tituloCampo}>
                Ubicación de trabajo
              </Text>

              <Text style={styles.valorCampo}>
                {obtenerUbicacion()}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.botonEditar}
          onPress={manejarEditar}
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.textoBotonEditar}>
            Editar perfil profesional
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

  botonEditarHeader: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#1E506B',
    justifyContent: 'center',
    alignItems: 'center',
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

  tarjetaPerfil: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  datosPrincipales: {
    flex: 1,
  },

  oficio: {
    color: '#172B3A',
    fontSize: 20,
    fontWeight: '800',
  },

  nombreTrabajador: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  ubicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },

  textoUbicacion: {
    color: '#64748B',
    fontSize: 12,
    flex: 1,
  },

  tarjetaCompletitud: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginTop: 15,
  },

  filaCompletitud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tituloCompletitud: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },

  subtituloCompletitud: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  porcentaje: {
    color: '#0D9488',
    fontSize: 22,
    fontWeight: '900',
  },

  barraFondo: {
    height: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 14,
    overflow: 'hidden',
  },

  barraProgreso: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 10,
  },

  seccion: {
    marginTop: 25,
  },

  tituloSeccion: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  iconoSeccion: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  contenidoTarjeta: {
    flex: 1,
  },

  tituloCampo: {
    color: '#172B3A',
    fontSize: 14,
    fontWeight: '800',
  },

  valorCampo: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  botonEditar: {
    minHeight: 54,
    backgroundColor: '#0D9488',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },

  textoBotonEditar: {
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

  mensajeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  iconoVacio: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  mensajeTitulo: {
    color: '#172B3A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  mensajeTexto: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  botonPrincipal: {
    minHeight: 52,
    backgroundColor: '#0D9488',
    borderRadius: 15,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});