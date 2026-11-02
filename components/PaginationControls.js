import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { textoPaginacion } from '../services/paginacion';

export default function PaginationControls({ loading = false, hideButtons = false, notice, ...props }) {
  const anterior = loading || props.currentPage <= 0;
  const siguiente = loading || props.currentPage + 1 >= props.totalPages;
  return <View style={styles.contenedor}>
    <Text accessibilityLiveRegion="polite" style={styles.resumen}>{textoPaginacion(props)}</Text>
    {notice ? <Text style={styles.resumen}>{notice}</Text> : null}
    {!hideButtons && props.totalPages > 1 ? <View style={styles.controles}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: anterior }} disabled={anterior}
        onPress={props.onPrevious} style={[styles.boton, anterior && styles.disabled]}>
        <Text style={styles.texto}>Anterior</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: siguiente }} disabled={siguiente}
        onPress={props.onNext} style={[styles.boton, siguiente && styles.disabled]}>
        <Text style={styles.texto}>Siguiente</Text>
      </Pressable>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  contenedor: { marginVertical: 14, paddingHorizontal: 4 },
  resumen: { color: '#667085', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  controles: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 },
  boton: { minHeight: 38, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  texto: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
