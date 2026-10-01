import apiDotNet from './apiDotNet';

const cacheUsuarios = new Map();

const normalizarUsuario = (usuario) => {
  if (!usuario) {
    return null;
  }

  return {
    id:
      usuario.id ??
      usuario.Id ??
      null,

    nombre:
      usuario.nombre ??
      usuario.Nombre ??
      '',

    correo:
      usuario.correo ??
      usuario.Correo ??
      '',

    telefono:
      usuario.telefono ??
      usuario.Telefono ??
      null,

    rolId:
      usuario.rolId ??
      usuario.RolId ??
      null,

    rol:
      usuario.rol ??
      usuario.Rol ??
      '',

    estado:
      usuario.estado ??
      usuario.Estado ??
      '',

    fechaCreacion:
      usuario.fechaCreacion ??
      usuario.FechaCreacion ??
      null,
  };
};

const obtenerUsuarioPorId = async (
  id,
  options = {}
) => {
  const usuarioId = Number(id);

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    throw new Error(
      'El identificador del usuario no es válido.'
    );
  }

  if (cacheUsuarios.has(usuarioId)) {
    return cacheUsuarios.get(usuarioId);
  }

  const response = await apiDotNet.get(
    `/api/users/${usuarioId}`,
    options
  );

  const usuario = normalizarUsuario(
    response.data
  );

  if (usuario) {
    cacheUsuarios.set(
      usuarioId,
      usuario
    );
  }

  return usuario;
};

const obtenerUsuariosPorIds = async (
  ids = [],
  options = {}
) => {
  const idsUnicos = [
    ...new Set(
      ids
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    ),
  ];

  const usuarios = {};

  await Promise.all(
    idsUnicos.map(async (id) => {
      try {
        const usuario =
          await obtenerUsuarioPorId(
            id,
            options
          );

        if (usuario) {
          usuarios[id] = usuario;
        }
      } catch (error) {
        usuarios[id] = null;
      }
    })
  );

  return usuarios;
};

const actualizarUsuarioActual = async (
  datos,
  options = {}
) => {
  const response = await apiDotNet.put(
    '/api/users/me',
    datos,
    options
  );

  const usuarioRespuesta =
    response.data?.user ??
    response.data?.usuario ??
    null;

  const usuario =
    normalizarUsuario(
      usuarioRespuesta
    );

  if (usuario?.id) {
    cacheUsuarios.set(
      Number(usuario.id),
      usuario
    );
  }

  return {
    ...response.data,
    user: usuario,
  };
};

const obtenerUsuarioActual = async (
  id,
  options = {}
) => {
  return obtenerUsuarioPorId(
    id,
    options
  );
};

const limpiarCacheUsuario = (id) => {
  if (
    id === undefined ||
    id === null
  ) {
    cacheUsuarios.clear();
    return;
  }

  const usuarioId = Number(id);

  if (Number.isInteger(usuarioId)) {
    cacheUsuarios.delete(usuarioId);
  }
};

const limpiarCacheUsuarios = () => {
  cacheUsuarios.clear();
};

export const userService = {
  obtenerUsuarioPorId,
  obtenerUsuariosPorIds,
  obtenerUsuarioActual,
  actualizarUsuarioActual,
  limpiarCacheUsuario,
  limpiarCacheUsuarios,
};

export default userService;