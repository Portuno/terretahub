import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ThumbsUp } from 'lucide-react';
import type { AgoraPost, AuthUser } from '../../types';
import { useLikes } from '../../hooks/useLikes';
import { formatRelativeTime } from '../../lib/relativeTime';
import { BottomSheet } from './BottomSheet';

interface AgoraMobileCardProps {
  post: AgoraPost;
  currentUser: AuthUser | null;
  onReply: (postId: string, content: string) => void;
  onOpenAuth: () => void;
}

export const AgoraMobileCard: React.FC<AgoraMobileCardProps> = ({
  post,
  currentUser,
  onReply,
  onOpenAuth,
}) => {
  const likes = useLikes({
    entityType: 'post',
    entityId: post.id,
    currentLikeType: post.userLikeType || null,
    likesCount: post.likesCount || 0,
    dislikesCount: post.dislikesCount || 0,
    userId: currentUser?.id || null,
  });
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const image = post.imageUrls?.[0];

  const react = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    void likes.handleLike();
  };

  const sendComment = () => {
    const text = comment.trim();
    if (!text) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    onReply(post.id, text);
    setComment('');
    setCommentOpen(false);
  };

  return (
    <article className="rounded-shell border border-terreta-border bg-terreta-card p-3 shadow-shell">
      <div className="flex items-center gap-2">
        <img
          src={post.author.avatar}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-m-sm font-semibold text-terreta-dark">{post.author.name}</p>
          <p className="text-m-sm text-terreta-secondary">{formatRelativeTime(post.createdAt || post.timestamp)}</p>
        </div>
      </div>
      <Link to={`/agora/post/${post.id}`} className="mt-2 block text-m-base text-terreta-dark line-clamp-1">
        {post.content}
      </Link>
      {image ? (
        <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-shell bg-terreta-bg">
          <img
            src={image}
            alt=""
            width={640}
            height={480}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={react}
          className="inline-flex h-10 items-center gap-1 rounded-shell px-2 text-m-sm text-terreta-dark"
        >
          <ThumbsUp size={16} className={likes.likeType === 'like' ? 'fill-current text-terreta-accent' : ''} />
          {likes.likesCount}
        </button>
        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          className="inline-flex h-10 items-center gap-1 rounded-shell px-2 text-m-sm text-terreta-dark"
        >
          <MessageCircle size={16} />
          {post.comments.length}
        </button>
      </div>
      <BottomSheet open={commentOpen} title="Comentar" onClose={() => setCommentOpen(false)}>
        <label className="mb-2 block text-m-sm text-terreta-secondary" htmlFor={`comment-${post.id}`}>
          Un comentario
        </label>
        <textarea
          id={`comment-${post.id}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="w-full rounded-shell border border-terreta-border bg-terreta-bg p-3 text-m-base text-terreta-dark"
        />
        <button
          type="button"
          onClick={sendComment}
          className="mt-3 h-11 w-full rounded-shell bg-terreta-accent text-m-base text-white"
        >
          Enviar
        </button>
      </BottomSheet>
    </article>
  );
};
