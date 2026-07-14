// Ventana emergente que pide un código antes de dejar usar una página.
// Es una barrera de conveniencia, no seguridad real: el código viaja en el
// bundle del navegador. Sirve para que nadie entre por casualidad.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CODIGO_MEDICO = 'BULNESMEDICO';

export const accesoConcedido = (storageKey) => {
  try {
    return sessionStorage.getItem(storageKey) === 'ok';
  } catch {
    return false;
  }
};

// Envuelve una página para exigir el código antes de renderizarla.
export function conPuertaAcceso(Componente, opciones = {}) {
  const { codigo = CODIGO_MEDICO, storageKey = 'acceso_medico', titulo, descripcion } = opciones;
  return function PaginaProtegida(props) {
    const [autorizado, setAutorizado] = useState(() => accesoConcedido(storageKey));
    if (!autorizado) {
      return (
        <PuertaAcceso
          codigo={codigo}
          storageKey={storageKey}
          titulo={titulo}
          descripcion={descripcion}
          onAutorizar={() => setAutorizado(true)}
        />
      );
    }
    return <Componente {...props} />;
  };
}

export default function PuertaAcceso({ codigo, storageKey, titulo, descripcion, onAutorizar }) {
  const navigate = useNavigate();
  const [valor, setValor] = useState('');
  const [error, setError] = useState(false);

  const enviar = (e) => {
    e.preventDefault();
    if (valor.trim().toUpperCase() === codigo) {
      try { sessionStorage.setItem(storageKey, 'ok'); } catch { /* modo privado */ }
      onAutorizar();
    } else {
      setError(true);
      setValor('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-2 flex items-center gap-2 text-slate-900">
          <Lock className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold">{titulo || 'Acceso restringido'}</h2>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {descripcion || 'Ingresa el código de acceso para usar esta herramienta.'}
        </p>
        <input
          type="password"
          autoFocus
          value={valor}
          onChange={(e) => { setValor(e.target.value); setError(false); }}
          placeholder="Código de acceso"
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
          }`}
        />
        {error && <p className="mt-2 text-xs font-medium text-red-600">Código incorrecto.</p>}
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={!valor.trim()} className="flex-1">Entrar</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Salir</Button>
        </div>
      </form>
    </div>
  );
}
