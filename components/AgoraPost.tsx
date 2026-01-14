import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2, MoreHorizontal, Send, Trash2, Shield, ExternalLink, ThumbsUp, ThumbsDown, Hash } from 'lucide-react';
import { AgoraPost as AgoraPostType, AuthUser } from '../types';
import { canDelete } from '../lib/userRoles';
import { useProfileNavigation } from '../hooks/useProfileNavigation';
import { useMentions } from '../hooks/useMentions';
import { MentionSuggestions } from './MentionSuggestions';
import { ShareModal } from './ShareModal';
import { useLikes } from '../hooks/useLikes';
import { truncateText, shouldTruncate } from '../lib/agoraUtils';
import { PollDisplay } from './PollDisplay';

interface AgoraPostProps {
  post: AgoraPostType;
  currentUser: AuthUser | null;
  onReply: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onOpenAuth: () => void;
  autoOpenComments?: boolean;
}

// Componente separado para comentarios (permite usar hooks)
const AgoraCommentItem: React.FC<{
  comment: AgoraPostType['comments'][0];
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  navigateToProfile: (handle: string) => void;
}> = ({ comment, currentUser, onOpenAuth, navigateToProfile }) => {
  const commentLikes = useLikes({
    entityType: 'comment',
    entityId: comment.id,
    currentLikeType: comment.userLikeType || null,
    likesCount: comment.likesCount || 0,
    dislikesCount: comment.dislikesCount || 0,
    userId: currentUser?.id || null
  });

  return (
    <div className="bg-terreta-bg/50 rounded-lg p-3 flex gap-3 border border-terreta-border/50">
      <img 
        src={comment.author.avatar} 
        alt={comment.author.name} 
        className="w-8 h-8 rounded-full bg-terreta-card object-cover cursor-pointer"
        onClick={() => navigateToProfile(comment.author.handle)}
      />
      <div className="flex-1">
         <div className="flex justify-between items-baseline">
            <span 
                className="font-bold text-xs text-terreta-dark cursor-pointer hover:underline"
                onClick={() => navigateToProfile(comment.author.handle)}
            >
                {comment.author.name}
            </span>
            <span className="text-[10px] text-terreta-secondary">{comment.timestamp}</span>
         </div>
         <p className="text-sm text-terreta-dark/90 mt-1">{comment.content}</p>
         
         {/* Comment Likes/Dislikes */}
         <div className="flex items-center gap-3 mt-2">
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (!currentUser) {
                 onOpenAuth();
                 return;
               }
               commentLikes.handleLike();
             }}
             className={`flex items-center gap-1 text-xs transition-colors ${
               commentLikes.likeType === 'like'
                 ? 'text-terreta-accent'
                 : 'text-terreta-secondary hover:text-terreta-accent'
             }`}
             disabled={commentLikes.isLiking}
           >
             <ThumbsUp size={12} className={commentLikes.likeType === 'like' ? 'fill-current' : ''} />
             <span>{commentLikes.likesCount}</span>
           </button>
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (!currentUser) {
                 onOpenAuth();
                 return;
               }
               commentLikes.handleDislike();
             }}
             className={`flex items-center gap-1 text-xs transition-colors ${
               commentLikes.likeType === 'dislike'
                 ? 'text-red-500'
                 : 'text-terreta-secondary hover:text-red-500'
             }`}
             disabled={commentLikes.isLiking}
           >
             <ThumbsDown size={12} className={commentLikes.likeType === 'dislike' ? 'fill-current' : ''} />
             <span>{commentLikes.dislikesCount}</span>
           </button>
         </div>
      </div>
    </div>
  );
};

