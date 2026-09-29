import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';

export const secureStorage = {
  guardarToken: async (token) => {
    if (!token) {
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  obtenerToken: async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  eliminarToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  existeToken: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return Boolean(token);
  },
};