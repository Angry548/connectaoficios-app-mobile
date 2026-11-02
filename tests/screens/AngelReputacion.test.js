// Angel Mate: CON-483 y CON-484.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ReputacionScreen from '../../screens/trabajador/ReputacionScreen';
import { perfilTrabajadorService } from '../../services/perfilTrabajadorService';
import { reputacionService } from '../../services/reputacionService';
import { resenaService } from '../../services/resenaService';
import { createNavigationMock } from '../mocks/navigation';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../services/perfilTrabajadorService', () => ({ perfilTrabajadorService: { obtenerMiPerfil: jest.fn() } }));
jest.mock('../../services/reputacionService', () => ({ reputacionService: { obtenerPorPerfilTrabajador: jest.fn(), obtenerRanking: jest.fn() } }));
jest.mock('../../services/resenaService', () => ({ resenaService: { buscarConFiltros: jest.fn() } }));

beforeEach(() => {
  perfilTrabajadorService.obtenerMiPerfil.mockResolvedValue({ id: 10, oficioPrincipal: 'Electricista' });
  reputacionService.obtenerRanking.mockResolvedValue([]);
  resenaService.buscarConFiltros.mockResolvedValue({ contenido: [], totalElementos: 0, totalPaginas: 0 });
});

test('CON-483: trabajador sin reseñas presenta el estado vacío sin calificaciones inventadas', async () => {
  reputacionService.obtenerPorPerfilTrabajador.mockResolvedValue({ totalResenas: 0, promedioCalificacion: 0, insignia: 'NUEVO_TRABAJADOR' });
  await render(<ReputacionScreen navigation={createNavigationMock()} />);
  expect(await screen.findByText('Aún no tienes reseñas')).toBeOnTheScreen();
  expect(screen.getByText('Basada en 0 reseñas')).toBeOnTheScreen();
  screen.getAllByText('0.0').forEach(valor => expect(valor).toBeOnTheScreen());
  expect(screen.queryByText('5.0')).toBeNull();
  expect(screen.queryByText(/No se pudo cargar/)).toBeNull();
});

test.each([
  ['NUEVO_TRABAJADOR', 'Nuevo trabajador', 'sparkles-outline'],
  ['TRABAJADOR_CONFIABLE', 'Trabajador confiable', 'shield-checkmark-outline'],
  ['MEJOR_VALORADO', 'Mejor valorado', 'ribbon-outline'],
  ['TOP_PLATAFORMA', 'Top plataforma', 'trophy-outline'],
])('CON-484: insignia %s muestra su nombre e icono', async (insignia, nombre, icono) => {
  reputacionService.obtenerPorPerfilTrabajador.mockResolvedValue({ insignia, totalResenas: 12, promedioCalificacion: 4.5 });
  await render(<ReputacionScreen navigation={createNavigationMock()} />);
  expect(await screen.findByText(nombre)).toBeOnTheScreen();
  expect(screen.getAllByText(icono, { includeHiddenElements: true }).length).toBeGreaterThan(0);
  for (const otra of ['Nuevo trabajador', 'Trabajador confiable', 'Mejor valorado', 'Top plataforma'].filter(valor => valor !== nombre)) {
    expect(screen.queryByText(otra)).toBeNull();
  }
});
