import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  perfilTrabajadorService,
} from '../../services/perfilTrabajadorService';
import {
  zonaCoberturaService,
} from '../../services/zonaCoberturaService';
import {
  imagenService,
} from '../../services/imagenService';

const LIMITE_ZONAS = 10;
const RETARDO_BUSQUEDA = 450;

export default function EditarPerfilTrabajadorScreen({
  route,
  navigation,
}) {
  const perfilInicial =
    route?.params?.perfil ?? null;

  const modoCreacion =
    route?.params?.modoCreacion === true ||
    !perfilInicial;

  const [oficioPrincipal, setOficioPrincipal] =
    useState(
      perfilInicial?.oficioPrincipal ?? ''
    );

  const [
    descripcionProfesional,
    setDescripcionProfesional,
  ] = useState(
    perfilInicial?.descripcionProfesional ?? ''
  );

  const [
    experienciaLaboral,
    setExperienciaLaboral,
  ] = useState(
    perfilInicial?.experienciaLaboral ?? ''
  );

  const [fotoUrl, setFotoUrl] = useState(
    perfilInicial?.fotoUrl ?? ''
  );

  const [imagenSeleccionada, setImagenSeleccionada] =
    useState(null);

  const [subiendoImagen, setSubiendoImagen] =
    useState(false);

  const [
    zonaPrincipalId,
    setZonaPrincipalId,
  ] = useState(
    perfilInicial?.zonaPrincipalId
      ? Number(perfilInicial.zonaPrincipalId)
      : null
  );

  const [zonaSeleccionada, setZonaSeleccionada] =
    useState(() => {
      if (!perfilInicial?.zonaPrincipalId) {
        return null;
      }

      return {
        id: Number(perfilInicial.zonaPrincipalId),
        departamento:
          perfilInicial.departamento ?? '',
        municipio:
          perfilInicial.municipio ?? '',
        localidad:
          perfilInicial.localidad ?? '',
      };
    });

  const [zonas, setZonas] = useState([]);
  const [busquedaZona, setBusquedaZona] =
    useState('');
  const [cargandoZonas, setCargandoZonas] =
    useState(false);
  const [errorZonas, setErrorZonas] =
    useState('');
  const [guardando, setGuardando] =
    useState(false);
  const [alturaTeclado, setAlturaTeclado] =
    useState(0);

  const controladorBusquedaRef = useRef(null);

  useEffect(() => {
    const mostrarTeclado =
      Keyboard.addListener(
        'keyboardDidShow',
        (event) => {
          setAlturaTeclado(
            event.endCoordinates.height
          );
        }
      );

    const ocultarTeclado =
      Keyboard.addListener(
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

  useEffect(() => {
    const termino = busquedaZona.trim();

    if (controladorBusquedaRef.current) {
      controladorBusquedaRef.current.abort();
      controladorBusquedaRef.current = null;
    }

    if (termino.length < 2) {
      setZonas([]);
      setCargandoZonas(false);
      setErrorZonas('');
      return undefined;
    }

    const temporizador = setTimeout(
      async () => {
        const controller =
          new AbortController();

        controladorBusquedaRef.current =
          controller;

        setCargandoZonas(true);
        setErrorZonas('');

        try {
          const resultado =
            await zonaCoberturaService.buscar(
              termino,
              LIMITE_ZONAS,
              {
                signal: controller.signal,
              }
            );

          if (!controller.signal.aborted) {
            setZonas(
              Array.isArray(resultado)
                ? resultado.slice(
                    0,
                    LIMITE_ZONAS
                  )
                : []
            );
          }
        } catch (err) {
          if (
            err?.code === 'ERR_CANCELED' ||
            err?.name === 'CanceledError' ||
            controller.signal.aborted
          ) {
            return;
          }

          const mensaje =
            err?.response?.data?.message ||
            err?.response?.data?.mensaje ||
            err?.message ||
            'No se pudieron buscar las zonas.';

          setErrorZonas(mensaje);
          setZonas([]);
        } finally {
          if (!controller.signal.aborted) {
            setCargandoZonas(false);
          }

          if (
            controladorBusquedaRef.current ===
            controller
          ) {
            controladorBusquedaRef.current =
              null;
          }
        }
      },
      RETARDO_BUSQUEDA
    );

    return () => {
      clearTimeout(temporizador);
    };
  }, [busquedaZona]);

  useEffect(
    () => () => {
      if (controladorBusquedaRef.current) {
        controladorBusquedaRef.current.abort();
      }
    },
    []
  );

  const imagenVistaPrevia = useMemo(
    () =>
      imagenSeleccionada?.uri ||
      fotoUrl.trim() ||
      '',
    [imagenSeleccionada, fotoUrl]
  );

  const obtenerNombreZona = (zona) => {
    if (!zona) {
      return '';
    }

    return [
      zona.localidad,
      zona.municipio,
      zona.departamento,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const obtenerMensajeError = (err) => {
    const data = err?.response?.data;

    if (
      data?.errors &&
      typeof data.errors === 'object'
    ) {
      const mensajes = Object.values(
        data.errors
      )
        .flat()
        .filter(Boolean);

      if (mensajes.length > 0) {
        return mensajes.join('\n');
      }
    }

    return (
      data?.message ||
      data?.mensaje ||
      data?.title ||
      err?.message ||
      'No fue posible completar la operación.'
    );
  };

  const seleccionarImagen = async () => {
    if (
      guardando ||
      subiendoImagen
    ) {
      return;
    }

    try {
      const permiso =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitas permitir el acceso a tus fotos para seleccionar una fotografía profesional.'
        );
        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

      if (resultado.canceled) {
        return;
      }

      const asset = resultado.assets?.[0];

      if (!asset?.uri) {
        Alert.alert(
          'Imagen no válida',
          'No fue posible obtener la fotografía seleccionada.'
        );
        return;
      }

      setImagenSeleccionada(asset);
    } catch (err) {
      Alert.alert(
        'No se pudo abrir la galería',
        obtenerMensajeError(err)
      );
    }
  };

  const quitarImagen = () => {
    if (
      guardando ||
      subiendoImagen
    ) {
      return;
    }

    setImagenSeleccionada(null);
    setFotoUrl('');
  };

  const seleccionarZona = (zona) => {
    const id = Number(zona?.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return;
    }

    setZonaPrincipalId(id);
    setZonaSeleccionada(zona);
    setBusquedaZona('');
    setZonas([]);
    setErrorZonas('');
    Keyboard.dismiss();
  };

  const limpiarBusquedaZona = () => {
    if (controladorBusquedaRef.current) {
      controladorBusquedaRef.current.abort();
      controladorBusquedaRef.current = null;
    }

    setBusquedaZona('');
    setZonas([]);
    setErrorZonas('');
    setCargandoZonas(false);
  };

  const validarFormulario = () => {
    const oficio = oficioPrincipal.trim();

    if (!oficio) {
      Alert.alert(
        'Campo requerido',
        'Ingresa tu oficio principal.'
      );
      return false;
    }

    if (oficio.length > 100) {
      Alert.alert(
        'Oficio demasiado largo',
        'El oficio principal no puede superar los 100 caracteres.'
      );
      return false;
    }

    if (
      descripcionProfesional.trim().length >
      1000
    ) {
      Alert.alert(
        'Descripción demasiado larga',
        'La descripción profesional no puede superar los 1000 caracteres.'
      );
      return false;
    }

    if (
      experienciaLaboral.trim().length >
      2000
    ) {
      Alert.alert(
        'Experiencia demasiado larga',
        'La experiencia laboral no puede superar los 2000 caracteres.'
      );
      return false;
    }

    if (!zonaPrincipalId) {
      Alert.alert(
        'Zona requerida',
        'Selecciona tu zona principal.'
      );
      return false;
    }

    if (
      fotoUrl.trim().length > 500 &&
      !imagenSeleccionada
    ) {
      Alert.alert(
        'Fotografía no válida',
        'La URL de la fotografía supera el límite permitido.'
      );
      return false;
    }

    return true;
  };

  const guardar = async () => {
    if (
      guardando ||
      subiendoImagen
    ) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);

    try {
      let urlFinal = fotoUrl.trim();

      if (imagenSeleccionada) {
        setSubiendoImagen(true);

        try {
          const imagenSubida =
            await imagenService.subirFotoPerfil(
              imagenSeleccionada
            );

          urlFinal = imagenSubida.url;

          if (
            !urlFinal ||
            urlFinal.length > 500
          ) {
            throw new Error(
              'La URL generada para la fotografía no es válida.'
            );
          }

          setFotoUrl(urlFinal);
          setImagenSeleccionada(null);
        } finally {
          setSubiendoImagen(false);
        }
      }

      const datos = {
        oficioPrincipal:
          oficioPrincipal.trim(),
        descripcionProfesional:
          descripcionProfesional.trim(),
        experienciaLaboral:
          experienciaLaboral.trim(),
        fotoUrl: urlFinal,
        zonaPrincipalId:
          Number(zonaPrincipalId),
      };

      if (modoCreacion) {
        await perfilTrabajadorService.crearPerfil(
          datos
        );
      } else {
        await perfilTrabajadorService.modificarMiPerfil(
          datos
        );
      }

      Alert.alert(
        modoCreacion
          ? 'Perfil creado'
          : 'Perfil actualizado',
        modoCreacion
          ? 'Tu perfil profesional fue creado correctamente.'
          : 'Tu perfil profesional fue actualizado correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'No se pudo guardar',
        obtenerMensajeError(err)
      );
    } finally {
      setSubiendoImagen(false);
      setGuardando(false);
    }
  };

  const operacionEnCurso =
    guardando || subiendoImagen;

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          disabled={operacionEnCurso}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            {modoCreacion
              ? 'Crear perfil'
              : 'Editar perfil'}
          </Text>

          <Text style={styles.subtitulo}>
            Completa tu información profesional
          </Text>
        </View>

        <View style={styles.espacio} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contenido,
            alturaTeclado > 0 && {
              paddingBottom:
                alturaTeclado + 24,
            },
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tarjeta}>
            <View style={styles.seccionEncabezado}>
              <View style={styles.iconoSeccion}>
                <Ionicons
                  name="briefcase-outline"
                  size={22}
                  color="#2563EB"
                />
              </View>

              <View style={styles.seccionTexto}>
                <Text style={styles.seccionTitulo}>
                  Información profesional
                </Text>

                <Text style={styles.seccionSubtitulo}>
                  Cuéntales a los clientes sobre tu trabajo
                </Text>
              </View>
            </View>

            <Text style={styles.label}>
              Oficio principal *
            </Text>

            <TextInput
              style={styles.input}
              value={oficioPrincipal}
              onChangeText={setOficioPrincipal}
              placeholder="Ej. Electricista"
              placeholderTextColor="#98A2B3"
              maxLength={100}
              editable={!operacionEnCurso}
              returnKeyType="next"
            />

            <Text style={styles.contador}>
              {oficioPrincipal.length}/100
            </Text>

            <Text style={styles.label}>
              Descripción profesional
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.inputMultilinea,
              ]}
              value={descripcionProfesional}
              onChangeText={
                setDescripcionProfesional
              }
              placeholder="Describe tus habilidades, especialidades y la forma en que trabajas..."
              placeholderTextColor="#98A2B3"
              multiline
              textAlignVertical="top"
              maxLength={1000}
              editable={!operacionEnCurso}
            />

            <Text style={styles.contador}>
              {descripcionProfesional.length}/1000
            </Text>

            <Text style={styles.label}>
              Experiencia laboral
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.inputExperiencia,
              ]}
              value={experienciaLaboral}
              onChangeText={
                setExperienciaLaboral
              }
              placeholder="Describe tu experiencia laboral, trabajos realizados y trayectoria..."
              placeholderTextColor="#98A2B3"
              multiline
              textAlignVertical="top"
              maxLength={2000}
              editable={!operacionEnCurso}
            />

            <Text style={styles.contador}>
              {experienciaLaboral.length}/2000
            </Text>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.seccionEncabezado}>
              <View style={styles.iconoSeccion}>
                <Ionicons
                  name="image-outline"
                  size={22}
                  color="#2563EB"
                />
              </View>

              <View style={styles.seccionTexto}>
                <Text style={styles.seccionTitulo}>
                  Fotografía profesional
                </Text>

                <Text style={styles.seccionSubtitulo}>
                  Selecciona una fotografía desde tu dispositivo
                </Text>
              </View>
            </View>

            {imagenVistaPrevia ? (
              <View
                style={
                  styles.vistaPreviaContenedor
                }
              >
                <Image
                  source={{
                    uri: imagenVistaPrevia,
                  }}
                  style={styles.vistaPrevia}
                />

                {imagenSeleccionada ? (
                  <View style={styles.insigniaNueva}>
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#027A48"
                    />
                    <Text
                      style={
                        styles.insigniaNuevaTexto
                      }
                    >
                      Nueva fotografía
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                style={styles.vistaPreviaVacia}
              >
                <Ionicons
                  name="person-outline"
                  size={38}
                  color="#98A2B3"
                />

                <Text
                  style={
                    styles.vistaPreviaVaciaTexto
                  }
                >
                  Sin fotografía
                </Text>
              </View>
            )}

            <Pressable
              style={[
                styles.botonImagen,
                operacionEnCurso &&
                  styles.botonDeshabilitado,
              ]}
              onPress={seleccionarImagen}
              disabled={operacionEnCurso}
            >
              <Ionicons
                name="images-outline"
                size={20}
                color="#2563EB"
              />

              <Text
                style={styles.botonImagenTexto}
              >
                {imagenVistaPrevia
                  ? 'Cambiar fotografía'
                  : 'Seleccionar de galería'}
              </Text>
            </Pressable>

            {imagenVistaPrevia ? (
              <Pressable
                style={styles.botonQuitarImagen}
                onPress={quitarImagen}
                disabled={operacionEnCurso}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#B42318"
                />

                <Text
                  style={
                    styles.botonQuitarImagenTexto
                  }
                >
                  Quitar fotografía
                </Text>
              </Pressable>
            ) : null}

            <Text style={styles.ayudaImagen}>
              La fotografía se subirá cuando guardes tu perfil.
            </Text>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.seccionEncabezado}>
              <View style={styles.iconoSeccion}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color="#2563EB"
                />
              </View>

              <View style={styles.seccionTexto}>
                <Text style={styles.seccionTitulo}>
                  Zona principal *
                </Text>

                <Text style={styles.seccionSubtitulo}>
                  Busca y selecciona tu ubicación principal de trabajo
                </Text>
              </View>
            </View>

            {zonaSeleccionada ? (
              <View
                style={
                  styles.zonaSeleccionadaResumen
                }
              >
                <View
                  style={
                    styles.zonaSeleccionadaIcono
                  }
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color="#2563EB"
                  />
                </View>

                <View
                  style={
                    styles.zonaSeleccionadaContenido
                  }
                >
                  <Text
                    style={
                      styles.zonaSeleccionadaEtiqueta
                    }
                  >
                    Zona seleccionada
                  </Text>

                  <Text
                    style={
                      styles.zonaSeleccionadaTexto
                    }
                  >
                    {obtenerNombreZona(
                      zonaSeleccionada
                    )}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#027A48"
                />
              </View>
            ) : null}

            <View style={styles.buscador}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#667085"
              />

              <TextInput
                style={styles.inputBusqueda}
                value={busquedaZona}
                onChangeText={setBusquedaZona}
                placeholder="Buscar municipio, departamento..."
                placeholderTextColor="#98A2B3"
                editable={!operacionEnCurso}
                autoCorrect={false}
              />

              {busquedaZona ? (
                <Pressable
                  onPress={limpiarBusquedaZona}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#98A2B3"
                  />
                </Pressable>
              ) : null}
            </View>

            {busquedaZona.trim().length < 2 ? (
              <View style={styles.estadoBusqueda}>
                <Ionicons
                  name="search-outline"
                  size={31}
                  color="#98A2B3"
                />

                <Text
                  style={
                    styles.estadoBusquedaTitulo
                  }
                >
                  Busca tu zona principal
                </Text>

                <Text
                  style={
                    styles.estadoBusquedaTexto
                  }
                >
                  Escribe al menos 2 caracteres para buscar. No se cargan zonas automáticamente.
                </Text>
              </View>
            ) : cargandoZonas ? (
              <View style={styles.cargandoZonas}>
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                />

                <Text
                  style={
                    styles.cargandoZonasTexto
                  }
                >
                  Buscando zonas...
                </Text>
              </View>
            ) : errorZonas ? (
              <View style={styles.errorZona}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#B42318"
                />

                <Text
                  style={styles.errorZonaTexto}
                >
                  {errorZonas}
                </Text>
              </View>
            ) : zonas.length === 0 ? (
              <View style={styles.sinZonas}>
                <Ionicons
                  name="location-outline"
                  size={35}
                  color="#98A2B3"
                />

                <Text
                  style={styles.sinZonasTexto}
                >
                  No se encontraron zonas
                </Text>
              </View>
            ) : (
              <View style={styles.listaZonas}>
                {zonas.map((zona) => {
                  const seleccionada =
                    Number(zona.id) ===
                    Number(zonaPrincipalId);

                  return (
                    <Pressable
                      key={zona.id}
                      style={[
                        styles.zona,
                        seleccionada &&
                          styles.zonaActiva,
                      ]}
                      onPress={() =>
                        seleccionarZona(zona)
                      }
                      disabled={operacionEnCurso}
                    >
                      <View
                        style={[
                          styles.zonaIcono,
                          seleccionada &&
                            styles.zonaIconoActivo,
                        ]}
                      >
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color={
                            seleccionada
                              ? '#FFFFFF'
                              : '#2563EB'
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.zonaContenido
                        }
                      >
                        <Text
                          style={styles.zonaNombre}
                        >
                          {zona.localidad ||
                            zona.municipio}
                        </Text>

                        <Text
                          style={
                            styles.zonaUbicacion
                          }
                        >
                          {[
                            zona.municipio,
                            zona.departamento,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          seleccionada
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={24}
                        color={
                          seleccionada
                            ? '#2563EB'
                            : '#D0D5DD'
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <Pressable
            style={[
              styles.botonGuardar,
              operacionEnCurso &&
                styles.botonDeshabilitado,
            ]}
            onPress={guardar}
            disabled={operacionEnCurso}
          >
            {operacionEnCurso ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name={
                  modoCreacion
                    ? 'add-circle-outline'
                    : 'save-outline'
                }
                size={21}
                color="#FFFFFF"
              />
            )}

            <Text
              style={styles.botonGuardarTexto}
            >
              {subiendoImagen
                ? 'Subiendo fotografía...'
                : guardando
                  ? 'Guardando...'
                  : modoCreacion
                    ? 'Crear perfil profesional'
                    : 'Guardar cambios'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  encabezado: {
    minHeight: 76,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encabezadoTexto: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  espacio: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  seccionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconoSeccion: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  seccionTexto: {
    flex: 1,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  seccionSubtitulo: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#101828',
    fontSize: 14,
  },
  inputMultilinea: {
    minHeight: 125,
    paddingTop: 13,
    paddingBottom: 13,
  },
  inputExperiencia: {
    minHeight: 155,
    paddingTop: 13,
    paddingBottom: 13,
  },
  contador: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 16,
    fontSize: 11,
    color: '#98A2B3',
  },
  vistaPreviaContenedor: {
    alignItems: 'center',
    marginBottom: 18,
  },
  vistaPrevia: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: '#F2F4F7',
  },
  vistaPreviaVacia: {
    height: 112,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  vistaPreviaVaciaTexto: {
    marginTop: 5,
    fontSize: 12,
    color: '#98A2B3',
  },
  insigniaNueva: {
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#ECFDF3',
    flexDirection: 'row',
    alignItems: 'center',
  },
  insigniaNuevaTexto: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '600',
    color: '#027A48',
  },
  botonImagen: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonImagenTexto: {
    marginLeft: 8,
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  botonQuitarImagen: {
    minHeight: 44,
    marginTop: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonQuitarImagenTexto: {
    marginLeft: 6,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
  },
  ayudaImagen: {
    marginTop: 10,
    fontSize: 11,
    color: '#667085',
    textAlign: 'center',
  },
  zonaSeleccionadaResumen: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 13,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  zonaSeleccionadaIcono: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  zonaSeleccionadaContenido: {
    flex: 1,
  },
  zonaSeleccionadaEtiqueta: {
    fontSize: 11,
    color: '#667085',
  },
  zonaSeleccionadaTexto: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#101828',
  },
  buscador: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  inputBusqueda: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 14,
    color: '#101828',
  },
  estadoBusqueda: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 14,
  },
  estadoBusquedaTitulo: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  estadoBusquedaTexto: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#667085',
    textAlign: 'center',
  },
  cargandoZonas: {
    paddingVertical: 25,
    alignItems: 'center',
  },
  cargandoZonasTexto: {
    marginTop: 8,
    fontSize: 12,
    color: '#667085',
  },
  errorZona: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorZonaTexto: {
    marginTop: 6,
    fontSize: 12,
    color: '#667085',
    textAlign: 'center',
  },
  sinZonas: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  sinZonasTexto: {
    marginTop: 7,
    color: '#667085',
  },
  listaZonas: {
    marginTop: 12,
  },
  zona: {
    minHeight: 74,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 13,
    padding: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zonaActiva: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FBFF',
  },
  zonaIcono: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  zonaIconoActivo: {
    backgroundColor: '#2563EB',
  },
  zonaContenido: {
    flex: 1,
  },
  zonaNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },
  zonaUbicacion: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  botonGuardar: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardarTexto: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});