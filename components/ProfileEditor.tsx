import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Layout, Type, Link as LinkIcon, Image as ImageIcon, 
  Youtube, Music, Trash2, GripVertical, ChevronDown, ChevronUp,
  Instagram, Twitter, Linkedin, Globe, Plus, Palette, BarChart3,
  Video, Star, Heart, Zap, CheckCircle, Upload, Camera, Smartphone, Monitor,
  Images
} from 'lucide-react';
import { AuthUser, LinkBioProfile, BioBlock, BioTheme } from '../types';
import { supabase } from '../lib/supabase';
import { PublishProfileModal } from './PublishProfileModal';
import { Toast } from './Toast';

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
      <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
          <input 
            type="color" 
            value={value.startsWith('#') ? value : '#000000'} // Fallback for gradients in basic picker
            onChange={(e) => onChange(e.target.value)}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
          />
        </div>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">#</span>
          <input 
            type="text" 
            value={localHex.replace('#', '')}
            onChange={handleHexChange}
            className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none uppercase"
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
  const hasLoadedRef = useRef(false);
  
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
    console.log('[ProfileEditor] useEffect triggered', { hasLoaded: hasLoadedRef.current, userId: user.id });
    
    // Solo cargar si no se ha cargado antes
    if (hasLoadedRef.current) {
      console.log('[ProfileEditor] Already loaded, skipping');
      return;
    }
    hasLoadedRef.current = true;

    const loadProfile = async () => {
      // Timeout de seguridad (10 segundos)
      const timeoutId = setTimeout(() => {
        console.error('[ProfileEditor] Timeout: Loading took too long');
        setLoading(false);
      }, 10000);

      try {
        console.log('[ProfileEditor] Setting loading to true');
        setLoading(true);
        
        console.log('[ProfileEditor] Querying Supabase', { userId: user.id, username: user.username });
        const { data: existingProfile, error } = await supabase
          .from('link_bio_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('username', user.username)
          .maybeSingle();

        clearTimeout(timeoutId);

        console.log('[ProfileEditor] Supabase response', { 
          hasData: !!existingProfile, 
          error: error,
          errorCode: error?.code 
        });

        if (error && error.code !== 'PGRST116') {
          // PGRST116 es "no rows returned", que es esperado si no existe
          console.error('[ProfileEditor] Error al cargar perfil:', error);
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
          console.log('[ProfileEditor] Profile loaded successfully');
        } else {
          console.log('[ProfileEditor] No profile found, using initial profile');
          // Si no existe, usar el perfil inicial
          setProfile(getInitialProfile(user));
          setIsPublished(false);
          setCustomSlug(null);
        }
      } catch (err) {
        console.error('[ProfileEditor] Exception caught:', err);
      } finally {
        console.log('[ProfileEditor] Finally block - setting loading to false');
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

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
        let { data, error: updateError } = await supabase
          .from('link_bio_profiles')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('[ProfileEditor] Error al actualizar:', updateError);
          
          // Reintentar una vez más
          console.log('[ProfileEditor] Reintentando actualización...');
          const { data: retryData, error: retryError } = await supabase
            .from('link_bio_profiles')
            .update(profileData)
            .eq('user_id', user.id)
            .select()
            .single();

          if (retryError) {
            console.error('[ProfileEditor] Error en reintento:', retryError);
            alert('Error al actualizar el perfil: ' + (retryError.message || 'Error desconocido'));
            setSaving(false);
            return;
          }
          
          console.log('[ProfileEditor] Reintento exitoso');
          data = retryData;
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
            theme: (data.theme as any) || getInitialProfile(user).theme
          };
          setProfile(updatedProfile);
        }
      } else {
        // No existe, crear nuevo
        console.log('[ProfileEditor] Creando nuevo perfil');
        let { data, error: insertError } = await supabase
          .from('link_bio_profiles')
          .insert(profileData)
          .select()
          .single();

        if (insertError) {
          console.error('[ProfileEditor] Error al insertar:', insertError);
          
          // Reintentar una vez más
          console.log('[ProfileEditor] Reintentando inserción...');
          const { data: retryData, error: retryError } = await supabase
            .from('link_bio_profiles')
            .insert(profileData)
            .select()
            .single();

          if (retryError) {
            console.error('[ProfileEditor] Error en reintento:', retryError);
            alert('Error al guardar el perfil: ' + (retryError.message || 'Error desconocido'));
            setSaving(false);
            return;
          }
          
          console.log('[ProfileEditor] Reintento exitoso');
          data = retryData;
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
        }
      }
      
      // Mostrar toast de éxito
      console.log('[ProfileEditor] Mostrando toast de éxito');
      setShowToast(true);
    } catch (error: any) {
      console.error('[ProfileEditor] Error completo al guardar:', error);
      alert(error.message || 'Error al guardar el perfil. Intenta nuevamente.');
    } finally {
      console.log('[ProfileEditor] handleSave finally - setting saving to false');
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      title: type === 'link' ? 'Nuevo Enlace' : type === 'header' ? 'Nueva Sección' : type === 'video' ? 'Video Destacado' : type === 'music' ? 'Canción' : type === 'gallery' ? 'Galería' : '',
      url: '',
      content: type === 'text' ? 'Escribe algo aquí...' : '',
      icon: 'none',
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
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfile(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => {
              if (b.id === blockId) {
                return { ...b, images: [...(b.images || []), reader.result as string] };
              }
              return b;
            })
          }));
        };
        reader.readAsDataURL(file as Blob);
      });
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
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-gray-50 overflow-hidden">
      
      {/* --- LEFT COLUMN: EDITOR --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-gray-200">
        
        {/* Editor Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'content' ? 'text-[#D97706] border-b-2 border-[#D97706]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Layout size={18} /> <span className="hidden sm:inline">Contenido</span>
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'appearance' ? 'text-[#D97706] border-b-2 border-[#D97706]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Palette size={18} /> <span className="hidden sm:inline">Apariencia</span>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'stats' ? 'text-[#D97706] border-b-2 border-[#D97706]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BarChart3 size={18} /> <span className="hidden sm:inline">Estadísticas</span>
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {activeTab === 'content' ? (
            <>
              {/* Identity Section */}
              <section className="space-y-4">
                <h3 className="font-serif text-xl text-terreta-dark">Identidad</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start bg-gray-50 p-6 rounded-xl border border-gray-100">
                  
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-full bg-gray-200 overflow-hidden cursor-pointer group border-2 border-white shadow-sm hover:border-[#D97706] transition-colors"
                    >
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="text-white" size={24} />
                      </div>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
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
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Nombre Visible</label>
                      <input 
                        type="text" 
                        value={profile.displayName}
                        onChange={e => setProfile({...profile, displayName: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-serif placeholder-gray-400 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                        placeholder="Tu Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Biografía</label>
                      <textarea 
                        value={profile.bio}
                        onChange={e => setProfile({...profile, bio: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none placeholder-gray-400 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
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

              {/* Blocks Section */}
              <section className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                   <h3 className="font-serif text-xl text-terreta-dark">Bloques</h3>
                   <div className="flex gap-2 bg-gray-100 p-1 rounded-lg flex-wrap">
                      <button onClick={() => addBlock('link')} className="p-2 bg-white text-terreta-dark rounded shadow-sm hover:shadow text-xs flex items-center gap-1 font-bold border border-gray-200"><Plus size={14}/> Link</button>
                      <button onClick={() => addBlock('header')} className="p-2 bg-transparent text-gray-600 rounded hover:bg-gray-200 text-xs flex items-center gap-1"><Type size={14}/> Título</button>
                      <button onClick={() => addBlock('text')} className="p-2 bg-transparent text-gray-600 rounded hover:bg-gray-200 text-xs flex items-center gap-1"><Layout size={14}/> Texto</button>
                      <button onClick={() => addBlock('video')} className="p-2 bg-transparent text-gray-600 rounded hover:bg-gray-200 text-xs flex items-center gap-1"><Video size={14}/> Video</button>
                      <button onClick={() => addBlock('music')} className="p-2 bg-transparent text-gray-600 rounded hover:bg-gray-200 text-xs flex items-center gap-1"><Music size={14}/> Música</button>
                      <button onClick={() => addBlock('gallery')} className="p-2 bg-transparent text-gray-600 rounded hover:bg-gray-200 text-xs flex items-center gap-1"><Images size={14}/> Galería</button>
                   </div>
                </div>

                <div className="space-y-3">
                   {profile.blocks.length === 0 && (
                     <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="mb-2">Aún no has añadido contenido.</p>
                        <p className="text-xs">Usa los botones de arriba para agregar bloques.</p>
                     </div>
                   )}
                   {profile.blocks.map((block, index) => (
                      <div 
                        key={block.id} 
                        className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm group transition-all duration-200 ${draggedBlockIndex === index ? 'opacity-50 ring-2 ring-[#D97706] border-[#D97706]' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                         <div className="flex justify-between items-start mb-3 cursor-move">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 select-none">
                               <GripVertical size={16} className="text-gray-300 group-hover:text-gray-500" />
                               {block.type === 'header' ? 'Sección' : block.type === 'gallery' ? 'Galería' : block.type}
                            </div>
                            <button onClick={() => removeBlock(block.id)} className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                         </div>
                         
                         <div className="space-y-3 pl-6">
                            {(block.type === 'link' || block.type === 'header' || block.type === 'video' || block.type === 'music') && (
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  className="flex-1 border-b border-gray-200 focus:border-[#D97706] outline-none py-1 font-medium bg-transparent placeholder-gray-300"
                                  placeholder={block.type === 'header' ? 'Nombre de la sección' : 'Título del bloque'}
                                  value={block.title || ''}
                                  onChange={e => updateBlock(block.id, { title: e.target.value })}
                                />
                                {block.type === 'link' && (
                                  <select 
                                    className="text-sm border-b border-gray-200 bg-transparent text-gray-500 outline-none"
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
                                className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm text-gray-600 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                                placeholder={block.type === 'video' ? 'https://youtube.com/... o https://vimeo.com/...' : 'https://...'}
                                value={block.url || ''}
                                onChange={e => updateBlock(block.id, { url: e.target.value })}
                              />
                            )}
                             {block.type === 'text' && (
                              <textarea 
                                className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm text-gray-600 resize-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
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
                                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group shadow-sm bg-gray-100">
                                         <img src={img} className="w-full h-full object-cover" alt="Gallery thumbnail" />
                                         <button 
                                            onClick={() => removeGalleryImage(block.id, idx)}
                                            className="absolute top-0 right-0 bg-black/60 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                            <Trash2 size={12} />
                                         </button>
                                      </div>
                                   ))}
                                   <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#D97706] hover:text-[#D97706] transition-colors bg-gray-50">
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Fondo del Perfil</label>
                    
                    {/* Background Type Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-4">
                      <button 
                        onClick={() => {
                          setProfile(p => ({...p, theme: {...p.theme, bgType: 'color', bgColor: gradientStart, id: 'custom'}}));
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${profile.theme.bgType === 'color' ? 'bg-white shadow text-[#D97706]' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Sólido
                      </button>
                      <button 
                         onClick={() => {
                          updateGradient(gradientStart, gradientEnd);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${profile.theme.bgType === 'gradient' ? 'bg-white shadow text-[#D97706]' : 'text-gray-500 hover:text-gray-700'}`}
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Estilo de Botones</label>
                    <div className="grid grid-cols-3 gap-3">
                       {/* Option: Solid */}
                       <button 
                          onClick={() => setProfile({...profile, theme: {...profile.theme, buttonStyle: 'solid'}})}
                          className={`relative p-3 border rounded-xl flex flex-col items-center gap-3 hover:bg-gray-50 transition-all ${profile.theme.buttonStyle === 'solid' ? 'border-[#D97706] bg-orange-50/50 ring-1 ring-[#D97706]' : 'border-gray-200'}`}
                       >
                          {/* Radio Indicator */}
                          <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${profile.theme.buttonStyle === 'solid' ? 'border-[#D97706]' : 'border-gray-300'}`}>
                             {profile.theme.buttonStyle === 'solid' && <div className="w-2 h-2 bg-[#D97706] rounded-full" />}
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-8 bg-gray-800 rounded shadow-sm mt-2"></div>
                          <span className={`text-xs font-bold ${profile.theme.buttonStyle === 'solid' ? 'text-[#D97706]' : 'text-gray-500'}`}>Sólido</span>
                       </button>

                       {/* Option: Rounded (Soft) */}
                       <button 
                          onClick={() => setProfile({...profile, theme: {...profile.theme, buttonStyle: 'soft'}})}
                          className={`relative p-3 border rounded-xl flex flex-col items-center gap-3 hover:bg-gray-50 transition-all ${profile.theme.buttonStyle === 'soft' ? 'border-[#D97706] bg-orange-50/50 ring-1 ring-[#D97706]' : 'border-gray-200'}`}
                       >
                           {/* Radio Indicator */}
                           <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${profile.theme.buttonStyle === 'soft' ? 'border-[#D97706]' : 'border-gray-300'}`}>
                             {profile.theme.buttonStyle === 'soft' && <div className="w-2 h-2 bg-[#D97706] rounded-full" />}
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-8 bg-gray-800 rounded-lg shadow-sm mt-2"></div>
                          <span className={`text-xs font-bold ${profile.theme.buttonStyle === 'soft' ? 'text-[#D97706]' : 'text-gray-500'}`}>Redondeado</span>
                       </button>

                       {/* Option: Outline */}
                       <button 
                          onClick={() => setProfile({...profile, theme: {...profile.theme, buttonStyle: 'outline'}})}
                          className={`relative p-3 border rounded-xl flex flex-col items-center gap-3 hover:bg-gray-50 transition-all ${profile.theme.buttonStyle === 'outline' ? 'border-[#D97706] bg-orange-50/50 ring-1 ring-[#D97706]' : 'border-gray-200'}`}
                       >
                           {/* Radio Indicator */}
                           <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${profile.theme.buttonStyle === 'outline' ? 'border-[#D97706]' : 'border-gray-300'}`}>
                             {profile.theme.buttonStyle === 'outline' && <div className="w-2 h-2 bg-[#D97706] rounded-full" />}
                          </div>

                          {/* Visual Preview */}
                          <div className="w-full h-8 border-2 border-gray-800 rounded shadow-sm mt-2 bg-transparent"></div>
                          <span className={`text-xs font-bold ${profile.theme.buttonStyle === 'outline' ? 'text-[#D97706]' : 'text-gray-500'}`}>Outline</span>
                       </button>
                    </div>
                 </div>

                 {/* Button Colors */}
                 <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Colores</label>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                   <p className="text-xs font-bold text-gray-400 uppercase">Vistas Totales</p>
                   <p className="text-3xl font-bold text-terreta-dark mt-1">1,248</p>
                   <p className="text-xs text-green-500 mt-2 font-bold flex items-center gap-1"><ChevronUp size={12}/> +12%</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                   <p className="text-xs font-bold text-gray-400 uppercase">Clicks en Enlaces</p>
                   <p className="text-3xl font-bold text-terreta-dark mt-1">482</p>
                   <p className="text-xs text-green-500 mt-2 font-bold flex items-center gap-1"><ChevronUp size={12}/> +5%</p>
                </div>
              </div>

              {/* Devices Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                 <h4 className="font-bold text-gray-500 text-xs uppercase mb-4 flex items-center gap-2">
                    <Smartphone size={14} /> Dispositivos
                 </h4>
                 <div className="space-y-4">
                    <div>
                       <div className="flex justify-between text-xs mb-2 text-terreta-dark font-medium">
                          <span className="flex items-center gap-1"><Smartphone size={12}/> Móvil</span>
                          <span className="font-bold">85%</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-[#D97706] h-full rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs mb-2 text-terreta-dark font-medium">
                          <span className="flex items-center gap-1"><Monitor size={12}/> Escritorio</span>
                          <span className="font-bold">15%</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gray-400 h-full rounded-full transition-all duration-1000" style={{ width: '15%' }}></div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h4 className="font-bold text-[#D97706] mb-2 text-sm uppercase">Enlace más popular</h4>
                <p className="font-serif text-lg text-terreta-dark">Visita mi web</p>
                <p className="text-xs text-gray-500">210 Clicks (43%)</p>
              </div>

              <div className="text-center p-8 opacity-50">
                 <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                 <p className="text-sm text-gray-400">Más métricas próximamente</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {!isPublished ? (
            <button 
              onClick={() => setIsPublishModalOpen(true)}
              className="w-full bg-[#D97706] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#B45309] transition-colors"
            >
              <Globe size={18} /> Publicar Perfil
            </button>
          ) : (
            <>
              <button 
                onClick={handleSave}
                className="w-full bg-[#D97706] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#B45309] transition-colors mb-2"
              >
                {saving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
              </button>
              {customSlug && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Tu perfil está publicado en:</p>
                  <a 
                    href={`/p/${customSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#D97706] hover:underline font-mono"
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
      <div className="hidden lg:flex flex-1 bg-gray-100 items-center justify-center p-8 relative">
          <div className="absolute top-8 right-8 text-xs font-bold text-gray-400 uppercase tracking-widest">Vista Previa Móvil</div>
          
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
    </div>
  );
};


// --- PREVIEW RENDERER COMPONENT ---
// Separated specifically to render exactly what the public sees
export const ProfileRenderer: React.FC<{ profile: LinkBioProfile }> = ({ profile }) => {
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
              return (
                <a 
                  key={block.id} 
                  href={block.url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={getBtnClass()}
                  style={getBtnStyle()}
                >
                  {renderIcon(block.icon)}
                  <span>{block.title}</span>
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
                <div key={block.id} className="grid grid-cols-2 gap-2 mb-4">
                  {block.images.map((img, i) => (
                    <img key={i} src={img} className="w-full h-24 object-cover rounded-lg shadow-sm bg-black/5" alt={`Gallery ${i}`} />
                  ))}
                </div>
              )
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};