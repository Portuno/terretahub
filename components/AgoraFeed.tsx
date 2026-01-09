import React, { useState, useRef, useEffect } from 'react';
import { Send, User, AlertTriangle, Image as ImageIcon, Video, Link as LinkIcon, X } from 'lucide-react';
import { AgoraPost as AgoraPostComponent } from './AgoraPost';
import { AgoraPost, AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry, executeBatchedQuery } from '../lib/supabaseHelpers';
import { isAdmin } from '../lib/userRoles';
import { uploadAgoraMedia, validateAgoraMedia, validateLinkUrl } from '../lib/agoraMediaUtils';
import { useMentions } from '../hooks/useMentions';
import { MentionSuggestions } from './MentionSuggestions';
import { createMentionNotifications } from '../lib/mentionUtils';

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

  // Mentions
  const {
    mentionState,
    suggestions,
    loading: mentionsLoading,
    insertMention,
    handleTextChange: handleMentionTextChange,
    handleKeyDown: handleMentionKeyDown
  } = useMentions(textareaRef, newPostContent, setNewPostContent);

  // Media State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Función para recargar posts (útil cuando se actualiza un avatar)
  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // OPTIMIZED: Use single RPC function that loads posts + comments + profiles in one query
      // This reduces from 3+ queries to 1, and filters large base64 avatars
      const { data: feedData, error: feedError } = await executeQueryWithRetry(
        async () => await supabase.rpc('get_agora_feed', { limit_posts: 50 }),
        'load agora feed'
      );

      if (feedError) {
        console.error('[AgoraFeed] Error al cargar feed:', feedError);
        // Fallback to old method if function doesn't exist
        await loadPostsFallback();
        return;
      }

      if (!feedData || !feedData.posts || feedData.posts.length === 0) {
        setPosts([]);
        return;
      }

      // Transform the RPC response to match our interface
      const transformedPosts: AgoraPost[] = feedData.posts.map((post: any) => ({
        id: post.id,
        authorId: post.author_id,
        author: {
          name: post.author?.name || 'Usuario',
          handle: `@${post.author?.username || 'usuario'}`,
          avatar: post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username || 'user'}`,
          role: post.author?.role === 'admin' ? 'Admin' : 'Miembro'
        },
        content: post.content,
        timestamp: formatTimestamp(post.created_at),
        imageUrls: post.image_urls || [],
        videoUrl: post.video_url || null,
        linkUrl: post.link_url || null,
        comments: (post.comments || []).map((comment: any) => ({
          id: comment.id,
          author: {
            name: comment.author?.name || 'Usuario',
            handle: `@${comment.author?.username || 'usuario'}`,
            avatar: comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username || 'user'}`
          },
          content: comment.content,
          timestamp: formatTimestamp(comment.created_at)
        }))
      }));

      setPosts(transformedPosts);
    } catch (err) {
      console.error('[AgoraFeed] Error al cargar posts:', err);
      // Fallback to old method on error
      await loadPostsFallback();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method using the old approach (in case the RPC function doesn't exist)
  const loadPostsFallback = async () => {
    try {
      // Cargar posts con retry
      const { data: postsData, error: postsError } = await executeQueryWithRetry(
        async () => await supabase
          .from('agora_posts')
          .select('id, author_id, content, image_urls, video_url, link_url, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(50), // Limit initial load
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
            imageUrls: post.image_urls || [],
            videoUrl: post.video_url || null,
            linkUrl: post.link_url || null,
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
            imageUrls: post.image_urls || [],
            videoUrl: post.video_url || null,
            linkUrl: post.link_url || null,
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filtrar solo imágenes
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setMediaError('Por favor selecciona solo archivos de imagen.');
      return;
    }

    const allFiles = [...selectedFiles, ...imageFiles];
    const validation = validateAgoraMedia(allFiles);

    if (!validation.ok) {
      setMediaError(validation.error || 'Error al validar archivos');
      return;
    }

    setSelectedFiles(allFiles);
    setMediaError(null);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filtrar solo videos
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    if (videoFiles.length === 0) {
      setMediaError('Por favor selecciona solo archivos de video.');
      return;
    }

    // Solo permitir un video
    if (videoFiles.length > 1) {
      setMediaError('Solo puedes subir un video por post.');
      return;
    }

    const allFiles = [...selectedFiles, ...videoFiles];
    const validation = validateAgoraMedia(allFiles);

    if (!validation.ok) {
      setMediaError(validation.error || 'Error al validar archivos');
      return;
    }

    setSelectedFiles(allFiles);
    setMediaError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMediaError(null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newPostContent.trim() && selectedFiles.length === 0 && !linkUrl.trim())) {
      alert('El post debe tener contenido, media o un enlace.');
      return;
    }

    // Validar media antes de subir
    if (selectedFiles.length > 0) {
      const validation = validateAgoraMedia(selectedFiles);
      if (!validation.ok) {
        setMediaError(validation.error || 'Error al validar archivos');
        return;
      }
    }

    // Validar link
    const cleanedLinkUrl = validateLinkUrl(linkUrl);

    setIsUploading(true);
    setMediaError(null);

    try {
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;

      // Subir media si hay archivos
      if (selectedFiles.length > 0) {
        const mediaResult = await uploadAgoraMedia(user.id, selectedFiles, null);
        imageUrls = mediaResult.imageUrls;
        videoUrl = mediaResult.videoUrl;
      }

      // Crear post en Supabase
      const { data: newPost, error: postError } = await supabase
        .from('agora_posts')
        .insert({
          author_id: user.id,
          content: newPostContent.trim() || '',
          image_urls: imageUrls,
          video_url: videoUrl,
          link_url: cleanedLinkUrl
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

      // Crear notificaciones para usuarios mencionados
      if (newPostContent.trim()) {
        await createMentionNotifications(
          newPostContent,
          user.id,
          updatedProfile?.name || user.name,
          newPost.id,
          'post'
        );
      }

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
        imageUrls: newPost.image_urls || [],
        videoUrl: newPost.video_url || null,
        linkUrl: newPost.link_url || null,
        comments: []
      };

      // Agregar al inicio de la lista
      setPosts(prev => [formattedPost, ...prev]);
      setNewPostContent('');
      setSelectedFiles([]);
      setLinkUrl('');
      setShowLinkInput(false);
      setPasteCount(0);
      setShowPasteWarning(false);
      setMediaError(null);
      
      // Limpiar inputs de archivos
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error al crear post:', err);
      alert('Error al publicar. Intenta nuevamente.');
    } finally {
      setIsUploading(false);
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

      // Crear notificaciones para usuarios mencionados en el comentario
      if (content.trim()) {
        await createMentionNotifications(
          content,
          user.id,
          updatedProfile?.name || user.name,
          newComment.id,
          'comment'
        );
      }

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
                    <div className="relative">
                      <textarea
                          ref={textareaRef}
                          placeholder="Comparte algo con la comunidad"
                          className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-terreta-secondary/50 resize-none h-24 p-0 pb-14 font-sans text-terreta-dark"
                          value={newPostContent}
                          onChange={(e) => {
                            setNewPostContent(e.target.value);
                            if (textareaRef.current) {
                              handleMentionTextChange(e.target.value, textareaRef.current.selectionStart);
                            }
                          }}
                          onKeyDown={(e) => {
                            handleMentionKeyDown(e);
                          }}
                          onPaste={handlePaste}
                      />
                      <MentionSuggestions
                        suggestions={suggestions}
                        selectedIndex={mentionState.selectedIndex}
                        position={mentionState.position}
                        onSelect={insertMention}
                        loading={mentionsLoading}
                      />
                    </div>
                    
                    {/* Media Icons - Bottom Left */}
                    <div className="absolute bottom-3 left-0 flex gap-2 z-10">
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageSelect}
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        id="agora-image-input"
                      />
                      <label
                        htmlFor="agora-image-input"
                        className="p-1.5 text-terreta-secondary hover:text-terreta-dark hover:bg-terreta-bg rounded transition-colors cursor-pointer"
                        title="Agregar fotos"
                      >
                        <ImageIcon size={18} />
                      </label>
                      
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoSelect}
                        accept="video/mp4,video/webm"
                        className="hidden"
                        id="agora-video-input"
                      />
                      <label
                        htmlFor="agora-video-input"
                        className="p-1.5 text-terreta-secondary hover:text-terreta-dark hover:bg-terreta-bg rounded transition-colors cursor-pointer"
                        title="Agregar video"
                      >
                        <Video size={18} />
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkInput(!showLinkInput);
                          if (!showLinkInput && linkInputRef.current) {
                            setTimeout(() => linkInputRef.current?.focus(), 0);
                          }
                        }}
                        className="p-1.5 text-terreta-secondary hover:text-terreta-dark hover:bg-terreta-bg rounded transition-colors cursor-pointer"
                        title="Agregar enlace"
                      >
                        <LinkIcon size={18} />
                      </button>
                    </div>
                 </div>

                 {/* Media Selection */}
                 <div className="mt-3 space-y-2">
                   {/* Selected Files Preview */}
                   {selectedFiles.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                       {selectedFiles.map((file, index) => (
                         <div key={index} className="relative group">
                           {file.type.startsWith('image/') ? (
                             <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-terreta-border">
                               <img 
                                 src={URL.createObjectURL(file)} 
                                 alt={file.name}
                                 className="w-full h-full object-cover"
                               />
                               <button
                                 type="button"
                                 onClick={() => handleRemoveFile(index)}
                                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 aria-label="Eliminar imagen"
                               >
                                 <X size={12} />
                               </button>
                             </div>
                           ) : (
                             <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-terreta-border bg-terreta-bg flex items-center justify-center">
                               <Video size={24} className="text-terreta-secondary" />
                               <button
                                 type="button"
                                 onClick={() => handleRemoveFile(index)}
                                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 aria-label="Eliminar video"
                               >
                                 <X size={12} />
                               </button>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   )}

                   {/* Error Message */}
                   {mediaError && (
                     <div className="text-red-500 text-xs flex items-center gap-1">
                       <AlertTriangle size={12} />
                       <span>{mediaError}</span>
                     </div>
                   )}

                   {/* Link Input */}
                   {(showLinkInput || linkUrl.trim()) && (
                     <div className="relative">
                       <LinkIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terreta-secondary" />
                       <input
                         ref={linkInputRef}
                         type="text"
                         placeholder="Agregar enlace (opcional)"
                         value={linkUrl}
                         onChange={(e) => setLinkUrl(e.target.value)}
                         onBlur={() => {
                           if (!linkUrl.trim()) {
                             setShowLinkInput(false);
                           }
                         }}
                         className="w-full bg-terreta-bg/50 border-terreta-border border rounded-lg px-10 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark placeholder-terreta-secondary/50"
                       />
                     </div>
                   )}
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-terreta-accent uppercase tracking-wide">Público</span>
                    <button 
                      type="submit" 
                      disabled={(!newPostContent.trim() && selectedFiles.length === 0 && !linkUrl.trim()) || isUploading}
                      className="bg-terreta-dark text-terreta-bg px-6 py-2 rounded-full font-bold text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-terreta-bg"></div>
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <span>Publicar</span>
                          <Send size={14} />
                        </>
                      )}
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