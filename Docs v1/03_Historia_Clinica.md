# Historia Clinica de Terreta Hub

## Motivo del documento
Este registro captura la evolucion estructural del sistema: sintomas, diagnosticos, intervenciones y estado actual. No es memoria romantica; es herramienta de continuidad tecnica.

## Fase 0: Fundacion funcional
### Sintoma
Necesidad de lanzar rapido un espacio comunitario con multiples modulos (perfiles, agora, proyectos, eventos, blogs).

### Decision
Arquitectura SPA en React + Vite con Supabase como backend.

### Resultado
Base de producto operativa con velocidad de iteracion alta.

## Fase 1: Fricciones de estado y sesion
### Sintoma
Perdida percibida de sesion por latencia o timeouts al cargar perfil.

### Intervencion
En `App.tsx` se introdujo estrategia de resiliencia:
- timeout controlado por intento
- retries con backoff
- validacion de sesion antes de invalidar usuario
- safety timeout para evitar bloqueo infinito de carga

### Estado
Mejor experiencia de continuidad de usuario bajo condiciones de red imperfectas.

## Fase 2: Fricciones de consulta en Supabase
### Sintoma
Queries lentas/intermitentes en contextos con RLS y agregaciones.

### Intervencion
`lib/supabaseHelpers.ts` agrega:
- deteccion de errores retryables de red
- distincion de errores no retryables
- timeouts adaptativos por tipo de consulta
- batching para consultas grandes por IDs

### Estado
Operacion mas robusta y trazable, menor tasa de fallos abruptos.

## Fase 3: Expansion de dominios verticales
### Sintoma
Necesidad de espacios especializados sin perder identidad de plataforma.

### Intervencion
Layouts/rutas dedicados para:
- `fallas2026/*`
- `biblioteca/*`
- Torre del Semas (`/biblioteca/torre-del-semas`)

### Estado
Escalabilidad por dominios con shared core de autenticacion, navegacion y estilo.

## Fase 4: Capa IA con contexto vivo
### Sintoma
Respuestas de chatbot demasiado genericas o no aterrizadas.

### Intervencion
`api/chat/gemini.ts` construye contexto vivo desde tablas publicadas (`projects`, `events`, `blogs`) y selecciona prompt por contexto (`default`, `docs`, `fallas`).

### Estado
Mejor grounding de respuestas y links accionables a rutas reales.

## Fase 5: SEO programatico para Biblioteca
### Sintoma
Necesidad de generar y publicar paginas SEO editables por contenido.

### Intervencion
- tabla `torre_seo_pages` (SQL manual de Supabase)
- editor en `TorreCreadorPage.tsx`
- visualizador en `TorreSeoPageView.tsx`
- inclusion en sitemap en `api/sitemap.ts`

### Estado
Pipeline editorial SEO operativo con borradores/publicadas y indexacion.

## Deudas clinicas activas
- Dependencia de rol `admin` parcialmente validado en app (debe reforzarse a nivel DB policies por dominio).
- Falta de matriz centralizada de permisos por recurso.
- Falta de versionado formal de prompts en base de datos.
- Falta de checklists automatizados de seguridad pre-release.

## Pronostico
El sistema tiene buena base modular. El siguiente salto no es agregar mas features, sino institucionalizar governance de datos, permisos y decisiones IA con observabilidad continua.
