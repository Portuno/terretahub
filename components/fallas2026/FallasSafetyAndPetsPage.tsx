import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasSafetyAndPetsPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-8 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Seguridad & Mascotas', 'Safety & Pets')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Consejos para disfrutar Fallas con calma y para proteger a personas y animales del ruido y las multitudes.',
            'Tips to enjoy Fallas calmly and to protect people and animals from noise and crowds.'
          )}
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Seguridad y multitudes', 'Safety and crowds')}
        </h3>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Millones de personas, toneladas de pólvora y monumentos ardiendo en plena calle. La fiesta está muy controlada, pero hay trucos básicos para disfrutarla con calma.',
            'Millions of people, tonnes of gunpowder and monuments burning in the street. The festival is highly controlled, but there are basic tricks to enjoy it calmly.'
          )}
        </p>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>
            {t(
              'Lleva el móvil y la cartera siempre en bolsillos frontales o bandolera cruzada.',
              'Keep your phone and wallet in front pockets or a cross-body bag.'
            )}
          </li>
          <li>
            {t(
              'Usa tapones para las mascletàs: el sonido supera fácilmente los 120 dB.',
              'Use earplugs for mascletàs: the sound easily exceeds 120 dB.'
            )}
          </li>
          <li>
            {t(
              'Antes de ver una cremà, identifica salidas claras y espacios amplios a tu alrededor.',
              'Before watching a cremà, identify clear exits and open space around you.'
            )}
          </li>
          <li>
            {t(
              'Si tienes problemas respiratorios, evita situarte a favor del viento del humo.',
              'If you have breathing problems, avoid staying downwind of the smoke.'
            )}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Mascotas y bienestar animal', 'Pets and animal welfare')}
        </h3>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Para muchos perros y gatos, Fallas no es una fiesta: es semanas de explosiones constantes. Esta guía se centra en minimizar el estrés de los animales durante el festival.',
            'For many dogs and cats, Fallas is not a party: it is weeks of constant explosions. This guide focuses on minimising animal stress during the festival.'
          )}
        </p>
        <ul className="text-sm md:text-base text-terreta-dark space-y-2 max-w-3xl leading-relaxed list-disc pl-5">
          <li>
            {t(
              'Habla con tu veterinario con tiempo si tu mascota es especialmente sensible al ruido. Hay tratamientos específicos y protocolos recomendados para estos días.',
              'Talk to your vet in advance if your pet is especially noise-sensitive. There are specific treatments and recommended protocols for these days.'
            )}
          </li>
          <li>
            {t(
              'Durante mascletàs, Nit del Foc y la noche de la Cremà, mantén puertas y ventanas cerradas y crea un espacio interior donde el animal pueda refugiarse con mantas y música suave.',
              'During mascletàs, Nit del Foc and Cremà night, keep doors and windows closed and create an indoor space where the animal can take refuge with blankets and soft music.'
            )}
          </li>
          <li>
            {t(
              'Horas de descanso: se recomienda no disparar petardos entre las 15:00 y las 17:00 h, y de 09:00 a 10:00 h, para respetar el descanso vecinal y el bienestar animal (según el Bando Fallas 2026 del Ajuntament de València).',
              'Rest hours: it is recommended not to set off firecrackers between 15:00 and 17:00, and between 09:00 and 10:00, to respect neighbourhood rest and animal welfare (according to the 2026 Fallas municipal bylaw).'
            )}
          </li>
          <li>
            {t(
              'Zonas prohibidas: está prohibido el disparo de cualquier artificio pirotécnico en todo el Jardín del Turia y en las zonas de juegos infantiles.',
              'Prohibited areas: firing any pyrotechnic device is prohibited in the entire Turia Gardens and in children\'s play areas.'
            )}
          </li>
        </ul>
      </section>
    </div>
  );
};
