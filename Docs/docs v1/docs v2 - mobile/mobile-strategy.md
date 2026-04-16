# Mobile Strategy (mobile-first)

## Objetivo mobile-first
Diseñar para que el usuario:
1. Complete “algo” en menos de 3 a 5 minutos.
2. Reciba feedback inmediato (sin pantallas ambiguas).
3. Sienta progreso aunque haga poco (XP/estreak/achievements visibles).

## Principios de diseño para mobile
### 1) Una mano, una acción
- Preferir flujos con una acción principal por pantalla (o por “sección”).
- Botones grandes y consistentes; chips/filters bien espaciados.

### 2) Sesiones cortas con puntos de satisfacción
- La app debe tener “mini-finales”: completar una misión diaria, guardar un recurso, terminar un paso de onboarding.
- El usuario no debería depender de una sesión larga para ver valor.

### 3) Feedback que guía
- Loading con tiempos acotados y explicación clara (“subiendo QR…”, “cargando eventos…”).
- Confirmaciones y errores con intención: qué pasó y el siguiente paso recomendado.

### 4) Progresión visible en todo momento
- Barra/estado de misión actual (ej. “misión de hoy: 1/3”).
- Streak y protección (ver `progression-system.md`) en un lugar siempre accesible en la UI del juego.

### 5) Ritmo UI: fricción mínima
- Evitar modales que interrumpen cuando el objetivo es “hacer”.
- Usar patrones de “confirmación ligera” (snackbars, toasts) para acciones reversibles.

## Arquitectura de pantallas (plantillas)
### Pantalla de misión
- Cabecera: nombre de misión + recompensa estimada (sin prometer de más).
- Cuerpo: checklist de pasos cortos.
- Pie: botón primario (“Empezar” / “Continuar” / “Completar”).

### Pantalla de progreso
- XP actual + nivel + barra hacia el próximo unlock.
- Streak (y estado de escudo).
- Resumen rápido: misiones diarias y semanales.

### Pantalla social (desafío)
- Contexto temporal: “esta semana” / “temporada actual”.
- Acciones: aceptar/desafiar, ver avance propio, ver progreso del rival/equipo.

## Latencia y confiabilidad (mobile real)
- Preferir estados locales optimistas cuando el backend es lento y la acción es reversible.
- Reintentos seguros en cargas (listas, detalles) sin resetear la misión.

## Notas sobre accesibilidad
- Controles con `aria-label`/labels coherentes (iconos no deben ser la única pista).
- Foco visible y navegación por teclado para entornos donde aplique.
- Contraste suficiente en fondos con gradientes/blur.

