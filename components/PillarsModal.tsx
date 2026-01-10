import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PillarsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Paletas de colores para los 4 estilos
const MODAL_THEMES = {
  tierra: {
    bg: '#2C1E1A',
    text: '#F9F6F0',
    textSecondary: '#C5A065',
    accent: '#D97706',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  fuego: {
    bg: '#2B1818',
    text: '#FFEBEB',
    textSecondary: '#F59E0B',
    accent: '#EF4444',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  agua: {
    bg: '#0F172A',
    text: '#F0F9FF',
    textSecondary: '#38BDF8',
    accent: '#3B82F6',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  aire: {
    bg: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#64748B',
    accent: '#0284C7',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

// Función para obtener el tema basado en el tiempo o aleatorio
const getCurrentTheme = (): keyof typeof MODAL_THEMES => {
  const themes: (keyof typeof MODAL_THEMES)[] = ['tierra', 'fuego', 'agua', 'aire'];
  // Usar el tiempo para rotar entre temas de manera determinística
  const index = Math.floor(Date.now() / 10000) % themes.length;
  return themes[index];
};

const pillars = [
  { id: "I.", name: "Tecnología" },
  { id: "II.", name: "Arte & Educación" },
  { id: "III.", name: "Finanzas" },
  { id: "IV.", name: "Legal" },
  { id: "V.", name: "Comunidad" },
  { id: "VI.", name: "Salud" }
];

export const PillarsModal: React.FC<PillarsModalProps> = ({ isOpen, onClose }) => {
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
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
          setIsVisible(true);
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop with Blur - Clicking here closes the modal */}
      <div 
        className={`absolute inset-0 bg-black/80 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none'}`}
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
        style={{ 
          backgroundColor: theme.bg,
          borderColor: theme.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button "X" */}
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 md:top-8 md:right-8 hover:bg-white/5 p-2 rounded-full transition-all duration-300 z-20 hover:rotate-90"
            style={{ color: `${theme.text}66` }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.textSecondary}
            onMouseLeave={(e) => e.currentTarget.style.color = `${theme.text}66`}
        >
            <X size={24} />
        </button>

        {/* Content Padding Wrapper */}
        <div className="p-8 md:p-16 flex flex-col items-center w-full">
            
            {/* Center Subtitle */}
            <div className={`text-center mb-2 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 
                  className="text-[10px] md:text-xs tracking-[0.3em] font-sans uppercase font-semibold"
                  style={{ color: theme.textSecondary }}
                >
                    NUESTROS PILARES
                </h3>
            </div>
            
            {/* Big Title "Identidad" */}
            <h2 
              className={`font-serif text-5xl md:text-7xl lg:text-8xl mb-12 md:mb-16 tracking-tight font-medium text-center transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ color: theme.text }}
            >
                Identidad
            </h2>

            {/* Grid Layout */}
            <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-0 transition-all duration-700 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                {pillars.map((pillar, index) => (
                    <div 
                        key={index} 
                        className="group flex items-baseline border-b py-5 md:py-6 transition-colors duration-500"
                        style={{ 
                          borderColor: theme.border,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.text}4D`}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}
                    >
                        {/* Roman Numeral */}
                        <span 
                          className="font-serif text-sm md:text-base mr-6 md:mr-8 min-w-[25px] text-right font-medium opacity-80 group-hover:opacity-100 transition-opacity"
                          style={{ color: theme.textSecondary }}
                        >
                            {pillar.id}
                        </span>
                        
                        {/* Name */}
                        <span 
                          className="font-serif text-2xl md:text-3xl transition-colors duration-300 font-normal"
                          style={{ 
                            color: `${theme.text}CC`,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.text}
                          onMouseLeave={(e) => e.currentTarget.style.color = `${theme.text}CC`}
                        >
                            {pillar.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
