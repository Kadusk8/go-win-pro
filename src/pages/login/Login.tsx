import { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

const CREDENTIALS = { username: 'gowin', password: 'gowin2026' };

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      sessionStorage.setItem('gowin_auth', '1');
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-xl shadow-lg mb-4">
            GW
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Go Win Pro</h1>
          <p className="text-sm text-slate-500 mt-1">Acesse sua conta para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Usuário ou senha incorretos.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
              <input
                required
                type="text"
                autoComplete="username"
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                placeholder="Seu usuário"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(false); }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
