# Directorio València — dataset curado

Fuente original: `/home/lautaro/Escritorio/terreta-claude/` (export Claude, 14 sep 2026).

## Archivos

- `terreta-hub-dataset.json` — SSOT: 294 personas/entidades + 150 citas.
- `terreta-personas.csv` / `terreta-eventos.csv` — exportación tabular para auditoría.
- `directorio-valencia.md` — resumen del artefacto.
- `reference/terreta-mapa-leaflet.html` — referencia UX del mapa. No se sirve en producción ni se copia su marca.

## Leyendas (no negociar)

- `conf`: `V` verificado en fuente pública · `E` ecosistema conocido, refrescar · `A` ampliar/contrastar.
- `geo`: `sede` dirección exacta · `calle` aproximado por calle · `barrio` aproximado por barrio.
- En UI nunca presentar `calle` o `barrio` como dirección exacta.
- `ambito`: `ciudad` vs `producto` (Versa, VibeHack, El Fotográpher, Base44, etc.).
- Rejilla SSOT: claves `0`–`6` del JSON (`Fora de la rejilla` + 6 zonas × 6 subzonas). No inventar subdivisiones ni fichas. A08/H3 queda pendiente.

## Setup + import

1. Aplicá en el SQL Editor de Supabase (si aún no están):
   - `Docs/sql/20260910_phase1_content_integrity.sql`
   - `Docs/sql/20260912_phase0_archive_invalid_projects.sql`
   - `Docs/sql/20260917_directory_schema.sql` (también en `supabase/migrations/`)
2. Importá el dataset:

```bash
npm run import:directory
```

Usa `SUPABASE_URL` (o `VITE_SUPABASE_URL`) + `SUPABASE_SERVICE_ROLE_KEY`. Nunca commitear la service role.
