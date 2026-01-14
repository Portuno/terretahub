// Utilidades para el Ágora

const MAX_TEXT_LENGTH = 280; // Caracteres antes de truncar

/**
 * Trunca el texto a un máximo de caracteres y agrega "..." si es necesario
 */
export const truncateText = (text: string, maxLength: number = MAX_TEXT_LENGTH): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Verifica si el texto necesita ser truncado
 */
export const shouldTruncate = (text: string, maxLength: number = MAX_TEXT_LENGTH): boolean => {
  return text && text.length > maxLength;
};

/**
 * Formatea tags para mostrar (elimina espacios, convierte a minúsculas)
 */
export const formatTag = (tag: string): string => {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
};

/**
 * Valida y formatea un array de tags
 */
export const formatTags = (tags: string[]): string[] => {
  return tags
    .map(tag => formatTag(tag))
    .filter(tag => tag.length > 0)
    .slice(0, 5); // Máximo 5 tags
};

/**
 * Valida una encuesta
 */
export interface PollValidation {
  ok: boolean;
  error?: string;
}

export const validatePoll = (question: string, options: string[]): PollValidation => {
  if (!question || question.trim().length === 0) {
    return { ok: false, error: 'La pregunta es requerida' };
  }

  if (question.trim().length > 200) {
    return { ok: false, error: 'La pregunta no puede exceder 200 caracteres' };
  }

  if (options.length < 2) {
    return { ok: false, error: 'Debes agregar al menos 2 opciones' };
  }

  if (options.length > 6) {
    return { ok: false, error: 'Máximo 6 opciones permitidas' };
  }

  // Validar que todas las opciones tengan contenido
  for (let i = 0; i < options.length; i++) {
    if (!options[i] || options[i].trim().length === 0) {
      return { ok: false, error: `La opción ${i + 1} no puede estar vacía` };
    }
    if (options[i].trim().length > 100) {
      return { ok: false, error: `La opción ${i + 1} no puede exceder 100 caracteres` };
    }
  }

  return { ok: true };
};

/**
 * Calcula los resultados de una encuesta
 */
export interface PollResult {
  optionIndex: number;
  option: string;
  voteCount: number;
  percentage: number;
}

export const calculatePollResults = (
  options: string[],
  votes: Array<{ option_index: number }>
): PollResult[] => {
  const totalVotes = votes.length;
  
  // Contar votos por opción
  const voteCounts = new Map<number, number>();
  votes.forEach(vote => {
    const count = voteCounts.get(vote.option_index) || 0;
    voteCounts.set(vote.option_index, count + 1);
  });

  // Calcular resultados
  return options.map((option, index) => {
    const voteCount = voteCounts.get(index) || 0;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    
    return {
      optionIndex: index,
      option,
      voteCount,
      percentage
    };
  });
};
