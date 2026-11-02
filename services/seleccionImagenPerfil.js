import * as ImagePicker from 'expo-image-picker';

export const seleccionarImagenPerfil = async () => {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    const error = new Error('Necesitas permitir el acceso a tus fotos para seleccionar una fotografía de perfil.');
    error.userMessage = error.message;
    throw error;
  }
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85,
  });
  if (resultado.canceled) return null;
  const asset = resultado.assets?.[0];
  if (!asset?.uri) {
    const error = new Error('No fue posible obtener la fotografía seleccionada.');
    error.userMessage = error.message;
    throw error;
  }
  return asset;
};
