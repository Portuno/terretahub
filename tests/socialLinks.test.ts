import { describe, expect, it } from 'vitest';
import {
  normalizeLinkedInUrl,
  normalizeWhatsAppUrl,
  extractWhatsAppDigits,
  getFullQualityAvatarUrl,
} from '../lib/socialLinks';

describe('normalizeLinkedInUrl', () => {
  it('acepta www sin protocolo (caso típico guardado)', () => {
    expect(normalizeLinkedInUrl('www.linkedin.com/in/claudia-herrero-pina')).toBe(
      'https://www.linkedin.com/in/claudia-herrero-pina'
    );
  });

  it('acepta URL completa y normaliza host', () => {
    expect(normalizeLinkedInUrl('https://linkedin.com/in/lautaro-j-sarni/')).toBe(
      'https://www.linkedin.com/in/lautaro-j-sarni'
    );
  });

  it('acepta solo username/slug', () => {
    expect(normalizeLinkedInUrl('javiertormo')).toBe(
      'https://www.linkedin.com/in/javiertormo'
    );
  });

  it('acepta path in/...', () => {
    expect(normalizeLinkedInUrl('in/foo-bar')).toBe(
      'https://www.linkedin.com/in/foo-bar'
    );
  });

  it('no duplica /in/ cuando ya viene en la URL sin https', () => {
    const href = normalizeLinkedInUrl('www.linkedin.com/in/claudia-herrero-pina');
    expect(href).not.toContain('linkedin.com/in/www.linkedin.com');
  });
});

describe('normalizeWhatsAppUrl', () => {
  it('construye wa.me desde teléfono con espacios y +', () => {
    expect(normalizeWhatsAppUrl('+34 689468413')).toBe('https://wa.me/34689468413');
  });

  it('extrae phone de api.whatsapp.com', () => {
    expect(normalizeWhatsAppUrl('https://api.whatsapp.com/send?phone=34600111222')).toBe(
      'https://wa.me/34600111222'
    );
  });

  it('extrae dígitos de wa.me existente', () => {
    expect(normalizeWhatsAppUrl('https://wa.me/34600111222')).toBe('https://wa.me/34600111222');
  });

  it('no usa whatsapp.com genérico sin número', () => {
    expect(normalizeWhatsAppUrl('https://www.whatsapp.com')).toBeNull();
    expect(normalizeWhatsAppUrl('https://wa.me/')).toBeNull();
  });

  it('username sin dígitos no produce enlace (evita wa.me vacío)', () => {
    expect(normalizeWhatsAppUrl('claudiaherreropina')).toBeNull();
    expect(extractWhatsAppDigits('claudiaherreropina')).toBeNull();
  });
});

describe('getFullQualityAvatarUrl', () => {
  it('convierte render/image de Supabase a object/public', () => {
    const src =
      'https://xxx.supabase.co/storage/v1/render/image/public/avatars/uid/avatar.jpg?width=96&height=96';
    expect(getFullQualityAvatarUrl(src)).toBe(
      'https://xxx.supabase.co/storage/v1/object/public/avatars/uid/avatar.jpg'
    );
  });

  it('deja URLs object/public intactas (salvo query de tamaño)', () => {
    const src =
      'https://xxx.supabase.co/storage/v1/object/public/avatars/uid/avatar.jpg';
    expect(getFullQualityAvatarUrl(src)).toBe(src);
  });
});
