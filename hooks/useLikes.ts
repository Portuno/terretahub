import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export type LikeType = 'like' | 'dislike' | null;

interface UseLikesOptions {
  entityType: 'post' | 'comment' | 'resource' | 'blog';
  entityId: string;
  currentLikeType?: LikeType;
  likesCount?: number;
  dislikesCount?: number;
  userId: string | null;
}

interface UseLikesReturn {
  likeType: LikeType;
  likesCount: number;
  dislikesCount: number;
  isLiking: boolean;
  handleLike: () => Promise<void>;
  handleDislike: () => Promise<void>;
}

const getTableName = (entityType: UseLikesOptions['entityType']) => {
  switch (entityType) {
    case 'post':
      return 'agora_post_likes';
    case 'comment':
      return 'agora_comment_likes';
    case 'resource':
      return 'resource_votes';
    case 'blog':
      return 'blog_likes';
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

const getEntityIdColumn = (entityType: UseLikesOptions['entityType']) => {
  switch (entityType) {
    case 'post':
      return 'post_id';
    case 'comment':
      return 'comment_id';
    case 'resource':
      return 'resource_id';
    case 'blog':
      return 'blog_id';
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

const getMainTableName = (entityType: UseLikesOptions['entityType']) => {
  switch (entityType) {
    case 'post':
      return 'agora_posts';
    case 'comment':
      return 'agora_comments';
    case 'resource':
      return 'resources';
    case 'blog':
      return 'blogs';
    default:
      return '';
  }
};

/** Recount votes from the likes table (source of truth). Denormalized counters are often stale. */
const recountVotes = async (
  entityType: UseLikesOptions['entityType'],
  entityId: string
): Promise<{ likes: number; dislikes: number }> => {
  const tableName = getTableName(entityType);
  const entityIdColumn = getEntityIdColumn(entityType);

  const { data: rows, error } = await supabase
    .from(tableName)
    .select('type')
    .eq(entityIdColumn, entityId);

  if (error) {
    console.error('Error recounting likes:', error);
    throw error;
  }

  let likes = 0;
  let dislikes = 0;
  (rows || []).forEach((row: { type?: string }) => {
    if (row.type === 'like') likes += 1;
    else if (row.type === 'dislike') dislikes += 1;
  });

  // Best-effort sync of denormalized columns (may fail under RLS for non-authors).
  const mainTableName = getMainTableName(entityType);
  if (mainTableName) {
    await supabase
      .from(mainTableName)
      .update({ likes_count: likes, dislikes_count: dislikes })
      .eq('id', entityId);
  }

  return { likes, dislikes };
};

export const useLikes = ({
  entityType,
  entityId,
  currentLikeType,
  likesCount: initialLikesCount = 0,
  dislikesCount: initialDislikesCount = 0,
  userId
}: UseLikesOptions): UseLikesReturn => {
  const [likeType, setLikeType] = useState<LikeType>(currentLikeType || null);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
  const [isLiking, setIsLiking] = useState(false);

  // Track entity identity so we only reset from props when the entity changes,
  // not when a parent re-renders with stale denormalized counts (often 0).
  const lastEntityIdRef = useRef(entityId);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (entityId !== lastEntityIdRef.current) {
      lastEntityIdRef.current = entityId;
      hasInteractedRef.current = false;
      setLikeType(currentLikeType || null);
      setLikesCount(initialLikesCount);
      setDislikesCount(initialDislikesCount);
      return;
    }

    // Accept fresher counts from parent only before the user interacts locally.
    if (!hasInteractedRef.current && !isLiking) {
      setLikeType(currentLikeType || null);
      setLikesCount(initialLikesCount);
      setDislikesCount(initialDislikesCount);
    }
  }, [entityId, currentLikeType, initialLikesCount, initialDislikesCount, isLiking]);

  const toggleLike = async (type: 'like' | 'dislike') => {
    if (!userId) {
      return;
    }

    setIsLiking(true);
    hasInteractedRef.current = true;
    const tableName = getTableName(entityType);
    const entityIdColumn = getEntityIdColumn(entityType);

    const previousLikeType = likeType;
    const previousLikesCount = likesCount;
    const previousDislikesCount = dislikesCount;

    try {
      // Optimistic UI
      if (previousLikeType === type) {
        setLikeType(null);
        if (type === 'like') {
          setLikesCount((prev) => Math.max(0, prev - 1));
        } else {
          setDislikesCount((prev) => Math.max(0, prev - 1));
        }
      } else if (previousLikeType) {
        setLikeType(type);
        if (type === 'like') {
          setLikesCount((prev) => prev + 1);
          setDislikesCount((prev) => Math.max(0, prev - 1));
        } else {
          setDislikesCount((prev) => prev + 1);
          setLikesCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        setLikeType(type);
        if (type === 'like') {
          setLikesCount((prev) => prev + 1);
        } else {
          setDislikesCount((prev) => prev + 1);
        }
      }

      const { data: existing, error: existingError } = await supabase
        .from(tableName)
        .select('id, type')
        .eq(entityIdColumn, entityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        if (existing.type === type) {
          const { error } = await supabase.from(tableName).delete().eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(tableName).update({ type }).eq('id', existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from(tableName).insert({
          [entityIdColumn]: entityId,
          user_id: userId,
          type
        });
        if (error) throw error;
      }

      // Source of truth: recount from likes table (not denormalized columns).
      const { likes, dislikes } = await recountVotes(entityType, entityId);
      setLikesCount(likes);
      setDislikesCount(dislikes);

      const { data: currentUserLike } = await supabase
        .from(tableName)
        .select('type')
        .eq(entityIdColumn, entityId)
        .eq('user_id', userId)
        .maybeSingle();

      setLikeType((currentUserLike?.type as LikeType) || null);
    } catch (error) {
      console.error('Error toggling like:', error);
      setLikeType(previousLikeType);
      setLikesCount(previousLikesCount);
      setDislikesCount(previousDislikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleLike = () => toggleLike('like');
  const handleDislike = () => toggleLike('dislike');

  return {
    likeType,
    likesCount,
    dislikesCount,
    isLiking,
    handleLike,
    handleDislike
  };
};
