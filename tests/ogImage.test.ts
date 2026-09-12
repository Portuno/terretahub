import { describe, expect, it } from 'vitest';
import { DEFAULT_OG_IMAGE, ogSafeImageUrl } from '../lib/ogImage';

describe('ogSafeImageUrl', () => {
  it('usa el logo si la imagen no sirve para Open Graph', () => {
    expect(ogSafeImageUrl(undefined)).toBe(DEFAULT_OG_IMAGE);
    expect(ogSafeImageUrl('data:image/png;base64,abc')).toBe(DEFAULT_OG_IMAGE);
    expect(ogSafeImageUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=x')).toBe(DEFAULT_OG_IMAGE);
    expect(ogSafeImageUrl('/avatar.svg')).toBe(DEFAULT_OG_IMAGE);
  });

  it('conserva una URL http de imagen raster', () => {
    expect(ogSafeImageUrl('https://www.terretahub.com/storage/avatar.jpg')).toBe(
      'https://www.terretahub.com/storage/avatar.jpg'
    );
  });
});
