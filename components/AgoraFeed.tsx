import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bold, Italic, AlertTriangle } from 'lucide-react';
import { AgoraPost as AgoraPostComponent } from './AgoraPost';
import { AgoraPost, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
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
      
      // Cargar posts
      const { data: postsData, error: postsError } = await supabase
        .from('agora_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error al cargar posts:', postsError);
        return;
      }

      if (!postsData) return;

        // Cargar perfiles de autores y comentarios
        const postsWithComments = await Promise.all(
        postsData.map(async (post: any) => {
          // Obtener perfil del autor (siempre desde la BD para tener el avatar actualizado)
          const { data: authorProfile, error: authorError } = await supabase
            .from('profiles')
            .select('id, name, username, avatar, role')
            .eq('id', post.author_id)
            .single();

          if (authorError) {
            console.error('Error al cargar autor:', authorError);
          }

          // Intentar obtener el avatar de link_bio_profiles si existe (puede estar más actualizado)
          let finalAvatar = authorProfile?.avatar;
          if (authorProfile) {
            const { data: linkBioProfile } = await supabase
              .from('link_bio_profiles')
              .select('avatar')
              .eq('user_id', authorProfile.id)
              .maybeSingle();
            
            // Usar el avatar de link_bio_profiles si existe, sino el de profiles
            if (linkBioProfile?.avatar) {
              finalAvatar = linkBioProfile.avatar;
            }
          }

          // Cargar comentarios
          const { data: commentsData, error: commentsError } = await supabase
            .from('agora_comments')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          if (commentsError) {
            console.error('Error al cargar comentarios:', commentsError);
          }

            // Cargar perfiles de los autores de los comentarios (siempre desde la BD)
            const commentsWithAuthors = await Promise.all(
            (commentsData || []).map(async (comment: any) => {
              const { data: commentAuthor, error: commentAuthorError } = await supabase
                .from('profiles')
                .select('id, name, username, avatar')
                .eq('id', comment.author_id)
                .single();

              if (commentAuthorError) {
                console.error('Error al cargar autor del comentario:', commentAuthorError);
              }

              // Intentar obtener el avatar de link_bio_profiles si existe
              let commentAvatar = commentAuthor?.avatar;
              if (commentAuthor) {
                const { data: linkBioProfile } = await supabase
                  .from('link_bio_profiles')
                  .select('avatar')
                  .eq('user_id', commentAuthor.id)
                  .maybeSingle();
                
                if (linkBioProfile?.avatar) {
                  commentAvatar = linkBioProfile.avatar;
                }
              }

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
            })
          );

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
              comments: commentsWithAuthors
            };
        })
      );

      setPosts(postsWithComments);
    } catch (err) {
      console.error('Error al cargar posts:', err);
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