import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Compass, TreePine, MapPin, Lock, User } from 'lucide-react';
import { PillarsModal } from './PillarsModal';

type NotFoundVariant = 'generic' | 'profile' | 'project-not-found' | 'project-pending';

interface NotFound404Props {
  variant?: NotFoundVariant;
  profileName?: string;
}

export const NotFound404: React.FC<NotFound404Props> = ({ variant = 'generic', profileName }) => {
  const navigate = useNavigate();
  const { extension } = useParams<{ extension?: string }>();
  const [isPillarsOpen, setIsPillarsOpen] = useState(false);

  // Determinar el nombre del perfil desde la URL si no se proporciona
  const displayProfileName = profileName || extension || 'usuario';

  const renderContent = () => {
    switch (variant) {
      case 'profile':
        return {
          icon: <TreePine className="w-24 h-24 text-[#A65D46]" />,
          title: '¡Talento No Encontrado!',
          message: `Buscamos por toda la Terreta, pero el perfil @${displayProfileName} no está registrado en nuestra red. Quizás todavía están cocinando su idea.`,
          primaryAction: {
            label: 'Buscar Talentos Similares',
            onClick: () => navigate('/app'),
            path: '/app',
          },
          secondaryAction: {
            label: 'Ver los Pilares del Hub',
            onClick: () => setIsPillarsOpen(true),
          },
        };

      case 'project-not-found':
        return {
          icon: <MapPin className="w-24 h-24 text-[#A65D46]" />,
          title: 'Proyecto Perdido en el Mapa',
          message:
            'Este proyecto ya no se encuentra en nuestra incubadora. Puede que haya escalado a otro nivel o haya sido archivado.',
          primaryAction: {
            label: 'Explorar Proyectos Destacados',
            onClick: () => navigate('/app'),
            path: '/app',
          },
          secondaryAction: {
            label: 'Subir mi Propio Proyecto',
            onClick: () => navigate('/app'),
          },
        };

      case 'project-pending':
        return {
          icon: <Lock className="w-24 h-24 text-[#A65D46]" />,
          title: '¡Disculpe! Proyecto en Revisión.',
          message:
            'Este proyecto ya existe, pero está esperando la validación final de nuestro equipo. Queremos asegurarnos de que todo esté perfecto antes de publicarlo.',
          primaryAction: {
            label: 'Volver a la Galería de Proyectos',
            onClick: () => navigate('/app'),
            path: '/app',
          },
          secondaryAction: {
            label: 'Conoce el Proceso de Aprobación',
            onClick: () => {
              // Aquí podrías abrir un modal con información sobre el proceso
              alert(
                'Proceso de Aprobación:\n\n1. Envías tu proyecto para revisión\n2. Nuestro equipo lo revisa (1-3 días)\n3. Si cumple los criterios, se publica\n4. Recibirás una notificación cuando esté listo'
              );
            },
          },
        };

      default: // generic
        return {
          icon: <Compass className="w-24 h-24 text-[#A65D46]" />,
          title: '404 – Error de la Terreta',
          message:
            'Parece que nos hemos desviado un poco del camino. Esta URL no está en nuestros mapas.',
          primaryAction: {
            label: 'Ir al Ágora Comunitario',
            onClick: () => navigate('/app'),
            path: '/app',
          },
          secondaryAction: {
            label: 'Volver al Inicio',
            onClick: () => navigate('/'),
            path: '/',
          },
        };
    }
  };

  const content = renderContent();

  return (
    <>
      <div className="min-h-screen bg-[#F5E8D8] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">{content.icon}</div>

          {/* 404 Number */}
          <div className="mb-6">
            <span className="font-serif text-8xl text-[#A65D46] font-light">404</span>
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
              className="px-8 py-3 bg-[#A65D46] text-white font-bold rounded-lg hover:bg-[#8B4A3A] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {content.primaryAction.label}
            </button>
            <button
              onClick={content.secondaryAction.onClick}
              className="px-8 py-3 bg-transparent border-2 border-[#A65D46] text-[#A65D46] font-bold rounded-lg hover:bg-[#A65D46] hover:text-white transition-all"
            >
              {content.secondaryAction.label}
            </button>
          </div>
        </div>
      </div>

      {/* Pillars Modal (solo para variante de perfil) */}
      {variant === 'profile' && (
        <PillarsModal isOpen={isPillarsOpen} onClose={() => setIsPillarsOpen(false)} />
      )}
    </>
  );
};
