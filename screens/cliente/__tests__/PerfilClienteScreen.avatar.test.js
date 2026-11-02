import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAuth } from '../../../context/AuthContext';
import PerfilClienteScreen from '../PerfilClienteScreen';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) =>
      React.createElement(
        Text,
        { testID: `ionicon-${name}` },
        name
      ),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }) =>
      React.createElement(View, null, children),
  };
});

describe('PerfilClienteScreen avatar', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el icono fallback cuando el usuario no tiene fotografía', async () => {
    useAuth.mockReturnValue({
      usuario: {
        nombre: 'Ana Prueba',
        correo: 'ana.prueba@example.com',
        fotoUrl: null,
      },
      cerrarSesion: jest.fn(),
    });

    await render(<PerfilClienteScreen navigation={navigation} />);

    expect(
      screen.getByTestId('ionicon-person-outline')
    ).toBeTruthy();
  });
});
