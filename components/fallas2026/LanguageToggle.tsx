import React from 'react';
import { useFallasLanguage } from './FallasLanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useFallasLanguage();

  const handleSetSpanish = () => {
    setLanguage('es');
  };

  const handleSetEnglish = () => {
    setLanguage('en');
  };

  return (
    <div className="inline-flex items-center rounded-full border border-orange-900/40 bg-orange-950/40 p-0.5 text-[11px]">
      <button
        type="button"
        onClick={handleSetSpanish}
        aria-pressed={language === 'es'}
        className={`px-2.5 py-1 rounded-full font-semibold tracking-wide transition-colors ${
          language === 'es'
            ? 'bg-amber-400 text-stone-950'
            : 'text-amber-200 hover:bg-amber-900/40'
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={handleSetEnglish}
        aria-pressed={language === 'en'}
        className={`px-2.5 py-1 rounded-full font-semibold tracking-wide transition-colors ${
          language === 'en'
            ? 'bg-amber-400 text-stone-950'
            : 'text-amber-200 hover:bg-amber-900/40'
        }`}
      >
        EN
      </button>
    </div>
  );
};

