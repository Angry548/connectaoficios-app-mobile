// Angel Mate: CON-481 y CON-482. Los helpers existentes no validan estas interfaces.
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import ConversacionesScreen from '../../screens/shared/ConversacionesScreen';
import ChatScreen from '../../screens/shared/ChatScreen';
import { conversacionService } from '../../services/conversacionService';
import { mensajeService } from '../../services/mensajeService';
import { userService } from '../../services/userService';
import { createNavigationMock } from '../mocks/navigation';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../context/UnreadMessagesContext', () => {
  const refrescarNoLeidos = jest.fn().mockResolvedValue(undefined);
  return { useUnreadMessages: () => ({ refrescarNoLeidos }) };
});
jest.mock('../../storage/secureStorage', () => ({ secureStorage: { obtenerToken: jest.fn().mockResolvedValue('sesion-simulada') } }));
jest.mock('jwt-decode', () => ({ jwtDecode: () => ({ sub: '1' }) }));
jest.mock('../../services/conversacionService', () => ({ conversacionService: {
  obtenerConversacionesPaginadas: jest.fn(), obtenerConversacionPorId: jest.fn(),
} }));
jest.mock('../../services/mensajeService', () => ({ mensajeService: {
  contarNoLeidos: jest.fn(), obtenerMensajesPaginados: jest.fn(), marcarMensajesRecibidosComoLeidos: jest.fn(),
} }));
jest.mock('../../services/userService', () => ({ userService: { obtenerUsuariosPorIds: jest.fn(), obtenerUsuarioPorId: jest.fn() } }));

test.each([[3, '3'], [100, '99+']])('CON-481: badge individual para %s no leídos y ausencia en conversación leída', async (cantidad, etiqueta) => {
  conversacionService.obtenerConversacionesPaginadas.mockResolvedValue({ contenido: [
    { id: 11, clienteId: 1, trabajadorId: 2, solicitudId: 51 },
    { id: 12, clienteId: 1, trabajadorId: 3, solicitudId: 52 },
  ], totalElementos: 2, totalPaginas: 1 });
  userService.obtenerUsuariosPorIds.mockResolvedValue({ 2: { nombre: 'Trabajador pendiente' }, 3: { nombre: 'Trabajador al día' } });
  mensajeService.contarNoLeidos.mockImplementation(async id => id === 11 ? cantidad : 0);
  await render(<ConversacionesScreen navigation={createNavigationMock()} />);
  const pendiente = await screen.findByText('Trabajador pendiente');
  const leida = screen.getByText('Trabajador al día');
  // La tarjeta es el ancestro que contiene nombre y solicitud, no el contador global.
  const tarjeta = (nodo, solicitud) => {
    let actual = nodo.parent;
    while (actual && !within(actual).queryByText(`Solicitud #${solicitud}`)) actual = actual.parent;
    return actual;
  };
  expect(within(tarjeta(pendiente, 51)).getByText(etiqueta)).toBeOnTheScreen();
  expect(within(tarjeta(leida, 52)).queryByText('Trabajador pendiente')).toBeNull();
  expect(within(tarjeta(leida, 52)).queryByText(etiqueta)).toBeNull();
  expect(within(tarjeta(leida, 52)).queryByText('0')).toBeNull();
});

test.each([[true, 'checkmark-done', 'checkmark'], [false, 'checkmark', 'checkmark-done']])(
  'CON-482: mensaje propio leido=%s representa el indicador correspondiente', async (leido, icono, ausente) => {
    conversacionService.obtenerConversacionPorId.mockResolvedValue({ id: 11, clienteId: 1, trabajadorId: 2, puedeEnviarMensajes: true });
    userService.obtenerUsuarioPorId.mockResolvedValue({ nombre: 'Trabajador' });
    mensajeService.obtenerMensajesPaginados.mockResolvedValue({ contenido: [
      { id: 21, remitenteId: 1, contenido: 'Confirmación de visita', leido, fechaEnvio: '2026-10-01T12:00:00Z' },
    ], totalElementos: 1 });
    await render(<ChatScreen navigation={createNavigationMock()} route={{ params: { conversacionId: 11 } }} />);
    expect(await screen.findByText('Confirmación de visita')).toBeOnTheScreen();
    expect(screen.getByText(icono, { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByText(ausente, { includeHiddenElements: true })).toBeNull();
  }
);
