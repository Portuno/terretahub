# HITL en Terreta Hub: la IA ejecuta, el humano decide

## Principio rector
La IA acelera produccion; el humano protege direccion. En Terreta Hub, HITL no es opcional en decisiones con impacto de datos, reputacion o cumplimiento.

## Donde aplica HITL de forma obligatoria
1. Cambios de permisos/autorizacion (roles, RLS, accesos admin).
2. Integraciones externas que procesan datos de usuario.
3. Cambios de prompts que afectan respuestas publicas.
4. Publicacion de contenido sensible o legal.
5. Alteraciones de rutas publicas indexables (SEO/sitemap).

## Roles del modelo HITL
- **IA**: propone implementaciones, resume trade-offs, acelera ejecucion.
- **Human reviewer**: valida criterios de negocio, riesgo y coherencia.
- **Owner final**: aprueba release y asume responsabilidad de impacto.

## Flujo de aprobacion recomendado
1. IA entrega propuesta + supuestos.
2. Reviewer humano revisa evidencia y riesgos.
3. Se decide: aprobar, ajustar o rechazar.
4. Se registra razon de decision para aprendizaje futuro.

## Señales de alerta para bloquear aprobacion
- Falta de evidencia tecnica en decisiones de seguridad.
- Cambios que dependen solo de "funciona en mi maquina".
- Respuestas IA con afirmaciones sin fuente.
- Cambios en auth o datos sin prueba de permisos.

## KPIs de calidad HITL
- Porcentaje de cambios criticos con aprobacion registrada.
- Incidentes post-release por falta de revision.
- Tiempo promedio de revision por nivel de criticidad.
- Ratio de correcciones tempranas vs correcciones en produccion.

## Practica clave
Si la IA acelera mas de lo que la organizacion puede validar, no hay productividad: hay deuda de decision. HITL equilibra velocidad con responsabilidad.

## Evolucion deseada
- Checklists HITL por tipo de cambio.
- Plantilla unica de aprobacion con riesgo/impacto/rollback.
- Auditoria trimestral de decisiones de alto impacto.
