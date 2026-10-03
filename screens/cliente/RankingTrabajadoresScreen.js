import React, {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import reputacionService from '../../services/reputacionService';
import perfilTrabajadorService from '../../services/perfilTrabajadorService';
import userService from '../../services/userService';

const obtenerNombreInsignia = (insignia) => {
  switch (insignia) {
    case 'TOP_PLATAFORMA':
      return 'Top de la plataforma';

    case 'MEJOR_VALORADO':
      return 'Mejor valorado';

    case 'TRABAJADOR_CONFIABLE':
      return 'Trabajador confiable';

    case 'NUEVO_TRABAJADOR':
    default:
      return 'Nuevo trabajador';
  }
};

const obtenerIconoInsignia = (insignia) => {
  switch (insignia) {
    case 'TOP_PLATAFORMA':
      return 'trophy';

    case 'MEJOR_VALORADO':
      return 'star';

    case 'TRABAJADOR_CONFIABLE':
      return 'shield-checkmark';

    case 'NUEVO_TRABAJADOR':
    default:
      return 'sparkles';
  }
};

const obtenerEstiloInsignia = (insignia) => {
  switch (insignia) {
    case 'TOP_PLATAFORMA':
      return {
        fondo: '#FFF7E0',
        borde: '#F5D98B',
        texto: '#A16207',
        icono: '#D97706',
      };

    case 'MEJOR_VALORADO':
      return {
        fondo: '#FFF8E8',
        borde: '#F5D98B',
        texto: '#B45309',
        icono: '#F59E0B',
      };

    case 'TRABAJADOR_CONFIABLE':
      return {
        fondo: '#E8F7F4',
        borde: '#B7E4DC',
        texto: '#0F766E',
        icono: '#0D9488',
      };

    case 'NUEVO_TRABAJADOR':
    default:
      return {
        fondo: '#EFF6FF',
        borde: '#BFDBFE',
        texto: '#1D4ED8',
        icono: '#2563EB',
      };
  }
};

const obtenerEstiloPosicion = (posicion) => {
  if (posicion === 1) {
    return {
      fondo: '#FFF7E0',
      borde: '#F5D98B',
      texto: '#A16207',
    };
  }

  if (posicion === 2) {
    return {
      fondo: '#F1F5F9',
      borde: '#CBD5E1',
      texto: '#475569',
    };
  }

  if (posicion === 3) {
    return {
      fondo: '#FFF1E8',
      borde: '#FED7AA',
      texto: '#C2410C',
    };
  }

  return {
    fondo: '#F8FAFC',
    borde: '#E2E8F0',
    texto: '#64748B',
  };
};

const obtenerTextoPosicion = (posicion) => {
  if (posicion === 1) {
    return '1';
  }

  if (posicion === 2) {
    return '2';
  }

  if (posicion === 3) {
    return '3';
  }

  return String(posicion ?? '-');
};

export default function RankingTrabajadoresScreen({
  navigation,
}) {
  const [trabajadores, setTrabajadores] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState('');

  const cargarRanking = useCallback(
    async (esActualizacion = false) => {
      if (esActualizacion) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError('');

      try {
        const ranking =
          await reputacionService.obtenerRanking();

        const perfilesResultados =
          await Promise.allSettled(
            ranking.map((reputacion) =>
              perfilTrabajadorService.obtenerPerfilPorId(
                reputacion.perfilTrabajadorId
              )
            )
          );

        const perfiles = perfilesResultados.map(
          (resultado) =>
            resultado.status === 'fulfilled'
              ? resultado.value
              : null
        );

        const trabajadorIds = perfiles
          .map((perfil) =>
            Number(perfil?.trabajadorId)
          )
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          );

        const usuarios =
          await userService.obtenerUsuariosPorIds(
            trabajadorIds
          );

        const resultado = ranking.map(
          (reputacion, indice) => {
            const perfil = perfiles[indice];

            const trabajadorId = Number(
              perfil?.trabajadorId
            );

            const usuario =
              Number.isInteger(trabajadorId)
                ? usuarios[trabajadorId]
                : null;

            return {
              ...reputacion,
              perfil,
              usuario,
              nombre:
                usuario?.nombre ||
                'Trabajador',
              oficio:
                perfil?.oficioPrincipal ||
                'Trabajador de ConnectaOficios',
              fotoUrl:
                perfil?.fotoUrl ||
                '',
            };
          }
        );

        setTrabajadores(resultado);
      } catch (errorCarga) {
        setTrabajadores([]);

        setError(
          errorCarga?.response?.data?.message ||
            errorCarga?.response?.data?.mensaje ||
            errorCarga?.message ||
            'No se pudo cargar el ranking de trabajadores.'
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargarRanking();
    }, [cargarRanking])
  );

  const abrirPerfil = (trabajador) => {
    if (!trabajador?.perfilTrabajadorId) {
      return;
    }

    navigation.navigate(
      'PerfilPublicoTrabajador',
      {
        perfilTrabajadorId:
          trabajador.perfilTrabajadorId,
        trabajadorId:
          trabajador.perfil?.trabajadorId,
      }
    );
  };

  const renderTrabajador = (
    trabajador,
    indice
  ) => {
    const posicion =
      trabajador.posicionRanking ??
      indice + 1;

    const estiloPosicion =
      obtenerEstiloPosicion(posicion);

    const estiloInsignia =
      obtenerEstiloInsignia(
        trabajador.insignia
      );

    const promedio = Number(
      trabajador.promedioCalificacion ?? 0
    );

    return (
      <TouchableOpacity
        key={
          trabajador.id ??
          trabajador.perfilTrabajadorId
        }
        style={styles.tarjeta}
        activeOpacity={0.82}
        onPress={() =>
          abrirPerfil(trabajador)
        }
      >
        <View style={styles.filaSuperior}>
          <View
            style={[
              styles.posicion,
              {
                backgroundColor:
                  estiloPosicion.fondo,
                borderColor:
                  estiloPosicion.borde,
              },
            ]}
          >
            <Text
              style={[
                styles.numeroPosicion,
                {
                  color:
                    estiloPosicion.texto,
                },
              ]}
            >
              {obtenerTextoPosicion(
                posicion
              )}
            </Text>
          </View>

          <View style={styles.contenedorFoto}>
            {trabajador.fotoUrl ? (
              <Image
                source={{
                  uri: trabajador.fotoUrl,
                }}
                style={styles.foto}
              />
            ) : (
              <View
                style={styles.fotoVacia}
              >
                <Ionicons
                  name="person-outline"
                  size={29}
                  color="#64748B"
                />
              </View>
            )}
          </View>

          <View style={styles.datos}>
            <Text
              style={styles.nombre}
              numberOfLines={1}
            >
              {trabajador.nombre}
            </Text>

            <Text
              style={styles.oficio}
              numberOfLines={1}
            >
              {trabajador.oficio}
            </Text>

            <View
              style={[
                styles.insignia,
                {
                  backgroundColor:
                    estiloInsignia.fondo,
                  borderColor:
                    estiloInsignia.borde,
                },
              ]}
            >
              <Ionicons
                name={obtenerIconoInsignia(
                  trabajador.insignia
                )}
                size={13}
                color={
                  estiloInsignia.icono
                }
              />

              <Text
                style={[
                  styles.textoInsignia,
                  {
                    color:
                      estiloInsignia.texto,
                  },
                ]}
              >
                {obtenerNombreInsignia(
                  trabajador.insignia
                )}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94A3B8"
          />
        </View>

        <View style={styles.separador} />

        <View style={styles.estadisticas}>
          <View
            style={styles.estadistica}
          >
            <View
              style={styles.filaEstadistica}
            >
              <Ionicons
                name="star"
                size={16}
                color="#F59E0B"
              />

              <Text
                style={
                  styles.valorEstadistica
                }
              >
                {promedio.toFixed(1)}
              </Text>
            </View>

            <Text
              style={
                styles.etiquetaEstadistica
              }
            >
              Calificación
            </Text>
          </View>

          <View
            style={styles.divisorVertical}
          />

          <View
            style={styles.estadistica}
          >
            <Text
              style={
                styles.valorEstadistica
              }
            >
              {trabajador.totalResenas ?? 0}
            </Text>

            <Text
              style={
                styles.etiquetaEstadistica
              }
            >
              Reseñas
            </Text>
          </View>

          <View
            style={styles.divisorVertical}
          />

          <View
            style={styles.estadistica}
          >
            <Text
              style={
                styles.valorEstadistica
              }
            >
              {trabajador.serviciosCompletados ??
                0}
            </Text>

            <Text
              style={
                styles.etiquetaEstadistica
              }
            >
              Completados
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#172B3A"
          />
        </TouchableOpacity>

        <View style={styles.headerTexto}>
          <Text style={styles.titulo}>
            Ranking de trabajadores
          </Text>

          <Text
            style={styles.subtitulo}
            numberOfLines={1}
          >
            Conoce a los trabajadores mejor posicionados
          </Text>
        </View>
      </View>

      {cargando ? (
        <View
          style={styles.estadoCentral}
        >
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text
            style={styles.textoCargando}
          >
            Cargando ranking...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.contenido
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={() =>
                cargarRanking(true)
              }
              tintColor="#0D9488"
              colors={['#0D9488']}
            />
          }
        >
          <View
            style={styles.presentacion}
          >
            <View
              style={
                styles.iconoPresentacion
              }
            >
              <Ionicons
                name="trophy-outline"
                size={27}
                color="#0D9488"
              />
            </View>

            <View
              style={
                styles.textoPresentacion
              }
            >
              <Text
                style={
                  styles.tituloPresentacion
                }
              >
                Mejores trabajadores
              </Text>

              <Text
                style={
                  styles.descripcionPresentacion
                }
              >
                El ranking considera la
                calificación, las reseñas y
                los servicios completados.
              </Text>
            </View>
          </View>

          {error ? (
            <View
              style={styles.estadoVacio}
            >
              <View
                style={
                  styles.iconoEstadoVacio
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={31}
                  color="#DC2626"
                />
              </View>

              <Text
                style={
                  styles.tituloEstadoVacio
                }
              >
                No pudimos cargar el ranking
              </Text>

              <Text
                style={
                  styles.descripcionEstadoVacio
                }
              >
                {error}
              </Text>

              <TouchableOpacity
                style={
                  styles.botonReintentar
                }
                onPress={() =>
                  cargarRanking()
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.textoReintentar
                  }
                >
                  Reintentar
                </Text>
              </TouchableOpacity>
            </View>
          ) : trabajadores.length === 0 ? (
            <View
              style={styles.estadoVacio}
            >
              <View
                style={
                  styles.iconoEstadoVacio
                }
              >
                <Ionicons
                  name="trophy-outline"
                  size={31}
                  color="#0D9488"
                />
              </View>

              <Text
                style={
                  styles.tituloEstadoVacio
                }
              >
                Aún no hay trabajadores en el
                ranking
              </Text>

              <Text
                style={
                  styles.descripcionEstadoVacio
                }
              >
                Cuando existan trabajadores
                con actividad y reputación,
                aparecerán aquí.
              </Text>
            </View>
          ) : (
            <>
              <View
                style={styles.encabezadoLista}
              >
                <Text
                  style={styles.tituloLista}
                >
                  Clasificación general
                </Text>

                <Text
                  style={
                    styles.totalTrabajadores
                  }
                >
                  {trabajadores.length}{' '}
                  {trabajadores.length === 1
                    ? 'trabajador'
                    : 'trabajadores'}
                </Text>
              </View>

              {trabajadores.map(
                renderTrabajador
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    minHeight: 76,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTexto: {
    flex: 1,
  },
  titulo: {
    color: '#172B3A',
    fontSize: 19,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contenido: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 32,
  },
  presentacion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  iconoPresentacion: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  textoPresentacion: {
    flex: 1,
  },
  tituloPresentacion: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  descripcionPresentacion: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  encabezadoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  tituloLista: {
    color: '#172B3A',
    fontSize: 17,
    fontWeight: '800',
  },
  totalTrabajadores: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginBottom: 13,
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posicion: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numeroPosicion: {
    fontSize: 15,
    fontWeight: '900',
  },
  contenedorFoto: {
    marginRight: 11,
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  fotoVacia: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datos: {
    flex: 1,
    paddingRight: 7,
  },
  nombre: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  oficio: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  insignia: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
    gap: 4,
  },
  textoInsignia: {
    fontSize: 10,
    fontWeight: '800',
  },
  separador: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginVertical: 14,
  },
  estadisticas: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadistica: {
    flex: 1,
    alignItems: 'center',
  },
  filaEstadistica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valorEstadistica: {
    color: '#172B3A',
    fontSize: 15,
    fontWeight: '800',
  },
  etiquetaEstadistica: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  divisorVertical: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  estadoCentral: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  textoCargando: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
  estadoVacio: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 35,
    alignItems: 'center',
  },
  iconoEstadoVacio: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  tituloEstadoVacio: {
    color: '#172B3A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  descripcionEstadoVacio: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  botonReintentar: {
    minHeight: 43,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingHorizontal: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
  },
  textoReintentar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});