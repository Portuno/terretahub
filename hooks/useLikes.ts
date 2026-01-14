import { useState, useEffect } from 'react';
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
  const [lastSyncedEntityId, setLastSyncedEntityId] = useState(entityId);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Sincronizar estado SOLO cuando cambia el entityId (nuevo post/comentario)
  // NO sincronizar cuando cambian los valores iniciales para evitar sobrescribir cambios optimistas
  // Los valores se actualizarán correctamente después de cada operación desde la BD
  useEffect(() => {
    // Solo sincronizar si cambió el entityId (nuevo post/comentario)
    if (entityId !== lastSyncedEntityId) {
      setLikeType(currentLikeType || null);
      setLikesCount(initialLikesCount);
      setDislikesCount(initialDislikesCount);
      setLastSyncedEntityId(entityId);
      setHasLocalChanges(false);
    }
    // NO sincronizar cuando cambian los valores iniciales para evitar sobrescribir cambios optimistas
    // Los valores se actualizarán correctamente después de cada operación desde la BD
  }, [entityId, lastSyncedEntityId, currentLikeType, initialLikesCount, initialDislikesCount]);

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
    setHasLocalChanges(true);
    const tableName = getTableName();
    const entityIdColumn = getEntityIdColumn();

    // Guardar estado anterior para revertir en caso de error
    const previousLikeType = likeType;
    const previousLikesCount = likesCount;
    const previousDislikesCount = dislikesCount;

    try {
      // Actualización optimista inmediata
      if (previousLikeType === type) {
        // Si ya tiene el mismo tipo, eliminar
        setLikeType(null);
        if (type === 'like') {
          setLikesCount(prev => Math.max(0, prev - 1));
        } else {
          setDislikesCount(prev => Math.max(0, prev - 1));
        }
      } else if (previousLikeType) {
        // Si tiene el tipo opuesto, cambiar
        setLikeType(type);
        if (type === 'like') {
          setLikesCount(prev => prev + 1);
          setDislikesCount(prev => Math.max(0, prev - 1));
        } else {
          setDislikesCount(prev => prev + 1);
          setLikesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Crear nuevo like/dislike
        setLikeType(type);
        if (type === 'like') {
          setLikesCount(prev => prev + 1);
        } else {
          setDislikesCount(prev => prev + 1);
        }
      }

      // Verificar si ya existe un like/dislike en la BD
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
        } else {
          // Si tiene el tipo opuesto, actualizar
          const { error } = await supabase
            .from(tableName)
            .update({ type })
            .eq('id', existing.id);

          if (error) throw error;
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
      }

      // Recargar valores reales de la BD para asegurar sincronización
      // Los triggers actualizan los contadores automáticamente
      let mainTableName: string;
      switch (entityType) {
        case 'post':
          mainTableName = 'agora_posts';
          break;
        case 'comment':
          mainTableName = 'agora_comments';
          break;
        case 'resource':
          mainTableName = 'resources';
          break;
        case 'blog':
          mainTableName = 'blogs';
          break;
        default:
          mainTableName = '';
      }

      // Recargar valores reales de la BD para asegurar sincronización
      // Los triggers actualizan los contadores automáticamente
      if (mainTableName) {
        const { data: updatedEntity } = await supabase
          .from(mainTableName)
          .select('likes_count, dislikes_count')
          .eq('id', entityId)
          .single();

        if (updatedEntity) {
          setLikesCount(updatedEntity.likes_count || 0);
          setDislikesCount(updatedEntity.dislikes_count || 0);
        }
      }

      // Verificar el tipo de like actual del usuario
      const { data: currentUserLike } = await supabase
        .from(tableName)
        .select('type')
        .eq(entityIdColumn, entityId)
        .eq('user_id', userId)
        .maybeSingle();

      setLikeType((currentUserLike?.type as LikeType) || null);
      setHasLocalChanges(false); // Marcar que ya se sincronizó con la BD

    } catch (error) {
      console.error('Error toggling like:', error);
      // Revertir cambios optimistas en caso de error
      setLikeType(previousLikeType);
      setLikesCount(previousLikesCount);
      setDislikesCount(previousDislikesCount);
      setHasLocalChanges(false);
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
