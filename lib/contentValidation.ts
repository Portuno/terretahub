export type FieldErrors = Record<string, string>;

export const PROJECT_NAME_MIN = 3;
export const PROJECT_SLOGAN_MIN = 8;
export const PROJECT_DESCRIPTION_MIN = 40;

export const EVENT_TITLE_MIN = 3;
export const EVENT_DESCRIPTION_MIN = 20;

export const RESOURCE_DETAILS_MIN = 12;

export interface ProjectValidationInput {
  name: string;
  slogan: string;
  description: string;
  images: string[];
  status: 'draft' | 'review' | 'published';
}

export interface EventValidationInput {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  isNew?: boolean;
}

export interface ResourceNeedValidationInput {
  details: string;
  verticals: string[];
}

const countImages = (images: string[] | undefined): number =>
  (images || []).filter((img) => typeof img === 'string' && img.trim().length > 0).length;

export const firstErrorMessage = (errors: FieldErrors): string | null => {
  const first = Object.values(errors)[0];
  return first || null;
};

export const validateProject = (input: ProjectValidationInput): FieldErrors => {
  const errors: FieldErrors = {};
  const name = input.name.trim();

  if (name.length < PROJECT_NAME_MIN) {
    errors.name = `El título es obligatorio (mínimo ${PROJECT_NAME_MIN} caracteres).`;
  }

  if (input.status === 'draft') {
    return errors;
  }

  const slogan = input.slogan.trim();
  if (slogan.length < PROJECT_SLOGAN_MIN) {
    errors.slogan = `El slogan es obligatorio (mínimo ${PROJECT_SLOGAN_MIN} caracteres).`;
  }

  const description = input.description.trim();
  if (description.length < PROJECT_DESCRIPTION_MIN) {
    errors.description = `La descripción es obligatoria (mínimo ${PROJECT_DESCRIPTION_MIN} caracteres).`;
  }

  if (countImages(input.images) < 1) {
    errors.images = 'Añadí al menos una imagen para publicar o enviar a revisión.';
  }

  return errors;
};

export const isListablePublishedProject = (input: ProjectValidationInput): boolean => {
  if (input.status !== 'published') {
    return false;
  }
  return Object.keys(validateProject(input)).length === 0;
};

export const validateEvent = (input: EventValidationInput): FieldErrors => {
  const errors: FieldErrors = {};

  if (input.title.trim().length < EVENT_TITLE_MIN) {
    errors.title = `El título es obligatorio (mínimo ${EVENT_TITLE_MIN} caracteres).`;
  }

  if (input.description.trim().length < EVENT_DESCRIPTION_MIN) {
    errors.description = `La descripción es obligatoria (mínimo ${EVENT_DESCRIPTION_MIN} caracteres).`;
  }

  if (!input.startDate || !input.startTime) {
    errors.startDate = 'La fecha y hora de inicio son obligatorias.';
  } else {
    const start = new Date(`${input.startDate}T${input.startTime}`);
    if (Number.isNaN(start.getTime())) {
      errors.startDate = 'La fecha de inicio no es válida.';
    } else if (input.isNew && start.getTime() <= Date.now()) {
      errors.startDate = 'La quedada tiene que ser en el futuro.';
    }
  }

  return errors;
};

export const validateResourceNeed = (input: ResourceNeedValidationInput): FieldErrors => {
  const errors: FieldErrors = {};
  const details = input.details.trim();

  if (details.length < RESOURCE_DETAILS_MIN) {
    errors.details = `Contá un poco más (mínimo ${RESOURCE_DETAILS_MIN} caracteres).`;
  }

  if (!input.verticals.length) {
    errors.verticals = 'Elegí al menos una vertical.';
  }

  return errors;
};
