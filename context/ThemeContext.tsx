import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'tierra' | 'aire' | 'fuego' | 'agua';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Persist selection in localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('terreta-theme');
      return (savedTheme as Theme) || 'tierra';
    }
    return 'tierra';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('terreta-theme', newTheme);
  };

  useEffect(() => {
    // Inject the corresponding class (theme-element) in the body
    const root = document.documentElement;
    root.classList.remove('theme-tierra', 'theme-aire', 'theme-fuego', 'theme-agua');
    root.classList.add(`theme-${theme}`);
    
    // Also update body background color to avoid flashes
    document.body.className = `theme-${theme}`; 

    // Debugging: Log the theme change
    console.log(`[ThemeContext] Theme changed to: ${theme}`);
    
    // Force variable update just in case (hack for some browsers/frameworks)
    root.style.setProperty('--dummy', Date.now().toString());
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

