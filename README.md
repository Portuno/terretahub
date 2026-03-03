<div align="center">

# 🍊 Terreta Hub

**El Epicentre del Ecosistema Emprendedor y Creativo de Valencia**

[![Únete a Terreta Hub](https://img.shields.io/badge/Únete-Terreta_Hub-orange?style=for-the-badge&logo=link)](https://terretahub.com)
[![Versión](https://img.shields.io/badge/Versión-1.0-orange?style=flat-square)](https://terretahub.com)
[![Estado](https://img.shields.io/badge/Estado-Activo-success?style=flat-square)](https://terretahub.com)

*Un laboratorio digital donde las ideas brotan, las mentes conectan y el futuro se construye con sabor a Valencia*

</div>

---

## 🌟 Introducción

**Terreta Hub** es el punto de encuentro digital para el ecosistema emprendedor y creativo de la Comunidad Valenciana. Somos una plataforma diseñada para dinamizar el talento local, facilitar conexiones significativas y potenciar la innovación que nace bajo el sol valenciano.

En Terreta Hub, emprendedores, desarrolladores, diseñadores, creativos y visionarios encuentran un espacio donde experimentar, crear, colaborar y hacer crecer sus proyectos. Es el lugar donde la intuición se encuentra con la tecnología, y donde cada idea tiene el potencial de convertirse en realidad.

---

## 🚀 ¿Qué es Terreta Hub?

Terreta Hub es mucho más que una red social: es un **ecosistema completo** diseñado para impulsar el talento valenciano. Funcionamos como:

- **🔗 Conector de Talento:** Encuentra co-founders, mentores, colaboradores y profesionales que compartan tu visión
- **💡 Showcase de Innovación:** Descubre y comparte proyectos innovadores nacidos en la "Terreta"
- **📅 Centro de Quedadas:** Mantente actualizado con las quedadas y eventos tech y startup más relevantes de Valencia
- **🚀 Motor de Crecimiento:** Accede a recursos, herramientas y oportunidades de colaboración
- **🌐 Comunidad Activa:** Participa en debates, comparte ideas y forma parte de una red que crece día a día

---

## ✨ Características Principales

### 👤 Perfil Profesional Personalizado
Crea tu perfil único con:
- **Link Bio Personalizado:** Tu propia página pública con enlaces, contenido multimedia y diseño personalizable
- **Showcase de Proyectos:** Publica tus startups, proyectos personales y recibe feedback de la comunidad
- **Galería de Imágenes y Videos:** Muestra tu trabajo de forma visual y atractiva
- **Redes Sociales Integradas:** Conecta todas tus plataformas en un solo lugar

### 🎯 Directorio de Talento
- **Búsqueda Avanzada:** Filtra profesionales por habilidades, tecnologías y categorías
- **Perfiles Públicos:** Explora el trabajo y experiencia de otros miembros de la comunidad
- **Conexión Directa:** Contacta con profesionales que buscan colaborar

### 💬 Ágora
El espacio de conversación de la comunidad:
- **Comparte Ideas:** Publica tus pensamientos, preguntas y reflexiones
- **Pide Ayuda:** La comunidad está lista para apoyarte
- **Debate y Aprende:** Participa en conversaciones sobre el ecosistema emprendedor
- **Feedback Constructivo:** Recibe y ofrece opiniones valiosas

### 🏗️ Gestión de Proyectos
- **Publica Proyectos:** Muestra tus creaciones con imágenes, videos y descripciones detalladas
- **Fases de Desarrollo:** Organiza tus proyectos por etapas (Idea, Desarrollo, Escalado, etc.)
- **Categorías y Tecnologías:** Etiqueta tus proyectos para que sean fácilmente descubribles
- **Páginas Públicas:** Cada proyecto tiene su propia URL pública para compartir

### 📊 Panel de Administración
- **Gestión de Contenido:** Los administradores pueden moderar y gestionar proyectos
- **Analytics Integrado:** Seguimiento de métricas y rendimiento
- **Notificaciones:** Mantente al día con las interacciones de la comunidad

### 🔔 Sistema de Notificaciones
- **Actualizaciones en Tiempo Real:** Recibe notificaciones de interacciones importantes
- **Feedback y Mensajes:** Comunícate directamente con otros miembros

---

## 🛠️ Stack Tecnológico

Terreta Hub está construido con tecnologías modernas y robustas:

### Frontend
- **React 19** - Biblioteca de UI moderna y eficiente
- **TypeScript** - Tipado estático para mayor seguridad y productividad
- **Vite** - Build tool ultra-rápido para desarrollo y producción
- **TailwindCSS** - Framework CSS utility-first para diseño ágil
- **React Router** - Navegación SPA fluida

### Backend & Base de Datos
- **Supabase** - Backend as a Service completo
  - Autenticación segura con múltiples proveedores
  - Base de datos PostgreSQL en tiempo real
  - Row Level Security (RLS) para seguridad de datos
  - Storage para imágenes y archivos multimedia

### Herramientas & Servicios
- **Vercel Analytics** - Análisis de rendimiento y uso
- **Vercel Speed Insights** - Optimización de velocidad
- **Lucide React** - Iconos modernos y consistentes

---

## 🚦 Cómo Empezar

### Prerrequisitos

Asegúrate de tener instalado:
- **Node.js** (versión 18 o superior)
- **npm** o **yarn** como gestor de paquetes
- Una cuenta de **Supabase** (para el backend)

### Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/terretahub.git
cd terretahub
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
Crea un archivo `.env` en la raíz del proyecto con:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

5. **Abre tu navegador**
Visita `http://localhost:5173` para ver la aplicación en acción

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

---

## 📁 Estructura del Proyecto

```
terretahub/
├── components/          # Componentes React reutilizables
│   ├── AgoraFeed.tsx   # Feed del Ágora
│   ├── Dashboard.tsx   # Panel principal
│   ├── ProjectsGallery.tsx  # Galería de proyectos
│   ├── ProfileEditor.tsx    # Editor de perfil
│   └── ...
├── context/           # Contextos de React (Theme, etc.)
├── hooks/             # Custom hooks
├── lib/               # Utilidades y helpers
│   ├── supabase.ts   # Cliente de Supabase
│   └── utils.ts      # Funciones auxiliares
├── supabase/          # Migraciones y esquemas SQL
├── public/            # Archivos estáticos
└── src/               # Estilos globales
```

---

## 🎨 Diseño y UX

Terreta Hub está diseñado con:
- **Paleta de Colores Valenciana:** Tonos cálidos que evocan el Mediterráneo
- **Tipografía Elegante:** Combinación de serif y sans-serif para jerarquía visual
- **Diseño Responsive:** Experiencia optimizada para todos los dispositivos
- **Animaciones Suaves:** Transiciones que mejoran la experiencia de usuario
- **Accesibilidad:** Interfaz pensada para todos los usuarios

---

## 🤝 Contribuir

Terreta Hub es un proyecto en constante evolución. Si quieres contribuir:

1. **Fork el repositorio**
2. **Crea una rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit tus cambios** (`git commit -m 'Add some AmazingFeature'`)
4. **Push a la rama** (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

Estamos abiertos a mejoras, nuevas características y optimizaciones que beneficien a toda la comunidad.

---

## 📝 Licencia

Este proyecto es propiedad de **Versa Producciones**. Todos los derechos reservados.

---

## 🌐 Enlaces Útiles

- **🌍 Sitio Web:** [terretahub.com](https://terretahub.com)
- **📧 Contacto:** A través del modal de contacto en la plataforma
- **💼 Versa Producciones:** [versaproducciones.com](https://www.versaproducciones.com)

---

## 🙏 Agradecimientos

Terreta Hub existe gracias a:
- **La Comunidad Valenciana** - Por su talento y pasión
- **Todos los Usuarios** - Por hacer crecer el ecosistema día a día
- **Versa Producciones** - Por impulsar la innovación digital desde Valencia

---

<div align="center">

### 🍊 Hecho con pasión en Valencia

**Impulsando la innovación digital desde la Terreta**

---

<p><b>Un producto de <a href="https://www.versaproducciones.com" target="_blank">Versa Producciones</a></b></p>
<p><i>Construyendo el futuro del ecosistema emprendedor valenciano</i></p>

</div>
