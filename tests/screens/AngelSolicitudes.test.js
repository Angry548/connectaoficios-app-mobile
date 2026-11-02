// Angel Mate: CON-479 y CON-480.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SolicitudesRecibidasScreen from '../../screens/trabajador/SolicitudesRecibidasScreen';
import { listadosPaginados } from '../../services/listadosPaginados';
import { createNavigationMock } from '../mocks/navigation';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../services/listadosPaginados', () => ({ listadosPaginados: { solicitudesTrabajador: jest.fn() } }));

test('CON-479: muestra el estado vacío sin presentar un error', async () => {
  listadosPaginados.solicitudesTrabajador.mockResolvedValue({ contenido: [], totalElementos: 0, totalPaginas: 0 });
  await render(<SolicitudesRecibidasScreen navigation={createNavigationMock()} />);
  expect(await screen.findByText('No hay solicitudes')).toBeOnTheScreen();
  expect(screen.getByText('No tienes solicitudes en este estado.')).toBeOnTheScreen();
  expect(screen.queryByText('No pudimos cargar las solicitudes')).toBeNull();
  expect(screen.queryByText('Cargando solicitudes...')).toBeNull();
});

test('CON-480: muestra el error de carga y permite recuperarse con Reintentar', async () => {
  listadosPaginados.solicitudesTrabajador.mockRejectedValueOnce(new Error('Servicio no disponible'))
    .mockResolvedValue({ contenido: [], totalElementos: 0, totalPaginas: 0 });
  await render(<SolicitudesRecibidasScreen navigation={createNavigationMock()} />);
  expect(await screen.findByText('No pudimos cargar las solicitudes')).toBeOnTheScreen();
  expect(screen.getByText('Servicio no disponible')).toBeOnTheScreen();
  expect(screen.queryByText('No hay solicitudes')).toBeNull();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(await screen.findByText('No hay solicitudes')).toBeOnTheScreen();
  expect(screen.queryByText('Servicio no disponible')).toBeNull();
});
