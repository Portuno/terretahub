# Notification Strategy (sin spam, con propósito)

## Objetivo
Las notificaciones deben:
- ayudar a completar misiones,
- reenganchar con contexto,
- no romper confianza.

## Regla de oro: “Notificación = acción posible”
Cada notificación debería venir con una intención clara:
- “Tenés una misión disponible en X sección”.
- “Te falta 1 paso para completar la misión de hoy”.
- “Tu recompensa está lista” (o “reclamala antes de…” en eventos).

## Jerarquía de notificaciones (recomendada)
1. **In-app contextual** (preferida)
   - banners dentro de la pantalla relevante,
   - toasts para confirmaciones de loop.
2. **Push** (siguiente)
   - para momentos de abandono (cuando el usuario no entra).
3. **Email/SMS** (solo si el producto lo necesita)
   - como re-activación excepcional.

## Frecuencia y guardrails
- Límite por día (definirlo desde diseño).
- En eventos, subir intensidad solo durante ventanas cortas.
- Respetar “silencio” del usuario (opt-out por tipo).
- Evitar “recuerdo constante” de misiones no completadas: mejor proponer una alternativa.

## Triggers inteligentes (ejemplos)
- A tiempo para completar: antes del fin de la ventana diaria.
- Si el usuario completó parcialmente: “te falta 1 paso”.
- Si un usuario no entra: reenganche con una misión nueva, no con el mismo contenido repetido.
- Si un amigo te desafía o acepta: notificación social con resumen.

## Reenganche con degradación saludable
Cuando no hay actividad:
1. Notificación útil (“misión nueva en 3 min”).
2. Si no responde, bajar frecuencia y cambiar el tipo de misión.
3. Si persiste, parar push y volver a in-app cuando abra la app.

## Métrica operacional
Antes de escalar:
- revisar CTR,
- revisar tasa de desuscripción,
- medir retención de usuarios expuestos vs no expuestos.

