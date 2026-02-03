import React, { useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MascotAnimation } from './MascotAnimation';
import { TERRE_MASCOT_ANIMATION } from '../lib/mascotConstants';
import { HomeChatbot } from './HomeChatbot';
import type { AuthUser } from '../types';

type ViewMode = 'landing' | 'animating' | 'chat';

const TRANSMUTE_DURATION_MS = 2400;

export const LandingPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const transmuteTriggered = useRef(false);

  const handleTransmuteClick = useCallback(() => {
    if (viewMode !== 'landing' || transmuteTriggered.current) return;
    transmuteTriggered.current = true;
    setViewMode('animating');
  }, [viewMode]);

  const handleTransmuteComplete = useCallback(() => {
    setViewMode('chat');
  }, []);

  const handleChatBack = useCallback(() => {
    transmuteTriggered.current = false;
    setViewMode('landing');
  }, []);

  const outletContext = useOutletContext() as { user: AuthUser | null };
  const user = outletContext?.user ?? null;

  if (viewMode === 'chat') {
    return (
      <div className="flex flex-col font-sans overflow-hidden w-full h-full max-h-screen px-4 md:px-8 py-4">
        <HomeChatbot user={user} onBack={handleChatBack} />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans overflow-hidden relative animate-fade-in w-full h-screen max-h-screen">
      {/* Transmutation overlay: mascot in center while content recedes */}
      {viewMode === 'animating' && (
        <MascotAnimation
          animationData={TERRE_MASCOT_ANIMATION}
          duration={TRANSMUTE_DURATION_MS / 1000}
          onComplete={handleTransmuteComplete}
        />
      )}

      {/* Hero: ocupa mejor el ancho disponible, más presencia visual */}
      <section className="flex-grow flex flex-col justify-center w-full min-h-full px-6 sm:px-8 md:px-10 lg:px-14 xl:px-20 py-8 md:py-12">
        <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl">
          <div
            className={`${viewMode === 'animating' ? 'animate-transmute-back pointer-events-none' : ''}`}
            role="button"
            tabIndex={0}
            onClick={handleTransmuteClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTransmuteClick();
              }
            }}
            aria-label="Pulsa para abrir el asistente de Terreta Hub"
          >
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-terreta-dark font-bold tracking-tight text-left">
              Terreta Hub
            </h1>
            <div className="w-16 md:w-20 h-0.5 bg-terreta-accent mt-3 mb-8 md:mb-10 rounded-full opacity-90" />

            <div className="relative w-full">
            <div className="relative bg-terreta-card/30 backdrop-blur-md p-6 sm:p-8 md:p-10 lg:p-12 text-left shadow-xl rounded-xl border border-terreta-border/50 overflow-hidden">
              <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5" />
                </svg>
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rotate-90">
                <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none rotate-180">
                <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5" />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none -rotate-90">
                <svg viewBox="0 0 100 100" className="w-full h-full text-terreta-accent fill-current opacity-80" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.3))' }}>
                  <path d="M0,0 L40,0 C30,10 30,20 20,20 L20,40 C10,30 0,30 0,0 Z M10,10 L30,10 L10,30 L10,10 Z" />
                  <path d="M5,5 L15,5 L5,15 Z" fillOpacity="0.5" />
                </svg>
              </div>
              <div className="absolute top-0 left-16 right-16 h-[1px] bg-gradient-to-r from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0" />
              <div className="absolute bottom-0 left-16 right-16 h-[1px] bg-gradient-to-r from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0" />
              <div className="absolute left-0 top-16 bottom-16 w-[1px] bg-gradient-to-b from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0" />
              <div className="absolute right-0 top-16 bottom-16 w-[1px] bg-gradient-to-b from-terreta-accent/0 via-terreta-accent/50 to-terreta-accent/0" />
              <div className="absolute inset-0 bg-gradient-to-br from-terreta-accent/10 to-transparent pointer-events-none" />
              <span className="absolute top-6 left-8 text-5xl md:text-7xl text-terreta-accent/20 font-serif leading-none select-none animate-pulse-slow">"</span>
              <div className="relative z-10 space-y-4 md:space-y-5 lg:space-y-6">
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-terreta-dark via-terreta-accent to-terreta-dark font-bold leading-tight animate-slide-up pb-1 tracking-tight drop-shadow-sm">
                  Has entrado al Epicentre de Terreta Hub.
                </h2>
                <p className="font-sans font-light text-base sm:text-lg md:text-xl lg:text-2xl text-terreta-dark/90 leading-relaxed animate-slide-up delay-100 drop-shadow-sm">
                  Un laboratorio digital donde animarse a experimentar y crear cosas bajo el sol de la intuición.
                  Espacio ideal para que las ideas broten, las mentes conecten y el futuro sea construido con sabor a Valencia.
                </p>
              </div>
              <span className="absolute bottom-4 right-10 text-5xl md:text-7xl text-terreta-accent/20 font-serif leading-none rotate-180 select-none animate-pulse-slow delay-300">"</span>
            </div>
          </div>
          </div>

        {/* Bottom row: hint left, CTA right */}
        <div className="w-full mt-8 md:mt-10 flex flex-wrap items-center justify-between gap-4">
          <span className="text-terreta-dark/50 font-sans text-sm md:text-base order-2 sm:order-1">
            Pulsa el texto para hablar con el asistente
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (viewMode === 'landing' && !transmuteTriggered.current) {
                transmuteTriggered.current = true;
                setViewMode('animating');
              }
            }}
            className="bg-terreta-accent hover:opacity-90 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold tracking-widest text-xs sm:text-sm md:text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase order-1 sm:order-2"
            aria-label="Explora la Comunidad y abre el asistente"
          >
            Explora la Comunidad
          </button>
        </div>
      </div>
      </section>
    </div>
  );
};
