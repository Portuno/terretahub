import React from 'react';
import { Link } from 'react-router-dom';
import { useFallasLanguage } from './FallasLanguageContext';

const LINKS = [
  { path: 'que-es', es: 'Qué es Fallas', en: 'What is Fallas?' },
  { path: 'fechas-y-programa', es: 'Fechas y programa', en: 'Dates & Schedule' },
  { path: 'moverse', es: 'Moverse por la ciudad', en: 'Getting around' },
  { path: 'seguridad-mascotas', es: 'Seguridad y mascotas', en: 'Safety & pets' },
  { path: 'cultura-y-exposiciones', es: 'Cultura y exposiciones', en: 'Culture & exhibitions' },
  { path: 'consejos-practicos', es: 'Consejos prácticos', en: 'Practical tips' },
  { path: 'mas-alla-de-valencia', es: 'Más allá de Valencia', en: 'Beyond Valencia' },
  { path: 'glosario', es: 'Glosario', en: 'Glossary' },
] as const;

export const FallasGuideHomePage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-6 text-terreta-dark">
      <header className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
          {t('Guía de Fallas 2026', 'Fallas Guide 2026')}
        </h2>
        <p className="text-sm md:text-base text-terreta-secondary max-w-3xl leading-relaxed">
          {t(
            'Una guía práctica para vivir Fallas en Valencia: qué ver, cómo moverte, seguridad y consejos de la comunidad.',
            'A practical guide to experiencing Fallas in Valencia: what to see, how to get around, safety and community tips.'
          )}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LINKS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-xl border border-terreta-border bg-terreta-card/80 px-4 py-3 text-sm font-semibold text-terreta-dark hover:border-terreta-accent/40 hover:bg-terreta-bg transition-colors"
          >
            {t(item.es, item.en)}
          </Link>
        ))}
      </section>
    </div>
  );
};
