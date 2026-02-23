import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasSafetyPage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Seguridad y multitudes', 'Safety and crowds')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Millones de personas, toneladas de pólvora y monumentos ardiendo en plena calle. La fiesta está muy controlada, pero hay trucos básicos para disfrutarla con calma.',
            'Millions of people, tonnes of gunpowder and monuments burning in the street. The festival is highly controlled, but there are basic tricks to enjoy it calmly.'
          )}
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          {t('Consejos rápidos', 'Quick tips')}
        </h3>
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
    </div>
  );
};
