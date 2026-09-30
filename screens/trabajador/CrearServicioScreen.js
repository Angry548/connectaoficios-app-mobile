import React, { useEffect, useState } from 'react';
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
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tarifaMinima, setTarifaMinima] = useState('');
  const [tarifaMaxima, setTarifaMaxima] = useState('');
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState('');
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', (evento) => {
      setAlturaTeclado(evento.endCoordinates.height);
    });

    const ocultar = Keyboard.addListener('keyboardDidHide', () => {
      setAlturaTeclado(0);
    });

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  const cargarCategorias = async () => {
    setCargandoCategorias(true);
    setErrorCategorias('');

    try {
      const data = await servicioService.listarCategorias();
      setCategorias(data);
    } catch (error) {
      const mensaje =
        error?.response?.data?.message ||
        error?.response?.data?.mensaje ||
        error?.message ||
        'No se pudieron cargar las categorías.';

      setErrorCategorias(mensaje);
    } finally {
      setCargandoCategorias(false);
    }
  };

  const normalizarDecimal = (valor) => {
    return valor.replace(',', '.').trim();
  };

  const validarFormulario = () => {
    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();
    const minimaTexto = normalizarDecimal(tarifaMinima);
    const maximaTexto = normalizarDecimal(tarifaMaxima);

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

      if (data?.errors && typeof data.errors === 'object') {
        const mensajes = Object.values(data.errors)
          .flat()
          .filter(Boolean);

        if (mensajes.length > 0) {
          mensaje = mensajes.join('\n');
        }
      }

      Alert.alert('No se pudo crear el servicio', mensaje);
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
                Selecciona la categoría que mejor describe tu servicio
              </Text>
            </View>
          </View>

          {cargandoCategorias ? (
            <View style={styles.cargandoCategorias}>
              <ActivityIndicator size="small" />
              <Text style={styles.cargandoCategoriasTexto}>
                Cargando categorías...
              </Text>
            </View>
          ) : errorCategorias ? (
            <View style={styles.errorCategorias}>
              <Text style={styles.errorCategoriasTexto}>
                {errorCategorias}
              </Text>

              <Pressable
                style={styles.reintentarCategorias}
                onPress={cargarCategorias}
              >
                <Text style={styles.reintentarCategoriasTexto}>
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : categorias.length === 0 ? (
            <View style={styles.errorCategorias}>
              <Text style={styles.errorCategoriasTexto}>
                No hay categorías disponibles.
              </Text>
            </View>
          ) : (
            <View style={styles.categorias}>
              {categorias.map((categoria) => {
                const seleccionada =
                  Number(categoriaId) === Number(categoria.id);

                return (
                  <Pressable
                    key={categoria.id}
                    style={[
                      styles.categoria,
                      seleccionada && styles.categoriaSeleccionada,
                    ]}
                    onPress={() => setCategoriaId(categoria.id)}
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
            Tarifa mínima <Text style={styles.requerido}>*</Text>
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
              La tarifa máxima es opcional. Puedes indicar solamente el
              precio mínimo desde el cual ofreces tu servicio.
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
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
              <Text style={styles.botonGuardarTexto}>
                Publicando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />
              <Text style={styles.botonGuardarTexto}>
                Publicar servicio
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.camposObligatorios}>
          * Campos obligatorios
        </Text>
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
  espacioEncabezado: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
  },
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
  seccionTituloTexto: {
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
  cargandoCategorias: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargandoCategoriasTexto: {
    marginLeft: 9,
    fontSize: 14,
    color: '#667085',
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
  errorCategorias: {
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    padding: 14,
  },
  errorCategoriasTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: '#B42318',
  },
  reintentarCategorias: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  reintentarCategoriasTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B42318',
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
  informacionTarifa: {
    marginTop: 2,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  informacionTarifaTexto: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#475467',
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
  botonDeshabilitado: {
    opacity: 0.65,
  },
  botonGuardarTexto: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  camposObligatorios: {
    marginTop: 12,
    fontSize: 12,
    color: '#98A2B3',
    textAlign: 'center',
  },
});