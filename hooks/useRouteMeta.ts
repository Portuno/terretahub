import { useLocation } from 'react-router-dom';
import { useDynamicMetaTags } from './useDynamicMetaTags';

interface RouteMeta {
  title: string;
  description: string;
}

const DEFAULT_META: RouteMeta = {
  title: 'Terreta Hub · red social de Valencia',
  description:
    'Terreta Hub es la red social de Valencia: gente, proyectos, quedadas y recursos de la comunidad.',
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
    title: 'Mapa de espacios · Terreta Hub',
    description: 'Espacios e inmuebles de la comunidad Terreta Hub en Valencia.',
  },
  '/mapa': {
    title: 'Mapa de espacios · Terreta Hub',
    description: 'Espacios e inmuebles de la comunidad Terreta Hub en Valencia.',
  },
  '/recursos': {
    title: 'Recursos · Terreta Hub',
    description: 'Pedí y ofrecé ayuda dentro de la comunidad de Terreta Hub.',
  },
  '/dominio': {
    title: 'Dominios · Terreta Hub',
    description: 'Áreas y experimentos de Terreta Hub: espacios, QR, biblioteca y más.',
  },
};

export const useRouteMeta = () => {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] ?? DEFAULT_META;

  useDynamicMetaTags({
    title: meta.title,
    description: meta.description,
    url: location.pathname,
    type: 'website',
  });
};
