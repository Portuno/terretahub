import type { GeoPrecision } from './directoryTypes';
import { GEO_PRECISION_LABELS } from './directoryTypes';

/** Never present calle/barrio as an exact street address in UI. */
export const formatDirectoryAddress = (input: {
  dir?: string | null;
  geoPrecision?: GeoPrecision | null;
  lugar?: string | null;
}): { primary: string | null; badge: string | null; isExact: boolean } => {
  const precision = input.geoPrecision || null;
  const badge = precision ? GEO_PRECISION_LABELS[precision] : null;
  const isExact = precision === 'sede';

  if (isExact && input.dir?.trim()) {
    return { primary: input.dir.trim(), badge, isExact: true };
  }

  if (input.lugar?.trim()) {
    return {
      primary: input.lugar.trim(),
      badge: badge || (precision ? GEO_PRECISION_LABELS[precision] : 'Ubicación aproximada'),
      isExact: false,
    };
  }

  if (input.dir?.trim() && !isExact) {
    return {
      primary: precision === 'calle' || precision === 'barrio'
        ? `Zona: ${input.dir.trim()}`
        : input.dir.trim(),
      badge: badge || 'Ubicación aproximada',
      isExact: false,
    };
  }

  return { primary: null, badge, isExact: false };
};

export const geoPrecisionBadgeClass = (precision: GeoPrecision | null | undefined): string => {
  switch (precision) {
    case 'sede':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'calle':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'barrio':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-terreta-sidebar text-terreta-dark/70 border-terreta-border';
  }
};
