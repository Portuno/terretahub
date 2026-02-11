// Helper functions for analytics tracking
import { supabase } from './supabase';

/**
 * Detecta el tipo de dispositivo basado en el user agent
 */
export const detectDeviceType = (): 'mobile' | 'desktop' | 'tablet' | 'unknown' => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Detectar tablet
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }

  // Detectar móvil
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }

  // Por defecto, desktop
  return 'desktop';
};

/**
 * Registra una vista de perfil
 */
export const trackProfileView = async (
  profileUserId: string,
  userAgent?: string,
  referrer?: string
): Promise<void> => {
  try {
    const deviceType = detectDeviceType();

    await supabase.from('profile_views').insert({
      profile_user_id: profileUserId,
      device_type: deviceType,
      user_agent: userAgent || (typeof window !== 'undefined' ? navigator.userAgent : null),
      referrer: referrer || (typeof window !== 'undefined' ? document.referrer || null : null)
    });
  } catch (error) {
    // Silenciar errores de tracking para no interrumpir la experiencia del usuario
    console.warn('Error tracking profile view:', error);
  }
};

/**
 * Registra un click en un enlace
 */
export const trackLinkClick = async (
  profileUserId: string,
  blockId: string,
  linkUrl: string,
  linkTitle?: string,
  userAgent?: string,
  referrer?: string
): Promise<void> => {
  try {
    const deviceType = detectDeviceType();

    await supabase.from('link_clicks').insert({
      profile_user_id: profileUserId,
      block_id: blockId,
      link_url: linkUrl,
      link_title: linkTitle || null,
      device_type: deviceType,
      user_agent: userAgent || (typeof window !== 'undefined' ? navigator.userAgent : null),
      referrer: referrer || (typeof window !== 'undefined' ? document.referrer || null : null)
    });
  } catch (error) {
    // Silenciar errores de tracking para no interrumpir la experiencia del usuario
    console.warn('Error tracking link click:', error);
  }
};

/**
 * Obtiene las estadísticas de vistas de perfil
 */
export const getProfileViewsStats = async (
  profileUserId: string,
  daysBack: number = 30
): Promise<{
  total_views: number;
  mobile_views: number;
  desktop_views: number;
  tablet_views: number;
  views_today: number;
  views_this_week: number;
  views_this_month: number;
} | null> => {
  try {
    const { data, error } = await supabase.rpc('get_profile_views_stats', {
      p_user_id: profileUserId,
      days_back: daysBack
    });

    if (error) {
      console.error('Error getting profile views stats:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : {
      total_views: 0,
      mobile_views: 0,
      desktop_views: 0,
      tablet_views: 0,
      views_today: 0,
      views_this_week: 0,
      views_this_month: 0
    };
  } catch (error) {
    console.error('Error getting profile views stats:', error);
    return null;
  }
};

/**
 * Obtiene las estadísticas de clicks en enlaces
 */
export const getLinkClicksStats = async (
  profileUserId: string,
  daysBack: number = 30
): Promise<{
  total_clicks: number;
  mobile_clicks: number;
  desktop_clicks: number;
  tablet_clicks: number;
  clicks_today: number;
  clicks_this_week: number;
  clicks_this_month: number;
  top_link_url: string;
  top_link_title: string;
  top_link_clicks: number;
} | null> => {
  try {
    const { data, error } = await supabase.rpc('get_link_clicks_stats', {
      p_user_id: profileUserId,
      days_back: daysBack
    });

    if (error) {
      console.error('Error getting link clicks stats:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : {
      total_clicks: 0,
      mobile_clicks: 0,
      desktop_clicks: 0,
      tablet_clicks: 0,
      clicks_today: 0,
      clicks_this_week: 0,
      clicks_this_month: 0,
      top_link_url: '',
      top_link_title: '',
      top_link_clicks: 0
    };
  } catch (error) {
    console.error('Error getting link clicks stats:', error);
    return null;
  }
};
