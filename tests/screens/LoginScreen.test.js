import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LoginScreen from '../../screens/auth/LoginScreen';
import { createNavigationMock } from '../mocks/navigation';
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => require('../mocks/auth').createAuthMock(),
}));
test('muestra correo, contraseña y acceso al login', async () => {
  await render(<LoginScreen navigation={createNavigationMock()} />);
  expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeOnTheScreen();
  expect(screen.getByPlaceholderText('Ingresa tu contraseña')).toBeOnTheScreen();
  expect(screen.getByText('Iniciar sesión')).toBeOnTheScreen();
});
