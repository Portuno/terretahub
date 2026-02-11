/**
 * Estilos visuales por elemento.
 * El estilo concreto para un usuario se deriva de hash(seed + element) → índice.
 * Así el estilo es "cifrado" (no elegible) pero determinístico.
 */

import { hashString } from './elements.js';

const STYLES_BY_ELEMENT = {
  earth: [
    { id: 'earth_terracotta', name: 'Terracotta', element: 'earth', palette: ['#8B4513', '#D2691E', '#F4A460'], promptDescription: 'Warm clay, amber, organic textures' },
    { id: 'earth_forest', name: 'Bosque', element: 'earth', palette: ['#2C3328', '#556B2F', '#8FBC8F'], promptDescription: 'Deep forest, moss, roots' },
    { id: 'earth_sand', name: 'Arena', element: 'earth', palette: ['#C2B280', '#DEB887', '#F5DEB3'], promptDescription: 'Sand, stone, desert warmth' },
    { id: 'earth_clay', name: 'Arcilla', element: 'earth', palette: ['#A65D46', '#D4B896', '#EBE5DA'], promptDescription: 'Clay, ceramic, handcrafted' },
  ],
  water: [
    { id: 'water_ocean', name: 'Océano', element: 'water', palette: ['#1e3a5f', '#4a90d9', '#87ceeb'], promptDescription: 'Deep ocean, waves, aquamarine' },
    { id: 'water_ice', name: 'Hielo', element: 'water', palette: ['#e0f4fc', '#b0e0e6', '#7eb8d4'], promptDescription: 'Ice, frost, crystalline' },
    { id: 'water_rain', name: 'Lluvia', element: 'water', palette: ['#4682b4', '#6a9fb5', '#b0c4de'], promptDescription: 'Rain, mist, soft grey-blue' },
    { id: 'water_spring', name: 'Manantial', element: 'water', palette: ['#20b2aa', '#48d1cc', '#afeeee'], promptDescription: 'Spring water, clear, fresh' },
  ],
  fire: [
    { id: 'fire_ember', name: 'Brasa', element: 'fire', palette: ['#8b0000', '#dc143c', '#ff6347'], promptDescription: 'Embers, coal, dark red' },
    { id: 'fire_sunset', name: 'Atardecer', element: 'fire', palette: ['#ff4500', '#ff8c00', '#ffd700'], promptDescription: 'Sunset, orange, golden' },
    { id: 'fire_flame', name: 'Llama', element: 'fire', palette: ['#b22222', '#ff6b35', '#ffb347'], promptDescription: 'Flame, dynamic, warm' },
    { id: 'fire_volcano', name: 'Volcán', element: 'fire', palette: ['#2d1b1b', '#8b4513', '#cd5c5c'], promptDescription: 'Lava, magma, raw power' },
  ],
  air: [
    { id: 'air_sky', name: 'Cielo', element: 'air', palette: ['#87ceeb', '#b0e0e6', '#e0ffff'], promptDescription: 'Clear sky, clouds, light' },
    { id: 'air_wind', name: 'Viento', element: 'air', palette: ['#e8e8e8', '#a9a9a9', '#708090'], promptDescription: 'Wind, motion, silver grey' },
    { id: 'air_dawn', name: 'Alba', element: 'air', palette: ['#ffefd5', '#ffdab9', '#f0e68c'], promptDescription: 'Dawn, soft yellow, pastel' },
    { id: 'air_storm', name: 'Tormenta', element: 'air', palette: ['#2f4f4f', '#696969', '#a9a9a9'], promptDescription: 'Storm clouds, dramatic grey' },
  ],
};

/**
 * Obtiene el estilo visual asignado para un usuario (determinístico).
 * @param {string} userIdOrSeed
 * @param {string} element - earth | water | fire | air
 * @returns {object} estilo con id, name, element, palette, promptDescription
 */
export function getStyleForUser(userIdOrSeed, element) {
  const styles = STYLES_BY_ELEMENT[element];
  if (!styles || styles.length === 0) return null;
  const combined = `${userIdOrSeed}:${element}`;
  const index = hashString(combined) % styles.length;
  return styles[index];
}

/**
 * Lista todos los estilos (opcionalmente filtrados por elemento).
 * @param {string} [element] - earth | water | fire | air
 * @returns {object[]}
 */
export function listStyles(element) {
  if (element && STYLES_BY_ELEMENT[element]) {
    return [...STYLES_BY_ELEMENT[element]];
  }
  return Object.values(STYLES_BY_ELEMENT).flat();
}

export { STYLES_BY_ELEMENT };
