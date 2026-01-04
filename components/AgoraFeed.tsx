import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bold, Italic, AlertTriangle } from 'lucide-react';
import { AgoraPost as AgoraPostComponent } from './AgoraPost';
import { AgoraPost, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry, executeBatchedQuery } from '../lib/supabaseHelpers';
import { isAdmin } from '../lib/userRoles';

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

interface AgoraFeedProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export const AgoraFeed: React.FC<AgoraFeedProps> = ({ user, onOpenAuth }) => {
  const [posts, setPosts] = useState<AgoraPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Anti-Paste & Formatting State
  const [pasteCount, setPasteCount] = useState(0);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Función para recargar posts (útil cuando se actualiza un avatar)
  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Cargar posts con retry
      const { data: postsData, error: postsError } = await executeQueryWithRetry(
        async () => await supabase
          .from('agora_posts')
          .select('*')
          .order('created_at', { ascending: false }),
        'load agora posts'
      );

      if (postsError) {
        console.error('[AgoraFeed] Error al cargar posts:', postsError);
        setPosts([]);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Obtener todos los IDs únicos de autores y comentarios
      const authorIds = [...new Set(postsData.map((p: any) => p.author_id))];
      const postIds = postsData.map((p: any) => p.id);

      // Cargar todos los comentarios de una vez
      const { data: allComments } = await executeQueryWithRetry(
        async () => await supabase
          .from('agora_comments')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: true }),
        'load agora comments'
      );

      // Obtener IDs de autores de comentarios
      const commentAuthorIds = [...new Set((allComments || []).map((c: any) => c.author_id))];
      const allAuthorIds = [...new Set([...authorIds, ...commentAuthorIds])];

      // Optimized: Use RPC function to get profiles with avatars in a single query
      // This eliminates multiple round trips and reduces query time significantly
      const { data: allProfiles, error: profilesError } = await executeQueryWithRetry(
        async () => await supabase.rpc('get_profiles_batch_rpc', { user_ids: allAuthorIds }),
        'load agora author profiles'
      );

      if (profilesError) {
        console.error('[AgoraFeed] Error al cargar perfiles:', profilesError);
        // Fallback to old method if function doesn't exist
        const [profilesResult, linkBioResult] = await Promise.all([
          executeBatchedQuery(
            allAuthorIds,
            async (batchIds) => {
              const result = await supabase
                .from('profiles')
                .select('id, name, username, avatar, role')
                .in('id', batchIds);
              return { data: result.data || [], error: result.error };
            },
            'load agora author profiles (fallback)',
            50
          ),
          executeBatchedQuery(
            allAuthorIds,
            async (batchIds) => {
              const result = await supabase
                .from('link_bio_profiles')
                .select('user_id, avatar')
                .in('user_id', batchIds);
              return { data: result.data || [], error: result.error };
            },
            'load agora link bio avatars (fallback)',
            50
          )
        ]);
        
        const fallbackProfiles = profilesResult.data || [];
        const linkBioProfiles = linkBioResult.data || [];
        
        // Create maps for fallback
        const profilesMap = new Map<string, any>();
        fallbackProfiles.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const avatarsMap = new Map<string, string>();
        linkBioProfiles.forEach(lbp => {
          if (lbp.avatar) {
            avatarsMap.set(lbp.user_id, lbp.avatar);
          }
        });

        // Use fallback data
        const allProfilesWithAvatars = fallbackProfiles.map((profile: any) => ({
          ...profile,
          avatar: avatarsMap.get(profile.id) || profile.avatar
        }));

        // Continue with fallback data
        const profilesMapFinal = new Map<string, any>();
        allProfilesWithAvatars.forEach(profile => {
          profilesMapFinal.set(profile.id, profile);
        });

        // Agrupar comentarios por post_id (necesario para el fallback)
        const commentsByPostFallback = new Map<string, any[]>();
        (allComments || []).forEach((comment: any) => {
          if (!commentsByPostFallback.has(comment.post_id)) {
            commentsByPostFallback.set(comment.post_id, []);
          }
          commentsByPostFallback.get(comment.post_id)!.push(comment);
        });

        // Process posts with fallback profiles
        const postsWithComments = postsData.map((post: any) => {
          const authorProfile = profilesMapFinal.get(post.author_id);
          const finalAvatar = authorProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`;

          const postComments = (commentsByPostFallback.get(post.id) || []).map((comment: any) => {
            const commentAuthor = profilesMapFinal.get(comment.author_id);
            const commentAvatar = commentAuthor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentAuthor?.username || 'user'}`;

            return {
              id: comment.id,
              author: {
                name: commentAuthor?.name || 'Usuario',
                handle: `@${commentAuthor?.username || 'usuario'}`,
                avatar: commentAvatar
              },
              content: comment.content,
              timestamp: formatTimestamp(comment.created_at)
            };
          });

          return {
            id: post.id,
            authorId: post.author_id,
            author: {
              name: authorProfile?.name || 'Usuario',
              handle: `@${authorProfile?.username || 'usuario'}`,
              avatar: finalAvatar,
              role: authorProfile?.role === 'admin' ? 'Admin' : 'Miembro'
            },
            content: post.content,
            timestamp: formatTimestamp(post.created_at),
            comments: postComments
          };
        });

        setPosts(postsWithComments);
        return;
      }

      // Crear mapas para acceso rápido
      // When using RPC function, avatars are already included in profiles
      const profilesMap = new Map<string, any>();
      (allProfiles || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Agrupar comentarios por post_id
      const commentsByPost = new Map<string, any[]>();
      (allComments || []).forEach((comment: any) => {
        if (!commentsByPost.has(comment.post_id)) {
          commentsByPost.set(comment.post_id, []);
        }
        commentsByPost.get(comment.post_id)!.push(comment);
      });

      // Combinar posts con información de autores y comentarios
      // When using RPC function, avatars are already included in profiles
      const postsWithComments = postsData.map((post: any) => {
        const authorProfile = profilesMap.get(post.author_id);
        const finalAvatar = authorProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`;

        // Procesar comentarios del post
        const postComments = (commentsByPost.get(post.id) || []).map((comment: any) => {
          const commentAuthor = profilesMap.get(comment.author_id);
          const commentAvatar = commentAuthor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentAuthor?.username || 'user'}`;

          return {
            id: comment.id,
            author: {
              name: commentAuthor?.name || 'Usuario',
              handle: `@${commentAuthor?.username || 'usuario'}`,
              avatar: commentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentAuthor?.username || 'user'}`
            },
            content: comment.content,
            timestamp: formatTimestamp(comment.created_at)
          };
        });

        return {
          id: post.id,
          authorId: post.author_id,
          author: {
            name: authorProfile?.name || 'Usuario',
            handle: `@${authorProfile?.username || 'usuario'}`,
            avatar: finalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`,
            role: authorProfile?.role === 'admin' ? 'Admin' : 'Miembro'
          },
          content: post.content,
          timestamp: formatTimestamp(post.created_at),
          comments: postComments
        };
      });

      setPosts(postsWithComments);
    } catch (err) {
      console.error('[AgoraFeed] Error al cargar posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar posts desde Supabase
  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostContent.trim()) return;

    try {
      // Crear post en Supabase
      const { data: newPost, error: postError } = await supabase
        .from('agora_posts')
        .insert({
          author_id: user.id,
          content: newPostContent.trim()
        })
        .select('*')
        .single();

      if (postError) {
        console.error('Error al crear post:', postError);
        alert('Error al publicar. Intenta nuevamente.');
        return;
      }

      // Obtener el perfil actualizado del usuario desde la BD para asegurar avatar actualizado
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('id, name, username, avatar, role')
        .eq('id', user.id)
        .single();

      // Intentar obtener el avatar de link_bio_profiles si existe
      let finalAvatar = updatedProfile?.avatar || user.avatar;
      if (updatedProfile) {
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('avatar')
          .eq('user_id', updatedProfile.id)
          .maybeSingle();
        
        if (linkBioProfile?.avatar) {
          finalAvatar = linkBioProfile.avatar;
        }
      }

      // Formatear el nuevo post con datos actualizados de la BD
      const formattedPost: AgoraPost = {
        id: newPost.id,
        authorId: newPost.author_id,
        author: {
          name: updatedProfile?.name || user.name,
          handle: `@${updatedProfile?.username || user.username}`,
          avatar: finalAvatar,
          role: updatedProfile?.role === 'admin' ? 'Admin' : 'Miembro'
        },
        content: newPost.content,
        timestamp: formatTimestamp(newPost.created_at),
        comments: []
      };

      // Agregar al inicio de la lista
      setPosts(prev => [formattedPost, ...prev]);
      setNewPostContent('');
      setPasteCount(0);
      setShowPasteWarning(false);
    } catch (err) {
      console.error('Error al crear post:', err);
      alert('Error al publicar. Intenta nuevamente.');
    }
  };

  const handleReply = async (postId: string, content: string) => {
    if (!user) return;
    
    try {
      // Crear comentario en Supabase
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

      // Obtener el perfil actualizado del usuario desde la BD para asegurar avatar actualizado
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .eq('id', user.id)
        .single();

      // Intentar obtener el avatar de link_bio_profiles si existe
      let finalAvatar = updatedProfile?.avatar || user.avatar;
      if (updatedProfile) {
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('avatar')
          .eq('user_id', updatedProfile.id)
          .maybeSingle();
        
        if (linkBioProfile?.avatar) {
          finalAvatar = linkBioProfile.avatar;
        }
      }

      // Formatear el nuevo comentario con datos actualizados de la BD
      const formattedComment = {
        id: newComment.id,
        author: {
          name: updatedProfile?.name || user.name,
          handle: `@${updatedProfile?.username || user.username}`,
          avatar: finalAvatar
        },
        content: newComment.content,
        timestamp: formatTimestamp(newComment.created_at)
      };

      // Actualizar el post con el nuevo comentario
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, formattedComment]
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error al crear comentario:', err);
      alert('Error al comentar. Intenta nuevamente.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    // Confirmar eliminación
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

      // Remover el post de la lista
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error al eliminar post:', err);
      alert('Error al eliminar el post. Intenta nuevamente.');
    }
  };

  // --- EDITOR LOGIC ---

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); // Block paste
    
    const newCount = pasteCount + 1;
    setPasteCount(newCount);

    if (newCount >= 3) {
      setShowPasteWarning(true);
      // Reset after a delay so they don't get stuck with the error forever
      setTimeout(() => {
        setPasteCount(0);
        setShowPasteWarning(false);
      }, 5000);
    }
  };

  const handleFormat = (type: 'bold' | 'italic') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = newPostContent;
    
    // Define wrappers
    const wrapper = type === 'bold' ? '**' : '_';
    
    // Insert text
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = `${before}${wrapper}${selected || 'texto'}${wrapper}${after}`;
    setNewPostContent(newText);
    
    // Restore focus
    textareaRef.current.focus();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Create Post Section */}
      <div className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border p-6 mb-8 relative overflow-hidden">
        
        {/* Anti-Paste Warning Overlay */}
        {showPasteWarning && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold py-2 text-center z-20 animate-slide-up shadow-md flex items-center justify-center gap-2">
             <AlertTriangle size={14} />
             Não, não, não — Ctrl + V não é permitido. No sea un robot y escriba.
          </div>
        )}

        <div className="flex gap-4">
           <div className="w-12 h-12 rounded-full bg-terreta-sidebar flex-shrink-0 flex items-center justify-center overflow-hidden border border-terreta-border">
             {user ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="text-terreta-secondary" />}
           </div>
           
           <div className="flex-1">
             {user ? (
               <form onSubmit={handleCreatePost}>
                 <div className="relative border-b border-terreta-border mb-2">
                    <textarea
                        ref={textareaRef}
                        placeholder="¿Qué estás cocinando hoy?"
                        className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-terreta-secondary/50 resize-none h-24 p-0 font-sans text-terreta-dark"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onPaste={handlePaste}
                    />
                    
                    {/* Formatting Toolbar */}
                    <div className="flex gap-2 pb-2">
                        <button 
                            type="button"
                            onClick={() => handleFormat('bold')}
                            className="p-1.5 text-terreta-secondary hover:text-terreta-dark hover:bg-terreta-bg rounded transition-colors"
                            title="Negrita"
                        >
                            <Bold size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleFormat('italic')}
                            className="p-1.5 text-terreta-secondary hover:text-terreta-dark hover:bg-terreta-bg rounded transition-colors"
                            title="Cursiva"
                        >
                            <Italic size={16} />
                        </button>
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-terreta-accent uppercase tracking-wide">Público</span>
                    <button 
                      type="submit" 
                      disabled={!newPostContent.trim()}
                      className="bg-terreta-dark text-terreta-bg px-6 py-2 rounded-full font-bold text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>Publicar</span>
                      <Send size={14} />
                    </button>
                 </div>
               </form>
             ) : (
               <div 
                  onClick={onOpenAuth} 
                  className="h-full flex flex-col justify-center cursor-pointer group"
                >
                  <p className="text-terreta-secondary text-lg group-hover:text-terreta-accent transition-colors">Inicia sesión para compartir tus ideas con la comunidad...</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4"></div>
          <p className="text-terreta-secondary">Cargando posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-terreta-secondary">
          <p className="text-lg mb-2">Aún no hay posts</p>
          <p className="text-sm">Sé el primero en compartir algo con la comunidad</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <AgoraPostComponent 
              key={post.id} 
              post={post} 
              currentUser={user}
              onReply={handleReply}
              onDelete={handleDeletePost}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      )}

    </div>
  );
};