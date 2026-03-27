# Engine de Prompting de Terreta Hub

## Principio operativo
En Terreta Hub, el prompt no es un texto suelto: es una interfaz de producto. Define tono, limites, enlaces accionables y comportamiento ante ausencia de datos.

## Componentes reales del engine
- `lib/chatPrompt.js`: prompt principal del asistente comunitario.
- `lib/docsChatPrompt.js`: prompt especializado en documentacion.
- `lib/fallasChatPrompt.js`: prompt vertical para Fallas.
- `api/chat/gemini.ts`: ensamblado de contexto y envio al modelo.

## Context injection en produccion
`buildLiveContext()` en `api/chat/gemini.ts` extrae:
- proyectos publicados (`projects`)
- eventos (`events`) con separacion proximos/pasados
- blogs (`blogs`) + username autor

Luego compone lineas con:
- nombre/titulo
- descripcion truncada
- metadata util (fase, categoria, fecha)
- enlace relativo navegable

Esto convierte al asistente de "conversacional general" a "navegacion guiada del producto".

## Contrato de respuesta actual
El prompt principal exige:
- respuestas claras y breves
- enlaces markdown clickeables con rutas internas
- evitar respuestas genericas si hay contexto disponible
- fallback especifico cuando no hay datos inyectados

## Modos de contexto
- `context = default`: usa prompt principal + contexto vivo.
- `context = docs`: usa prompt de documentacion oficial.
- `context = fallas`: usa prompt vertical de Fallas.

## Fortalezas del enfoque actual
1. Grounding en datos reales publicados.
2. Navegabilidad nativa (enlaces a `/proyecto/*`, `/evento/*`, `/blog/*`).
3. Separacion por tipo de asistente sin mezclar tono/alcance.

## Gaps de madurez
- No hay versionado formal de prompt (semver/changelog).
- No hay evaluacion automatizada de calidad de respuestas.
- No hay registro estructurado de prompt + contexto + salida para auditoria.

## Roadmap de mejora del engine
### Fase 1 - Gobernanza
- Registrar version de prompt en cada request.
- Definir tests de regresion conversacional (casos canonicos).

### Fase 2 - Calidad
- Medir precision de enlaces y utilidad percibida.
- Detectar respuestas genericas cuando habia contexto disponible.

### Fase 3 - Seguridad y compliance
- Sanitizar contexto para evitar exposicion de campos no deseados.
- Clasificar intenciones sensibles y forzar respuesta segura.

## Filosofia "vibe + rigor"
El vibe de Terreta (cercania, calor local, utilidad concreta) es una capa de tono. El rigor viene del grounding en datos reales, reglas explicitas y trazabilidad de decisiones del asistente.
