# Plan Master de Terreta Hub

## Norte estrategico
Terreta Hub no es solo una app social. Es una plataforma de coordinacion de talento local con capas de comunidad, contenido, eventos y herramientas verticales (biblioteca, fallas, propiedades, QR). El objetivo es pasar de "hub de interaccion" a "motor de ejecucion comunitaria".

## Vision 3 horizontes
### Horizonte 1 - Consolidacion del Core (0-9 meses)
- Fortalecer Agora, Proyectos, Eventos, Blogs y Comunidad como base de red.
- Reducir friccion de onboarding y publicacion.
- Aumentar densidad de contenido util por usuario activo.

### Horizonte 2 - Plataforma de Dominios (9-24 meses)
- Escalar dominios actuales (`/biblioteca`, `/fallas2026`, `/propiedades`, `/qr`) con contratos comunes de UX, datos y permisos.
- Convertir cada dominio en modulo reutilizable con identidad visual propia y shared core.

### Horizonte 3 - Orquestacion inteligente (24-48 meses)
- Integrar IA como capa de guidance operacional (no solo chat).
- Recomendaciones contextuales por perfil, interes, momento y objetivo.
- Gobernanza de IA y compliance embebidos en el ciclo de release.

## Arquitectura de crecimiento
### Capa producto
- Router central en `App.tsx` como mapa de intencion de negocio.
- Cada ruta publica/privada representa una promesa de valor concreta.

### Capa experiencia
- `Dashboard` + `Sidebar` como shell operativo.
- Dominios con layouts propios (`FallasGuideLayout`, `BibliotecaLayout`, `TorreLayout`) para escalado sin romper cohesion.

### Capa datos
- Supabase como fuente transaccional.
- Contenido publico dinamico indexado por sitemap serverless (`api/sitemap.ts`).

### Capa IA
- Motor conversacional con contexto vivo (`api/chat/gemini.ts` + prompts en `lib`).
- Asistente docs y verticales para reducir curva de descubrimiento de funcionalidades.

## Roadmap tecnico-funcional recomendado
1. **Hardening del Core**: auth resiliente, permisos consistentes, observabilidad de errores.
2. **Contratos por dominio**: tipado y convenciones para nuevos modulos.
3. **Pipeline editorial**: drafts -> review -> published en proyectos/eventos/blogs/Torre SEO.
4. **IA con trazabilidad**: logging de prompts, contexto y decisiones de respuesta.
5. **Governance de plataforma**: checklists HITL para cambios de alto impacto.

## KPIs de direccion
- Tiempo idea -> publicacion.
- Ratio contenido publicado / contenido creado.
- Retencion por dominio (core vs verticales).
- Calidad de descubrimiento (CTR en rutas publicas indexadas).
- Incidentes de permisos o fugas de datos por release.

## Riesgos sistemicos
- Crecer features sin normalizar contratos de datos.
- Multiplicar dominios sin shared standards de UX y seguridad.
- Sobre-depender de IA sin puntos de validacion humana.

## Criterio de exito real
Terreta Hub escala cuando puede lanzar nuevos espacios de valor sin duplicar caos tecnico. El objetivo no es solo tener mas rutas, sino tener mas aprendizaje por iteracion con menos entropia.
