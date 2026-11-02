import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import reporteService from '../../../services/reporteService';

const ESTADOS = {
  PENDIENTE: {
    texto: 'Pendiente',
    color: '#B54708',
    fondo: '#FEF0C7',
    icono:
      'time-outline',
  },

  EN_REVISION: {
    texto: 'En revisión',
    color: '#175CD3',
    fondo: '#EFF8FF',
    icono:
      'search-outline',
  },

  RESUELTO: {
    texto: 'Resuelto',
    color: '#027A48',
    fondo: '#ECFDF3',
    icono:
      'checkmark-circle-outline',
  },

  RECHAZADO: {
    texto: 'Rechazado',
    color: '#B42318',
    fondo: '#FEE4E2',
    icono:
      'close-circle-outline',
  },
};

const obtenerEstado = (
  estado
) => {
  return (
    ESTADOS[
      String(
        estado || ''
      ).toUpperCase()
    ] || {
      texto: 'Sin estado',
      color: '#475467',
      fondo: '#F2F4F7',
      icono:
        'help-circle-outline',
    }
  );
};

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return 'Sin registrar';
  }

  const valor =
    new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return String(fecha);
  }

  return valor.toLocaleString(
    'es-SV',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

const Campo = ({
  etiqueta,
  valor,
}) => (
  <View
    style={styles.campo}
  >
    <Text
      style={styles.campoEtiqueta}
    >
      {etiqueta}
    </Text>

    <Text
      style={styles.campoValor}
    >
      {valor ||
        'Sin registrar'}
    </Text>
  </View>
);

export default function DetalleReporteScreen({
  route,
  navigation,
}) {
  const reporteId =
    route?.params?.reporteId;

  const [
    reporte,
    setReporte,
  ] = useState(null);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const cargar =
    useCallback(
      async () => {
        if (!reporteId) {
          setError(
            'No se recibió el identificador del reporte.'
          );

          setCargando(
            false
          );

          return;
        }

        setCargando(true);
        setError('');

        try {
          const resultado =
            await reporteService
              .obtenerMiReportePorId(
                reporteId
              );

          setReporte(
            resultado
          );
        } catch (err) {
          setReporte(null);

          setError(
            err?.message ||
              'No fue posible cargar el reporte.'
          );
        } finally {
          setCargando(
            false
          );
        }
      },
      [reporteId]
    );

  useFocusEffect(
    useCallback(() => {
      cargar();

      return undefined;
    }, [cargar])
  );

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View
          style={styles.centro}
        >
          <ActivityIndicator
            size="large"
            color="#0D9488"
          />

          <Text
            style={styles.cargandoTexto}
          >
            Cargando reporte...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !reporte
  ) {
    return (
      <SafeAreaView
        style={styles.contenedor}
      >
        <View
          style={styles.encabezado}
        >
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

          <Text
            style={styles.titulo}
          >
            Detalle del reporte
          </Text>
        </View>

        <View
          style={styles.centro}
        >
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color="#B42318"
          />

          <Text
            style={styles.errorTitulo}
          >
            No se pudo cargar
          </Text>

          <Text
            style={styles.errorTexto}
          >
            {error}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={cargar}
          >
            <Text
              style={styles.botonReintentarTexto}
            >
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const estilo =
    obtenerEstado(
      reporte.estado
    );

  const finalizado =
    reporte.estado ===
      'RESUELTO' ||
    reporte.estado ===
      'RECHAZADO';

  return (
    <SafeAreaView
      style={styles.contenedor}
      edges={['top']}
    >
      <View
        style={styles.encabezado}
      >
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
          <Text
            style={styles.titulo}
          >
            Detalle del reporte
          </Text>

          <Text
            style={styles.subtitulo}
          >
            Reporte #{reporte.id}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.tarjetaPrincipal}
        >
          <View
            style={styles.principalSuperior}
          >
            <View
              style={styles.iconoPrincipal}
            >
              <Ionicons
                name={
                  reporte.tipo ===
                  'SERVICIO'
                    ? 'briefcase-outline'
                    : 'person-outline'
                }
                size={27}
                color="#0D9488"
              />
            </View>

            <View
              style={styles.principalTexto}
            >
              <Text
                style={styles.tipo}
              >
                {reporte.tipo ===
                'SERVICIO'
                  ? 'Reporte de servicio'
                  : 'Reporte de usuario'}
              </Text>

              <Text
                style={styles.motivo}
              >
                {reporte.motivo}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.estado,

              {
                backgroundColor:
                  estilo.fondo,
              },
            ]}
          >
            <Ionicons
              name={
                estilo.icono
              }
              size={15}
              color={
                estilo.color
              }
            />

            <Text
              style={[
                styles.estadoTexto,

                {
                  color:
                    estilo.color,
                },
              ]}
            >
              {estilo.texto}
            </Text>
          </View>
        </View>

        <View
          style={styles.tarjeta}
        >
          <Text
            style={styles.tituloSeccion}
          >
            Información enviada
          </Text>

          <Campo
            etiqueta="Motivo"
            valor={
              reporte.motivo
            }
          />

          <View
            style={styles.separador}
          />

          <Campo
            etiqueta="Descripción"
            valor={
              reporte.descripcion
            }
          />

          <View
            style={styles.separador}
          />

          <Campo
            etiqueta="Fecha del reporte"
            valor={
              formatearFecha(
                reporte.fechaCreacion
              )
            }
          />

          {reporte.tipo ===
            'SERVICIO' && (
            <>
              <View
                style={styles.separador}
              />

              <Campo
                etiqueta="Servicio relacionado"
                valor={
                  reporte.servicioId
                    ? `Servicio #${reporte.servicioId}`
                    : 'Sin servicio asociado'
                }
              />
            </>
          )}

          {reporte.tipo ===
            'USUARIO' && (
            <>
              <View
                style={styles.separador}
              />

              <Campo
                etiqueta="Usuario relacionado"
                valor={
                  reporte.usuarioReportadoId
                    ? `Usuario #${reporte.usuarioReportadoId}`
                    : 'Sin usuario asociado'
                }
              />
            </>
          )}
        </View>

        {reporte.estado ===
          'EN_REVISION' && (
          <View
            style={styles.avisoRevision}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color="#175CD3"
            />

            <View
              style={styles.avisoContenido}
            >
              <Text
                style={styles.avisoTitulo}
              >
                Reporte en revisión
              </Text>

              <Text
                style={styles.avisoTexto}
              >
                Un administrador está revisando la información proporcionada.
              </Text>
            </View>
          </View>
        )}

        {finalizado && (
          <View
            style={styles.tarjeta}
          >
            <Text
              style={styles.tituloSeccion}
            >
              Respuesta administrativa
            </Text>

            <Campo
              etiqueta={
                reporte.estado ===
                'RECHAZADO'
                  ? 'Comentario del administrador'
                  : 'Resolución'
              }
              valor={
                reporte.resolucion
              }
            />

            {Boolean(
              reporte.accionTomada
            ) && (
              <>
                <View
                  style={styles.separador}
                />

                <Campo
                  etiqueta="Acción tomada"
                  valor={
                    reporte.accionTomada
                  }
                />
              </>
            )}

            {Boolean(
              reporte.fechaResolucion
            ) && (
              <>
                <View
                  style={styles.separador}
                />

                <Campo
                  etiqueta="Fecha de resolución"
                  valor={
                    formatearFecha(
                      reporte.fechaResolucion
                    )
                  }
                />
              </>
            )}
          </View>
        )}

        {reporte.estado ===
          'PENDIENTE' && (
          <View
            style={styles.avisoPendiente}
          >
            <Ionicons
              name="time-outline"
              size={22}
              color="#B54708"
            />

            <View
              style={styles.avisoContenido}
            >
              <Text
                style={styles.avisoTituloPendiente}
              >
                Pendiente de revisión
              </Text>

              <Text
                style={styles.avisoTextoPendiente}
              >
                El reporte fue recibido correctamente y todavía no ha sido tomado por un administrador.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
    },

    encabezado: {
      minHeight: 82,
      paddingHorizontal: 18,
      backgroundColor:
        '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
    },

    botonVolver: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor:
        '#F1F5F9',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    encabezadoTexto: {
      flex: 1,
    },

    titulo: {
      color: '#172B3A',
      fontSize: 20,
      fontWeight: '800',
    },

    subtitulo: {
      color: '#64748B',
      fontSize: 12,
      marginTop: 2,
    },

    scroll: {
      flex: 1,
    },

    contenido: {
      padding: 18,
      paddingBottom: 40,
    },

    tarjetaPrincipal: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E2E8F0',
      borderRadius: 20,
      padding: 18,
    },

    principalSuperior: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconoPrincipal: {
      width: 54,
      height: 54,
      borderRadius: 17,
      backgroundColor:
        '#E6F4F1',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 13,
    },

    principalTexto: {
      flex: 1,
    },

    tipo: {
      color: '#0D9488',
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    motivo: {
      color: '#172B3A',
      fontSize: 17,
      fontWeight: '800',
      marginTop: 4,
    },

    estado: {
      alignSelf:
        'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 5,
      marginTop: 16,
    },

    estadoTexto: {
      fontSize: 11,
      fontWeight: '800',
    },

    tarjeta: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E2E8F0',
      borderRadius: 20,
      padding: 18,
      marginTop: 16,
    },

    tituloSeccion: {
      color: '#172B3A',
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 16,
    },

    campo: {},

    campoEtiqueta: {
      color: '#64748B',
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 5,
    },

    campoValor: {
      color: '#172B3A',
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
    },

    separador: {
      height: 1,
      backgroundColor:
        '#EAECF0',
      marginVertical: 14,
    },

    avisoRevision: {
      flexDirection: 'row',
      backgroundColor:
        '#EFF8FF',
      borderWidth: 1,
      borderColor:
        '#B2DDFF',
      borderRadius: 16,
      padding: 15,
      marginTop: 16,
      gap: 10,
    },

    avisoPendiente: {
      flexDirection: 'row',
      backgroundColor:
        '#FFFAEB',
      borderWidth: 1,
      borderColor:
        '#FEDF89',
      borderRadius: 16,
      padding: 15,
      marginTop: 16,
      gap: 10,
    },

    avisoContenido: {
      flex: 1,
    },

    avisoTitulo: {
      color: '#175CD3',
      fontSize: 13,
      fontWeight: '800',
    },

    avisoTexto: {
      color: '#1849A9',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    avisoTituloPendiente: {
      color: '#B54708',
      fontSize: 13,
      fontWeight: '800',
    },

    avisoTextoPendiente: {
      color: '#93370D',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    centro: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      padding: 30,
    },

    cargandoTexto: {
      color: '#64748B',
      marginTop: 10,
    },

    errorTitulo: {
      color: '#172B3A',
      fontSize: 17,
      fontWeight: '800',
      marginTop: 13,
    },

    errorTexto: {
      color: '#64748B',
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 5,
    },

    botonReintentar: {
      backgroundColor:
        '#0D9488',
      borderRadius: 13,
      paddingHorizontal: 18,
      paddingVertical: 11,
      marginTop: 18,
    },

    botonReintentarTexto: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 12,
    },
  });