import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { zonaCoberturaService } from '../../services/zonaCoberturaService';

export default function ZonaCoberturaScreen({
  route,
  navigation,
}) {
  const servicioId = route?.params?.servicioId;
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [zonasSeleccionadas, setZonasSeleccionadas] =
    useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const solicitudRef = useRef(0);

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
      const ids =
        await zonaCoberturaService.obtenerZonasDelServicio(
          servicioId
        );

      const detalles =
        await zonaCoberturaService.obtenerDetalleZonasPorIds(
          ids
        );

      setSeleccionadas(ids);
      setZonasSeleccionadas(detalles);
    } catch (err) {
      const data = err?.response?.data;

      setError(
        data?.message ||
          data?.mensaje ||
          err?.message ||
          'No se pudieron cargar las zonas de cobertura.'
      );
    } finally {
      setCargando(false);
    }
  }, [servicioId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const texto = busqueda.trim();

    if (texto.length < 2) {
      setResultados([]);
      setBuscando(false);
      setErrorBusqueda('');
      return;
    }

    const solicitudActual = ++solicitudRef.current;

    const temporizador = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda('');

      try {
        const data =
          await zonaCoberturaService.buscar(
            texto,
            10
          );

        if (
          solicitudActual ===
          solicitudRef.current
        ) {
          setResultados(data);
        }
      } catch (err) {
        if (
          solicitudActual ===
          solicitudRef.current
        ) {
          setResultados([]);
          setErrorBusqueda(
            err?.response?.data?.message ||
              err?.response?.data?.mensaje ||
              err?.message ||
              'No se pudieron buscar las zonas.'
          );
        }
      } finally {
        if (
          solicitudActual ===
          solicitudRef.current
        ) {
          setBuscando(false);
        }
      }
    }, 350);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const estaSeleccionada = (id) =>
    seleccionadas.includes(Number(id));

  const alternarZona = (zona) => {
    const zonaId = Number(zona.id);

    if (estaSeleccionada(zonaId)) {
      setSeleccionadas((actuales) =>
        actuales.filter(
          (actual) => actual !== zonaId
        )
      );
      setZonasSeleccionadas((actuales) =>
        actuales.filter(
          (actual) =>
            Number(actual.id) !== zonaId
        )
      );
      return;
    }

    setSeleccionadas((actuales) => [
      ...actuales,
      zonaId,
    ]);

    setZonasSeleccionadas((actuales) => {
      if (
        actuales.some(
          (actual) =>
            Number(actual.id) === zonaId
        )
      ) {
        return actuales;
      }

      return [...actuales, zona];
    });
  };

  const guardar = async () => {
    if (guardando) {
      return;
    }

    setGuardando(true);

    try {
      await zonaCoberturaService.guardarZonasDelServicio(
        servicioId,
        seleccionadas
      );

      Alert.alert(
        'Zonas actualizadas',
        'Las zonas de cobertura fueron guardadas correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      const data = err?.response?.data;
      let mensaje =
        data?.message ||
        data?.mensaje ||
        err?.message ||
        'No se pudieron guardar las zonas de cobertura.';

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
        'No se pudieron guardar',
        mensaje
      );
    } finally {
      setGuardando(false);
    }
  };

  const obtenerTituloZona = (zona) =>
    zona.localidad ||
    zona.municipio ||
    'Zona de cobertura';

  const obtenerUbicacion = (zona) =>
    [
      zona.localidad ? zona.municipio : null,
      zona.departamento,
    ]
      .filter(Boolean)
      .join(', ');

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />
          <Text style={styles.textoCarga}>
            Cargando zonas seleccionadas...
          </Text>
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
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            Zonas de cobertura
          </Text>
          <Text style={styles.subtitulo}>
            Define dónde brindas el servicio
          </Text>
        </View>

        <View style={styles.espacio} />
      </View>

      <View style={styles.buscadorContenedor}>
        <View style={styles.buscador}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#667085"
          />
          <TextInput
            style={styles.inputBusqueda}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Escribe municipio, departamento o localidad"
            placeholderTextColor="#98A2B3"
            autoCorrect={false}
          />
          {busqueda ? (
            <Pressable
              onPress={() => setBusqueda('')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#98A2B3"
              />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.resumen}>
          {seleccionadas.length === 1
            ? '1 zona seleccionada'
            : `${seleccionadas.length} zonas seleccionadas`}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.error}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color="#B42318"
            />
            <Text style={styles.errorTexto}>
              {error}
            </Text>
            <Pressable onPress={cargarDatos}>
              <Text style={styles.reintentar}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : null}

        {zonasSeleccionadas.length > 0 ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              Zonas seleccionadas
            </Text>

            {zonasSeleccionadas.map((zona) => (
              <Pressable
                key={zona.id}
                style={[
                  styles.zona,
                  styles.zonaSeleccionada,
                ]}
                onPress={() =>
                  alternarZona(zona)
                }
              >
                <View
                  style={[
                    styles.iconoZona,
                    styles.iconoZonaSeleccionada,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={22}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.zonaContenido}>
                  <Text style={styles.municipio}>
                    {obtenerTituloZona(zona)}
                  </Text>
                  <Text style={styles.departamento}>
                    {obtenerUbicacion(zona)}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle"
                  size={25}
                  color="#0D9488"
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            Buscar zonas
          </Text>

          {busqueda.trim().length === 0 ? (
            <View style={styles.vacio}>
              <Ionicons
                name="search-outline"
                size={42}
                color="#98A2B3"
              />
              <Text style={styles.vacioTitulo}>
                Busca una zona
              </Text>
              <Text style={styles.vacioTexto}>
                No cargamos todas las zonas. Escribe al menos 2 caracteres para consultar hasta 10 coincidencias.
              </Text>
            </View>
          ) : busqueda.trim().length < 2 ? (
            <Text style={styles.ayuda}>
              Escribe al menos 2 caracteres para buscar.
            </Text>
          ) : buscando ? (
            <View style={styles.estadoBusqueda}>
              <ActivityIndicator size="small" />
              <Text style={styles.estadoBusquedaTexto}>
                Buscando coincidencias...
              </Text>
            </View>
          ) : errorBusqueda ? (
            <Text style={styles.errorBusqueda}>
              {errorBusqueda}
            </Text>
          ) : resultados.length === 0 ? (
            <View style={styles.vacio}>
              <Ionicons
                name="location-outline"
                size={42}
                color="#98A2B3"
              />
              <Text style={styles.vacioTitulo}>
                Sin coincidencias
              </Text>
              <Text style={styles.vacioTexto}>
                No encontramos zonas activas para esa búsqueda.
              </Text>
            </View>
          ) : (
            resultados.map((zona) => {
              const seleccionada =
                estaSeleccionada(zona.id);

              return (
                <Pressable
                  key={zona.id}
                  style={[
                    styles.zona,
                    seleccionada &&
                      styles.zonaSeleccionada,
                  ]}
                  onPress={() =>
                    alternarZona(zona)
                  }
                >
                  <View
                    style={[
                      styles.iconoZona,
                      seleccionada &&
                        styles.iconoZonaSeleccionada,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color={
                        seleccionada
                          ? '#FFFFFF'
                          : '#0D9488'
                      }
                    />
                  </View>

                  <View style={styles.zonaContenido}>
                    <Text style={styles.municipio}>
                      {obtenerTituloZona(zona)}
                    </Text>
                    <Text style={styles.departamento}>
                      {obtenerUbicacion(zona)}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      seleccionada
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={25}
                    color={
                      seleccionada
                        ? '#0D9488'
                        : '#D0D5DD'
                    }
                  />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.pie}>
        <Pressable
          style={[
            styles.botonGuardar,
            guardando &&
              styles.botonDeshabilitado,
          ]}
          onPress={guardar}
          disabled={guardando || !!error}
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
              : 'Guardar zonas'}
          </Text>
        </Pressable>
      </View>
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
  espacio: { width: 44 },
  buscadorContenedor: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
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
  inputBusqueda: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 14,
    color: '#101828',
  },
  resumen: {
    marginTop: 9,
    fontSize: 12,
    color: '#667085',
  },
  scroll: { flex: 1 },
  contenido: {
    padding: 18,
    paddingBottom: 30,
  },
  seccion: { marginBottom: 18 },
  seccionTitulo: {
    marginBottom: 11,
    fontSize: 15,
    fontWeight: '700',
    color: '#344054',
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
  zona: {
    minHeight: 82,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zonaSeleccionada: {
    borderColor: '#5EEAD4',
    backgroundColor: '#F0FDFA',
  },
  iconoZona: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconoZonaSeleccionada: {
    backgroundColor: '#0D9488',
  },
  zonaContenido: { flex: 1 },
  municipio: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
  },
  departamento: {
    marginTop: 4,
    fontSize: 12,
    color: '#667085',
  },
  pie: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },
  botonGuardar: {
    minHeight: 52,
    borderRadius: 13,
    backgroundColor: '#0D9488',
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
  vacio: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  vacioTitulo: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  vacioTexto: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    textAlign: 'center',
  },
  ayuda: {
    paddingVertical: 18,
    textAlign: 'center',
    color: '#667085',
    fontSize: 13,
  },
  estadoBusqueda: {
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoBusquedaTexto: {
    marginLeft: 8,
    color: '#667085',
    fontSize: 13,
  },
  errorBusqueda: {
    paddingVertical: 18,
    textAlign: 'center',
    color: '#B42318',
    fontSize: 13,
  },
  error: {
    borderRadius: 13,
    backgroundColor: '#FEF3F2',
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTexto: {
    marginTop: 8,
    fontSize: 13,
    color: '#B42318',
    textAlign: 'center',
  },
  reintentar: {
    marginTop: 10,
    fontWeight: '700',
    color: '#B42318',
  },
});
