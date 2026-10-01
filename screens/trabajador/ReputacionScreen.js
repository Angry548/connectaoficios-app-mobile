import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
} from '@react-navigation/native';
import {
  perfilTrabajadorService,
} from '../../services/perfilTrabajadorService';
import {
  reputacionService,
} from '../../services/reputacionService';
import {
  resenaService,
} from '../../services/resenaService';
import {
  userService,
} from '../../services/userService';

const obtenerMensajeError = (error) => {
  const data = error?.response?.data;

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
    error?.message ||
    'Ocurrió un problema al cargar la información.'
  );
};

const obtenerNombreInsignia = (insignia) => {
  switch (insignia) {
    case 'TRABAJADOR_CONFIABLE':
      return 'Trabajador confiable';

    case 'MEJOR_VALORADO':
      return 'Mejor valorado';

    case 'TOP_PLATAFORMA':
      return 'Top plataforma';

    case 'NUEVO_TRABAJADOR':
    default:
      return 'Nuevo trabajador';
  }
};

const obtenerIconoInsignia = (insignia) => {
  switch (insignia) {
    case 'TRABAJADOR_CONFIABLE':
      return 'shield-checkmark-outline';

    case 'MEJOR_VALORADO':
      return 'ribbon-outline';

    case 'TOP_PLATAFORMA':
      return 'trophy-outline';

    case 'NUEVO_TRABAJADOR':
    default:
      return 'sparkles-outline';
  }
};

const obtenerColorInsignia = (insignia) => {
  switch (insignia) {
    case 'TRABAJADOR_CONFIABLE':
      return '#0D9488';

    case 'MEJOR_VALORADO':
      return '#7C3AED';

    case 'TOP_PLATAFORMA':
      return '#D97706';

    case 'NUEVO_TRABAJADOR':
    default:
      return '#2563EB';
  }
};

