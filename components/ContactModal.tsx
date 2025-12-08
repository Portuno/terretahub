import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { ContactFormState } from '../types';
import { supabase } from '../lib/supabase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure render happens before class change for transition
      setTimeout(() => setIsVisible(true), 50);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 700); // Match duration-700
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-700 ease-out-expo ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-700" 
        onClick={onClose}
      ></div>

      {/* Modal Content - Dark Theme */}
      <div 
        className={`relative bg-[#2C1E1A] w-full max-w-lg rounded-3xl shadow-2xl transform transition-all duration-700 ease-out-expo overflow-hidden border border-white/10 ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-12 opacity-0'}`}
      >
        
        {/* Header */}
        <div className="bg-[#231715] p-8 flex justify-between items-center border-b border-white/5">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#D97706] font-bold mb-2">Escríbenos</span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#F9F6F0] tracking-tight font-medium">Contacto</h2>
            </div>
          <button 
            onClick={onClose}
            className="text-white/30 hover:text-[#D97706] hover:bg-white/5 hover:rotate-90 transition-all duration-300 p-2 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-8 md:p-10 bg-[#2C1E1A]">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-24 h-24 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-inner border border-green-800/50">
                <Send size={36} />
              </div>
              <h3 className="font-serif text-3xl text-white mb-3">¡Mensaje Enviado!</h3>
              <p className="text-white/60 font-sans text-lg max-w-xs mx-auto">Gracias por escribirnos. Te responderemos pronto.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {errorMessage && (
                <div className="bg-red-900/30 border border-red-800/50 text-red-100 text-sm px-4 py-3 rounded-lg">
                  {errorMessage}
                </div>
              )}
              <div className="group">
                <label htmlFor="name" className="block text-xs font-bold text-[#D97706]/80 uppercase tracking-wider mb-2 font-sans group-focus-within:text-[#D97706] transition-colors">Nombre</label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-white/10 focus:border-[#D97706] outline-none transition-all font-serif text-xl text-white placeholder-white/20 focus:placeholder-white/10"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="group">
                <label htmlFor="email" className="block text-xs font-bold text-[#D97706]/80 uppercase tracking-wider mb-2 font-sans group-focus-within:text-[#D97706] transition-colors">Email</label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-white/10 focus:border-[#D97706] outline-none transition-all font-serif text-xl text-white placeholder-white/20 focus:placeholder-white/10"
                  placeholder="tucorreo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="group">
                <label htmlFor="message" className="block text-xs font-bold text-[#D97706]/80 uppercase tracking-wider mb-2 font-sans group-focus-within:text-[#D97706] transition-colors">Mensaje</label>
                <textarea
                  id="message"
                  required
                  rows={3}
                  className="w-full px-0 py-3 bg-transparent border-b-2 border-white/10 focus:border-[#D97706] outline-none transition-all resize-none font-serif text-xl text-white placeholder-white/20 focus:placeholder-white/10"
                  placeholder="Cuéntanos tu idea..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#D97706] text-white font-bold py-5 rounded-xl hover:bg-[#B45309] hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/20 transition-all duration-300 shadow-lg font-sans tracking-[0.2em] text-xs uppercase mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
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
