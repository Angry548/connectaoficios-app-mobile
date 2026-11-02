import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAuth } from '../../context/AuthContext';
import { createAuthMock } from '../mocks/auth';
import AccountIdentityCard from '../../components/profile/AccountIdentityCard';
import ProfileHeader from '../../components/profile/ProfileHeader';

jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
beforeEach(() => useAuth.mockReturnValue(createAuthMock()));
test.each(['CLIENTE', 'TRABAJADOR'])('renderiza identidad del perfil %s', async rol => {
  useAuth.mockReturnValue(createAuthMock({ usuario: { nombre: 'Ana Pérez', correo: 'ana@example.test', rol } }));
  await render(<AccountIdentityCard />);
  expect(screen.getByText('Ana Pérez')).toBeOnTheScreen();
  expect(screen.getByText('ana@example.test')).toBeOnTheScreen();
  expect(screen.getByText(rol === 'CLIENTE' ? 'Cliente' : 'Trabajador')).toBeOnTheScreen();
});
test('editar perfil invoca la acción y respeta disabled', async () => {
  const onEdit = jest.fn();
  const view = await render(<ProfileHeader titulo="Mi perfil" onEdit={onEdit} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
  expect(onEdit).toHaveBeenCalledTimes(1);
  await view.rerender(<ProfileHeader titulo="Mi perfil" onEdit={onEdit} disabled />);
  await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
  expect(onEdit).toHaveBeenCalledTimes(1);
});
