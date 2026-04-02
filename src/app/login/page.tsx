'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      user === process.env.NEXT_PUBLIC_AUTH_USER &&
      pass === process.env.NEXT_PUBLIC_AUTH_PASS
    ) {
      document.cookie = 'hippos_auth=authenticated; path=/';
      router.push('/patients');
    } else {
      setError('Credenciales inválidas');
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-xl shadow-md border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-ink">🦛 Hippos</h1>
            <p className="text-sm text-ink-tertiary mt-1">Planificación Dietaria</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-danger bg-danger-light rounded-lg px-3 py-2.5 text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="user" className="block text-sm font-medium text-ink-secondary">
                Usuario
              </label>
              <input
                id="user"
                type="text"
                value={user}
                onChange={e => { setUser(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 bg-inset border border-border rounded-lg text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pass" className="block text-sm font-medium text-ink-secondary">
                Contraseña
              </label>
              <input
                id="pass"
                type="password"
                value={pass}
                onChange={e => { setPass(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 bg-inset border border-border rounded-lg text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sage text-white font-medium rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
