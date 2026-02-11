/**
 * Caché en memoria por userId para no recalcular avatar/element/style.
 * En producción puede sustituirse por Redis o DB.
 */

const avatarCache = new Map();
const ELEMENT_CACHE = new Map();
const AVATAR_RESPONSE_CACHE = new Map();

const MAX_ENTRIES = 10000;

function evictOldest(map) {
  if (map.size <= MAX_ENTRIES) return;
  const firstKey = map.keys().next().value;
  if (firstKey !== undefined) map.delete(firstKey);
}

export function getCachedAvatarResponse(userId) {
  return AVATAR_RESPONSE_CACHE.get(userId) ?? null;
}

export function setCachedAvatarResponse(userId, data) {
  evictOldest(AVATAR_RESPONSE_CACHE);
  AVATAR_RESPONSE_CACHE.set(userId, data);
}

export function getCachedElement(userId) {
  return ELEMENT_CACHE.get(userId) ?? null;
}

export function setCachedElement(userId, element) {
  evictOldest(ELEMENT_CACHE);
  ELEMENT_CACHE.set(userId, element);
}
