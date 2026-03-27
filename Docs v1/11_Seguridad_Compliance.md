# Seguridad y Compliance de Terreta Hub

## Objetivo
Proteger datos y operaciones sin frenar la velocidad de iteracion. La seguridad debe estar en el flujo diario, no en una fase tardia.

## Superficies criticas del sistema
1. Autenticacion y sesion (`supabase.auth`).
2. RLS y acceso a tablas de contenido/usuario.
3. Endpoints serverless con llaves de terceros.
4. Publicacion de rutas indexables y contenido SEO.

## Controles observados en codigo
- Persistencia de sesion y refresh token en cliente Supabase.
- Manejo de timeouts/retries para fallos de red.
- Endpoints con chequeo de metodo y validaciones basicas.
- RLS habilitado en `torre_seo_pages` con reglas de lectura publica por estado.

## Riesgos actuales a atender
- Permisos de app (`isAdmin`) pueden divergir de enforcement en DB.
- Falta de inventario completo de politicas RLS por tabla.
- Integraciones externas sin matriz formal de data classification.
- Posible fuga de informacion sensible en logs no normalizados.

## Modelo de clasificacion de datos recomendado
- **Publico**: contenido ya publicado (blogs, proyectos publicos).
- **Interno**: metadata operacional sin PII critica.
- **Sensible**: perfiles, emails, relaciones de usuario, actividad privada.
- **Critico**: secretos, tokens, llaves API, datos regulatorios.

## Baseline de controles tecnicos
1. RLS obligatorio por tabla con principio deny-by-default.
2. Secrets fuera de repositorio y rotacion periodica.
3. Sanitizacion de payloads antes de persistencia o logging.
4. Error handling que no exponga detalles internos innecesarios.
5. Auditoria de cambios de schema y permisos.

## Compliance operativo minimo
- Politica de retencion y borrado de datos.
- Proceso para solicitudes de acceso/rectificacion/eliminacion.
- Registro de incidentes y tiempos de respuesta.
- Evidencia de revisiones HITL para cambios de alto impacto.

## Playbook de incidente
1. Deteccion y triage.
2. Contencion inmediata.
3. Analisis de impacto.
4. Comunicacion interna y, si corresponde, externa.
5. Remediacion tecnica.
6. Lecciones aprendidas y cambios preventivos.

## Metricas de seguridad
- MTTD (deteccion) y MTTR (recuperacion).
- Hallazgos criticos abiertos por release.
- Incidentes por categoria (auth, datos, API externa, SEO).
- Porcentaje de cambios criticos con checklist completo.

## Direccion de madurez
La meta no es "cero riesgo". La meta es riesgo visible, controlado y reversible. Terreta Hub debe escalar con confianza: cada feature nueva hereda estandares, no excepciones.
