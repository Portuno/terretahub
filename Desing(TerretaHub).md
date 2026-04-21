# Desing(TerretaHub)

## 1) Identidad del proyecto
- **Nombre:** Terreta Hub
- **Tagline:** Epicentro digital del ecosistema emprendedor y creativo de Valencia.
- **Propósito:** centralizar comunidad, recursos, eventos, proyectos y contenido en un solo hub operativo.
- **Estado:** activo, con base funcional en producción/evolución continua.
- **Propiedad:** Versa Producciones.

## 2) Problema que resuelve
Terreta Hub elimina la fragmentación de información y acciones en comunidades emprendedoras. En vez de múltiples destinos desconectados, ofrece un punto único para:
- descubrir actividades y eventos,
- conectar con miembros y talento,
- publicar y seguir proyectos,
- consumir contenido útil (blogs/recursos),
- ejecutar acciones rápidas (ejemplo: QR y herramientas de apoyo).

## 3) Audiencias objetivo
- **Miembros:** usuarios registrados que participan activamente.
- **Exploradores:** usuarios sin sesión que descubren contenido público.
- **Administración:** usuarios con rol admin para moderación y gestión de recursos.

## 4) Propuesta de valor
- **Conector de talento:** facilita conexiones entre perfiles con intereses complementarios.
- **Showcase de innovación:** visibiliza proyectos locales.
- **Centro de quedadas/eventos:** organiza y distribuye agenda comunitaria.
- **Motor de crecimiento:** reúne herramientas y contenido accionable.
- **Comunidad viva:** fomenta conversación, feedback y colaboración.

## 5) Núcleos funcionales actuales
- **Landing / Exploración:** acceso rápido a recorridos principales.
- **Comunidad:** Ágora, Miembros y secciones sociales.
- **Proyectos:** publicación, gestión por fases/categorías y visibilidad pública.
- **Eventos:** listados y detalle de quedadas/eventos.
- **Blogs/Contenido:** publicaciones y lectura de artículos.
- **Herramientas:** generador de QR y utilidades específicas.
- **Onboarding:** controla estado inicial con `onboarding_completed` en perfil.
- **Link Bio público:** presencia externa de cada usuario.

## 6) Módulos y dominios del producto
- **Core social:** Ágora, comunidad, miembros, proyectos destacados.
- **Gestión de identidad:** auth + perfil extendido.
- **Contenido SEO:** páginas indexables y publicaciones públicas.
- **Verticales internos:** módulos de dominio (ej. Fallas, Biblioteca/Torre, etc.).
- **Integraciones IA/voz:** chat contextual y transcripción.

## 7) Stack tecnológico real
### Frontend
- React 19
- TypeScript
- Vite 6
- React Router DOM 6
- TailwindCSS 3
- Lucide React

### Backend / Runtime
- Vercel Functions (`api/*`) para lógica serverless
- API interna de avatar (`avatar-api`) desacoplada/reutilizable

### Datos y autenticación
- Supabase (`@supabase/supabase-js`)
- PostgreSQL + RLS
- Supabase Auth para sesión

### Observabilidad
- Vercel Analytics
- Vercel Speed Insights

### IA y voz
- Gemini (chat contextual)
- ElevenLabs STT (speech-to-text)

## 8) Arquitectura de aplicación (alto nivel)
- **Shell principal:** enrutamiento, sesión y gate de onboarding.
- **Dashboard:** contenedor de navegación y experiencia.
- **Capa de datos:** acceso a Supabase desde cliente y funciones.
- **Capa de integración:** endpoints serverless como anti-lock-in de proveedores.
- **Capa SEO dinámica:** sitemap alimentado por datos vivos.

