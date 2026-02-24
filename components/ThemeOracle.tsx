import React from 'react';
import { Mountain, Wind, Flame, Droplets } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';

export const ThemeOracle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-8 relative group/oracle">
      <div className="absolute w-40 h-40 border border-terreta-dark/5 rounded-full animate-spin-slow pointer-events-none" />

      <div className="relative w-32 h-32 flex items-center justify-center backdrop-blur-sm bg-white/5 rounded-full border border-white/10 shadow-inner">
        <div className="absolute w-16 h-16 border border-terreta-dark/10 rotate-45 transition-all duration-500 bg-white/5 backdrop-blur-md" />

        <button
          type="button"
          onClick={() => handleThemeChange('aire')}
          className="absolute -top-1 left-1/2 -translate-x-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
          aria-label="Tema Aire"
        >
          <Wind
            size={20}
            className={`transition-all duration-500 ${
              theme === 'aire'
                ? 'text-cyan-500 opacity-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] scale-110'
                : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'
            }`}
          />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-serif font-bold text-cyan-600 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            Aire
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleThemeChange('tierra')}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
          aria-label="Tema Tierra"
        >
          <Mountain
            size={20}
            className={`transition-all duration-500 ${
              theme === 'tierra'
                ? 'text-orange-600 opacity-100 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)] scale-110'
                : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'
            }`}
          />
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-serif font-bold text-orange-700 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            Tierra
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleThemeChange('agua')}
          className="absolute top-1/2 -left-1 -translate-y-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
          aria-label="Tema Agua"
        >
          <Droplets
            size={20}
            className={`transition-all duration-500 ${
              theme === 'agua'
                ? 'text-blue-500 opacity-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] scale-110'
                : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'
            }`}
          />
          <span className="absolute top-1/2 -left-10 -translate-y-1/2 text-[10px] font-serif font-bold text-blue-600 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            Agua
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleThemeChange('fuego')}
          className="absolute top-1/2 -right-1 -translate-y-1/2 p-2 focus:outline-none group/icon transition-all duration-300"
          aria-label="Tema Fuego"
        >
          <Flame
            size={20}
            className={`transition-all duration-500 ${
              theme === 'fuego'
                ? 'text-red-500 opacity-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110 animate-pulse-slow'
                : 'text-terreta-dark opacity-30 group-hover/icon:opacity-100'
            }`}
          />
          <span className="absolute top-1/2 -right-10 -translate-y-1/2 text-[10px] font-serif font-bold text-red-600 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            Fuego
          </span>
        </button>

        <div
          className={`w-2 h-2 rounded-full transition-colors duration-700 ${
            theme === 'aire'
              ? 'bg-cyan-200 shadow-[0_0_10px_2px_rgba(165,243,252,0.8)]'
              : theme === 'tierra'
              ? 'bg-orange-200 shadow-[0_0_10px_2px_rgba(254,215,170,0.8)]'
              : theme === 'agua'
              ? 'bg-blue-200 shadow-[0_0_10px_2px_rgba(191,219,254,0.8)]'
              : 'bg-red-200 shadow-[0_0_10px_2px_rgba(254,202,202,0.8)]'
          }`}
        />
      </div>
    </div>
  );
};

