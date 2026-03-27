# Desarrollar un producto Digital (wiki)

Este manual es una guia practica para pasar de una idea a un producto digital que se prueba, aprende y evoluciona con ritmo.

## 1) Define el problema (y a quien realmente afecta)

Antes de pensar en funcionalidades, asegura claridad.

### 1.1. Formato rapido de problema

- **Problema:** que duele y como se manifiesta hoy.
- **Usuario:** quien lo sufre (no “todo el mundo”).
- **Contexto:** en que situacion ocurre (momento, canal, limitaciones).
- **Impacto:** que cuesta en tiempo, dinero o frustracion.

### 1.2. Evidencia de dolor

Busca señales de que el problema es real:

- entrevistas cortas (10-20 min) con 5-12 personas de tu publico
- revisa foros, reviews, quejas y preguntas recurrentes
- observa “workarounds” (como resuelven hoy sin tu producto)

## 2) Alinea tu estrategia (producto como sistema, no como app)

Un producto digital es una combinacion de:

- propuesta de valor (por que deberia importarle a alguien)
- experiencia (como se siente usarlo)
- crecimiento (como llega gente, como se retiene)
- operacion (como se mantiene, se mejora y se mide)

### 2.1. Propuesta de valor (1 frase)

Ejemplo:

> Ayudamos a **[tipo de usuario]** a **[tarea]** logrando **[beneficio]** en **[tiempo / esfuerzo]** sin **[dolor actual]**.

### 2.2. Objetivos y criterios de exito (medibles)

Define 1-3 metricas que indiquen progreso real:

- activacion (primer “momento valor”: registrar, crear, publicar, etc.)
- retencion (semana 1 / semana 4)
- conversion (de prueba a uso frecuente)
- NPS o feedback cualitativo (por que aman u odian)

## 3) Diseña el MVP con enfoque en aprendizaje

El MVP no es la version mas simple: es la version que maximiza aprendizaje al menor costo.

### 3.1. De hipotesis a experimentos

Convierte tus supuestos en hipotesis:

- “Los usuarios quieren X”
- “Los usuarios entienden Y sin explicacion extensa”
- “El canal Z funciona para conseguir primeros usuarios”

Luego disena experimentos:

- landing + formulario (validacion de demanda)
- prototipo clickable (validacion de flujo)
- piloto con un grupo (validacion de uso real)
- smoke test (validacion de adquisicion / onboarding)

### 3.2. Lista MVP (que entra y que no)

Una regla practica:

- **Si no prueba una hipotesis, no entra** (al menos al principio)
- entra lo minimo para que ocurra el “momento valor”

## 4) Mapea el viaje del usuario (journey) y el flujo principal

Para evitar construir “pantallas” sin sentido, define un flujo:

1. descubrimiento (como te encuentran)
2. onboarding (como entienden y se ubican)
3. primera accion (primer resultado observable)
4. repeticion (como vuelven y mejoran)

### 4.1. Documento simple de flujo

Para cada paso, escribe:

- objetivo del paso
- acciones que hace el usuario
- que friccion puede aparecer
- que microtexto o UI reduce confusion

## 5) Prioriza el diseno para claridad (no para “lujo”)

Tu producto tiene que ser entendible a primera vista.

### 5.1. Principios de claridad

- una accion principal por pantalla
- labels descriptivos (evita jerga interna)
- mensajes de error que ayudan (que hacer ahora)
- consistencia visual (mismos patrones para mismas acciones)

### 5.2. Microcopy que importa

Escribe textos que:

- expliquen el porque
- guien el que sigue
- reduzcan ansiedad (ej: “toma menos de 1 minuto”)

## 6) Construye con base solida (arquitectura pragmatica)

No necesitas arquitectura “enterprise” para empezar, pero si necesitas:

- control de datos (modelos claros)
- autenticacion/seguridad (aunque sea simple al principio)
- observabilidad (logs, errores, eventos)
- un plan para escalar cuando haya traccion

### 6.1. Modelo de datos mínimo

Define:

- entidad principal (usuario, proyecto, post, etc.)
- estados (borrador/publicado/activo, etc.)
- relaciones (1 a N, N a N)
- reglas (quien puede ver/editar que)

## 7) Implementa instrumentacion (eventos) desde el dia 1

Sin datos no hay producto: hay intuicion.

### 7.1. Evento core de analitica

Ejemplos:

- `signup_started`, `signup_completed`
- `first_value_achieved` (el momento valor)
- `item_created`, `item_published`
- `session_started`
- `feature_used_X`

### 7.2. Define embudos (funnels)

Para activacion y retencion:

- pasos del onboarding
- punto donde se pierde la gente

## 8) Lanzamiento: soft launch antes de el gran salto

Un lanzamiento serio no es solo “poner en produccion”.

### 8.1. Checklist de soft launch

- funciona en navegadores principales
- onboarding sin fricciones criticas
- manejo de errores
- rollback plan (como volver atras si hay fallos)
- soporte minimo (que hacemos si alguien se queda atascado)

### 8.2. Ciclo de feedback

Haz un loop semanal:

1. mirar metricas
2. leer feedback (entrevistas / mensajes / comentarios)
3. decidir mejora
4. iterar
5. medir de nuevo

## 9) Roadmap: roadmap por aprendizaje, no por deseo

Un buen roadmap responde:

- que hipotesis vamos a validar
- que impacto buscamos en metricas
- que decisiones habilita

### 9.1. Formato de ticket

Cada ticket deberia incluir:

- hipotesis
- experimento
- criterio de exito
- impacto esperado

## 10) Marketing de producto: crecimiento responsable

Marketing no es “publicidad”: es el sistema por el cual el valor llega a quien lo necesita.

### 10.1. Canales (elige 1-2 al inicio)

- contenido (blog, tutoriales, docs)
- comunidades (foros, grupos, alianzas)
- producto-led (invitaciones, integraciones)
- outreach (DM email, pero con relevancia)

### 10.2. Mensaje y pruebas

Testea:

- titulo y promesa
- propuesta de valor especifica
- caso de uso (ej: “para X, en Y situacion”)

## 11) Calidad, seguridad y compliance (cuando toca)

Al crecer, aparecen riesgos reales:

- privacidad de datos
- permisos y roles
- seguridad en APIs

### 11.1. Reglas basicas desde el dia 1

- minimiza datos recolectados
- protege endpoints
- registra accesos y fallos
- versiona cambios que afectan datos

## 12) Checklist final (para tu proxima iteracion)

Usa esta lista como guia antes de dedicar una semana a construir:

- [ ] Entiendo el problema y el usuario con evidencia
- [ ] Tengo una hipotesis medible y un experimento
- [ ] El MVP produce un momento valor claro
- [ ] Instrumente eventos core y embudos
- [ ] Se que friccion principal debo eliminar
- [ ] Hay plan de soft launch y ciclo de feedback
- [ ] El roadmap es por aprendizaje (no por wishlists)

## Referencias internas

Si quieres que este manual se convierta en un plan de accion para tu caso concreto, usa el boton “Preguntar a nuestra guia” al final.

