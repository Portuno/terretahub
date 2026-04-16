# UX Principles (Base)

## 1) Claridad antes que complejidad
El usuario debe entender:
- dónde está,
- qué puede hacer,
- qué pasó después de su acción.

Aplicaciones prácticas:
- Microcopy claro para botones y estados (“Guardar”, “Copiado”, “Cargando…”).
- Jerarquía visual consistente entre secciones (títulos, subtítulos, chips/filters).

## 2) Feedback inmediato y predecible
Cada acción relevante debe tener respuesta rápida:
- Guardar / crear: confirmación clara.
- Error: explicación accionable (qué falló y qué intentar).
- Progreso: estados intermedios (cargando, enviando, subiendo).

## 3) Onboarding como “primer loop”
El onboarding no es un formulario aislado: es el inicio del ciclo de valor del usuario.

Principios:
- Reducir fricción inicial (iniciar con acciones simples).
- Conectar onboarding con acciones del producto (explorar → completar → volver).
- Asegurar que el primer éxito ocurra temprano.

## 4) Accesibilidad desde el día 1
Criterios de diseño:
- Labels y `aria-label` en controles no evidentes (menús, iconos, acciones flotantes).
- Foco visible y navegabilidad por teclado.
- Alternativas de texto para medios (imágenes/avatares).

## 5) Consistencia de patrones de interfaz
Para disminuir carga mental:
- Misma estructura para listas (estado vacío, loading, item).
- Misma lógica para menús (apertura/cierre, overlay, escape con teclado).
- Misma terminología (miembro/explorador, perfil/proyecto/evento).

## 6) Mobile-first de comportamiento (aunque no sea mobile-only aún)
Aunque el diseño final se implemente por plataforma, la intención UX debe soportar:
- operaciones de una mano,
- acciones cortas,
- feedback en menos de 1 segundo cuando sea posible.

Estos principios se “activan” más fuerte en `docs v2 - mobile` con el sistema gamificado.