const obtenerFondoInsignia = (insignia) => {
  switch (insignia) {
    case 'TRABAJADOR_CONFIABLE':
      return '#F0FDFA';

    case 'MEJOR_VALORADO':
      return '#F5F3FF';

    case 'TOP_PLATAFORMA':
      return '#FFFBEB';

    case 'NUEVO_TRABAJADOR':
    default:
      return '#EFF6FF';
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return 'Fecha no disponible';
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Fecha no disponible';
  }

  return valor.toLocaleDateString(
    'es-SV',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};

const crearEstrellas = (calificacion) => {
  const valor = Math.max(
    0,
    Math.min(
      5,
      Math.round(
        Number(calificacion) || 0
      )
    )
  );

  return Array.from(
    { length: 5 },
    (_, indice) =>
      indice < valor
        ? 'star'
        : 'star-outline'
  );
};

const obtenerNombreUsuario = (usuario) => {
  if (!usuario) {
    return '';
  }

  return (
    usuario.nombre ||
    usuario.Nombre ||
    usuario.name ||
    usuario.Name ||
    ''
  );
};

const obtenerIniciales = (nombre) => {
  const texto = nombre?.trim();

  if (!texto) {
    return 'T';
  }

  const partes = texto
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 1) {
    return partes[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    partes[0][0] +
    partes[1][0]
  ).toUpperCase();
};

export default function ReputacionScreen({
  navigation,
}) {
  const [perfil, setPerfil] = useState(null);
  const [reputacion, setReputacion] =
    useState(null);
  const [ranking, setRanking] =
    useState([]);
  const [resenas, setResenas] =
    useState([]);
  const [cargando, setCargando] =
    useState(true);
  const [actualizando, setActualizando] =
    useState(false);
  const [error, setError] =
    useState('');

  const cargarUsuarioSeguro =
    useCallback(async (usuarioId) => {
      const id = Number(usuarioId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return null;
      }

      try {
        return await userService.obtenerUsuarioPorId(
          id
        );
      } catch (errorUsuario) {
        return null;
      }
    }, []);

  const enriquecerRanking =
    useCallback(
      async (
        reputaciones,
        signal
      ) => {
        const lista = Array.isArray(
          reputaciones
        )
          ? reputaciones
          : [];

        const resultados =
          await Promise.all(
            lista.map(
              async (item) => {
                if (signal?.aborted) {
                  return null;
                }

                try {
                  const perfilRanking =
                    await perfilTrabajadorService
                      .obtenerPerfilPorId(
                        item.perfilTrabajadorId,
                        {
                          signal,
                        }
                      );

                  if (signal?.aborted) {
                    return null;
                  }

                  const usuario =
                    await cargarUsuarioSeguro(
                      perfilRanking?.trabajadorId
                    );

                  return {
                    ...item,
                    perfil: perfilRanking,
                    usuario,
                    nombre:
                      obtenerNombreUsuario(
                        usuario
                      ) ||
                      perfilRanking
                        ?.oficioPrincipal ||
                      `Trabajador #${perfilRanking?.trabajadorId ?? item.perfilTrabajadorId}`,
                  };
                } catch (errorPerfil) {
                  if (
                    errorPerfil?.name ===
                      'CanceledError' ||
                    errorPerfil?.code ===
                      'ERR_CANCELED' ||
                    signal?.aborted
                  ) {
                    return null;
                  }

                  return {
                    ...item,
                    perfil: null,
                    usuario: null,
                    nombre:
                      `Trabajador #${item.perfilTrabajadorId}`,
                  };
                }
              }
            )
          );

        return resultados.filter(Boolean);
      },
      [cargarUsuarioSeguro]
    );

  const enriquecerResenas =
    useCallback(
      async (listaResenas) => {
        const lista = Array.isArray(
          listaResenas
        )
          ? listaResenas
          : [];

        const usuariosUnicos =
          new Map();

        const idsClientes = [
          ...new Set(
            lista
              .map((item) =>
                Number(item.clienteId)
              )
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )
          ),
        ];

        await Promise.all(
          idsClientes.map(
            async (clienteId) => {
              const usuario =
                await cargarUsuarioSeguro(
                  clienteId
                );

              usuariosUnicos.set(
                clienteId,
                usuario
              );
            }
          )
        );

        return lista.map((item) => {
          const usuario =
            usuariosUnicos.get(
              Number(item.clienteId)
            );

          return {
            ...item,
            usuario,
            nombreCliente:
              obtenerNombreUsuario(usuario) ||
              'Cliente de ConnectaOficios',
          };
        });
      },
      [cargarUsuarioSeguro]
    );

  const cargarDatos = useCallback(
    async (
      mostrarCarga = true,
      signal
    ) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const miPerfil =
          await perfilTrabajadorService
            .obtenerMiPerfil({
              signal,
            });

        if (signal?.aborted) {
          return;
        }

        setPerfil(miPerfil);

        let miReputacion;

        try {
          miReputacion =
            await reputacionService
              .obtenerPorPerfilTrabajador(
                miPerfil.id,
                {
                  signal,
                }
              );
        } catch (errorReputacion) {
          if (
            errorReputacion?.name ===
              'CanceledError' ||
            errorReputacion?.code ===
              'ERR_CANCELED' ||
            signal?.aborted
          ) {
            return;
          }

          if (
            errorReputacion?.response
              ?.status === 404
          ) {
            miReputacion =
              await reputacionService
                .crearReputacion(
                  miPerfil.id,
                  {
                    signal,
                  }
                );
          } else {
            throw errorReputacion;
          }
        }

        if (signal?.aborted) {
          return;
        }

        setReputacion(miReputacion);

        const [
          rankingObtenido,
          resenasObtenidas,
        ] = await Promise.all([
          reputacionService.obtenerRanking({
            signal,
          }),
          resenaService.obtenerPorTrabajador(
            miPerfil.id,
            {
              signal,
            }
          ),
        ]);

        if (signal?.aborted) {
          return;
        }

        const [
          rankingCompleto,
          resenasCompletas,
        ] = await Promise.all([
          enriquecerRanking(
            rankingObtenido,
            signal
          ),
          enriquecerResenas(
            resenasObtenidas
          ),
        ]);

        if (signal?.aborted) {
          return;
        }

        setRanking(rankingCompleto);
        setResenas(resenasCompletas);
      } catch (err) {
        if (
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          signal?.aborted
        ) {
          return;
        }

        setError(
          obtenerMensajeError(err)
        );

        setReputacion(null);
        setRanking([]);
        setResenas([]);
      } finally {
        if (!signal?.aborted) {
          setCargando(false);
          setActualizando(false);
        }
      }
    },
    [
      enriquecerRanking,
      enriquecerResenas,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      const controller =
        new AbortController();

      cargarDatos(
        true,
        controller.signal
      );

      return () => {
        controller.abort();
      };
    }, [cargarDatos])
  );

  const actualizar = async () => {
    if (actualizando) {
      return;
    }

    setActualizando(true);

    const controller =
      new AbortController();

    await cargarDatos(
      false,
      controller.signal
    );
  };

  const miPosicion = useMemo(() => {
    if (
      reputacion?.posicionRanking !== null &&
      reputacion?.posicionRanking !==
        undefined
    ) {
      return Number(
        reputacion.posicionRanking
      );
    }

    const indice = ranking.findIndex(
      (item) =>
        Number(
          item.perfilTrabajadorId
        ) === Number(perfil?.id)
    );

    return indice >= 0
      ? indice + 1
      : null;
  }, [
    reputacion,
    ranking,
    perfil,
  ]);

  const promedio = Number(
    reputacion?.promedioCalificacion ??
      0
  );

  const puntuacion = Number(
    reputacion?.puntuacionRanking ??
      0
  );

  const insignia =
    reputacion?.insignia ??
    'NUEVO_TRABAJADOR';

  const renderAvatar = (
    item,
    tamanio = 52
  ) => {
    const foto =
      item?.perfil?.fotoUrl;

    const nombre =
      item?.nombre ||
      'Trabajador';

    if (foto) {
      return (
        <Image
          source={{
            uri: foto,
          }}
          style={[
            styles.avatarImagen,
            {
              width: tamanio,
              height: tamanio,
              borderRadius:
                tamanio / 2,
            },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarIniciales,
          {
            width: tamanio,
            height: tamanio,
            borderRadius:
              tamanio / 2,
          },
        ]}
      >
        <Text
          style={
            styles.avatarInicialesTexto
          }
        >
          {obtenerIniciales(nombre)}
        </Text>
      </View>
    );
  };

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View style={styles.centro}>
          <ActivityIndicator
            size="large"
          />

          <Text
            style={styles.textoCarga}
          >
            Cargando reputación...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.contenedor}
    >
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#101828"
          />
        </Pressable>

        <View
          style={styles.encabezadoTexto}
        >
          <Text style={styles.titulo}>
            Mi reputación
          </Text>

          <Text
            style={styles.subtitulo}
          >
            Consulta tu desempeño y posición
          </Text>
        </View>

        <View style={styles.espacio} />
      </View>

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
            onRefresh={actualizar}
          />
        }
      >
        {error ? (
          <View
            style={
              styles.errorContenedor
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={44}
              color="#B42318"
            />

            <Text
              style={styles.errorTitulo}
            >
              No se pudo cargar tu reputación
            </Text>

            <Text
              style={styles.errorTexto}
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.botonReintentar
              }
              onPress={() =>
                cargarDatos()
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
        ) : (
          <>
            <View
              style={
                styles.tarjetaPrincipal
              }
            >
              <View
                style={
                  styles.principalSuperior
                }
              >
                <View
                  style={[
                    styles.insigniaIcono,
                    {
                      backgroundColor:
                        obtenerFondoInsignia(
                          insignia
                        ),
                    },
                  ]}
                >
                  <Ionicons
                    name={obtenerIconoInsignia(
                      insignia
                    )}
                    size={31}
                    color={obtenerColorInsignia(
                      insignia
                    )}
                  />
                </View>

                <View
                  style={
                    styles.principalInformacion
                  }
                >
                  <Text
                    style={
                      styles.etiquetaPequena
                    }
                  >
                    Tu insignia actual
                  </Text>

                  <Text
                    style={[
                      styles.nombreInsignia,
                      {
                        color:
                          obtenerColorInsignia(
                            insignia
                          ),
                      },
                    ]}
                  >
                    {obtenerNombreInsignia(
                      insignia
                    )}
                  </Text>

                  {perfil?.oficioPrincipal ? (
                    <Text
                      style={
                        styles.oficioPrincipal
                      }
                    >
                      {perfil.oficioPrincipal}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View
                style={styles.separador}
              />

              <View
                style={
                  styles.calificacionPrincipal
                }
              >
                <View>
                  <Text
                    style={
                      styles.promedioGrande
                    }
                  >
                    {promedio.toFixed(1)}
                  </Text>

                  <View
                    style={
                      styles.estrellasFila
                    }
                  >
                    {crearEstrellas(
                      promedio
                    ).map(
                      (
                        estrella,
                        indice
                      ) => (
                        <Ionicons
                          key={indice}
                          name={estrella}
                          size={18}
                          color="#F59E0B"
                        />
                      )
                    )}
                  </View>
                </View>

                <View
                  style={
                    styles.calificacionTextoContenedor
                  }
                >
                  <Text
                    style={
                      styles.calificacionTitulo
                    }
                  >
                    Calificación promedio
                  </Text>

                  <Text
                    style={
                      styles.calificacionDescripcion
                    }
                  >
                    Basada en{' '}
                    {reputacion?.totalResenas ??
                      0}{' '}
                    {Number(
                      reputacion?.totalResenas ??
                        0
                    ) === 1
                      ? 'reseña'
                      : 'reseñas'}
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={styles.seccionTitulo}
            >
              Resumen de desempeño
            </Text>

            <View
              style={
                styles.estadisticasGrid
              }
            >
              <View
                style={
                  styles.estadisticaTarjeta
                }
              >
                <View
                  style={[
                    styles.estadisticaIcono,
                    styles.fondoAzul,
                  ]}
                >
                  <Ionicons
                    name="trophy-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={
                    styles.estadisticaValor
                  }
                >
                  {miPosicion
                    ? `#${miPosicion}`
                    : '—'}
                </Text>

                <Text
                  style={
                    styles.estadisticaEtiqueta
                  }
                >
                  Posición
                </Text>
              </View>

              <View
                style={
                  styles.estadisticaTarjeta
                }
              >
                <View
                  style={[
                    styles.estadisticaIcono,
                    styles.fondoVerde,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color="#0D9488"
                  />
                </View>

                <Text
                  style={
                    styles.estadisticaValor
                  }
                >
                  {reputacion
                    ?.serviciosCompletados ??
                    0}
                </Text>

                <Text
                  style={
                    styles.estadisticaEtiqueta
                  }
                >
                  Completados
                </Text>
              </View>

              <View
                style={
                  styles.estadisticaTarjeta
                }
              >
                <View
                  style={[
                    styles.estadisticaIcono,
                    styles.fondoAmarillo,
                  ]}
                >
                  <Ionicons
                    name="star-outline"
                    size={22}
                    color="#D97706"
                  />
                </View>

                <Text
                  style={
                    styles.estadisticaValor
                  }
                >
                  {reputacion
                    ?.totalResenas ??
                    0}
                </Text>

                <Text
                  style={
                    styles.estadisticaEtiqueta
                  }
                >
                  Reseñas
                </Text>
              </View>

              <View
                style={
                  styles.estadisticaTarjeta
                }
              >
                <View
                  style={[
                    styles.estadisticaIcono,
                    styles.fondoMorado,
                  ]}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={22}
                    color="#7C3AED"
                  />
                </View>

                <Text
                  style={
                    styles.estadisticaValor
                  }
                >
                  {puntuacion.toFixed(1)}
                </Text>

                <Text
                  style={
                    styles.estadisticaEtiqueta
                  }
                >
                  Puntuación
                </Text>
              </View>
            </View>

            <View
              style={
                styles.actualizacionContenedor
              }
            >
              <Ionicons
                name="time-outline"
                size={16}
                color="#667085"
              />

              <Text
                style={
                  styles.actualizacionTexto
                }
              >
                Actualizado:{' '}
                {formatearFecha(
                  reputacion
                    ?.fechaActualizacion
                )}
              </Text>
            </View>

            <View
              style={
                styles.seccionEncabezado
              }
            >
              <View>
                <Text
                  style={
                    styles.seccionTituloSinMargen
                  }
                >
                  Ranking de trabajadores
                </Text>

                <Text
                  style={
                    styles.seccionSubtitulo
                  }
                >
                  Clasificación general de ConnectaOficios
                </Text>
              </View>

              <View
                style={
                  styles.rankingCantidad
                }
              >
                <Text
                  style={
                    styles.rankingCantidadTexto
                  }
                >
                  {ranking.length}
                </Text>
              </View>
            </View>

            {ranking.length === 0 ? (
              <View
                style={styles.vacio}
              >
                <View
                  style={
                    styles.iconoVacio
                  }
                >
                  <Ionicons
                    name="podium-outline"
                    size={43}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={
                    styles.vacioTitulo
                  }
                >
                  Aún no hay clasificación
                </Text>

                <Text
                  style={
                    styles.vacioTexto
                  }
                >
                  El ranking aparecerá cuando existan trabajadores con reputación registrada.
                </Text>
              </View>
            ) : (
              ranking.map(
                (
                  trabajador,
                  indice
                ) => {
                  const esMiPerfil =
                    Number(
                      trabajador
                        .perfilTrabajadorId
                    ) ===
                    Number(perfil?.id);

                  const posicion =
                    trabajador
                      .posicionRanking ??
                    indice + 1;

                  const colorInsignia =
                    obtenerColorInsignia(
                      trabajador.insignia
                    );

                  return (
                    <View
                      key={
                        trabajador.id ??
                        `${trabajador.perfilTrabajadorId}-${indice}`
                      }
                      style={[
                        styles.tarjetaRanking,
                        esMiPerfil &&
                          styles.tarjetaRankingPropia,
                      ]}
                    >
                      <View
                        style={
                          styles.posicionContenedor
                        }
                      >
                        {posicion === 1 ? (
                          <Ionicons
                            name="trophy"
                            size={25}
                            color="#D97706"
                          />
                        ) : posicion ===
                          2 ? (
                          <Ionicons
                            name="medal"
                            size={24}
                            color="#667085"
                          />
                        ) : posicion ===
                          3 ? (
                          <Ionicons
                            name="medal"
                            size={24}
                            color="#B45309"
                          />
                        ) : (
                          <Text
                            style={
                              styles.posicionTexto
                            }
                          >
                            #{posicion}
                          </Text>
                        )}
                      </View>

                      {renderAvatar(
                        trabajador
                      )}

                      <View
                        style={
                          styles.rankingInformacion
                        }
                      >
                        <View
                          style={
                            styles.nombreRankingFila
                          }
                        >
                          <Text
                            style={
                              styles.nombreTrabajador
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {trabajador.nombre}
                          </Text>

                          {esMiPerfil ? (
                            <View
                              style={
                                styles.etiquetaTu
                              }
                            >
                              <Text
                                style={
                                  styles.etiquetaTuTexto
                                }
                              >
                                Tú
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text
                          style={
                            styles.oficioRanking
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {trabajador
                            .perfil
                            ?.oficioPrincipal ||
                            'Trabajador de ConnectaOficios'}
                        </Text>

                        <View
                          style={
                            styles.datosRanking
                          }
                        >
                          <View
                            style={
                              styles.datoRanking
                            }
                          >
                            <Ionicons
                              name="star"
                              size={14}
                              color="#F59E0B"
                            />

                            <Text
                              style={
                                styles.datoRankingTexto
                              }
                            >
                              {Number(
                                trabajador
                                  .promedioCalificacion ??
                                  0
                              ).toFixed(
                                1
                              )}
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.puntoSeparador
                            }
                          >
                            •
                          </Text>

                          <Text
                            style={
                              styles.datoRankingSecundario
                            }
                          >
                            {trabajador
                              .totalResenas ??
                              0}{' '}
                            reseñas
                          </Text>
                        </View>

                        <View
                          style={
                            styles.insigniaPequenaFila
                          }
                        >
                          <Ionicons
                            name={obtenerIconoInsignia(
                              trabajador.insignia
                            )}
                            size={14}
                            color={
                              colorInsignia
                            }
                          />

                          <Text
                            style={[
                              styles.insigniaPequenaTexto,
                              {
                                color:
                                  colorInsignia,
                              },
                            ]}
                          >
                            {obtenerNombreInsignia(
                              trabajador.insignia
                            )}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.puntuacionRankingContenedor
                        }
                      >
                        <Text
                          style={
                            styles.puntuacionRankingValor
                          }
                        >
                          {Number(
                            trabajador
                              .puntuacionRanking ??
                              0
                          ).toFixed(1)}
                        </Text>

                        <Text
                          style={
                            styles.puntuacionRankingEtiqueta
                          }
                        >
                          pts
                        </Text>
                      </View>
                    </View>
                  );
                }
              )
            )}

            <View
              style={
                styles.seccionEncabezado
              }
            >
              <View>
                <Text
                  style={
                    styles.seccionTituloSinMargen
                  }
                >
                  Mis reseñas
                </Text>

                <Text
                  style={
                    styles.seccionSubtitulo
                  }
                >
                  Opiniones recibidas por tus servicios
                </Text>
              </View>

              <View
                style={
                  styles.rankingCantidad
                }
              >
                <Text
                  style={
                    styles.rankingCantidadTexto
                  }
                >
                  {resenas.length}
                </Text>
              </View>
            </View>

            {resenas.length === 0 ? (
              <View
                style={styles.vacio}
              >
                <View
                  style={
                    styles.iconoVacio
                  }
                >
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={43}
                    color="#0D9488"
                  />
                </View>

                <Text
                  style={
                    styles.vacioTitulo
                  }
                >
                  Aún no tienes reseñas
                </Text>

                <Text
                  style={
                    styles.vacioTexto
                  }
                >
                  Las opiniones de tus clientes aparecerán aquí cuando califiquen servicios completados.
                </Text>
              </View>
            ) : (
              resenas.map(
                (resena) => (
                  <View
                    key={resena.id}
                    style={
                      styles.tarjetaResena
                    }
                  >
                    <View
                      style={
                        styles.resenaEncabezado
                      }
                    >
                      <View
                        style={
                          styles.avatarCliente
                        }
                      >
                        <Text
                          style={
                            styles.avatarClienteTexto
                          }
                        >
                          {obtenerIniciales(
                            resena.nombreCliente
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.resenaInformacion
                        }
                      >
                        <Text
                          style={
                            styles.nombreCliente
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {resena.nombreCliente}
                        </Text>

                        <Text
                          style={
                            styles.fechaResena
                          }
                        >
                          {formatearFecha(
                            resena.fechaCreacion
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.calificacionResena
                        }
                      >
                        <Ionicons
                          name="star"
                          size={17}
                          color="#F59E0B"
                        />

                        <Text
                          style={
                            styles.calificacionResenaTexto
                          }
                        >
                          {Number(
                            resena.calificacion
                          ).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.estrellasResena
                      }
                    >
                      {crearEstrellas(
                        resena.calificacion
                      ).map(
                        (
                          estrella,
                          indice
                        ) => (
                          <Ionicons
                            key={indice}
                            name={estrella}
                            size={17}
                            color="#F59E0B"
                          />
                        )
                      )}
                    </View>

                    {resena.comentario ? (
                      <Text
                        style={
                          styles.comentarioResena
                        }
                      >
                        {resena.comentario}
                      </Text>
                    ) : (
                      <Text
                        style={
                          styles.sinComentario
                        }
                      >
                        El cliente dejó una calificación sin comentario.
                      </Text>
                    )}
                  </View>
                )
              )
            )}
          </>
        )}
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  encabezadoTexto: {
    flex: 1,
    paddingHorizontal: 14,
  },

  titulo: {
    color: '#101828',
    fontSize: 21,
    fontWeight: '800',
  },

  subtitulo: {
    color: '#667085',
    fontSize: 13,
    marginTop: 3,
  },

  espacio: {
    width: 42,
  },

  scroll: {
    flex: 1,
  },

  contenido: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 38,
  },

  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  textoCarga: {
    color: '#667085',
    fontSize: 14,
    marginTop: 13,
  },

  errorContenedor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: 'center',
  },

  errorTitulo: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  errorTexto: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 7,
  },

  botonReintentar: {
    minHeight: 45,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  botonReintentarTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 18,
  },

  principalSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  insigniaIcono: {
    width: 58,
    height: 58,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  principalInformacion: {
    flex: 1,
    marginLeft: 14,
  },

  etiquetaPequena: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
  },

  nombreInsignia: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },

  oficioPrincipal: {
    color: '#475467',
    fontSize: 13,
    marginTop: 4,
  },

  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 17,
  },

  calificacionPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  promedioGrande: {
    color: '#101828',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },

  estrellasFila: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 3,
  },

  calificacionTextoContenedor: {
    flex: 1,
    marginLeft: 20,
  },

  calificacionTitulo: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '700',
  },

  calificacionDescripcion: {
    color: '#667085',
    fontSize: 13,
    marginTop: 4,
  },

  seccionTitulo: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 26,
    marginBottom: 12,
  },

  estadisticasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  estadisticaTarjeta: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 15,
  },

  estadisticaIcono: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  fondoAzul: {
    backgroundColor: '#EFF6FF',
  },

  fondoVerde: {
    backgroundColor: '#F0FDFA',
  },

  fondoAmarillo: {
    backgroundColor: '#FFFBEB',
  },

  fondoMorado: {
    backgroundColor: '#F5F3FF',
  },

  estadisticaValor: {
    color: '#101828',
    fontSize: 22,
    fontWeight: '800',
  },

  estadisticaEtiqueta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  actualizacionContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },

  actualizacionTexto: {
    color: '#667085',
    fontSize: 12,
  },

  seccionEncabezado: {
    marginTop: 29,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  seccionTituloSinMargen: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '800',
  },

  seccionSubtitulo: {
    color: '#667085',
    fontSize: 12,
    marginTop: 3,
  },

  rankingCantidad: {
    minWidth: 34,
    height: 29,
    paddingHorizontal: 9,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rankingCantidadTexto: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },

  tarjetaRanking: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tarjetaRankingPropia: {
    borderColor: '#5EEAD4',
    backgroundColor: '#F0FDFA',
  },

  posicionContenedor: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  posicionTexto: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '800',
  },

  avatarImagen: {
    backgroundColor: '#E2E8F0',
  },

  avatarIniciales: {
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarInicialesTexto: {
    color: '#0369A1',
    fontSize: 14,
    fontWeight: '800',
  },

  rankingInformacion: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  nombreRankingFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  nombreTrabajador: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },

  etiquetaTu: {
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    backgroundColor: '#CCFBF1',
  },

  etiquetaTuTexto: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '800',
  },

  oficioRanking: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
  },

  datosRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  datoRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  datoRankingTexto: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
  },

  puntoSeparador: {
    color: '#98A2B3',
    marginHorizontal: 5,
  },

  datoRankingSecundario: {
    color: '#667085',
    fontSize: 11,
  },

  insigniaPequenaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },

  insigniaPequenaTexto: {
    fontSize: 10,
    fontWeight: '700',
  },

  puntuacionRankingContenedor: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  puntuacionRankingValor: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '800',
  },

  puntuacionRankingEtiqueta: {
    color: '#98A2B3',
    fontSize: 10,
    marginTop: 1,
  },

  tarjetaResena: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 16,
    marginBottom: 10,
  },

  resenaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarCliente: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#ECFDF3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarClienteTexto: {
    color: '#027A48',
    fontSize: 13,
    fontWeight: '800',
  },

  resenaInformacion: {
    flex: 1,
    marginLeft: 11,
  },

  nombreCliente: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '700',
  },

  fechaResena: {
    color: '#98A2B3',
    fontSize: 11,
    marginTop: 3,
  },

  calificacionResena: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  calificacionResenaTexto: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },

  estrellasResena: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 13,
  },

  comentarioResena: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  sinComentario: {
    color: '#98A2B3',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 19,
    marginTop: 10,
  },

  vacio: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    paddingHorizontal: 22,
    paddingVertical: 27,
    alignItems: 'center',
  },

  iconoVacio: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  vacioTitulo: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 13,
  },

  vacioTexto: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
});