import { useState } from 'react';
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

  const getTableName = () => {
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

  const getEntityIdColumn = () => {
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

  const toggleLike = async (type: 'like' | 'dislike') => {
    if (!userId) {
      return;
    }

    setIsLiking(true);
    const tableName = getTableName();
    const entityIdColumn = getEntityIdColumn();

    try {
      // Verificar si ya existe un like/dislike
      const { data: existing } = await supabase
        .from(tableName)
        .select('id, type')
        .eq(entityIdColumn, entityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.type === type) {
          // Si ya tiene el mismo tipo, eliminar
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', existing.id);

          if (error) throw error;

          setLikeType(null);
          if (type === 'like') {
            setLikesCount(prev => Math.max(0, prev - 1));
          } else {
            setDislikesCount(prev => Math.max(0, prev - 1));
          }
        } else {
          // Si tiene el tipo opuesto, actualizar
          const { error } = await supabase
            .from(tableName)
            .update({ type })
            .eq('id', existing.id);

          if (error) throw error;

          setLikeType(type);
          if (type === 'like') {
            setLikesCount(prev => prev + 1);
            setDislikesCount(prev => Math.max(0, prev - 1));
          } else {
            setDislikesCount(prev => prev + 1);
            setLikesCount(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        // Crear nuevo like/dislike
        const { error } = await supabase
          .from(tableName)
          .insert({
            [entityIdColumn]: entityId,
            user_id: userId,
            type
          });

        if (error) throw error;

        setLikeType(type);
        if (type === 'like') {
          setLikesCount(prev => prev + 1);
        } else {
          setDislikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revertir cambios optimistas en caso de error
      // Los triggers de la BD mantendrán los contadores correctos
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
