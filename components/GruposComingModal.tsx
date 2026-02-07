import React, { useState, useEffect } from 'react';
import { X, Users, Compass } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { Toast } from './Toast';

interface GruposComingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onOpenAuth?: () => void;
}

const TOAST_MESSAGE = 'Sección en crecimiento, notificamos al admin de tu interés!';

export const GruposComingModal: React.FC<GruposComingModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setError(null);
      setTimeout(() => setIsVisible(true), 50);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInterest = async (interestType: 'want_create' | 'want_explore') => {
    if (!user?.id) {
      onOpenAuth?.();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('group_interest').insert({
        user_id: user.id,
        interest_type: interestType,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          setShowToast(true);
          setTimeout(() => {
            onClose();
          }, 1500);
          return;
        }
        throw insertError;
      }

      setShowToast(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[GruposComingModal] Error registering interest', err);
      setError('No pudimos registrar tu interés. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Grupos en Terreta Hub – Próximamente"
      >
        <div
          className="absolute inset-0 bg-terreta-dark/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleBackdropClick}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        />
        <div
          className={`relative w-full max-w-md rounded-2xl shadow-2xl bg-terreta-card border border-terreta-border text-terreta-dark transform transition-all duration-300 overflow-hidden ${
            isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
          }`}
        >
          <div className="px-6 py-4 border-b border-terreta-border flex justify-between items-center">
            <h3 className="font-serif text-xl text-terreta-dark font-bold">
              Grupos en Terreta Hub – Próximamente
            </h3>
            <button
              onClick={onClose}
              className="text-terreta-secondary hover:text-terreta-dark transition-colors p-1 rounded-lg hover:bg-terreta-bg"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-terreta-secondary font-sans">
              Estamos preparando la sección de Grupos. Mientras tanto, cuéntanos qué te interesa más.
            </p>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => handleInterest('want_create')}
                disabled={isSubmitting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-terreta-border bg-terreta-bg/50 hover:bg-terreta-card hover:border-terreta-accent/50 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2"
                aria-label="Quiero crear un nuevo grupo"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-terreta-accent/20 flex items-center justify-center text-terreta-accent">
                  <Users size={20} />
                </span>
                <span className="font-sans font-medium text-terreta-dark">
                  Quiero crear un nuevo grupo
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleInterest('want_explore')}
                disabled={isSubmitting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-terreta-border bg-terreta-bg/50 hover:bg-terreta-card hover:border-terreta-accent/50 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2"
                aria-label="Explorar grupos existentes"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-terreta-accent/20 flex items-center justify-center text-terreta-accent">
                  <Compass size={20} />
                </span>
                <span className="font-sans font-medium text-terreta-dark">
                  Explorar grupos existentes
                </span>
              </button>
            </div>

            {!user && (
              <p className="text-xs text-terreta-secondary">
                Inicia sesión para registrar tu interés y que el admin pueda tenerte en cuenta.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={TOAST_MESSAGE}
          onClose={() => setShowToast(false)}
          variant="terreta"
        />
      )}
    </>
  );
};
