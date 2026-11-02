import { obtenerFotoInterlocutor } from '../../services/avatarConversacion';
const conversacion = { clienteId: 1, trabajadorId: 2, clienteFotoUrl: 'cliente.jpg', trabajadorFotoUrl: 'trabajador.jpg' };
test.each([[1, 'trabajador.jpg'], [2, 'cliente.jpg'], [3, null], [null, null]])('elige avatar por identidad %s', (id, foto) => {
  expect(obtenerFotoInterlocutor(conversacion, id)).toBe(foto);
});
