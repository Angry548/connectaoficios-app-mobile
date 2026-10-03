import React, {
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import transaccionPagoService from '../../services/transaccionPagoService';

const obtenerMensajeError = (
  error,
  mensajePredeterminado
) =>
  error?.response?.data?.message ||
  error?.response?.data?.mensaje ||
  error?.response?.data?.error ||
  error?.message ||
  mensajePredeterminado;

const validarVencimiento = (valor) => {
  const coincidencia =
    /^(\d{2})\/(\d{2})$/.exec(valor);

  if (!coincidencia) {
    return false;
  }

  const mes = Number(coincidencia[1]);
  const anio = 2000 + Number(coincidencia[2]);

  if (mes < 1 || mes > 12) {
    return false;
  }

  const ahora = new Date();
  const ultimoDia =
    new Date(anio, mes, 0, 23, 59, 59);

  return ultimoDia >= ahora;
};

export default function PagoPromocionScreen({
  navigation,
  route,
}) {
  const {
    promocionId,
    servicioTitulo,
    planNombre,
    duracionDias,
    costoTotal,
  } = route.params ?? {};

  const [nombreTitular, setNombreTitular] =
    useState('');

  const [numeroTarjeta, setNumeroTarjeta] =
    useState('');

  const [vencimiento, setVencimiento] =
    useState('');

  const [cvv, setCvv] = useState('');

  const [procesando, setProcesando] =
    useState(false);

  const [alturaTeclado, setAlturaTeclado] =
    useState(0);

  useEffect(() => {
    const mostrar = Keyboard.addListener(
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow',
      (event) => {
        setAlturaTeclado(
          event?.endCoordinates?.height ?? 0
        );
      }
    );

    const ocultar = Keyboard.addListener(
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide',
      () => {
        setAlturaTeclado(0);
      }
    );

    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  const cambiarNumeroTarjeta = (valor) => {
    const numeros =
      valor.replace(/\D/g, '').slice(0, 16);

    const formateado =
      numeros
        .replace(/(.{4})/g, '$1 ')
        .trim();

    setNumeroTarjeta(formateado);
  };

  const cambiarVencimiento = (valor) => {
    const numeros =
      valor.replace(/\D/g, '').slice(0, 4);

    if (numeros.length <= 2) {
      setVencimiento(numeros);
      return;
    }

    setVencimiento(
      `${numeros.slice(0, 2)}/${numeros.slice(2)}`
    );
  };

  const validarFormulario = () => {
    if (nombreTitular.trim().length < 3) {
      Alert.alert(
        'Nombre requerido',
        'Ingresa el nombre del titular de la tarjeta.'
      );

      return false;
    }

    const numero =
      numeroTarjeta.replace(/\D/g, '');

    if (numero.length !== 16) {
      Alert.alert(
        'Tarjeta no válida',
        'El número de tarjeta debe contener exactamente 16 dígitos.'
      );

      return false;
    }

    if (!validarVencimiento(vencimiento)) {
      Alert.alert(
        'Vencimiento no válido',
        'Ingresa una fecha válida en formato MM/AA.'
      );

      return false;
    }

    if (!/^\d{3}$/.test(cvv)) {
      Alert.alert(
        'CVV no válido',
        'El CVV debe contener 3 dígitos.'
      );

      return false;
    }

    return true;
  };

  const procesarPago = async () => {
    if (!validarFormulario()) {
      return;
    }

    Alert.alert(
      'Confirmar pago simulado',
      `Se procesará un pago simulado de $${Number(
        costoTotal ?? 0
      ).toFixed(2)} USD. No se realizará ningún cobro real.`,
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            setProcesando(true);

            try {
              const transaccion =
                await transaccionPagoService.crear(
                  promocionId,
                  costoTotal,
                  'USD'
                );

              await transaccionPagoService
                .procesarPagoSimulado(
                  transaccion.id
                );

              Keyboard.dismiss();

              Alert.alert(
                'Promoción activada',
                'El pago simulado fue aprobado y tu servicio ya se encuentra destacado.',
                [
                  {
                    text: 'Ver promociones',
                    onPress: () => {
                      navigation.popToTop();
                      navigation.navigate(
                        'Promociones'
                      );
                    },
                  },
                ],
                {
                  cancelable: false,
                }
              );
            } catch (error) {
              Alert.alert(
                'No se pudo procesar el pago',
                obtenerMensajeError(
                  error,
                  'Ocurrió un error al procesar el pago simulado.'
                )
              );
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Pressable
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          disabled={procesando}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#101828"
          />
        </Pressable>

        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>
            Pago simulado
          </Text>

          <Text style={styles.subtitulo}>
            Activar promoción
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contenido,
          {
            paddingBottom:
              alturaTeclado > 0
                ? alturaTeclado + 24
                : 32,
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aviso}>
          <View style={styles.avisoIcono}>
            <Ionicons
              name="information-circle-outline"
              size={23}
              color="#2563EB"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.avisoTitulo}>
              Pago de demostración
            </Text>

            <Text style={styles.avisoTexto}>
              Este formulario simula el proceso de pago.
              No ingreses información bancaria real y no
              se realizará ningún cobro.
            </Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>
            Resumen de la promoción
          </Text>

          <View style={styles.filaResumen}>
            <Text style={styles.resumenEtiqueta}>
              Servicio
            </Text>

            <Text style={styles.resumenValor}>
              {servicioTitulo || 'Servicio'}
            </Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaResumen}>
            <Text style={styles.resumenEtiqueta}>
              Plan
            </Text>

            <Text style={styles.resumenValor}>
              {planNombre || 'Plan'}
            </Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaResumen}>
            <Text style={styles.resumenEtiqueta}>
              Duración
            </Text>

            <Text style={styles.resumenValor}>
              {Number(duracionDias ?? 0)} días
            </Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaResumen}>
            <Text style={styles.resumenEtiqueta}>
              Total
            </Text>

            <Text style={styles.total}>
              ${Number(costoTotal ?? 0).toFixed(2)} USD
            </Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.tituloPagoFila}>
            <View style={styles.iconoTarjeta}>
              <Ionicons
                name="card-outline"
                size={23}
                color="#2563EB"
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.tarjetaTitulo}>
                Datos de pago
              </Text>

              <Text style={styles.tarjetaSubtitulo}>
                Utiliza datos ficticios para la demostración
              </Text>
            </View>
          </View>

          <Text style={styles.etiqueta}>
            Nombre del titular
          </Text>

          <View style={styles.inputContenedor}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#667085"
            />

            <TextInput
              style={styles.input}
              value={nombreTitular}
              onChangeText={setNombreTitular}
              placeholder="Nombre completo"
              placeholderTextColor="#98A2B3"
              autoCapitalize="words"
              editable={!procesando}
            />
          </View>

          <Text style={styles.etiqueta}>
            Número de tarjeta
          </Text>

          <View style={styles.inputContenedor}>
            <Ionicons
              name="card-outline"
              size={20}
              color="#667085"
            />

            <TextInput
              style={styles.input}
              value={numeroTarjeta}
              onChangeText={cambiarNumeroTarjeta}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#98A2B3"
              keyboardType="number-pad"
              maxLength={19}
              editable={!procesando}
            />
          </View>

          <View style={styles.camposFila}>
            <View style={styles.campoMitad}>
              <Text style={styles.etiqueta}>
                Vencimiento
              </Text>

              <View style={styles.inputContenedor}>
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color="#667085"
                />

                <TextInput
                  style={styles.input}
                  value={vencimiento}
                  onChangeText={cambiarVencimiento}
                  placeholder="MM/AA"
                  placeholderTextColor="#98A2B3"
                  keyboardType="number-pad"
                  maxLength={5}
                  editable={!procesando}
                />
              </View>
            </View>

            <View style={styles.campoMitad}>
              <Text style={styles.etiqueta}>
                CVV
              </Text>

              <View style={styles.inputContenedor}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#667085"
                />

                <TextInput
                  style={styles.input}
                  value={cvv}
                  onChangeText={(valor) =>
                    setCvv(
                      valor
                        .replace(/\D/g, '')
                        .slice(0, 3)
                    )
                  }
                  placeholder="000"
                  placeholderTextColor="#98A2B3"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={3}
                  editable={!procesando}
                />
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={[
            styles.botonPagar,
            procesando &&
              styles.botonDeshabilitado,
          ]}
          onPress={procesarPago}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.botonPagarTexto}>
            {procesando
              ? 'Procesando...'
              : `Pagar $${Number(
                  costoTotal ?? 0
                ).toFixed(2)} USD`}
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
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  encabezadoTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  subtitulo: {
    marginTop: 2,
    fontSize: 13,
    color: '#667085',
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 18,
    gap: 16,
  },
  flex: {
    flex: 1,
  },
  aviso: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 15,
    gap: 12,
  },
  avisoIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  avisoTexto: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#475467',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 17,
  },
  tarjetaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  tarjetaSubtitulo: {
    marginTop: 3,
    fontSize: 12,
    color: '#667085',
  },
  filaResumen: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  resumenEtiqueta: {
    fontSize: 13,
    color: '#667085',
  },
  resumenValor: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#344054',
  },
  total: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginTop: 14,
  },
  tituloPagoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  iconoTarjeta: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiqueta: {
    marginBottom: 7,
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#344054',
  },
  inputContenedor: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 9,
  },
  input: {
    flex: 1,
    color: '#101828',
    fontSize: 14,
    paddingVertical: 12,
  },
  camposFila: {
    flexDirection: 'row',
    gap: 12,
  },
  campoMitad: {
    flex: 1,
  },
  botonPagar: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
  },
  botonPagarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});