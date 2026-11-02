import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import UserAvatar from '../../components/UserAvatar';

const imagen = () => screen.getByLabelText('Foto de Ana Pérez')
  .queryAll(node => Boolean(node.props.source?.uri))[0];

test('muestra foto si existe', async () => {
  await render(<UserAvatar nombre="Ana Pérez" fotoUrl="https://example.test/ana.jpg" />);
  expect(imagen().props.source.uri).toBe('https://example.test/ana.jpg');
});
test('muestra iniciales sin foto', async () => {
  await render(<UserAvatar nombre="Ana Pérez" />);
  expect(screen.getByText('AP')).toBeOnTheScreen();
});
test('usa fallback ante error y reintenta cuando cambia la foto', async () => {
  const view = await render(<UserAvatar nombre="Ana Pérez" fotoUrl="https://example.test/a.jpg" />);
  await fireEvent(imagen(), 'error');
  expect(screen.getByText('AP')).toBeOnTheScreen();
  await view.rerender(<UserAvatar nombre="Ana Pérez" fotoUrl="https://example.test/b.jpg" />);
  expect(imagen().props.source.uri).toBe('https://example.test/b.jpg');
});
