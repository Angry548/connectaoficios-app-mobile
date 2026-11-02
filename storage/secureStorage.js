import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';
const IDENTITY_KEY = 'confirmedAccountIdentity';

export const secureStorage = {
  guardarIdentidadConfirmada: async (identidad) => {
    await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identidad));
  },

  obtenerIdentidadConfirmada: async () => {
    const valor = await SecureStore.getItemAsync(IDENTITY_KEY);
    try { return valor ? JSON.parse(valor) : null; } catch { return null; }
  },

  guardarToken: async (token) => {
    if (!token) {
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.deleteItemAsync(IDENTITY_KEY);
  },

  obtenerToken: async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  eliminarToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(IDENTITY_KEY);
  },

  existeToken: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return Boolean(token);
  },
};
