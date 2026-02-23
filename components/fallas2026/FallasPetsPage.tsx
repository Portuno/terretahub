import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasPetsPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Mascotas y bienestar animal', 'Pets and animal welfare')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Para muchos perros y gatos, Fallas no es una fiesta: es semanas de explosiones constantes. Esta guía se centrará en minimizar el estrés de los animales durante el festival.',
            'For many dogs and cats, Fallas is not a party: it is weeks of constant explosions. This guide focuses on minimising animal stress during the festival.'
          )}
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          ·{' '}
          {t(
            'Habla con tu veterinario con tiempo si tu mascota es especialmente sensible al ruido. Hay tratamientos específicos y protocolos recomendados para estos días.',
            'Talk to your vet in advance if your pet is especially noise-sensitive. There are specific treatments and recommended protocols for these days.'
          )}
        </p>
        <p>
          ·{' '}
          {t(
            'Durante mascletàs, Nit del Foc y la noche de la Cremà, mantén puertas y ventanas cerradas y crea un espacio interior donde el animal pueda refugiarse con mantas y música suave.',
            'During mascletàs, Nit del Foc and Cremà night, keep doors and windows closed and create an indoor space where the animal can take refuge with blankets and soft music.'
          )}
        </p>
        <p>
          ·{' '}
          {t(
            'Horas de descanso: se recomienda no disparar petardos entre las 15:00 y las 17:00 h, y de 09:00 a 10:00 h, para respetar el descanso vecinal y el bienestar animal (según el Bando Fallas 2026 del Ajuntament de València).',
            'Rest hours: it is recommended not to set off firecrackers between 15:00 and 17:00, and between 09:00 and 10:00, to respect neighbourhood rest and animal welfare (according to the 2026 Fallas municipal bylaw).'
          )}
        </p>
        <p>
          ·{' '}
          {t(
            'Zonas prohibidas: está prohibido el disparo de cualquier artificio pirotécnico en todo el Jardín del Turia y en las zonas de juegos infantiles.',
            'Prohibited areas: firing any pyrotechnic device is prohibited in the entire Turia Gardens and in children’s play areas.'
          )}
        </p>
      </section>
    </div>
  );
};
