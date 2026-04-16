import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';
import { THEMES, Theme, useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const handleGoToFinde = () => {
    navigate('/terreta');
  };

  const handleGoToChatbot = () => {
    navigate('/chatbot');
  };

  const handleSelectTheme = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsThemeMenuOpen(false);
  };

  return (
    <div className="relative flex h-full min-h-[calc(100vh-56px)] w-full items-start justify-center px-4 pb-8 pt-28 md:min-h-screen md:items-center md:pt-8">
      <div className="absolute left-4 top-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-terreta-border bg-terreta-card/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-terreta-dark shadow-md transition-colors hover:bg-terreta-bg"
            aria-label="Seleccionar elemento visual"
            aria-expanded={isThemeMenuOpen}
            aria-haspopup="listbox"
          >
            <Sparkles size={14} className="text-terreta-accent" />
            <span>{THEMES[theme].label}</span>
            <ChevronDown size={14} className={`${isThemeMenuOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>
          {isThemeMenuOpen ? (
            <>
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(false)}
                className="fixed inset-0 z-10 bg-transparent"
                aria-label="Cerrar selector de elementos"
              />
              <div
                className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-terreta-border bg-terreta-card p-2 shadow-lg"
                role="listbox"
                aria-label="Opciones de elemento"
              >
                {(Object.keys(THEMES) as Theme[]).map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => handleSelectTheme(themeKey)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      theme === themeKey
                        ? 'bg-terreta-accent/15 text-terreta-dark'
                        : 'text-terreta-dark/80 hover:bg-terreta-bg'
                    }`}
                    aria-label={`Elegir elemento ${THEMES[themeKey].label}`}
                  >
                    <span>{THEMES[themeKey].label}</span>
                    {theme === themeKey ? (
                      <span className="text-xs font-bold uppercase text-terreta-accent">Actual</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <section className="w-full max-w-md md:max-w-xl">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-terreta-dark md:text-5xl">
          Terreta Hub
        </h1>
        <p className="mt-3 text-base leading-relaxed text-terreta-dark/75 md:text-lg">
          Tu punto de entrada para descubrir que hacer en la Terreta.
        </p>

        <div className="mt-8 flex flex-col gap-3 md:mt-10">
          <button
            type="button"
            onClick={handleGoToFinde}
            className="w-full rounded-xl bg-terreta-accent px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90"
            aria-label="Ir a Finde en la Terreta"
          >
            Finde en la Terreta
          </button>
          <button
            type="button"
            onClick={handleGoToChatbot}
            className="w-full rounded-xl border border-terreta-border bg-terreta-bg px-4 py-3 text-sm font-bold uppercase tracking-wide text-terreta-dark transition-colors hover:bg-terreta-sidebar"
            aria-label="Ir a Explorar la Comunidad"
          >
            Explorar la Comunidad
          </button>
        </div>
      </section>
    </div>
  );
};
