export const createAuthMock = (overrides = {}) => ({
  usuario: { id: 1, nombre: 'Ana Pérez', correo: 'ana@example.test', rol: 'CLIENTE' },
  estaAutenticado: true,
  verificandoSesion: false,
  iniciarSesion: jest.fn().mockResolvedValue(true),
  cerrarSesion: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});
