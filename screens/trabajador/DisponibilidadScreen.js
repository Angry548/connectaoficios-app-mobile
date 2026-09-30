import React, {
  useCallback,
  useEffect,
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
import { disponibilidadService } from '../../services/disponibilidadService';

const DIAS = [
  { valor: 'LUNES', texto: 'Lunes' },
  { valor: 'MARTES', texto: 'Martes' },
  { valor: 'MIERCOLES', texto: 'Miércoles' },
  { valor: 'JUEVES', texto: 'Jueves' },
  { valor: 'VIERNES', texto: 'Viernes' },
  { valor: 'SABADO', texto: 'Sábado' },
  { valor: 'DOMINGO', texto: 'Domingo' },
];

export default function DisponibilidadScreen({
  route,
  navigation,
}) {
  const servicioId = route?.params?.servicioId;

  const [disponibilidades, setDisponibilidades] =
    useState([]);
  const [diaSemana, setDiaSemana] =
    useState('LUNES');
  const [horaInicio, setHoraInicio] =
    useState('');
  const [horaFin, setHoraFin] =
    useState('');
  const [editandoId, setEditandoId] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);
  const [guardando, setGuardando] =
    useState(false);
  const [error, setError] =
    useState('');
  const [alturaTeclado, setAlturaTeclado] =
    useState(0);

  useEffect(() => {
    const mostrar = Keyboard.addListener(
      'keyboardDidShow',
      (evento) => {
        setAlturaTeclado(
          evento.endCoordinates.height
        );
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

  const obtenerMensajeError = (
    err,
    predeterminado
  ) => {
    const data = err?.response?.data;

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
      err?.message ||
      predeterminado
    );
  };

  const cargarDisponibilidades =
    useCallback(async () => {
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
        const data =
          await disponibilidadService.listarPorServicio(
            servicioId
          );

        setDisponibilidades(data);
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            'No se pudo cargar la disponibilidad.'
          )
        );
      } finally {
        setCargando(false);
      }
    }, [servicioId]);

  useEffect(() => {
    cargarDisponibilidades();
  }, [cargarDisponibilidades]);

  const normalizarHora = (valor) => {
    const texto = valor.trim();

    if (/^\d{2}:\d{2}$/.test(texto)) {
      return `${texto}:00`;
    }

    return texto;
  };

  const horaValida = (valor) => {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(
      valor.trim()
    );
  };

  const validar = () => {
    if (!diaSemana) {
      Alert.alert(
        'Día requerido',
        'Selecciona un día de atención.'
      );
      return false;
    }

    if (!horaValida(horaInicio)) {
      Alert.alert(
        'Hora inválida',
        'La hora de inicio debe tener formato HH:mm, por ejemplo 08:00.'
      );
      return false;
    }

    if (!horaValida(horaFin)) {
      Alert.alert(
        'Hora inválida',
        'La hora de fin debe tener formato HH:mm, por ejemplo 17:00.'
      );
      return false;
    }

    if (
      normalizarHora(horaInicio) >=
      normalizarHora(horaFin)
    ) {
      Alert.alert(
        'Horario inválido',
        'La hora de fin debe ser posterior a la hora de inicio.'
      );
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setDiaSemana('LUNES');
    setHoraInicio('');
    setHoraFin('');
  };

  const guardar = async () => {
    if (guardando || !validar()) {
      return;
    }

    Keyboard.dismiss();
    setGuardando(true);

    try {
      if (editandoId) {
        await disponibilidadService.modificar(
          editandoId,
          {
            diaSemana,
            horaInicio:
              normalizarHora(horaInicio),
            horaFin:
              normalizarHora(horaFin),
          }
        );
      } else {
        await disponibilidadService.crear({
          servicioId,
          diaSemana,
          horaInicio:
            normalizarHora(horaInicio),
          horaFin:
            normalizarHora(horaFin),
        });
      }

      limpiarFormulario();
      await cargarDisponibilidades();

      Alert.alert(
        editandoId
          ? 'Horario actualizado'
          : 'Horario agregado',
        editandoId
          ? 'La disponibilidad fue actualizada correctamente.'
          : 'La disponibilidad fue registrada correctamente.'
      );
    } catch (err) {
      Alert.alert(
        'No se pudo guardar',
        obtenerMensajeError(
          err,
          'No se pudo guardar la disponibilidad.'
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setDiaSemana(item.diaSemana);

    setHoraInicio(
      item.horaInicio
        ? item.horaInicio.substring(0, 5)
        : ''
    );

    setHoraFin(
      item.horaFin
        ? item.horaFin.substring(0, 5)
        : ''
    );
  };

  const eliminar = (item) => {
    Alert.alert(
      'Eliminar horario',
      `¿Deseas eliminar el horario del ${obtenerNombreDia(
        item.diaSemana
      )}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await disponibilidadService.eliminar(
                item.id
              );

              if (editandoId === item.id) {
                limpiarFormulario();
              }

              await cargarDisponibilidades();
            } catch (err) {
              Alert.alert(
                'No se pudo eliminar',
                obtenerMensajeError(
                  err,
                  'No se pudo eliminar el horario.'
                )
              );
            }
          },
        },
      ]
    );
  };

  const obtenerNombreDia = (valor) => {
    return (
      DIAS.find(
        (dia) => dia.valor === valor
      )?.texto ?? valor
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />
          <Text style={styles.textoCarga}>
            Cargando disponibilidad...
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
            Disponibilidad
          </Text>
          <Text style={styles.subtitulo}>
            Configura tus horarios
          </Text>
        </View>

        <View style={styles.espacio} />
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
          </View>
        ) : null}

        <View style={styles.tarjeta}>
          <View style={styles.tituloFila}>
            <View style={styles.icono}>
              <Ionicons
                name="calendar-outline"
                size={22}
                color="#0D9488"
              />
            </View>

            <View style={styles.tituloFilaTexto}>
              <Text style={styles.tituloTarjeta}>
                {editandoId
                  ? 'Editar horario'
                  : 'Agregar horario'}
              </Text>

              <Text style={styles.descripcion}>
                Selecciona el día y rango de atención.
              </Text>
            </View>
          </View>

          <Text style={styles.etiqueta}>
            Día de atención
          </Text>

          <View style={styles.dias}>
            {DIAS.map((dia) => {
              const seleccionado =
                diaSemana === dia.valor;

              return (
                <Pressable
                  key={dia.valor}
                  style={[
                    styles.dia,
                    seleccionado &&
                      styles.diaSeleccionado,
                  ]}
                  onPress={() =>
                    setDiaSemana(dia.valor)
                  }
                >
                  <Text
                    style={[
                      styles.diaTexto,
                      seleccionado &&
                        styles.diaTextoSeleccionado,
                    ]}
                  >
                    {dia.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.etiqueta}>
            Hora de inicio
          </Text>

          <TextInput
            style={styles.input}
            value={horaInicio}
            onChangeText={setHoraInicio}
            placeholder="08:00"
            placeholderTextColor="#98A2B3"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />

          <Text style={styles.etiqueta}>
            Hora de fin
          </Text>

          <TextInput
            style={styles.input}
            value={horaFin}
            onChangeText={setHoraFin}
            placeholder="17:00"
            placeholderTextColor="#98A2B3"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />

          <Pressable
            style={styles.botonGuardar}
            onPress={guardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name={
                  editandoId
                    ? 'save-outline'
                    : 'add-circle-outline'
                }
                size={21}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.botonGuardarTexto}>
              {guardando
                ? 'Guardando...'
                : editandoId
                ? 'Guardar cambios'
                : 'Agregar horario'}
            </Text>
          </Pressable>

          {editandoId ? (
            <Pressable
              style={styles.botonCancelar}
              onPress={limpiarFormulario}
            >
              <Text style={styles.botonCancelarTexto}>
                Cancelar edición
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.tituloListado}>
          Horarios configurados
        </Text>

        {disponibilidades.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons
              name="time-outline"
              size={40}
              color="#98A2B3"
            />

            <Text style={styles.vacioTitulo}>
              Sin horarios
            </Text>

            <Text style={styles.vacioTexto}>
              Agrega el primer horario de atención para este servicio.
            </Text>
          </View>
        ) : (
          disponibilidades.map((item) => (
            <View
              key={item.id}
              style={styles.horario}
            >
              <View style={styles.horarioInformacion}>
                <Text style={styles.horarioDia}>
                  {obtenerNombreDia(
                    item.diaSemana
                  )}
                </Text>

                <Text style={styles.horarioHoras}>
                  {item.horaInicio?.substring(
                    0,
                    5
                  )}{' '}
                  -{' '}
                  {item.horaFin?.substring(
                    0,
                    5
                  )}
                </Text>

                <Text style={styles.horarioEstado}>
                  {item.activo
                    ? 'Activo'
                    : 'Inactivo'}
                </Text>
              </View>

              <View style={styles.acciones}>
                <Pressable
                  style={styles.botonAccion}
                  onPress={() => editar(item)}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color="#2563EB"
                  />
                </Pressable>

                <Pressable
                  style={[
                    styles.botonAccion,
                    styles.botonEliminar,
                  ]}
                  onPress={() =>
                    eliminar(item)
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#B42318"
                  />
                </Pressable>
              </View>
            </View>
          ))
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
    fontSize: 14,
    color: '#667085',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  tituloFilaTexto: {
    flex: 1,
  },
  tituloTarjeta: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
  },
  descripcion: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  etiqueta: {
    marginBottom: 7,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },
  dias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dia: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  diaSeleccionado: {
    borderColor: '#0D9488',
    backgroundColor: '#E6F4F1',
  },
  diaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  diaTextoSeleccionado: {
    color: '#0D9488',
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#101828',
    backgroundColor: '#FFFFFF',
  },
  botonGuardar: {
    minHeight: 52,
    marginTop: 22,
    borderRadius: 13,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardarTexto: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonCancelar: {
    minHeight: 45,
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCancelarTexto: {
    color: '#667085',
    fontWeight: '600',
  },
  tituloListado: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  horario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horarioInformacion: {
    flex: 1,
  },
  horarioDia: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  horarioHoras: {
    marginTop: 4,
    fontSize: 14,
    color: '#475467',
  },
  horarioEstado: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#027A48',
  },
  acciones: {
    flexDirection: 'row',
    gap: 7,
  },
  botonAccion: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonEliminar: {
    backgroundColor: '#FEF3F2',
  },
  vacio: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  vacioTitulo: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  vacioTexto: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
    textAlign: 'center',
  },
  error: {
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
    padding: 13,
    flexDirection: 'row',
  },
  errorTexto: {
    flex: 1,
    marginLeft: 8,
    color: '#B42318',
    fontSize: 13,
  },
});