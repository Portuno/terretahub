import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgoraPost as AgoraPostComponent } from './AgoraPost';
import { AgoraPost, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';

// Helper para formatear timestamps
const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Ahora mismo';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

interface AgoraPostPageProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export const AgoraPostPage: React.FC<AgoraPostPageProps> = ({ user, onOpenAuth }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<AgoraPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('ID de post no válido');
      setLoading(false);
      return;
    }

    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);

        // Intentar usar la función RPC primero
        const { data: feedData, error: feedError } = await executeQueryWithRetry(
          async () => await supabase.rpc('get_agora_feed', { limit_posts: 100 }),
          'load agora post'
        );

        if (!feedError && feedData?.posts) {
          const foundPost = feedData.posts.find((p: any) => p.id === id);
          
          if (foundPost) {
            const transformedPost: AgoraPost = {
              id: foundPost.id,
              authorId: foundPost.author_id,
              author: {
                name: foundPost.author?.name || 'Usuario',
                handle: `@${foundPost.author?.username || 'usuario'}`,
                avatar: foundPost.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundPost.author?.username || 'user'}`,
                role: foundPost.author?.role === 'admin' ? 'Admin' : 'Miembro'
              },
              content: foundPost.content,
              timestamp: formatTimestamp(foundPost.created_at),
              imageUrls: foundPost.image_urls || [],
              videoUrl: foundPost.video_url || null,
              linkUrl: foundPost.link_url || null,
              comments: (foundPost.comments || []).map((comment: any) => ({
                id: comment.id,
                author: {
                  name: comment.author?.name || 'Usuario',
                  handle: `@${comment.author?.username || 'usuario'}`,
                  avatar: comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username || 'user'}`
                },
                content: comment.content,
                timestamp: formatTimestamp(comment.created_at)
              }))
            };
            setPost(transformedPost);
            setLoading(false);
            return;
          }
        }

        // Fallback: cargar directamente desde la tabla
        const { data: postData, error: postError } = await executeQueryWithRetry(
          async () => await supabase
            .from('agora_posts')
            .select('id, author_id, content, image_urls, video_url, link_url, created_at, updated_at')
            .eq('id', id)
            .single(),
          'load single agora post'
        );

        if (postError || !postData) {
          setError('Post no encontrado');
          setLoading(false);
          return;
        }

        // Cargar perfil del autor
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('id, name, username, avatar, role')
          .eq('id', postData.author_id)
          .single();

        // Cargar comentarios
        const { data: commentsData } = await supabase
          .from('agora_comments')
          .select('id, author_id, content, created_at')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        // Cargar perfiles de comentarios
        const commentAuthorIds = [...new Set((commentsData || []).map((c: any) => c.author_id))];
        const allAuthorIds = [postData.author_id, ...commentAuthorIds];
        
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, name, username, avatar, role')
          .in('id', allAuthorIds);

        const profilesMap = new Map<string, any>();
        (allProfiles || []).forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const authorProfileData = profilesMap.get(postData.author_id);
        const finalAvatar = authorProfileData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfileData?.username || 'user'}`;

        const transformedPost: AgoraPost = {
          id: postData.id,
          authorId: postData.author_id,
          author: {
            name: authorProfileData?.name || 'Usuario',
            handle: `@${authorProfileData?.username || 'usuario'}`,
            avatar: finalAvatar,
            role: authorProfileData?.role === 'admin' ? 'Admin' : 'Miembro'
          },
          content: postData.content,
          timestamp: formatTimestamp(postData.created_at),
          imageUrls: postData.image_urls || [],
          videoUrl: postData.video_url || null,
          linkUrl: postData.link_url || null,
          comments: (commentsData || []).map((comment: any) => {
            const commentAuthor = profilesMap.get(comment.author_id);
            return {
              id: comment.id,
              author: {
                name: commentAuthor?.name || 'Usuario',
                handle: `@${commentAuthor?.username || 'usuario'}`,
                avatar: commentAuthor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentAuthor?.username || 'user'}`
              },
              content: comment.content,
              timestamp: formatTimestamp(comment.created_at)
            };
          })
        };

        setPost(transformedPost);
      } catch (err) {
        console.error('Error al cargar post:', err);
        setError('Error al cargar el post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handleReply = async (postId: string, content: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    
    try {
      const { data: newComment, error: commentError } = await supabase
        .from('agora_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: content.trim()
        })
        .select('*')
        .single();

      if (commentError) {
        console.error('Error al crear comentario:', commentError);
        alert('Error al comentar. Intenta nuevamente.');
        return;
      }

      // Recargar el post para mostrar el nuevo comentario
      window.location.reload();
    } catch (err) {
      console.error('Error al crear comentario:', err);
      alert('Error al comentar. Intenta nuevamente.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agora_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error al eliminar post:', error);
        alert('Error al eliminar el post. Intenta nuevamente.');
        return;
      }

      navigate('/agora');
    } catch (err) {
      console.error('Error al eliminar post:', err);
      alert('Error al eliminar el post. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-terreta-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
          <p className="text-terreta-dark">Cargando post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-terreta-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl font-bold text-terreta-dark mb-2">Post no encontrado</h1>
          <p className="text-terreta-secondary mb-4">{error || 'El post que buscas no existe o fue eliminado.'}</p>
          <button
            onClick={() => navigate('/agora')}
            className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Volver al Ágora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terreta-bg py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/agora')}
          className="text-terreta-accent hover:text-terreta-dark transition-colors mb-6 text-sm font-semibold flex items-center gap-2"
        >
          ← Volver al Ágora
        </button>
        
        <AgoraPostComponent
          post={post}
          currentUser={user}
          onReply={handleReply}
          onDelete={handleDeletePost}
          onOpenAuth={onOpenAuth}
        />
      </div>
    </div>
  );
};
