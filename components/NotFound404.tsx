import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

type NotFoundVariant = 'generic' | 'profile' | 'project-not-found' | 'project-pending';

interface NotFound404Props {
  variant?: NotFoundVariant;
  profileName?: string;
}

export const NotFound404: React.FC<NotFound404Props> = ({ variant = 'generic', profileName }) => {
  const navigate = useNavigate();

  // Aunque aceptamos variant/profileName para no romper usos existentes,
  // todas las variantes comparten la misma experiencia 404 temática "Tierra".
  const content = {
    icon: <Compass className="w-24 h-24 text-[#A65D46]" />,
    title: '404 – Este rincón de la Terreta no existe',
    message:
      'La página que buscas se ha perdido entre montes, mar y huertas. Puede que el enlace haya cambiado o nunca haya existido.',
    primaryAction: {
      label: 'Volver al inicio',
      onClick: () => navigate('/'),
      path: '/',
    },
    secondaryAction: {
      label: 'Explorar la comunidad',
      onClick: () => navigate('/comunidad'),
      path: '/comunidad',
    },
  };

  return (
    <>
      <div
        className="min-h-screen bg-[#F5E8D8] flex items-center justify-center p-6"
        role="main"
        aria-label="Página no encontrada"
      >
        <div className="max-w-2xl w-full text-center bg-[#F9F2E8]/80 backdrop-blur-sm rounded-3xl shadow-xl px-8 py-10 border border-[#D2B9A0]/60">
          {/* Icon */}
          <div className="mb-8 flex justify-center">{content.icon}</div>

          {/* 404 Number */}
          <div className="mb-6">
            <span className="font-serif text-8xl text-[#A65D46] font-light drop-shadow-sm">404</span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl text-terreta-dark mb-4">
            {content.title}
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-700 mb-10 leading-relaxed max-w-lg mx-auto">
            {content.message}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={content.primaryAction.onClick}
              className="px-8 py-3 bg-[#A65D46] text-white font-bold rounded-lg hover:bg-[#8B4A3A] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A65D46]"
              aria-label={content.primaryAction.label}
            >
              {content.primaryAction.label}
            </button>
            <button
              onClick={content.secondaryAction.onClick}
              className="px-8 py-3 bg-transparent border-2 border-[#A65D46] text-[#A65D46] font-bold rounded-lg hover:bg-[#A65D46] hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A65D46]"
              aria-label={content.secondaryAction.label}
            >
              {content.secondaryAction.label}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
