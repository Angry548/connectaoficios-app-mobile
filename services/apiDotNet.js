import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { secureStorage } from '../storage/secureStorage';

const apiDotNet = axios.create({
  baseURL: API_CONFIG.DOTNET_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiDotNet.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.obtenerToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiDotNet.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await secureStorage.eliminarToken();
    }

    return Promise.reject(error);
  }
);

export default apiDotNet;