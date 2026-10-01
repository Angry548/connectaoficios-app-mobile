import React, {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
} from '@react-navigation/native';
import {
  perfilTrabajadorService,
} from '../../services/perfilTrabajadorService';

export default function MiPerfilProfesionalScreen({
  navigation,
}) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [error, setError] = useState('');

  const cargarPerfil = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const resultado =
          await perfilTrabajadorService.obtenerMiPerfil();

        setPerfil(resultado);
      } catch (err) {
        if (err?.response?.status === 404) {
          setPerfil(null);
          setError('');
        } else {
          const mensaje =
            err?.response?.data?.message ||
            err?.response?.data?.mensaje ||
            err?.message ||
            'No se pudo cargar tu perfil profesional.';

          setError(mensaje);
        }
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();

      return undefined;
    }, [cargarPerfil])
  );

  const actualizar = async () => {
    setActualizando(true);
    await cargarPerfil(false);
  };

  const obtenerUbicacion = () => {
    if (!perfil) {
      return '';
    }

    return [
      perfil.localidad,
      perfil.municipio,
      perfil.departamento,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const porcentaje = Math.min(
    Math.max(
      Number(
        perfil?.porcentajeCompletitud ?? 0
      ),
      0
    ),
    100
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />

          <Text style={styles.textoCarga}>
            Cargando perfil profesional...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={styles.encabezadoPrincipal}>
          <Pressable
            style={styles.botonVolver}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#101828"
            />
          </Pressable>

          <View style={styles.encabezadoTexto}>
            <Text style={styles.titulo}>
              Perfil profesional
            </Text>

            <Text style={styles.subtitulo}>
              Presenta tu experiencia y oficio
            </Text>
          </View>
        </View>

        {perfil ? (
          <Pressable
            style={styles.botonEditarSuperior}
            onPress={() =>
              navigation.navigate(
                'EditarPerfilTrabajador',
                {
                  perfil,
                  modoCreacion: false,
                }
              )
            }
          >
            <Ionicons
              name="create-outline"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
      >
        {error ? (
          <View style={styles.errorContenedor}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color="#B42318"
            />

            <Text style={styles.errorTitulo}>
              No se pudo cargar tu perfil
            </Text>

            <Text style={styles.errorTexto}>
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() => cargarPerfil()}
            >
              <Text
                style={styles.botonReintentarTexto}
              >
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : !perfil ? (
          <View style={styles.vacio}>
            <View style={styles.iconoVacio}>
              <Ionicons
                name="person-outline"
                size={46}
                color="#2563EB"
              />
            </View>

            <Text style={styles.vacioTitulo}>
              Crea tu perfil profesional
            </Text>

            <Text style={styles.vacioTexto}>
              Agrega tu oficio, experiencia y zona
              principal para que los clientes puedan
              conocerte mejor.
            </Text>

            <Pressable
              style={styles.botonCrear}
              onPress={() =>
                navigation.navigate(
                  'EditarPerfilTrabajador',
                  {
                    modoCreacion: true,
                  }
                )
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.botonCrearTexto}>
                Crear perfil profesional
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.tarjetaPrincipal}>
              <View style={styles.perfilSuperior}>
                {perfil.fotoUrl ? (
                  <Image
                    source={{
                      uri: perfil.fotoUrl,
                    }}
                    style={styles.foto}
                  />
                ) : (
                  <View style={styles.fotoVacia}>
                    <Ionicons
                      name="person"
                      size={38}
                      color="#2563EB"
                    />
                  </View>
                )}

                <View style={styles.datosPrincipales}>
                  <Text style={styles.oficio}>
                    {perfil.oficioPrincipal ||
                      'Sin oficio principal'}
                  </Text>

                  <View style={styles.ubicacionFila}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#667085"
                    />

                    <Text
                      style={styles.ubicacionTexto}
                      numberOfLines={2}
                    >
                      {obtenerUbicacion() ||
                        'Sin zona principal'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.separador} />

              <View
                style={
                  styles.completitudEncabezado
                }
              >
                <Text
                  style={
                    styles.completitudEtiqueta
                  }
                >
                  Perfil completado
                </Text>

                <Text
                  style={
                    styles.completitudPorcentaje
                  }
                >
                  {porcentaje}%
                </Text>
              </View>

              <View
                style={styles.barraContenedor}
              >
                <View
                  style={[
                    styles.barraProgreso,
                    {
                      width: `${porcentaje}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.tarjeta}>
              <View style={styles.seccionTituloFila}>
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.seccionTitulo}>
                  Descripción profesional
                </Text>
              </View>

              <Text style={styles.textoContenido}>
                {perfil.descripcionProfesional ||
                  'Aún no has agregado una descripción profesional.'}
              </Text>
            </View>

            <View style={styles.tarjeta}>
              <View style={styles.seccionTituloFila}>
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="briefcase-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.seccionTitulo}>
                  Experiencia laboral
                </Text>
              </View>

              <Text style={styles.textoContenido}>
                {perfil.experienciaLaboral ||
                  'Aún no has agregado tu experiencia laboral.'}
              </Text>
            </View>

            <View style={styles.tarjeta}>
              <View style={styles.seccionTituloFila}>
                <View style={styles.iconoSeccion}>
                  <Ionicons
                    name="location-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.seccionTitulo}>
                  Zona principal
                </Text>
              </View>

              <Text style={styles.zonaPrincipal}>
                {perfil.localidad ||
                  perfil.municipio ||
                  'Sin localidad'}
              </Text>

              <Text style={styles.zonaSecundaria}>
                {[
                  perfil.municipio,
                  perfil.departamento,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>

            <Pressable
              style={styles.botonEditar}
              onPress={() =>
                navigation.navigate(
                  'EditarPerfilTrabajador',
                  {
                    perfil,
                    modoCreacion: false,
                  }
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={21}
                color="#2563EB"
              />

              <Text
                style={styles.botonEditarTexto}
              >
                Editar perfil profesional
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  encabezado: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  encabezadoPrincipal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  encabezadoTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 23,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  botonEditarSuperior: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarga: {
    marginTop: 12,
    color: '#667085',
  },
  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  perfilSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foto: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#F2F4F7',
  },
  fotoVacia: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datosPrincipales: {
    flex: 1,
    marginLeft: 14,
  },
  oficio: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  ubicacionFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 7,
  },
  ubicacionTexto: {
    flex: 1,
    marginLeft: 5,
    fontSize: 13,
    lineHeight: 18,
    color: '#667085',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 16,
  },
  completitudEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completitudEtiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475467',
  },
  completitudPorcentaje: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  barraContenedor: {
    height: 9,
    borderRadius: 10,
    backgroundColor: '#EAECF0',
    overflow: 'hidden',
    marginTop: 9,
  },
  barraProgreso: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  seccionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoSeccion: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  seccionTitulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  textoContenido: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: '#475467',
  },
  zonaPrincipal: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  zonaSecundaria: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
  },
  botonEditar: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonEditarTexto: {
    marginLeft: 7,
    color: '#2563EB',
    fontWeight: '700',
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  iconoVacio: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacioTitulo: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  vacioTexto: {
    marginTop: 8,
    color: '#667085',
    lineHeight: 20,
    textAlign: 'center',
  },
  botonCrear: {
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCrearTexto: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorTitulo: {
    marginTop: 13,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  errorTexto: {
    marginTop: 7,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});