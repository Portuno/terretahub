-- ============================================
-- TERRETA HUB - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Almacena los perfiles de usuario extendidos
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- LINK BIO PROFILES TABLE
-- ============================================
-- Almacena los perfiles de link-in-bio
CREATE TABLE IF NOT EXISTS link_bio_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  custom_slug TEXT,
  is_published BOOLEAN DEFAULT false,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  socials JSONB DEFAULT '{}'::jsonb,
  blocks JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{
    "id": "terreta",
    "name": "Terreta Original",
    "bgType": "color",
    "bgColor": "#F9F6F0",
    "textColor": "#3E2723",
    "buttonStyle": "solid",
    "buttonColor": "#3E2723",
    "buttonTextColor": "#FFFFFF",
    "font": "serif"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, username),
  UNIQUE(custom_slug)
);

-- Índices para link_bio_profiles
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_user_id ON link_bio_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_username ON link_bio_profiles(username);
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_custom_slug ON link_bio_profiles(custom_slug);
CREATE INDEX IF NOT EXISTS idx_link_bio_profiles_is_published ON link_bio_profiles(is_published);

-- ============================================
-- AGORA POSTS TABLE
-- ============================================
-- Almacena los posts del feed Ágora
CREATE TABLE IF NOT EXISTS agora_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para agora_posts
CREATE INDEX IF NOT EXISTS idx_agora_posts_author_id ON agora_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_agora_posts_created_at ON agora_posts(created_at DESC);

-- ============================================
-- AGORA COMMENTS TABLE
-- ============================================
-- Almacena los comentarios en posts del Ágora
CREATE TABLE IF NOT EXISTS agora_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES agora_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para agora_comments
CREATE INDEX IF NOT EXISTS idx_agora_comments_post_id ON agora_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_agora_comments_author_id ON agora_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_agora_comments_created_at ON agora_comments(created_at DESC);

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Almacena los proyectos
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slogan TEXT,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  technologies TEXT[] DEFAULT ARRAY[]::TEXT[],
  phase TEXT NOT NULL DEFAULT 'Idea' CHECK (phase IN ('Idea', 'MVP', 'Mercado Temprano', 'Escalado')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_author_id ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(phase);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_bio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agora_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agora_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Cualquiera puede leer perfiles públicos
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- LINK BIO PROFILES POLICIES
-- ============================================
-- Cualquiera puede leer perfiles de link-in-bio públicos
CREATE POLICY "Link bio profiles are viewable by everyone"
  ON link_bio_profiles FOR SELECT
  USING (true);

-- Usuarios pueden gestionar su propio perfil de link-in-bio
CREATE POLICY "Users can manage own link bio profile"
  ON link_bio_profiles FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- AGORA POSTS POLICIES
-- ============================================
-- Cualquiera puede leer posts públicos
CREATE POLICY "Agora posts are viewable by everyone"
  ON agora_posts FOR SELECT
  USING (true);

-- Usuarios autenticados pueden crear posts
CREATE POLICY "Authenticated users can create posts"
  ON agora_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Usuarios pueden actualizar sus propios posts
CREATE POLICY "Users can update own posts"
  ON agora_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Usuarios pueden eliminar sus propios posts
CREATE POLICY "Users can delete own posts"
  ON agora_posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- AGORA COMMENTS POLICIES
-- ============================================
-- Cualquiera puede leer comentarios
CREATE POLICY "Agora comments are viewable by everyone"
  ON agora_comments FOR SELECT
  USING (true);

-- Usuarios autenticados pueden crear comentarios
CREATE POLICY "Authenticated users can create comments"
  ON agora_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Users can update own comments"
  ON agora_comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
  ON agora_comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- PROJECTS POLICIES
-- ============================================
-- Cualquiera puede leer proyectos publicados
CREATE POLICY "Published projects are viewable by everyone"
  ON projects FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Usuarios autenticados pueden crear proyectos
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Usuarios pueden actualizar sus propios proyectos
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = author_id);

-- Usuarios pueden eliminar sus propios proyectos
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_bio_profiles_updated_at
  BEFORE UPDATE ON link_bio_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agora_posts_updated_at
  BEFORE UPDATE ON agora_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agora_comments_updated_at
  BEFORE UPDATE ON agora_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(NEW.raw_user_meta_data->>'username', 'user')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se registra un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

