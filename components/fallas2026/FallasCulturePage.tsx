import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const FallasCulturePage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Cultura, exposiciones y monumentos', 'Culture, exhibitions and monuments')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Fallas es también un museo al aire libre: Exposición del Ninot, Museo Fallero y cientos de monumentos repartidos por toda la ciudad, muchos con presupuestos de seis cifras.',
            'Fallas is also an open-air museum: Ninot Exhibition, Fallero Museum and hundreds of monuments across the city, many with six-figure budgets.'
          )}
        </p>
      </header>

      <section className="space-y-3 text-sm md:text-base text-terreta-dark max-w-3xl leading-relaxed">
        <p>
          {t(
            'La Exposición del Ninot en la Ciutat de les Arts permite ver de cerca cientos de figuras y votar el Ninot Indultat, el único que se salvará del fuego ese año.',
            'The Ninot Exhibition at the City of Arts and Sciences lets you see hundreds of figures up close and vote for the Ninot Indultat, the only one that will be saved from the fire that year.'
          )}
        </p>
        <p>
          {t(
            'El Museo Fallero guarda décadas de ninots indultados y es una forma rápida de entender cómo ha cambiado el humor y la política local desde mediados del siglo XX hasta hoy.',
            'The Fallero Museum holds decades of indulted ninots and is a quick way to understand how local humour and politics have changed from the mid-20th century to today.'
          )}
        </p>
      </section>
    </div>
  );
};
