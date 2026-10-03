import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { servicioService } from '../../services/servicioService';
import { zonaCoberturaService } from '../../services/zonaCoberturaService';
import { userService } from '../../services/userService';

const DIAS_SEMANA = [
  {
    valor: 'LUNES',
    etiqueta: 'Lunes',
  },
  {
    valor: 'MARTES',
    etiqueta: 'Martes',
  },
  {
    valor: 'MIERCOLES',
    etiqueta: 'Miércoles',
  },
  {
    valor: 'JUEVES',
    etiqueta: 'Jueves',
  },
  {
    valor: 'VIERNES',
    etiqueta: 'Viernes',
  },
  {
    valor: 'SABADO',
    etiqueta: 'Sábado',
  },
  {
    valor: 'DOMINGO',
    etiqueta: 'Domingo',
  },
];

const convertirNumero = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return null;
  }

  const numero = Number(
    String(valor).replace(',', '.')
  );

  return Number.isFinite(numero)
    ? numero
    : null;
};

export default function BuscarServiciosScreen({
  navigation,
}) {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [trabajadores, setTrabajadores] = useState({});

  const [texto, setTexto] = useState('');

  const [categoriaId, setCategoriaId] = useState(null);
  const [zonaSeleccionada, setZonaSeleccionada] =
    useState(null);
  const [diaSemana, setDiaSemana] = useState(null);
  const [tarifaMinima, setTarifaMinima] = useState(null);
  const [tarifaMaxima, setTarifaMaxima] = useState(null);

  const [modalFiltrosVisible, setModalFiltrosVisible] =
    useState(false);

  const [
    categoriaTemporalId,
    setCategoriaTemporalId,
  ] = useState(null);

  const [
    zonaTemporalSeleccionada,
    setZonaTemporalSeleccionada,
  ] = useState(null);

  const [textoZonaTemporal, setTextoZonaTemporal] =
    useState('');

  const [diaTemporal, setDiaTemporal] = useState(null);

  const [
    tarifaMinimaTemporal,
    setTarifaMinimaTemporal,
  ] = useState('');

  const [
    tarifaMaximaTemporal,
    setTarifaMaximaTemporal,
  ] = useState('');

  const [
    sugerenciasZona,
    setSugerenciasZona,
  ] = useState([]);

  const [
    buscandoZonas,
    setBuscandoZonas,
  ] = useState(false);

  const [errorFiltros, setErrorFiltros] = useState('');

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [error, setError] = useState('');

  const obtenerContenidoPagina = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.contenido)) {
      return data.contenido;
    }
    if (Array.isArray(data?.content)) {
      return data.content;
    }
    if (Array.isArray(data?.elementos)) {
      return data.elementos;
    }

    return [];
  };

  const obtenerMensajeError = (err) => {
    const data = err?.response?.data;

    return (
      data?.message ||
      data?.mensaje ||
      err?.message ||
      'No se pudieron cargar los servicios.'
    );
  };

  const cargarCategorias = useCallback(async () => {
    try {
      const data =
        await servicioService.listarCategorias();

      setCategorias(
        Array.isArray(data) ? data : []
      );
    } catch {
      setCategorias([]);
    }
  }, []);

  const cargarTrabajadores = useCallback(
    async (serviciosObtenidos) => {
      const perfilesIds = [
        ...new Set(
          serviciosObtenidos
            .map((servicio) =>
              Number(servicio.perfilTrabajadorId)
            )
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            )
        ),
      ];

      const resultado = {};

      await Promise.all(
        perfilesIds.map(async (perfilId) => {
          try {
            const perfil =
              await servicioService.obtenerPerfilTrabajadorPorId(
                perfilId
              );

            const trabajadorId = Number(
              perfil?.trabajadorId
            );

            if (
              !Number.isInteger(trabajadorId) ||
              trabajadorId <= 0
            ) {
              return;
            }

            let usuario = null;

            try {
              usuario =
                await userService.obtenerUsuarioPorId(
                  trabajadorId
                );
            } catch {
              usuario = null;
            }

            resultado[perfilId] = {
              perfil,
              usuario,
              trabajadorId,
            };
          } catch {
            resultado[perfilId] = null;
          }
        })
      );

      setTrabajadores(resultado);
    },
    []
  );

  const cargarServicios = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const data =
          await servicioService.listar({
            texto: texto.trim() || null,
            categoriaId,
            zonaId:
              zonaSeleccionada?.id ?? null,
            diaSemana,
            estado: 'ACTIVO',
            tarifaMinima,
            tarifaMaxima,
            page: 0,
            size: 50,
          });

        const serviciosObtenidos =
          obtenerContenidoPagina(data);

        setServicios(serviciosObtenidos);

        await cargarTrabajadores(
          serviciosObtenidos
        );
      } catch (err) {
        setServicios([]);
        setTrabajadores({});
        setError(obtenerMensajeError(err));
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [
      texto,
      categoriaId,
      zonaSeleccionada,
      diaSemana,
      tarifaMinima,
      tarifaMaxima,
      cargarTrabajadores,
    ]
  );

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarServicios();
    }, 350);

    return () => {
      clearTimeout(temporizador);
    };
  }, [cargarServicios]);

  useEffect(() => {
    if (!modalFiltrosVisible) {
      setSugerenciasZona([]);
      setBuscandoZonas(false);
      return;
    }

    if (zonaTemporalSeleccionada) {
      setSugerenciasZona([]);
      setBuscandoZonas(false);
      return;
    }

    const textoLimpio =
      textoZonaTemporal.trim();

    if (textoLimpio.length < 2) {
      setSugerenciasZona([]);
      setBuscandoZonas(false);
      return;
    }

    let activo = true;

    const temporizador = setTimeout(
      async () => {
        setBuscandoZonas(true);

        try {
          const zonas =
            await zonaCoberturaService.buscar(
              textoLimpio,
              10
            );

          if (activo) {
            setSugerenciasZona(zonas);
          }
        } catch {
          if (activo) {
            setSugerenciasZona([]);
          }
        } finally {
          if (activo) {
            setBuscandoZonas(false);
          }
        }
      },
      350
    );

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [
    textoZonaTemporal,
    zonaTemporalSeleccionada,
    modalFiltrosVisible,
  ]);

  const actualizar = async () => {
    setActualizando(true);
    await cargarServicios(false);
  };

  const abrirFiltros = () => {
    setCategoriaTemporalId(categoriaId);
    setZonaTemporalSeleccionada(
      zonaSeleccionada
    );

    setTextoZonaTemporal(
      zonaSeleccionada
        ? zonaCoberturaService.obtenerNombreZona(
            zonaSeleccionada
          )
        : ''
    );

    setDiaTemporal(diaSemana);

    setTarifaMinimaTemporal(
      tarifaMinima !== null &&
        tarifaMinima !== undefined
        ? String(tarifaMinima)
        : ''
    );

    setTarifaMaximaTemporal(
      tarifaMaxima !== null &&
        tarifaMaxima !== undefined
        ? String(tarifaMaxima)
        : ''
    );

    setSugerenciasZona([]);
    setErrorFiltros('');
    setModalFiltrosVisible(true);
  };

  const cerrarFiltros = () => {
    Keyboard.dismiss();
    setModalFiltrosVisible(false);
    setSugerenciasZona([]);
    setBuscandoZonas(false);
    setErrorFiltros('');
  };

  const cambiarTextoZonaTemporal = (valor) => {
    setTextoZonaTemporal(valor);

    if (zonaTemporalSeleccionada) {
      setZonaTemporalSeleccionada(null);
    }
  };

  const seleccionarZonaTemporal = (zona) => {
    setZonaTemporalSeleccionada(zona);

    setTextoZonaTemporal(
      zonaCoberturaService.obtenerNombreZona(
        zona
      )
    );

    setSugerenciasZona([]);
    Keyboard.dismiss();
  };

  const limpiarZonaTemporal = () => {
    setZonaTemporalSeleccionada(null);
    setTextoZonaTemporal('');
    setSugerenciasZona([]);
  };

  const limpiarFiltrosTemporales = () => {
    setCategoriaTemporalId(null);
    setZonaTemporalSeleccionada(null);
    setTextoZonaTemporal('');
    setDiaTemporal(null);
    setTarifaMinimaTemporal('');
    setTarifaMaximaTemporal('');
    setSugerenciasZona([]);
    setErrorFiltros('');
  };

  const aplicarFiltros = () => {
    const minimo = convertirNumero(
      tarifaMinimaTemporal
    );

    const maximo = convertirNumero(
      tarifaMaximaTemporal
    );

    if (
      tarifaMinimaTemporal.trim() &&
      minimo === null
    ) {
      setErrorFiltros(
        'Ingresa una tarifa mínima válida.'
      );
      return;
    }

    if (
      tarifaMaximaTemporal.trim() &&
      maximo === null
    ) {
      setErrorFiltros(
        'Ingresa una tarifa máxima válida.'
      );
      return;
    }

    if (
      minimo !== null &&
      minimo < 0
    ) {
      setErrorFiltros(
        'La tarifa mínima no puede ser negativa.'
      );
      return;
    }

    if (
      maximo !== null &&
      maximo < 0
    ) {
      setErrorFiltros(
        'La tarifa máxima no puede ser negativa.'
      );
      return;
    }

    if (
      minimo !== null &&
      maximo !== null &&
      minimo > maximo
    ) {
      setErrorFiltros(
        'La tarifa mínima no puede ser mayor que la tarifa máxima.'
      );
      return;
    }

    if (
      textoZonaTemporal.trim() &&
      !zonaTemporalSeleccionada
    ) {
      setErrorFiltros(
        'Selecciona una ubicación de las sugerencias.'
      );
      return;
    }

    setCategoriaId(categoriaTemporalId);
    setZonaSeleccionada(
      zonaTemporalSeleccionada
    );
    setDiaSemana(diaTemporal);
    setTarifaMinima(minimo);
    setTarifaMaxima(maximo);

    Keyboard.dismiss();
    setModalFiltrosVisible(false);
    setSugerenciasZona([]);
    setErrorFiltros('');
  };

  const limpiarFiltros = () => {
    setCategoriaId(null);
    setZonaSeleccionada(null);
    setDiaSemana(null);
    setTarifaMinima(null);
    setTarifaMaxima(null);
  };

  const limpiarTodo = () => {
    setTexto('');
    limpiarFiltros();
  };

  const obtenerNombreCategoria = (id) => {
    return (
      categorias.find(
        (categoria) =>
          Number(categoria.id) === Number(id)
      )?.nombre ?? `Categoría ${id}`
    );
  };

  const obtenerNombreDia = (dia) => {
    return (
      DIAS_SEMANA.find(
        (item) => item.valor === dia
      )?.etiqueta ?? dia
    );
  };

  const obtenerTarifa = (servicio) => {
    const minima = Number(
      servicio.tarifaMinima
    );

    const maxima =
      servicio.tarifaMaxima !== null &&
      servicio.tarifaMaxima !== undefined
        ? Number(servicio.tarifaMaxima)
        : null;

    if (
      Number.isFinite(maxima) &&
      maxima !== null
    ) {
      return `$${minima.toFixed(
        2
      )} - $${maxima.toFixed(2)}`;
    }

    if (Number.isFinite(minima)) {
      return `Desde $${minima.toFixed(2)}`;
    }

    return 'Consultar tarifa';
  };

  const obtenerTrabajador = (servicio) => {
    return trabajadores[
      Number(servicio.perfilTrabajadorId)
    ];
  };

  const cantidadFiltros = useMemo(() => {
    let cantidad = 0;

    if (categoriaId !== null) {
      cantidad += 1;
    }

    if (zonaSeleccionada !== null) {
      cantidad += 1;
    }

    if (diaSemana !== null) {
      cantidad += 1;
    }

    if (
      tarifaMinima !== null ||
      tarifaMaxima !== null
    ) {
      cantidad += 1;
    }

    return cantidad;
  }, [
    categoriaId,
    zonaSeleccionada,
    diaSemana,
    tarifaMinima,
    tarifaMaxima,
  ]);

  const hayFiltros = useMemo(
    () =>
      !!texto.trim() ||
      cantidadFiltros > 0,
    [
      texto,
      cantidadFiltros,
    ]
  );

  const filtrosActivos = useMemo(() => {
    const filtros = [];

    if (categoriaId !== null) {
      filtros.push({
        id: 'categoria',
        icono: 'pricetag-outline',
        texto:
          obtenerNombreCategoria(
            categoriaId
          ),
      });
    }

    if (zonaSeleccionada) {
      filtros.push({
        id: 'zona',
        icono: 'location-outline',
        texto:
          zonaCoberturaService.obtenerNombreZona(
            zonaSeleccionada
          ),
      });
    }

    if (diaSemana) {
      filtros.push({
        id: 'dia',
        icono: 'calendar-outline',
        texto:
          obtenerNombreDia(diaSemana),
      });
    }

    if (
      tarifaMinima !== null ||
      tarifaMaxima !== null
    ) {
      let textoPrecio = '';

      if (
        tarifaMinima !== null &&
        tarifaMaxima !== null
      ) {
        textoPrecio =
          `$${Number(
            tarifaMinima
          ).toFixed(2)} - $${Number(
            tarifaMaxima
          ).toFixed(2)}`;
      } else if (
        tarifaMinima !== null
      ) {
        textoPrecio =
          `Desde $${Number(
            tarifaMinima
          ).toFixed(2)}`;
      } else {
        textoPrecio =
          `Hasta $${Number(
            tarifaMaxima
          ).toFixed(2)}`;
      }

      filtros.push({
        id: 'precio',
        icono: 'cash-outline',
        texto: textoPrecio,
      });
    }

    return filtros;
  }, [
    categoriaId,
    zonaSeleccionada,
    diaSemana,
    tarifaMinima,
    tarifaMaxima,
    categorias,
  ]);

  const obtenerTextoSinResultados = () => {
    if (cantidadFiltros > 1) {
      return 'No encontramos servicios que cumplan simultáneamente con los filtros seleccionados.';
    }

    if (zonaSeleccionada) {
      const nombreZona =
        zonaCoberturaService.obtenerNombreZona(
          zonaSeleccionada
        );

      return `No encontramos servicios disponibles con cobertura en ${nombreZona}.`;
    }

    if (diaSemana) {
      return `No encontramos servicios disponibles para ${obtenerNombreDia(
        diaSemana
      ).toLowerCase()}.`;
    }

    if (
      tarifaMinima !== null ||
      tarifaMaxima !== null
    ) {
      return 'No encontramos servicios dentro del rango de precio seleccionado.';
    }

    if (categoriaId !== null) {
      return 'No encontramos servicios disponibles en la categoría seleccionada.';
    }

    if (texto.trim()) {
      return 'No encontramos servicios relacionados con tu búsqueda.';
    }

    return 'No hay servicios disponibles en este momento.';
  };

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
            Explorar servicios
          </Text>

          <Text style={styles.subtitulo}>
            Encuentra el servicio que necesitas
          </Text>
        </View>

        <Pressable
          style={[
            styles.botonFiltroEncabezado,
            cantidadFiltros > 0 &&
              styles.botonFiltroEncabezadoActivo,
          ]}
          onPress={abrirFiltros}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={
              cantidadFiltros > 0
                ? '#FFFFFF'
                : '#101828'
            }
          />

          {cantidadFiltros > 0 ? (
            <View style={styles.contadorFiltros}>
              <Text
                style={styles.contadorFiltrosTexto}
              >
                {cantidadFiltros}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
          />
        }
      >
        <View style={styles.buscador}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#667085"
          />

          <TextInput
            style={styles.inputBusqueda}
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar servicios..."
            placeholderTextColor="#98A2B3"
            returnKeyType="search"
          />

          {texto ? (
            <Pressable
              onPress={() => setTexto('')}
            >
              <Ionicons
                name="close-circle"
                size={21}
                color="#98A2B3"
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtrosCabecera}>
          <View>
            <Text style={styles.filtrosTitulo}>
              Filtros
            </Text>

            <Text
              style={styles.filtrosDescripcion}
            >
              Combina categoría, lugar,
              disponibilidad y precio
            </Text>
          </View>

        
        </View>

        {filtrosActivos.length > 0 ? (
          <View style={styles.filtrosAplicados}>
            <View
              style={
                styles.filtrosAplicadosCabecera
              }
            >
              <Text
                style={
                  styles.filtrosAplicadosTitulo
                }
              >
                Filtros activos
              </Text>

              <Pressable
                onPress={limpiarFiltros}
              >
                <Text
                  style={styles.limpiarTexto}
                >
                  Limpiar filtros
                </Text>
              </Pressable>
            </View>

            <View style={styles.chipsActivos}>
              {filtrosActivos.map((filtro) => (
                <View
                  key={filtro.id}
                  style={styles.chipActivo}
                >
                  <Ionicons
                    name={filtro.icono}
                    size={15}
                    color="#0D9488"
                  />

                  <Text
                    style={styles.chipActivoTexto}
                    numberOfLines={1}
                  >
                    {filtro.texto}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.sinFiltros}
            onPress={abrirFiltros}
          >
            <View
              style={styles.sinFiltrosIcono}
            >
              <Ionicons
                name="options-outline"
                size={21}
                color="#2563EB"
              />
            </View>

            <View
              style={
                styles.sinFiltrosInformacion
              }
            >
              <Text
                style={styles.sinFiltrosTitulo}
              >
                Encuentra exactamente lo que buscas
              </Text>

              <Text
                style={styles.sinFiltrosTexto}
              >
                Puedes aplicar uno o varios filtros
                al mismo tiempo.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#98A2B3"
            />
          </Pressable>
        )}

        <View style={styles.resultadosCabecera}>
          <Text style={styles.resultadosTitulo}>
            Servicios disponibles
          </Text>

          {!cargando && !error ? (
            <Text
              style={styles.resultadosCantidad}
            >
              {servicios.length}
            </Text>
          ) : null}
        </View>

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" />

            <Text style={styles.cargandoTexto}>
              Buscando servicios...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.estadoContenedor}>
            <Ionicons
              name="alert-circle-outline"
              size={45}
              color="#B42318"
            />

            <Text style={styles.estadoTitulo}>
              No pudimos cargar los servicios
            </Text>

            <Text style={styles.estadoTexto}>
              {error}
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() =>
                cargarServicios()
              }
            >
              <Text
                style={
                  styles.botonReintentarTexto
                }
              >
                Intentar nuevamente
              </Text>
            </Pressable>
          </View>
        ) : servicios.length === 0 ? (
          <View style={styles.estadoContenedor}>
            <Ionicons
              name="search-outline"
              size={45}
              color="#98A2B3"
            />

            <Text style={styles.estadoTitulo}>
              No encontramos servicios
            </Text>

            <Text style={styles.estadoTexto}>
              {obtenerTextoSinResultados()}
            </Text>

            {hayFiltros ? (
              <Pressable
                style={styles.botonSecundario}
                onPress={limpiarTodo}
              >
                <Text
                  style={
                    styles.botonSecundarioTexto
                  }
                >
                  Limpiar filtros
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          servicios.map((servicio) => {
            const trabajador =
              obtenerTrabajador(servicio);

            const nombreTrabajador =
              trabajador?.usuario?.nombre ||
              'Profesional';

            const fotoTrabajador =
              trabajador?.perfil?.fotoUrl;

            return (
              <Pressable
                key={servicio.id}
                style={styles.tarjeta}
                onPress={() =>
                  navigation.navigate(
                    'DetalleServicio',
                    {
                      servicioId:
                        servicio.id,
                    }
                  )
                }
              >
                <View
                  style={styles.tarjetaSuperior}
                >
                  <View
                    style={styles.iconoServicio}
                  >
                    <Ionicons
                      name="construct-outline"
                      size={25}
                      color="#0D9488"
                    />
                  </View>

                  <View
                    style={
                      styles.tarjetaInformacion
                    }
                  >
                    <Text
                      style={
                        styles.servicioTitulo
                      }
                      numberOfLines={2}
                    >
                      {servicio.titulo}
                    </Text>

                    <View
                      style={
                        styles.categoriaFila
                      }
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color="#667085"
                      />

                      <Text
                        style={
                          styles.categoriaNombre
                        }
                      >
                        {obtenerNombreCategoria(
                          servicio.categoriaId
                        )}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#98A2B3"
                  />
                </View>

                <View
                  style={styles.trabajadorFila}
                >
                  {fotoTrabajador ? (
                    <Image
                      source={{
                        uri: fotoTrabajador,
                      }}
                      style={
                        styles.trabajadorFoto
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.trabajadorFotoVacia
                      }
                    >
                      <Ionicons
                        name="person"
                        size={17}
                        color="#2563EB"
                      />
                    </View>
                  )}

                  <View
                    style={
                      styles.trabajadorDatos
                    }
                  >
                    <Text
                      style={
                        styles.trabajadorEtiqueta
                      }
                    >
                      Ofrecido por
                    </Text>

                    <Text
                      style={
                        styles.trabajadorNombre
                      }
                      numberOfLines={1}
                    >
                      {nombreTrabajador}
                    </Text>
                  </View>

                  {trabajador?.perfil
                    ?.oficioPrincipal ? (
                    <Text
                      style={
                        styles.trabajadorOficio
                      }
                      numberOfLines={1}
                    >
                      {
                        trabajador.perfil
                          .oficioPrincipal
                      }
                    </Text>
                  ) : null}
                </View>

                <Text
                  style={
                    styles.servicioDescripcion
                  }
                  numberOfLines={3}
                >
                  {servicio.descripcion}
                </Text>

                <View
                  style={styles.tarjetaInferior}
                >
                  <View>
                    <Text
                      style={
                        styles.tarifaEtiqueta
                      }
                    >
                      Tarifa
                    </Text>

                    <Text style={styles.tarifa}>
                      {obtenerTarifa(
                        servicio
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.verDetalle}
                  >
                    <Text
                      style={
                        styles.verDetalleTexto
                      }
                    >
                      Ver detalle
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#2563EB"
                    />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalFiltrosVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={cerrarFiltros}
      >
        <View style={styles.modalFondo}>
          <Pressable
            style={styles.modalFondoCerrar}
            onPress={cerrarFiltros}
          />

          <SafeAreaView
            style={styles.modalContenedor}
          >
            <View
              style={styles.modalIndicador}
            />

            <View
              style={styles.modalEncabezado}
            >
              <View>
                <Text
                  style={styles.modalTitulo}
                >
                  Filtrar servicios
                </Text>

                <Text
                  style={
                    styles.modalSubtitulo
                  }
                >
                  Selecciona solo los filtros
                  que necesites
                </Text>
              </View>

              <Pressable
                style={styles.modalCerrar}
                onPress={cerrarFiltros}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#344054"
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={
                styles.modalContenido
              }
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={
                  styles.seccionFiltroCabecera
                }
              >
                <View
                  style={
                    styles.seccionFiltroIcono
                  }
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color="#2563EB"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.seccionFiltroTitulo
                    }
                  >
                    Categoría u oficio
                  </Text>

                  <Text
                    style={
                      styles.seccionFiltroDescripcion
                    }
                  >
                    Selecciona una categoría
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="always"
                contentContainerStyle={
                  styles.opcionesHorizontales
                }
              >
                <Pressable
                  style={[
                    styles.opcionFiltro,
                    categoriaTemporalId ===
                      null &&
                      styles.opcionFiltroSeleccionada,
                  ]}
                  onPress={() =>
                    setCategoriaTemporalId(
                      null
                    )
                  }
                >
                  <Text
                    style={[
                      styles.opcionFiltroTexto,
                      categoriaTemporalId ===
                        null &&
                        styles.opcionFiltroTextoSeleccionado,
                    ]}
                  >
                    Todas
                  </Text>
                </Pressable>

                {categorias.map(
                  (categoria) => {
                    const seleccionada =
                      Number(
                        categoriaTemporalId
                      ) ===
                      Number(
                        categoria.id
                      );

                    return (
                      <Pressable
                        key={categoria.id}
                        style={[
                          styles.opcionFiltro,
                          seleccionada &&
                            styles.opcionFiltroSeleccionada,
                        ]}
                        onPress={() =>
                          setCategoriaTemporalId(
                            Number(
                              categoria.id
                            )
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.opcionFiltroTexto,
                            seleccionada &&
                              styles.opcionFiltroTextoSeleccionado,
                          ]}
                        >
                          {categoria.nombre}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>

              <View
                style={styles.separador}
              />

              <View
                style={
                  styles.seccionFiltroCabecera
                }
              >
                <View
                  style={
                    styles.seccionFiltroIcono
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#2563EB"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.seccionFiltroTitulo
                    }
                  >
                    Lugar
                  </Text>

                  <Text
                    style={
                      styles.seccionFiltroDescripcion
                    }
                  >
                    Departamento, municipio o
                    localidad
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.campoFiltro,
                  zonaTemporalSeleccionada &&
                    styles.campoFiltroSeleccionado,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={
                    zonaTemporalSeleccionada
                      ? '#0D9488'
                      : '#667085'
                  }
                />

                <TextInput
                  style={styles.campoFiltroInput}
                  value={textoZonaTemporal}
                  onChangeText={
                    cambiarTextoZonaTemporal
                  }
                  placeholder="Ej. Santa Ana, Sonsonate..."
                  placeholderTextColor="#98A2B3"
                  returnKeyType="search"
                />

                {buscandoZonas ? (
                  <ActivityIndicator
                    size="small"
                  />
                ) : textoZonaTemporal ? (
                  <Pressable
                    onPress={
                      limpiarZonaTemporal
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={21}
                      color="#98A2B3"
                    />
                  </Pressable>
                ) : null}
              </View>

              {zonaTemporalSeleccionada ? (
                <View
                  style={
                    styles.ubicacionElegida
                  }
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color="#0D9488"
                  />

                  <Text
                    style={
                      styles.ubicacionElegidaTexto
                    }
                  >
                    {zonaCoberturaService.obtenerNombreZona(
                      zonaTemporalSeleccionada
                    )}
                  </Text>
                </View>
              ) : null}

              {!zonaTemporalSeleccionada &&
              textoZonaTemporal.trim()
                .length >= 2 &&
              !buscandoZonas &&
              sugerenciasZona.length ===
                0 ? (
                <View
                  style={
                    styles.sinUbicaciones
                  }
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#98A2B3"
                  />

                  <Text
                    style={
                      styles.sinUbicacionesTexto
                    }
                  >
                    No encontramos ubicaciones
                    con ese nombre.
                  </Text>
                </View>
              ) : null}

              {!zonaTemporalSeleccionada &&
              sugerenciasZona.length >
                0 ? (
                <View
                  style={
                    styles.sugerencias
                  }
                >
                  <Text
                    style={
                      styles.sugerenciasTitulo
                    }
                  >
                    Ubicaciones encontradas
                  </Text>

                  {sugerenciasZona.map(
                    (zona, index) => {
                      const esUltima =
                        index ===
                        sugerenciasZona.length -
                          1;

                      return (
                        <Pressable
                          key={zona.id}
                          style={[
                            styles.sugerencia,
                            esUltima &&
                              styles.sugerenciaUltima,
                          ]}
                          onPress={() =>
                            seleccionarZonaTemporal(
                              zona
                            )
                          }
                        >
                          <View
                            style={
                              styles.sugerenciaIcono
                            }
                          >
                            <Ionicons
                              name="location-outline"
                              size={18}
                              color="#2563EB"
                            />
                          </View>

                          <View
                            style={
                              styles.sugerenciaInformacion
                            }
                          >
                            <Text
                              style={
                                styles.sugerenciaPrincipal
                              }
                            >
                              {zona.localidad ||
                                zona.municipio}
                            </Text>

                            <Text
                              style={
                                styles.sugerenciaSecundaria
                              }
                            >
                              {[
                                zona.localidad
                                  ? zona.municipio
                                  : null,
                                zona.departamento,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </Text>
                          </View>

                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#98A2B3"
                          />
                        </Pressable>
                      );
                    }
                  )}
                </View>
              ) : null}

              <View
                style={styles.separador}
              />

              <View
                style={
                  styles.seccionFiltroCabecera
                }
              >
                <View
                  style={
                    styles.seccionFiltroIcono
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#2563EB"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.seccionFiltroTitulo
                    }
                  >
                    Disponibilidad
                  </Text>

                  <Text
                    style={
                      styles.seccionFiltroDescripcion
                    }
                  >
                    Selecciona el día que
                    necesitas el servicio
                  </Text>
                </View>
              </View>

              <View style={styles.dias}>
                {DIAS_SEMANA.map(
                  (dia) => {
                    const seleccionado =
                      diaTemporal ===
                      dia.valor;

                    return (
                      <Pressable
                        key={dia.valor}
                        style={[
                          styles.dia,
                          seleccionado &&
                            styles.diaSeleccionado,
                        ]}
                        onPress={() =>
                          setDiaTemporal(
                            seleccionado
                              ? null
                              : dia.valor
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.diaTexto,
                            seleccionado &&
                              styles.diaTextoSeleccionado,
                          ]}
                        >
                          {dia.etiqueta}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              <View
                style={styles.separador}
              />

              <View
                style={
                  styles.seccionFiltroCabecera
                }
              >
                <View
                  style={
                    styles.seccionFiltroIcono
                  }
                >
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color="#2563EB"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.seccionFiltroTitulo
                    }
                  >
                    Precio
                  </Text>

                  <Text
                    style={
                      styles.seccionFiltroDescripcion
                    }
                  >
                    Define un rango de tarifa
                  </Text>
                </View>
              </View>

              <View style={styles.preciosFila}>
                <View
                  style={
                    styles.precioContenedor
                  }
                >
                  <Text
                    style={
                      styles.precioEtiqueta
                    }
                  >
                    Mínimo
                  </Text>

                  <View
                    style={styles.campoPrecio}
                  >
                    <Text
                      style={
                        styles.simboloPrecio
                      }
                    >
                      $
                    </Text>

                    <TextInput
                      style={
                        styles.inputPrecio
                      }
                      value={
                        tarifaMinimaTemporal
                      }
                      onChangeText={(valor) => {
                        setTarifaMinimaTemporal(
                          valor.replace(
                            /[^0-9.,]/g,
                            ''
                          )
                        );
                        setErrorFiltros('');
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#98A2B3"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View
                  style={styles.precioSeparador}
                >
                  <Text
                    style={
                      styles.precioSeparadorTexto
                    }
                  >
                    —
                  </Text>
                </View>

                <View
                  style={
                    styles.precioContenedor
                  }
                >
                  <Text
                    style={
                      styles.precioEtiqueta
                    }
                  >
                    Máximo
                  </Text>

                  <View
                    style={styles.campoPrecio}
                  >
                    <Text
                      style={
                        styles.simboloPrecio
                      }
                    >
                      $
                    </Text>

                    <TextInput
                      style={
                        styles.inputPrecio
                      }
                      value={
                        tarifaMaximaTemporal
                      }
                      onChangeText={(valor) => {
                        setTarifaMaximaTemporal(
                          valor.replace(
                            /[^0-9.,]/g,
                            ''
                          )
                        );
                        setErrorFiltros('');
                      }}
                      placeholder="100.00"
                      placeholderTextColor="#98A2B3"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              {errorFiltros ? (
                <View
                  style={
                    styles.errorFiltros
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#B42318"
                  />

                  <Text
                    style={
                      styles.errorFiltrosTexto
                    }
                  >
                    {errorFiltros}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalAcciones}>
              <Pressable
                style={
                  styles.botonLimpiarModal
                }
                onPress={
                  limpiarFiltrosTemporales
                }
              >
                <Text
                  style={
                    styles.botonLimpiarModalTexto
                  }
                >
                  Limpiar filtros
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.botonAplicarModal
                }
                onPress={aplicarFiltros}
              >
                <Ionicons
                  name="checkmark"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.botonAplicarModalTexto
                  }
                >
                  Aplicar filtros
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
    paddingHorizontal: 8,
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
  botonFiltroEncabezado: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  botonFiltroEncabezadoActivo: {
    backgroundColor: '#2563EB',
  },
  contadorFiltros: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#0D9488',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorFiltrosTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
  },
  buscador: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBusqueda: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 15,
    color: '#101828',
  },
  filtrosCabecera: {
    marginTop: 21,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filtrosTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  filtrosDescripcion: {
    marginTop: 3,
    maxWidth: 220,
    fontSize: 12,
    lineHeight: 17,
    color: '#667085',
  },
  botonAbrirFiltros: {
    minHeight: 39,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botonAbrirFiltrosTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  filtrosAplicados: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
  },
  filtrosAplicadosCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filtrosAplicadosTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  limpiarTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  chipsActivos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chipActivo: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipActivoTexto: {
    maxWidth: 230,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  sinFiltros: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sinFiltrosIcono: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinFiltrosInformacion: {
    flex: 1,
    marginHorizontal: 11,
  },
  sinFiltrosTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  sinFiltrosTexto: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#667085',
  },
  resultadosCabecera: {
    marginTop: 25,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultadosTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  resultadosCantidad: {
    minWidth: 29,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#475467',
  },
  cargando: {
    paddingVertical: 65,
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: 13,
    fontSize: 14,
    color: '#667085',
  },
  estadoContenedor: {
    paddingHorizontal: 22,
    paddingVertical: 55,
    alignItems: 'center',
  },
  estadoTitulo: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  estadoTexto: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 19,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#2563EB',
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  botonSecundario: {
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
  },
  botonSecundarioTexto: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  tarjeta: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    backgroundColor: '#FFFFFF',
  },
  tarjetaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoServicio: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaInformacion: {
    flex: 1,
    marginHorizontal: 12,
  },
  servicioTitulo: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: '#101828',
  },
  categoriaFila: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoriaNombre: {
    flex: 1,
    fontSize: 12,
    color: '#667085',
  },
  trabajadorFila: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  trabajadorFoto: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F4F7',
  },
  trabajadorFotoVacia: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trabajadorDatos: {
    flex: 1,
    marginLeft: 10,
  },
  trabajadorEtiqueta: {
    fontSize: 10,
    color: '#98A2B3',
  },
  trabajadorNombre: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  trabajadorOficio: {
    maxWidth: 120,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 10,
    fontWeight: '600',
    color: '#667085',
  },
  servicioDescripcion: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 20,
    color: '#475467',
  },
  tarjetaInferior: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tarifaEtiqueta: {
    fontSize: 10,
    color: '#98A2B3',
  },
  tarifa: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '800',
    color: '#0D9488',
  },
  verDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verDetalleTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalFondo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
  },
  modalFondoCerrar: {
    flex: 1,
  },
  modalContenedor: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  modalIndicador: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    marginTop: 9,
    borderRadius: 3,
    backgroundColor: '#D0D5DD',
  },
  modalEncabezado: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitulo: {
    fontSize: 19,
    fontWeight: '800',
    color: '#101828',
  },
  modalSubtitulo: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  modalCerrar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalContenido: {
    padding: 18,
    paddingBottom: 35,
  },
  seccionFiltroCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  seccionFiltroIcono: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seccionFiltroTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101828',
  },
  seccionFiltroDescripcion: {
    marginTop: 2,
    fontSize: 11,
    color: '#667085',
  },
  opcionesHorizontales: {
    gap: 8,
    paddingRight: 15,
  },
  opcionFiltro: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
  },
  opcionFiltroSeleccionada: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  opcionFiltroTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  opcionFiltroTextoSeleccionado: {
    color: '#0F766E',
    fontWeight: '700',
  },
  separador: {
    height: 1,
    marginVertical: 22,
    backgroundColor: '#EAECF0',
  },
  campoFiltro: {
    minHeight: 50,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  campoFiltroSeleccionado: {
    borderColor: '#5EEAD4',
    backgroundColor: '#F0FDFA',
  },
  campoFiltroInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#101828',
  },
  ubicacionElegida: {
    marginTop: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ubicacionElegidaTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  sinUbicaciones: {
    marginTop: 9,
    padding: 11,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sinUbicacionesTexto: {
    flex: 1,
    fontSize: 12,
    color: '#667085',
  },
  sugerencias: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sugerenciasTitulo: {
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 7,
    fontSize: 11,
    fontWeight: '700',
    color: '#667085',
  },
  sugerencia: {
    minHeight: 57,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sugerenciaUltima: {
    borderBottomWidth: 0,
  },
  sugerenciaIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sugerenciaInformacion: {
    flex: 1,
    marginHorizontal: 10,
  },
  sugerenciaPrincipal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  sugerenciaSecundaria: {
    marginTop: 2,
    fontSize: 11,
    color: '#667085',
  },
  dias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dia: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
  },
  diaSeleccionado: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  diaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  diaTextoSeleccionado: {
    fontWeight: '700',
    color: '#0F766E',
  },
  preciosFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  precioContenedor: {
    flex: 1,
  },
  precioEtiqueta: {
    marginBottom: 7,
    fontSize: 11,
    fontWeight: '600',
    color: '#475467',
  },
  campoPrecio: {
    height: 50,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  simboloPrecio: {
    fontSize: 15,
    fontWeight: '700',
    color: '#667085',
  },
  inputPrecio: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: '#101828',
  },
  precioSeparador: {
    width: 28,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  precioSeparadorTexto: {
    fontSize: 17,
    color: '#98A2B3',
  },
  errorFiltros: {
    marginTop: 14,
    padding: 11,
    borderRadius: 10,
    backgroundColor: '#FEF3F2',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  errorFiltrosTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#B42318',
  },
  modalAcciones: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 10,
  },
  botonLimpiarModal: {
    flex: 1,
    minHeight: 49,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonLimpiarModalTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  botonAplicarModal: {
    flex: 1.35,
    minHeight: 49,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  botonAplicarModalTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});