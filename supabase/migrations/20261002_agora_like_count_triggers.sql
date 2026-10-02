-- Keep agora_posts / agora_comments likes_count and dislikes_count in sync
-- with agora_post_likes / agora_comment_likes. Client already recounts from
-- the likes tables; these triggers repair denormalized columns for sorting/RPC.

CREATE OR REPLACE FUNCTION public.sync_agora_post_like_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE agora_posts
  SET
    likes_count = (
      SELECT COUNT(*)::int FROM agora_post_likes
      WHERE post_id = target_post_id AND type = 'like'
    ),
    dislikes_count = (
      SELECT COUNT(*)::int FROM agora_post_likes
      WHERE post_id = target_post_id AND type = 'dislike'
    )
  WHERE id = target_post_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_agora_comment_like_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_comment_id uuid;
BEGIN
  target_comment_id := COALESCE(NEW.comment_id, OLD.comment_id);
  UPDATE agora_comments
  SET
    likes_count = (
      SELECT COUNT(*)::int FROM agora_comment_likes
      WHERE comment_id = target_comment_id AND type = 'like'
    ),
    dislikes_count = (
      SELECT COUNT(*)::int FROM agora_comment_likes
      WHERE comment_id = target_comment_id AND type = 'dislike'
    )
  WHERE id = target_comment_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_agora_post_like_counts ON agora_post_likes;
CREATE TRIGGER trg_sync_agora_post_like_counts
  AFTER INSERT OR UPDATE OR DELETE ON agora_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_agora_post_like_counts();

DROP TRIGGER IF EXISTS trg_sync_agora_comment_like_counts ON agora_comment_likes;
CREATE TRIGGER trg_sync_agora_comment_like_counts
  AFTER INSERT OR UPDATE OR DELETE ON agora_comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_agora_comment_like_counts();

-- One-shot backfill for existing rows
UPDATE agora_posts p
SET
  likes_count = COALESCE((
    SELECT COUNT(*)::int FROM agora_post_likes l
    WHERE l.post_id = p.id AND l.type = 'like'
  ), 0),
  dislikes_count = COALESCE((
    SELECT COUNT(*)::int FROM agora_post_likes l
    WHERE l.post_id = p.id AND l.type = 'dislike'
  ), 0);

UPDATE agora_comments c
SET
  likes_count = COALESCE((
    SELECT COUNT(*)::int FROM agora_comment_likes l
    WHERE l.comment_id = c.id AND l.type = 'like'
  ), 0),
  dislikes_count = COALESCE((
    SELECT COUNT(*)::int FROM agora_comment_likes l
    WHERE l.comment_id = c.id AND l.type = 'dislike'
  ), 0);
