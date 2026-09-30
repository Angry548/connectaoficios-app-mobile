import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { servicioService } from '../../services/servicioService';

export default function EditarServicioScreen({
  route,
  navigation,
}) {
  const servicioId = route?.params?.servicioId;
  const [servicio, setServicio] = useState(null);
  const [categoriaId, setCategoriaId] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState(null);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [resultadosCategoria, setResultadosCategoria] =
    useState([]);
  const [buscandoCategoria, setBuscandoCategoria] =
    useState(false);
  const [errorCategoria, setErrorCategoria] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tarifaMinima, setTarifaMinima] = useState('');
  const [tarifaMaxima, setTarifaMaxima] = useState('');
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] =
    useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const solicitudCategoriaRef = useRef(0);

  useEffect(() => {
    const mostrar = Keyboard.addListener(
      'keyboardDidShow',
      (evento) => {
        setAlturaTeclado(evento.endCoordinates.height);
      }
    );

    const ocultar = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setAlturaTeclado(0);
      }
    );

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!servicioId) {
      setError(
        'No se recibió el identificador del servicio.'
      );
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const servicioActual =
        await servicioService.obtenerPorId(servicioId);

      let categoriaActual = null;

      if (servicioActual?.categoriaId) {
        categoriaActual =
          await servicioService.obtenerCategoriaPorId(
            servicioActual.categoriaId
          );
      }

      setServicio(servicioActual);
      setCategoriaId(servicioActual.categoriaId ?? null);
      setCategoriaSeleccionada(categoriaActual);
      setBusquedaCategoria(categoriaActual?.nombre ?? '');
      setTitulo(servicioActual.titulo ?? '');
      setDescripcion(servicioActual.descripcion ?? '');
      setTarifaMinima(
        servicioActual.tarifaMinima !== null &&
          servicioActual.tarifaMinima !== undefined
          ? String(servicioActual.tarifaMinima)
          : ''
      );
      setTarifaMaxima(
        servicioActual.tarifaMaxima !== null &&
          servicioActual.tarifaMaxima !== undefined
          ? String(servicioActual.tarifaMaxima)
          : ''
      );
      setEstado(servicioActual.estado ?? '');
    } catch (err) {
      const data = err?.response?.data;
      setError(
        data?.message ||
          data?.mensaje ||
          err?.message ||
          'No se pudo cargar la información del servicio.'
      );
    } finally {
      setCargando(false);
    }
  }, [servicioId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const texto = busquedaCategoria.trim();

    if (categoriaSeleccionada) {
      setResultadosCategoria([]);
      setBuscandoCategoria(false);
      setErrorCategoria('');
      return;
    }

    if (texto.length < 2) {
      setResultadosCategoria([]);
      setBuscandoCategoria(false);
      setErrorCategoria('');
      return;
    }

    const solicitudActual = ++solicitudCategoriaRef.current;

    const temporizador = setTimeout(async () => {
      setBuscandoCategoria(true);
      setErrorCategoria('');

      try {
        const data =
          await servicioService.buscarCategorias(
            texto,
            10
          );

        if (
          solicitudActual ===
          solicitudCategoriaRef.current
        ) {
          setResultadosCategoria(data);
        }
      } catch (err) {
        if (
          solicitudActual ===
          solicitudCategoriaRef.current
        ) {
          setResultadosCategoria([]);
          setErrorCategoria(
            err?.response?.data?.message ||
              err?.response?.data?.mensaje ||
              err?.message ||
              'No se pudieron buscar las categorías.'
          );
        }
      } finally {
        if (
          solicitudActual ===
          solicitudCategoriaRef.current
        ) {
          setBuscandoCategoria(false);
        }
      }
    }, 350);

    return () => clearTimeout(temporizador);
  }, [busquedaCategoria, categoriaSeleccionada]);

  const seleccionarCategoria = (categoria) => {
    setCategoriaId(Number(categoria.id));
    setCategoriaSeleccionada(categoria);
    setBusquedaCategoria(categoria.nombre ?? '');
    setResultadosCategoria([]);
    setErrorCategoria('');
    Keyboard.dismiss();
  };

  const limpiarCategoria = () => {
    setCategoriaId(null);
    setCategoriaSeleccionada(null);
    setBusquedaCategoria('');
    setResultadosCategoria([]);
    setErrorCategoria('');
  };

  const normalizarDecimal = (valor) =>
    valor.replace(',', '.').trim();

  const obtenerMensajeError = (
    err,
    mensajePredeterminado
  ) => {
    const data = err?.response?.data;

    if (
      data?.errors &&
      typeof data.errors === 'object'
    ) {
      const mensajes = Object.values(data.errors)
        .flat()
        .filter(Boolean);

      if (mensajes.length > 0) {
        return mensajes.join('\n');
      }
    }

    return (
      data?.message ||
      data?.mensaje ||
      err?.message ||
      mensajePredeterminado
    );
  };

  const validarFormulario = () => {
    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();
    const minimaTexto = normalizarDecimal(tarifaMinima);
    const maximaTexto = normalizarDecimal(tarifaMaxima);

    if (!categoriaId) {
      Alert.alert(
        'Categoría requerida',
        'Busca y selecciona una categoría para el servicio.'
      );
      return false;
    }

    if (!tituloLimpio) {
      Alert.alert(
        'Título requerido',
        'Ingresa el título del servicio.'
      );
      return false;
    }

    if (tituloLimpio.length > 150) {
      Alert.alert(
        'Título demasiado largo',
        'El título no puede superar los 150 caracteres.'
      );
      return false;
    }

    if (!descripcionLimpia) {
      Alert.alert(
        'Descripción requerida',
        'Ingresa una descripción para el servicio.'
      );
      return false;
    }

    if (descripcionLimpia.length > 2000) {
      Alert.alert(
        'Descripción demasiado larga',
        'La descripción no puede superar los 2000 caracteres.'
      );
      return false;
    }

    if (!minimaTexto) {
      Alert.alert(
        'Tarifa requerida',
        'Ingresa la tarifa mínima del servicio.'
      );
      return false;
    }

    const minima = Number(minimaTexto);

    if (!Number.isFinite(minima) || minima < 0) {
      Alert.alert(
        'Tarifa inválida',
        'La tarifa mínima debe ser un número igual o mayor que cero.'
      );
      return false;
    }

    if (maximaTexto) {
      const maxima = Number(maximaTexto);

      if (!Number.isFinite(maxima) || maxima < 0) {
        Alert.alert(
          'Tarifa inválida',
          'La tarifa máxima debe ser un número igual o mayor que cero.'
        );
        return false;
      }

      if (maxima < minima) {
        Alert.alert(
          'Rango de tarifa inválido',
          'La tarifa máxima no puede ser menor que la tarifa mínima.'
        );
        return false;
      }
    }

    return true;
  };

  const guardarCambios = async () => {
    if (guardando || !validarFormulario()) {
      return;
    }

    Keyboard.dismiss();
    setGuardando(true);

    try {
      const maximaTexto =
        normalizarDecimal(tarifaMaxima);

      const actualizado =
        await servicioService.modificar(
          servicioId,
          {
            categoriaId: Number(categoriaId),
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            tarifaMinima: Number(
              normalizarDecimal(tarifaMinima)
            ),
            tarifaMaxima:
              maximaTexto === ''
                ? null
                : Number(maximaTexto),
            zonasCoberturaIds:
              servicio?.zonasCoberturaIds ?? [],
          }
        );

      setServicio(actualizado);

      Alert.alert(
        'Cambios guardados',
        'El servicio fue actualizado correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'No se pudo actualizar',
        obtenerMensajeError(
          err,
          'No se pudo actualizar el servicio.'
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarCambioEstado = async (
    nuevoEstado
  ) => {
    if (
      cambiandoEstado ||
      nuevoEstado === estado
    ) {
      return;
    }

    setCambiandoEstado(true);

    try {
      const actualizado =
        await servicioService.cambiarEstado(
          servicioId,
          nuevoEstado
        );

      if (actualizado) {
        setServicio(actualizado);
      }

      setEstado(
        actualizado?.estado ?? nuevoEstado
      );

      Alert.alert(
        'Estado actualizado',
        'El estado del servicio fue actualizado correctamente.'
      );
    } catch (err) {
      Alert.alert(
        'No se pudo cambiar el estado',
        obtenerMensajeError(
          err,
          'No se pudo cambiar el estado del servicio.'
        )
      );
    } finally {
      setCambiandoEstado(false);
    }
  };

  const solicitarCambioEstado = (
    nuevoEstado
  ) => {
    if (nuevoEstado === estado) {
      return;
    }

    Alert.alert(
      'Cambiar estado',
      `¿Deseas cambiar el estado del servicio a ${nuevoEstado}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar',
          onPress: () =>
            ejecutarCambioEstado(nuevoEstado),
        },
      ]
    );
  };

  const ejecutarEliminacion = async () => {
    setEliminando(true);

    try {
      await servicioService.eliminar(servicioId);

      Alert.alert(
        'Servicio eliminado',
        'El servicio fue eliminado correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'No se pudo eliminar',
        obtenerMensajeError(
          err,
          'No se pudo eliminar el servicio.'
        )
      );
    } finally {
      setEliminando(false);
    }
  };

  const confirmarEliminacion = () => {
    Alert.alert(
      'Eliminar servicio',
      '¿Estás seguro de que deseas eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: ejecutarEliminacion,
        },
      ]
    );
  };

  const obtenerNombreEstado = (valor) => {
    if (!valor) return 'Sin estado';

    return valor
      .toString()
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letra) =>
        letra.toUpperCase()
      );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />
          <Text style={styles.textoCarga}>
            Cargando servicio...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Pressable
            style={styles.botonVolver}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#101828"
            />
          </Pressable>
          <View style={styles.encabezadoTexto}>
            <Text style={styles.tituloEncabezado}>
              Editar servicio
            </Text>
          </View>
          <View style={styles.espacioEncabezado} />
        </View>

        <View style={styles.errorContenedor}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#B42318"
          />
          <Text style={styles.errorTitulo}>
            No se pudo cargar el servicio
          </Text>
          <Text style={styles.errorTexto}>
            {error}
          </Text>
          <Pressable
            style={styles.botonReintentar}
            onPress={cargarDatos}
          >
            <Text style={styles.botonReintentarTexto}>
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          disabled={
            guardando ||
            cambiandoEstado ||
            eliminando
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.tituloEncabezado}>
            Editar servicio
          </Text>
          <Text style={styles.subtituloEncabezado}>
            Actualiza tu publicación
          </Text>
        </View>

        <View style={styles.espacioEncabezado} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contenido,
          alturaTeclado > 0 && {
            paddingBottom: alturaTeclado + 24,
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Estado del servicio
          </Text>
          <Text style={styles.seccionSubtitulo}>
            Estado actual: {obtenerNombreEstado(estado)}
          </Text>

          <View style={styles.estados}>
            <Pressable
              style={[
                styles.estadoBoton,
                estado === 'ACTIVO' &&
                  styles.estadoActivo,
              ]}
              onPress={() =>
                solicitarCambioEstado('ACTIVO')
              }
              disabled={cambiandoEstado}
            >
              <Ionicons
                name={
                  estado === 'ACTIVO'
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={20}
                color={
                  estado === 'ACTIVO'
                    ? '#027A48'
                    : '#667085'
                }
              />
              <Text style={styles.estadoTexto}>
                Activo
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.estadoBoton,
                estado === 'INACTIVO' &&
                  styles.estadoInactivo,
              ]}
              onPress={() =>
                solicitarCambioEstado('INACTIVO')
              }
              disabled={cambiandoEstado}
            >
              <Ionicons
                name={
                  estado === 'INACTIVO'
                    ? 'pause-circle'
                    : 'ellipse-outline'
                }
                size={20}
                color={
                  estado === 'INACTIVO'
                    ? '#B54708'
                    : '#667085'
                }
              />
              <Text style={styles.estadoTexto}>
                Inactivo
              </Text>
            </Pressable>
          </View>

          {cambiandoEstado ? (
            <View style={styles.procesando}>
              <ActivityIndicator size="small" />
              <Text style={styles.procesandoTexto}>
                Actualizando estado...
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Información del servicio
          </Text>
          <Text style={styles.seccionSubtitulo}>
            Modifica la información de tu publicación
          </Text>

          <Text style={styles.etiqueta}>
            Título <Text style={styles.requerido}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Título del servicio"
            placeholderTextColor="#98A2B3"
            maxLength={150}
            editable={!guardando}
          />
          <Text style={styles.contador}>
            {titulo.length}/150
          </Text>

          <Text style={styles.etiqueta}>
            Descripción{' '}
            <Text style={styles.requerido}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción del servicio"
            placeholderTextColor="#98A2B3"
            multiline
            textAlignVertical="top"
            maxLength={2000}
            editable={!guardando}
          />
          <Text style={styles.contador}>
            {descripcion.length}/2000
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Categoría
          </Text>
          <Text style={styles.seccionSubtitulo}>
            Escribe al menos 2 caracteres para cambiarla
          </Text>

          <View
            style={[
              styles.buscador,
              categoriaSeleccionada &&
                styles.buscadorSeleccionado,
            ]}
          >
            <Ionicons
              name={
                categoriaSeleccionada
                  ? 'checkmark-circle'
                  : 'search-outline'
              }
              size={20}
              color={
                categoriaSeleccionada
                  ? '#0D9488'
                  : '#667085'
              }
            />
            <TextInput
              style={styles.inputBusqueda}
              value={busquedaCategoria}
              onChangeText={(texto) => {
                if (categoriaSeleccionada) {
                  setCategoriaId(null);
                  setCategoriaSeleccionada(null);
                }
                setBusquedaCategoria(texto);
              }}
              placeholder="Buscar categoría"
              placeholderTextColor="#98A2B3"
              editable={!guardando}
              autoCorrect={false}
            />
            {busquedaCategoria ? (
              <Pressable
                onPress={limpiarCategoria}
                disabled={guardando}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#98A2B3"
                />
              </Pressable>
            ) : null}
          </View>

          {categoriaSeleccionada ? (
            <View style={styles.seleccionActual}>
              <Text style={styles.seleccionActualEtiqueta}>
                Categoría seleccionada
              </Text>
              <Text style={styles.seleccionActualTexto}>
                {categoriaSeleccionada.nombre}
              </Text>
            </View>
          ) : null}

          {buscandoCategoria ? (
            <View style={styles.procesando}>
              <ActivityIndicator size="small" />
              <Text style={styles.procesandoTexto}>
                Buscando categorías...
              </Text>
            </View>
          ) : null}

          {errorCategoria ? (
            <Text style={styles.errorBusqueda}>
              {errorCategoria}
            </Text>
          ) : null}

          {!categoriaSeleccionada &&
          busquedaCategoria.trim().length > 0 &&
          busquedaCategoria.trim().length < 2 ? (
            <Text style={styles.ayudaBusqueda}>
              Escribe al menos 2 caracteres.
            </Text>
          ) : null}

          {resultadosCategoria.length > 0 ? (
            <View style={styles.resultados}>
              {resultadosCategoria.map((categoria) => (
                <Pressable
                  key={categoria.id}
                  style={styles.resultado}
                  onPress={() =>
                    seleccionarCategoria(categoria)
                  }
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color="#2563EB"
                  />
                  <Text style={styles.resultadoTexto}>
                    {categoria.nombre}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#98A2B3"
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Tarifa
          </Text>
          <Text style={styles.seccionSubtitulo}>
            Actualiza el rango de precio
          </Text>

          <Text style={styles.etiqueta}>
            Tarifa mínima{' '}
            <Text style={styles.requerido}>*</Text>
          </Text>
          <View style={styles.inputDineroContenedor}>
            <Text style={styles.simboloDinero}>$</Text>
            <TextInput
              style={styles.inputDinero}
              value={tarifaMinima}
              onChangeText={setTarifaMinima}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#98A2B3"
            />
          </View>

          <Text style={styles.etiqueta}>
            Tarifa máxima
          </Text>
          <View style={styles.inputDineroContenedor}>
            <Text style={styles.simboloDinero}>$</Text>
            <TextInput
              style={styles.inputDinero}
              value={tarifaMaxima}
              onChangeText={setTarifaMaxima}
              keyboardType="decimal-pad"
              placeholder="Opcional"
              placeholderTextColor="#98A2B3"
            />
          </View>
        </View>

        <Pressable
          style={[
            styles.botonGuardar,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardarCambios}
          disabled={
            guardando ||
            cambiandoEstado ||
            eliminando
          }
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
          <Text style={styles.botonGuardarTexto}>
            {guardando
              ? 'Guardando...'
              : 'Guardar cambios'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.botonEliminar}
          onPress={confirmarEliminacion}
          disabled={
            guardando ||
            cambiandoEstado ||
            eliminando
          }
        >
          {eliminando ? (
            <ActivityIndicator
              size="small"
              color="#B42318"
            />
          ) : (
            <Ionicons
              name="trash-outline"
              size={20}
              color="#B42318"
            />
          )}
          <Text style={styles.botonEliminarTexto}>
            {eliminando
              ? 'Eliminando...'
              : 'Eliminar servicio'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8FAFC' },
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
  encabezadoTexto: { flex: 1, alignItems: 'center' },
  tituloEncabezado: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  subtituloEncabezado: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  espacioEncabezado: { width: 44 },
  scroll: { flex: 1 },
  contenido: { padding: 18, paddingBottom: 40 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarga: {
    marginTop: 12,
    color: '#667085',
  },
  seccion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  seccionSubtitulo: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 12,
    color: '#667085',
  },
  estados: {
    flexDirection: 'row',
    gap: 10,
  },
  estadoBoton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoActivo: {
    borderColor: '#6CE9A6',
    backgroundColor: '#ECFDF3',
  },
  estadoInactivo: {
    borderColor: '#FEC84B',
    backgroundColor: '#FFFAEB',
  },
  estadoTexto: {
    marginLeft: 7,
    fontWeight: '600',
    color: '#344054',
  },
  procesando: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  procesandoTexto: {
    marginLeft: 8,
    fontSize: 12,
    color: '#667085',
  },
  etiqueta: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },
  requerido: { color: '#D92D20' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#101828',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 13,
    paddingBottom: 13,
  },
  contador: {
    marginTop: 5,
    marginBottom: 16,
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#98A2B3',
  },
  buscador: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buscadorSeleccionado: {
    borderColor: '#5EEAD4',
    backgroundColor: '#F0FDFA',
  },
  inputBusqueda: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 14,
    color: '#101828',
  },
  seleccionActual: {
    marginTop: 10,
    padding: 12,
    borderRadius: 11,
    backgroundColor: '#F0FDFA',
  },
  seleccionActualEtiqueta: {
    fontSize: 11,
    color: '#667085',
  },
  seleccionActualTexto: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  errorBusqueda: {
    marginTop: 10,
    fontSize: 12,
    color: '#B42318',
  },
  ayudaBusqueda: {
    marginTop: 10,
    fontSize: 12,
    color: '#667085',
  },
  resultados: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultado: {
    minHeight: 50,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultadoTexto: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },
  inputDineroContenedor: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  simboloDinero: {
    fontSize: 16,
    fontWeight: '700',
    color: '#344054',
  },
  inputDinero: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#101828',
  },
  botonGuardar: {
    minHeight: 52,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardarTexto: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonEliminar: {
    minHeight: 50,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 13,
    backgroundColor: '#FEF3F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonEliminarTexto: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#B42318',
  },
  botonDeshabilitado: { opacity: 0.6 },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  errorTitulo: {
    marginTop: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
