import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { editorStyles, perfilStyles } from './profileStyles';

export default function ProfileHeader({ titulo, subtitulo, onBack, onEdit, disabled = false, editor = false }) {
  const styles = editor ? editorStyles : perfilStyles;
  const contenido = (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver"
        style={styles.botonVolver} onPress={onBack} disabled={disabled}>
        <Ionicons name="arrow-back" size={23} color="#101828" />
      </Pressable>
      <View style={styles.encabezadoTexto}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
    </>
  );

  return (
    <View style={styles.encabezado}>
      {editor ? contenido : <View style={styles.encabezadoPrincipal}>{contenido}</View>}
      {editor ? <View style={styles.espacio} /> : onEdit ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Editar perfil"
          style={styles.botonEditarSuperior} onPress={onEdit} disabled={disabled}>
          <Ionicons name="create-outline" size={22} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}
