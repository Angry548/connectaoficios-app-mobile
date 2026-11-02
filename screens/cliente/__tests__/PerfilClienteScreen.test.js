import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAuth } from '../../../context/AuthContext';
import PerfilClienteScreen from '../PerfilClienteScreen';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }) =>
      React.createElement(View, null, children),
  };
});

describe('PerfilClienteScreen', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente los datos del Cliente', async () => {
    useAuth.mockReturnValue({
      usuario: {
        nombre: 'Ana Prueba',
        correo: 'ana.prueba@example.com',
        rol: 'CLIENTE',
      },
      cerrarSesion: jest.fn(),
    });

    await render(<PerfilClienteScreen navigation={navigation} />);

    expect(screen.getByText('Ana Prueba')).toBeTruthy();
    expect(screen.getByText('ana.prueba@example.com')).toBeTruthy();
    expect(screen.getByText('Cliente')).toBeTruthy();
    expect(screen.getByText('Mi perfil')).toBeTruthy();
  });

  it('muestra la información de respaldo cuando no hay usuario', async () => {
    useAuth.mockReturnValue({
      usuario: null,
      cerrarSesion: jest.fn(),
    });

    await render(<PerfilClienteScreen navigation={navigation} />);

    expect(screen.getAllByText('Cliente')).toHaveLength(2);
    expect(screen.getByText('Cuenta de ConnectaOficios')).toBeTruthy();
  });
});