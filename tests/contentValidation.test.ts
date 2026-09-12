import { describe, expect, it } from 'vitest';
import { isListablePublishedProject, validateEvent, validateProject } from '../lib/contentValidation';
import { persistProject } from '../lib/projectPersistence';

const futureDate = () => {
  const date = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const iso = date.toISOString();
  return { startDate: iso.slice(0, 10), startTime: iso.slice(11, 16) };
};

describe('validateProject', () => {
  it('rechaza un proyecto vacío enviado a revisión', () => {
    const errors = validateProject({
      name: '',
      slogan: '',
      description: '',
      images: [],
      status: 'review',
    });
    expect(errors.name).toBeTruthy();
    expect(errors.slogan).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(errors.images).toBeTruthy();
  });

  it('acepta un proyecto válido para revisión', () => {
    const errors = validateProject({
      name: 'Huerto en Russafa',
      slogan: 'Comida local de barrio',
      description: 'Un proyecto vecinal para compartir huerta, recetas y quedadas en Valencia con la comunidad.',
      images: ['https://example.com/huerto.jpg'],
      status: 'review',
    });
    expect(errors).toEqual({});
  });

  it('permite un borrador solo con título', () => {
    const errors = validateProject({
      name: 'Idea',
      slogan: '',
      description: '',
      images: [],
      status: 'draft',
    });
    expect(errors).toEqual({});
  });
});

describe('isListablePublishedProject', () => {
  it('oculta un publicado vacío', () => {
    expect(
      isListablePublishedProject({
        name: '',
        slogan: '',
        description: '',
        images: [],
        status: 'published',
      })
    ).toBe(false);
  });
});

describe('validateEvent', () => {
  it('rechaza una quedada vacía o pasada', () => {
    const errors = validateEvent({
      title: '',
      description: 'corta',
      startDate: '2020-01-01',
      startTime: '10:00',
      isNew: true,
    });
    expect(errors.title).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(errors.startDate).toBeTruthy();
  });

  it('acepta una quedada futura con datos mínimos', () => {
    const { startDate, startTime } = futureDate();
    const errors = validateEvent({
      title: 'Café en el Carmen',
      description: 'Quedada abierta para conocer gente de Valencia y compartir planes.',
      startDate,
      startTime,
      isNew: true,
    });
    expect(errors).toEqual({});
  });
});

describe('persistProject', () => {
  it('no persiste un proyecto vacío a revisión', async () => {
    const result = await persistProject('user-1', {
      id: 'draft',
      authorId: 'user-1',
      name: '',
      slogan: '',
      description: '',
      images: [],
      categories: [],
      technologies: [],
      phase: 'Idea',
      status: 'review',
      createdAt: new Date().toISOString(),
    });
    expect(result.error).toBeTruthy();
  });
});
