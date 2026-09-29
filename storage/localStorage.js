import AsyncStorage from '@react-native-async-storage/async-storage';

export const localStorage = {
  guardar: async (clave, valor) => {
    const valorAlmacenado =
      typeof valor === 'string' ? valor : JSON.stringify(valor);

    await AsyncStorage.setItem(clave, valorAlmacenado);
  },

  obtener: async (clave) => {
    return await AsyncStorage.getItem(clave);
  },

  obtenerJSON: async (clave) => {
    const valor = await AsyncStorage.getItem(clave);

    if (!valor) {
      return null;
    }

    try {
      return JSON.parse(valor);
    } catch {
      return null;
    }
  },

  eliminar: async (clave) => {
    await AsyncStorage.removeItem(clave);
  },

  limpiar: async () => {
    await AsyncStorage.clear();
  },
};