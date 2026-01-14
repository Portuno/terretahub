import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, BookOpen, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthUser, Blog } from '../types';
import { BlogCard } from './BlogCard';
import { BlogEditor } from './BlogEditor';
import { BlogAuthorizationRequest } from './BlogAuthorizationRequest';
import { getBlogImageUrl } from '../lib/blogUtils';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';

interface BlogsPageProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

type SortOption = 'recent' | 'views' | 'likes';
type FilterTag = string | null;

export const BlogsPage: React.FC<BlogsPageProps> = ({ user, onOpenAuth }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showAuthRequest, setShowAuthRequest] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterTag, setFilterTag] = useState<FilterTag>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Verificar autorización del usuario
  useEffect(() => {
    if (user) {
      checkAuthorization();
    } else {
      setCheckingAuth(false);
    }
  }, [user]);

  const checkAuthorization = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('blog_authorized')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      } else {
        setIsAuthorized(data?.blog_authorized === true);
      }
    } catch (err) {
      console.error('Error checking authorization:', err);
      setIsAuthorized(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Cargar blogs
  useEffect(() => {
    loadBlogs();
  }, [sortBy, filterTag, searchQuery]);

  const loadBlogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('blogs')
        .select(`
          id,
          author_id,
          title,
          slug,
          content,
          excerpt,
          card_image_path,
          primary_tag,
          tags,
          status,
          views_count,
          likes_count,
          dislikes_count,
          created_at,
          updated_at,
          author:profiles!blogs_author_id_fkey (
            id,
            name,
            username,
            avatar
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      // Aplicar filtro de tag
      if (filterTag) {
        query = query.or(`primary_tag.eq.${filterTag},tags.cs.{${filterTag}}`);
      }

      // Aplicar búsqueda
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { data: blogsData, error: blogsError } = await executeQueryWithRetry(
        async () => await query,
        'load blogs'
      );

      if (blogsError) {
        console.error('Error loading blogs:', blogsError);
        setBlogs([]);
        return;
      }

      // Cargar likes/dislikes del usuario si está autenticado
      let userLikes: Map<string, 'like' | 'dislike'> = new Map();
      if (user) {
        const { data: likesData } = await supabase
          .from('blog_likes')
          .select('blog_id, type')
          .eq('user_id', user.id);

        if (likesData) {
          likesData.forEach((like: any) => {
            userLikes.set(like.blog_id, like.type);
          });
        }
      }

      // Transformar datos
      const transformedBlogs: Blog[] = (blogsData || []).map((blog: any) => ({
        id: blog.id,
        authorId: blog.author_id,
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        excerpt: blog.excerpt,
        cardImagePath: blog.card_image_path,
        cardImageUrl: blog.card_image_path ? getBlogImageUrl(blog.card_image_path) : undefined,
        primaryTag: blog.primary_tag,
        tags: blog.tags || [],
        status: blog.status,
        viewsCount: blog.views_count || 0,
        likesCount: blog.likes_count || 0,
        dislikesCount: blog.dislikes_count || 0,
        createdAt: blog.created_at,
        updatedAt: blog.updated_at,
        author: {
          id: blog.author?.id || blog.author_id,
          name: blog.author?.name || 'Usuario',
          username: blog.author?.username || 'usuario',
          avatar: blog.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.username || 'user'}`
        },
        hasUserLiked: userLikes.has(blog.id) && userLikes.get(blog.id) === 'like',
        userLikeType: userLikes.get(blog.id) || null
      }));

      // Ordenar
      let sortedBlogs = [...transformedBlogs];
      if (sortBy === 'views') {
        sortedBlogs.sort((a, b) => b.viewsCount - a.viewsCount);
      } else if (sortBy === 'likes') {
        sortedBlogs.sort((a, b) => b.likesCount - a.likesCount);
      } else {
        sortedBlogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      setBlogs(sortedBlogs);

      // Extraer tags únicos para el filtro
      const allTags = new Set<string>();
      transformedBlogs.forEach(blog => {
        allTags.add(blog.primaryTag);
        blog.tags.forEach(tag => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags).sort());
    } catch (err) {
      console.error('Error loading blogs:', err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!isAuthorized) {
      setShowAuthRequest(true);
      return;
    }

    setIsCreating(true);
  };

  const handleBlogSaved = () => {
    setIsCreating(false);
    loadBlogs();
  };

  if (isCreating && user && isAuthorized) {
    return (
      <BlogEditor
        user={user}
        onCancel={() => setIsCreating(false)}
        onSave={handleBlogSaved}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header con búsqueda y filtros */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-terreta-dark mb-2">
              Blogs
            </h1>
            <p className="text-terreta-secondary">
              Descubre historias, tutoriales y reflexiones de la comunidad
            </p>
          </div>

          {/* Botón de acción */}
          {checkingAuth ? (
            <div className="animate-pulse bg-terreta-bg rounded-lg px-4 py-2 h-10 w-40"></div>
          ) : (
            <button
              onClick={handleCreateBlog}
              className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              {isAuthorized ? (
                <>
                  <Plus size={18} />
                  <span>Nuevo blog</span>
                </>
              ) : (
                <>
                  <BookOpen size={18} />
                  <span>Solicitar escribir blogs</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terreta-secondary" size={18} />
            <input
              type="text"
              placeholder="Buscar blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-terreta-card border border-terreta-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark placeholder-terreta-secondary/50"
            />
          </div>

          {/* Filtro por tag */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terreta-secondary" size={18} />
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="bg-terreta-card border border-terreta-border rounded-lg pl-10 pr-8 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark appearance-none cursor-pointer"
            >
              <option value="">Todos los tags</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terreta-secondary" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-terreta-card border border-terreta-border rounded-lg pl-10 pr-8 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark appearance-none cursor-pointer"
            >
              <option value="recent">Más recientes</option>
              <option value="views">Más vistos</option>
              <option value="likes">Más likes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de blogs */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4"></div>
          <p className="text-terreta-secondary">Cargando blogs...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 text-terreta-secondary">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No hay blogs disponibles</p>
          <p className="text-sm">
            {searchQuery || filterTag 
              ? 'Intenta con otros términos de búsqueda o filtros'
              : 'Sé el primero en compartir un blog con la comunidad'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <BlogCard key={blog.id} blog={blog} showStats={true} />
          ))}
        </div>
      )}

      {/* Modal de solicitud de autorización */}
      {showAuthRequest && user && (
        <BlogAuthorizationRequest
          user={user}
          onClose={() => setShowAuthRequest(false)}
          onRequestSubmitted={() => {
            setShowAuthRequest(false);
            checkAuthorization();
          }}
        />
      )}
    </div>
  );
};
