/**
 * Generación de URL de avatar determinística.
 * Por ahora: placeholder vía DiceBear con seed = element + userId (estable y variado por elemento).
 * Preparado para sustituir por IA generativa (prompt desde element + style).
 */

/**
 * Construye la URL del avatar para un usuario.
 * Misma userId + element → misma URL (cacheable).
 * @param {string} userIdOrSeed
 * @param {string} element - earth | water | fire | air
 * @returns {string} URL de imagen (placeholder o futura IA)
 */
export function getAvatarUrl(userIdOrSeed, element) {
  const seed = `${element}-${userIdOrSeed}`.replace(/[^a-z0-9-]/gi, '-');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
