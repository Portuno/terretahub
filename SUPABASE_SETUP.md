# Configuración de Supabase para Terreta Hub

## 📋 Variables de Entorno

### Para desarrollo local (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Gemini API (si la estás usando)
GEMINI_API_KEY=tu-gemini-api-key
```

### Para Vercel (Environment Variables)

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

1. **VITE_SUPABASE_URL**
   - Value: `https://tu-proyecto.supabase.co`
   - Environments: Production, Preview, Development

2. **VITE_SUPABASE_ANON_KEY**
   - Value: Tu Anon Key de Supabase
   - Environments: Production, Preview, Development

3. **GEMINI_API_KEY** (opcional, si la usas)
   - Value: Tu API key de Gemini
   - Environments: Production, Preview, Development

## 🗄️ Configuración de la Base de Datos

### Paso 1: Crear el Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota tu **Project URL** y **anon key** (las encontrarás en Settings → API)

### Paso 2: Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/01_initial_schema.sql`
3. Copia y pega todo el contenido en el editor SQL
4. Ejecuta el script (botón "Run" o Ctrl+Enter)

Este script creará:
- ✅ Tabla `profiles` para perfiles de usuario
- ✅ Tabla `link_bio_profiles` para perfiles de link-in-bio
- ✅ Tabla `agora_posts` para posts del feed
- ✅ Tabla `agora_comments` para comentarios
- ✅ Tabla `projects` para proyectos
- ✅ Row Level Security (RLS) policies
- ✅ Triggers automáticos para `updated_at`
- ✅ Trigger para crear perfil automáticamente al registrarse

### Paso 3: Verificar las Tablas

Ve a **Table Editor** en Supabase y verifica que todas las tablas se hayan creado correctamente.

## 🔐 Configuración de Autenticación

### Email Auth (ya configurado por defecto)

Supabase ya tiene autenticación por email habilitada por defecto. No necesitas configuración adicional.

### Opcional: Configurar Email Templates

Si quieres personalizar los emails de confirmación:

1. Ve a **Authentication** → **Email Templates**
2. Personaliza los templates según tus necesidades

## 🚀 Despliegue en Vercel

### Configuración de Build

Vercel detectará automáticamente que es un proyecto Vite. Asegúrate de que:

1. **Build Command**: `npm run build` (o `yarn build`)
2. **Output Directory**: `dist`
3. **Install Command**: `npm install` (o `yarn install`)

### Rerouting

El archivo `vercel.json` ya está configurado para:
- ✅ Redirigir todas las rutas a `index.html` (SPA routing)
- ✅ Headers de seguridad
- ✅ Cache para assets estáticos

## 📝 Notas Importantes

1. **Nunca commitees el archivo `.env.local`** - Ya está en `.gitignore`
2. **Las variables deben empezar con `VITE_`** para que Vite las exponga al cliente
3. **El `anon key` es seguro para usar en el cliente** - Las políticas RLS protegen los datos
4. **El trigger automático crea el perfil** cuando un usuario se registra, así que no necesitas hacerlo manualmente

## 🔍 Verificación

Después de configurar todo:

1. Ejecuta `npm install` para instalar las dependencias
2. Crea tu `.env.local` con las variables
3. Ejecuta `npm run dev`
4. Intenta registrarte - debería crear el usuario y perfil automáticamente
5. Verifica en Supabase que el perfil se haya creado en la tabla `profiles`

## 🆘 Troubleshooting

### Error: "Supabase URL o Anon Key no están configurados"
- Verifica que las variables en `.env.local` empiecen con `VITE_`
- Reinicia el servidor de desarrollo después de crear/modificar `.env.local`

### Error: "relation 'profiles' does not exist"
- Asegúrate de haber ejecutado el script SQL en Supabase
- Verifica que todas las tablas se hayan creado en Table Editor

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén activas
- Asegúrate de que el usuario esté autenticado correctamente

