import React from 'react';
import { Routes, Route, NavLink, useLocation, Link } from 'react-router-dom';
import { Flame, CalendarDays, Shield, Landmark, Lightbulb, Route as RouteIcon, MessageCircle, BookOpen, Download } from 'lucide-react';

import { FallasGuideHomePage } from './FallasGuideHomePage';
import { FallasWhatIsPage } from './FallasWhatIsPage';
import { FallasSchedulePage } from './FallasSchedulePage';
import { FallasGettingAroundPage } from './FallasGettingAroundPage';
import { FallasSafetyAndPetsPage } from './FallasSafetyAndPetsPage';
import { FallasCulturePage } from './FallasCulturePage';
import { FallasTipsPage } from './FallasTipsPage';
import { FallasBeyondValenciaPage } from './FallasBeyondValenciaPage';
import { FallasGlossaryPage } from './FallasGlossaryPage';
import { FallasLanguageProvider, useFallasLanguage } from './FallasLanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { downloadFallasGuidePdf } from './fallasGuidePdfGenerator';
import { ThemeOracle } from '../ThemeOracle';
import { supabase } from '../../lib/supabase';

const navItems = [
  {
    id: 'overview',
    path: '',
    labelEs: 'Asistente Fallas',
    labelEn: 'Fallas Assistant',
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
    id: 'getting-around',
    path: 'moverse',
    labelEs: 'Cómo moverse',
    labelEn: 'Getting around',
  },
  {
    id: 'safety-pets',
    path: 'seguridad-mascotas',
    labelEs: 'Seguridad & Mascotas',
    labelEn: 'Safety & Pets',
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
    return <MessageCircle size={16} />;
  }
  if (id === 'what-is') {
    return <Flame size={16} />;
  }
  if (id === 'schedule') {
    return <CalendarDays size={16} />;
  }
  if (id === 'getting-around') {
    return <RouteIcon size={16} />;
  }
  if (id === 'safety-pets') {
    return <Shield size={16} />;
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

  const downloadLabel = language === 'es' ? 'Descargar guía' : 'Download guide';

  const handleDownloadGuide = () => {
    downloadFallasGuidePdf(language);

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id ?? null;

        await supabase.from('fallas_guide_downloads').insert({
          language,
          user_id: userId,
          user_agent:
            typeof window !== 'undefined' ? window.navigator.userAgent : null,
        });
      } catch (error) {
        // No romper la experiencia de usuario si el tracking falla
        console.error('[FallasGuide] Error tracking PDF download', error);
      }
    })();
  };
  const titleText =
    language === 'es' ? 'Fallas 2026: Guía Completa' : 'Fallas 2026: Complete Guide';
  const subtitle =
    language === 'es'
      ? 'Guía práctica · Rutas, horarios, consejos y todo lo que te recomendamos.'
      : 'Practical guide · Routes, schedules, tips and everything we recommend.';

  const isOverviewActive =
    location.pathname === '/fallas2026' || location.pathname === '/fallas2026/';

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-terreta-bg text-terreta-dark relative">
      <header className="border-b border-terreta-border bg-terreta-card/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-terreta-secondary mb-0.5">
              <Link
                to="/"
                className="font-semibold text-terreta-dark hover:text-terreta-accent transition-colors"
                aria-label={language === 'es' ? 'Volver a Terreta Hub' : 'Back to Terreta Hub'}
              >
                Terreta Hub
              </Link>
            </p>
            <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight text-terreta-dark">
              {titleText}
            </h1>
            <p className="text-xs text-terreta-dark/70">{subtitle}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-6xl mx-auto px-4 py-3 w-full">
        <div className="h-full flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:gap-5">
          <aside className="lg:overflow-y-auto lg:min-h-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terreta-secondary">
                {language === 'es' ? 'Índice de la guía' : 'Guide index'}
              </span>
              <LanguageToggle />
            </div>

            <div className="bg-terreta-card rounded-lg border border-terreta-border shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 border-b border-terreta-border/70 flex flex-col items-start gap-1.5">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terreta-secondary">
                    {language === 'es' ? 'Versión descargable' : 'Downloadable guide'}
                  </span>
                  <span className="text-xs text-terreta-dark/70">
                    {language === 'es'
                      ? 'PDF offline para llevar en el móvil.'
                      : 'Offline PDF to take on your phone.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadGuide}
                  className="inline-flex items-center gap-1.5 rounded-full bg-terreta-accent text-white px-3 py-1.5 text-[11px] font-semibold tracking-wide shadow-sm hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 focus:ring-offset-terreta-card transition-colors"
                  aria-label={downloadLabel}
                >
                  <Download size={14} />
                  <span>{downloadLabel}</span>
                </button>
              </div>

              <nav aria-label={language === 'es' ? 'Navegación Fallas 2026' : 'Fallas 2026 navigation'}>
                <ul className="py-1">
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
                            'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 my-0.5 cursor-pointer transition-colors whitespace-nowrap';

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

            <div className="pt-2">
              <ThemeOracle />
            </div>
          </aside>

          <section className="flex flex-col flex-1 min-h-0 bg-terreta-card rounded-lg border border-terreta-border shadow-sm p-4 md:p-6 lg:p-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<FallasGuideHomePage />} />
              <Route path="que-es" element={<FallasWhatIsPage />} />
              <Route path="fechas-y-programa" element={<FallasSchedulePage />} />
              <Route path="moverse" element={<FallasGettingAroundPage />} />
              <Route path="seguridad-mascotas" element={<FallasSafetyAndPetsPage />} />
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

