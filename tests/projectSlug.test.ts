import { describe, expect, it } from 'vitest';
import { getProjectSlug, parseProjectIdFromSlug, projectPublicPath } from '../lib/projectSlug';
import { SITE_CLAIM, SITE_ORIGIN, absoluteUrl } from '../lib/site';

describe('getProjectSlug', () => {
  it('usa el nombre cuando se puede slugificar', () => {
    expect(getProjectSlug('Huerto en Russafa', 'abc')).toBe('huerto-en-russafa');
  });

  it('cae al id si el nombre está vacío', () => {
    expect(getProjectSlug('   ', '11111111-2222-3333-4444-555555555555')).toBe(
      'id-11111111-2222-3333-4444-555555555555'
    );
    expect(projectPublicPath('', 'abc')).toBe('/proyecto/id-abc');
  });

  it('parsea slugs de id y UUID', () => {
    expect(parseProjectIdFromSlug('id-abc')).toBe('abc');
    expect(parseProjectIdFromSlug('11111111-2222-4333-8444-555555555555')).toBe(
      '11111111-2222-4333-8444-555555555555'
    );
    expect(parseProjectIdFromSlug('huerto-en-russafa')).toBeNull();
  });
});

describe('site canonical', () => {
  it('fuerza www', () => {
    expect(SITE_ORIGIN).toBe('https://www.terretahub.com');
    expect(absoluteUrl('/eventos')).toBe('https://www.terretahub.com/eventos');
    expect(absoluteUrl('https://terretahub.com/p/ana')).toBe('https://www.terretahub.com/p/ana');
    expect(SITE_CLAIM).toContain('red social de Valencia');
  });
});
