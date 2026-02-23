import React from 'react';
import { Routes, Route, NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { Flame, CalendarDays, MapPin, Shield, PawPrint, Landmark, Lightbulb, Route as RouteIcon, Globe2, BookOpen, Download } from 'lucide-react';

import { FallasGuideHomePage } from './FallasGuideHomePage';
import { FallasWhatIsPage } from './FallasWhatIsPage';
import { FallasSchedulePage } from './FallasSchedulePage';
import { FallasWhereToWatchPage } from './FallasWhereToWatchPage';
import { FallasGettingAroundPage } from './FallasGettingAroundPage';
import { FallasSafetyPage } from './FallasSafetyPage';
import { FallasPetsPage } from './FallasPetsPage';
import { FallasCulturePage } from './FallasCulturePage';
import { FallasTipsPage } from './FallasTipsPage';
import { FallasBeyondValenciaPage } from './FallasBeyondValenciaPage';
import { FallasGlossaryPage } from './FallasGlossaryPage';
import { FallasLanguageProvider, useFallasLanguage } from './FallasLanguageContext';
import { LanguageToggle } from './LanguageToggle';

const navItems = [
  {
    id: 'overview',
    path: '',
    labelEs: 'Portada',
    labelEn: 'Overview',
  },
  {
    id: 'what-is',
    path: 'que-es',
    labelEs: 'Qué es Fallas',
    labelEn: 'What is Fallas?',
  },
  {
    id: 'schedule',
    path: 'fechas-y-programa',
    labelEs: 'Fechas y programa',
    labelEn: 'Dates & Schedule',
  },
  {
    id: 'where-to-watch',
    path: 'donde-ver',
    labelEs: 'Dónde ver',
    labelEn: 'Where to watch',
  },
  {
    id: 'getting-around',
    path: 'moverse',
    labelEs: 'Cómo moverse',
    labelEn: 'Getting around',
  },
  {
    id: 'safety',
    path: 'seguridad',
    labelEs: 'Seguridad',
    labelEn: 'Safety',
  },
  {
    id: 'pets',
    path: 'mascotas',
    labelEs: 'Mascotas',
    labelEn: 'Pets',
  },
  {
    id: 'culture',
    path: 'cultura-y-exposiciones',
    labelEs: 'Cultura y exposiciones',
    labelEn: 'Culture & exhibitions',
  },
  {
    id: 'tips',
    path: 'consejos-practicos',
    labelEs: 'Consejos prácticos',
    labelEn: 'Practical tips',
  },
  {
    id: 'beyond',
    path: 'mas-alla-de-valencia',
    labelEs: 'Más allá de Valencia',
    labelEn: 'Beyond Valencia',
  },
  {
    id: 'glossary',
    path: 'glosario',
    labelEs: 'Glosario',
    labelEn: 'Glossary',
  },
];

const getNavIcon = (id: string) => {
  if (id === 'overview') {
    return <Globe2 size={16} />;
  }
  if (id === 'what-is') {
    return <Flame size={16} />;
  }
  if (id === 'schedule') {
    return <CalendarDays size={16} />;
  }
  if (id === 'where-to-watch') {
    return <MapPin size={16} />;
  }
  if (id === 'getting-around') {
    return <RouteIcon size={16} />;
  }
  if (id === 'safety') {
    return <Shield size={16} />;
  }
  if (id === 'pets') {
    return <PawPrint size={16} />;
  }
  if (id === 'culture') {
    return <Landmark size={16} />;
  }
  if (id === 'tips') {
    return <Lightbulb size={16} />;
  }
  if (id === 'beyond') {
    return <RouteIcon size={16} />;
  }
  if (id === 'glossary') {
    return <BookOpen size={16} />;
  }
  return null;
};

const FallasGuideLayoutInner: React.FC = () => {
  const location = useLocation();
  const { language } = useFallasLanguage();

  const downloadHref =
    language === 'es'
      ? '/fallas2026/guia-fallas-2026-es.pdf'
      : '/fallas2026/guia-fallas-2026-en.pdf';
  const downloadLabel = language === 'es' ? 'Descargar guía' : 'Download guide';
  const titleText =
    language === 'es' ? 'Fallas 2026: Guía Completa' : 'Fallas 2026: Complete Guide';
  const subtitle =
    language === 'es'
      ? 'Guía práctica · Rutas, horarios, consejos y todo lo que te recomendamos.'
      : 'Practical guide · Routes, schedules, tips and everything we recommend.';

  const isOverviewActive =
    location.pathname === '/fallas2026' || location.pathname === '/fallas2026/';

  return (
    <div className="min-h-screen bg-terreta-bg text-terreta-dark">
      <header className="border-b border-terreta-border bg-terreta-card/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-terreta-secondary mb-1">
              <Link
                to="/"
                className="font-semibold text-terreta-dark hover:text-terreta-accent transition-colors"
                aria-label={language === 'es' ? 'Volver a Terreta Hub' : 'Back to Terreta Hub'}
              >
                Terreta Hub
              </Link>
            </p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-terreta-dark">
              {titleText}
            </h1>
            <p className="text-xs text-terreta-dark/70 mt-1">{subtitle}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          {/* Sidebar de navegación (1/5 aprox.) */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terreta-secondary">
                {language === 'es' ? 'Índice de la guía' : 'Guide index'}
              </span>
              <LanguageToggle />
            </div>

            <div className="bg-terreta-card rounded-lg border border-terreta-border shadow-sm overflow-hidden">
              <div className="px-3 py-3 border-b border-terreta-border/70 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terreta-secondary">
                    {language === 'es' ? 'Versión descargable' : 'Downloadable guide'}
                  </span>
                  <span className="text-xs text-terreta-dark/70">
                    PDF offline para llevar en el móvil.
                  </span>
                </div>
                <a
                  href={downloadHref}
                  download
                  className="inline-flex items-center gap-1.5 rounded-full bg-terreta-accent text-white px-3 py-1.5 text-[11px] font-semibold tracking-wide shadow-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 focus:ring-offset-terreta-card transition-colors"
                >
                  <Download size={14} />
                  <span>{downloadLabel}</span>
                </a>
              </div>

              <nav aria-label={language === 'es' ? 'Navegación Fallas 2026' : 'Fallas 2026 navigation'}>
                <ul className="py-2">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        end={item.path === ''}
                        className={({ isActive }) => {
                          const active =
                            (isActive && item.path !== '') ||
                            (item.path === '' && isOverviewActive);

                          const baseClasses =
                            'flex items-center gap-2 px-3 py-2 text-sm rounded-md mx-1 my-0.5 cursor-pointer transition-colors whitespace-nowrap';

                          if (active) {
                            return `${baseClasses} bg-terreta-accent/10 text-terreta-dark border-l-2 border-terreta-accent`;
                          }

                          return `${baseClasses} text-terreta-secondary hover:bg-terreta-bg`;
                        }}
                      >
                        {({ isActive }) => {
                          const active =
                            (isActive && item.path !== '') ||
                            (item.path === '' && isOverviewActive);

                          return (
                            <>
                              <span
                                className={
                                  active
                                    ? 'text-terreta-accent'
                                    : 'text-terreta-secondary/70'
                                }
                              >
                                {getNavIcon(item.id)}
                              </span>
                              <span className="truncate">
                                {language === 'es' ? item.labelEs : item.labelEn}
                              </span>
                            </>
                          );
                        }}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Contenido principal (4/5 aprox.) */}
          <section className="bg-terreta-card rounded-lg border border-terreta-border shadow-sm p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<FallasGuideHomePage />} />
              <Route path="que-es" element={<FallasWhatIsPage />} />
              <Route path="fechas-y-programa" element={<FallasSchedulePage />} />
              <Route path="donde-ver" element={<FallasWhereToWatchPage />} />
              <Route path="moverse" element={<FallasGettingAroundPage />} />
              <Route path="seguridad" element={<FallasSafetyPage />} />
              <Route path="mascotas" element={<FallasPetsPage />} />
              <Route path="cultura-y-exposiciones" element={<FallasCulturePage />} />
              <Route path="consejos-practicos" element={<FallasTipsPage />} />
              <Route path="mas-alla-de-valencia" element={<FallasBeyondValenciaPage />} />
              <Route path="glosario" element={<FallasGlossaryPage />} />
            </Routes>
          </section>
        </div>
      </main>
    </div>
  );
};

export const FallasGuideLayout: React.FC = () => {
  return (
    <FallasLanguageProvider>
      <FallasGuideLayoutInner />
    </FallasLanguageProvider>
  );
};

