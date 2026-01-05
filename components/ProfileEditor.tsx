import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Layout, Type, Link as LinkIcon, Image as ImageIcon, 
  Youtube, Music, Trash2, GripVertical, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Instagram, Twitter, Linkedin, Globe, Plus, Palette, BarChart3,
  Video, Star, Heart, Zap, CheckCircle, Upload, Camera, Smartphone, Monitor,
  Images, FileText, Download, X
} from 'lucide-react';
import { AuthUser, LinkBioProfile, BioBlock, BioTheme } from '../types';
import { supabase } from '../lib/supabase';
import { PublishProfileModal } from './PublishProfileModal';
import { Toast } from './Toast';
import { trackLinkClick, getProfileViewsStats, getLinkClicksStats } from '../lib/analytics';
import { uploadAvatarToStorage, migrateAvatarToStorage } from '../lib/avatarUtils';

interface ProfileEditorProps {
  user: AuthUser;
}

// --- PREDEFINED THEMES ---
export const THEMES: BioTheme[] = [
  {
    id: 'terreta',
    name: 'Terreta Original',
    bgType: 'color',
    bgColor: '#F9F6F0',
    textColor: '#3E2723',
    buttonStyle: 'solid',
    buttonColor: '#3E2723',
    buttonTextColor: '#FFFFFF',
    font: 'serif'
  },
  {
    id: 'arcilla',
    name: 'Arcilla',
    bgType: 'color',
    bgColor: '#D4B896',
    textColor: '#2C1E1A',
    buttonStyle: 'soft',
    buttonColor: '#A65D46',
    buttonTextColor: '#FFFFFF',
    font: 'sans'
  },
  {
    id: 'bosque',
    name: 'Bosque Profundo',
    bgType: 'color',
    bgColor: '#2C3328',
    textColor: '#EBE5DA',
    buttonStyle: 'pill',
    buttonColor: '#556B2F',
    buttonTextColor: '#FFFFFF',
    font: 'serif'
  },
  {
    id: 'minimal',
    name: 'Blanco Puro',
    bgType: 'color',
    bgColor: '#FFFFFF',
    textColor: '#000000',
    buttonStyle: 'outline',
    buttonColor: '#000000',
    buttonTextColor: '#000000',
    font: 'sans'
  }
];

// --- INITIAL STATE GENERATOR ---
const getInitialProfile = (user: AuthUser): LinkBioProfile => ({
  username: user.username,
  displayName: user.name,
  bio: 'Explorador en Terreta Hub',
  avatar: user.avatar,
  socials: {},
  blocks: [
    { id: '1', type: 'link', title: 'Visita mi web', url: 'https://google.com', isVisible: true },
    { id: '2', type: 'text', content: 'Bienvenido a mi espacio personal.', isVisible: true }
  ],
  theme: THEMES[0]
});

// Helper to normalize URLs - ensures they have a protocol
const normalizeUrl = (url: string): string => {
  if (!url || url === '#') return '#';
  
  // If URL already has a protocol, return as is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  
  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // Otherwise, add https://
  return `https://${url}`;
};

// Helper for Video Embeds (YouTube & Vimeo)
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // YouTube
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1];
    return `https://www.youtube.com/embed/${id}`;
  }
  
  // Vimeo
  if (url.includes('vimeo.com/')) {
    const matches = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (matches && matches[1]) {
      return `https://player.vimeo.com/video/${matches[1]}`;
    }
  }

  return url;
};

// --- HELPER COMPONENTS ---

