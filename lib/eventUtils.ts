import { supabase } from './supabase';
import { generateSlug } from './utils';

/**
 * Genera un slug único para un evento basado en el título y username del organizador
 */
export const generateEventSlug = (title: string, username: string): string => {
  const titleSlug = generateSlug(title);
  const usernameSlug = generateSlug(username);
  return `${usernameSlug}-${titleSlug}`;
};

/**
 * Valida si un slug es único para un organizador específico
 * @param slug - El slug a validar
 * @param organizerId - ID del organizador
 * @param excludeEventId - ID del evento a excluir de la validación (útil para actualizaciones)
 * @returns true si el slug es único, false si ya existe
 */
export const validateEventSlug = async (
  slug: string,
  organizerId: string,
  excludeEventId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('events')
      .select('id')
      .eq('organizer_id', organizerId)
      .eq('slug', slug);

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es esperado si no existe
      console.error('[eventUtils] Error validating slug:', error);
      return false;
    }

    // Si data es null, el slug no existe (es único)
    return data === null;
  } catch (error) {
    console.error('[eventUtils] Exception validating slug:', error);
    return false;
  }
};

/**
 * Genera un slug único para un evento, agregando sufijo numérico si es necesario
 * @param title - Título del evento
 * @param username - Username del organizador
 * @param organizerId - ID del organizador
 * @param excludeEventId - ID del evento a excluir (útil para actualizaciones)
 * @returns Slug único
 */
export const generateUniqueEventSlug = async (
  title: string,
  username: string,
  organizerId: string,
  excludeEventId?: string
): Promise<string> => {
  const baseSlug = generateEventSlug(title, username);
  
  // Limitar longitud del slug (máximo 100 caracteres)
  let slug = baseSlug.length > 100 ? baseSlug.substring(0, 100) : baseSlug;
  
  // Verificar si el slug es único
  let isUnique = await validateEventSlug(slug, organizerId, excludeEventId);
  
  if (isUnique) {
    return slug;
  }
  
  // Si no es único, agregar sufijo numérico
  let counter = 1;
  let uniqueSlug = `${slug}-${counter}`;
  
  while (!(await validateEventSlug(uniqueSlug, organizerId, excludeEventId))) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
    
    // Prevenir loops infinitos
    if (counter > 999) {
      // Usar timestamp como fallback
      uniqueSlug = `${slug}-${Date.now()}`;
      break;
    }
  }
  
  return uniqueSlug;
};

/**
 * Obtiene las estadísticas de un evento para el organizador
 * @param eventId - ID del evento
 * @param organizerId - ID del organizador (para verificación de permisos)
 * @returns Estadísticas del evento
 */
export const getEventStats = async (
  eventId: string,
  organizerId: string
): Promise<{
  totalRegistrations: number;
  totalReferrals: number;
  referrals: Array<{
    id: string;
    inviteeId: string;
    inviteeName: string;
    inviteeUsername: string;
    inviteeAvatar: string;
    createdAt: string;
  }>;
}> => {
  try {
    // Verificar que el evento pertenece al organizador
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event || event.organizer_id !== organizerId) {
      throw new Error('No tienes permisos para ver las estadísticas de este evento');
    }

    // Contar registros al evento
    const { count: totalRegistrations, error: registrationsError } = await supabase
      .from('event_attendances')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'cancelled');

    if (registrationsError) {
      console.error('[eventUtils] Error counting registrations:', registrationsError);
    }

    // Obtener referidos desde este evento
    const { data: referralsData, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        invitee_id,
        created_at,
        invitee:profiles!referrals_invitee_id_fkey (
          id,
          name,
          username,
          avatar
        )
      `)
      .eq('inviter_id', organizerId)
      .eq('event_id', eventId)
      .eq('status', 'converted')
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('[eventUtils] Error loading referrals:', referralsError);
    }

    const referrals = (referralsData || []).map((ref: any) => ({
      id: ref.id,
      inviteeId: ref.invitee_id,
      inviteeName: ref.invitee?.name || 'Usuario',
      inviteeUsername: ref.invitee?.username || 'usuario',
      inviteeAvatar: ref.invitee?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ref.invitee?.username || 'user'}`,
      createdAt: ref.created_at,
    }));

    return {
      totalRegistrations: totalRegistrations || 0,
      totalReferrals: referrals.length,
      referrals,
    };
  } catch (error) {
    console.error('[eventUtils] Error getting event stats:', error);
    throw error;
  }
};
