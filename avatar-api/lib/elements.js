/**
 * Asignación determinística de elemento a partir de userId/seed.
 * Hash del identificador módulo 4 → earth | water | fire | air.
 * Misma entrada → mismo elemento (estable, no elegible por el usuario).
 */

const ELEMENTS = ['earth', 'water', 'fire', 'air'];

/**
 * Hash simple y estable: convierte string a número entero.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    h = (h << 5) - h + char;
    h = h & h;
  }
  return Math.abs(h);
}

/**
 * Asigna un elemento fijo para un userId (o cualquier seed).
 * @param {string} userIdOrSeed - UUID o identificador único
 * @returns {'earth'|'water'|'fire'|'air'}
 */
export function getElementForUser(userIdOrSeed) {
  if (!userIdOrSeed || typeof userIdOrSeed !== 'string') {
    return 'earth';
  }
  const index = hashString(userIdOrSeed) % ELEMENTS.length;
  return ELEMENTS[index];
}

export { ELEMENTS };
