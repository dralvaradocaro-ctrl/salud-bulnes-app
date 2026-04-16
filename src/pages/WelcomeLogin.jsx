import React, { useState } from 'react';
import { login } from '@/lib/hospitalAuth';
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function WelcomeLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const ok = login(username, password);
      if (ok) {
        onLogin();
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col">
      {/* Decoraciones de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center flex-1 px-4 py-12">

        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-6 shadow-xl">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Guía Clínica
          </h1>
          <p className="text-xl text-blue-200 font-medium">Hospital de Bulnes</p>
          <p className="text-blue-300/80 text-sm mt-2">Servicio de Salud Ñuble</p>
        </div>

        {/* Card de login */}
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
            <h2 className="text-white font-semibold text-lg mb-6 text-center">
              Acceso para Funcionarios
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1.5">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full py-3 bg-white text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="text-center text-blue-300/60 text-xs mt-6">
            Plataforma de uso exclusivo para personal del Hospital de Bulnes
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative text-center pb-6 text-blue-300/50 text-xs">
        Hospital Comunitario de Salud Familiar de Bulnes · Servicio de Salud Ñuble
      </div>
    </div>
  );
}
