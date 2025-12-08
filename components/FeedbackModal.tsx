import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
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
      const { supabase } = await import('../lib/supabase');
      const { data: authData } = await supabase.auth.getUser();
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : null;

      const { error: insertError } = await supabase.from('feedback_messages').insert({
        name: name.trim() || 'Anónimo',
        message: feedback.trim(),
        user_id: authData?.user?.id ?? null,
        user_agent: userAgent
      });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFeedback('');
        setName('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('[FeedbackModal] Error sending feedback', err);
      setError('No pudimos enviar tu feedback. Inténtalo de nuevo en unos segundos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-700 ease-out-expo ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-terreta-dark/60 backdrop-blur-sm transition-opacity duration-700" 
        onClick={onClose}
      ></div>

      <div 
        className={`relative bg-[#F9F6F0] w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-700 ease-out-expo overflow-hidden ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-12 opacity-0'}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2 text-[#D97706]">
            <MessageCircle size={20} />
            <h3 className="font-serif text-xl text-terreta-dark font-bold">Feedback</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-terreta-dark transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8 animate-fade-in">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={24} />
               </div>
               <h4 className="font-serif text-xl text-terreta-dark mb-2">¡Gracias!</h4>
               <p className="text-sm text-gray-500">Tu opinión nos ayuda a mejorar.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 font-sans leading-relaxed">
                ¿Tienes alguna idea, sugerencia o encontraste un error? Cuéntanoslo para mejorar Terreta Hub.
              </p>

              <div className="space-y-2">
                <label htmlFor="feedback-name" className="text-xs font-bold text-[#D97706] uppercase tracking-widest">
                  Nombre (opcional o anónimo)
                </label>
                <input
                  id="feedback-name"
                  name="feedback-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Pon tu nombre o déjalo vacío para ser Anónimo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-terreta-dark placeholder-gray-400 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none text-sm font-sans"
                  aria-label="Nombre para el feedback"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="feedback-message" className="text-xs font-bold text-[#D97706] uppercase tracking-widest">
                  Mensaje
                </label>
                <textarea
                  id="feedback-message"
                  name="feedback-message"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-terreta-dark placeholder-gray-400 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none resize-none h-32 text-sm font-sans"
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
                className="w-full bg-[#D97706] text-white font-bold py-3 rounded-xl hover:bg-[#B45309] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
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