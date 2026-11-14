import { track } from '@vercel/analytics';

export type ProductEventName = 'publicar' | 'inscribirse' | 'abrir_chat' | 'completar_creacion';

export const trackProduct = (
  name: ProductEventName,
  data?: Record<string, string | number | boolean | null>
): void => {
  try {
    track(name, data);
  } catch (error) {
    console.warn('[analytics] No se pudo registrar el evento', error);
  }
};
