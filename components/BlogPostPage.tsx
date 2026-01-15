import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Edit, Trash2, MessageCircle, Send, X, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { AuthUser, Blog, BlogComment } from '../types';
import { getBlogImageUrl } from '../lib/blogUtils';
import { canEditBlog, canDeleteBlog } from '../lib/userRoles';
import { ShareModal } from './ShareModal';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';

interface BlogPostPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ user, onOpenAuth }) => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Comentarios
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (username && slug) {
      loadBlog();
    }
  }, [username, slug]);

  const loadBlog = async () => {
    if (!username || !slug) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar blog por slug y username del autor
      const { data: blogData, error: blogError } = await executeQueryWithRetry(
        async () => await supabase
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
          .eq('slug', slug)
          .eq('status', 'published')
          .single(),
        'load blog'
      );

      if (blogError || !blogData) {
        setError('Blog no encontrado');
        setLoading(false);
        return;
      }

      // Verificar que el username coincida
      if (blogData.author?.username !== username) {
        setError('Blog no encontrado');
        setLoading(false);
        return;
      }

      // Verificar si el usuario ha dado like/dislike
      let hasUserLiked = false;
      let userLikeType: 'like' | 'dislike' | null = null;
      if (user) {
        const { data: likeData } = await supabase
          .from('blog_likes')
          .select('id, type')
          .eq('blog_id', blogData.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        hasUserLiked = !!likeData && likeData.type === 'like';
        userLikeType = likeData?.type || null;
      }

      const transformedBlog: Blog = {
        id: blogData.id,
        authorId: blogData.author_id,
        title: blogData.title,
        slug: blogData.slug,
        content: blogData.content,
        excerpt: blogData.excerpt,
        cardImagePath: blogData.card_image_path,
        cardImageUrl: blogData.card_image_path ? getBlogImageUrl(blogData.card_image_path) : undefined,
        primaryTag: blogData.primary_tag,
        tags: blogData.tags || [],
        status: blogData.status,
        viewsCount: blogData.views_count || 0,
        likesCount: blogData.likes_count || 0,
        dislikesCount: blogData.dislikes_count || 0,
        createdAt: blogData.created_at,
        updatedAt: blogData.updated_at,
        author: {
          id: blogData.author?.id || blogData.author_id,
          name: blogData.author?.name || 'Usuario',
          username: blogData.author?.username || 'usuario',
          avatar: blogData.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blogData.author?.username || 'user'}`
        },
        hasUserLiked,
        userLikeType
      };

      setBlog(transformedBlog);

      // Incrementar contador de vistas
      await supabase
        .from('blogs')
        .update({ views_count: (blogData.views_count || 0) + 1 })
        .eq('id', blogData.id);

      // Cargar comentarios
      loadComments(blogData.id);
    } catch (err) {
      console.error('Error loading blog:', err);
      setError('Error al cargar el blog');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (blogId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await executeQueryWithRetry(
        async () => await supabase
          .from('blog_comments')
          .select(`
            id,
            blog_id,
            author_id,
            content,
            parent_id,
            created_at,
            updated_at,
            author:profiles!blog_comments_author_id_fkey (
              id,
              name,
              username,
              avatar
            )
          `)
          .eq('blog_id', blogId)
          .order('created_at', { ascending: true }),
        'load blog comments'
      );

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
        return;
      }

      // Organizar comentarios en árbol (comentarios y respuestas)
      const commentsMap = new Map<string, BlogComment>();
      const rootComments: BlogComment[] = [];

      (commentsData || []).forEach((comment: any) => {
        const transformedComment: BlogComment = {
          id: comment.id,
          blogId: comment.blog_id,
          authorId: comment.author_id,
          content: comment.content,
          parentId: comment.parent_id,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          author: {
            id: comment.author?.id || comment.author_id,
            name: comment.author?.name || 'Usuario',
            username: comment.author?.username || 'usuario',
            avatar: comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username || 'user'}`
          },
          replies: []
        };

        commentsMap.set(comment.id, transformedComment);

        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            if (!parent.replies) parent.replies = [];
            parent.replies.push(transformedComment);
          }
        } else {
          rootComments.push(transformedComment);
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleLike = async (type: 'like' | 'dislike') => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!blog) return;

    setIsLiking(true);
    try {
      // Verificar si ya existe un like/dislike
      const { data: existing } = await supabase
        .from('blog_likes')
        .select('id, type')
        .eq('blog_id', blog.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.type === type) {
          // Si ya tiene el mismo tipo, eliminar
          const { error } = await supabase
            .from('blog_likes')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;

          setBlog(prev => prev ? {
            ...prev,
            userLikeType: null,
            likesCount: type === 'like' ? Math.max(0, prev.likesCount - 1) : prev.likesCount,
            dislikesCount: type === 'dislike' ? Math.max(0, (prev.dislikesCount || 0) - 1) : prev.dislikesCount
          } : null);
        } else {
          // Si tiene el tipo opuesto, actualizar
          const { error } = await supabase
            .from('blog_likes')
            .update({ type })
            .eq('id', existing.id);

          if (error) throw error;

          setBlog(prev => prev ? {
            ...prev,
            userLikeType: type,
            likesCount: type === 'like' ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
            dislikesCount: type === 'dislike' ? (prev.dislikesCount || 0) + 1 : Math.max(0, (prev.dislikesCount || 0) - 1)
          } : null);
        }
      } else {
        // Crear nuevo like/dislike
        const { error } = await supabase
          .from('blog_likes')
          .insert({
            blog_id: blog.id,
            user_id: user.id,
            type
          });

        if (error) throw error;

        setBlog(prev => prev ? {
          ...prev,
          userLikeType: type,
          likesCount: type === 'like' ? prev.likesCount + 1 : prev.likesCount,
          dislikesCount: type === 'dislike' ? (prev.dislikesCount || 0) + 1 : (prev.dislikesCount || 0)
        } : null);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Error al actualizar el like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !blog || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          blog_id: blog.id,
          author_id: user.id,
          content: commentText.trim(),
          parent_id: replyingTo || null
        })
        .select()
        .single();

      if (error) throw error;

      setCommentText('');
      setReplyingTo(null);
      loadComments(blog.id);
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Error al enviar el comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!blog || !user) return;

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blog.id);

      if (error) throw error;

      navigate('/blogs');
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Error al eliminar el blog');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-terreta-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
          <p className="text-terreta-dark">Cargando blog...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-terreta-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl font-bold text-terreta-dark mb-2">Blog no encontrado</h1>
          <p className="text-terreta-secondary mb-4">{error || 'El blog que buscas no existe o fue eliminado.'}</p>
          <button
            onClick={() => navigate('/blogs')}
            className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Volver a Blogs
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const canEdit = canEditBlog(user, blog.authorId);
  const canDelete = canDeleteBlog(user, blog.authorId);

  return (
    <div className="min-h-screen bg-terreta-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/blogs')}
          className="text-terreta-accent hover:text-terreta-dark transition-colors mb-6 text-sm font-semibold flex items-center gap-2"
        >
          ← Volver a Blogs
        </button>

        {/* Header del blog */}
        <article className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border p-8 mb-6">
          {/* Tag principal */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-terreta-accent/10 text-terreta-accent border border-terreta-accent/20">
              {blog.primaryTag}
            </span>
          </div>

          {/* Título */}
          <h1 className="font-serif text-4xl font-bold text-terreta-dark mb-4">
            {blog.title}
          </h1>

          {/* Meta información */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-terreta-border">
            <div className="flex items-center gap-3">
              <img
                src={blog.author.avatar}
                alt={blog.author.name}
                className="w-10 h-10 rounded-full border border-terreta-border"
              />
              <div>
                <p className="font-semibold text-sm text-terreta-dark">{blog.author.name}</p>
                <p className="text-xs text-terreta-secondary">@{blog.author.username}</p>
              </div>
            </div>
            <span className="text-sm text-terreta-secondary">{formattedDate}</span>
          </div>

          {/* Imagen de card si existe */}
          {blog.cardImageUrl && (
            <div className="mb-8">
              <img
                src={blog.cardImageUrl}
                alt={blog.title}
                className="w-full h-auto rounded-lg border border-terreta-border"
              />
            </div>
          )}

          {/* Contenido markdown */}
          <div className="prose prose-lg max-w-none mb-8">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} className="rounded-lg border border-terreta-border my-4" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="font-serif text-3xl font-bold text-terreta-dark mt-8 mb-4" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="font-serif text-2xl font-bold text-terreta-dark mt-6 mb-3" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="font-serif text-xl font-bold text-terreta-dark mt-4 mb-2" />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="text-terreta-dark mb-4 leading-relaxed" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc list-inside mb-4 text-terreta-dark" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal list-inside mb-4 text-terreta-dark" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="mb-1" />
                ),
                strong: ({ node, ...props }) => (
                  <strong {...props} className="font-bold text-terreta-dark" />
                ),
                em: ({ node, ...props }) => (
                  <em {...props} className="italic" />
                ),
                code: ({ node, ...props }) => (
                  <code {...props} className="bg-terreta-bg px-2 py-1 rounded text-sm font-mono" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} className="border-l-4 border-terreta-accent pl-4 italic my-4 text-terreta-secondary" />
                )
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>

          {/* Tags adicionales */}
          {blog.tags.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.filter(t => t !== blog.primaryTag).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-terreta-bg border border-terreta-border rounded-full text-terreta-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-4 pt-6 border-t border-terreta-border">
            <button
              onClick={() => handleLike('like')}
              disabled={isLiking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
                blog.userLikeType === 'like'
                  ? 'bg-red-50 text-red-600 border-2 border-red-200'
                  : 'bg-terreta-bg text-terreta-secondary hover:bg-red-50 hover:text-red-600 border border-terreta-border'
              }`}
            >
              <Heart size={18} className={blog.userLikeType === 'like' ? 'fill-current' : ''} />
              <span>{blog.likesCount}</span>
            </button>
            <button
              onClick={() => handleLike('dislike')}
              disabled={isLiking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
                blog.userLikeType === 'dislike'
                  ? 'bg-red-50 text-red-600 border-2 border-red-200'
                  : 'bg-terreta-bg text-terreta-secondary hover:bg-red-50 hover:text-red-600 border border-terreta-border'
              }`}
            >
              <ThumbsDown size={18} className={blog.userLikeType === 'dislike' ? 'fill-current' : ''} />
              <span>{blog.dislikesCount || 0}</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar border border-terreta-border transition-colors"
            >
              <Share2 size={18} />
              Compartir
            </button>

            {canEdit && (
              <button
                onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar border border-terreta-border transition-colors ml-auto"
              >
                <Edit size={18} />
                Editar
              </button>
            )}

            {canDelete && (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>

                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-terreta-card rounded-xl p-6 max-w-md w-full">
                      <h3 className="font-bold text-lg mb-4">¿Eliminar blog?</h3>
                      <p className="text-terreta-secondary mb-6">
                        Esta acción no se puede deshacer. El blog será eliminado permanentemente.
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-4 py-2 border border-terreta-border rounded-full font-semibold hover:bg-terreta-bg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDeleteBlog}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </article>

        {/* Comentarios */}
        <div className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border p-8">
          <h2 className="font-serif text-2xl font-bold text-terreta-dark mb-6">
            Comentarios ({comments.length})
          </h2>

          {/* Formulario de comentario */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex gap-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-terreta-border"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                    className="w-full bg-terreta-bg border border-terreta-border rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="px-4 py-2 bg-terreta-accent text-white rounded-full font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send size={16} />
                      {isSubmittingComment ? 'Enviando...' : 'Comentar'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-terreta-bg rounded-lg border border-terreta-border text-center">
              <p className="text-terreta-secondary mb-2">
                Inicia sesión para comentar
              </p>
              <button
                onClick={onOpenAuth}
                className="text-terreta-accent hover:text-terreta-dark font-semibold"
              >
                Iniciar sesión
              </button>
            </div>
          )}

          {/* Lista de comentarios */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-terreta-secondary text-center py-8">
                No hay comentarios aún. Sé el primero en comentar.
              </p>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={user}
                  onReply={(parentId) => {
                    setReplyingTo(parentId);
                    setCommentText(`@${comment.author.username} `);
                  }}
                  onOpenAuth={onOpenAuth}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && blog && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postUrl={`/blog/${blog.author.username}/${blog.slug}`}
          postContent={blog.excerpt || blog.title}
          authorName={blog.author.name}
          authorHandle={blog.author.username}
          title={blog.title}
          contentType="blog"
        />
      )}
    </div>
  );
};

// Componente para renderizar comentarios con respuestas anidadas
const CommentItem: React.FC<{
  comment: BlogComment;
  user: AuthUser | null;
  onReply: (parentId: string) => void;
  onOpenAuth: (referrerUsername?: string) => void;
}> = ({ comment, user, onReply, onOpenAuth }) => {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="border-b border-terreta-border pb-6 last:border-0 last:pb-0">
      <div className="flex gap-4">
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          className="w-10 h-10 rounded-full border border-terreta-border"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm text-terreta-dark">
              {comment.author.name}
            </span>
            <span className="text-xs text-terreta-secondary">
              @{comment.author.username}
            </span>
            <span className="text-xs text-terreta-secondary">
              · {formattedDate}
            </span>
          </div>
          <p className="text-sm text-terreta-dark mb-3 whitespace-pre-wrap">
            {comment.content}
          </p>
          {user && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-terreta-secondary hover:text-terreta-accent flex items-center gap-1"
            >
              <MessageCircle size={14} />
              Responder
            </button>
          )}
        </div>
      </div>

      {/* Respuestas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-14 space-y-4 pl-4 border-l-2 border-terreta-border">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              onReply={onReply}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      )}
    </div>
  );
};