const HexColorPicker: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  className?: string;
}> = ({ label, value, onChange, className }) => {
  const [localHex, setLocalHex] = useState(value);

  useEffect(() => {
    setLocalHex(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalHex(newVal);
    if (/^#[0-9A-F]{6}$/i.test(newVal)) {
      onChange(newVal);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase text-terreta-secondary font-bold tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-terreta-border shadow-sm shrink-0">
          <input 
            type="color" 
            value={value.startsWith('#') ? value : '#000000'} // Fallback for gradients in basic picker
            onChange={(e) => onChange(e.target.value)}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
          />
        </div>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-terreta-secondary text-xs font-mono">#</span>
          <input 
            type="text" 
            value={localHex.replace('#', '')}
            onChange={handleHexChange}
            className="w-full pl-6 pr-3 py-2 bg-terreta-card border border-terreta-border rounded-lg text-xs font-mono text-terreta-dark focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none uppercase"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );
};


export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user }) => {
  const [profile, setProfile] = useState<LinkBioProfile>(getInitialProfile(user));
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'stats'>('content');
  const [saving, setSaving] = useState(false);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showInCommunity, setShowInCommunity] = useState(true);
  const [cvUploading, setCvUploading] = useState(false);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  // Autosave state
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileSnapshotRef = useRef<string>('');
  
  // Stats state
  const [viewsStats, setViewsStats] = useState<{
    total_views: number;
    mobile_views: number;
    desktop_views: number;
    tablet_views: number;
    views_today: number;
    views_this_week: number;
    views_this_month: number;
  } | null>(null);
  const [clicksStats, setClicksStats] = useState<{
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
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Mobile preview modal state
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isBlocksExpanded, setIsBlocksExpanded] = useState(true);
  
  // File input ref for avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gradient State Helpers
  const isGradient = profile.theme.bgType === 'gradient';
  // Simple parser to get 2 colors from linear-gradient(to bottom right, #color1, #color2)
  const getGradientColors = (bgString: string) => {
    if (!bgString.includes('gradient')) return ['#ffffff', '#000000'];
    const matches = bgString.match(/#[0-9a-fA-F]{6}/g);
    return matches && matches.length >= 2 ? matches.slice(0, 2) : ['#ffffff', '#000000'];
  };
  const [gradientStart, setGradientStart] = useState(isGradient ? getGradientColors(profile.theme.bgColor)[0] : '#ffffff');
  const [gradientEnd, setGradientEnd] = useState(isGradient ? getGradientColors(profile.theme.bgColor)[1] : '#000000');

  // Cargar perfil desde Supabase solo al montar (una sola vez)
  useEffect(() => {
    console.log('[ProfileEditor] useEffect triggered', { 
      hasLoaded: hasLoadedRef.current, 
      isLoading: isLoadingRef.current,
      userId: user.id 
    });
    
    // Solo cargar si no se ha cargado antes y no está cargando
    if (hasLoadedRef.current || isLoadingRef.current) {
      console.log('[ProfileEditor] Already loaded or loading, skipping', { 
        hasLoaded: hasLoadedRef.current, 
        isLoading: isLoadingRef.current 
      });
      return;
    }
    
    // Verificar si hay un backup en localStorage
    try {
      const backupKey = `profile_backup_${user.id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        const backup = JSON.parse(backupData);
        const backupDate = new Date(backup.timestamp);
        const hoursSinceBackup = (Date.now() - backupDate.getTime()) / (1000 * 60 * 60);
        
        // Si el backup es reciente (menos de 24 horas), preguntar al usuario
        if (hoursSinceBackup < 24) {
          const restore = confirm(
            `Se encontró un backup de tus cambios del ${backupDate.toLocaleString()}.\n\n` +
            '¿Deseas restaurarlo? (Si no, se cargará desde el servidor)'
          );
          
          if (restore) {
            console.log('[ProfileEditor] Restoring from backup');
            setProfile(backup.profile);
            profileSnapshotRef.current = JSON.stringify(backup.profile);
            setHasUnsavedChanges(true);
            // No eliminar el backup todavía, por si acaso
          } else {
            // Eliminar backup si el usuario no quiere restaurarlo
            localStorage.removeItem(backupKey);
          }
        } else {
          // Eliminar backups antiguos
          localStorage.removeItem(backupKey);
        }
      }
    } catch (backupError) {
      console.error('[ProfileEditor] Error checking backup:', backupError);
    }
    
    hasLoadedRef.current = true;
    isLoadingRef.current = true;

    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const loadProfile = async () => {
      // Timeout de seguridad (15 segundos)
      timeoutId = setTimeout(() => {
        if (isMounted && isLoadingRef.current) {
          console.error('[ProfileEditor] Timeout: Loading took more than 15 seconds');
          console.error('[ProfileEditor] This suggests a network or Supabase connection issue');
          if (isMounted) {
            setLoading(false);
            alert('La consulta está tardando demasiado. Por favor, recarga la página.');
          }
        }
      }, 15000);

      try {
        console.log('[ProfileEditor] Setting loading to true');
        if (isMounted) setLoading(true);
        
        console.log('[ProfileEditor] Querying Supabase', { 
          userId: user.id, 
          username: user.username,
          timestamp: new Date().toISOString()
        });
        
        // Query DIRECTA sin Promise.race
        const queryStartTime = Date.now();
        const { data: existingProfile, error } = await supabase
          .from('link_bio_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('username', user.username)
          .maybeSingle();
        
        const queryDuration = Date.now() - queryStartTime;
        console.log('[ProfileEditor] Query completed', {
          duration: `${queryDuration}ms`,
          hasData: !!existingProfile,
          hasError: !!error,
          errorCode: error?.code,
          errorMessage: error?.message,
          timestamp: new Date().toISOString()
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!isMounted) return;

        console.log('[ProfileEditor] Supabase response', { 
          hasData: !!existingProfile, 
          error: error,
          errorCode: error?.code 
        });

        if (error) {
          // PGRST116 es "no rows returned", que es esperado si no existe
          if (error.code !== 'PGRST116') {
            console.error('[ProfileEditor] Error al cargar perfil:', error);
            if (isMounted) {
              setLoading(false);
              alert('Error al cargar el perfil: ' + (error.message || 'Error desconocido'));
            }
            return;
          }
          // Si es PGRST116, continuar normalmente (perfil no existe)
        }

        if (existingProfile) {
          console.log('[ProfileEditor] Profile found', { 
            displayName: existingProfile.display_name,
            isPublished: existingProfile.is_published,
            customSlug: existingProfile.custom_slug
          });
          
          // Convertir el perfil de la base de datos al formato esperado
          const loadedProfile: LinkBioProfile = {
            username: existingProfile.username,
            displayName: existingProfile.display_name,
            bio: existingProfile.bio || '',
            avatar: existingProfile.avatar || user.avatar,
            socials: (existingProfile.socials as any) || {},
            blocks: (existingProfile.blocks as any) || [],
            theme: (existingProfile.theme as any) || getInitialProfile(user).theme
          };
          setProfile(loadedProfile);
          setIsPublished(existingProfile.is_published || false);
          setCustomSlug(existingProfile.custom_slug || null);
          
          // Si el perfil tiene un avatar, actualizarlo también en la tabla profiles
          if (existingProfile.avatar) {
            await supabase
              .from('profiles')
              .update({ avatar: existingProfile.avatar })
              .eq('id', user.id);
          }
          
          // Cargar show_in_community y cv_url desde profiles
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('show_in_community, cv_url')
            .eq('id', user.id)
            .single();
          
          if (userProfile) {
            setShowInCommunity(userProfile.show_in_community !== false); // default true
            if (userProfile.cv_url) {
              setProfile(prev => {
                // Not automatically adding CV block anymore.
                // The user can add it manually if they want.
                return { ...prev, cvUrl: userProfile.cv_url };
              });
            }
          }
          
          console.log('[ProfileEditor] Profile loaded successfully');
          // Guardar snapshot inicial para autosave
          profileSnapshotRef.current = JSON.stringify(loadedProfile);
          setHasUnsavedChanges(false);
        } else {
          console.log('[ProfileEditor] No profile found, using initial profile');
          // Si no existe, usar el perfil inicial
          const initialProfile = getInitialProfile(user);
          setProfile(initialProfile);
          profileSnapshotRef.current = JSON.stringify(initialProfile);
          setHasUnsavedChanges(false);
          setIsPublished(false);
          setCustomSlug(null);
          
          // Cargar show_in_community y cv_url desde profiles
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('show_in_community, cv_url')
            .eq('id', user.id)
            .single();
          
          if (userProfile) {
            setShowInCommunity(userProfile.show_in_community !== false); // default true
            if (userProfile.cv_url) {
              setProfile(prev => {
                // Not automatically adding CV block anymore.
                // The user can add it manually if they want.
                return { ...prev, cvUrl: userProfile.cv_url };
              });
            }
          }
        }
      } catch (err) {
        console.error('[ProfileEditor] Exception caught:', err);
      } finally {
        if (isMounted) {
          console.log('[ProfileEditor] Finally block - setting loading to false');
          setLoading(false);
        }
        isLoadingRef.current = false;
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    loadProfile();

    // Cleanup
    return () => {
      console.log('[ProfileEditor] Cleanup: unmounting');
      isMounted = false;
      isLoadingRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Cargar estadísticas cuando se abre la pestaña de stats
  useEffect(() => {
    const loadStats = async () => {
      if (activeTab !== 'stats' || !user.id || loading) {
        return;
      }

      setLoadingStats(true);
      try {
        const [viewsData, clicksData] = await Promise.all([
          getProfileViewsStats(user.id, 30),
          getLinkClicksStats(user.id, 30)
        ]);

        if (viewsData) {
          setViewsStats(viewsData);
        }
        if (clicksData) {
          setClicksStats(clicksData);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [activeTab, user.id, loading]);

  // Autosave effect - guarda automáticamente después de 3 segundos de inactividad
  useEffect(() => {
    // No autosave si está cargando, guardando manualmente, o no hay cambios
    if (loading || saving || !hasLoadedRef.current) {
      return;
    }

    const currentSnapshot = JSON.stringify(profile);
    
    // Si no hay cambios desde el último snapshot, no hacer nada
    if (currentSnapshot === profileSnapshotRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    // Marcar que hay cambios sin guardar
    setHasUnsavedChanges(true);

    // Limpiar timeout anterior
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Crear nuevo timeout para autosave (3 segundos de inactividad)
    autosaveTimeoutRef.current = setTimeout(async () => {
      await performAutoSave();
    }, 3000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [profile, loading, saving]);

  // Función de autosave (sin mostrar toast)
  const performAutoSave = async (): Promise<boolean> => {
    if (loading || saving || autoSaving) {
      return false;
    }

    try {
      setAutoSaving(true);
      console.log('[ProfileEditor] Auto-saving profile...');

      // Verificar sesión antes de guardar
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[ProfileEditor] No session found, skipping autosave');
        setAutoSaving(false);
        return false;
      }

      // Verificar si existe un perfil
      const { data: existing, error: checkError } = await supabase
        .from('link_bio_profiles')
        .select('id, is_published, custom_slug')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[ProfileEditor] Error checking profile for autosave:', checkError);
        setAutoSaving(false);
        return false;
      }

      const profileData: any = {
        user_id: user.id,
        username: profile.username,
        display_name: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        socials: profile.socials,
        blocks: profile.blocks,
        theme: profile.theme,
        is_published: existing && existing.is_published ? existing.is_published : isPublished,
        custom_slug: existing && existing.custom_slug ? existing.custom_slug : customSlug
      };

      let saveError = null;
      
      if (existing) {
        const { error } = await supabase
          .from('link_bio_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('link_bio_profiles')
          .insert(profileData);
        saveError = error;
      }

      if (saveError) {
        console.error('[ProfileEditor] Autosave error:', saveError);
        setAutoSaving(false);
        return false;
      }

      // Actualizar snapshot y estado
      profileSnapshotRef.current = JSON.stringify(profile);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      console.log('[ProfileEditor] Autosave successful');
      return true;
    } catch (error: any) {
      console.error('[ProfileEditor] Autosave exception:', error);
      return false;
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSave = async () => {
    console.log('[ProfileEditor] handleSave started');
    setSaving(true);
    try {
      // Primero verificar si existe un perfil para preservar is_published y custom_slug
      console.log('[ProfileEditor] Checking for existing profile', { userId: user.id });
      const { data: existing, error: checkError } = await supabase
        .from('link_bio_profiles')
        .select('id, is_published, custom_slug')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[ProfileEditor] Check response', { 
        hasExisting: !!existing, 
        error: checkError,
        errorCode: checkError?.code 
      });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[ProfileEditor] Error al verificar perfil:', checkError);
        alert('Error al verificar el perfil: ' + (checkError.message || 'Error desconocido'));
        setSaving(false);
        return;
      }

      // Preparar los datos para Supabase
      // Si existe un perfil publicado, preservar is_published y custom_slug
      const profileData: any = {
        user_id: user.id,
        username: profile.username,
        display_name: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        socials: profile.socials,
        blocks: profile.blocks,
        theme: profile.theme,
        is_published: existing && existing.is_published ? existing.is_published : isPublished,
        custom_slug: existing && existing.custom_slug ? existing.custom_slug : customSlug
      };

      console.log('[ProfileEditor] Guardando perfil:', { 
        hasBlocks: profileData.blocks?.length || 0,
        hasTheme: !!profileData.theme,
        isPublished: profileData.is_published,
        customSlug: profileData.custom_slug
      });

      if (existing) {
        // Existe, actualizar
        console.log('[ProfileEditor] Actualizando perfil existente', { profileId: existing.id });
        
        // Verificar sesión antes de guardar
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
          setSaving(false);
          return;
        }
        
        let data;
        let updateError;
        let retries = 0;
        const MAX_RETRIES = 2;
        
        // Intentar guardar con retries
        while (retries <= MAX_RETRIES) {
          const result = await supabase
            .from('link_bio_profiles')
            .update(profileData)
            .eq('user_id', user.id)
            .select()
            .single();
          
          data = result.data;
          updateError = result.error;
          
          if (!updateError) {
            break; // Éxito
          }
          
          // Si es un error de sesión, no reintentar
          if (updateError.code === 'PGRST301' || updateError.message?.includes('session') || updateError.message?.includes('auth')) {
            alert('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
            setSaving(false);
            return;
          }
          
          retries++;
          if (retries <= MAX_RETRIES) {
            console.log(`[ProfileEditor] Reintentando actualización... (intento ${retries + 1}/${MAX_RETRIES + 1})`);
            // Esperar antes de reintentar (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
        
        if (updateError) {
          console.error('[ProfileEditor] Error al actualizar después de todos los reintentos:', updateError);
          throw updateError;
        }
        
        console.log('[ProfileEditor] Perfil actualizado exitosamente', { 
          hasData: !!data,
          isPublished: data?.is_published,
          customSlug: data?.custom_slug
        });
        
        // Actualizar el estado local con los datos guardados directamente
        // No necesitamos recargar porque ya tenemos los datos frescos en 'data'
        if (data) {
          setIsPublished(data.is_published || false);
          setCustomSlug(data.custom_slug || null);
          
          // Actualizar el perfil con los datos que acabamos de guardar
          const updatedProfile: LinkBioProfile = {
            username: data.username,
            displayName: data.display_name,
            bio: data.bio || '',
            avatar: data.avatar || user.avatar,
            socials: (data.socials as any) || {},
            blocks: (data.blocks as any) || [],
            theme: (data.theme as any) || getInitialProfile(user).theme,
            cvUrl: profile.cvUrl // Maintain CV URL from state
          };
          setProfile(updatedProfile);

          // También actualizar el avatar y show_in_community en la tabla profiles
          const profileUpdate: any = {};
          if (data.avatar) {
            profileUpdate.avatar = data.avatar;
          }
          profileUpdate.show_in_community = showInCommunity;
          
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id);
          
          if (data.avatar) {
            // Disparar evento para actualizar el usuario en Dashboard
            window.dispatchEvent(new CustomEvent('profileAvatarUpdated', { detail: { avatar: data.avatar } }));
          }
        }
      } else {
        // No existe, crear nuevo
        console.log('[ProfileEditor] Creando nuevo perfil');
        
        // Verificar sesión antes de guardar
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
          setSaving(false);
          return;
        }
        
        let data;
        let insertError;
        let retries = 0;
        const MAX_RETRIES = 2;
        
        // Intentar guardar con retries
        while (retries <= MAX_RETRIES) {
          const result = await supabase
            .from('link_bio_profiles')
            .insert(profileData)
            .select()
            .single();
          
          data = result.data;
          insertError = result.error;
          
          if (!insertError) {
            break; // Éxito
          }
          
          // Si es un error de sesión, no reintentar
          if (insertError.code === 'PGRST301' || insertError.message?.includes('session') || insertError.message?.includes('auth')) {
            alert('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
            setSaving(false);
            return;
          }
          
          retries++;
          if (retries <= MAX_RETRIES) {
            console.log(`[ProfileEditor] Reintentando inserción... (intento ${retries + 1}/${MAX_RETRIES + 1})`);
            // Esperar antes de reintentar (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
        
        if (insertError) {
          console.error('[ProfileEditor] Error al insertar después de todos los reintentos:', insertError);
          throw insertError;
        }
        
        console.log('[ProfileEditor] Perfil creado exitosamente', { 
          hasData: !!data,
          isPublished: data?.is_published,
          customSlug: data?.custom_slug
        });
        
        // Actualizar el estado local con los datos guardados
        if (data) {
          setIsPublished(data.is_published || false);
          setCustomSlug(data.custom_slug || null);

          // También actualizar el avatar y show_in_community en la tabla profiles
          const profileUpdate: any = {};
          if (data.avatar) {
            profileUpdate.avatar = data.avatar;
          }
          profileUpdate.show_in_community = showInCommunity;
          
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id);
          
          if (data.avatar) {
            // Disparar evento para actualizar el usuario en Dashboard
            window.dispatchEvent(new CustomEvent('profileAvatarUpdated', { detail: { avatar: data.avatar } }));
          }
        }
      }
      
      // Actualizar snapshot después de guardar exitosamente
      profileSnapshotRef.current = JSON.stringify(profile);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
      // Eliminar backup si existe (ya se guardó exitosamente)
      try {
        const backupKey = `profile_backup_${user.id}`;
        localStorage.removeItem(backupKey);
        console.log('[ProfileEditor] Backup eliminado después de guardar exitosamente');
      } catch (backupError) {
        console.error('[ProfileEditor] Error eliminando backup:', backupError);
      }
      
      // Mostrar toast de éxito
      console.log('[ProfileEditor] Mostrando toast de éxito');
      setShowToast(true);
    } catch (error: any) {
      console.error('[ProfileEditor] Error completo al guardar:', error);
      
      // Verificar si es un error de sesión
      if (error.message?.includes('session') || error.message?.includes('auth') || error.code === 'PGRST301') {
        alert('Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.');
        // No hacer nada más, dejar que el usuario recargue
        return;
      }
      
      // Para otros errores, intentar guardar en localStorage como backup
      try {
        const backupKey = `profile_backup_${user.id}`;
        localStorage.setItem(backupKey, JSON.stringify({
          profile,
          timestamp: new Date().toISOString()
        }));
        console.log('[ProfileEditor] Guardado backup en localStorage');
      } catch (backupError) {
        console.error('[ProfileEditor] Error guardando backup:', backupError);
      }
      
      alert('Error al guardar el perfil: ' + (error.message || 'Error desconocido') + '\n\nSe ha guardado un backup local. Intenta guardar nuevamente.');
    } finally {
      console.log('[ProfileEditor] handleSave finally - setting saving to false');
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }
    
    // Validar tamaño (máximo 5MB antes de optimizar)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB');
      return;
    }
    
    try {
      // Subir a Storage y obtener URL
      const avatarUrl = await uploadAvatarToStorage(user.id, file);
      
      // Actualizar perfil con la URL de Storage
      setProfile(prev => ({ ...prev, avatar: avatarUrl }));
      
      console.log('[ProfileEditor] Avatar subido a Storage:', avatarUrl);
    } catch (error: any) {
      console.error('[ProfileEditor] Error al subir avatar:', error);
      alert('Error al subir el avatar: ' + (error.message || 'Error desconocido'));
    } finally {
      // Limpiar input para permitir subir el mismo archivo de nuevo
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleBlockCVUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('El archivo no debe superar los 5MB');
      return;
    }

    setCvUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      // Generate a clean filename with timestamp to avoid caching issues
      const fileName = `${user.id}/cv_${blockId}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('cv_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cv_files')
        .getPublicUrl(fileName);

      updateBlock(blockId, { url: publicUrl });
      alert('CV subido correctamente');
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      alert('Error al subir el CV: ' + error.message);
    } finally {
      setCvUploading(false);
      // Clear the input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const updateGradient = (start: string, end: string) => {
    setGradientStart(start);
    setGradientEnd(end);
    setProfile(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        id: 'custom',
        bgType: 'gradient',
        bgColor: `linear-gradient(135deg, ${start}, ${end})`
      }
    }));
  };

  // --- ACTIONS ---

  const addBlock = (type: BioBlock['type']) => {
    const newBlock: BioBlock = {
      id: Date.now().toString(),
      type,
      isVisible: true,
      title: type === 'link' ? 'Nuevo Enlace' : type === 'header' ? 'Nueva Sección' : type === 'video' ? 'Video Destacado' : type === 'music' ? 'Canción' : type === 'gallery' ? 'Galería' : type === 'cv' ? 'Mi Currículum' : '',
      url: '',
      content: type === 'text' ? 'Escribe algo aquí...' : '',
      icon: type === 'cv' ? 'none' : 'none', // Default icon for CV could be none or maybe we force one in render
      images: type === 'gallery' ? [] : undefined
    };
    setProfile(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const removeBlock = (id: string) => {
    setProfile(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
  };

  const updateBlock = (id: string, updates: Partial<BioBlock>) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentBlock = profile.blocks.find(b => b.id === blockId);
      const currentImageCount = currentBlock?.images?.length || 0;
      const maxImages = 7;
      const remainingSlots = maxImages - currentImageCount;
      
      if (remainingSlots <= 0) {
        alert(`Máximo ${maxImages} imágenes permitidas por galería`);
        return;
      }
      
      const filesToProcess = files.slice(0, remainingSlots);
      
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfile(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
              if (b.id === blockId) {
                const currentImages = b.images || [];
                if (currentImages.length < maxImages) {
                  return { ...b, images: [...currentImages, reader.result as string] };
                }
                return b;
              }
              return b;
            })
          }));
        };
        reader.readAsDataURL(file as Blob);
      });
      
      if (files.length > remainingSlots) {
        alert(`Solo se agregaron ${remainingSlots} imagen(es). Máximo ${maxImages} imágenes permitidas.`);
      }
    }
  };

  const removeGalleryImage = (blockId: string, imageIndex: number) => {
    setProfile(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id === blockId) {
          const newImages = [...(b.images || [])];
          newImages.splice(imageIndex, 1);
          return { ...b, images: newImages };
        }
        return b;
      })
    }));
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (index: number) => {
    setDraggedBlockIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === index) return;
    
    const newBlocks = [...profile.blocks];
    const draggedItem = newBlocks[draggedBlockIndex];
    newBlocks.splice(draggedBlockIndex, 1);
    newBlocks.splice(index, 0, draggedItem);
    
    setDraggedBlockIndex(index);
    setProfile(prev => ({ ...prev, blocks: newBlocks }));
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-terreta-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
          <p className="text-terreta-secondary">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-terreta-bg overflow-hidden relative">
      
      {/* Mobile Preview Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobilePreviewOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-terreta-accent text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-bold text-sm"
      >
        <Smartphone size={20} />
        <span>Preview</span>
      </button>
      
      {/* --- LEFT COLUMN: EDITOR --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-terreta-card border-r border-terreta-border overflow-hidden">
        
        {/* Editor Tabs */}
        <div className="flex border-b border-terreta-border shrink-0">
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'content' ? 'text-terreta-accent border-b-2 border-terreta-accent' : 'text-terreta-secondary hover:text-terreta-dark'}`}
          >
            <Layout size={18} /> <span className="hidden sm:inline">Contenido</span>
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'appearance' ? 'text-terreta-accent border-b-2 border-terreta-accent' : 'text-terreta-secondary hover:text-terreta-dark'}`}
          >
            <Palette size={18} /> <span className="hidden sm:inline">Apariencia</span>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'stats' ? 'text-terreta-accent border-b-2 border-terreta-accent' : 'text-terreta-secondary hover:text-terreta-dark'}`}
          >
            <BarChart3 size={18} /> <span className="hidden sm:inline">Estadísticas</span>
          </button>
        </div>

        {/* Scrollable Form Area - Improved mobile scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 md:space-y-8" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {activeTab === 'content' ? (
            <>
              {/* Identity Section */}
              <section className="space-y-4">
                <h3 className="font-serif text-xl text-terreta-dark">Identidad</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start bg-terreta-bg p-6 rounded-xl border border-terreta-border">
                  
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-full bg-terreta-sidebar overflow-hidden cursor-pointer group border-2 border-terreta-card shadow-sm hover:border-terreta-accent transition-colors"
                    >
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="text-white" size={24} />
                      </div>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-terreta-accent hover:underline flex items-center gap-1"
                    >
                      <Upload size={12} /> Cambiar foto
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <label className="block text-xs font-bold text-terreta-secondary mb-1 uppercase">Nombre Visible</label>
                      <input 
                        type="text" 
                        value={profile.displayName}
                        onChange={e => setProfile({...profile, displayName: e.target.value})}
                        className="w-full bg-terreta-card border border-terreta-border rounded-lg px-3 py-2 text-sm font-serif text-terreta-dark placeholder-terreta-secondary focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                        placeholder="Tu Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-terreta-secondary mb-1 uppercase">Biografía</label>
                      <textarea 
                        value={profile.bio}
                        onChange={e => setProfile({...profile, bio: e.target.value})}
                        className="w-full bg-terreta-card border border-terreta-border rounded-lg px-3 py-2 text-sm resize-none text-terreta-dark placeholder-terreta-secondary focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                        rows={2}
                        placeholder="Cuéntale al mundo quién eres..."
                      />
                    </div>
                  </div>
                </div>
              </section>


              {/* Socials Section */}
              <section className="space-y-4">
                <h3 className="font-serif text-xl text-terreta-dark">Redes Sociales</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="relative">
                      <Instagram size={16} className="absolute left-3 top-3 text-gray-400"/>
                      <input 
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#D97706] outline-none"
                        placeholder="@instagram"
                        value={profile.socials.instagram || ''}
                        onChange={e => setProfile({...profile, socials: {...profile.socials, instagram: e.target.value}})}
                      />
                   </div>
                   <div className="relative">
                      <Twitter size={16} className="absolute left-3 top-3 text-gray-400"/>
                      <input 
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#D97706] outline-none"
                        placeholder="@twitter"
                        value={profile.socials.twitter || ''}
                        onChange={e => setProfile({...profile, socials: {...profile.socials, twitter: e.target.value}})}
                      />
                   </div>
                   <div className="relative">
                      <Linkedin size={16} className="absolute left-3 top-3 text-gray-400"/>
                      <input 
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#D97706] outline-none"
                        placeholder="LinkedIn URL"
                        value={profile.socials.linkedin || ''}
                        onChange={e => setProfile({...profile, socials: {...profile.socials, linkedin: e.target.value}})}
                      />
                   </div>
                   <div className="relative">
                      <Globe size={16} className="absolute left-3 top-3 text-gray-400"/>
                      <input 
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#D97706] outline-none"
                        placeholder="Website URL"
                        value={profile.socials.website || ''}
                        onChange={e => setProfile({...profile, socials: {...profile.socials, website: e.target.value}})}
                      />
                   </div>
                </div>
              </section>

              {/* Community Visibility Section */}
              <section className="space-y-4">
                <h3 className="font-serif text-xl text-terreta-dark">Visibilidad</h3>
                <div className="bg-terreta-bg p-6 rounded-xl border border-terreta-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-terreta-dark mb-1">Aparecer en Comunidad</p>
                      <p className="text-xs text-terreta-secondary">Permite que otros usuarios te encuentren en la sección de Comunidad</p>
                    </div>
                    <button
                      onClick={() => setShowInCommunity(!showInCommunity)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent focus:ring-offset-2 ${
                        showInCommunity ? 'bg-terreta-accent' : 'bg-terreta-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-terreta-card transition-transform ${
                          showInCommunity ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Blocks Section */}
              <section className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                   <div className="flex items-center gap-2">
                     <h3 className="font-serif text-xl text-terreta-dark">Bloques</h3>
                     {/* Mobile Toggle Button - Only visible on mobile */}
                     <button
                       onClick={() => setIsBlocksExpanded(!isBlocksExpanded)}
                       className="lg:hidden p-2 text-terreta-secondary hover:text-terreta-dark transition-colors"
                       aria-label={isBlocksExpanded ? 'Colapsar bloques' : 'Expandir bloques'}
                     >
                       {isBlocksExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                     </button>
                   </div>
                   <div className="flex gap-2 bg-terreta-bg p-1 rounded-lg flex-wrap">
                      <button onClick={() => addBlock('link')} className="p-2 bg-terreta-card text-terreta-dark rounded shadow-sm hover:shadow text-xs flex items-center gap-1 font-bold border border-terreta-border"><Plus size={14}/> Link</button>
                      <button onClick={() => addBlock('header')} className="p-2 bg-transparent text-terreta-secondary rounded hover:bg-terreta-bg text-xs flex items-center gap-1"><Type size={14}/> Título</button>
                      <button onClick={() => addBlock('text')} className="p-2 bg-transparent text-terreta-secondary rounded hover:bg-terreta-bg text-xs flex items-center gap-1"><Layout size={14}/> Texto</button>
                      <button onClick={() => addBlock('video')} className="p-2 bg-transparent text-terreta-secondary rounded hover:bg-terreta-bg text-xs flex items-center gap-1"><Video size={14}/> Video</button>
                      <button onClick={() => addBlock('music')} className="p-2 bg-transparent text-terreta-secondary rounded hover:bg-terreta-bg text-xs flex items-center gap-1"><Music size={14}/> Música</button>
                      <button onClick={() => addBlock('gallery')} className="p-2 bg-transparent text-terreta-secondary rounded hover:bg-terreta-bg text-xs flex items-center gap-1"><Images size={14}/> Galería</button>
                      <button onClick={() => addBlock('cv')} className="p-2 bg-transparent text-terreta-secondary rounded hover:bg-terreta-bg text-xs flex items-center gap-1"><FileText size={14}/> Currículum</button>
                   </div>
                </div>

                {/* Collapsible Blocks Container - Mobile only */}
                <div className={`space-y-3 lg:block ${isBlocksExpanded ? 'block' : 'hidden'}`}>
                   {profile.blocks.length === 0 && (
                     <div className="text-center py-10 text-terreta-secondary border-2 border-dashed border-terreta-border rounded-xl bg-terreta-bg/50">
                        <p className="mb-2">Aún no has añadido contenido.</p>
                        <p className="text-xs">Usa los botones de arriba para agregar bloques.</p>
                     </div>
                   )}
                   {profile.blocks.map((block, index) => (
                      <div 
                        key={block.id} 
                        className={`bg-terreta-card border border-terreta-border rounded-lg p-4 shadow-sm group transition-all duration-200 ${draggedBlockIndex === index ? 'opacity-50 ring-2 ring-terreta-accent border-terreta-accent' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                         <div className="flex justify-between items-start mb-3 cursor-move">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-terreta-secondary select-none">
                               <GripVertical size={16} className="text-terreta-border group-hover:text-terreta-dark" />
                               {block.type === 'header' ? 'Sección' : block.type === 'gallery' ? 'Galería' : block.type}
                            </div>
                            <button onClick={() => removeBlock(block.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={16}/></button>
                         </div>
                         
                         <div className="space-y-3 pl-6">
                            {(block.type === 'link' || block.type === 'header' || block.type === 'video' || block.type === 'music' || block.type === 'cv') && (
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  className="flex-1 border-b border-terreta-border focus:border-terreta-accent outline-none py-1 font-medium bg-transparent text-terreta-dark placeholder-terreta-secondary"
                                  placeholder={block.type === 'header' ? 'Nombre de la sección' : 'Título del bloque'}
                                  value={block.title || ''}
                                  onChange={e => updateBlock(block.id, { title: e.target.value })}
                                />
                                {block.type === 'link' && (
                                  <select 
                                    className="text-sm border-b border-terreta-border bg-transparent text-terreta-secondary outline-none"
                                    value={block.icon || 'none'}
                                    onChange={(e) => updateBlock(block.id, { icon: e.target.value })}
                                  >
                                    <option value="none">Sin Icono</option>
                                    <option value="star">★ Estrella</option>
                                    <option value="heart">♥ Corazón</option>
                                    <option value="zap">⚡ Rayo</option>
                                    <option value="check">✓ Check</option>
                                    <option value="globe">🌐 Web</option>
                                  </select>
                                )}
                              </div>
                            )}
                            
                            {(block.type === 'link' || block.type === 'video' || block.type === 'music') && (
                              <input 
                                type="url"
                                className="w-full bg-terreta-bg border border-terreta-border rounded px-2 py-2 text-sm text-terreta-dark placeholder-terreta-secondary focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                                placeholder={block.type === 'video' ? 'https://youtube.com/... o https://vimeo.com/...' : 'https://...'}
                                value={block.url || ''}
                                onChange={e => updateBlock(block.id, { url: e.target.value })}
                              />
                            )}
                             {block.type === 'text' && (
                              <textarea 
                                className="w-full bg-terreta-bg border border-terreta-border rounded px-2 py-2 text-sm text-terreta-dark placeholder-terreta-secondary resize-none focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none"
                                rows={3}
                                placeholder="Escribe tu contenido aquí..."
                                value={block.content || ''}
                                onChange={e => updateBlock(block.id, { content: e.target.value })}
                              />
                            )}
                            {block.type === 'gallery' && (
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                   {block.images?.map((img, idx) => (
                                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group shadow-sm bg-terreta-bg">
                                         <img src={img} className="w-full h-full object-cover" alt="Gallery thumbnail" />
                                         <button 
                                            onClick={() => removeGalleryImage(block.id, idx)}
                                            className="absolute top-0 right-0 bg-black/60 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                            <Trash2 size={12} />
                                         </button>
                                      </div>
                                   ))}
                                   <label className="w-16 h-16 rounded-lg border-2 border-dashed border-terreta-border flex flex-col items-center justify-center cursor-pointer hover:border-terreta-accent hover:text-terreta-accent transition-colors bg-terreta-bg">
                                      <Plus size={16} />
                                      <span className="text-[9px] uppercase font-bold mt-1">Add</span>
                                      <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleGalleryUpload(e, block.id)}
                                      />
                                   </label>
                                </div>
                              </div>
                            )}
                             {block.type === 'cv' && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-terreta-bg p-3 rounded-lg border border-terreta-border">
                                   <div className="h-10 w-10 rounded-lg bg-terreta-accent/10 flex items-center justify-center text-terreta-accent">
                                      <FileText size={20} />
                                   </div>
                                   <div className="flex-1 overflow-hidden">
                                      {block.url ? (
                                        <div className="flex flex-col">
                                          <span className="text-xs font-bold text-terreta-dark truncate">CV Cargado</span>
                                          <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-terreta-accent hover:underline truncate">
                                            Ver archivo
                                          </a>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-terreta-secondary">No hay archivo seleccionado</span>
                                      )}
                                   </div>
                                   <label className="cursor-pointer bg-terreta-card border border-terreta-border hover:border-terreta-accent text-terreta-dark px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1">
                                      <Upload size={12} />
                                      <span>{block.url ? 'Cambiar' : 'Subir'}</span>
                                      <input 
                                        type="file" 
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={(e) => handleBlockCVUpload(e, block.id)}
                                      />
                                   </label>
                                </div>
                              </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
              </section>
            </>
          ) : activeTab === 'appearance' ? (
            /* APPEARANCE TAB */
            <div className="space-y-8">
              <section>
                <h3 className="font-serif text-xl text-terreta-dark mb-4">Temas Rápidos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setProfile({...profile, theme: { ...theme, backgroundImage: '' }})} // Reset custom bg on theme switch
                      className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${profile.theme.id === theme.id ? 'border-[#D97706] ring-1 ring-[#D97706]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="w-full h-12 rounded mb-2 border border-gray-100 shadow-sm" style={{ backgroundColor: theme.bgColor }}></div>
                      <span className="font-bold text-sm text-terreta-dark">{theme.name}</span>
                      {profile.theme.id === theme.id && <div className="absolute top-2 right-2 text-[#D97706]"><CheckCircle size={16}/></div>}
                    </button>
                  ))}
                </div>
              </section>

              <hr className="border-gray-100" />

              <section>
                 <h3 className="font-serif text-xl text-terreta-dark mb-4">Personalización Avanzada</h3>
                 
                 {/* Background Controls */}
                 <div className="space-y-4 mb-8">
                    <label className="text-xs font-bold text-terreta-secondary uppercase tracking-wide block">Fondo del Perfil</label>
                    
                    {/* Background Type Toggle */}
                    <div className="flex bg-terreta-bg p-1 rounded-lg w-fit mb-4">
                      <button 
                        onClick={() => {
                          setProfile(p => ({...p, theme: {...p.theme, bgType: 'color', bgColor: gradientStart, id: 'custom'}}));
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${profile.theme.bgType === 'color' ? 'bg-terreta-card shadow text-terreta-accent' : 'text-terreta-secondary hover:text-terreta-dark'}`}
                      >
                        Sólido
                      </button>
                      <button 
                         onClick={() => {
                          updateGradient(gradientStart, gradientEnd);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${profile.theme.bgType === 'gradient' ? 'bg-terreta-card shadow text-terreta-accent' : 'text-terreta-secondary hover:text-terreta-dark'}`}
                      >
                        Gradiente
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       {profile.theme.bgType === 'gradient' ? (
                          <>
                             <HexColorPicker 
                                label="Color Inicio" 
                                value={gradientStart} 
                                onChange={(val) => updateGradient(val, gradientEnd)} 
                             />
                             <HexColorPicker 
                                label="Color Fin" 
                                value={gradientEnd} 
                                onChange={(val) => updateGradient(gradientStart, val)} 
                             />
                          </>
                       ) : (
                          <HexColorPicker 
                            label="Color Sólido" 
                            value={profile.theme.bgColor.startsWith('#') ? profile.theme.bgColor : gradientStart} 
                            onChange={(val) => {
                              setGradientStart(val); 
                              setProfile({...profile, theme: {...profile.theme, bgType: 'color', bgColor: val, id: 'custom'}});
                            }} 
                          />
                       )}
                    </div>
                 </div>

                 {/* Button Style Selector (Visual Radio) */}
                 <div className="space-y-4 mb-8">
                    <label className="text-xs font-bold text-terreta-secondary uppercase tracking-wide block">Estilo de Botones</label>
                    <div className="grid grid-cols-3 gap-3">
                       {/* Option: Solid */}
                       <button 
                          onClick={() => setProfile({...profile, theme: {...profile.theme, buttonStyle: 'solid'}})}
                          className={`relative p-3 border rounded-xl flex flex-col items-center gap-3 hover:bg-terreta-bg transition-all ${profile.theme.buttonStyle === 'solid' ? 'border-terreta-accent bg-terreta-accent/10 ring-1 ring-terreta-accent' : 'border-terreta-border'}`}
                       >
                          {/* Radio Indicator */}
                          <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${profile.theme.buttonStyle === 'solid' ? 'border-terreta-accent' : 'border-terreta-border'}`}>
                             {profile.theme.buttonStyle === 'solid' && <div className="w-2 h-2 bg-terreta-accent rounded-full" />}
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-8 bg-gray-800 rounded shadow-sm mt-2"></div>
                          <span className={`text-xs font-bold ${profile.theme.buttonStyle === 'solid' ? 'text-terreta-accent' : 'text-terreta-secondary'}`}>Sólido</span>
                       </button>

                       {/* Option: Rounded (Soft) */}
                       <button 
                          onClick={() => setProfile({...profile, theme: {...profile.theme, buttonStyle: 'soft'}})}
                          className={`relative p-3 border rounded-xl flex flex-col items-center gap-3 hover:bg-terreta-bg transition-all ${profile.theme.buttonStyle === 'soft' ? 'border-terreta-accent bg-terreta-accent/10 ring-1 ring-terreta-accent' : 'border-terreta-border'}`}
                       >
                           {/* Radio Indicator */}
                           <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${profile.theme.buttonStyle === 'soft' ? 'border-terreta-accent' : 'border-terreta-border'}`}>
                             {profile.theme.buttonStyle === 'soft' && <div className="w-2 h-2 bg-terreta-accent rounded-full" />}
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-8 bg-gray-800 rounded-lg shadow-sm mt-2"></div>
                          <span className={`text-xs font-bold ${profile.theme.buttonStyle === 'soft' ? 'text-terreta-accent' : 'text-terreta-secondary'}`}>Redondeado</span>
                       </button>

                       {/* Option: Outline */}
                       <button 
                          onClick={() => setProfile({...profile, theme: {...profile.theme, buttonStyle: 'outline'}})}
                          className={`relative p-3 border rounded-xl flex flex-col items-center gap-3 hover:bg-terreta-bg transition-all ${profile.theme.buttonStyle === 'outline' ? 'border-terreta-accent bg-terreta-accent/10 ring-1 ring-terreta-accent' : 'border-terreta-border'}`}
                       >
                           {/* Radio Indicator */}
                           <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${profile.theme.buttonStyle === 'outline' ? 'border-terreta-accent' : 'border-terreta-border'}`}>
                             {profile.theme.buttonStyle === 'outline' && <div className="w-2 h-2 bg-terreta-accent rounded-full" />}
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-8 border-2 border-gray-800 rounded shadow-sm mt-2 bg-transparent"></div>
                          <span className={`text-xs font-bold ${profile.theme.buttonStyle === 'outline' ? 'text-terreta-accent' : 'text-terreta-secondary'}`}>Outline</span>
                       </button>
                    </div>
                 </div>

                 {/* Button Colors */}
                 <div className="space-y-4">
                    <label className="text-xs font-bold text-terreta-secondary uppercase tracking-wide block">Colores</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                       <HexColorPicker 
                          label="Fondo Botón" 
                          value={profile.theme.buttonColor} 
                          onChange={(val) => setProfile({...profile, theme: {...profile.theme, buttonColor: val, id: 'custom'}})}
                       />
                       <HexColorPicker 
                          label="Texto Botón" 
                          value={profile.theme.buttonTextColor} 
                          onChange={(val) => setProfile({...profile, theme: {...profile.theme, buttonTextColor: val, id: 'custom'}})}
                       />
                       <HexColorPicker 
                          label="Texto Página" 
                          value={profile.theme.textColor} 
                          onChange={(val) => setProfile({...profile, theme: {...profile.theme, textColor: val, id: 'custom'}})}
                       />
                    </div>
                 </div>

              </section>
            </div>
          ) : (
            /* STATS TAB */
            <div className="space-y-6 animate-fade-in">
              <h3 className="font-serif text-xl text-terreta-dark mb-4">Rendimiento (Últimos 30 días)</h3>
              
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terreta-accent"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-terreta-card p-4 rounded-xl border border-terreta-border shadow-sm">
                       <p className="text-xs font-bold text-terreta-secondary uppercase">Vistas Totales</p>
                       <p className="text-3xl font-bold text-terreta-dark mt-1">
                         {viewsStats?.total_views.toLocaleString() || '0'}
                       </p>
                       <p className="text-xs text-terreta-secondary mt-2">
                         {viewsStats?.views_this_month || 0} este mes
                       </p>
                    </div>
                    <div className="bg-terreta-card p-4 rounded-xl border border-terreta-border shadow-sm">
                       <p className="text-xs font-bold text-terreta-secondary uppercase">Clicks en Enlaces</p>
                       <p className="text-3xl font-bold text-terreta-dark mt-1">
                         {clicksStats?.total_clicks.toLocaleString() || '0'}
                       </p>
                       <p className="text-xs text-terreta-secondary mt-2">
                         {clicksStats?.clicks_this_month || 0} este mes
                       </p>
                    </div>
                  </div>

                  {/* Devices Card */}
                  {viewsStats && (viewsStats.mobile_views > 0 || viewsStats.desktop_views > 0 || viewsStats.tablet_views > 0) && (
                    <div className="bg-terreta-card p-5 rounded-xl border border-terreta-border shadow-sm">
                       <h4 className="font-bold text-terreta-secondary text-xs uppercase mb-4 flex items-center gap-2">
                          <Smartphone size={14} /> Dispositivos
                       </h4>
                       <div className="space-y-4">
                          {viewsStats.mobile_views > 0 && (() => {
                            const total = viewsStats.mobile_views + viewsStats.desktop_views + viewsStats.tablet_views;
                            const percentage = Math.round((viewsStats.mobile_views / total) * 100);
                            return (
                              <div>
                                 <div className="flex justify-between text-xs mb-2 text-terreta-dark font-medium">
                                    <span className="flex items-center gap-1"><Smartphone size={12}/> Móvil</span>
                                    <span className="font-bold">{percentage}%</span>
                                 </div>
                                 <div className="w-full bg-terreta-bg rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-terreta-accent h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                 </div>
                              </div>
                            );
                          })()}
                          {viewsStats.desktop_views > 0 && (() => {
                            const total = viewsStats.mobile_views + viewsStats.desktop_views + viewsStats.tablet_views;
                            const percentage = Math.round((viewsStats.desktop_views / total) * 100);
                            return (
                              <div>
                                 <div className="flex justify-between text-xs mb-2 text-terreta-dark font-medium">
                                    <span className="flex items-center gap-1"><Monitor size={12}/> Escritorio</span>
                                    <span className="font-bold">{percentage}%</span>
                                 </div>
                                 <div className="w-full bg-terreta-bg rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-terreta-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                 </div>
                              </div>
                            );
                          })()}
                          {viewsStats.tablet_views > 0 && (() => {
                            const total = viewsStats.mobile_views + viewsStats.desktop_views + viewsStats.tablet_views;
                            const percentage = Math.round((viewsStats.tablet_views / total) * 100);
                            return (
                              <div>
                                 <div className="flex justify-between text-xs mb-2 text-terreta-dark font-medium">
                                    <span className="flex items-center gap-1"><Smartphone size={12}/> Tablet</span>
                                    <span className="font-bold">{percentage}%</span>
                                 </div>
                                 <div className="w-full bg-terreta-bg rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-terreta-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                 </div>
                              </div>
                            );
                          })()}
                       </div>
                    </div>
                  )}

                  {clicksStats && clicksStats.top_link_clicks > 0 && (
                    <div className="bg-terreta-accent/10 p-4 rounded-xl border border-terreta-accent/20">
                      <h4 className="font-bold text-terreta-accent mb-2 text-sm uppercase">Enlace más popular</h4>
                      <p className="font-serif text-lg text-terreta-dark">{clicksStats.top_link_title || 'Sin título'}</p>
                      <p className="text-xs text-terreta-secondary">
                        {clicksStats.top_link_clicks} Clicks
                        {clicksStats.total_clicks > 0 && (
                          ` (${Math.round((clicksStats.top_link_clicks / clicksStats.total_clicks) * 100)}%)`
                        )}
                      </p>
                    </div>
                  )}

                  {(!viewsStats || viewsStats.total_views === 0) && (!clicksStats || clicksStats.total_clicks === 0) && (
                    <div className="text-center p-8 opacity-50">
                       <BarChart3 className="w-12 h-12 mx-auto text-terreta-border mb-2" />
                       <p className="text-sm text-terreta-secondary">Aún no hay estadísticas disponibles</p>
                       <p className="text-xs text-terreta-secondary mt-1">Las estadísticas aparecerán cuando tu perfil reciba visitas</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-terreta-border bg-terreta-card">
          {!isPublished ? (
            <button 
              onClick={() => setIsPublishModalOpen(true)}
              className="w-full bg-terreta-accent text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-colors"
            >
              <Globe size={18} /> Publicar Perfil
            </button>
          ) : (
            <>
              <button 
                onClick={handleSave}
                disabled={saving || autoSaving}
                className="w-full bg-terreta-accent text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
              </button>
              
              {/* Estado de guardado automático */}
              <div className="text-center text-xs text-terreta-secondary mb-2">
                {autoSaving ? (
                  <span className="flex items-center justify-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-terreta-accent"></div>
                    Guardando automáticamente...
                  </span>
                ) : hasUnsavedChanges ? (
                  <span className="text-amber-600">● Cambios sin guardar</span>
                ) : lastSaved ? (
                  <span className="text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle size={12} />
                    Guardado {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
              {customSlug && (
                <div className="text-center">
                  <p className="text-xs text-terreta-secondary mb-1">Tu perfil está publicado en:</p>
                  <a 
                    href={`/p/${customSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-terreta-accent hover:underline font-mono"
                  >
                    terretahub.com/p/{customSlug}
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Publish Modal */}
        <PublishProfileModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublish={async (extension: string) => {
            // Verificar si el slug ya existe (debe ser único globalmente)
            const { data: existingSlug } = await supabase
              .from('link_bio_profiles')
              .select('id, user_id')
              .eq('custom_slug', extension.toLowerCase())
              .maybeSingle();

            if (existingSlug && existingSlug.user_id !== user.id) {
              throw new Error('Esta extensión ya está en uso. Por favor, elige otra.');
            }

            // Preparar los datos del perfil con la extensión
            const profileData = {
              user_id: user.id,
              username: profile.username,
              display_name: profile.displayName,
              bio: profile.bio,
              avatar: profile.avatar,
              socials: profile.socials,
              blocks: profile.blocks,
              theme: profile.theme,
              is_published: true,
              custom_slug: extension.toLowerCase()
            };

            // Guardar o actualizar
            const { data: existing } = await supabase
              .from('link_bio_profiles')
              .select('id')
              .eq('user_id', user.id)
              .eq('username', user.username)
              .maybeSingle();

            if (existing) {
              const { error: updateError } = await supabase
                .from('link_bio_profiles')
                .update(profileData)
                .eq('user_id', user.id)
                .eq('username', user.username);

              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from('link_bio_profiles')
                .insert(profileData);

              if (insertError) throw insertError;
            }

            setIsPublished(true);
            setCustomSlug(extension);
          }}
          currentExtension={customSlug || undefined}
        />

        {/* Toast Notification */}
        {showToast && (
          <Toast
            message="¡Perfil Guardado!"
            secondaryMessage={
              isPublished && customSlug
                ? `Tu espacio está publicado en: terretahub.com/p/${customSlug}`
                : undefined
            }
            secondaryLink={
              isPublished && customSlug
                ? `/p/${customSlug}`
                : undefined
            }
            onClose={() => setShowToast(false)}
            duration={4000}
          />
        )}
      </div>

      {/* --- RIGHT COLUMN: PREVIEW --- */}
      <div className="hidden lg:flex flex-1 bg-terreta-bg items-center justify-center p-8 relative">
          <div className="absolute top-8 right-8 text-xs font-bold text-terreta-secondary uppercase tracking-widest">Vista Previa Móvil</div>
          
          {/* Phone Frame */}
          <div className="w-[340px] h-[680px] bg-black rounded-[3rem] p-3 shadow-2xl border-[6px] border-gray-800 relative overflow-hidden ring-4 ring-gray-900/10">
             <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden overflow-y-auto no-scrollbar relative">
                
                {/* Dynamic Content */}
                <ProfileRenderer profile={profile} />

                {/* Branding Badge */}
                <div className="pb-6 pt-8 text-center bg-transparent relative z-10">
                   <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest mix-blend-difference text-white/50" style={{ color: profile.theme.textColor }}>Terreta Hub</span>
                </div>
             </div>
             
             {/* Notch */}
             <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>
          </div>
      </div>

      {/* Mobile Preview Modal */}
      {isMobilePreviewOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsMobilePreviewOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-terreta-card">
              <h3 className="font-bold text-terreta-dark">Vista Previa</h3>
              <button
                onClick={() => setIsMobilePreviewOpen(false)}
                className="p-2 text-terreta-secondary hover:text-terreta-dark transition-colors"
                aria-label="Cerrar preview"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Preview Content - Scrollable */}
            <div className="h-[calc(100vh-120px)] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <ProfileRenderer profile={profile} />
              <div className="pb-6 pt-8 text-center bg-transparent">
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest" style={{ color: profile.theme.textColor }}>Terreta Hub</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- IMAGE CAROUSEL COMPONENT ---
interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Limitar a máximo 7 imágenes
  const limitedImages = images.slice(0, 7);
  const imageCount = limitedImages.length;

  // Si solo hay una imagen, mostrar sin carrusel
  if (imageCount <= 1) {
    return (
      <div className="mb-4 w-full">
        <img 
          src={limitedImages[0]} 
          className="w-full h-48 object-cover rounded-lg shadow-sm bg-black/5" 
          alt="Gallery" 
        />
      </div>
    );
  }

  // Calcular el índice real considerando el carrusel circular
  const getRealIndex = (index: number) => {
    if (index < 0) return imageCount - 1;
    if (index >= imageCount) return 0;
    return index;
  };

  // Obtener índices para mostrar (anterior, actual, siguiente)
  const prevIndex = getRealIndex(currentIndex - 1);
  const nextIndex = getRealIndex(currentIndex + 1);

  // Mover al siguiente con animación suave
  const goNext = () => {
    setCurrentIndex((prev) => getRealIndex(prev + 1));
  };

  // Mover al anterior con animación suave
  const goPrev = () => {
    setCurrentIndex((prev) => getRealIndex(prev - 1));
  };

  // Manejar inicio del drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  };

  // Manejar fin del drag
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 50; // Píxeles mínimos para cambiar de imagen
    if (translateX > threshold) {
      goPrev();
    } else if (translateX < -threshold) {
      goNext();
    }
    setTranslateX(0);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Efecto para manejar eventos globales del mouse
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (carouselRef.current) {
          const diff = e.clientX - startX;
          setTranslateX(diff);
        }
      };

      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX, translateX]);

  // Manejar movimiento del touch
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const diff = e.touches[0].clientX - startX;
    setTranslateX(diff);
  };

  return (
    <div 
      ref={containerRef}
      className="mb-4 w-full relative"
      style={{ 
        paddingLeft: imageCount > 2 ? '12px' : '0',
        paddingRight: imageCount > 2 ? '12px' : '0'
      }}
    >
      <div
        ref={carouselRef}
        className="flex items-center gap-2 relative"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {/* Imagen anterior (preview izquierda) - solo si hay más de 2 imágenes */}
        {imageCount > 2 && (
          <div 
            className="flex-shrink-0 opacity-50 scale-90 transition-all duration-300 ease-out"
            style={{
              width: 'calc(33.333% - 5.33px)',
              transform: `translateX(${translateX * 0.3}px)`,
              transition: isDragging ? 'none' : 'all 0.3s ease-out',
            }}
          >
            <img 
              src={limitedImages[prevIndex]} 
              className="w-full h-48 object-cover rounded-lg shadow-sm bg-black/5" 
              alt={`Gallery ${prevIndex}`}
              draggable={false}
            />
          </div>
        )}

        {/* Imagen actual (centro) */}
        <div 
          className="flex-shrink-0 transition-all duration-300 ease-out z-10"
          style={{
            width: imageCount > 2 ? 'calc(33.333% - 5.33px)' : '100%',
            transform: `translateX(${translateX}px) scale(${isDragging ? 0.98 : 1})`,
            transition: isDragging ? 'transform 0.1s ease-out' : 'all 0.3s ease-out',
          }}
        >
          <img 
            src={limitedImages[currentIndex]} 
            className="w-full h-48 object-cover rounded-lg shadow-md bg-black/5" 
            alt={`Gallery ${currentIndex}`}
            draggable={false}
          />
        </div>

        {/* Imagen siguiente (preview derecha) - solo si hay más de 2 imágenes */}
        {imageCount > 2 && (
          <div 
            className="flex-shrink-0 opacity-50 scale-90 transition-all duration-300 ease-out"
            style={{
              width: 'calc(33.333% - 5.33px)',
              transform: `translateX(${translateX * 0.3}px)`,
              transition: isDragging ? 'none' : 'all 0.3s ease-out',
            }}
          >
            <img 
              src={limitedImages[nextIndex]} 
              className="w-full h-48 object-cover rounded-lg shadow-sm bg-black/5" 
              alt={`Gallery ${nextIndex}`}
              draggable={false}
            />
          </div>
        )}

        {/* Botones de navegación (solo si hay más de 2 imágenes) */}
        {imageCount > 2 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hover:scale-110 active:scale-95"
              aria-label="Imagen anterior"
            >
              <ChevronLeft 
                size={20} 
                className="text-gray-700"
              />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hover:scale-110 active:scale-95"
              aria-label="Siguiente imagen"
            >
              <ChevronRight 
                size={20} 
                className="text-gray-700"
              />
            </button>
          </>
        )}
      </div>

      {/* Indicadores de posición (dots) */}
      {imageCount > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {limitedImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? 'w-8 h-2 bg-[#D97706]' 
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- PREVIEW RENDERER COMPONENT ---
// Separated specifically to render exactly what the public sees
export const ProfileRenderer: React.FC<{ profile: LinkBioProfile; profileUserId?: string }> = ({ profile, profileUserId }) => {
  const { theme } = profile;

  // Style helper
  const getBtnClass = () => {
    let base = "w-full py-3 px-4 font-medium transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center text-center shadow-sm mb-3 min-h-[52px] relative ";
    if (theme.buttonStyle === 'pill') base += 'rounded-full ';
    else if (theme.buttonStyle === 'soft') base += 'rounded-xl ';
    else if (theme.buttonStyle === 'outline') base += 'rounded-lg border-2 ';
    else base += 'rounded-none ';
    return base;
  };

  const getBtnStyle = () => {
     if (theme.buttonStyle === 'outline') {
        return { 
           borderColor: theme.buttonColor, 
           color: theme.buttonColor, 
           backgroundColor: 'transparent' 
        };
     }
     return { 
        backgroundColor: theme.buttonColor, 
        color: theme.buttonTextColor 
     };
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName || iconName === 'none') return null;
    const size = 18;
    const style = { position: 'absolute' as const, left: '16px', opacity: 0.9 };
    
    switch(iconName) {
      case 'star': return <Star size={size} style={style} />;
      case 'heart': return <Heart size={size} style={style} />;
      case 'zap': return <Zap size={size} style={style} />;
      case 'check': return <CheckCircle size={size} style={style} />;
      case 'globe': return <Globe size={size} style={style} />;
      case 'instagram': return <Instagram size={size} style={style} />;
      default: return null;
    }
  }

  return (
    <div 
      className="min-h-full px-6 pt-16 pb-8 flex flex-col items-center relative"
      style={{ 
        background: theme.bgType === 'gradient' ? theme.bgColor : undefined, // Handle gradient
        backgroundColor: theme.bgType === 'color' ? theme.bgColor : undefined, // Handle solid
        color: theme.textColor,
        fontFamily: theme.font === 'serif' ? '"Playfair Display", serif' : '"Lato", sans-serif'
      }}
    >
      {/* Background Image Overlay */}
      {theme.backgroundImage && (
         <div 
            className="absolute inset-0 z-0 opacity-100 bg-cover bg-center"
            style={{ backgroundImage: `url(${theme.backgroundImage})` }}
         >
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-black/20"></div>
         </div>
      )}

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Avatar */}
        <div className="mb-4 relative group">
          <img 
              src={profile.avatar} 
              alt={profile.displayName} 
              className="w-24 h-24 rounded-full object-cover border-2 shadow-md"
              style={{ borderColor: theme.textColor }}
          />
        </div>

        {/* Name & Bio */}
        <h1 className="text-xl font-bold mb-2 text-center drop-shadow-sm">{profile.displayName}</h1>
        <p className="text-sm opacity-90 text-center max-w-[250px] mb-6 leading-relaxed font-medium drop-shadow-sm">{profile.bio}</p>

        {/* Social Icons Row */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          {profile.socials.instagram && <a href={`https://instagram.com/${profile.socials.instagram.replace('@','')}`} target="_blank"><Instagram size={20} style={{ color: theme.textColor }} /></a>}
          {profile.socials.twitter && <a href={`https://twitter.com/${profile.socials.twitter.replace('@','')}`} target="_blank"><Twitter size={20} style={{ color: theme.textColor }} /></a>}
          {profile.socials.linkedin && <a href={profile.socials.linkedin} target="_blank"><Linkedin size={20} style={{ color: theme.textColor }} /></a>}
          {profile.socials.website && <a href={profile.socials.website} target="_blank"><Globe size={20} style={{ color: theme.textColor }} /></a>}
        </div>


        {/* Blocks */}
        <div className="w-full max-w-[280px]">
          {profile.blocks.filter(b => b.isVisible).map(block => {
            
            if (block.type === 'header') {
              return (
                <h3 key={block.id} className="text-center font-bold text-xs uppercase tracking-[0.2em] mt-6 mb-4 opacity-80 border-b border-current pb-2 mx-auto w-20" style={{ borderColor: theme.textColor }}>
                  {block.title}
                </h3>
              );
            }

            if (block.type === 'text') {
              return (
                <div key={block.id} className="text-center text-sm mb-4 opacity-90 whitespace-pre-line px-2 font-medium">
                  {block.content}
                </div>
              );
            }

            if (block.type === 'link') {
              const handleLinkClick = () => {
                if (profileUserId && block.url) {
                  trackLinkClick(
                    profileUserId,
                    block.id,
                    normalizeUrl(block.url),
                    block.title
                  ).catch(err => {
                    console.warn('Failed to track link click:', err);
                  });
                }
              };

              return (
                <a 
                  key={block.id} 
                  href={normalizeUrl(block.url || '#')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={getBtnClass()}
                  style={getBtnStyle()}
                  onClick={handleLinkClick}
                >
                  {renderIcon(block.icon)}
                  <span>{block.title}</span>
                </a>
              );
            }

            if (block.type === 'cv' && block.url) {
               return (
                  <a 
                    key={block.id} 
                    href={block.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={getBtnClass()}
                    style={getBtnStyle()}
                  >
                    <FileText size={18} className="absolute left-4 opacity-90" />
                    <span>{block.title || 'Mi Currículum'}</span>
                  </a>
               );
            }

            if (block.type === 'video' && block.url) {
               return (
                  <div key={block.id} className="w-full aspect-video rounded-xl overflow-hidden mb-4 shadow-sm">
                     <iframe 
                        width="100%" 
                        height="100%" 
                        src={getEmbedUrl(block.url)} 
                        title="Video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                     ></iframe>
                  </div>
               )
            }

            if (block.type === 'music' && block.url) {
               return (
                  <div key={block.id} className="w-full mb-4 shadow-sm rounded-xl overflow-hidden">
                     <iframe 
                        style={{ borderRadius: '12px' }} 
                        src={`https://open.spotify.com/embed/track/${block.url.split('/').pop()?.split('?')[0]}`} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allowFullScreen 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                     ></iframe>
                  </div>
               )
            }
            
            if (block.type === 'gallery' && block.images && block.images.length > 0) {
              return (
                <ImageCarousel key={block.id} images={block.images.slice(0, 7)} />
              )
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};
