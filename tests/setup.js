jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../services/apiDotNet', () => require('./mocks/apiClient').createApiClientMock());
jest.mock('../services/apiJava', () => require('./mocks/apiClient').createApiClientMock());
// Segunda barrera: incluso una importación directa de axios no puede abrir red.
jest.mock('axios', () => {
  const client = require('./mocks/apiClient').createApiClientMock();
  return { ...client, create: jest.fn(() => require('./mocks/apiClient').createApiClientMock()),
    isAxiosError: error => Boolean(error?.isAxiosError) };
});
beforeEach(() => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Red deshabilitada en Component Testing')));
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Ionicons: ({ name }) => React.createElement(Text, { accessibilityElementsHidden: true }, name) };
});
