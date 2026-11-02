import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function AvatarImagen({ fotoUrl, nombre, size, style }) {
  const [fallo, setFallo] = useState(false);
  const iniciales = nombre?.trim().split(/\s+/).slice(0, 2)
    .map((parte) => parte[0]).join('').toUpperCase();

  return (
    <View accessibilityLabel={nombre ? `Foto de ${nombre}` : 'Foto de perfil'}
      style={[styles.avatar, { width: size, height: size, borderRadius: Math.round(size * 0.3) }, style]}>
      {fotoUrl && !fallo ? (
        <Image source={{ uri: fotoUrl }} style={styles.imagen}
          onError={() => setFallo(true)} />
      ) : iniciales ? (
        <Text style={[styles.iniciales, { fontSize: size * 0.34 }]}>{iniciales}</Text>
      ) : <Ionicons name="person" size={size * 0.5} color="#2563EB" />}
    </View>
  );
}

export default function UserAvatar({ fotoUrl, nombre, size = 48, style }) {
  const url = typeof fotoUrl === 'string' ? fotoUrl.trim() : '';
  // Reinicia el fallback solo cuando cambia la URL.
  return <AvatarImagen key={url} fotoUrl={url} nombre={nombre} size={size} style={style} />;
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imagen: { width: '100%', height: '100%' },
  iniciales: { color: '#2563EB', fontWeight: '700' },
});
