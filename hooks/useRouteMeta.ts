import { useLocation } from 'react-router-dom';
import { useDynamicMetaTags } from './useDynamicMetaTags';

import { SITE_CLAIM } from '../lib/site';

interface RouteMeta {
  title: string;
  description: string;
}

const DEFAULT_META: RouteMeta = {
  title: 'Terreta Hub · red social de Valencia',
  description: SITE_CLAIM,
};

const ROUTE_META: Record<string, RouteMeta> = {
  '/': DEFAULT_META,
  '/explorar': {
    title: 'Explorar · Terreta Hub',
    description: 'Entrá al Ágora, la comunidad, proyectos, quedadas y recursos de Terreta Hub.',
  },
  '/agora': {
    title: 'Ágora · Terreta Hub',
    description: 'El muro de la comunidad en Valencia: publicá, comentá y enterate de lo que pasa.',
  },
  '/comunidad': {
    title: 'Comunidad · Terreta Hub',
    description: 'Miembros, proyectos y espacios de la comunidad de Terreta Hub en Valencia.',
  },
  '/miembros': {
    title: 'Miembros · Terreta Hub',
    description: 'Conocé perfiles de la comunidad de Terreta Hub en Valencia.',
  },
  '/proyectos': {
    title: 'Proyectos · Terreta Hub',
    description: 'Ideas y productos que se están construyendo en la comunidad de Valencia.',
  },
  '/eventos': {
    title: 'Quedadas · Terreta Hub',
    description: 'Quedadas y encuentros de la comunidad Terreta Hub en Valencia.',
  },
  '/propiedades': {
    title: 'Espacios · Terreta Hub',
    description: 'Espacios e inmuebles de la comunidad Terreta Hub en Valencia.',
  },
  '/mapa': {
    title: 'Mapa · Terreta Hub',
    description: 'Valencia en vivo: negocios, eventos y acontecimientos de la comunidad.',
  },
  '/recursos': {
    title: 'Recursos · Terreta Hub',
    description: 'Pedí y ofrecé ayuda dentro de la comunidad de Terreta Hub.',
  },
  '/dominio': {
    title: 'Dominios · Terreta Hub',
    description: 'Áreas y experimentos de Terreta Hub: espacios, QR, biblioteca y más.',
  },
  '/que-es-terreta-hub': {
    title: 'Qué es Terreta Hub · red social de Valencia',
    description:
      'Terreta Hub es la red social de Valencia: perfil, gente y lo que pasa en la ciudad. No es Terreta Business Hub S.L.',
  },
  '/faq': {
    title: 'Preguntas frecuentes · Terreta Hub',
    description: 'Cuánto cuesta, cómo unirse, idiomas, y diferencias con Meetup, LinkedIn y Terreta Business Hub S.L.',
  },
  '/donde-networking-valencia': {
    title: 'Dónde hacer networking en Valencia · Terreta Hub',
    description: 'Quedadas de Terreta Hub, UPV, hackathons y formatos de barrio.',
  },
  '/vibehack': {
    title: 'VibeHack en Valencia (UPV) · Terreta Hub',
    description: 'Qué es VibeHack, la edición 2025 en la UPV y cómo seguir la siguiente.',
  },
  '/comunidad-tech-valencia-2026': {
    title: 'Comunidad tech en Valencia 2026 · Terreta Hub',
    description: 'UPV, VibeHack y Terreta Hub: panorama 2026 sin métricas infladas.',
  },
  '/recursos-emprendedores-valencia': {
    title: 'Recursos para emprendedores en Valencia · Terreta Hub',
    description: 'Lista curada, con criterio y fecha, para quien emprende en Valencia.',
  },
  '/para-recien-llegados-valencia': {
    title: 'Para recién llegados a Valencia · Terreta Hub',
    description: 'Guía breve en español e inglés para quien acaba de llegar a Valencia.',
  },
};

export const useRouteMeta = () => {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname];

  useDynamicMetaTags(
    meta
      ? {
          title: meta.title,
          description: meta.description,
          url: location.pathname,
          type: 'website',
        }
      : {}
  );
};
