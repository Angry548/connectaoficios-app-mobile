// Angel Mate: CON-477 (datos profesionales) y CON-478.
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import MiPerfilProfesionalScreen from '../../screens/trabajador/MiPerfilProfesionalScreen';
import EditarPerfilTrabajadorScreen from '../../screens/trabajador/EditarPerfilTrabajadorScreen';
import { perfilTrabajadorService } from '../../services/perfilTrabajadorService';
import { createNavigationMock } from '../mocks/navigation';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: { id: 1, nombre: 'Angel Mate', correo: 'angel@example.test', rol: 'TRABAJADOR' } }),
}));
jest.mock('../../services/perfilTrabajadorService', () => ({
  perfilTrabajadorService: { obtenerMiPerfil: jest.fn(), modificarMiPerfil: jest.fn() },
}));

const perfil = { id: 10, oficioPrincipal: 'Electricista', descripcionProfesional: 'Instalaciones residenciales',
  experienciaLaboral: 'Cinco años de experiencia', zonaPrincipalId: 1,
  localidad: 'Centro', municipio: 'Santa Tecla', departamento: 'La Libertad', porcentajeCompletitud: 100 };

test('CON-477: muestra oficio, descripción, experiencia y zona del trabajador', async () => {
  perfilTrabajadorService.obtenerMiPerfil.mockResolvedValue(perfil);
  await render(<MiPerfilProfesionalScreen navigation={createNavigationMock()} />);
  expect(await screen.findByText('Electricista')).toBeOnTheScreen();
  expect(screen.getByText(perfil.descripcionProfesional)).toBeOnTheScreen();
  expect(screen.getByText(perfil.experienciaLaboral)).toBeOnTheScreen();
  expect(screen.getByText('Centro, Santa Tecla, La Libertad')).toBeOnTheScreen();
});

test('CON-478: tras guardar la edición, el perfil muestra la información persistida', async () => {
  const actualizado = { ...perfil, oficioPrincipal: 'Electricista certificado' };
  perfilTrabajadorService.obtenerMiPerfil.mockResolvedValue(perfil);
  perfilTrabajadorService.modificarMiPerfil.mockImplementation(async () => {
    perfilTrabajadorService.obtenerMiPerfil.mockResolvedValue(actualizado);
    return actualizado;
  });
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  try {
    const navigation = createNavigationMock();
    const vista = await render(<MiPerfilProfesionalScreen navigation={navigation} />);
    await screen.findByText('Electricista');
    await fireEvent.press(screen.getByRole('button', { name: 'Editar perfil' }));
    expect(navigation.navigate).toHaveBeenCalledWith('EditarPerfilTrabajador', { perfil, modoCreacion: false });
    await vista.unmount();
    const editor = await render(<EditarPerfilTrabajadorScreen navigation={navigation} route={{ params: { perfil } }} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Electricista'), actualizado.oficioPrincipal);
    await fireEvent.press(screen.getByText('Guardar cambios'));
    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Perfil actualizado', expect.any(String), expect.any(Array)));
    await act(async () => alerta.mock.calls.find(call => call[0] === 'Perfil actualizado')[2][0].onPress());
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(perfilTrabajadorService.modificarMiPerfil).toHaveBeenCalledWith(expect.objectContaining({ oficioPrincipal: actualizado.oficioPrincipal }));
    await editor.unmount();
    await render(<MiPerfilProfesionalScreen navigation={navigation} />);
    expect(await screen.findByText(actualizado.oficioPrincipal)).toBeOnTheScreen();
    expect(screen.queryByText('Electricista')).toBeNull();
  } finally { alerta.mockRestore(); }
});
