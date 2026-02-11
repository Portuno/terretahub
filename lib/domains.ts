import { DomainDefinition } from '../types';

export const DOMAINS: DomainDefinition[] = [
  {
    id: 'propiedades',
    name: 'Propiedades',
    description: 'Dominio para todo lo relacionado con inmuebles y propiedades.',
    routePath: '/propiedades',
  },
  {
    id: 'framehack',
    name: 'FrameHack',
    description: 'Dominio experimental FrameHack (actualmente en construcción).',
    routePath: '/framehack',
  },
  {
    id: 'qr',
    name: 'QR',
    description: 'Crea y gestiona códigos QR para tus enlaces y recursos de Terreta.',
    routePath: '/qr',
  },
];

