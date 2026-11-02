import { mensajeError } from './mensajesError';
import apiJava from './apiJava';
import { obtenerMiId } from './usuarioAutenticado';

const normalizarPerfil = (perfil) => perfil ? {
  id: perfil.id ?? perfil.Id ?? null,
  clienteId: perfil.clienteId ?? perfil.ClienteId ?? null,
  fotoUrl: perfil.fotoUrl ?? perfil.FotoUrl ?? '',
  fechaCreacion: perfil.fechaCreacion ?? perfil.FechaCreacion ?? null,
  fechaActualizacion: perfil.fechaActualizacion ?? perfil.FechaActualizacion ?? null,
} : null;

const validarId = (valor) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('El identificador del cliente no es válido.');
  }
  return id;
};

const obtenerPerfilPorId = async (id, options = {}) => {
  const response = await apiJava.get(`/api/perfiles-cliente/${validarId(id)}`, options);
  return normalizarPerfil(response.data);
};

const obtenerPerfilPorCliente = async (clienteId, options = {}) => {
  const response = await apiJava.get(`/api/perfiles-cliente/cliente/${validarId(clienteId)}`, options);
  return normalizarPerfil(response.data);
};

const obtenerMiPerfil = async (options = {}) =>
  obtenerPerfilPorCliente(await obtenerMiId(), options);

const obtenerPerfilPublico = async (clienteId, options = {}) => {
  const response = await apiJava.get(`/api/perfiles-cliente/cliente/${validarId(clienteId)}/publico`, options);
  return normalizarPerfil(response.data);
};

// El propietario se resuelve mediante JWT. La identidad permanece en .NET.
const crearPerfil = async ({ fotoUrl = '' } = {}, options = {}) => {
  const response = await apiJava.post('/api/perfiles-cliente', { fotoUrl }, options);
  return normalizarPerfil(response.data);
};

const modificarMiPerfil = async ({ fotoUrl = '' } = {}, options = {}) => {
  const response = await apiJava.put('/api/perfiles-cliente/mi-perfil', { fotoUrl }, options);
  return normalizarPerfil(response.data);
};

export const mensajeErrorPerfilCliente = (error, mensaje) => {
  const status = error?.response?.status;
  if (status === 409) return 'Tu perfil ya existe. Vuelve al perfil e intenta nuevamente.';
  return mensajeError(error, mensaje);
};

export const perfilClienteService = {
  obtenerMiId, obtenerPerfilPorId, obtenerPerfilPorCliente, obtenerMiPerfil,
  obtenerPerfilPublico, crearPerfil, modificarMiPerfil,
};

export default perfilClienteService;
