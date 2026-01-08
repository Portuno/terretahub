import { supabase } from './supabase';

/**
 * Extrae todas las menciones (@username) de un texto
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  const usernames = new Set<string>();
  
  for (const match of matches) {
    if (match[1]) {
      usernames.add(match[1].toLowerCase());
    }
  }
  
  return Array.from(usernames);
};

/**
 * Crea notificaciones para usuarios mencionados en un post o comentario
 */
export const createMentionNotifications = async (
  content: string,
  authorId: string,
  authorName: string,
  relatedId: string,
  relatedType: 'post' | 'comment'
): Promise<void> => {
  try {
    const mentionedUsernames = extractMentions(content);
    
    if (mentionedUsernames.length === 0) {
      return;
    }

    // Buscar los IDs de usuario de los mencionados
    const { data: mentionedUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentionedUsernames);

    if (usersError) {
      console.error('Error al buscar usuarios mencionados:', usersError);
      return;
    }

    if (!mentionedUsers || mentionedUsers.length === 0) {
      return;
    }

    // Crear notificaciones para cada usuario mencionado (excepto el autor)
    const notifications = mentionedUsers
      .filter(user => user.id !== authorId)
      .map(user => ({
        user_id: user.id,
        type: 'mention' as const,
        title: 'Te mencionaron',
        message: `${authorName} te mencionó en un ${relatedType === 'post' ? 'post' : 'comentario'}`,
        related_id: relatedId,
        related_type: relatedType
      }));

    if (notifications.length === 0) {
      return;
    }

    // Insertar todas las notificaciones
    const { error: notificationsError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationsError) {
      console.error('Error al crear notificaciones de menciones:', notificationsError);
    }
  } catch (err) {
    console.error('Error al procesar menciones:', err);
  }
};
