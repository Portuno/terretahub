# Contexto de esquema — Terreta Hub

Fecha de lectura del repo: 14 de noviembre de 2026. Commit: `eff07d502057db95d900ba287fb40f041da5f902`.

Este archivo describe tablas y columnas que aparecen en el SQL versionado. No es un volcado de producción. Si el cliente TypeScript lee una columna que aquí no está, está marcada como deriva: no hay que tratarla como garantizada ni inventar un backfill.

Las migraciones se aplican a mano. No se editan los SQL ya existentes. La próxima migración es un archivo nuevo en `supabase/migrations/`.

## Dónde está el SQL

- Serie numerada, trackeada, de `supabase/01_initial_schema.sql` a `supabase/37_create_events.sql`. No hay `09` ni `19`.
- Números duplicados, los dos archivos existen: `02_add_cv_support.sql` y `02_add_profile_publishing.sql`; `11_add_feedback_messages.sql` y `11_optimize_rls_policies.sql`; `12_alter_feedback_messages_username.sql` y `12_create_resource_needs.sql`.
- `supabase/001_torre_seo_pages.sql` y `supabase/38_create_totes_system.sql` están en el disco. `38` está ignorado por `.gitignore` (`supabase/*`) y no forma parte del commit. No uses ese archivo como fuente.
- Serie con fecha, que sí es la vía para cambios nuevos: `supabase/migrations/20260910_phase1_content_integrity.sql`, `20260912_phase0_archive_invalid_projects.sql`, `20260917_directory_schema.sql`, `20261002_agora_like_count_triggers.sql`.
- `Docs/sql/` repite parte de esa serie. La fuente de verdad es `supabase/migrations/`.

## Dos agendas

- `events` + `event_attendances`: quedadas creadas por miembros, con inscripción. Rutas `/eventos` y `/evento/:username/:slug`.
- `directory_events`: citas curadas del directorio. No tienen inscripción. Ruta `/directorio/evento/:id`.
- `directory_zones` es el vocabulario de zona. No existe una columna de texto `zona`.

## Tablas y columnas que el SQL define

### profiles

`01_initial_schema.sql`: `id` (FK a `auth.users`), `name`, `username` único, `email` único, `avatar`, `created_at`, `updated_at`.

Después: `role` (`normal` | `admin`, default `normal`) en `05_add_user_roles.sql`. `show_in_community` boolean default true en `10_add_community_visibility.sql`.

Select del cliente que no está en el SQL: `onboarding_completed`, `element`. Deriva. No agregarlas en una migración de estos bloques.

### link_bio_profiles

`01`: `id`, `user_id`, `username`, `custom_slug`, `is_published` default false, `display_name`, `bio`, `avatar`, `socials` jsonb, `blocks` jsonb, `theme` jsonb, `created_at`, `updated_at`. Únicos `(user_id, username)` y `custom_slug`.

`02_add_cv_support.sql` agrega `cv_url`. `02_add_profile_publishing.sql` vuelve a agregar `custom_slug` e `is_published` si faltan.

El link público es `/p/:extension`.

### agora_posts

`01`: `id`, `author_id`, `content`, `created_at`, `updated_at`.

`34_add_agora_media_support.sql`: `image_urls` text[], `video_url`, `link_url`. Tope 4 imágenes; si hay video, tope 3.

No hay `zone_id` ni `community_id`. La cercanía solo puede salir de `user_directory_prefs.zone_id` del autor, si el usuario la guardó.

### agora_comments

`01`: `id`, `post_id`, `author_id`, `content`, `created_at`, `updated_at`.

### projects

`01`: `id`, `author_id`, `name`, `slogan`, `description`, `images` text[], `video_url`, `categories` text[], `technologies` text[], `phase` (`Idea` | `MVP` | `Mercado Temprano` | `Escalado`), `status` (`draft` | `review` | `published`), `created_at`, `updated_at`.

`06_add_website_to_projects.sql`: `website`.

`20260912_phase0_archive_invalid_projects.sql`: `archived_at`.

`slogan` es la frase corta. No hay `busca_colaboradores`. `need_summary` tampoco: se agrega en una migración nueva, nullable, sin backfill. «Busca colaboradores» se deriva de que `need_summary` tenga texto.

El envío a revisión escribe `status = 'review'` (`ProjectEditor`). Un trigger avisa al autor cuando pasa a `published` o vuelve de `review` a `draft`.

No hay columna `slug`. La URL `/proyecto/:slug` se calcula en el cliente con `getProjectSlug(name, id)`.

Validación en `20260910`: para `review` o `published`, slogan de al menos 8 caracteres, descripción de al menos 40, al menos una imagen.

### events

`37_create_events.sql`: `id`, `organizer_id`, `title`, `description`, `location`, `location_url`, `start_date`, `end_date`, `image_url`, `category`, `is_online` default false, `max_attendees`, `registration_required` default true, `status` (`draft` | `review` | `published` | `cancelled` | `completed`) default `draft`, `created_at`, `updated_at`.

El formulario actual (`EventModal`) inserta `status: 'draft'` y el texto de la interfaz dice que quedó en revisión. El panel de admin lista `draft`. El estado que hay que repetir al crear es `draft`, no `published`.

`20260910` exige título de al menos 3 caracteres, descripción de al menos 20, y en el insert `start_date` en el futuro.

