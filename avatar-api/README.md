# Avatar API

API reutilizable para creación de avatares por **elementos** (Tierra, Agua, Fuego, Aire) con estilos visuales determinísticos y "cifrados" (no elegibles por el usuario, pero reproducibles).

Pensada para ser consumida por Terreta Hub y otros proyectos. El elemento asignado a cada usuario es estable y servirá de base para gamificación (equipos, misiones, logros).

## Cómo se asigna el elemento

- **Entrada**: `userId` (UUID o cualquier identificador único).
- **Regla**: `hash(userId) % 4` → índice en `['earth', 'water', 'fire', 'air']`.
- **Propiedad**: La misma `userId` siempre obtiene el mismo elemento (determinístico). El usuario no elige el elemento; parece aleatorio pero es estable.

El hash es una función entera simple sobre el string (sin dependencias externas). Ver `lib/elements.js`.

## Cómo se deriva el estilo "cifrado"

- Cada elemento tiene varios **estilos visuales** (paleta, nombre, descripción para prompt).
- Para un usuario: `styleIndex = hash(userId + element) % numEstilosDelElemento`.
- Así, mismo usuario + mismo elemento → mismo estilo. El estilo no es elegible; se siente aleatorio pero es reproducible.
- Los estilos están definidos en `lib/styles.js` y pueden ampliarse (por elemento o globales) para otros usos (ilustraciones, fondos, etc.).

## Generación de imagen de avatar

- **Actualmente**: La API devuelve una **URL de placeholder** (DiceBear Avataaars) con `seed = element-userId`, de modo que el avatar varía por elemento y usuario y es estable.
- **Futuro**: Sustituir en `lib/avatar.js` por integración con un proveedor de IA (DALL·E, Stable Diffusion, Replicate, etc.): construir un **prompt** a partir de `element` + `getStyleForUser(userId, element).promptDescription` y devolver la URL de la imagen generada (o subirla a un storage y devolver esa URL). El resto de la API (elemento, estilos, caché) sigue igual.

## Instalación y ejecución

```bash
cd avatar-api
npm install
npm start
```

Por defecto escucha en el puerto **3001**. Variable de entorno `PORT` para cambiarlo.

Opcional: `AVATAR_API_KEY` para proteger los endpoints; si está definida, las peticiones deben enviar `X-Api-Key: <key>` o `?apiKey=<key>`.

## Documentación de la API

Ver [API.md](./API.md).

## Caché

- Caché **en memoria** por `userId` para la respuesta de `/avatar/:userId` y para el elemento en `/element/:userId`, con límite de entradas para no crecer sin control.
- En producción se puede sustituir por Redis o base de datos en `lib/cache.js`.

## Uso desde Terreta Hub

En el proyecto Terreta, configura la variable de entorno (en build/desarrollo):

- `VITE_AVATAR_API_URL`: URL base de esta API (ej. `http://localhost:3001` en local, o la URL del despliegue).

Con eso, al cargar el perfil del usuario se asignan elemento y avatar por defecto desde esta API y se guardan en `profiles`; el fallback de avatar pasa a usar esa URL en lugar de DiceBear cuando la API está disponible.
