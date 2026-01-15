import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseFollowOptions {
  userId: string | null; // Usuario actual
  targetUserId: string | null; // Usuario a seguir/dejar de seguir
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
}

interface UseFollowReturn {
  isFollowing: boolean;
  followersCount: number;
  isToggling: boolean;
  toggleFollow: () => Promise<void>;
}

export const useFollow = ({
  userId,
  targetUserId,
  initialIsFollowing = false,
  initialFollowersCount = 0
}: UseFollowOptions): UseFollowReturn => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isToggling, setIsToggling] = useState(false);

  // Verificar estado inicial
  useEffect(() => {
    if (!userId || !targetUserId || userId === targetUserId) {
      return;
    }

    const checkFollowStatus = async () => {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      setIsFollowing(!!data);
    };

    checkFollowStatus();
  }, [userId, targetUserId]);

  const toggleFollow = async () => {
    if (!userId || !targetUserId || userId === targetUserId) {
      return;
    }

    setIsToggling(true);

    try {
      if (isFollowing) {
        // Dejar de seguir
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Seguir
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: targetUserId
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revertir cambios optimistas
    } finally {
      setIsToggling(false);
    }
  };

  return {
    isFollowing,
    followersCount,
    isToggling,
    toggleFollow
  };
};
