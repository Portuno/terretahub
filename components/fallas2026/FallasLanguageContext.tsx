import React, { createContext, useContext, useState } from 'react';

type FallasLanguage = 'es' | 'en';

interface FallasLanguageContextValue {
  language: FallasLanguage;
  setLanguage: (language: FallasLanguage) => void;
}

const FallasLanguageContext = createContext<FallasLanguageContextValue | undefined>(undefined);

export const FallasLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<FallasLanguage>('en');

  return (
    <FallasLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </FallasLanguageContext.Provider>
  );
};

export const useFallasLanguage = () => {
  const context = useContext(FallasLanguageContext);
  if (!context) {
    throw new Error('useFallasLanguage must be used within a FallasLanguageProvider');
  }
  return context;
};

