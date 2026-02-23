import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Shield, PawPrint, Landmark, Lightbulb, Route, BookOpen, Flame } from 'lucide-react';

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
  return (
    <div className="space-y-8 text-terreta-dark">
      <section className="grid gap-8 md:grid-cols-[2fr,3fr] items-start">
        <div className="space-y-4">
          <p className="text-xs md:text-sm text-terreta-secondary font-semibold uppercase tracking-[0.18em]">
            Fallas festival in Valencia
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
            Fallas 2026: The Complete Guide
          </h2>
          <p className="text-xs md:text-sm text-terreta-secondary">
            Publicado 19 de febrero de 2026 · Lectura 12 min · Actualizado para visitantes, recién llegados y gente local
            que quiere sobrevivir a su primera semana fallera.
          </p>
          <p className="text-sm md:text-base leading-relaxed text-terreta-dark/90">
            Esta guía está pensada como tu mando a distancia para Fallas: qué es exactamente la fiesta, cuándo pasa cada
            cosa importante, por dónde moverte y cómo no acabar odiando los petardos. Todo explicado en lenguaje claro,
            con ejemplos reales y contexto local.
          </p>
        </div>

        <div className="rounded-2xl border border-terreta-border bg-terreta-bg p-5 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-terreta-dark mb-3 uppercase tracking-[0.16em]">
            En esta guía encontrarás
          </h3>
          <ul className="space-y-2 text-sm md:text-base text-terreta-dark leading-relaxed list-disc pl-5">
            <li>Resumen claro de qué es Fallas y por qué es tan importante en Valencia.</li>
            <li>Calendario 2026 con los momentos que no te puedes perder.</li>
            <li>Dónde colocarte para ver mascletàs, castillos y la Cremà sin agobios extremos.</li>
            <li>Cómo moverte por la ciudad cuando el tráfico está patas arriba.</li>
            <li>Consejos muy concretos sobre ruido, humo, niños y mascotas.</li>
          </ul>
          <p className="text-xs md:text-sm text-terreta-secondary mt-4">
            Todo el contenido estará disponible en español e inglés. Ahora mismo ves la versión en español.
          </p>
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
      </section>
    </div>
  );
};

