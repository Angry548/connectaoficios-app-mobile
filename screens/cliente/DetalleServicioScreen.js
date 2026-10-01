import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { servicioService } from '../../services/servicioService';
import { disponibilidadService } from '../../services/disponibilidadService';
import { zonaCoberturaService } from '../../services/zonaCoberturaService';
import { userService } from '../../services/userService';
import { reputacionService } from '../../services/reputacionService';

const NOMBRES_DIAS = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export default function DetalleServicioScreen({
  route,
  navigation,
}) {
  const servicioId = route?.params?.servicioId;

  const [servicio, setServicio] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [disponibilidades, setDisponibilidades] =
    useState([]);
  const [zonas, setZonas] = useState([]);
  const [perfilTrabajador, setPerfilTrabajador] =
    useState(null);
  const [usuarioTrabajador, setUsuarioTrabajador] =
    useState(null);
  const [reputacion, setReputacion] =
    useState(null);
  const [
    totalServiciosTrabajador,
    setTotalServiciosTrabajador,
  ] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDetalle = useCallback(async () => {
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
        await servicioService.obtenerPorId(
          servicioId
        );

      setServicio(servicioActual);

      const [
        categoriasDisponibles,
        horariosDisponibles,
      ] = await Promise.all([
        servicioService
          .listarCategorias()
          .catch(() => []),
        disponibilidadService
          .listarActivasPorServicio(servicioId)
          .catch(() => []),
      ]);

      const categoriaActual =
        categoriasDisponibles.find(
          (item) =>
            Number(item.id) ===
            Number(servicioActual.categoriaId)
        ) ?? null;

      setCategoria(categoriaActual);
      setDisponibilidades(
        horariosDisponibles
      );

      const idsZonas = Array.isArray(
        servicioActual.zonasCoberturaIds
      )
        ? servicioActual.zonasCoberturaIds
        : [];

      if (idsZonas.length > 0) {
        const zonasObtenidas =
          await Promise.all(
            idsZonas.map((id) =>
              zonaCoberturaService
                .obtenerPorId(id)
                .catch(() => null)
            )
          );

        setZonas(
          zonasObtenidas.filter(Boolean)
        );
      } else {
        setZonas([]);
      }

      const perfilId = Number(
        servicioActual.perfilTrabajadorId
      );

      if (
        Number.isInteger(perfilId) &&
        perfilId > 0
      ) {
        try {
          const perfil =
            await servicioService.obtenerPerfilTrabajadorPorId(
              perfilId
            );

          setPerfilTrabajador(perfil);

          const trabajadorId = Number(
            perfil?.trabajadorId
          );

          if (
            Number.isInteger(trabajadorId) &&
            trabajadorId > 0
          ) {
            try {
              const usuario =
                await userService.obtenerUsuarioPorId(
                  trabajadorId
                );

              setUsuarioTrabajador(usuario);
            } catch {
              setUsuarioTrabajador(null);
            }
          } else {
            setUsuarioTrabajador(null);
          }
        } catch {
          setPerfilTrabajador(null);
          setUsuarioTrabajador(null);
        }

        try {
          const reputacionObtenida =
            await reputacionService.obtenerPorPerfilTrabajador(
              perfilId
            );

          setReputacion(
            reputacionObtenida
          );
        } catch {
          setReputacion(null);
        }

        try {
          const paginaServicios =
            await servicioService.listarPorTrabajador(
              perfilId,
              0,
              1
            );

          setTotalServiciosTrabajador(
            Number(
              paginaServicios?.totalElementos ??
                0
            )
          );
        } catch {
          setTotalServiciosTrabajador(0);
        }
      } else {
        setPerfilTrabajador(null);
        setUsuarioTrabajador(null);
        setReputacion(null);
        setTotalServiciosTrabajador(0);
      }
    } catch (err) {
      const data = err?.response?.data;

      setError(
        data?.message ||
          data?.mensaje ||
          err?.message ||
          'No se pudo cargar el detalle del servicio.'
      );
    } finally {
      setCargando(false);
    }
  }, [servicioId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const obtenerTarifa = () => {
    if (!servicio) {
      return '';
    }

    const minima = Number(
      servicio.tarifaMinima
    );

    const maxima =
      servicio.tarifaMaxima !== null &&
      servicio.tarifaMaxima !== undefined
        ? Number(servicio.tarifaMaxima)
        : null;

    if (
      maxima !== null &&
      Number.isFinite(maxima)
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

  const obtenerHora = (hora) => {
    if (!hora) {
      return '';
    }

    return hora.substring(0, 5);
  };

  const obtenerCalificacion = () => {
    if (
      !reputacion ||
      Number(reputacion.totalResenas) <= 0
    ) {
      return 'Nuevo';
    }

    return Number(
      reputacion.promedioCalificacion ?? 0
    ).toFixed(1);
  };

  const obtenerTextoResenas = () => {
    const total = Number(
      reputacion?.totalResenas ?? 0
    );

    if (total <= 0) {
      return 'Sin reseñas todavía';
    }

    return total === 1
      ? '1 reseña'
      : `${total} reseñas`;
  };

  const irPerfilTrabajador = () => {
    const trabajadorId = Number(
      perfilTrabajador?.trabajadorId
    );

    if (
      !Number.isInteger(trabajadorId) ||
      trabajadorId <= 0
    ) {
      return;
    }

    navigation.navigate(
      'PerfilPublicoTrabajador',
      {
        trabajadorId,
      }
    );
  };

  const solicitarServicio = () => {
    const trabajadorId = Number(
      perfilTrabajador?.trabajadorId
    );

    if (
      !Number.isInteger(trabajadorId) ||
      trabajadorId <= 0
    ) {
      return;
    }

    navigation.navigate(
      'CrearSolicitud',
      {
        servicioId: servicio.id,
        trabajadorId,
        perfilTrabajadorId:
          servicio.perfilTrabajadorId,
        servicioTitulo: servicio.titulo,
        trabajadorNombre:
          usuarioTrabajador?.nombre ||
          'Trabajador',
      }
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

  if (error || !servicio) {
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
            Detalle del servicio
          </Text>

          <View style={styles.espacio} />
        </View>

        <View style={styles.errorContenedor}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#B42318"
          />

          <Text style={styles.errorTitulo}>
            No pudimos cargar el servicio
          </Text>

          <Text style={styles.errorTexto}>
            {error}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={cargarDetalle}
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
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#101828"
          />
        </Pressable>

        <Text style={styles.tituloEncabezado}>
          Detalle del servicio
        </Text>

        <View style={styles.espacio} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.principal}>
          <View style={styles.iconoPrincipal}>
            <Ionicons
              name="construct-outline"
              size={32}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.tituloServicio}>
            {servicio.titulo}
          </Text>

          <View style={styles.estado}>
            <View style={styles.estadoPunto} />

            <Text style={styles.estadoTexto}>
              {servicio.estado ?? 'ACTIVO'}
            </Text>
          </View>

          <Text style={styles.categoria}>
            {categoria?.nombre ??
              `Categoría ${servicio.categoriaId}`}
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.seccionTituloFila}>
            <Ionicons
              name="document-text-outline"
              size={21}
              color="#0D9488"
            />

            <Text style={styles.seccionTitulo}>
              Descripción
            </Text>
          </View>

          <Text style={styles.descripcion}>
            {servicio.descripcion}
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.seccionTituloFila}>
            <Ionicons
              name="cash-outline"
              size={21}
              color="#0D9488"
            />

            <Text style={styles.seccionTitulo}>
              Tarifa
            </Text>
          </View>

          <Text style={styles.tarifa}>
            {obtenerTarifa()}
          </Text>

          <Text style={styles.textoAuxiliar}>
            El precio final puede variar según las características del trabajo.
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.seccionTituloFila}>
            <Ionicons
              name="time-outline"
              size={21}
              color="#0D9488"
            />

            <Text style={styles.seccionTitulo}>
              Disponibilidad
            </Text>
          </View>

          {disponibilidades.length === 0 ? (
            <Text style={styles.sinInformacion}>
              El trabajador todavía no ha publicado horarios para este servicio.
            </Text>
          ) : (
            disponibilidades.map((item) => (
              <View
                key={item.id}
                style={styles.filaInformacion}
              >
                <Text style={styles.filaPrincipal}>
                  {NOMBRES_DIAS[
                    item.diaSemana
                  ] ?? item.diaSemana}
                </Text>

                <Text style={styles.filaSecundaria}>
                  {obtenerHora(
                    item.horaInicio
                  )}{' '}
                  -{' '}
                  {obtenerHora(
                    item.horaFin
                  )}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.seccionTituloFila}>
            <Ionicons
              name="location-outline"
              size={21}
              color="#0D9488"
            />

            <Text style={styles.seccionTitulo}>
              Zonas de cobertura
            </Text>
          </View>

          {zonas.length === 0 ? (
            <Text style={styles.sinInformacion}>
              El trabajador todavía no ha definido zonas de cobertura.
            </Text>
          ) : (
            zonas.map((zona) => (
              <View
                key={zona.id}
                style={styles.zona}
              >
                <View style={styles.iconoZona}>
                  <Ionicons
                    name="location"
                    size={18}
                    color="#0D9488"
                  />
                </View>

                <View style={styles.zonaTexto}>
                  <Text style={styles.zonaPrincipal}>
                    {zona.localidad ||
                      zona.municipio}
                  </Text>

                  <Text style={styles.zonaSecundaria}>
                    {zona.localidad
                      ? `${zona.municipio}, ${zona.departamento}`
                      : zona.departamento}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {perfilTrabajador ? (
          <View style={styles.tarjetaProfesional}>
            <View style={styles.profesionalEncabezado}>
              <Text style={styles.profesionalTitulo}>
                Profesional
              </Text>

              <Text style={styles.profesionalSubtitulo}>
                Conoce quién ofrece este servicio
              </Text>
            </View>

            <View style={styles.profesionalContenido}>
              {perfilTrabajador.fotoUrl ? (
                <Image
                  source={{
                    uri: perfilTrabajador.fotoUrl,
                  }}
                  style={styles.profesionalFoto}
                />
              ) : (
                <View
                  style={styles.profesionalFotoVacia}
                >
                  <Ionicons
                    name="person"
                    size={30}
                    color="#2563EB"
                  />
                </View>
              )}

              <View
                style={styles.profesionalInformacion}
              >
                <Text style={styles.profesionalNombre}>
                  {usuarioTrabajador?.nombre ||
                    'Trabajador'}
                </Text>

                <Text style={styles.profesionalOficio}>
                  {perfilTrabajador.oficioPrincipal ||
                    'Profesional'}
                </Text>

                <View style={styles.reputacionFila}>
                  <Ionicons
                    name="star"
                    size={17}
                    color="#F59E0B"
                  />

                  <Text style={styles.reputacionValor}>
                    {obtenerCalificacion()}
                  </Text>

                  <Text style={styles.reputacionResenas}>
                    {obtenerTextoResenas()}
                  </Text>
                </View>
              </View>
            </View>

            {perfilTrabajador.descripcionProfesional ? (
              <Text
                style={styles.profesionalDescripcion}
                numberOfLines={4}
              >
                {
                  perfilTrabajador.descripcionProfesional
                }
              </Text>
            ) : null}

            <View style={styles.datosConfianza}>
              <View style={styles.datoConfianza}>
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color="#0D9488"
                />

                <Text
                  style={styles.datoConfianzaNumero}
                >
                  {totalServiciosTrabajador}
                </Text>

                <Text
                  style={styles.datoConfianzaTexto}
                >
                  Servicios
                </Text>
              </View>

              <View style={styles.separadorConfianza} />

              <View style={styles.datoConfianza}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#0D9488"
                />

                <Text
                  style={styles.datoConfianzaNumero}
                >
                  {reputacion?.totalResenas ?? 0}
                </Text>

                <Text
                  style={styles.datoConfianzaTexto}
                >
                  Reseñas
                </Text>
              </View>

              <View style={styles.separadorConfianza} />

              <View style={styles.datoConfianza}>
                <Ionicons
                  name="ribbon-outline"
                  size={20}
                  color="#0D9488"
                />

                <Text
                  style={styles.datoConfianzaInsignia}
                  numberOfLines={2}
                >
                  {(
                    reputacion?.insignia ||
                    'NUEVO_TRABAJADOR'
                  ).replaceAll('_', ' ')}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.botonVerPerfil}
              onPress={irPerfilTrabajador}
            >
              <View style={styles.botonVerPerfilIzquierda}>
                <Ionicons
                  name="person-circle-outline"
                  size={21}
                  color="#2563EB"
                />

                <Text
                  style={styles.botonVerPerfilTexto}
                >
                  Ver perfil del trabajador
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#2563EB"
              />
            </Pressable>
          </View>
        ) : (
          <View style={styles.tarjetaProfesional}>
            <Text style={styles.profesionalTitulo}>
              Profesional
            </Text>

            <Text style={styles.sinInformacionProfesional}>
              No se pudo cargar la información pública del trabajador.
            </Text>
          </View>
        )}

        <View style={styles.informacionFinal}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#2563EB"
          />

          <Text style={styles.informacionFinalTexto}>
            Revisa el perfil, experiencia y reseñas del profesional antes de realizar tu solicitud.
          </Text>
        </View>

        <Pressable
          style={[
            styles.botonSolicitar,
            !perfilTrabajador?.trabajadorId &&
              styles.botonSolicitarDeshabilitado,
          ]}
          disabled={
            !perfilTrabajador?.trabajadorId
          }
          onPress={solicitarServicio}
        >
          <Ionicons
            name="paper-plane-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.botonSolicitarTexto}>
            Solicitar servicio
          </Text>
        </Pressable>
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
  tituloEncabezado: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '700',
    color: '#101828',
  },
  espacio: {
    width: 44,
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
    color: '#667085',
  },
  principal: {
    alignItems: 'center',
    backgroundColor: '#12344D',
    borderRadius: 22,
    padding: 25,
    marginBottom: 16,
  },
  iconoPrincipal: {
    width: 62,
    height: 62,
    borderRadius: 19,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloServicio: {
    marginTop: 16,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  estado: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  estadoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5EEAD4',
    marginRight: 6,
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoria: {
    marginTop: 10,
    fontSize: 13,
    color: '#D6E4EC',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 17,
    padding: 18,
    marginBottom: 14,
  },
  seccionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  seccionTitulo: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475467',
  },
  tarifa: {
    fontSize: 21,
    fontWeight: '800',
    color: '#101828',
  },
  textoAuxiliar: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: '#667085',
  },
  sinInformacion: {
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },
  filaInformacion: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaPrincipal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },
  filaSecundaria: {
    fontSize: 13,
    color: '#667085',
  },
  zona: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  iconoZona: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  zonaTexto: {
    flex: 1,
  },
  zonaPrincipal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344054',
  },
  zonaSecundaria: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  tarjetaProfesional: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  profesionalEncabezado: {
    marginBottom: 16,
  },
  profesionalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  profesionalSubtitulo: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  profesionalContenido: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profesionalFoto: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
  },
  profesionalFotoVacia: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profesionalInformacion: {
    flex: 1,
    marginLeft: 14,
  },
  profesionalNombre: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  profesionalOficio: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  reputacionFila: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reputacionValor: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  reputacionResenas: {
    marginLeft: 6,
    fontSize: 12,
    color: '#667085',
  },
  profesionalDescripcion: {
    marginTop: 15,
    fontSize: 13,
    lineHeight: 20,
    color: '#475467',
  },
  datosConfianza: {
    marginTop: 17,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  datoConfianza: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separadorConfianza: {
    width: 1,
    backgroundColor: '#EAECF0',
  },
  datoConfianzaNumero: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  datoConfianzaTexto: {
    marginTop: 2,
    fontSize: 10,
    color: '#667085',
  },
  datoConfianzaInsignia: {
    marginTop: 5,
    paddingHorizontal: 4,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0D9488',
  },
  botonVerPerfil: {
    minHeight: 49,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botonVerPerfilIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVerPerfilTexto: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  sinInformacionProfesional: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },
  informacionFinal: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  informacionFinalTexto: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: '#1D4ED8',
  },
  botonSolicitar: {
    minHeight: 56,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSolicitarDeshabilitado: {
    opacity: 0.5,
  },
  botonSolicitarTexto: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitulo: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },
  errorTexto: {
    marginTop: 7,
    fontSize: 13,
    color: '#667085',
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});