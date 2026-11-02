// Los IDs autenticados determinan el interlocutor; nunca el nombre.
export const obtenerFotoInterlocutor = (conversacion, usuarioId) => {
  const id = Number(usuarioId);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (Number(conversacion?.clienteId) === id) return conversacion.trabajadorFotoUrl ?? null;
  if (Number(conversacion?.trabajadorId) === id) return conversacion.clienteFotoUrl ?? null;
  return null;
};
