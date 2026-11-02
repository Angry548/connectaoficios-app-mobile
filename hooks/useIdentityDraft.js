import { useEffect, useRef, useState } from 'react';

export const useIdentityDraft = (usuario) => {
  const actual = { nombre: usuario?.nombre ?? '', correo: usuario?.correo ?? '' };
  const base = useRef(actual);
  const [identidad, setIdentidad] = useState(actual);
  useEffect(() => {
    const anterior = base.current;
    const nuevo = { nombre: usuario?.nombre ?? '', correo: usuario?.correo ?? '' };
    base.current = nuevo;
    // Una hidratación tardía no borra un campo que el usuario ya está editando.
    setIdentidad(valor => ({
      nombre: valor.nombre === anterior.nombre ? nuevo.nombre : valor.nombre,
      correo: valor.correo === anterior.correo ? nuevo.correo : valor.correo,
    }));
  }, [usuario?.nombre, usuario?.correo]);
  return { identidad, setIdentidad, identidadBase: base };
};
