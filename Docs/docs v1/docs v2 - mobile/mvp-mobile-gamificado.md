# MVP Mobile Gamificado (prioridad)

## Meta del MVP
Construir un ciclo de valor que el usuario entienda y complete rápido:
misión corta -> feedback inmediato -> recompensa visible -> siguiente acción útil.

El MVP no intenta “gamificar todo”. Intenta que el sistema gamificado sea confiable, justo y repetible.

## Alcance MVP (lo mínimo viable que funciona)
### 1) Misiones
- 1-3 misiones diarias máximo por usuario.
- Duración objetivo por misión: 3-5 minutos.
- Misión con pasos (checklist) para que el usuario sienta progreso durante el loop.

### 2) Validación y completitud
- Validación clara de “cumplí / no cumplí” con reglas simples.
- La recompensa solo se entrega cuando la misión queda en estado “completada”.
- Si hay validación pendiente, mostrar estado “validando…” y no resetear el progreso.

### 3) Progreso visible
- XP acumulado.
- Nivel con unlocks cosméticos.
- Streak diario con streak shield de 1 día (ver `progression-system.md`).

### 4) Recompensas (cosméticas por defecto)
- Badges/marcos/tema para perfil.
- Entrega de recompensa con resumen del loop (“completaste X, ganaste Y”).

### 5) Onboarding / primeras misiones
- Al completar el onboarding (o al primer inicio post-login), asignar una primera misión de bajo esfuerzo.
- Asegurar que el usuario obtenga la primera recompensa temprano.

## Milestones de implementación
1. **Mission UI + modelo mental**  
   Presentar misiones diarias con checklist, estado de misión y llamada a la acción principal (“Empezar/Continuar/Completar”).
2. **Estado del loop completo**  
   Registrar pasos, validar completitud y mostrar feedback de cierre con XP.
3. **Progreso visible end-to-end**  
   Implementar XP, nivel, streak y reclamar recompensa al completar.
4. **Recompensas cosméticas de prueba**  
   Agregar 3-5 recompensas (badges/marcos/temas) para validar percepción y motivación.
5. **Métricas y iteración**  
   Instrumentar eventos: tiempo a primera misión completada, completitud por tipo, abandono por etapa y salud de streak.

## KPIs de éxito (para saber si el MVP “pega”)
- **D1 retention**: porcentaje que vuelve al día siguiente.
- **D7 retention**: señal de que el loop se vuelve rutina.
- **Mission Completion Rate**: completadas / misiones activas.
- **Time-to-First-Completion**: tiempo hasta primera misión completada desde el inicio.
- **Streak pass rate**: porcentaje que mantiene racha con shield.
- **Reclamo de recompensa**: recompensas reclamadas / misiones completadas.
- **Notificaciones opt-out rate**: si hay push, tasa de desuscripción por tipo.

## Anti-regresiones (criterios de “no romper”)
- La recompensa no debe “desaparecer” después de completarla.
- La misión no debe quedar trabada en validación sin recuperación.
- El usuario debe poder entender por qué no completó una misión (si aplica).

## Qué se deja para después (fuera de MVP)
- Eventos grandes, temporadas y battle pass con capas complejas.
- Social profundo (co-op avanzado, leaderboards extensos).
- Economía con moneda dura y boosters con impacto fuerte.

