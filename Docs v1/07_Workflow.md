# Workflow Terreta Hub (6 pasos: Ideacion -> Iteracion)

## Objetivo del workflow
Convertir ideas en releases con evidencia, sin perder velocidad. El ciclo define entradas, salida y control HITL por cada etapa.

## Paso 1 - Ideacion
### Entrada
- Problema real de comunidad o dominio vertical.
- Señal de usuario, feedback o brecha operativa.

### Salida
- Brief con objetivo, impacto esperado y no-negociables.

## Paso 2 - Contextualizacion
### Entrada
- Brief inicial.

### Actividades
- Revisar rutas afectadas en `App.tsx`.
- Revisar entidades en `types.ts`.
- Revisar tablas/politicas relacionadas en Supabase docs SQL.

### Salida
- Context pack (producto, tecnica, seguridad, datos).

## Paso 3 - Diseno de solucion
### Actividades
- Definir cambios por capa: UI, logica, datos, integraciones.
- Seleccionar estrategia de rollout.
- Definir criterios de aceptacion.

### Salida
- Plan implementable con riesgos y mitigaciones.

## Paso 4 - Ejecucion
### Actividades
- Implementacion incremental por modulo.
- Mantener contratos de tipos y rutas coherentes.
- Ajustar prompts o funciones API si aplica.

### Salida
- Incremento funcional verificable.

## Paso 5 - Validacion
### Actividades
- QA funcional por ruta.
- QA de permisos (lectura/escritura/edicion/borrado).
- QA de integraciones externas (Gemini, ElevenLabs, sitemap).
- Revision HITL para cambios de alto impacto.

### Salida
- Decision: release, fix inmediato o rollback parcial.

## Paso 6 - Iteracion
### Actividades
- Medir efecto real en uso y estabilidad.
- Registrar aprendizaje en docs vivas.
- Repriorizar backlog por evidencia.

### Salida
- Nueva iteracion con supuestos actualizados.

## Artefactos minimos por iteracion
1. Brief inicial
2. Context pack
3. Plan ejecutable
4. Evidencia de validacion
5. Registro de decisiones y aprendizajes

## Donde suele romperse el flujo
- Saltar contexto y empezar a codificar.
- Validar solo UI y no permisos.
- Cerrar release sin capturar aprendizaje.

## KPI operativos del workflow
- Tiempo idea -> release.
- Porcentaje de release sin hotfix.
- Defectos por capa (UI, datos, auth, integracion).
- Tiempo de recuperacion ante incidentes.
