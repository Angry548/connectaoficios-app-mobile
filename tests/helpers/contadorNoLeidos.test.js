import { badgeNoLeidos, crearContadorNoLeidos } from '../../services/contadorNoLeidos';
test.each([[0, undefined], [7, 7], [99, 99], [100, '99+']])('badge para %s mensajes', (total, esperado) => {
  expect(badgeNoLeidos(total)).toBe(esperado);
});
test('actualiza el contador y lo limpia al cerrar sesión', async () => {
  const consultar = jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(1);
  const publicar = jest.fn();
  const contador = crearContadorNoLeidos(consultar, publicar);
  contador.activar('cliente:1');
  await contador.refrescar();
  expect(publicar).toHaveBeenLastCalledWith(4);
  await contador.refrescar();
  expect(publicar).toHaveBeenLastCalledWith(1);
  contador.reset();
  expect(publicar).toHaveBeenLastCalledWith(0);
});
test('descarta una respuesta de una sesión que ya terminó', async () => {
  let resolver;
  const publicar = jest.fn();
  const contador = crearContadorNoLeidos(() => new Promise(resolve => { resolver = resolve; }), publicar);
  contador.activar('cliente:1');
  const pendiente = contador.refrescar();
  contador.reset();
  resolver(8);
  await pendiente;
  expect(publicar).toHaveBeenLastCalledWith(0);
  expect(publicar).not.toHaveBeenCalledWith(8);
});
