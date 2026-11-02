import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../UserAvatar';
import { editorStyles as styles } from './profileStyles';

export default function ProfilePhotoCard({ fotoUrl, nombre, nueva, profesional = false,
  disabled = false, seleccionando = false, onSelect, onRemove }) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.seccionEncabezado}>
        <View style={styles.iconoSeccion}>
          <Ionicons name="image-outline" size={22} color="#2563EB" />
        </View>
        <View style={styles.seccionTexto}>
          <Text style={styles.seccionTitulo}>{profesional ? 'Fotografía profesional' : 'Fotografía de perfil'}</Text>
          <Text style={styles.seccionSubtitulo}>Selecciona una fotografía desde tu dispositivo</Text>
        </View>
      </View>
      <View style={styles.vistaPreviaContenedor}>
        <UserAvatar fotoUrl={fotoUrl} nombre={nombre} size={112} style={styles.vistaPrevia} />
        {nueva ? (
          <View style={styles.insigniaNueva}>
            <Ionicons name="checkmark-circle" size={15} color="#027A48" />
            <Text style={styles.insigniaNuevaTexto}>Nueva fotografía</Text>
          </View>
        ) : !fotoUrl ? <Text style={styles.vistaPreviaVaciaTexto}>Sin fotografía</Text> : null}
      </View>
      <Pressable accessibilityRole="button" style={[styles.botonImagen, disabled && styles.botonDeshabilitado]}
        onPress={onSelect} disabled={disabled}>
        {seleccionando ? <ActivityIndicator color="#2563EB" size="small" /> : (
          <Ionicons name="images-outline" size={20} color="#2563EB" />
        )}
        <Text style={styles.botonImagenTexto}>
          {seleccionando ? 'Abriendo galería...' : fotoUrl ? 'Cambiar fotografía' : 'Seleccionar de galería'}
        </Text>
      </Pressable>
      {fotoUrl && onRemove ? (
        <Pressable accessibilityRole="button" style={styles.botonQuitarImagen} onPress={onRemove} disabled={disabled}>
          <Ionicons name="trash-outline" size={18} color="#B42318" />
          <Text style={styles.botonQuitarImagenTexto}>Quitar fotografía</Text>
        </Pressable>
      ) : null}
      <Text style={styles.ayudaImagen}>La fotografía se subirá cuando guardes tu perfil.</Text>
    </View>
  );
}
