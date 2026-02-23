import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Shield, PawPrint, Landmark, Lightbulb, Route, BookOpen, Flame } from 'lucide-react';
import { useFallasLanguage } from './FallasLanguageContext';

const sections = [
  {
    id: 'what-is',
    path: '/fallas2026/que-es',
    icon: <Flame size={20} />,
    titleEs: 'Qué es Fallas',
    descriptionEs: 'Entiende el origen del festival, sus figuras clave y por qué Valencia arde (literalmente) cada marzo.',
  },
  {
    id: 'schedule',
    path: '/fallas2026/fechas-y-programa',
    icon: <CalendarDays size={20} />,
    titleEs: 'Fechas y programa 2026',
    descriptionEs: 'Calendario día a día, incluyendo mascletàs, castillos, Ofrenda, Nit del Foc y la Cremà.',
  },
  {
    id: 'where-to-watch',
    path: '/fallas2026/donde-ver',
    icon: <MapPin size={20} />,
    titleEs: 'Dónde ver los mejores eventos',
    descriptionEs: 'Barrios, plazas y rutas recomendadas para vivir Fallas sin morir en el intento.',
  },
  {
    id: 'getting-around',
    path: '/fallas2026/moverse',
    icon: <Route size={20} />,
    titleEs: 'Cómo moverse por la ciudad',
    descriptionEs: 'Metro, buses, trenes, bicis y por qué no deberías coger el coche al centro.',
  },
  {
    id: 'safety',
    path: '/fallas2026/seguridad',
    icon: <Shield size={20} />,
    titleEs: 'Seguridad y multitudes',
    descriptionEs: 'Consejos para manejar petardos, humo, aglomeraciones y calor de las fallas.',
  },
  {
    id: 'pets',
    path: '/fallas2026/mascotas',
    icon: <PawPrint size={20} />,
    titleEs: 'Mascotas y bienestar animal',
    descriptionEs: 'Guía para proteger a tus animales del ruido extremo de Fallas.',
  },
  {
    id: 'culture',
    path: '/fallas2026/cultura-y-exposiciones',
    icon: <Landmark size={20} />,
    titleEs: 'Cultura y exposiciones',
    descriptionEs: 'Exposición del Ninot, Museo Fallero y el lado artístico y político de la fiesta.',
  },
  {
    id: 'tips',
    path: '/fallas2026/consejos-practicos',
    icon: <Lightbulb size={20} />,
    titleEs: 'Consejos prácticos',
    descriptionEs: 'Qué comer, cómo vestir, horarios clave y trucos de gente local.',
  },
  {
    id: 'beyond',
    path: '/fallas2026/mas-alla-de-valencia',
    icon: <Route size={20} />,
    titleEs: 'Más allá de Valencia',
    descriptionEs: 'Fallas en Torrent, Cartagena y otros municipios de la Comunitat Valenciana.',
  },
  {
    id: 'glossary',
    path: '/fallas2026/glosario',
    icon: <BookOpen size={20} />,
    titleEs: 'Glosario fallero',
    descriptionEs: 'Traducción rápida de palabras como mascletà, cremà, ninot o despertà.',
  },
];

export const FallasGuideHomePage: React.FC = () => {
  const { language } = useFallasLanguage();
  const t = (es: string, en: string) => (language === 'es' ? es : en);

  return (
    <div className="space-y-8 text-terreta-dark">
      <section className="grid gap-8 md:grid-cols-[2fr,3fr] items-start">
        <div className="space-y-4">
          <p className="text-xs md:text-sm text-terreta-secondary font-semibold uppercase tracking-[0.18em] whitespace-nowrap">
            {t('Festival de Fallas en València', 'Fallas festival in Valencia')}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-terreta-dark">
            {t('Fallas 2026: Guía completa', 'Fallas 2026: The Complete Guide')}
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-terreta-dark/90">
            {t(
              'Esta guía está pensada como tu mando a distancia para Fallas: qué es exactamente la fiesta, cuándo pasa cada cosa importante, por dónde moverte y cómo no acabar odiando los petardos. Todo explicado en lenguaje claro, con ejemplos reales y contexto local.',
              'This guide is meant to be your remote control for Fallas: what the festival actually is, when the key moments happen, how to move around and how not to end up hating firecrackers. All explained in clear language, with real examples and local context.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-terreta-border bg-terreta-bg p-5 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-terreta-dark mb-3 uppercase tracking-[0.16em]">
            {t('En esta guía encontrarás', 'In this guide you will find')}
          </h3>
          <ul className="space-y-2 text-sm md:text-base text-terreta-dark leading-relaxed list-disc pl-5">
            <li>
              {t(
                'Resumen claro de qué es Fallas y por qué es tan importante en Valencia.',
                'Clear summary of what Fallas is and why it matters so much in Valencia.'
              )}
            </li>
            <li>
              {t(
                'Calendario 2026 con los momentos que no te puedes perder.',
                '2026 calendar with the moments you should not miss.'
              )}
            </li>
            <li>
              {t(
                'Dónde colocarte para ver mascletàs, castillos y la Cremà sin agobios extremos.',
                'Where to stand to watch mascletàs, fireworks and the Cremà without overwhelming crowds.'
              )}
            </li>
            <li>
              {t(
                'Cómo moverte por la ciudad cuando el tráfico está patas arriba.',
                'How to move around the city when traffic is upside down.'
              )}
            </li>
            <li>
              {t(
                'Consejos muy concretos sobre ruido, humo, niños y mascotas.',
                'Very concrete tips about noise, smoke, kids and pets.'
              )}
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-terreta-dark">
          Explora por tema
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.id}
              to={section.path}
              className="group rounded-2xl border border-terreta-border bg-terreta-bg hover:bg-terreta-card transition-all p-4 flex gap-3 items-start"
            >
              <div className="mt-1 rounded-full bg-terreta-accent/10 text-terreta-accent p-2 border border-terreta-accent/40">
                {section.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-terreta-dark mb-1 group-hover:text-terreta-accent">
                  {section.titleEs}
                </h4>
                <p className="text-xs md:text-sm text-terreta-secondary leading-relaxed">
                  {section.descriptionEs}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-[11px] md:text-xs text-terreta-secondary mt-2 space-x-1">
          <span>
            {t(
              'Fuente oficial de normas y horarios:',
              'Official source for rules and schedules:'
            )}
          </span>
          <a
            href="https://www.valencia.es/documents/d/guest/20260204-bando-fallas"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 decoration-terreta-accent hover:text-terreta-accent"
          >
            {t('Bando Fallas 2026 del Ajuntament de València', 'Fallas 2026 municipal bylaw (bando)')}
          </a>
          <span>·</span>
          <a
            href="https://www.valencia.es/cas/fallas"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 decoration-terreta-accent hover:text-terreta-accent"
          >
            {t('Portal Fallas del Ajuntament de València', 'City of València Fallas portal')}
          </a>
          <span>·</span>
          <a
            href="https://www.fallas.com/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 decoration-terreta-accent hover:text-terreta-accent"
          >
            {t('Junta Central Fallera (fallas.com)', 'Junta Central Fallera (fallas.com)')}
          </a>
          <span>·</span>
          <a
            href="https://www.visitvalencia.com/fallas"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 decoration-terreta-accent hover:text-terreta-accent"
          >
            {t('Visit València: guía oficial de Fallas', 'Visit València: official Fallas guide')}
          </a>
        </p>
      </section>
    </div>
  );
};

