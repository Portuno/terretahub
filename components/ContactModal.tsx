import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { ContactFormState } from '../types';
import { supabase } from '../lib/supabase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Paletas de colores para los 4 estilos
const MODAL_THEMES = {
  tierra: {
    bg: '#2C1E1A',
    headerBg: '#231715',
    text: '#F9F6F0',
    textSecondary: '#D97706',
    accent: '#D97706',
    accentHover: '#B45309',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputFocus: '#D97706',
  },
  fuego: {
    bg: '#2B1818',
    headerBg: '#1F0F0F',
    text: '#FFEBEB',
    textSecondary: '#F59E0B',
    accent: '#EF4444',
    accentHover: '#DC2626',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputFocus: '#EF4444',
  },
  agua: {
    bg: '#0F172A',
    headerBg: '#020617',
    text: '#F0F9FF',
    textSecondary: '#38BDF8',
    accent: '#3B82F6',
    accentHover: '#2563EB',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputFocus: '#3B82F6',
  },
  aire: {
    bg: '#1E293B',
    headerBg: '#0F172A',
    text: '#F8FAFC',
    textSecondary: '#64748B',
    accent: '#0284C7',
    accentHover: '#0369A1',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputFocus: '#0284C7',
  },
};

// Función para obtener el tema basado en el tiempo o aleatorio
const getCurrentTheme = (): keyof typeof MODAL_THEMES => {
  const themes: (keyof typeof MODAL_THEMES)[] = ['tierra', 'fuego', 'agua', 'aire'];
  // Usar el tiempo para rotar entre temas de manera determinística
  const index = Math.floor(Date.now() / 10000) % themes.length;
  return themes[index];
};

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<ContactFormState>({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Animation states
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Theme state - cambia cada vez que se abre el modal
  const [currentTheme, setCurrentTheme] = useState<keyof typeof MODAL_THEMES>(getCurrentTheme());
  
  useEffect(() => {
    if (isOpen) {
      // Cambiar tema cada vez que se abre el modal
      setCurrentTheme(getCurrentTheme());
    }
  }, [isOpen]);
  
  const theme = MODAL_THEMES[currentTheme];

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Use requestAnimationFrame for smoother start
      requestAnimationFrame(() => {
          setIsVisible(true);
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 500); // Match duration-500
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          message: formData.message
        });

      if (error) {
        console.error('[ContactModal] Error al guardar mensaje:', error);
        setErrorMessage('No pudimos enviar tu mensaje. Intenta nuevamente.');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', email: '', message: '' });
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[ContactModal] Excepción al enviar mensaje:', err);
      setErrorMessage('Ocurrió un error al enviar tu mensaje.');
      setIsSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none'}`} 
        onClick={onClose}
      ></div>

      {/* Modal Content - Dynamic Theme */}
      <div 
        className={`relative w-full max-w-lg rounded-3xl shadow-2xl transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) overflow-hidden border ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
        style={{ 
          backgroundColor: theme.bg,
          borderColor: theme.border,
        }}
      >
        
        {/* Header */}
        <div 
          className="p-8 flex justify-between items-center border-b"
          style={{ 
            backgroundColor: theme.headerBg,
            borderColor: theme.border,
          }}
        >
            <div className="flex flex-col">
                <span 
                  className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2"
                  style={{ color: theme.textSecondary }}
                >
                  Escríbenos
                </span>
                <h2 
                  className="font-serif text-3xl md:text-4xl tracking-tight font-medium"
                  style={{ color: theme.text }}
                >
                  Contacto
                </h2>
            </div>
          <button 
            onClick={onClose}
            className="hover:bg-white/5 hover:rotate-90 transition-all duration-300 p-2 rounded-full"
            style={{ color: `${theme.text}4D` }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = `${theme.text}4D`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-8 md:p-10" style={{ backgroundColor: theme.bg }}>
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner border"
                style={{ 
                  backgroundColor: `${theme.accent}30`,
                  color: theme.accent,
                  borderColor: `${theme.accent}80`,
                }}
              >
                <Send size={36} />
              </div>
              <h3 
                className="font-serif text-3xl mb-3"
                style={{ color: theme.text }}
              >
                ¡Mensaje Enviado!
              </h3>
              <p 
                className="font-sans text-lg max-w-xs mx-auto"
                style={{ color: `${theme.text}99` }}
              >
                Gracias por escribirnos. Te responderemos pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {errorMessage && (
                <div 
                  className="border text-sm px-4 py-3 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    color: '#FED7D7',
                  }}
                >
                  {errorMessage}
                </div>
              )}
              <div className="group">
                <label 
                  htmlFor="name" 
                  className="block text-xs font-bold uppercase tracking-wider mb-2 font-sans transition-colors"
                  style={{ color: `${theme.textSecondary}CC` }}
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-0 py-3 bg-transparent border-b-2 outline-none transition-all font-serif text-xl placeholder:opacity-20 focus:placeholder:opacity-10"
                  style={{ 
                    color: theme.text,
                    borderColor: theme.inputBorder,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.inputFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.inputBorder}
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="group">
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold uppercase tracking-wider mb-2 font-sans transition-colors"
                  style={{ color: `${theme.textSecondary}CC` }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-0 py-3 bg-transparent border-b-2 outline-none transition-all font-serif text-xl placeholder:opacity-20 focus:placeholder:opacity-10"
                  style={{ 
                    color: theme.text,
                    borderColor: theme.inputBorder,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.inputFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.inputBorder}
                  placeholder="tucorreo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="group">
                <label 
                  htmlFor="message" 
                  className="block text-xs font-bold uppercase tracking-wider mb-2 font-sans transition-colors"
                  style={{ color: `${theme.textSecondary}CC` }}
                >
                  Mensaje
                </label>
                <textarea
                  id="message"
                  required
                  rows={3}
                  className="w-full px-0 py-3 bg-transparent border-b-2 outline-none transition-all resize-none font-serif text-xl placeholder:opacity-20 focus:placeholder:opacity-10"
                  style={{ 
                    color: theme.text,
                    borderColor: theme.inputBorder,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.inputFocus}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.inputBorder}
                  placeholder="Cuéntanos tu idea..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-bold py-5 rounded-xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-lg font-sans tracking-[0.2em] text-xs uppercase mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: theme.accent,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.accent}
              >
                {isSubmitting ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
