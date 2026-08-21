import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogOut, ShieldCheck, Stethoscope } from 'lucide-react';
import { AuthProvider, useAuth } from '@/medispense/contexts/AuthContext';

function MedispenseGate({ children }) {
  const { user, loading, signIn, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true); setError('');
    const email = username.includes('@') ? username.trim() : `${username.trim()}@mediplan.local`;
    const result = await signIn(email, password);
    if (result.error) setError(result.error.message === 'Invalid login credentials' ? 'Credenciales inválidas. Verifica tu usuario y contraseña.' : result.error.message);
    setSubmitting(false);
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950"><div className="text-center text-white"><Stethoscope className="mx-auto h-12 w-12 animate-pulse text-cyan-300" /><p className="mt-3 text-sm">Verificando sesión MediSpense…</p></div></div>;

  if (!user) return <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950 p-4">
    <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" /><div className="pointer-events-none absolute -bottom-32 -left-28 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
    <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-7 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/20"><LockKeyhole className="h-8 w-8" /></span><h1 className="mt-4 text-2xl font-black text-white">Acceso a Hospitalizados</h1><p className="mt-1 text-sm text-blue-200">Ingresa con tu cuenta MediSpense</p></div>
      <div className="space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-bold text-blue-100">Usuario</span><input autoFocus autoComplete="username" value={username} onChange={event => { setUsername(event.target.value); setError(''); }} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-blue-200/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" placeholder="Usuario MediSpense" /></label><label className="block"><span className="mb-1.5 block text-sm font-bold text-blue-100">Contraseña</span><div className="relative"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setError(''); }} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white outline-none placeholder:text-blue-200/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" placeholder="Contraseña" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-blue-200 hover:text-white" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label></div>
      {error && <p className="mt-4 rounded-xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-semibold text-red-100">{error}</p>}
      <button type="submit" disabled={submitting || !username.trim() || !password} className="mt-6 w-full rounded-xl bg-white py-3 font-black text-blue-950 shadow-lg transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Ingresando…' : 'Ingresar de forma segura'}</button>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-blue-200/70"><ShieldCheck className="h-3.5 w-3.5" />Autenticación protegida mediante sesión MediSpense</p>
    </form>
  </div>;

  return <div className="min-h-screen bg-slate-50"><div className="sticky top-0 z-[70] flex items-center justify-between border-b border-emerald-200 bg-emerald-950 px-4 py-1.5 text-white shadow-sm"><span className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-emerald-300" />Sesión MediSpense · {user.user_metadata?.full_name || user.email}</span><button type="button" onClick={signOut} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-100 hover:bg-white/10"><LogOut className="h-3.5 w-3.5" />Cerrar sesión</button></div>{children}</div>;
}

export function conAccesoMedispense(Component) {
  return function PaginaProtegidaMedispense(props) {
    return <AuthProvider><MedispenseGate><Component {...props} /></MedispenseGate></AuthProvider>;
  };
}
