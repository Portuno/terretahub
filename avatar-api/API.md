# Avatar API – Documentación

Base URL (ejemplo): `http://localhost:3001`

Si está configurada `AVATAR_API_KEY`, incluir en todas las peticiones:

- Header: `X-Api-Key: <tu-api-key>`
- O query: `?apiKey=<tu-api-key>`

---

## GET /health

Comprueba que el servicio está activo.

**Respuesta** (200):

```json
{ "status": "ok", "service": "avatar-api" }
```

---

## GET /element/:userId

Devuelve el elemento asignado al usuario.

**Parámetros**:

- `userId` (path): identificador único del usuario (UUID o string estable).

**Respuesta** (200):

```json
{ "element": "earth" }
```

Valores posibles de `element`: `earth` | `water` | `fire` | `air`.

**Ejemplo**: `GET /element/550e8400-e29b-41d4-a716-446655440000`

---

## GET /avatar/:userId

Devuelve la URL del avatar y metadatos (elemento y estilo) para ese usuario.

**Parámetros**:

- `userId` (path): identificador único del usuario.

**Respuesta** (200):

```json
{
  "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=earth-550e8400-e29b-41d4-a716-446655440000",
  "element": "earth",
  "styleId": "earth_terracotta",
  "styleName": "Terracotta"
}
```

- `avatarUrl`: URL de la imagen del avatar (actualmente placeholder; en el futuro puede ser IA o storage).
- `element`: elemento asignado.
- `styleId` / `styleName`: estilo visual derivado del userId (determinístico).

**Ejemplo**: `GET /avatar/550e8400-e29b-41d4-a716-446655440000`

---

## GET /styles

Lista todos los estilos visuales.

**Query opcional**:

- `element`: filtra por elemento (`earth` | `water` | `fire` | `air`).

**Respuesta** (200):

```json
{
  "styles": [
    {
      "id": "earth_terracotta",
      "name": "Terracotta",
      "element": "earth",
      "palette": ["#8B4513", "#D2691E", "#F4A460"],
      "promptDescription": "Warm clay, amber, organic textures"
    }
  ]
}
```

---

## GET /styles/:element

Lista los estilos de un elemento.

**Parámetros**:

- `element` (path): `earth` | `water` | `fire` | `air`.

**Respuesta** (200): mismo formato que `GET /styles` pero solo con estilos de ese elemento.

**Error** (400): si `element` no es válido.

```json
{ "error": "Invalid element", "valid": ["earth", "water", "fire", "air"] }
```

---

## Códigos de error

- **400**: Parámetro faltante o inválido.
- **401**: API key inválida o ausente (cuando está configurada).
- **404**: Ruta no existente.
