# Game Loop (acción -> feedback -> recompensa -> siguiente acción)

## Loop principal (diario/semanal)
1. **Presentar la misión**  
   El usuario ve una misión clara (“misión de hoy”) con pasos cortos y recompensa estimada.

2. **Confirmar inicio**  
   Toma el “control” del flujo: botón primario abre los pasos o te lleva a la pantalla necesaria.

3. **Completar pasos**  
   Cada paso tiene un estado:
   - pendiente,
   - en progreso,
   - completado.

4. **Verificar completitud**  
   El sistema valida que se cumplieron condiciones mínimas (ej. “guardó X”, “publicó Y”, “leyó/visitó Z” si aplica).

5. **Feedback con cierre de loop**  
   - qué se completó,
   - cuánta XP se ganó,
   - qué desbloqueo (si aplica),
   - un resumen corto con “siguiente paso”.

6. **Recompensa y transición**  
   La recompensa se entrega y el usuario vuelve a una acción útil:
   - otra misión del día,
   - un reto de la semana,
   - o un “next best action” (según progreso).

## Estados necesarios (para evitar inconsistencias)
- **Misión no iniciada**: el usuario ve descripción, pasos y recompensa estimada.
- **Misión iniciada**: el usuario ve checklist; el sistema registra progreso.
- **Misión lista para reclamar**: “ya cumpliste X, reclamala”.
- **Recompensando**: el sistema entrega XP/recompensas.
- **Completada**: historia visual y opción de continuar.

## Variantes del loop (para diferentes partes del producto)
### Loop “explorar”
- Ver un recurso / sección (ej. `Ágora`, `Miembros`, `Proyectos`).
- Guardar algo o abrir un detalle.

### Loop “crear”
- Completar un flujo de creación (ej. generar QR o crear contenido).
- Confirmar guardado/publicación.

### Loop “invitar / social”
- Aceptar un desafío de amigo o unirse a un equipo.
- Completar una micro-misión compartida.

## Regla de oro: “Recompensa siempre llega”
Si la validación tarda:
- mostrar estado “validando…”,
- mantener al usuario dentro del flujo,
- evitar pérdida de progreso.

