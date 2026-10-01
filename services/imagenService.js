import apiJava from './apiJava';

const obtenerNombreArchivo = (asset) => {
  if (asset?.fileName?.trim()) {
    return asset.fileName.trim();
  }

  const uri = asset?.uri ?? '';
  const extensionUri = uri.split('.').pop()?.toLowerCase();

  const extension =
    extensionUri &&
    extensionUri.length <= 5 &&
    !extensionUri.includes('/')
      ? extensionUri
      : 'jpg';

  return `perfil-${Date.now()}.${extension}`;
};

const obtenerTipoMime = (asset) => {
  if (asset?.mimeType?.trim()) {
    return asset.mimeType.trim();
  }

  const nombre = obtenerNombreArchivo(asset).toLowerCase();

  if (nombre.endsWith('.png')) {
    return 'image/png';
  }

  if (
    nombre.endsWith('.heic') ||
    nombre.endsWith('.heif')
  ) {
    return 'image/heic';
  }

  if (nombre.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
};

const subirFotoPerfil = async (
  asset,
  options = {}
) => {
  if (!asset?.uri) {
    throw new Error(
      'No se seleccionó una imagen válida.'
    );
  }

  const formData = new FormData();

  formData.append('archivo', {
    uri: asset.uri,
    name: obtenerNombreArchivo(asset),
    type: obtenerTipoMime(asset),
  });

  const response = await apiJava.post(
    '/api/imagenes/perfil',
    formData,
    {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  const fotoUrl =
    response.data?.url ??
    response.data?.fotoUrl ??
    response.data?.secureUrl ??
    response.data?.secure_url ??
    null;

  if (!fotoUrl) {
    throw new Error(
      'El servidor no devolvió la URL de la imagen.'
    );
  }

  return {
    ...response.data,
    url: fotoUrl,
  };
};

export const imagenService = {
  subirFotoPerfil,
};

export default imagenService;