import PaginationControls from '../../components/PaginationControls';
import { usePagination, useLocalPagination } from '../../hooks/usePagination';
import { listadosPaginados } from '../../services/listadosPaginados';
import { useIdentityDraft } from '../../hooks/useIdentityDraft';
import { guardarCambiosPerfil, guardarPerfilPropio, identidadCambio, perfilCambio, validarIdentidad } from '../../services/guardarCambiosPerfil';
import { mensajeError } from '../../services/mensajesError';
import AccountIdentityCard from '../../components/profile/AccountIdentityCard';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfilePhotoCard from '../../components/profile/ProfilePhotoCard';
import { useAuth } from '../../context/AuthContext';
import { editorStyles } from '../../components/profile/profileStyles';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { seleccionarImagenPerfil } from '../../services/seleccionImagenPerfil';
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
  const { usuario, actualizarIdentidad, refrescarIdentidad } = useAuth();
  const { identidad, setIdentidad, identidadBase } = useIdentityDraft(usuario);
  const perfilBase = useRef(route?.params?.perfil ?? null);
  const bloqueoGuardado = useRef(false);
  const selectorAbierto = useRef(false);
  const [seleccionandoImagen, setSeleccionandoImagen] = useState(false);
  const perfilInicial =
    route?.params?.perfil ?? null;

  const modoCreacion = !perfilBase.current;

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

  const zonasPagina = usePagination(busquedaZona.trim());
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
            await listadosPaginados.zonas(zonasPagina.pagina, termino, { signal: controller.signal });

          if (!controller.signal.aborted) {
            setZonas(
              zonasPagina.registrar(resultado)
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
            mensajeError(err, "No se pudieron buscar las zonas.");

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
  }, [zonasPagina.pagina, busquedaZona]);

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

  const obtenerMensajeError = (error, fallback = "No fue posible completar la operación.") => mensajeError(error, fallback);

  const seleccionarImagen = async () => {
    if (bloqueoGuardado.current || selectorAbierto.current) return;
    if (
      guardando ||
      subiendoImagen
    ) {
      return;
    }

    try {
      selectorAbierto.current = true;
      setSeleccionandoImagen(true);
      const asset = await seleccionarImagenPerfil();
      if (!asset) return;

      setImagenSeleccionada(asset);
    } catch (err) {
      Alert.alert(
        'No se pudo abrir la galería',
        obtenerMensajeError(err)
      );
    } finally { selectorAbierto.current = false; setSeleccionandoImagen(false); }
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
    if (bloqueoGuardado.current || selectorAbierto.current || guardando || subiendoImagen) return;
    const datos = {
      oficioPrincipal: oficioPrincipal.trim(), descripcionProfesional: descripcionProfesional.trim(),
      experienciaLaboral: experienciaLaboral.trim(), fotoUrl: fotoUrl.trim(), zonaPrincipalId: zonaPrincipalId ? Number(zonaPrincipalId) : null,
    };
    const cambioCuenta = identidadCambio(identidad, identidadBase.current);
    const cambioPerfil = Boolean(imagenSeleccionada) || perfilCambio(datos, perfilBase.current);
    if (!cambioCuenta && !cambioPerfil) { Alert.alert('Sin cambios', 'No hay cambios por guardar.'); return; }
    const validacion = cambioCuenta && validarIdentidad(identidad);
    if (validacion) { Alert.alert('Revisa tus datos', validacion); return; }
    if (cambioPerfil && !validarFormulario()) return;
    bloqueoGuardado.current = true;
    setGuardando(true);
    try {
      const resultado = await guardarCambiosPerfil({
        identidad: cambioCuenta ? async () => {
          const guardada = await actualizarIdentidad(identidad);
          identidadBase.current = guardada;
          return guardada;
        } : null,
        perfil: cambioPerfil ? async () => {
          let urlFinal = fotoUrl.trim();
          if (imagenSeleccionada) {
            setSubiendoImagen(true);
            try {
              const subida = await imagenService.subirFotoPerfil(imagenSeleccionada);
              urlFinal = subida.url;
              if (!urlFinal || urlFinal.length > 500) throw new Error('La fotografía seleccionada no es válida.');
              setFotoUrl(urlFinal); setImagenSeleccionada(null);
            } finally { setSubiendoImagen(false); }
          }
          const guardado = await guardarPerfilPropio(perfilTrabajadorService, { ...datos, fotoUrl: urlFinal }, perfilBase.current)
            || await perfilTrabajadorService.obtenerMiPerfil();
          perfilBase.current = guardado;
          return guardado;
        } : null,
      });
      if (resultado.completo) {
        Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
          { text: 'Aceptar', onPress: () => navigation.goBack() },
        ]);
      } else {
        await Promise.allSettled([
          cambioCuenta ? refrescarIdentidad().then(actual => { identidadBase.current = actual; }) : Promise.resolve(),
          cambioPerfil ? perfilTrabajadorService.obtenerMiPerfil().then(actual => { perfilBase.current = actual; })
            .catch(err => { if (err?.response?.status === 404) perfilBase.current = null; }) : Promise.resolve(),
        ]);
        const parcial = resultado.parcial || (cambioCuenta && !identidadCambio(identidad, identidadBase.current));
        Alert.alert(parcial ? 'Cambios guardados parcialmente' : 'No se pudo guardar', parcial
          ? 'Parte de la información se actualizó, pero algunos cambios no pudieron guardarse. Intenta nuevamente.'
          : mensajeError(Object.values(resultado.errores)[0], 'No se pudieron guardar los cambios. Intenta nuevamente.'));
      }
    } catch (err) { Alert.alert('No se pudo guardar', mensajeError(err)); }
    finally { bloqueoGuardado.current = false; setSubiendoImagen(false); setGuardando(false); }
  };

  const operacionEnCurso =
    guardando || subiendoImagen || seleccionandoImagen;

  return (
    <SafeAreaView style={styles.contenedor}>
      <ProfileHeader editor titulo={modoCreacion ? 'Crear perfil' : 'Editar perfil'}
        subtitulo="Completa tu información profesional" onBack={() => navigation.goBack()}
        disabled={operacionEnCurso} />

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
          <AccountIdentityCard editable disabled={operacionEnCurso} value={identidad} onChange={setIdentidad} />
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

          <ProfilePhotoCard profesional fotoUrl={imagenVistaPrevia} nombre={usuario?.nombre}
            nueva={Boolean(imagenSeleccionada)} disabled={operacionEnCurso} seleccionando={seleccionandoImagen}
            onSelect={seleccionarImagen} onRemove={quitarImagen} />

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
{!cargandoZonas && !errorZonas && busquedaZona.trim().length >= 2 ? <PaginationControls {...zonasPagina.props} loading={cargandoZonas} /> : null}
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
                  : 'Guardar cambios'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...editorStyles,
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
});