Deriva que el cliente ya lee o escribe y el SQL versionado no crea: `slug`, `admission_type`, `attendee_question`, `date_public`, `date_placeholder`, `duration_minutes`, `location_public`, `location_placeholder`, `latitude`, `longitude`. No recrear esas columnas en los bloques nuevos. `zone_id` y `venue_setting` sí son nuevas, nullable, sin backfill.

### event_attendances

`37`: `id`, `event_id`, `user_id`, `status` (`registered` | `attended` | `cancelled`) default `registered`, `registered_at`. Único `(event_id, user_id)`.

Deriva: el cliente también usa `pending`. El check del SQL de `37` no incluye `pending`. No cambiar ese check en estos bloques.

`20260910` impide postular si `events.end_date` ya pasó.

### directory_zones

`id` smallint PK, `name`, `centroid_lat`, `centroid_lon`, `updated_at`.

### directory_subzones

`id`, `zone_id`, `idx` 1–6, `name`, `centroid_lat`, `centroid_lon`, `updated_at`. Único `(zone_id, idx)`.

### directory_entities

`id` text, `name`, `tipo` (`fisica` | `juridica`), `ambito` (`ciudad` | `producto`), `cats` text[], `rol`, `org`, `description`, `url`, `tags` text[], `datos` jsonb, `soc` jsonb, `rel` text[], `dir`, `geo_precision` (`sede` | `calle` | `barrio`), `zone_id`, `subzone_id`, `lat`, `lon`, `conf` (`V` | `E` | `A`), `flag`, `fuentes` text[], `estado`, `notas`, `orden`, `visibility` (`published` | `hidden`), `source_updated_at`, `updated_at`.

Comunidades del MCP: `tipo = 'juridica'` y `visibility = 'published'`. No hay tabla de grupos. `/grupos` sigue en próximamente.

### directory_events

Misma forma geográfica que las entidades, más `ini` date, `fin` date, `lugar`, `recurrente`. Sin inscripción.

### user_directory_prefs

`user_id` PK, `interest_tags` text[], `seeking` text[], `focus_mode` (`focus` | `explore`), `zone_id`, `consent_personalization`, `consent_email_alerts`, `email_alerts_stub`, `onboarding_skipped`, `onboarding_completed_at`, `updated_at`.

### user_directory_flags

`id`, `user_id`, `target_type` (`entity` | `event`), `target_id`, `flag` (`saved` | `interested` | `contacted`), `created_at`.

### notifications

`07`: `id`, `user_id`, `type` (`comment` | `project_approved` | `project_rejected`), `title`, `message`, `related_id`, `related_type`, `is_read`, `created_at`.

`36_add_mention_notifications.sql` amplía el tipo con `mention`. Son avisos de una acción, no un resumen para volver mañana.

### profile_views y link_clicks

`08_create_analytics.sql`. Vistas y clics del link in bio, con `device_type`. No miden publicar, inscribirse ni abrir el chat.

### resource_needs

Estado final de `30_recreate_resource_needs_clean.sql`: `id`, `user_id`, `verticals` text[], `format_tags` text[], `details`, `created_at`.

Es L'Almoina (`/recursos`), no la necesidad de un proyecto. `26` y `27` agregan y luego simplifican columnas; el recreate posterior deja el esquema de arriba. RLS reabierta en `31`–`33`. No usar esta tabla como ficha de proyecto.

### feedback_messages y contact_messages

`11_add_feedback_messages.sql`, alterada por `12_alter_feedback_messages_username.sql` y `13_drop_name_from_feedback_messages.sql`. `04_create_contact_table.sql` crea `contact_messages`. No entran en los bloques móviles ni en el MCP.

### torre_seo_pages

`supabase/001_torre_seo_pages.sql`. Contenido SEO de la Torre. Fuera de estos bloques.

## Tablas que el cliente usa y el SQL versionado no crea

El código lee o escribe estas relaciones. No están en un `CREATE TABLE` versionado, así que son deriva, no contrato de estos bloques:

- `agora_post_likes`, `agora_comment_likes` (`hooks/useLikes.ts`). `20261002_agora_like_count_triggers.sql` asume likes, no crea la tabla.
- `agora_polls`, `poll_votes`.
- `blogs` y `blog_likes`.
- `referrals` (`lib/eventUtils.ts`).
- `follows`.
- Tablas del sistema de Terris, solo en el `38` no trackeado.

`get_community_profiles` y `get_agora_feed` son RPC. `get_community_profiles` filtra `show_in_community = true`. En `35` la función es `SECURITY DEFINER`. El MCP puede llamarla. No se crean funciones `SECURITY DEFINER` nuevas.

## Personas

`/miembros` lista perfiles con `show_in_community = true`. No es un directorio de todos los `profiles`. `buscar_personas` tiene que usar ese opt-in o un link bio con `is_published = true`.

No hay columnas de habilidades ni de disponibilidad. Si el filtro llega, se devuelve como faltante. No se rellena.

## Lo que estos bloques agregan

Solo en archivos nuevos de `supabase/migrations/`, sin rellenar filas viejas:

- `events.zone_id` nullable hacia `directory_zones`.
- `events.venue_setting` nullable, `interior` o `exterior`.
- `projects.need_summary` text nullable.
- Índice GIN de texto en español sobre `agora_posts.content` y sobre nombre, slogan y descripción de `projects`.
- `mcp_audit`.
- `mcp_proposals`.
- `chat_sessions` y `chat_messages`.
