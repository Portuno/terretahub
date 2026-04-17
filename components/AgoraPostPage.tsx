import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgoraPost as AgoraPostComponent } from './AgoraPost';
import { AgoraPost, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';
import { Navbar } from './Navbar';
import { fetchUserTotesSummary } from '../lib/totes';
import { ArrowLeft, ChevronRight } from 'lucide-react';

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
  onOpenAuth: (referrerUsername?: string) => void;
}

export const AgoraPostPage: React.FC<AgoraPostPageProps> = ({ user, onOpenAuth }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<AgoraPost | null>(null);
  const [postCreatedAt, setPostCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totesBalance, setTotesBalance] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(false);

  // Meta tags dinámicos y structured data para SEO
  // IMPORTANTE: este hook debe llamarse siempre, antes de cualquier return condicional
  const postUrl = id ? `/agora/post/${id}` : '/agora/post';
  const postImageUrl = post?.imageUrls && post.imageUrls.length > 0 
    ? post.imageUrls[0] 
    : post?.author.avatar || '/logo.png';
  const postContent = post?.content 
    ? (post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content)
    : 'Post en el Ágora de Terreta Hub';

  useDynamicMetaTags({
    title: post ? `Post de ${post.author.name} | Ágora Terreta Hub` : 'Post | Terreta Hub',
    description: postContent,
    image: postImageUrl,
    url: postUrl,
    type: 'article',
    author: post ? `${post.author.name} (${post.author.handle})` : undefined,
    publishedTime: postCreatedAt || undefined,
    tags: ['Ágora', 'Comunidad', 'Terreta Hub'],
    structuredData: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'SocialMediaPosting',
          '@id': `https://terretahub.com${postUrl}`,
          headline: postContent.substring(0, 100),
          description: postContent,
          image: postImageUrl.startsWith('http')
            ? postImageUrl
            : `https://terretahub.com${postImageUrl}`,
          datePublished: postCreatedAt || post.timestamp,
          author: {
            '@type': 'Person',
            name: post.author.name,
            alternateName: post.author.handle,
            url: `https://terretahub.com/p/${post.author.handle.replace('@', '')}`,
            image: post.author.avatar,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Terreta Hub',
            logo: {
              '@type': 'ImageObject',
              url: 'https://terretahub.com/logo.png',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://terretahub.com${postUrl}`,
          },
          articleSection: 'Ágora',
          keywords: 'Ágora, Comunidad, Terreta Hub, Networking, Valencia',
          inLanguage: 'es-ES',
          isAccessibleForFree: true,
          commentCount: post.comments?.length || 0,
          ...(post.videoUrl
            ? {
                video: {
                  '@type': 'VideoObject',
                  embedUrl: post.videoUrl,
                },
              }
            : {}),
          ...(post.linkUrl
            ? {
                sharedContent: {
                  '@type': 'WebPage',
                  url: post.linkUrl,
                },
              }
            : {}),
        }
      : undefined,
  });

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsPageVisible(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!user) {
      setTotesBalance(0);
      return;
    }
    const loadTotesBalance = async () => {
      const summary = await fetchUserTotesSummary(user.id);
      setTotesBalance(summary.balance);
    };
    loadTotesBalance();
  }, [user]);

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

        // Cargar encuesta asociada (si existe) para este post
        const { data: pollRow } = await supabase
          .from('agora_polls')
          .select('id, post_id, question, options, expires_at, created_at')
          .eq('post_id', id)
          .maybeSingle();

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
              poll: pollRow
                ? {
                    id: pollRow.id,
                    postId: pollRow.post_id,
                    question: pollRow.question,
                    options: pollRow.options,
                    expiresAt: pollRow.expires_at || undefined,
                    createdAt: pollRow.created_at,
                  }
                : undefined,
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
            setPostCreatedAt(foundPost.created_at);
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

        setPostCreatedAt(postData.created_at);

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
          poll: pollRow
            ? {
                id: pollRow.id,
                postId: pollRow.post_id,
                question: pollRow.question,
                options: pollRow.options,
                expiresAt: pollRow.expires_at || undefined,
                createdAt: pollRow.created_at,
              }
            : undefined,
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, username, avatar')
        .eq('id', user.id)
        .maybeSingle();

      const createdAt = newComment.created_at || new Date().toISOString();
      const appendedComment = {
        id: newComment.id,
        author: {
          name: profileData?.name || user.name,
          handle: `@${profileData?.username || user.username}`,
          avatar: profileData?.avatar || user.avatar
        },
        content: newComment.content,
        timestamp: formatTimestamp(createdAt)
      };

      setPost((previousPost) => {
        if (!previousPost) {
          return previousPost;
        }
        return {
          ...previousPost,
          comments: [...previousPost.comments, appendedComment]
        };
      });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/explorar');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edf4f8]">
        <Navbar
          user={user}
          title="Ágora"
          totesBalance={totesBalance}
          onOpenAuth={onOpenAuth}
          onLogout={handleLogout}
        />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
            <p className="text-terreta-dark">Cargando post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#edf4f8]">
        <Navbar
          user={user}
          title="Ágora"
          totesBalance={totesBalance}
          onOpenAuth={onOpenAuth}
          onLogout={handleLogout}
        />
        <div className="flex items-center justify-center px-4 py-16">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf4f8]">
      <Navbar
        user={user}
        title="Ágora"
        totesBalance={totesBalance}
        onOpenAuth={onOpenAuth}
        onLogout={handleLogout}
      />

      <div
        className={`mx-auto w-full max-w-4xl px-4 pb-28 pt-5 transition-all duration-300 ease-out md:pb-10 ${
          isPageVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="mb-4 rounded-xl border border-terreta-border/60 bg-white/80 px-4 py-2 text-xs font-semibold text-terreta-secondary shadow-sm">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('/agora')}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-terreta-accent transition-colors hover:bg-terreta-bg"
              aria-label="Volver al Ágora"
            >
              <ArrowLeft size={14} />
              Ágora
            </button>
            <ChevronRight size={14} className="text-terreta-secondary/60" />
            <span className="text-terreta-dark/80">Post de {post.author.handle}</span>
          </div>
        </div>

        <AgoraPostComponent
          post={post}
          currentUser={user}
          onReply={handleReply}
          onDelete={handleDeletePost}
          onOpenAuth={onOpenAuth}
          autoOpenComments={true}
          detailMode={true}
        />
      </div>
    </div>
  );
};
