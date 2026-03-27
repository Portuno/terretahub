# Conexiones API en Terreta Hub

## Panorama de integraciones reales
Terreta Hub usa una estrategia "frontend ligero + funciones serverless" para integrarse con servicios de IA, voz y descubrimiento SEO.

## Integracion 1: Gemini API
### Endpoint interno
- `POST /api/chat/gemini`

### Flujo
1. Recibe `messages` y `context`.
2. Construye `liveContext` desde Supabase (`projects`, `events`, `blogs`).
3. Selecciona system prompt segun contexto (`default|docs|fallas`).
4. Llama `gemini-2.0-flash:generateContent`.
5. Devuelve `text` para render en chat.

### Riesgos y control
- Riesgo de respuesta no grounded -> mitigado con contexto vivo y reglas de prompt.
- Riesgo de error de proveedor -> retorno de errores estructurados.

## Integracion 2: ElevenLabs Speech-to-Text
### Endpoint interno
- `POST /api/elevenlabs/transcribe`

### Flujo
1. Recibe audio en base64.
2. Crea `FormData` y reenvia a ElevenLabs STT.
3. Devuelve `text` transcrito.

### Riesgos y control
- Payload pesado o invalido -> validacion y error 400.
- API key ausente -> error 500 controlado.

## Integracion 3: Sitemap dinamico
### Endpoint interno
- `GET /api/sitemap`

### Fuentes de URLs
- rutas estaticas
- `blogs` publicados
- `projects` publicados
- `link_bio_profiles` publicados
- `agora_posts`
- `torre_seo_pages` publicadas

### Valor
Centraliza descubrimiento SEO con datos vivos, evitando sitemap estatico desactualizado.

## Contratos tecnicos sugeridos
1. Esquema de request/response versionado por endpoint.
2. Timeouts y retries definidos por integracion.
3. Logging con correlation id para trazabilidad punta a punta.
4. Limites de cuota y alertas de costo por proveedor.

## Patrón de integracion recomendado
- Mantener adaptadores en `api/*` como capa anti-lock-in.
- Evitar llamadas a terceros directamente desde UI para llaves sensibles.
- Establecer fallback behavior por endpoint critico.

## Backlog de robustez
- Circuit breaker para fallos repetidos de proveedor.
- Cache selectiva para respuestas no sensibles.
- Dashboards de salud y latencia por integracion.
