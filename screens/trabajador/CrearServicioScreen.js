import React, { useEffect, useRef, useState } from 'react';
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

export default function CrearServicioScreen({ navigation }) {
  const [categoriaId, setCategoriaId] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState(null);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [resultadosCategoria, setResultadosCategoria] =
    useState([]);
  const [buscandoCategoria, setBuscandoCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tarifaMinima, setTarifaMinima] = useState('');
  const [tarifaMaxima, setTarifaMaxima] = useState('');
  const [guardando, setGuardando] = useState(false);
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
      } catch (error) {
        if (
          solicitudActual ===
          solicitudCategoriaRef.current
        ) {
          setResultadosCategoria([]);
          setErrorCategoria(
            error?.response?.data?.message ||
              error?.response?.data?.mensaje ||
              error?.message ||
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

  const guardarServicio = async () => {
    if (guardando || !validarFormulario()) {
      return;
    }

    Keyboard.dismiss();
    setGuardando(true);

    try {
      await servicioService.crearServicio({
        categoriaId,
        titulo,
        descripcion,
        tarifaMinima: normalizarDecimal(tarifaMinima),
        tarifaMaxima: normalizarDecimal(tarifaMaxima),
      });

      Alert.alert(
        'Servicio creado',
        'Tu servicio fue publicado correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      const data = error?.response?.data;
      let mensaje =
        data?.message ||
        data?.mensaje ||
        error?.message ||
        'No se pudo crear el servicio. Intenta nuevamente.';

      if (
        data?.errors &&
        typeof data.errors === 'object'
      ) {
        const mensajes = Object.values(data.errors)
          .flat()
          .filter(Boolean);

        if (mensajes.length > 0) {
          mensaje = mensajes.join('\n');
        }
      }

      Alert.alert(
        'No se pudo crear el servicio',
        mensaje
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          disabled={guardando}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.tituloPantalla}>
            Crear servicio
          </Text>
          <Text style={styles.subtituloPantalla}>
            Publica un nuevo servicio
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
          <View style={styles.seccionTituloContenedor}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="briefcase-outline"
                size={21}
                color="#2563EB"
              />
            </View>
            <View style={styles.seccionTituloTexto}>
              <Text style={styles.seccionTitulo}>
                Información del servicio
              </Text>
              <Text style={styles.seccionSubtitulo}>
                Describe el trabajo que deseas ofrecer
              </Text>
            </View>
          </View>

          <Text style={styles.etiqueta}>
            Título <Text style={styles.requerido}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Reparación de computadoras"
            placeholderTextColor="#98A2B3"
            maxLength={150}
            editable={!guardando}
          />
          <Text style={styles.contador}>
            {titulo.length}/150
          </Text>

          <Text style={styles.etiqueta}>
            Descripción <Text style={styles.requerido}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe qué incluye el servicio que ofreces"
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
          <View style={styles.seccionTituloContenedor}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="pricetag-outline"
                size={21}
                color="#2563EB"
              />
            </View>
            <View style={styles.seccionTituloTexto}>
              <Text style={styles.seccionTitulo}>
                Categoría
              </Text>
              <Text style={styles.seccionSubtitulo}>
                Escribe al menos 2 caracteres para buscar
              </Text>
            </View>
          </View>

          <Text style={styles.etiqueta}>
            Buscar categoría{' '}
            <Text style={styles.requerido}>*</Text>
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
              placeholder="Ej. electricidad"
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
            <View style={styles.estadoBusqueda}>
              <ActivityIndicator size="small" />
              <Text style={styles.estadoBusquedaTexto}>
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

          {!categoriaSeleccionada &&
          !buscandoCategoria &&
          busquedaCategoria.trim().length >= 2 &&
          resultadosCategoria.length === 0 &&
          !errorCategoria ? (
            <Text style={styles.ayudaBusqueda}>
              No se encontraron coincidencias.
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
                  disabled={guardando}
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
          <View style={styles.seccionTituloContenedor}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="cash-outline"
                size={21}
                color="#2563EB"
              />
            </View>
            <View style={styles.seccionTituloTexto}>
              <Text style={styles.seccionTitulo}>
                Tarifa
              </Text>
              <Text style={styles.seccionSubtitulo}>
                Define el rango de precio de tu servicio
              </Text>
            </View>
          </View>

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
            <Text style={styles.simboloDinero}>$</Text>
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

          <View style={styles.informacionTarifa}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#2563EB"
            />
            <Text style={styles.informacionTarifaTexto}>
              La tarifa máxima es opcional. Puedes indicar solamente el precio mínimo desde el cual ofreces tu servicio.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.botonGuardar,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardarServicio}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color="#FFFFFF"
            />
          )}
          <Text style={styles.botonGuardarTexto}>
            {guardando
              ? 'Publicando...'
              : 'Publicar servicio'}
          </Text>
        </Pressable>

        <Text style={styles.camposObligatorios}>
          * Campos obligatorios
        </Text>
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
  tituloPantalla: {
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  subtituloPantalla: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  espacioEncabezado: { width: 44 },
  scroll: { flex: 1 },
  contenido: { padding: 18, paddingBottom: 40 },
  seccion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
    marginBottom: 16,
  },
  seccionTituloContenedor: {
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
  seccionTituloTexto: { flex: 1 },
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
  requerido: { color: '#D92D20' },
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
  estadoBusqueda: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoBusquedaTexto: {
    marginLeft: 8,
    fontSize: 12,
    color: '#667085',
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
  informacionTarifa: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  informacionTarifaTexto: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#475467',
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
  botonDeshabilitado: { opacity: 0.6 },
  camposObligatorios: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 11,
    color: '#98A2B3',
  },
});
