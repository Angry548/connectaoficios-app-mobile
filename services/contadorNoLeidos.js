export const badgeNoLeidos = total => total > 99 ? '99+' : total > 0 ? total : undefined;

// Una consulta en curso por sesión; invalidaciones simultáneas se agrupan en
// una recarga posterior para no conservar un total anterior a una lectura.
export const crearContadorNoLeidos = (consultar, publicar) => {
  let sesion = null, revision = 0, vuelo = null, repetir = false;
  const reset = () => { revision++; sesion = null; vuelo = null; repetir = false; publicar(0); };
  const activar = key => { reset(); sesion = key; };
  const refrescar = () => {
    if (!sesion) return Promise.resolve();
    if (vuelo) { repetir = true; return vuelo; }
    const version = revision;
    const tarea = (async () => {
      do {
        repetir = false;
        try {
          const total = await consultar();
          if (revision === version) publicar(total);
        } catch { /* Información secundaria: conservar el último total válido. */ }
      } while (revision === version && repetir);
    })();
    vuelo = tarea;
    tarea.finally(() => { if (revision === version) vuelo = null; });
    return tarea;
  };
  return { activar, reset, refrescar };
};
