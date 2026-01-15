import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser, Blog } from '../types';
import { Download, Flower2, HandHeart, Sprout, HelpCircle, Lightbulb, User, MessageSquare, X, Send, Upload, Package, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useLikes } from '../hooks/useLikes';
import { BlogCard } from './BlogCard';
import { getBlogImageUrl } from '../lib/blogUtils';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url?: string;
  download_count: number;
  votes_count?: number; // Mantener por compatibilidad
  likes_count?: number;
  dislikes_count?: number;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
  };
  created_at: string;
  hasUserVoted?: boolean; // Mantener por compatibilidad
  userLikeType?: 'like' | 'dislike' | null;
}

interface ResourceNeedComment {
  id: string;
  content: string;
  is_help_offer: boolean;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
  };
}

interface ResourceNeed {
  id: string;
  details: string;
  verticals: string[];
  format_tags: string[];
  created_at: string;
  user_id?: string;
  author?: {
    name: string;
    avatar: string;
  };
  comments?: ResourceNeedComment[];
}

interface ResourceCollabPanelProps {
  user?: AuthUser | null;
  onOpenAuth?: (referrerUsername?: string) => void;
}

// Componente: Tarjeta de Recurso (L'Almoina Card)
const AlmoinaCard: React.FC<{ resource: Resource; currentUser?: AuthUser | null; onVote: (resourceId: string) => void; onDownload: (resourceId: string) => void }> = ({ 
  resource, 
  currentUser, 
  onVote, 
  onDownload 
}) => {
  const resourceLikes = useLikes({
    entityType: 'resource',
    entityId: resource.id,
    currentLikeType: resource.userLikeType || null,
    likesCount: resource.likes_count || resource.votes_count || 0,
    dislikesCount: resource.dislikes_count || 0,
    userId: currentUser?.id || null
  });

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    // Mantener compatibilidad con el sistema anterior
    onVote(resource.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(resource.id);
  };

  return (
    <div className="bg-terreta-card rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 border border-terreta-border/50">
      {/* Categoría */}
      <div className="mb-3">
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-terreta-bg/50 text-terreta-accent border border-terreta-border/50">
          {resource.category}
        </span>
      </div>

      {/* Título */}
      <h3 className="font-serif text-lg font-bold text-terreta-dark mb-2 leading-tight">
        {resource.title}
      </h3>

      {/* Descripción */}
      {resource.description && (
        <p className="text-sm text-terreta-secondary mb-4 line-clamp-2">
          {resource.description}
        </p>
      )}

      {/* Footer: Autor y Acciones */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-terreta-border/30">
        {/* Autor con Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-terreta-border/50">
            <img 
              src={resource.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${resource.author.username}`} 
              alt={resource.author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs text-terreta-secondary font-medium">
            {resource.author.name}
          </span>
        </div>

        {/* Acciones: Likes/Dislikes y Descarga */}
        <div className="flex items-center gap-2">
          {/* Sistema de Likes/Dislikes */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) return;
              resourceLikes.handleLike();
            }}
            disabled={resourceLikes.isLiking || !currentUser}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              resourceLikes.likeType === 'like'
                ? 'bg-terreta-accent/20 text-terreta-accent'
                : 'text-terreta-secondary hover:text-terreta-accent hover:bg-terreta-bg/50'
            } ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title="Me gusta"
          >
            <ThumbsUp size={14} className={resourceLikes.likeType === 'like' ? 'fill-current' : ''} />
            <span className="text-xs font-medium">{resourceLikes.likesCount}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) return;
              resourceLikes.handleDislike();
            }}
            disabled={resourceLikes.isLiking || !currentUser}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              resourceLikes.likeType === 'dislike'
                ? 'bg-red-500/20 text-red-500'
                : 'text-terreta-secondary hover:text-red-500 hover:bg-terreta-bg/50'
            } ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title="No me gusta"
          >
            <ThumbsDown size={14} className={resourceLikes.likeType === 'dislike' ? 'fill-current' : ''} />
            <span className="text-xs font-medium">{resourceLikes.dislikesCount}</span>
          </button>

          {/* Botón de Descarga */}
          {resource.file_url && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-terreta-accent/10 text-terreta-accent hover:bg-terreta-accent hover:text-white transition-all border border-terreta-accent/20"
              aria-label={`Descargar ${resource.title}`}
            >
              <Download size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente: Tablón de Solicitudes
const TablonSolicitudes: React.FC<{ 
  requests: ResourceNeed[]; 
  currentUser?: AuthUser | null;
  onRequestClick: (request: ResourceNeed) => void;
}> = ({ requests, currentUser, onRequestClick }) => {
  const formatRequestText = (details: string) => {
    // Extraer las primeras palabras para mostrar "Necesito [X]..."
    const words = details.split(' ');
    if (words.length > 8) {
      return `Necesito ${words.slice(0, 8).join(' ')}...`;
    }
    return `Necesito ${details}`;
  };

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="text-center py-8 text-terreta-secondary text-sm">
          <p>Aún no hay solicitudes</p>
        </div>
      ) : (
        requests.map((request) => (
          <div 
            key={request.id} 
            onClick={() => onRequestClick(request)}
            className="bg-terreta-card rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-terreta-border/50 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:border-terreta-accent/30 transition-all"
          >
            <p className="text-sm text-terreta-dark mb-3 leading-relaxed">
              {formatRequestText(request.details)}
            </p>
            <div className="flex items-center justify-between">
              {request.author && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-terreta-border/50">
                    <img 
                      src={request.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.author.name}`} 
                      alt={request.author.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-terreta-secondary">
                    {request.author.name}
                  </span>
                </div>
              )}
              {request.comments && request.comments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-terreta-secondary">
                  <MessageSquare size={12} />
                  <span>{request.comments.length}</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export const ResourceCollabPanel: React.FC<ResourceCollabPanelProps> = ({ user, onOpenAuth }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [requests, setRequests] = useState<ResourceNeed[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showAportarModal, setShowAportarModal] = useState(false);
  const [showPedirAyudaModal, setShowPedirAyudaModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResourceNeed | null>(null);
  
  // Estados para el modal de Aportar Recurso
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceCategory, setResourceCategory] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceFileUrl, setResourceFileUrl] = useState('');
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceSubmitState, setResourceSubmitState] = useState<SubmissionState>('idle');
  const [requestComments, setRequestComments] = useState<ResourceNeedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isHelpOffer, setIsHelpOffer] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [formatTags, setFormatTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [submitState, setSubmitState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

const VERTICALS = [
    'Tecnología',
    'Arte & Educación',
    'Finanzas',
    'Legal',
    'Comunidad',
    'Salud'
  ];

const PLACEHOLDERS = [
  '¿Buscas específicamente un mentor con experiencia en rondas de financiación Serie A o una guía legal detallada sobre tokenización? Sé preciso con las cifras y el mercado. Si conoces un nombre que debemos contactar, ¡compártelo!',
  '¿Cuál es el desafío técnico que te detiene? ¿Estás atascado en la implementación de un agente autónomo o necesitas un workshop avanzado sobre la API de React 19? Incluye el framework o la tecnología clave.',
  'Describe el flujo de trabajo que quieres dominar: ¿Necesitas un curso de producción audiovisual para TikTok/YouTube o una mentoría para monetizar tu arte digital? ¿Qué artista o plataforma te inspira?',
  'Sé nuestro guía: ¿Te gustaría aportar tu propio conocimiento, dando una charla o un taller sobre Marketing de Contenidos? Menciona tu propuesta y el tiempo que necesitas. ¡Hacemos esto juntos!',
  '¿Buscas un espacio de coworking específico con buen café en la zona centro, o un grupo de networking exclusivo para Founders B2B? Danos la ubicación o el tipo de evento que te hace falta.',
  'Cuéntanos sobre los límites: ¿Buscas recursos sobre ética de la IA, contratos inteligentes o salud mental para emprendedores? Menciona el problema legal o de bienestar que es más urgente en tu sector.',
  'Piensa en el recurso ideal para tu yo de 2026: ¿Qué hito de crecimiento te ayudaría a alcanzar? ¿Un curso sobre el futuro del e-commerce o un acceso exclusivo a una convocatoria de fondos europea? Describe el impacto.',
  'Cuéntanos con detalle tu necesidad: ¿Buscas la guía definitiva de pitch deck, un mentor de UX o información sobre DeFi? Si tienes el nombre de un recurso que te encanta, compártelo. ¡Tu aporte prioriza nuestro trabajo!'
];

  // Cargar blogs
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoadingBlogs(true);
        
        const { data: blogsData, error: blogsError } = await executeQueryWithRetry(
          async () => await supabase
            .from('blogs')
            .select(`
              id,
              author_id,
              title,
              slug,
              excerpt,
              card_image_path,
              primary_tag,
              tags,
              status,
              views_count,
              likes_count,
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
            .order('created_at', { ascending: false })
            .limit(20),
          'load blogs for resources'
        );

        if (blogsError) {
          console.error('Error loading blogs:', blogsError);
          setBlogs([]);
          return;
        }

        // Cargar likes del usuario si está autenticado
        let userLikes: Set<string> = new Set();
        if (user) {
          const { data: likesData } = await supabase
            .from('blog_likes')
            .select('blog_id')
            .eq('user_id', user.id);

          if (likesData) {
            userLikes = new Set(likesData.map(l => l.blog_id));
          }
        }

        const transformedBlogs: Blog[] = (blogsData || []).map((blog: any) => ({
          id: blog.id,
          authorId: blog.author_id,
          title: blog.title,
          slug: blog.slug,
          content: blog.content || '',
          excerpt: blog.excerpt,
          cardImagePath: blog.card_image_path,
          cardImageUrl: blog.card_image_path ? getBlogImageUrl(blog.card_image_path) : undefined,
          primaryTag: blog.primary_tag,
          tags: blog.tags || [],
          status: blog.status,
          viewsCount: blog.views_count || 0,
          likesCount: blog.likes_count || 0,
          createdAt: blog.created_at,
          updatedAt: blog.updated_at,
          author: {
            id: blog.author?.id || blog.author_id,
            name: blog.author?.name || 'Usuario',
            username: blog.author?.username || 'usuario',
            avatar: blog.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.username || 'user'}`
          },
          hasUserLiked: userLikes.has(blog.id)
        }));

        setBlogs(transformedBlogs);
      } catch (err) {
        console.error('Error loading blogs:', err);
        setBlogs([]);
      } finally {
        setLoadingBlogs(false);
      }
    };

    loadBlogs();
  }, [user]);

  // Cargar recursos
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoadingResources(true);
        
        // Intentar usar la función RPC mejorada primero
        if (user?.id) {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_resources_with_votes', {
              current_user_id: user.id,
              limit_count: 50
            });

          if (!rpcError && rpcData) {
            const formattedResources: Resource[] = rpcData.map((r: any) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              category: r.category,
              file_url: r.file_url,
              download_count: r.download_count || 0,
              votes_count: r.votes_count || 0, // Asegurar que siempre tenga un valor
              author: {
                id: r.author_id,
                name: r.author_name || 'Usuario',
                avatar: r.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author_username || 'user'}`,
                username: r.author_username || 'usuario'
              },
              created_at: r.created_at,
              hasUserVoted: r.has_user_voted || false
            }));
            setResources(formattedResources);
            setLoadingResources(false);
            return;
          }
        }

        // Fallback al método anterior si la función RPC no existe
        const { data, error } = await supabase
          .from('resources')
          .select(`
            id,
            author_id,
            title,
            description,
            category,
            file_url,
            download_count,
            votes_count,
            likes_count,
            dislikes_count,
            created_at,
            author:profiles!resources_author_id_fkey(id, name, avatar, username)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error loading resources:', error);
          // Si la tabla no existe aún, simplemente mostrar lista vacía
          if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116') {
            console.warn('La tabla resources no existe. Ejecuta el script SQL 40_create_resources.sql en Supabase.');
            setResources([]);
            setLoadingResources(false);
            return;
          }
          setLoadingResources(false);
          return;
        }

        // Cargar votos del usuario si está autenticado
        if (user?.id && data) {
          const resourceIds = data.map(r => r.id);
          const { data: votes } = await supabase
            .from('resource_votes')
            .select('resource_id')
            .eq('user_id', user.id)
            .in('resource_id', resourceIds);

          const votedResourceIds = new Set(votes?.map(v => v.resource_id) || []);

          const resourcesWithVotes = data.map((resource: any) => ({
            ...resource,
            author: {
              id: resource.author.id,
              name: resource.author.name,
              avatar: resource.author.avatar,
              username: resource.author.username
            },
            votes_count: resource.votes_count || 0, // Asegurar que siempre tenga un valor
            hasUserVoted: votedResourceIds.has(resource.id)
          }));

          setResources(resourcesWithVotes);
        } else {
          const resourcesWithAuthor = data?.map((resource: any) => ({
            ...resource,
            author: {
              id: resource.author.id,
              name: resource.author.name,
              avatar: resource.author.avatar,
              username: resource.author.username
            },
            votes_count: resource.votes_count || 0, // Asegurar que siempre tenga un valor
            hasUserVoted: false
          })) || [];
          setResources(resourcesWithAuthor);
        }
      } catch (err) {
        console.error('Exception loading resources:', err);
      } finally {
        setLoadingResources(false);
      }
    };

    loadResources();
  }, [user]);

  // Cargar solicitudes
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoadingRequests(true);
        const { data, error } = await supabase
          .from('resource_needs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error loading requests:', error);
          return;
        }

        // Cargar información de autores si tienen user_id
        if (data) {
          const userIds = data.filter(r => r.user_id).map(r => r.user_id);
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, name, avatar')
              .in('id', userIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            // Cargar comentarios para cada solicitud
            const requestIds = data.map(r => r.id);
            const { data: commentsData } = await supabase
              .from('resource_needs_comments')
              .select(`
                *,
                author:profiles!resource_needs_comments_author_id_fkey(id, name, avatar, username)
              `)
              .in('resource_need_id', requestIds)
              .order('created_at', { ascending: true });

            const commentsByRequest = new Map<string, ResourceNeedComment[]>();
            if (commentsData) {
              commentsData.forEach((comment: any) => {
                const requestId = comment.resource_need_id;
                if (!commentsByRequest.has(requestId)) {
                  commentsByRequest.set(requestId, []);
                }
                commentsByRequest.get(requestId)!.push({
                  id: comment.id,
                  content: comment.content,
                  is_help_offer: comment.is_help_offer,
                  created_at: comment.created_at,
                  author: {
                    id: comment.author.id,
                    name: comment.author.name,
                    avatar: comment.author.avatar,
                    username: comment.author.username
                  }
                });
              });
            }

            const requestsWithAuthors = data.map((request: any) => ({
              ...request,
              author: request.user_id ? profilesMap.get(request.user_id) : null,
              comments: commentsByRequest.get(request.id) || []
            }));

            setRequests(requestsWithAuthors);
          } else {
            setRequests(data);
          }
        }
      } catch (err) {
        console.error('Exception loading requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadRequests();
  }, [user]);

  const handleVote = async (resourceId: string) => {
    if (!user) return;

    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    try {
      if (resource.hasUserVoted) {
        // Quitar voto
        const { error } = await supabase
          .from('resource_votes')
          .delete()
          .eq('resource_id', resourceId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing vote:', error);
          return;
        }

        // Actualizar estado optimista
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { ...r, votes_count: Math.max(0, (r.votes_count || 0) - 1), hasUserVoted: false }
            : r
        ));

        // Recargar el recurso específico para asegurar sincronización
        const { data: updatedResource } = await supabase
          .from('resources')
          .select('votes_count')
          .eq('id', resourceId)
          .single();

        if (updatedResource) {
          setResources(prev => prev.map(r => 
            r.id === resourceId 
              ? { ...r, votes_count: updatedResource.votes_count || 0 }
              : r
          ));
        }
      } else {
        // Añadir voto
        const { error } = await supabase
          .from('resource_votes')
          .insert({ resource_id: resourceId, user_id: user.id });

        if (error) {
          console.error('Error adding vote:', error);
          // Si el error es que ya existe (UNIQUE constraint), actualizar estado
          if (error.code === '23505') {
            setResources(prev => prev.map(r => 
              r.id === resourceId 
                ? { ...r, hasUserVoted: true }
                : r
            ));
          }
          return;
        }

        // Actualizar estado optimista
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { ...r, votes_count: (r.votes_count || 0) + 1, hasUserVoted: true }
            : r
        ));

        // Recargar el recurso específico para asegurar sincronización
        const { data: updatedResource } = await supabase
          .from('resources')
          .select('votes_count')
          .eq('id', resourceId)
          .single();

        if (updatedResource) {
          setResources(prev => prev.map(r => 
            r.id === resourceId 
              ? { ...r, votes_count: updatedResource.votes_count || 0 }
              : r
          ));
        }
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleDownload = async (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource?.file_url) return;

    // Incrementar contador de descargas
    try {
      const { error } = await supabase.rpc('increment_download_count', { resource_id: resourceId });
      if (!error) {
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { ...r, download_count: r.download_count + 1 }
            : r
        ));
      }
    } catch (err) {
      console.error('Error updating download count:', err);
      // Continuar con la descarga aunque falle el contador
    }

    // Abrir en nueva pestaña
    window.open(resource.file_url, '_blank');
  };

  const handleRequestClick = async (request: ResourceNeed) => {
    setSelectedRequest(request);
    setRequestComments(request.comments || []);
    setIsHelpOffer(false);
    setCommentText('');
    
    // Cargar comentarios actualizados
    await loadRequestComments(request.id);
  };

  const loadRequestComments = async (requestId: string) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('resource_needs_comments')
        .select(`
          *,
          author:profiles!resource_needs_comments_author_id_fkey(id, name, avatar, username)
        `)
        .eq('resource_need_id', requestId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      if (data) {
        const comments: ResourceNeedComment[] = data.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          is_help_offer: comment.is_help_offer,
          created_at: comment.created_at,
          author: {
            id: comment.author.id,
            name: comment.author.name,
            avatar: comment.author.avatar,
            username: comment.author.username
          }
        }));
        setRequestComments(comments);
      }
    } catch (err) {
      console.error('Exception loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !selectedRequest || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const { data, error } = await supabase
        .from('resource_needs_comments')
        .insert({
          resource_need_id: selectedRequest.id,
          author_id: user.id,
          content: commentText.trim(),
          is_help_offer: isHelpOffer
        })
        .select(`
          *,
          author:profiles!resource_needs_comments_author_id_fkey(id, name, avatar, username)
        `)
        .single();

      if (error) {
        console.error('Error submitting comment:', error);
        return;
      }

      if (data) {
        const newComment: ResourceNeedComment = {
          id: data.id,
          content: data.content,
          is_help_offer: data.is_help_offer,
          created_at: data.created_at,
          author: {
            id: data.author.id,
            name: data.author.name,
            avatar: data.author.avatar,
            username: data.author.username
          }
        };

        setRequestComments(prev => [...prev, newComment]);
        setCommentText('');
        setIsHelpOffer(false);

        // Actualizar la solicitud en la lista
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, comments: [...(req.comments || []), newComment] }
            : req
        ));
      }
    } catch (err) {
      console.error('Exception submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    const exists = list.includes(value);
    setter(exists ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();

    const newTags = tagInput
      .split(/,|\n/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!newTags.length) return;

    setFormatTags((prev) => Array.from(new Set([...prev, ...newTags])));
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormatTags((prev) => prev.filter((item) => item !== tag));
  };

  const isSubmitDisabled = useMemo(() => {
    const hasDetails = details.trim().length > 12;
    return !hasDetails || selectedVerticals.length === 0;
  }, [details, selectedVerticals]);

  const handleSubmitResource = async () => {
    if (!user || !resourceTitle.trim() || !resourceCategory) return;

    setResourceSubmitState('loading');
    setUploadingResource(true);
    setErrorMessage('');

    try {
      let finalFileUrl = resourceFileUrl.trim();

      // Si hay un archivo, intentar subirlo a storage
      // Nota: Si el bucket 'resources' no existe, el usuario puede usar una URL externa
      if (resourceFile) {
        try {
          // Validar tamaño del archivo (50 MB máximo)
          const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB en bytes
          if (resourceFile.size > MAX_FILE_SIZE) {
            setErrorMessage(`El archivo es demasiado grande. El tamaño máximo permitido es 50 MB. Tu archivo tiene ${(resourceFile.size / (1024 * 1024)).toFixed(2)} MB.`);
            setResourceSubmitState('error');
            setUploadingResource(false);
            setTimeout(() => setResourceSubmitState('idle'), 5000);
            return;
          }

          const filePath = `${user.id}/${Date.now()}_${resourceFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('resources')
            .upload(filePath, resourceFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: resourceFile.type || 'application/octet-stream'
            });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            
            // Mensajes de error más específicos
            let errorMessage = 'Error al subir el archivo. Puedes usar una URL externa en su lugar.';
            
            if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist')) {
              errorMessage = 'El bucket de recursos no está configurado. Por favor, usa una URL externa o configura el bucket en Supabase.';
            } else if (uploadError.message?.includes('new row violates row-level security policy') || uploadError.message?.includes('RLS')) {
              errorMessage = 'No tienes permisos para subir archivos. Por favor, verifica tu sesión o contacta al administrador.';
            } else if (uploadError.message?.includes('File size limit') || uploadError.message?.includes('too large')) {
              errorMessage = `El archivo es demasiado grande. El tamaño máximo permitido es 50 MB.`;
            } else if (uploadError.message?.includes('Invalid MIME type') || uploadError.message?.includes('not allowed')) {
              errorMessage = `El tipo de archivo no está permitido. Tipos permitidos: PDF, Office (Word, Excel, PowerPoint), imágenes (JPEG, PNG, WebP), videos (MP4, WebM), archivos comprimidos (ZIP, RAR), texto plano, Markdown, CSV.`;
            } else if (uploadError.message) {
              // Mostrar el mensaje de error real del servidor
              errorMessage = `Error: ${uploadError.message}. Puedes usar una URL externa en su lugar.`;
            }
            
            setErrorMessage(errorMessage);
            setResourceSubmitState('error');
            setUploadingResource(false);
            setTimeout(() => setResourceSubmitState('idle'), 5000);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('resources')
            .getPublicUrl(filePath);

          finalFileUrl = publicUrl;
        } catch (uploadError: any) {
          console.error('Error uploading file:', uploadError);
          
          // Mensaje de error más detallado
          let errorMessage = 'Error al subir el archivo. Puedes usar una URL externa en su lugar.';
          
          if (uploadError?.message) {
            if (uploadError.message.includes('Bucket') || uploadError.message.includes('not found')) {
              errorMessage = 'El bucket de recursos no está configurado. Por favor, usa una URL externa o configura el bucket en Supabase.';
            } else if (uploadError.message.includes('RLS') || uploadError.message.includes('row-level security')) {
              errorMessage = 'No tienes permisos para subir archivos. Por favor, verifica tu sesión o contacta al administrador.';
            } else {
              errorMessage = `Error: ${uploadError.message}. Puedes usar una URL externa en su lugar.`;
            }
          }
          
          setErrorMessage(errorMessage);
          setResourceSubmitState('error');
          setUploadingResource(false);
          setTimeout(() => setResourceSubmitState('idle'), 5000);
          return;
        }
      }

      // Crear el recurso
      const { data, error } = await supabase
        .from('resources')
        .insert({
          author_id: user.id,
          title: resourceTitle.trim(),
          description: resourceDescription.trim() || null,
          category: resourceCategory,
          file_url: finalFileUrl || null
        })
        .select(`
          *,
          author:profiles!resources_author_id_fkey(id, name, avatar, username)
        `)
        .single();

      if (error) {
        console.error('Error creating resource:', error);
        
        // Detectar si la tabla no existe
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
          setErrorMessage('La tabla de recursos no existe. Por favor, ejecuta el script SQL 40_create_resources.sql en Supabase.');
        } else if (error.code === '23503' || error.message?.includes('foreign key')) {
          setErrorMessage('Error de referencia. Verifica que el usuario esté correctamente autenticado.');
        } else {
          setErrorMessage(`No se pudo compartir el recurso: ${error.message || 'Error desconocido'}`);
        }
        
        setResourceSubmitState('error');
        setUploadingResource(false);
        setTimeout(() => setResourceSubmitState('idle'), 5000);
        return;
      }

      // Agregar el recurso a la lista
      if (data) {
        const newResource: Resource = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          file_url: data.file_url,
          download_count: data.download_count || 0,
          votes_count: data.votes_count || 0, // Asegurar que siempre tenga un valor
          author: {
            id: data.author.id,
            name: data.author.name,
            avatar: data.author.avatar,
            username: data.author.username
          },
          created_at: data.created_at,
          hasUserVoted: false
        };

        setResources(prev => [newResource, ...prev]);
      }

      setResourceSubmitState('success');
      setResourceTitle('');
      setResourceDescription('');
      setResourceCategory('');
      setResourceFile(null);
      setResourceFileUrl('');

      // Cerrar modal después de 1 segundo
      setTimeout(() => {
        setShowAportarModal(false);
        setResourceSubmitState('idle');
      }, 1000);
    } catch (err: any) {
      console.error('Exception creating resource:', err);
      setErrorMessage(err?.message || 'No se pudo compartir el recurso. Intenta nuevamente.');
      setResourceSubmitState('error');
    } finally {
      setUploadingResource(false);
      setTimeout(() => setResourceSubmitState('idle'), 3000);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled || submitState === 'loading') return;

    setSubmitState('loading');
    setErrorMessage('');

    const trimmedDetails = details.trim();
    if (!trimmedDetails || trimmedDetails.length <= 12) {
      setSubmitState('error');
      setErrorMessage('Por favor, proporciona más detalles sobre tu necesidad (mínimo 12 caracteres).');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    if (trimmedDetails.length > 10000) {
      setSubmitState('error');
      setErrorMessage('El texto es demasiado largo. Por favor, reduce la descripción a menos de 10,000 caracteres.');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    if (!selectedVerticals || selectedVerticals.length === 0) {
      setSubmitState('error');
      setErrorMessage('Por favor, selecciona al menos una vertical de interés.');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    const cleanedVerticals = Array.isArray(selectedVerticals) 
      ? selectedVerticals.filter(v => v && typeof v === 'string' && v.trim().length > 0)
      : [];
    
    const cleanedFormatTags = Array.isArray(formatTags)
      ? formatTags.filter(t => t && typeof t === 'string' && t.trim().length > 0)
      : [];

    const payload: Record<string, any> = {
      details: trimmedDetails,
      verticals: cleanedVerticals,
      format_tags: cleanedFormatTags
    };

    if (user?.id) {
      payload.user_id = user.id;
    }

    try {
      const { data, error } = await supabase
        .from('resource_needs')
        .insert(payload)
        .select();
      
      if (error) {
        console.error('Error submitting request:', error);
        setSubmitState('error');
        setErrorMessage('No se pudo enviar tu necesidad. Por favor, intenta nuevamente.');
        return;
      }

      setSubmitState('success');
      setDetails('');
      setSelectedVerticals([]);
      setFormatTags([]);
      setShowPedirAyudaModal(false);
      
      // Recargar solicitudes
      const { data: newRequests } = await supabase
        .from('resource_needs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (newRequests) {
        setRequests(newRequests);
      }
    } catch (err: any) {
      console.error('Exception during submit:', err);
      setSubmitState('error');
      setErrorMessage(err?.message || 'No se pudo enviar tu necesidad. Por favor, intenta nuevamente.');
    } finally {
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 relative">
      {/* Header */}
      <header className="shrink-0">
        <h1 className="text-4xl font-serif font-bold text-terreta-dark leading-tight mb-2">
          L'Almoina
        </h1>
        <p className="text-base text-terreta-secondary font-medium">
          Donde el talento se comparte y la comunidad crece
        </p>
      </header>

      {/* Layout 70/30 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Columna Izquierda (70%): Explorar Recursos - Grid Masonry */}
        <div className="flex-[0.7] flex flex-col min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-serif font-semibold text-terreta-dark">Explorar</h2>
            <button
              onClick={() => {
                if (!user && onOpenAuth) {
                  onOpenAuth();
                } else {
                  setShowAportarModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-terreta-accent text-white rounded-lg font-bold hover:brightness-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              aria-label="Aportar Recurso"
            >
              <Package size={18} />
              <span>Aportar Recurso</span>
            </button>
          </div>
          
          {(loadingResources || loadingBlogs) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terreta-accent"></div>
                <p className="mt-4 text-terreta-secondary text-sm">Cargando recursos...</p>
              </div>
            </div>
          ) : (resources.length === 0 && blogs.length === 0) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <p className="text-terreta-secondary mb-4">Aún no hay recursos compartidos</p>
                <p className="text-sm text-terreta-secondary/70">Sé el primero en compartir tu talento</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Grid Masonry usando columnas CSS */}
              <div className="columns-1 md:columns-2 gap-4">
                {/* Recursos normales */}
                {resources.map((resource) => (
                  <div key={resource.id} className="break-inside-avoid mb-4">
                    <AlmoinaCard 
                      resource={resource} 
                      currentUser={user}
                      onVote={handleVote}
                      onDownload={handleDownload}
                    />
                  </div>
                ))}
                {/* Blogs con tag "Blog" */}
                {!loadingBlogs && blogs.map((blog) => (
                  <div key={blog.id} className="break-inside-avoid mb-4">
                    <BlogCard blog={blog} showStats={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha (30%): Solicitudes de la Comunidad */}
        <div className="flex-[0.3] flex flex-col min-w-0 bg-terreta-card rounded-2xl p-4 border border-terreta-border shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-serif font-semibold text-terreta-dark">
                Solicitudes de la Comunidad
              </h2>
              <button
                onClick={() => {
                  if (!user && onOpenAuth) {
                    onOpenAuth();
                  } else {
                    setShowPedirAyudaModal(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
                aria-label="Pedir Ayuda"
              >
                <HandHeart size={14} />
                <span>Pedir Ayuda</span>
              </button>
            </div>
            <p className="text-xs text-terreta-secondary">
              Lo que la comunidad necesita
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-terreta-accent"></div>
              </div>
            ) : (
              <TablonSolicitudes 
                requests={requests} 
                currentUser={user}
                onRequestClick={handleRequestClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal: Aportar Recurso */}
      {showAportarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-terreta-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-terreta-border shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terreta-accent/10 flex items-center justify-center">
                  <Package className="text-terreta-accent" size={20} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-terreta-dark">Aportar Recurso</h2>
              </div>
              <button
                onClick={() => {
                  setShowAportarModal(false);
                  setResourceTitle('');
                  setResourceDescription('');
                  setResourceCategory('');
                  setResourceFile(null);
                  setResourceFileUrl('');
                  setResourceSubmitState('idle');
                }}
                className="text-terreta-secondary hover:text-terreta-dark transition-colors p-1 rounded-lg hover:bg-terreta-bg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Título del Recurso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Ej: Guía de React Hooks, Plantilla de Pitch Deck..."
                  className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all outline-none"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Descripción
                </label>
                <textarea
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Describe brevemente qué contiene este recurso y cómo puede ayudar a la comunidad..."
                  className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all resize-none outline-none leading-relaxed min-h-[100px]"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={resourceCategory}
                  onChange={(e) => setResourceCategory(e.target.value)}
                  className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark focus:border-terreta-accent focus:bg-terreta-card transition-all outline-none"
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="Diseño">Diseño</option>
                  <option value="Código">Código</option>
                  <option value="Tradición">Tradición</option>
                  <option value="Educación">Educación</option>
                  <option value="Negocio">Negocio</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Archivo */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Archivo (Opcional)
                </label>
                <div className="border-2 border-dashed border-terreta-border rounded-xl p-6 text-center hover:border-terreta-accent transition-colors">
                  {resourceFile ? (
                    <div className="space-y-2">
                      <p className="text-sm text-terreta-dark font-medium">{resourceFile.name}</p>
                      <button
                        onClick={() => setResourceFile(null)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Eliminar archivo
                      </button>
                    </div>
                  ) : resourceFileUrl ? (
                    <div className="space-y-2">
                      <p className="text-sm text-terreta-dark font-medium">URL: {resourceFileUrl}</p>
                      <button
                        onClick={() => setResourceFileUrl('')}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Eliminar URL
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 text-terreta-secondary" size={32} />
                      <label className="cursor-pointer">
                        <span className="text-sm text-terreta-accent font-semibold hover:underline">
                          Haz clic para subir un archivo
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setResourceFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-terreta-secondary mt-2">o</p>
                      <input
                        type="url"
                        value={resourceFileUrl}
                        onChange={(e) => setResourceFileUrl(e.target.value)}
                        placeholder="Pega una URL del archivo"
                        className="mt-2 w-full rounded-lg border border-terreta-border bg-terreta-card/50 px-3 py-2 text-sm text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all outline-none"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="font-semibold mb-1">Error:</div>
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {resourceSubmitState === 'success' && (
                  <span className="text-xs text-emerald-600 font-bold animate-pulse">¡Recurso compartido!</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAportarModal(false);
                    setResourceTitle('');
                    setResourceDescription('');
                    setResourceCategory('');
                    setResourceFile(null);
                    setResourceFileUrl('');
                    setResourceSubmitState('idle');
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar transition-colors border border-terreta-border"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!resourceTitle.trim() || !resourceCategory || uploadingResource || resourceSubmitState === 'loading'}
                  onClick={handleSubmitResource}
                  className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-terreta-accent shadow-md transition hover:brightness-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {uploadingResource || resourceSubmitState === 'loading' ? 'Compartiendo...' : 'Compartir Recurso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pedir Ayuda */}
      {showPedirAyudaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-terreta-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-terreta-border shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <HandHeart className="text-emerald-600" size={20} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-terreta-dark">Pedir Ayuda</h2>
              </div>
              <button
                onClick={() => {
                  setShowPedirAyudaModal(false);
                  setDetails('');
                  setSelectedVerticals([]);
                  setFormatTags([]);
                  setSubmitState('idle');
                  setErrorMessage('');
                }}
                className="text-terreta-secondary hover:text-terreta-dark transition-colors p-1 rounded-lg hover:bg-terreta-bg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario de solicitud (simplificado para donar) */}
            <div className="space-y-4">
              {/* Verticals */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Vertical de Interés
                </label>
              <div className="flex flex-wrap gap-2">
                {VERTICALS.map((vertical) => {
                  const isActive = selectedVerticals.includes(vertical);
                  return (
                    <button
                      key={vertical}
                      type="button"
                      onClick={() => toggleItem(vertical, selectedVerticals, setSelectedVerticals)}
                        className={`px-4 py-2 text-sm rounded-full border transition ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600'
                            : 'border-terreta-border text-terreta-secondary hover:border-terreta-accent/50 bg-terreta-card'
                        }`}
                    >
                      {vertical}
                    </button>
                  );
                })}
            </div>
        </div>

              {/* Format Tags */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Formatos preferidos
                </label>
                <div className="flex flex-wrap gap-2 items-center pb-2 border-b border-terreta-border">
            {formatTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-terreta-bg px-3 py-1 text-sm text-terreta-dark border border-terreta-border"
              >
                {tag}
                <button
                  type="button"
                  className="text-terreta-secondary hover:text-terreta-dark focus:outline-none font-bold ml-1"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
             <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                    placeholder="Ej: PDF, Video... (Enter)"
                className="flex-1 min-w-[200px] bg-transparent text-base text-terreta-dark placeholder-terreta-secondary/50 outline-none py-1"
              />
          </div>
        </div>

        {/* Details */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Detalles
                </label>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
                  placeholder="Describe qué necesitas o qué puedes ofrecer..."
                  className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all resize-none outline-none leading-relaxed min-h-[120px]"
          />
        </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="font-semibold mb-1">Error:</div>
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {submitState === 'success' && (
                  <span className="text-xs text-emerald-600 font-bold animate-pulse">¡Enviado!</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowPedirAyudaModal(false);
                    setDetails('');
                    setSelectedVerticals([]);
                    setFormatTags([]);
                    setSubmitState('idle');
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar transition-colors border border-terreta-border"
                >
                  Cancelar
                </button>
                <button
                type="button"
                disabled={isSubmitDisabled || submitState === 'loading'}
                onClick={handleSubmit}
                  className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-terreta-accent shadow-md transition hover:brightness-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {submitState === 'loading' ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
             </div>
        </div>
      </div>
        </div>
      )}

      {/* Modal: Detalles de Solicitud */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <div 
            className="bg-terreta-card rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-terreta-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-terreta-dark">Solicitud de la Comunidad</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-terreta-secondary hover:text-terreta-dark transition-colors p-1 rounded-lg hover:bg-terreta-bg"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Información del Autor */}
            {selectedRequest.author && (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-terreta-border">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-terreta-border/50">
                  <img 
                    src={selectedRequest.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRequest.author.name}`} 
                    alt={selectedRequest.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-terreta-dark">{selectedRequest.author.name}</p>
                  <p className="text-xs text-terreta-secondary">
                    {new Date(selectedRequest.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Detalles Completos */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2">Detalles</h3>
              <p className="text-base text-terreta-dark leading-relaxed whitespace-pre-wrap">
                {selectedRequest.details}
              </p>
            </div>

            {/* Verticales y Formatos */}
            <div className="mb-6 space-y-4">
              {selectedRequest.verticals && selectedRequest.verticals.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2">Verticales</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.verticals.map((vertical) => (
                      <span
                        key={vertical}
                        className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {vertical}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.format_tags && selectedRequest.format_tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2">Formatos Preferidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.format_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-terreta-bg text-terreta-secondary border border-terreta-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comentarios */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-4">
                Comentarios {requestComments.length > 0 && `(${requestComments.length})`}
              </h3>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-terreta-accent"></div>
                  </div>
                ) : requestComments.length === 0 ? (
                  <p className="text-sm text-terreta-secondary text-center py-4">
                    Aún no hay comentarios. Sé el primero en responder.
                  </p>
                ) : (
                  requestComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-xl border ${
                        comment.is_help_offer
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-terreta-bg/50 border-terreta-border/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-terreta-border/50 flex-shrink-0">
                          <img 
                            src={comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`} 
                            alt={comment.author.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-terreta-dark">
                              {comment.author.name}
                            </span>
                            {comment.is_help_offer && (
                              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Ofrece Ayuda
                              </span>
                            )}
                            <span className="text-xs text-terreta-secondary">
                              {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-terreta-dark leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Formulario de Comentario */}
            {user ? (
              <div className="border-t border-terreta-border pt-6">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHelpOffer}
                        onChange={(e) => setIsHelpOffer(e.target.checked)}
                        className="w-4 h-4 rounded border-terreta-border text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-emerald-700">
                        Ofrecer ayuda
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isHelpOffer ? "Explica cómo puedes ayudar..." : "Escribe un comentario público..."}
                    className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all resize-none outline-none leading-relaxed min-h-[100px]"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setCommentText('');
                      setIsHelpOffer(false);
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar transition-colors border border-terreta-border"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-terreta-accent shadow-md transition hover:brightness-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submittingComment ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Enviar {isHelpOffer ? 'Ayuda' : 'Comentario'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-terreta-border pt-6 text-center">
                <p className="text-sm text-terreta-secondary mb-3">
                  Inicia sesión para comentar u ofrecer ayuda
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
