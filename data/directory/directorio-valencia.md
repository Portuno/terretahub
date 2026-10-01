# Directorio València — artefacto vivo

Artefacto: Terreta Hub — https://claude.ai/code/artifact/a18a8409-3477-4cf8-9830-7bcb3bb95e76 Última pasada: 14 sep 2026 · capa cultural (cine, música, arte, videojuegos) + mapa como herramienta

## Contenido

- Personas y entidades: 294 (80 personas físicas)
- Citas de agenda: 150
- Geolocalizadas: 281 de 444
- Con redes sociales: 110 · 297 enlaces
- Con vínculos cruzados: 124

Reparto por dominio: emprendimiento 93 · tecnología 99 · entretenimiento 82 · arte 80 · salud 57 · público 33. Las dos categorías culturales pasaron de ser las más flacas a pesar tanto como el emprendimiento.

## Por qué hay dos mapas

La CSP del artefacto bloquea las teselas de cualquier proveedor, y en esta sesión los registros npm y pip también están cerrados, así que tampoco hay forma de traer geometría vectorial real (Nominatim rechaza por robots.txt; es-atlas, osmnx, cartopy devuelven 403). Comprobado dos veces.

- Artefacto → mapa vectorial dibujado a mano (costa, Túria viejo y cauce nuevo, Albufera, Devesa). Sirve para navegar y filtrar, no para leer calles.
- terreta-mapa-leaflet.html → el mapa de verdad. Teselas CARTO Voyager + OpenStreetMap conmutables, markercluster, buscador, filtros por dominio y por tipo (entidades / personas / citas), rejilla 6×6 clicable, listado lateral de lo visible y popups con dirección, zona, ficha ampliada y redes. Es el que va a terretahub.com, que ya usa Leaflet.

## Precisión de las coordenadas — campo geo

- sede — dirección exacta publicada por la entidad
- calle — derivada del nombre de la calle, ±200 m
- barrio — sólo se conoce el barrio, ±500 m

## Rejilla 6×6

| Zona | Subzonas | Puntos |
|---|---|---:|
| Z1 Ciutat de València | Ciutat Vella · Eixample–Extramurs · Nord · Marítim–Est · Sud · Pobles del Sud | 268 |
| Z2 Paterna | Centre · Parc Tecnològic · Fuente del Jarro · Terramelar · La Canyada · Lloma Llarga–Santa Rita | 5 |
| Z3 Torrent | Centre · El Vedat · Xenillet · Parc Central · Sant Gregori · Mas del Jutge | 1 |
| Z4 Port de Sagunt | Nucli del Port · Parc Sagunt · Alts Forns · Platja–Baladre · Zona industrial · Canet d'en Berenguer | 1 |
| Z5 Castell de Sagunt | Castell · Teatre Romà · Jueria · Centre històric · Estació–Eixample · Camp de Morvedre | 0 |
| Z6 Horta Sud | Paiporta–Picanya · Catarroja–Massanassa–Albal · Alfafar–Benetússer–Sedaví · Xirivella–Quart–Manises · Alaquàs–Aldaia · Silla–Picassent–Beniparrell | 2 |
