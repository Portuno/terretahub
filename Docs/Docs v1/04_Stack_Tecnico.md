# Stack Tecnico Real de Terreta Hub

## Stack actual confirmado por codigo
- Frontend: React 19 + TypeScript
- Build/runtime web: Vite 6
- Router: react-router-dom 6
- UI: TailwindCSS 3 + Lucide icons
- Backend edge/serverless: Vercel Functions (`api/*`)
- Datos y auth: Supabase (`@supabase/supabase-js`)
- Observabilidad web: Vercel Analytics + Speed Insights
- IA y voz: Gemini API + ElevenLabs STT

## Por que este stack encaja con Terreta
### React + Vite
Permiten iteracion rapida para un producto con muchas vistas y dominios en expansion. El bundle y DX favorecen ciclos cortos de prueba/aprendizaje.

### Supabase
Unifica auth, Postgres y acceso desde cliente/funciones. Es coherente con la necesidad de lanzar y ajustar features de comunidad sin infraestructura excesiva.

### Vercel Functions
Encapsulan integraciones sensibles (Gemini, ElevenLabs, sitemap dinamico) fuera del cliente. Esto reduce exposicion de llaves y centraliza contratos de salida.

### Tailwind
Mantiene consistencia visual en un sistema con muchos componentes y layouts.

## Arquitectura de aplicacion observada
### Shell
- `App.tsx`: sesion, onboarding gate y routing principal.
- `Dashboard.tsx`: estructura de navegacion y contenedor de experiencia.

### Dominios
- Core social: Agora, Comunidad, Proyectos, Eventos, Blogs.
- Verticales: Fallas, Biblioteca/Torre, Propiedades, QR.

### Integraciones
- Chat IA con contexto vivo (`api/chat/gemini.ts`).
- Transcripcion de voz (`api/elevenlabs/transcribe.ts`).
- SEO/descubrimiento (`api/sitemap.ts`).

## Trade-offs y decisiones
- **SPA extensa**: mucha flexibilidad, pero riesgo de crecimiento desordenado sin convenciones.
- **Auth en cliente + RLS**: rapido de implementar, exige disciplina fuerte en politicas DB.
- **Prompts en archivos JS**: facilita iteracion; dificulta trazabilidad de cambios si no se versiona formalmente.

## Standards recomendados para escalar el stack
1. Contratos tipados por dominio (DTOs y validaciones).
2. Separar claramente data access layer por modulo.
3. Versionado de prompts y politicas de rollback.
4. Telemetria por flujo critico (auth, publicar, registrarse, chat).
5. Matriz de permisos central para UI + DB.

## Conclusiones
El stack no necesita reinvencion. Necesita madurez operativa: observabilidad, governance de permisos y estandares de modulo para sostener la velocidad sin romper confianza.
