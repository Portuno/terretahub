# Visualizacion UI/UX y Anatomia Visual

## Enfoque de experiencia en Terreta Hub
La interfaz debe sentirse cercana, clara y accionable. No se busca "pantalla bonita"; se busca reducir friccion para conectar personas, publicar contenido y activar colaboraciones.

## Estructura visual del producto
### Shell principal
- `Dashboard.tsx` define layout base con `Sidebar`, navbar contextual y area de contenido.
- El titulo de pagina cambia por ruta y da orientacion inmediata de contexto.

### Vistas de contenido
- Core social: Agora, Comunidad, Proyectos, Eventos, Blogs.
- Verticales: Fallas, Biblioteca/Torre, Propiedades, QR.

## Patrones UI relevantes observados
- Tarjetas con borde y fondo consistente (`border-terreta-border`, `bg-terreta-card`).
- Tipografia con jerarquia serif/sans para identidad.
- CTAs con `text-terreta-accent` para accion principal.
- Estados de carga y vacio explicitos en modulos clave.

## Anatomia recomendada por pantalla
1. Contexto: donde estoy y para que sirve esta vista.
2. Accion principal: que puede hacer el usuario ahora.
3. Estado de datos: cargando, vacio, error, contenido.
4. Siguiente paso: link o CTA para avanzar.

## Uso de screenshots en ciclo de desarrollo
### Para diseno
- Capturar referencias por patron (feed, ficha, editor, modal).
- Marcar decisiones: spacing, jerarquia, tono de copy.

### Para QA
- Comparar expected vs implemented por breakpoint.
- Validar estados de error y vacio, no solo happy path.

### Para colaboracion IA
- Adjuntar capturas con objetivo de mejora puntual.
- Pedir cambios concretos por componente y estado.

## Accesibilidad minima esperada
- Botones y controles con `aria-label` cuando aplique.
- Focus visible en elementos interactivos.
- Contraste legible en tema por defecto.
- Navegacion por teclado en rutas y modales criticos.

## Riesgos UX actuales a vigilar
- Inconsistencia de patron entre dominios verticales.
- Sobrecarga de opciones en ciertas vistas.
- Falta de estandar unico para mensajes de error.

## Roadmap visual recomendado
1. Catalogo de componentes UI base con ejemplos reales.
2. Checklist visual por PR (desktop/mobile/estado/error).
3. Matriz de consistencia entre core y verticales.
