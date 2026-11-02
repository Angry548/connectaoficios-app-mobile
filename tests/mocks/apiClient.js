// Los métodos sin respuesta configurada fallan para detectar llamadas inesperadas.
export function createApiClientMock() {
  const unexpected = () => Promise.reject(new Error('Configura la respuesta de la API en el test'));
  return Object.fromEntries(['get', 'post', 'put', 'patch', 'delete', 'request']
    .map(method => [method, jest.fn(unexpected)]));
}
