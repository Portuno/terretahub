export const DIRECTORY_CATEGORIES = [
  'emprendimiento',
  'tecnologia',
  'salud',
  'arte',
  'entretenimiento',
  'publico',
] as const;

export type DirectoryCategory = (typeof DIRECTORY_CATEGORIES)[number];

export type DirectoryEntityTipo = 'fisica' | 'juridica';
export type DirectoryAmbito = 'ciudad' | 'producto';
export type DirectoryConf = 'V' | 'E' | 'A';
export type GeoPrecision = 'sede' | 'calle' | 'barrio';
export type DirectoryVisibility = 'published' | 'hidden';
export type DirectoryFlagKind = 'saved' | 'interested' | 'contacted';
export type DirectoryTargetType = 'entity' | 'event';
export type DirectoryFocusMode = 'focus' | 'explore';

export const GEO_PRECISION_LABELS: Record<GeoPrecision, string> = {
  sede: 'Sede (dirección publicada)',
  calle: 'Aprox. por calle (±200 m)',
  barrio: 'Aprox. por barrio (±500 m)',
};

export const CONF_LABELS: Record<DirectoryConf, string> = {
  V: 'Verificado en fuente pública',
  E: 'Ecosistema conocido — refrescar',
  A: 'Ampliar / contrastar',
};

export const AMBITO_LABELS: Record<DirectoryAmbito, string> = {
  ciudad: 'Ciudad',
  producto: 'Producto Terreta',
};

export const TIPO_LABELS: Record<DirectoryEntityTipo, string> = {
  fisica: 'Persona',
  juridica: 'Organización',
};

export const CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  emprendimiento: 'Emprendimiento',
  tecnologia: 'Tecnología',
  salud: 'Salud',
  arte: 'Arte',
  entretenimiento: 'Entretenimiento',
  publico: 'Público',
};

export interface DirectorySocialLink {
  k: string;
  u: string;
}

export interface DirectoryDato {
  k: string;
  v: string;
}

export interface DirectoryZone {
  id: number;
  name: string;
  centroidLat: number | null;
  centroidLon: number | null;
  subzones: DirectorySubzone[];
}

export interface DirectorySubzone {
  zoneId: number;
  idx: number;
  name: string;
  centroidLat: number | null;
  centroidLon: number | null;
}

export interface DirectoryEntity {
  id: string;
  name: string;
  tipo: DirectoryEntityTipo;
  ambito: DirectoryAmbito;
  cats: DirectoryCategory[];
  rol: string | null;
  org: string | null;
  description: string | null;
  url: string | null;
  tags: string[];
  datos: DirectoryDato[];
  soc: DirectorySocialLink[];
  rel: string[];
  dir: string | null;
  geoPrecision: GeoPrecision | null;
  zoneId: number | null;
  subzoneId: number | null;
  lat: number | null;
  lon: number | null;
  conf: DirectoryConf;
  flag: string | null;
  fuentes: string[];
  estado: string | null;
  notas: string | null;
  orden: number | null;
  visibility: DirectoryVisibility;
  sourceUpdatedAt: string | null;
  updatedAt: string | null;
  zoneName?: string | null;
  subzoneName?: string | null;
}

export interface DirectoryEvent {
  id: string;
  name: string;
  ambito: DirectoryAmbito;
  cats: DirectoryCategory[];
  description: string | null;
  url: string | null;
  ini: string | null;
  fin: string | null;
  lugar: string | null;
  dir: string | null;
  geoPrecision: GeoPrecision | null;
  zoneId: number | null;
  subzoneId: number | null;
  lat: number | null;
  lon: number | null;
  recurrente: boolean;
  conf: DirectoryConf;
  flag: string | null;
  fuentes: string[];
  estado: string | null;
  notas: string | null;
  orden: number | null;
  visibility: DirectoryVisibility;
  sourceUpdatedAt: string | null;
  updatedAt: string | null;
  zoneName?: string | null;
  subzoneName?: string | null;
}

export interface DirectoryListFilters {
  cats?: DirectoryCategory[];
  tipo?: DirectoryEntityTipo;
  ambito?: DirectoryAmbito;
  zoneId?: number;
  subzoneId?: number;
  hasSoc?: boolean;
  geolocated?: boolean;
  search?: string;
  limit?: number;
}

export interface UserDirectoryPrefs {
  userId: string;
  interestTags: string[];
  seeking: string[];
  focusMode: DirectoryFocusMode | null;
  zoneId: number | null;
  consentPersonalization: boolean;
  consentEmailAlerts: boolean;
  emailAlertsStub: boolean;
  onboardingSkipped: boolean;
  onboardingCompletedAt: string | null;
}

export const SEEKING_OPTIONS = [
  'conocer gente',
  'eventos',
  'socios',
  'cultura',
  'trabajo',
  'mentoría',
] as const;

export type SeekingOption = (typeof SEEKING_OPTIONS)[number];

export const COMMUNITY_ROLE_HINTS = [
  'hub',
  'incubadora',
  'aceleradora',
  'coworking',
  'universidad',
  'colectivo',
  'asociación',
  'fundación',
] as const;
