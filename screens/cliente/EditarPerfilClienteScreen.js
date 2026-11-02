import { useIdentityDraft } from '../../hooks/useIdentityDraft';
import { guardarCambiosPerfil, guardarPerfilPropio, identidadCambio, perfilCambio, validarIdentidad } from '../../services/guardarCambiosPerfil';
import { mensajeError } from '../../services/mensajesError';
import AccountIdentityCard from '../../components/profile/AccountIdentityCard';
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfilePhotoCard from '../../components/profile/ProfilePhotoCard';
import { editorStyles as styles, perfilStyles } from '../../components/profile/profileStyles';
import { perfilClienteService, mensajeErrorPerfilCliente } from '../../services/perfilClienteService';
import { imagenService } from '../../services/imagenService';
import { seleccionarImagenPerfil } from '../../services/seleccionImagenPerfil';

export default function EditarPerfilClienteScreen({ route, navigation }) {
  const { usuario, actualizarIdentidad, refrescarIdentidad } = useAuth();
  const { identidad, setIdentidad, identidadBase } = useIdentityDraft(usuario);
  const perfilBase = useRef(route?.params?.perfil ?? null);
  const [perfil, setPerfil] = useState(route?.params?.perfil ?? null);
  const [fotoUrl, setFotoUrl] = useState(route?.params?.perfil?.fotoUrl ?? '');
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [seleccionando, setSeleccionando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const bloqueo = useRef(false);
  const ocupado = cargando || guardando || seleccionando;

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError('');
    perfilClienteService.obtenerMiPerfil({ signal: controller.signal })
      .then((actual) => {
        if (controller.signal.aborted) return;
        perfilBase.current = actual;
        setPerfil(actual);
        setFotoUrl(actual?.fotoUrl ?? '');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err?.response?.status === 404) {
          perfilBase.current = null;
          setPerfil(null);
          setFotoUrl('');
        } else {
          setError(mensajeErrorPerfilCliente(err, 'No se pudo cargar el perfil. Intenta nuevamente.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [usuario?.id, intento]);

  const seleccionar = async () => {
    if (bloqueo.current || ocupado || error) return;
    bloqueo.current = true;
    setSeleccionando(true);
    try {
      const asset = await seleccionarImagenPerfil();
      if (asset) setImagen(asset);
    } catch (err) {
      Alert.alert('No se pudo seleccionar la fotografía', err.userMessage || 'No se pudo abrir la galería. Intenta nuevamente.');
    } finally {
      bloqueo.current = false;
      setSeleccionando(false);
    }
  };

  const guardar = async () => {
    if (bloqueo.current || ocupado || error) return;
    const cambioCuenta = identidadCambio(identidad, identidadBase.current);
    const cambioPerfil = Boolean(imagen) || perfilCambio({ fotoUrl: fotoUrl.trim() }, perfilBase.current);
    if (!cambioCuenta && !cambioPerfil) {
      Alert.alert('Sin cambios', 'No hay cambios por guardar.');
      return;
    }
    const validacion = cambioCuenta && validarIdentidad(identidad);
    if (validacion) { Alert.alert('Revisa tus datos', validacion); return; }
    bloqueo.current = true;
    setGuardando(true);
    try {
      const resultado = await guardarCambiosPerfil({
        identidad: cambioCuenta ? async () => {
          const guardada = await actualizarIdentidad(identidad);
          identidadBase.current = guardada;
          return guardada;
        } : null,
        perfil: cambioPerfil ? async () => {
          let urlFinal = fotoUrl.trim();
          if (imagen) {
            setSubiendo(true);
            try {
              const subida = await imagenService.subirFotoPerfil(imagen);
              urlFinal = subida.url;
              if (typeof urlFinal !== 'string' || !urlFinal.trim() || urlFinal.length > 500) throw new Error('La fotografía seleccionada no es válida.');
              setFotoUrl(urlFinal);
              setImagen(null);
            } finally { setSubiendo(false); }
          }
          const guardado = await guardarPerfilPropio(perfilClienteService, { fotoUrl: urlFinal }, perfilBase.current)
            || await perfilClienteService.obtenerMiPerfil();
          perfilBase.current = guardado;
          setPerfil(guardado);
          return guardado;
        } : null,
      });
      if (resultado.completo) {
        Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
          { text: 'Aceptar', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Actualiza las bases confirmadas sin descartar los campos que quedan pendientes.
        await Promise.allSettled([
          cambioCuenta ? refrescarIdentidad().then(actual => { identidadBase.current = actual; }) : Promise.resolve(),
          cambioPerfil ? perfilClienteService.obtenerMiPerfil().then(actual => {
            perfilBase.current = actual; setPerfil(actual);
          }).catch(err => { if (err?.response?.status === 404) { perfilBase.current = null; setPerfil(null); } }) : Promise.resolve(),
        ]);
        const parcial = resultado.parcial || (cambioCuenta && !identidadCambio(identidad, identidadBase.current));
        Alert.alert(parcial ? 'Cambios guardados parcialmente' : 'No se pudo guardar', parcial
          ? 'Parte de la información se actualizó, pero algunos cambios no pudieron guardarse. Intenta nuevamente.'
          : mensajeError(Object.values(resultado.errores)[0], 'No se pudieron guardar los cambios. Intenta nuevamente.'));
      }
    } catch (err) {
      Alert.alert('No se pudo guardar', mensajeError(err));
    } finally {
      bloqueo.current = false;
      setGuardando(false);
      setSubiendo(false);
    }
  };

  const quitarImagen = () => {
    if (ocupado || bloqueo.current) return;
    setImagen(null);
    setFotoUrl('');
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <ProfileHeader editor titulo={perfil ? 'Editar perfil' : 'Crear perfil'}
        subtitulo="Actualiza tu información de cliente" onBack={() => navigation.goBack()} disabled={ocupado} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {cargando ? (
          <View style={perfilStyles.centro}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={perfilStyles.textoCarga}>Cargando perfil...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.contenido}
            keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={perfilStyles.errorContenedor}>
                <Ionicons name="alert-circle-outline" size={42} color="#B42318" />
                <Text style={perfilStyles.errorTitulo}>No se pudo cargar tu perfil</Text>
                <Text accessibilityRole="alert" style={perfilStyles.errorTexto}>{error}</Text>
                <Pressable style={perfilStyles.botonReintentar} onPress={() => setIntento((valor) => valor + 1)}>
                  <Text style={perfilStyles.botonReintentarTexto}>Intentar nuevamente</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <AccountIdentityCard editable disabled={ocupado} value={identidad} onChange={setIdentidad} />
                <ProfilePhotoCard fotoUrl={imagen?.uri || fotoUrl} nombre={usuario?.nombre}
                  nueva={Boolean(imagen)} disabled={ocupado} seleccionando={seleccionando}
                  onSelect={seleccionar} onRemove={quitarImagen} />
                {!perfil ? <Text style={[styles.ayudaImagen, { marginBottom: 14 }]}>Tu perfil se creará al guardar.</Text> : null}
                <Pressable accessibilityRole="button" style={[styles.botonGuardar, ocupado && styles.botonDeshabilitado]}
                  onPress={guardar} disabled={ocupado}>
                  {guardando ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                    <Ionicons name={perfil ? 'save-outline' : 'add-circle-outline'} size={21} color="#FFFFFF" />
                  )}
                  <Text style={styles.botonGuardarTexto}>
                    {subiendo ? 'Subiendo fotografía...' : guardando ? 'Guardando...' : 'Guardar cambios'}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
