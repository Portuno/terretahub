# BBDD y Auth en Terreta Hub (Supabase)

## Arquitectura de identidad
Terreta Hub usa Supabase Auth como base de sesion y tabla `profiles` para atributos de aplicacion (nombre, username, avatar, rol, onboarding).

## Flujo real de autenticacion (segun `App.tsx`)
1. `supabase.auth.getSession()` valida sesion persistida.
2. Si existe sesion, se carga `profiles` con timeout + retries.
3. `onAuthStateChange` gestiona `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`.
4. Si falla perfil pero sesion sigue viva, se evita logout forzado.
5. `storageKey` dedicado: `terretahub-auth`.

## Tablas y entidades detectadas en codigo
- `profiles`
- `projects`
- `events`
- `blogs`
- `link_bio_profiles`
- `agora_posts`
- `torre_seo_pages`

Ademas, tipos y flujos sugieren entidades asociadas para likes, comentarios, notificaciones, asistencia a eventos y relaciones de follow.

## Caso especial: Torre SEO pages
En `supabase/001_torre_seo_pages.sql`:
- `slug` unico
- `title`, `meta_description`
- `content` en `jsonb`
- `status` (`draft|published`)
- trigger para `updated_at`
- RLS habilitado

Politicas incluidas:
- lectura publica solo `published`
- acceso autenticado amplio para gestion

## RLS: estado y criterio
### Estado observado
Hay uso explicito de RLS al menos en `torre_seo_pages`, y el proyecto depende de RLS para seguridad de datos.

### Recomendacion de endurecimiento
1. Politicas por ownership en todos los recursos editables.
2. Politicas admin separadas de usuario normal.
3. Bloqueo de `FOR ALL authenticated` en tablas sensibles salvo justificacion.
4. Tests de permisos por tabla y rol antes de release.

## Autorizacion en capa app
`lib/userRoles.ts` usa `role === 'admin'` y helpers `canEdit/canDelete`. Esto es util para UX, pero no sustituye enforcement en DB.

## Riesgos actuales
- Divergencia entre permisos UI y permisos reales de tabla.
- Escalado de features sin matriz de permisos centralizada.
- Consultas lentas por politicas complejas sin observabilidad adecuada.

## Blueprint recomendado
### Nivel 1
- Inventario de politicas por tabla.
- Matriz accion x rol x recurso.

### Nivel 2
- Libreria de funciones SQL de autorizacion reutilizable.
- Tests automatizados de RLS.

### Nivel 3
- Auditoria activa de accesos y alertas por patron anomalo.

## Conclusiones
La base esta bien orientada: Supabase + auth persistente + RLS. El salto de madurez viene de formalizar permisos con la misma calidad con la que hoy se formaliza la UI.
