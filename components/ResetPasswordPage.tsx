import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      if (isMounted && !sessionReady) {
        setLinkExpired(true);
      }
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        supabase.auth.getSession().then(({ data }) => {
          if (isMounted && data.session) {
            setSessionReady(true);
            setLinkExpired(false);
          }
        });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted && data.session) {
        setSessionReady(true);
        setLinkExpired(false);
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [sessionReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      setSuccess('Contraseña actualizada. Ya podés entrar con tu nueva clave.');
      window.setTimeout(() => {
        navigate('/', { replace: true });
      }, 1600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No pudimos actualizar la contraseña.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-terreta-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-terreta-border bg-terreta-card p-6 shadow-lg md:p-8">
        <h1 className="mb-2 font-serif text-3xl text-terreta-dark">Nueva contraseña</h1>
        <p className="mb-6 text-sm text-terreta-secondary">
          Elegí una clave nueva para tu cuenta de Terreta Hub.
        </p>

        {linkExpired && !sessionReady ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              El enlace no es válido o expiró. Pedí uno nuevo desde el inicio de sesión.
            </p>
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-lg bg-terreta-accent py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Volver a Terreta Hub
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-terreta-secondary/60" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Nueva contraseña"
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg py-2.5 pl-10 pr-4 text-sm text-terreta-dark outline-none focus:ring-1 focus:ring-terreta-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-terreta-secondary/60" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Repetí la contraseña"
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg py-2.5 pl-10 pr-4 text-sm text-terreta-dark outline-none focus:ring-1 focus:ring-terreta-accent"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full rounded-lg bg-terreta-accent py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Guardando...' : sessionReady ? 'Guardar contraseña' : 'Validando enlace...'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
