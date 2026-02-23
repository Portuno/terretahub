import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [identityMode, setIdentityMode] = useState<'user' | 'anon'>('user');
  const [username, setUsername] = useState<string>('anónimo');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Animation states
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 50);
      document.body.style.overflow = 'hidden';
      // Cargar username del usuario para preseleccionar identidad
      (async () => {
        try {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData?.user?.id;
          if (!userId) {
            setUsername('anónimo');
            setIdentityMode('anon');
            return;
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          if (profile?.username) {
            setUsername(profile.username);
            setIdentityMode('user');
          } else {
            setUsername('anónimo');
            setIdentityMode('anon');
          }
        } catch (err) {
          console.error('[FeedbackModal] Error loading username', err);
          setUsername('anónimo');
          setIdentityMode('anon');
        }
      })();
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : null;
      const authorUsername = identityMode === 'anon' ? 'anonimo' : username || 'anonimo';

      const { error: insertError } = await supabase
        .from('feedback_messages')
        .insert({
          message: feedback.trim(),
          username: authorUsername,
          user_agent: userAgent
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFeedback('');
        setIdentityMode(authorUsername === 'anonimo' ? 'anon' : 'user');
        onClose();
      }, 2000);
    } catch (err) {
      // Log detallado para depurar errores de Supabase (code, message, details, hint)
      console.error(
        '[FeedbackModal] Error sending feedback',
        typeof err === 'object' ? JSON.stringify(err, null, 2) : err
      );
      setError('No pudimos enviar tu feedback. Inténtalo de nuevo en unos segundos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-700 ease-out-expo ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Enviar feedback sobre Terreta Hub"
    >
      <div
        className="absolute inset-0 bg-terreta-dark/60 backdrop-blur-sm transition-opacity duration-700"
        onClick={onClose}
      ></div>

      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl bg-terreta-card/95 text-terreta-dark transform transition-all duration-700 ease-out-expo overflow-hidden ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-12 opacity-0'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary/40 flex justify-between items-center bg-terreta-card/95 backdrop-blur">
          <div className="flex items-center gap-2 text-text-accent">
            <MessageCircle size={20} />
            <h3 className="font-serif text-xl text-terreta-dark font-bold">
              Feedback
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-terreta-dark transition-colors p-1 rounded-full hover:bg-terreta-card"
            aria-label="Cerrar ventana de feedback"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-terreta-accent/10 text-text-accent shadow-md">
                <Send size={24} />
              </div>
              <h4 className="font-serif text-xl text-terreta-dark mb-2">
                ¡Gracias!
              </h4>
              <p className="text-sm text-text-secondary">
                Tu opinión nos ayuda a mejorar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-text-secondary font-sans leading-relaxed">
                ¿Tienes alguna idea, sugerencia o encontraste un error? Cuéntanoslo para mejorar Terreta Hub.
              </p>

              <div className="grid gap-2">
                <p className="text-xs font-bold text-text-accent uppercase tracking-widest">
                  Identidad
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIdentityMode('user')}
                    className={`rounded-full border px-3 py-2 text-sm transition shadow-sm ${
                      identityMode === 'user'
                        ? 'border-border-accent bg-terreta-card text-terreta-dark'
                        : 'border-border-primary/60 bg-terreta-card/80 text-text-secondary hover:border-border-accent/70'
                    }`}
                    aria-pressed={identityMode === 'user'}
                  >
                    {username !== 'anónimo'
                      ? `Usar mi usuario (@${username})`
                      : 'Usar mi usuario'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentityMode('anon')}
                    className={`rounded-full border px-3 py-2 text-sm transition shadow-sm ${
                      identityMode === 'anon'
                        ? 'border-border-accent bg-terreta-card text-terreta-dark'
                        : 'border-border-primary/60 bg-terreta-card/80 text-text-secondary hover:border-border-accent/70'
                    }`}
                    aria-pressed={identityMode === 'anon'}
                  >
                    Enviar como Anónimo
                  </button>
                </div>
                <p className="text-xs text-text-secondary/80">
                  Por privacidad, solo guardaremos el username seleccionado (o "anonimo"). No guardamos user_id.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="feedback-message"
                  className="text-xs font-bold text-text-accent uppercase tracking-widest"
                >
                  Mensaje
                </label>
                <textarea
                  id="feedback-message"
                  name="feedback-message"
                  required
                  className="w-full bg-terreta-card border border-border-primary rounded-xl p-4 text-terreta-dark placeholder-text-secondary/60 focus:border-border-accent focus:ring-1 focus:ring-text-accent outline-none resize-none h-32 text-sm font-sans"
                  placeholder="Escribe tu mensaje aquí..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  aria-label="Mensaje de feedback"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-semibold" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full bg-terreta-accent text-white font-bold py-3 rounded-xl hover:bg-terreta-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                aria-label="Enviar feedback"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};