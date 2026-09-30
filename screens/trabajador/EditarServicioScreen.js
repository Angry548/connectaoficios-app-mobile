import React, { useCallback, useEffect, useState } from 'react';
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

export default function EditarServicioScreen({ route, navigation }) {
  const servicioId = route?.params?.servicioId;

  const [servicio, setServicio] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const [categoriaId, setCategoriaId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tarifaMinima, setTarifaMinima] = useState('');
  const [tarifaMaxima, setTarifaMaxima] = useState('');
  const [estado, setEstado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');
  const [alturaTeclado, setAlturaTeclado] = useState(0);

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
      setError('No se recibió el identificador del servicio.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const [servicioActual, categoriasDisponibles] =
        await Promise.all([
          servicioService.obtenerPorId(servicioId),
          servicioService.listarCategorias(),
        ]);

      setServicio(servicioActual);
      setCategorias(categoriasDisponibles);

      setCategoriaId(servicioActual.categoriaId ?? null);
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

      const mensaje =
        data?.message ||
        data?.mensaje ||
        err?.message ||
        'No se pudo cargar la información del servicio.';

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [servicioId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const normalizarDecimal = (valor) => {
    return valor.replace(',', '.').trim();
  };

  const obtenerMensajeError = (err, mensajePredeterminado) => {
    const data = err?.response?.data;

    if (data?.errors && typeof data.errors === 'object') {
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

    const minimaTexto =
      normalizarDecimal(tarifaMinima);

    const maximaTexto =
      normalizarDecimal(tarifaMaxima);

    if (!categoriaId) {
      Alert.alert(
        'Categoría requerida',
        'Selecciona una categoría para el servicio.'
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
      const minimaTexto =
        normalizarDecimal(tarifaMinima);

      const maximaTexto =
        normalizarDecimal(tarifaMaxima);

      const datos = {
        categoriaId: Number(categoriaId),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tarifaMinima: Number(minimaTexto),
        tarifaMaxima:
          maximaTexto === ''
            ? null
            : Number(maximaTexto),
        zonasCoberturaIds:
          servicio?.zonasCoberturaIds ?? [],
      };

      const actualizado =
        await servicioService.modificar(
          servicioId,
          datos
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

  const ejecutarCambioEstado = async (nuevoEstado) => {
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

      setServicio(actualizado);
      setEstado(actualizado.estado ?? nuevoEstado);

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

  const solicitarCambioEstado = (nuevoEstado) => {
    if (nuevoEstado === estado) {
      return;
    }

    Alert.alert(
      'Cambiar estado',
      `¿Deseas cambiar el estado del servicio a ${nuevoEstado}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
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
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: ejecutarEliminacion,
        },
      ]
    );
  };

  const obtenerNombreEstado = (valor) => {
    if (!valor) {
      return 'Sin estado';
    }

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

          <Text style={styles.tituloEncabezado}>
            Editar servicio
          </Text>

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
            paddingBottom:
              alturaTeclado + 24,
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.seccion}>
          <View style={styles.seccionCabecera}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="radio-button-on-outline"
                size={21}
                color="#0D9488"
              />
            </View>

            <View style={styles.seccionCabeceraTexto}>
              <Text style={styles.seccionTitulo}>
                Estado del servicio
              </Text>

              <Text style={styles.seccionSubtitulo}>
                Estado actual:{' '}
                {obtenerNombreEstado(estado)}
              </Text>
            </View>
          </View>

          <View style={styles.estados}>
            <Pressable
              style={[
                styles.estadoBoton,
                estado === 'ACTIVO' &&
                  styles.estadoActivoSeleccionado,
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

              <Text
                style={[
                  styles.estadoTexto,
                  estado === 'ACTIVO' &&
                    styles.estadoActivoTexto,
                ]}
              >
                Activo
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.estadoBoton,
                estado === 'INACTIVO' &&
                  styles.estadoInactivoSeleccionado,
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

              <Text
                style={[
                  styles.estadoTexto,
                  estado === 'INACTIVO' &&
                    styles.estadoInactivoTexto,
                ]}
              >
                Inactivo
              </Text>
            </Pressable>
          </View>

          {cambiandoEstado && (
            <View style={styles.procesandoEstado}>
              <ActivityIndicator size="small" />

              <Text style={styles.procesandoEstadoTexto}>
                Actualizando estado...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.seccion}>
          <View style={styles.seccionCabecera}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="briefcase-outline"
                size={21}
                color="#2563EB"
              />
            </View>

            <View style={styles.seccionCabeceraTexto}>
              <Text style={styles.seccionTitulo}>
                Información del servicio
              </Text>

              <Text style={styles.seccionSubtitulo}>
                Modifica la información de tu publicación
              </Text>
            </View>
          </View>

          <Text style={styles.etiqueta}>
            Título{' '}
            <Text style={styles.requerido}>
              *
            </Text>
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
            <Text style={styles.requerido}>
              *
            </Text>
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
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
          <View style={styles.seccionCabecera}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="pricetag-outline"
                size={21}
                color="#2563EB"
              />
            </View>

            <View style={styles.seccionCabeceraTexto}>
              <Text style={styles.seccionTitulo}>
                Categoría
              </Text>

              <Text style={styles.seccionSubtitulo}>
                Cambia la categoría del servicio
              </Text>
            </View>
          </View>

          {categorias.length === 0 ? (
            <View style={styles.aviso}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color="#B54708"
              />

              <Text style={styles.avisoTexto}>
                No hay categorías disponibles.
              </Text>
            </View>
          ) : (
            <View style={styles.categorias}>
              {categorias.map((categoria) => {
                const seleccionada =
                  Number(categoriaId) ===
                  Number(categoria.id);

                return (
                  <Pressable
                    key={categoria.id}
                    style={[
                      styles.categoria,
                      seleccionada &&
                        styles.categoriaSeleccionada,
                    ]}
                    onPress={() =>
                      setCategoriaId(
                        categoria.id
                      )
                    }
                    disabled={guardando}
                  >
                    <Ionicons
                      name={
                        seleccionada
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={
                        seleccionada
                          ? '#2563EB'
                          : '#98A2B3'
                      }
                    />

                    <Text
                      style={[
                        styles.categoriaTexto,
                        seleccionada &&
                          styles.categoriaTextoSeleccionada,
                      ]}
                    >
                      {categoria.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.seccion}>
          <View style={styles.seccionCabecera}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="cash-outline"
                size={21}
                color="#2563EB"
              />
            </View>

            <View style={styles.seccionCabeceraTexto}>
              <Text style={styles.seccionTitulo}>
                Tarifa
              </Text>

              <Text style={styles.seccionSubtitulo}>
                Actualiza el rango de precio
              </Text>
            </View>
          </View>

          <Text style={styles.etiqueta}>
            Tarifa mínima{' '}
            <Text style={styles.requerido}>
              *
            </Text>
          </Text>

          <View style={styles.inputDineroContenedor}>
            <Text style={styles.simboloDinero}>
              $
            </Text>

            <TextInput
              style={styles.inputDinero}
              value={tarifaMinima}
              onChangeText={setTarifaMinima}
              placeholder="0.00"
              placeholderTextColor="#98A2B3"
              keyboardType="decimal-pad"
              editable={!guardando}
            />
          </View>

          <Text style={styles.etiqueta}>
            Tarifa máxima
          </Text>

          <View style={styles.inputDineroContenedor}>
            <Text style={styles.simboloDinero}>
              $
            </Text>

            <TextInput
              style={styles.inputDinero}
              value={tarifaMaxima}
              onChangeText={setTarifaMaxima}
              placeholder="Opcional"
              placeholderTextColor="#98A2B3"
              keyboardType="decimal-pad"
              editable={!guardando}
            />
          </View>
        </View>

        <Pressable
          style={[
            styles.botonGuardar,
            guardando &&
              styles.botonDeshabilitado,
          ]}
          onPress={guardarCambios}
          disabled={
            guardando ||
            cambiandoEstado ||
            eliminando
          }
        >
          {guardando ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.botonGuardarTexto}>
                Guardando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.botonGuardarTexto}>
                Guardar cambios
              </Text>
            </>
          )}
        </Pressable>

        <View style={styles.zonaPeligro}>
          <View style={styles.zonaPeligroCabecera}>
            <Ionicons
              name="warning-outline"
              size={22}
              color="#B42318"
            />

            <Text style={styles.zonaPeligroTitulo}>
              Eliminar servicio
            </Text>
          </View>

          <Text style={styles.zonaPeligroTexto}>
            Al eliminar el servicio dejará de estar disponible en tu catálogo.
          </Text>

          <Pressable
            style={[
              styles.botonEliminar,
              eliminando &&
                styles.botonDeshabilitado,
            ]}
            onPress={confirmarEliminacion}
            disabled={
              eliminando ||
              guardando ||
              cambiandoEstado
            }
          >
            {eliminando ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#B42318"
                />

                <Text style={styles.botonEliminarTexto}>
                  Eliminando...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#B42318"
                />

                <Text style={styles.botonEliminarTexto}>
                  Eliminar servicio
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 45,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCarga: {
    marginTop: 12,
    fontSize: 15,
    color: '#667085',
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
  espacioEncabezado: {
    width: 44,
  },
  seccion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
    marginBottom: 16,
  },
  seccionCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  seccionIcono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  seccionCabeceraTexto: {
    flex: 1,
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  seccionSubtitulo: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: '#667085',
  },
  etiqueta: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },
  requerido: {
    color: '#D92D20',
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
  categorias: {
    gap: 9,
  },
  categoria: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriaSeleccionada: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  categoriaTexto: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#344054',
  },
  categoriaTextoSeleccionada: {
    fontWeight: '700',
    color: '#1D4ED8',
  },
  inputDineroContenedor: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 17,
  },
  simboloDinero: {
    marginRight: 8,
    fontSize: 17,
    fontWeight: '700',
    color: '#475467',
  },
  inputDinero: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: '#101828',
  },
  estados: {
    flexDirection: 'row',
    gap: 10,
  },
  estadoBoton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoActivoSeleccionado: {
    borderColor: '#12B76A',
    backgroundColor: '#ECFDF3',
  },
  estadoInactivoSeleccionado: {
    borderColor: '#F79009',
    backgroundColor: '#FFFAEB',
  },
  estadoTexto: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '600',
    color: '#475467',
  },
  estadoActivoTexto: {
    color: '#027A48',
  },
  estadoInactivoTexto: {
    color: '#B54708',
  },
  procesandoEstado: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  procesandoEstadoTexto: {
    marginLeft: 8,
    fontSize: 13,
    color: '#667085',
  },
  aviso: {
    borderRadius: 12,
    backgroundColor: '#FFFAEB',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avisoTexto: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#B54708',
  },
  botonGuardar: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  botonGuardarTexto: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  zonaPeligro: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 18,
    padding: 18,
  },
  zonaPeligroCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zonaPeligroTitulo: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#B42318',
  },
  zonaPeligroTexto: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },
  botonEliminar: {
    minHeight: 48,
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDA29B',
    backgroundColor: '#FEF3F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonEliminarTexto: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '700',
    color: '#B42318',
  },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitulo: {
    marginTop: 15,
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  errorTexto: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 20,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  botonReintentarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});