export const AgoraPost: React.FC<AgoraPostProps> = ({ post, currentUser, onReply, onDelete, onOpenAuth, autoOpenComments = false }) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(autoOpenComments);
  const [replyText, setReplyText] = useState('');
  const [pasteCount, setPasteCount] = useState(0);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const replyTextareaRef = useRef<HTMLInputElement>(null);
  
  // Likes para el post
  const postLikes = useLikes({
    entityType: 'post',
    entityId: post.id,
    currentLikeType: post.userLikeType || null,
    likesCount: post.likesCount || 0,
    dislikesCount: post.dislikesCount || 0,
    userId: currentUser?.id || null
  });
  
  const needsTruncation = shouldTruncate(post.content);
  const displayContent = isExpanded || !needsTruncation ? post.content : truncateText(post.content);
  
  const navigateToProfile = useProfileNavigation();
  const navigate = useNavigate();

  // Mentions para comentarios
  const {
    mentionState: replyMentionState,
    suggestions: replySuggestions,
    loading: replyMentionsLoading,
    insertMention: insertReplyMention,
    handleTextChange: handleReplyMentionTextChange,
    handleKeyDown: handleReplyMentionKeyDown
  } = useMentions(replyTextareaRef, replyText, setReplyText);

  const canDeletePost = canDelete(currentUser, post.authorId);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (replyText.trim()) {
      onReply(post.id, replyText);
      setReplyText('');
      setPasteCount(0);
      setShowPasteWarning(false);
    }
  };

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

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToProfile(post.author.handle);
  };

  const handlePostClick = () => {
    navigate(`/agora/post/${post.id}`);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  // Cerrar menú de eliminación al hacer click fuera
  React.useEffect(() => {
    if (!showDeleteMenu) return;
    
    const handleClickOutside = () => {
      setShowDeleteMenu(false);
    };
    
    // Usar setTimeout para evitar que se cierre inmediatamente al abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDeleteMenu]);

  const postUrl = `/agora/post/${post.id}`;

  return (
    <>
      <div 
        className="bg-terreta-card border border-terreta-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-4 cursor-pointer"
        onClick={handlePostClick}
      >
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="w-12 h-12 rounded-full bg-terreta-bg object-cover border border-terreta-border cursor-pointer"
            onClick={handleProfileClick}
          />
          <div>
            <div className="flex items-baseline gap-2">
              <h3 
                className="font-bold text-terreta-dark hover:underline cursor-pointer"
                onClick={handleProfileClick}
              >
                {post.author.name}
              </h3>
              {post.author.role === 'Admin' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-terreta-accent text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                  <Shield size={10} />
                  Admin
                </span>
              )}
              <span className="text-xs text-terreta-secondary font-sans">{post.timestamp}</span>
            </div>
            <p 
                className="text-xs text-terreta-accent font-bold uppercase tracking-wide cursor-pointer hover:text-terreta-accent/80"
                onClick={handleProfileClick}
            >
              {post.author.handle}
            </p>
          </div>
        </div>
        <div className="relative">
          {canDeletePost && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteMenu(!showDeleteMenu);
              }}
              className="text-terreta-secondary hover:text-terreta-dark relative z-10"
            >
              <MoreHorizontal size={20} />
            </button>
          )}
          {showDeleteMenu && canDeletePost && onDelete && (
            <div 
              className="absolute right-0 top-8 bg-terreta-card border border-terreta-border rounded-lg shadow-lg z-10 min-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post.id);
                  setShowDeleteMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-5 pl-[60px] space-y-4">
        {post.content && (
          <div>
            <p className="text-terreta-dark text-base leading-relaxed whitespace-pre-line font-sans">
              {displayContent}
            </p>
            {needsTruncation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-terreta-accent hover:text-terreta-dark text-sm font-medium mt-2 transition-colors"
              >
                {isExpanded ? 'Leer menos' : 'Leer completo'}
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-terreta-bg/50 text-terreta-secondary text-xs rounded-full border border-terreta-border/50"
              >
                <Hash size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Poll Display */}
        {post.poll && (
          <div onClick={(e) => e.stopPropagation()}>
            <PollDisplay
              poll={post.poll}
              currentUserId={currentUser?.id || null}
            />
          </div>
        )}

        {/* Media Display */}
        {(post.imageUrls && post.imageUrls.length > 0) || post.videoUrl ? (
          <>
            {/* Solo Video */}
            {post.videoUrl && (!post.imageUrls || post.imageUrls.length === 0) && (
              <div className="rounded-lg overflow-hidden border border-terreta-border">
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full max-h-[600px] object-contain bg-terreta-bg"
                  aria-label="Video del post"
                >
                  Tu navegador no soporta la reproducción de video.
                </video>
              </div>
            )}

            {/* Grid combinado: Video + Imágenes */}
            {((post.videoUrl && post.imageUrls && post.imageUrls.length > 0) || (post.imageUrls && post.imageUrls.length > 0)) && (
              <div
                className={`grid gap-2 rounded-lg overflow-hidden ${
                  (() => {
                    const totalItems = (post.videoUrl ? 1 : 0) + (post.imageUrls?.length || 0);
                    if (totalItems === 1) return 'grid-cols-1 max-w-md';
                    if (totalItems === 2) return 'grid-cols-2 max-w-2xl';
                    if (totalItems === 3 && !post.videoUrl) return 'grid-cols-2 grid-rows-2 max-w-2xl';
                    if (totalItems === 3) return 'grid-cols-2 grid-rows-2 max-w-2xl';
                    return 'grid-cols-2 max-w-2xl';
                  })()
                }`}
              >
                  {/* Video en el grid */}
                  {post.videoUrl && (
                    <div
                      className={`relative ${
                        (() => {
                          const totalItems = 1 + (post.imageUrls?.length || 0);
                          if (totalItems === 3) return 'row-span-2';
                          return '';
                        })()
                      }`}
                    >
                      <div className="rounded-lg overflow-hidden border border-terreta-border h-full">
                        <video
                          src={post.videoUrl}
                          controls
                          className="w-full h-full object-cover bg-terreta-bg max-h-64"
                          aria-label="Video del post"
                        >
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      </div>
                    </div>
                  )}

                {/* Imágenes en el grid */}
                {post.imageUrls && post.imageUrls.map((imageUrl, index) => {
                  // Layout específico según cantidad total de elementos
                  let gridClass = '';
                  let imageClass = 'w-full h-full object-cover rounded-lg border border-terreta-border cursor-pointer hover:opacity-90 transition-opacity';
                  const totalItems = (post.videoUrl ? 1 : 0) + post.imageUrls.length;
                  
                  if (totalItems === 3) {
                    // Si hay video + 2 imágenes, o 3 imágenes sin video
                    if (post.videoUrl) {
                      // Video ocupa 2 filas, imágenes van a la derecha
                      // No necesitamos row-span para imágenes en este caso
                      imageClass += ' max-h-64';
                    } else {
                      // 3 imágenes: primera ocupa 2 filas (todo el espacio vertical)
                      if (index === 0) {
                        gridClass = 'row-span-2';
                        // Sin limitación de altura para la primera imagen
                      } else {
                        // Las otras dos imágenes tienen altura limitada
                        imageClass += ' max-h-64';
                      }
                    }
                  } else {
                    // Para otros casos, mantener altura limitada
                    imageClass += ' max-h-64';
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`relative ${gridClass}`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Imagen ${index + 1} del post`}
                        className={imageClass}
                        onClick={(e) => {
                        e.stopPropagation();
                        setExpandedImageIndex(index);
                      }}
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {/* Expanded Image Modal - Fuera del bloque condicional para que funcione siempre */}
        {expandedImageIndex !== null && post.imageUrls && post.imageUrls.length > 0 && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedImageIndex(null)}
          >
            <button
              onClick={() => setExpandedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              aria-label="Cerrar imagen"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={post.imageUrls[expandedImageIndex]}
              alt={`Imagen ${expandedImageIndex + 1} expandida`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {post.imageUrls.length > 1 && (
              <>
                {expandedImageIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedImageIndex(expandedImageIndex - 1);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                    aria-label="Imagen anterior"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {expandedImageIndex < post.imageUrls.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedImageIndex(expandedImageIndex + 1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                    aria-label="Imagen siguiente"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Link Display */}
        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-terreta-bg/50 border border-terreta-border rounded-lg hover:bg-terreta-bg transition-colors group"
            tabIndex={0}
            aria-label={`Enlace externo: ${post.linkUrl}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-terreta-sidebar flex items-center justify-center border border-terreta-border">
                <ExternalLink size={18} className="text-terreta-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-terreta-dark truncate group-hover:text-terreta-accent transition-colors">
                  {new URL(post.linkUrl).hostname.replace('www.', '')}
                </p>
                <p className="text-xs text-terreta-secondary truncate">
                  {post.linkUrl}
                </p>
              </div>
            </div>
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pl-[60px] border-t border-terreta-border pt-3">
        {/* Like/Dislike */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) {
                onOpenAuth();
                return;
              }
              postLikes.handleLike();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition-colors ${
              postLikes.likeType === 'like'
                ? 'bg-terreta-accent/20 text-terreta-accent'
                : 'text-terreta-secondary hover:text-terreta-accent hover:bg-terreta-bg/50'
            }`}
            disabled={postLikes.isLiking}
          >
            <ThumbsUp size={16} className={postLikes.likeType === 'like' ? 'fill-current' : ''} />
            <span>{postLikes.likesCount}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) {
                onOpenAuth();
                return;
              }
              postLikes.handleDislike();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition-colors ${
              postLikes.likeType === 'dislike'
                ? 'bg-red-500/20 text-red-500'
                : 'text-terreta-secondary hover:text-red-500 hover:bg-terreta-bg/50'
            }`}
            disabled={postLikes.isLiking}
          >
            <ThumbsDown size={16} className={postLikes.likeType === 'dislike' ? 'fill-current' : ''} />
            <span>{postLikes.dislikesCount}</span>
          </button>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsCommentsOpen(!isCommentsOpen);
          }}
          className="flex items-center gap-2 text-sm font-medium text-terreta-secondary hover:text-terreta-accent transition-colors"
        >
          <MessageCircle size={18} />
          <span>{post.comments.length}</span>
        </button>

        <button 
          onClick={handleShareClick}
          className="flex items-center gap-2 text-sm font-medium text-terreta-secondary hover:text-terreta-accent transition-colors ml-auto"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="mt-4 pl-[60px] animate-fade-in space-y-4">
          
          {/* List of Comments */}
          {post.comments.map(comment => (
            <AgoraCommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onOpenAuth={onOpenAuth}
              navigateToProfile={navigateToProfile}
            />
          ))}

          {/* Reply Input */}
          <form onSubmit={handleSubmitReply} className="flex gap-2 items-center mt-2 relative" onClick={(e) => e.stopPropagation()}>
             {currentUser ? (
                <>
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="me" />
                  <div className="flex-1 relative">
                    {/* Anti-Paste Warning Overlay */}
                    {showPasteWarning && (
                      <div className="absolute -top-8 left-0 right-0 bg-red-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg text-center z-20 animate-slide-up shadow-md flex items-center justify-center gap-2">
                        <span>⚠️</span>
                        <span>No, no, no — Ctrl + V no es permitido. No sea un robot y escriba.</span>
                      </div>
                    )}
                    <input 
                      ref={replyTextareaRef}
                      type="text" 
                      placeholder="Escribe una respuesta..." 
                      className="w-full bg-terreta-bg/50 border-terreta-border border rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark placeholder-terreta-secondary/50"
                      value={replyText}
                      onChange={(e) => {
                        setReplyText(e.target.value);
                        if (replyTextareaRef.current) {
                          handleReplyMentionTextChange(e.target.value, replyTextareaRef.current.selectionStart || 0);
                        }
                      }}
                      onKeyDown={(e) => {
                        handleReplyMentionKeyDown(e);
                      }}
                      onPaste={handlePaste}
                    />
                    <MentionSuggestions
                      suggestions={replySuggestions}
                      selectedIndex={replyMentionState.selectedIndex}
                      position={replyMentionState.position}
                      onSelect={insertReplyMention}
                      loading={replyMentionsLoading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!replyText.trim()}
                    className="p-2 text-terreta-accent hover:bg-terreta-accent/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </>
             ) : (
                <div 
                  onClick={onOpenAuth}
                  className="w-full bg-terreta-bg/50 p-3 rounded-lg text-center text-sm text-terreta-secondary cursor-pointer hover:bg-terreta-bg transition-colors border border-terreta-border/50"
                >
                   Inicia sesión para responder
                </div>
             )}
          </form>

        </div>
      )}

    </div>

    <ShareModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      postUrl={postUrl}
      postContent={post.content || ''}
      authorName={post.author.name}
      authorHandle={post.author.handle}
      contentType="agora"
    />
    </>
  );
};