import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Compass, Users } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { Toast } from './Toast';

interface DashboardOutletContext {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

const TOAST_MESSAGE = 'Sección en crecimiento, notificamos al admin de tu interés!';

export const GruposComingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, onOpenAuth } = useOutletContext<DashboardOutletContext>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleInterest = async (interestType: 'want_create' | 'want_explore') => {
    if (!user?.id) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('group_interest').insert({
        user_id: user.id,
        interest_type: interestType
      });

      if (insertError && insertError.code !== '23505') {
        throw insertError;
      }

      setShowToast(true);
    } catch (err) {
      console.error('[GruposComingPage] Error registering interest', err);
      setError('No pudimos registrar tu interés. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-terreta-border bg-terreta-card p-6 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-terreta-accent">Próximamente</p>
        <h1 className="font-serif text-3xl font-bold text-terreta-dark">Grupos en Terreta Hub</h1>
        <p className="mt-3 text-sm leading-relaxed text-terreta-dark/70">
          Estamos preparando espacios temáticos para colaborar y aprender. Mientras tanto, contanos qué te
          interesa más: no hay grupos públicos todavía, así que no vas a encontrar un listado vacío ni un 404.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => handleInterest('want_create')}
            disabled={isSubmitting}
            className="flex w-full items-center gap-4 rounded-xl border border-terreta-border bg-terreta-bg/50 p-4 text-left transition-all hover:border-terreta-accent/50 hover:bg-terreta-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-terreta-accent/20 text-terreta-accent">
              <Users size={20} />
            </span>
            <span className="font-medium text-terreta-dark">Quiero crear un nuevo grupo</span>
          </button>

          <button
            type="button"
            onClick={() => handleInterest('want_explore')}
            disabled={isSubmitting}
            className="flex w-full items-center gap-4 rounded-xl border border-terreta-border bg-terreta-bg/50 p-4 text-left transition-all hover:border-terreta-accent/50 hover:bg-terreta-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-terreta-accent/20 text-terreta-accent">
              <Compass size={20} />
            </span>
            <span className="font-medium text-terreta-dark">Avisame cuando existan grupos</span>
          </button>
        </div>

        {!user ? (
          <p className="mt-4 text-xs text-terreta-secondary">
            Iniciá sesión para registrar tu interés y que el equipo te tenga en cuenta.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-500" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => navigate('/comunidad')}
          className="mt-6 text-sm font-semibold text-terreta-accent hover:text-terreta-dark"
        >
          ← Volver a Comunidad
        </button>
      </div>

      {showToast ? (
        <Toast message={TOAST_MESSAGE} onClose={() => setShowToast(false)} variant="terreta" />
      ) : null}
    </div>
  );
};