## 9) Base de datos y autenticación (Supabase)
### Flujo de autenticación observado
1. Validación de sesión persistida.
2. Carga de perfil asociado (`profiles`) con timeout y reintentos.
3. Manejo de cambios de estado auth (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`).
4. Evita logout forzado si hay sesión válida pero falla la lectura de perfil.

### Entidades detectadas
- `profiles`
- `projects`
- `events`
- `blogs`
- `link_bio_profiles`
- `agora_posts`
- `torre_seo_pages`

Además se infieren relaciones para likes, comentarios, notificaciones, asistencia y follow.

### RLS y permisos
- RLS confirmada en al menos `torre_seo_pages`.
- Política pública para lectura de `published`.
- Riesgo principal: divergencia entre permisos UI (`isAdmin`) y enforcement real en DB.

## 10) Integraciones API (contratos internos)
### 10.1 Chat IA con Gemini
- **Endpoint:** `POST /api/chat/gemini`
- **Entrada:** `messages`, `context`
- **Lógica:** compone contexto vivo con datos de Supabase, selecciona prompt por contexto y genera respuesta.
- **Salida:** `text` para render en UI.

### 10.2 Transcripción con ElevenLabs
- **Endpoint:** `POST /api/elevenlabs/transcribe`
- **Entrada:** audio base64
- **Lógica:** transforma payload a `FormData`, reenvía a STT.
- **Salida:** texto transcrito.

### 10.3 Sitemap dinámico
- **Endpoint:** `GET /api/sitemap`
- **Fuentes:** rutas estáticas + blogs/proyectos/perfiles/ágora/SEO pages publicadas.
- **Objetivo:** mantener indexación SEO actualizada automáticamente.

## 11) Avatar API (servicio separado)
- **Rol:** asignar elemento y avatar determinístico por `userId`.
- **Elementos:** `earth`, `water`, `fire`, `air`.
- **Regla:** hash(`userId`) `% 4` para elemento estable.
- **Estilo visual:** hash(`userId + element`) `% cantidadEstilos`.
- **Endpoints clave:** `/health`, `/element/:userId`, `/avatar/:userId`, `/styles`, `/styles/:element`.
- **Seguridad opcional:** `AVATAR_API_KEY` por header o query.
- **Integración con Terreta Hub:** mediante `VITE_AVATAR_API_URL`.

## 12) UX y principios de diseño (baseline v1)
- Claridad de navegación y consistencia de componentes.
- Feedback inmediato en acciones críticas.
- Accesibilidad como criterio transversal (labels, foco, legibilidad).
- Onboarding como puente entre descubrimiento y acción.

## 13) Evolución de producto: v1 -> v2 mobile gamificado
### Objetivo de v2
Transformar el hub en una experiencia mobile-first con progreso visible y loops cortos de valor.

### Fases estratégicas
- **Fase A:** loop base (`acción -> feedback -> recompensa -> siguiente acción`).
- **Fase B:** progreso visible (XP, niveles, streak con protección).
- **Fase C:** economía de recompensas responsable (prioridad cosméticos).
- **Fase D:** eventos temporales + social competitivo/cooperativo.
- **Fase E:** medición y ajuste por evidencia.

### Principios mobile
- Una mano, una acción principal.
- Sesiones de 3-5 minutos con cierre satisfactorio.
- Fricción mínima y feedback comprensible.
- Progreso siempre visible.

## 14) Métricas/KPIs recomendadas
### Retención y frecuencia
- D1, D7, D30 retention
- sesiones por semana

### Salud del loop
- mission completion rate
- time-to-first-completion
- completion by step
- reward claim rate

### Calidad de experiencia
- error rate por flujo
- latencia percibida entre acción y confirmación
- impacto de notificaciones (CTR, reingreso con valor, unsubscribe rate)

## 15) Seguridad y compliance
### Superficies críticas
- autenticación y sesiones
- políticas RLS y permisos por tabla
- endpoints serverless con secrets
- contenido público indexable

### Baseline recomendado
- deny-by-default en RLS
- secretos fuera del repo y rotación
- sanitización de payloads y logs
- manejo de errores sin fuga de detalle interno
- auditoría de cambios de esquema/permisos

### Operación de incidentes
Detección -> contención -> impacto -> comunicación -> remediación -> aprendizaje.

## 16) Workflow operativo del equipo (6 pasos)
1. Ideación
2. Contextualización
3. Diseño de solución
4. Ejecución incremental
5. Validación funcional + permisos + integraciones
6. Iteración basada en evidencia

Artefactos mínimos por iteración: brief, context pack, plan ejecutable, evidencia de validación, registro de decisiones.

## 17) Estructura y componentes de repo (macro)
- `components/`: UI y features
- `context/`: estado global/contextos
- `hooks/`: lógica reutilizable
- `lib/`: utilidades, acceso a servicios, helpers
- `api/`: funciones serverless
- `supabase/`: SQL y migraciones
- `avatar-api/`: servicio desacoplado de avatar
- `Docs/`: documentación de producto, UX, estrategia y evolución

## 18) Variables de entorno relevantes (sin valores)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AVATAR_API_URL`
- claves de proveedor en capa serverless (Gemini/ElevenLabs, según despliegue)
- `AVATAR_API_KEY` (opcional, en avatar-api)

## 19) Scripts de desarrollo relevantes
### Proyecto principal
- `npm run dev`
- `npm run dev:api`
- `npm run build`
- `npm run preview`

### Avatar API
- `npm start`

## 20) Riesgos actuales y prioridades de madurez
- Divergencia permisos UI vs DB (RLS incompleta o inconsistente).
- Escalado funcional sin matriz de autorización central.
- Dependencia de integraciones externas sin observabilidad profunda.
- Necesidad de contratos tipados y versionado explícito en integraciones/prompts.

## 21) Oportunidades de mejora inmediata
- Formalizar matriz `acción x rol x recurso`.
- Tests automáticos de permisos RLS.
- Logging con correlation ID en endpoints críticos.
- Dashboards de salud por integración externa.
- Gobernanza de releases con checklist de seguridad por cambio de alto impacto.

## 22) Resumen ejecutivo final
Terreta Hub ya funciona como un producto/plataforma con base técnica sólida (React + Supabase + serverless) y propuesta clara para la comunidad valenciana. El siguiente salto no es rehacer el stack: es consolidar madurez operativa (seguridad, permisos, observabilidad, métricas) y ejecutar la transición v1->v2 mobile gamificada con foco en progreso visible, baja fricción y valor rápido por sesión.
