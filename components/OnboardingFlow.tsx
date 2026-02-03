import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ArrowLeft, User, CheckCircle, Globe, 
  Instagram, Twitter, Linkedin, Youtube, Music, MessageCircle,
  Palette, Loader2, FolderKanban, Calendar, Package, MessageSquare, Facebook
} from 'lucide-react';
import { AuthUser, SocialLinks, BioTheme, LinkBioProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ProfileRenderer } from './ProfileEditor';
import { uploadAvatarToStorage } from '../lib/avatarUtils';
import { Upload, Camera } from 'lucide-react';
import { MascotAnimation } from './MascotAnimation';
import { TERRE_MASCOT_ANIMATION } from '../lib/mascotConstants';

interface ProjectPreview {
  id: string;
  name: string;
  slogan?: string;
  images: string[];
  phase: string;
  author: {
    name: string;
    avatar: string;
  };
}

interface OnboardingFlowProps {
  user: AuthUser;
  onComplete: () => void;
}

type Acto = 'acto1' | 'mascotAnimation' | 'acto2' | 'acto3' | 'completing' | 'completed';
type Slide = 'proyectos' | 'eventos' | 'recursos' | 'agora';
type Acto3Slide = 'avatar' | 'bio' | 'socials' | 'color';

// Mapeo de colores principales a temas (debe coincidir con los temas de ProfileEditor)
const COLOR_THEMES: Record<string, BioTheme> = {
  terreta: {
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
  arcilla: {
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
  bosque: {
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
  minimal: {
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
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentActo, setCurrentActo] = useState<Acto>('acto1');
  const [currentSlide, setCurrentSlide] = useState<Slide>('proyectos');
  
  // Verificar que el tema sea "tierra"
  useEffect(() => {
    if (theme !== 'tierra') {
      setTheme('tierra');
    }
  }, [theme, setTheme]);
  
  // Acto I - Información básica
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Acto II - Slides (no estado necesario, solo navegación)
  
  // Acto III - Recopilación de datos
  const [acto3Slide, setActo3Slide] = useState<Acto3Slide>('avatar');
  const [avatar, setAvatar] = useState<string>(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'user'}`);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bio, setBio] = useState('');
  const [socials, setSocials] = useState<SocialLinks>({});
  const [website, setWebsite] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('terreta');
  const [extension, setExtension] = useState('');
  const [extensionError, setExtensionError] = useState('');
  const [checkingExtension, setCheckingExtension] = useState(false);
  
  // Estado de finalización
  const [completedExtension, setCompletedExtension] = useState('');
  const [loadingExistingProfile, setLoadingExistingProfile] = useState(true);
  
  // Proyectos para mostrar en el slide
  const [featuredProjects, setFeaturedProjects] = useState<ProjectPreview[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Cargar datos existentes del perfil si existen
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const { data: existingProfile } = await supabase
          .from('link_bio_profiles')
          .select('bio, socials, theme, custom_slug')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingProfile) {
          if (existingProfile.bio) {
            setBio(existingProfile.bio);
          }
          if (existingProfile.socials) {
            setSocials(existingProfile.socials as SocialLinks);
            if ((existingProfile.socials as SocialLinks).website) {
              setWebsite((existingProfile.socials as SocialLinks).website || '');
            }
          }
          if (existingProfile.theme) {
            const theme = existingProfile.theme as BioTheme;
            // Mapear tema existente a color si es posible (primero por ID, luego por buttonColor)
            const colorKey = Object.keys(COLOR_THEMES).find(
              key => COLOR_THEMES[key].id === theme.id || COLOR_THEMES[key].buttonColor === theme.buttonColor
            );
            if (colorKey) {
              setSelectedColor(colorKey);
            }
          }
          if (existingProfile.custom_slug) {
            setExtension(existingProfile.custom_slug);
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil existente:', err);
      } finally {
        setLoadingExistingProfile(false);
      }
    };
    
    loadExistingProfile();
  }, [user.id]);

  // Cargar proyectos destacados para el slide
  useEffect(() => {
    const loadFeaturedProjects = async () => {
      try {
        setLoadingProjects(true);
        // Cargar proyectos en fase "Escalado" y publicados
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            slogan,
            images,
            phase,
            author_id,
            profiles!projects_author_id_fkey (
              name,
              avatar
            )
          `)
          .eq('status', 'published')
          .eq('phase', 'Escalado')
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (error) {
          console.error('Error al cargar proyectos:', error);
          // Proyectos de ejemplo si no hay en la BD
          setFeaturedProjects([
            {
              id: '1',
              name: 'El Fotógrafer',
              slogan: 'Capturando momentos únicos',
              images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photographer'
              }
            },
            {
              id: '2',
              name: 'Versa Producciones',
              slogan: 'Innovación en producción audiovisual',
              images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=versa'
              }
            }
          ]);
        } else if (projectsData && projectsData.length > 0) {
          const formattedProjects: ProjectPreview[] = projectsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            slogan: p.slogan,
            images: p.images || [],
            phase: p.phase,
            author: {
              name: p.profiles?.name || 'Autor',
              avatar: p.profiles?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profiles?.name || 'user'}`
            }
          }));
          setFeaturedProjects(formattedProjects);
        } else {
          // Proyectos de ejemplo si no hay en la BD
          setFeaturedProjects([
            {
              id: '1',
              name: 'El Fotógrafer',
              slogan: 'Capturando momentos únicos',
              images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photographer'
              }
            },
            {
              id: '2',
              name: 'Versa Producciones',
              slogan: 'Innovación en producción audiovisual',
              images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800'],
              phase: 'Escalado',
              author: {
                name: 'Autor',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=versa'
              }
            }
          ]);
        }
      } catch (err) {
        console.error('Error al cargar proyectos destacados:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    
    loadFeaturedProjects();
  }, []);

  const accentColor = `rgb(var(--accent))`;

  // Validar username
  const validateUsername = async (value: string) => {
    const cleanUsername = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
    
    if (cleanUsername.length < 3) {
      setUsernameError('El usuario debe tener al menos 3 caracteres');
      return false;
    }
    
    if (cleanUsername.length > 30) {
      setUsernameError('El usuario no puede tener más de 30 caracteres');
      return false;
    }
    
    // Si es el mismo username del usuario, no verificar
    if (cleanUsername === user.username) {
      setUsernameError('');
      return true;
    }
    
    setCheckingUsername(true);
    setUsernameError('');
    
    try {
      const { data: existingProfiles, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        setUsernameError('Error al verificar el usuario');
        setCheckingUsername(false);
        return false;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        setUsernameError('Este usuario ya está en uso');
        setCheckingUsername(false);
        return false;
      }
      
      setUsernameError('');
      setCheckingUsername(false);
      return true;
    } catch (err) {
      setUsernameError('Error al verificar el usuario');
      setCheckingUsername(false);
      return false;
    }
  };

  // Validar extensión
  const validateExtension = async (value: string) => {
    const cleanExtension = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (cleanExtension.length < 3) {
      setExtensionError('La extensión debe tener al menos 3 caracteres');
      return false;
    }
    
    if (cleanExtension.length > 50) {
      setExtensionError('La extensión no puede tener más de 50 caracteres');
      return false;
    }
    
    setCheckingExtension(true);
    setExtensionError('');
    
    try {
      const { data: existingProfiles, error } = await supabase
        .from('link_bio_profiles')
        .select('custom_slug')
        .eq('custom_slug', cleanExtension)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        setExtensionError('Error al verificar la extensión');
        setCheckingExtension(false);
        return false;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        setExtensionError('Esta extensión ya está en uso');
        setCheckingExtension(false);
        return false;
      }
      
      setExtensionError('');
      setCheckingExtension(false);
      return true;
    } catch (err) {
      setExtensionError('Error al verificar la extensión');
      setCheckingExtension(false);
      return false;
    }
  };

  // Manejar cambio de username
  const handleUsernameChange = async (value: string) => {
    const cleanValue = value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
    setUsername(cleanValue);
    if (cleanValue.length >= 3) {
      await validateUsername(cleanValue);
    } else {
      setUsernameError('');
    }
  };

  // Manejar cambio de extensión
  const handleExtensionChange = async (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setExtension(cleanValue);
    if (cleanValue.length >= 3) {
      await validateExtension(cleanValue);
    } else {
      setExtensionError('');
    }
  };

  // Navegar al siguiente slide en Acto II
  const nextSlide = () => {
    const slides: Slide[] = ['proyectos', 'recursos', 'eventos', 'agora'];
    const currentIndex = slides.indexOf(currentSlide);
    if (currentIndex < slides.length - 1) {
      setCurrentSlide(slides[currentIndex + 1]);
    }
  };

  const prevSlide = () => {
    const slides: Slide[] = ['proyectos', 'recursos', 'eventos', 'agora'];
    const currentIndex = slides.indexOf(currentSlide);
    if (currentIndex > 0) {
      setCurrentSlide(slides[currentIndex - 1]);
    }
  };

  // Completar Acto I
  const handleActo1Complete = async () => {
    if (!name.trim()) {
      return;
    }
    
    const isValid = await validateUsername(username);
    if (!isValid || usernameError) {
      return;
    }
    
    // Actualizar nombre y username en el perfil
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), username })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error al actualizar perfil:', error);
        return;
      }
      
      // Mostrar animación de mascota antes de pasar a acto2
      setCurrentActo('mascotAnimation');
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
    }
  };

  // Completar animación de mascota y pasar a Acto II
  const handleMascotAnimationComplete = () => {
    setCurrentActo('acto2');
  };

  // Completar Acto II
  const handleActo2Complete = () => {
    setCurrentActo('acto3');
  };

  // Completar Acto III y finalizar
  const handleActo3Complete = async () => {
    const isValid = await validateExtension(extension);
    if (!isValid || extensionError) {
      return;
    }
    
    setCurrentActo('completing');
    
    try {
      // Preparar datos del perfil
      const selectedTheme = COLOR_THEMES[selectedColor];
      const socialsWithWebsite = { ...socials };
      if (website.trim()) {
        socialsWithWebsite.website = website.trim();
      }
      
      // Usar bio del usuario o valor por defecto
      const finalBio = bio.trim() || 'Explorando la Terreta';
      
      // Crear o actualizar link_bio_profile
      const profileData = {
        user_id: user.id,
        username: username,
        display_name: name.trim(),
        bio: finalBio,
        avatar: avatar,
        socials: socialsWithWebsite,
        blocks: [], // No crear bloques automáticos para evitar duplicación
        theme: selectedTheme,
        is_published: true,
        custom_slug: extension.toLowerCase().replace(/[^a-z0-9_-]/g, '')
      };
      
      // Verificar si ya existe un perfil
      const { data: existing } = await supabase
        .from('link_bio_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('link_bio_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (updateError) {
          throw updateError;
        }
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('link_bio_profiles')
          .insert(profileData);
        
        if (insertError) {
          throw insertError;
        }
      }
      
      // Actualizar onboarding_completed
      const { error: onboardingError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      if (onboardingError) {
        throw onboardingError;
      }
      
      setCompletedExtension(extension.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
      setCurrentActo('completed');
      
      // Esperar un momento antes de permitir navegar
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al completar onboarding:', err);
      alert('Error al completar el onboarding. Por favor, intenta nuevamente.');
      setCurrentActo('acto3');
    }
  };

  // Renderizar Acto I
  const renderActo1 = () => (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* Glassmorphism Card */}
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl text-[rgb(var(--text-main))] mb-3">
            Bienvenido a Terreta Hub
          </h2>
          <p className="text-[rgb(var(--text-secondary))] font-sans">
            Comencemos configurando tu información básica
          </p>
        </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Nombre completo
          </label>
          <div className="relative group">
            <User size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-md"
              placeholder="Tu nombre completo"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
            Usuario
          </label>
          <div className="relative group">
            <span className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 font-bold text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="w-full pl-8 pr-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-md"
              placeholder="usuario"
            />
            {checkingUsername && (
              <div className="absolute right-3 top-3">
                <Loader2 size={16} className="animate-spin text-[rgb(var(--accent))]" />
              </div>
            )}
          </div>
          {usernameError && (
            <p className="mt-2 text-xs text-red-500">{usernameError}</p>
          )}
          <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
            Solo letras minúsculas, números, guiones y guiones bajos. Mínimo 3 caracteres.
          </p>
        </div>
      </div>
      
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleActo1Complete}
            disabled={!name.trim() || !username || usernameError !== '' || checkingUsername}
            style={{ backgroundColor: accentColor }}
            className="px-8 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Continuar
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar Acto II - Slides
  const renderActo2 = () => {
    const slides: Slide[] = ['proyectos', 'recursos', 'eventos', 'agora'];
    const currentIndex = slides.indexOf(currentSlide);
    
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        {/* Glassmorphism Card */}
        <div 
          className="backdrop-blur-xl bg-white/70 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl border border-white/30"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
          }}
        >
          <div className="text-center mb-5 md:mb-6">
            <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--text-main))] mb-2 md:mb-2">
              Conoce Terreta Hub
            </h2>
          </div>
          
          {/* Contenido del slide con glassmorphism interno */}
          <div 
            className={`backdrop-blur-md bg-white/50 rounded-2xl border border-white/40 shadow-lg ${
              currentSlide === 'proyectos' || currentSlide === 'eventos' || currentSlide === 'recursos'
                ? 'p-4 md:p-6' 
                : 'p-6 md:p-8 min-h-[300px] flex flex-col items-center justify-center'
            }`}
            style={{
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1) inset',
              maxHeight: (currentSlide === 'proyectos' || currentSlide === 'eventos' || currentSlide === 'recursos') ? 'calc(90vh - 180px)' : 'auto'
            }}
          >
          {currentSlide === 'proyectos' && (
            <div className="w-full h-full flex flex-col">
              <div className="text-center mb-4 md:mb-4">
                <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-2 md:mb-2">
                  Impulsa tus ideas
                </h3>
                <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed max-w-2xl mx-auto px-2">
                  Desde películas rodadas en el corazón de Valencia hasta estudios creativos de vanguardia. 
                  En Terreta Hub, los proyectos encuentran su lugar.
                </p>
              </div>
              
              {/* Grid de proyectos - optimizado para mobile */}
              {loadingProjects ? (
                <div className="flex justify-center py-8 flex-1 items-center">
                  <Loader2 size={32} className="animate-spin" style={{ color: accentColor }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto flex-1 w-full">
                  {featuredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="backdrop-blur-sm bg-white/50 rounded-lg overflow-hidden border border-white/40 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col"
                    >
                      {/* Imagen del proyecto */}
                      {project.images && project.images.length > 0 ? (
                        <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                          <img
                            src={project.images[0]}
                            alt={project.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {/* Badge de fase */}
                          <div className="absolute top-2 right-2 md:top-2 md:right-2">
                            <span className="px-2 py-1 md:px-2 backdrop-blur-md bg-white/90 text-[rgb(var(--accent))] text-xs md:text-xs font-bold rounded-full shadow-md">
                              {project.phase}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                          <FolderKanban size={24} className="md:w-8 md:h-8 text-gray-400" />
                          <div className="absolute top-2 right-2 md:top-2 md:right-2">
                            <span className="px-2 py-1 md:px-2 backdrop-blur-md bg-white/90 text-[rgb(var(--accent))] text-xs md:text-xs font-bold rounded-full shadow-md">
                              {project.phase}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Contenido */}
                      <div className="p-3 md:p-4 flex-1 flex flex-col min-h-0">
                        <h4 className="font-serif text-base md:text-xl text-[rgb(var(--text-main))] mb-1 md:mb-1 font-bold line-clamp-2 leading-tight">
                          {project.name}
                        </h4>
                        {project.slogan && (
                          <p className="text-xs md:text-sm text-[rgb(var(--text-secondary))] italic mb-2 md:mb-2 line-clamp-2 leading-tight">
                            {project.slogan}
                          </p>
                        )}
                        <div className="flex items-center gap-2 md:gap-2 mt-auto pt-1.5">
                          <img
                            src={project.author.avatar}
                            alt={project.author.name}
                            className="w-5 h-5 md:w-5 md:h-5 rounded-full flex-shrink-0"
                          />
                          <span className="text-xs md:text-xs text-[rgb(var(--text-secondary))] font-sans truncate">
                            {project.author.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {currentSlide === 'eventos' && (
            <div className="w-full h-full flex flex-col">
              <div className="text-center mb-4 md:mb-4">
                <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-2 md:mb-2">
                  Eventos
                </h3>
                <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed max-w-2xl mx-auto px-2">
                  Participa en eventos, workshops y encuentros de la comunidad. 
                  Conecta con otros miembros, aprende y crece junto a nosotros.
                </p>
              </div>
              
              {/* Grid de imágenes de eventos */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-4xl mx-auto flex-1 w-full">
                <div className="backdrop-blur-sm bg-white/50 rounded-lg overflow-hidden border border-white/40 shadow-md flex flex-col">
                  <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src="/onboardevent1.png"
                      alt="Evento 1"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <h4 className="font-serif text-base md:text-xl text-[rgb(var(--text-main))] mb-1 font-bold line-clamp-2 leading-tight">
                      Eventos de la Comunidad
                    </h4>
                    <p className="text-xs md:text-sm text-[rgb(var(--text-secondary))] leading-tight">
                      Workshops y encuentros
                    </p>
                  </div>
                </div>
                
                <div className="backdrop-blur-sm bg-white/50 rounded-lg overflow-hidden border border-white/40 shadow-md flex flex-col">
                  <div className="relative h-32 md:h-36 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src="/onboardevent2.jpg"
                      alt="Evento 2"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <h4 className="font-serif text-base md:text-xl text-[rgb(var(--text-main))] mb-1 font-bold line-clamp-2 leading-tight">
                      Networking y Aprendizaje
                    </h4>
                    <p className="text-xs md:text-sm text-[rgb(var(--text-secondary))] leading-tight">
                      Conecta y crece
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentSlide === 'recursos' && (
            <div className="text-center max-w-2xl">
              <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-3">
                Recursos
              </h3>
              <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed">
                Accede a recursos compartidos por la comunidad. Plantillas, guías, 
                herramientas y más. Colabora y comparte conocimiento.
              </p>
            </div>
          )}
          
          {currentSlide === 'agora' && (
            <div className="text-center max-w-2xl">
              <h3 className="font-serif text-2xl md:text-3xl text-[rgb(var(--text-main))] mb-3">
                Ágora
              </h3>
              <p className="text-sm md:text-base text-[rgb(var(--text-secondary))] font-sans leading-relaxed">
                El corazón social de Terreta Hub. Comparte ideas, haz preguntas, 
                conecta con la comunidad y participa en conversaciones que importan.
              </p>
            </div>
          )}
        </div>
        
          {/* Navegación - optimizada para mobile */}
          <div className="mt-4 md:mt-6 flex justify-between items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="px-5 py-3 md:px-6 md:py-3 backdrop-blur-sm bg-white/60 border-2 border-white/50 text-[rgb(var(--text-main))] font-bold rounded-lg hover:bg-white/80 hover:border-white/70 transition-all flex items-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm md:text-base min-h-[44px]"
            >
              <ArrowLeft size={18} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            {currentIndex === slides.length - 1 ? (
              <button
                onClick={handleActo2Complete}
                style={{ backgroundColor: accentColor }}
                className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-3.5 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-base md:text-base min-h-[48px]"
              >
                Continuar
                <ArrowRight size={18} className="md:w-[18px] md:h-[18px]" />
              </button>
            ) : (
              <button
                onClick={nextSlide}
                style={{ backgroundColor: accentColor }}
                className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-3.5 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-base md:text-base min-h-[48px]"
              >
                Siguiente
                <ArrowRight size={18} className="md:w-[18px] md:h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Navegación entre slides del Acto III
  const acto3Slides: Acto3Slide[] = ['avatar', 'bio', 'socials', 'color'];
  const currentActo3Index = acto3Slides.indexOf(acto3Slide);
  
  const nextActo3Slide = () => {
    if (currentActo3Index < acto3Slides.length - 1) {
      setActo3Slide(acto3Slides[currentActo3Index + 1]);
    }
  };
  
  const prevActo3Slide = () => {
    if (currentActo3Index > 0) {
      setActo3Slide(acto3Slides[currentActo3Index - 1]);
    }
  };

  // Manejar subida de avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatarToStorage(user.id, file);
      setAvatar(avatarUrl);
    } catch (error) {
      console.error('Error al subir avatar:', error);
      alert('Error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Generar perfil temporal para el preview
  const getPreviewProfile = (): LinkBioProfile => {
    const theme = COLOR_THEMES[selectedColor] || COLOR_THEMES.terreta;
    
    return {
      username: extension || user.username || 'usuario',
      displayName: name || user.name || 'Usuario',
      bio: bio.trim() || 'Explorando la Terreta',
      avatar: avatar,
      cvUrl: undefined,
      socials: {
        ...socials,
        website: website || undefined
      },
      blocks: [], // En el onboarding inicial no hay bloques
      theme: theme
    };
  };

  // Renderizar Acto III
  const renderActo3 = () => {
    const previewProfile = getPreviewProfile();
    
    return (
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        {/* LEFT COLUMN: FORM */}
        <div className="w-full lg:w-1/2 lg:max-w-2xl mx-auto p-4 lg:p-8">
      {/* Glassmorphism Card */}
      <div 
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 lg:p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
            <div className="text-center mb-6">
              <h2 className="font-serif text-3xl lg:text-4xl text-[rgb(var(--text-main))] mb-3">
            Completa tu Perfil
          </h2>
              <p className="text-[rgb(var(--text-secondary))] font-sans text-sm lg:text-base">
            Personaliza tu página personal y compártela con el mundo
          </p>
        </div>
      
          {/* Contenido del slide con glassmorphism interno */}
          <div 
            className="backdrop-blur-md bg-white/50 rounded-2xl border border-white/40 shadow-lg p-4 lg:p-6 min-h-[400px] max-h-[calc(100vh-350px)] flex flex-col"
            style={{
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1) inset'
            }}
          >
            {/* Slide 1: Avatar */}
            {acto3Slide === 'avatar' && (
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera size={32} style={{ color: accentColor }} />
                  </div>
                  <h3 className="font-serif text-2xl lg:text-3xl text-[rgb(var(--text-main))] mb-2">
                    Tu Foto de Perfil
                  </h3>
                  <p className="text-sm lg:text-base text-[rgb(var(--text-secondary))] font-sans">
                    Sube una foto que te represente
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                  <div className="relative">
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-32 h-32 rounded-full object-cover border-4 shadow-lg"
                      style={{ borderColor: accentColor }}
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                    <div className="px-6 py-3 backdrop-blur-sm bg-white/60 border-2 border-white/50 text-[rgb(var(--text-main))] font-bold rounded-lg hover:bg-white/80 hover:border-white/70 transition-all flex items-center gap-2 shadow-md">
                      {uploadingAvatar ? (
                        <>
                          <Loader2 size={18} className="animate-spin" style={{ color: accentColor }} />
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} style={{ color: accentColor }} />
                          <span>Subir Foto</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}
            
            {/* Slide 2: Bio */}
            {acto3Slide === 'bio' && (
              <div className="flex flex-col flex-1">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={32} style={{ color: accentColor }} />
                  </div>
                  <h3 className="font-serif text-2xl lg:text-3xl text-[rgb(var(--text-main))] mb-2">
                    Cuéntanos sobre ti
                  </h3>
                  <p className="text-sm lg:text-base text-[rgb(var(--text-secondary))] font-sans">
                    Describe qué haces y tus intereses
                  </p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-3 uppercase tracking-wide">
                    Descripción de qué haces
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 resize-none shadow-md"
                    placeholder="Cuéntanos sobre ti, tu trabajo, tus intereses..."
                  />
                </div>
              </div>
            )}
            
            {/* Slide 3: Redes Sociales + Website */}
            {acto3Slide === 'socials' && (
              <div className="flex flex-col flex-1">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe size={32} style={{ color: accentColor }} />
                  </div>
                  <h3 className="font-serif text-2xl lg:text-3xl text-[rgb(var(--text-main))] mb-2">
                    Tus Redes Sociales
                  </h3>
                  <p className="text-sm lg:text-base text-[rgb(var(--text-secondary))] font-sans">
                    Conecta tus perfiles sociales
                  </p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <Instagram size={20} className="text-[rgb(var(--text-secondary))]" />
                      <input
                        type="text"
                        value={socials.instagram || ''}
                        onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                        placeholder="Instagram"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Twitter size={20} className="text-[rgb(var(--text-secondary))]" />
                      <input
                        type="text"
                        value={socials.twitter || ''}
                        onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                        placeholder="Twitter/X"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Linkedin size={20} className="text-[rgb(var(--text-secondary))]" />
                      <input
                        type="text"
                        value={socials.linkedin || ''}
                        onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                        placeholder="LinkedIn"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Facebook size={20} className="text-[rgb(var(--text-secondary))]" />
                      <input
                        type="text"
                        value={socials.facebook || ''}
                        onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                        placeholder="Facebook"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Youtube size={20} className="text-[rgb(var(--text-secondary))]" />
                      <input
                        type="text"
                        value={socials.youtube || ''}
                        onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                        placeholder="YouTube"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[rgb(var(--text-secondary))]">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.79 2.89 2.89 0 0 1 2.31-4.64 2.89 2.89 0 0 1 .88-.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                      </svg>
                      <input
                        type="text"
                        value={socials.tiktok || ''}
                        onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
                        placeholder="TikTok"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[rgb(var(--text-secondary))]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <input
                        type="text"
                        value={socials.whatsapp || ''}
                        onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })}
                        placeholder="WhatsApp"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[rgb(var(--text-secondary))]">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.78-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.56.3z"/>
                      </svg>
                      <input
                        type="text"
                        value={socials.spotify || ''}
                        onChange={(e) => setSocials({ ...socials, spotify: e.target.value })}
                        placeholder="Spotify"
                        className="flex-1 px-4 py-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/30">
                    <label className="block text-sm font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
                      Website Personal o de Empresa
                    </label>
                    <div className="relative group">
                      <Globe size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://tu-website.com"
                        className="w-full pl-10 pr-4 py-3 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg focus:ring-2 focus:ring-[rgb(var(--accent))] focus:bg-white/80 focus:border-white/70 outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50 shadow-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Slide 4: Color + URL */}
            {acto3Slide === 'color' && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="text-center mb-3 flex-shrink-0">
                  <div className="w-12 h-12 bg-[rgb(var(--accent))]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Palette size={24} style={{ color: accentColor }} />
                  </div>
                  <h3 className="font-serif text-lg lg:text-xl text-[rgb(var(--text-main))] mb-1">
                    Personaliza tu Estilo
                  </h3>
                  <p className="text-xs text-[rgb(var(--text-secondary))] font-sans">
                    Elige tu color y tu URL personalizada
                  </p>
                </div>
                
                <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto">
                  <div className="flex-shrink-0">
                    <label className="block text-xs font-bold text-[rgb(var(--text-main))] mb-2 uppercase tracking-wide">
                      Color Principal
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedColor(key)}
                          className={`p-2.5 rounded-lg border-2 transition-all backdrop-blur-sm bg-white/40 ${
                            selectedColor === key
                              ? 'border-[rgb(var(--accent))] ring-2 ring-[rgb(var(--accent))] bg-white/60 shadow-lg'
                              : 'border-white/50 hover:border-white/70 hover:bg-white/50'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded mb-1"
                            style={{ backgroundColor: theme.bgColor }}
                          />
                          <span className="font-bold text-[10px] text-[rgb(var(--text-main))] leading-tight">{theme.name}</span>
                          {selectedColor === key && (
                            <div className="mt-0.5 flex justify-center">
                              <CheckCircle size={12} style={{ color: accentColor }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <label className="block text-xs font-bold text-[rgb(var(--text-main))] mb-1.5 uppercase tracking-wide">
                      Tu URL Personalizada
                    </label>
                    <div className="flex items-center gap-2 backdrop-blur-sm bg-white/60 border border-white/50 rounded-lg p-2 shadow-md">
                      <span className="text-[10px] text-[rgb(var(--text-secondary))] font-mono whitespace-nowrap">
                        www.terretahub.com/p/
                      </span>
                      <div className="flex-1 flex items-center">
                        <input
                          type="text"
                          value={extension}
                          onChange={(e) => handleExtensionChange(e.target.value)}
                          placeholder="tu-extension"
                          className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                          maxLength={50}
                        />
                        {checkingExtension && (
                          <Loader2 size={12} className="animate-spin ml-2" style={{ color: accentColor }} />
                        )}
                      </div>
                    </div>
                    {extensionError && (
                      <p className="mt-1 text-xs text-red-500">{extensionError}</p>
                    )}
                    <p className="mt-1 text-[10px] text-[rgb(var(--text-secondary))]">
                      Solo letras minúsculas, números, guiones y guiones bajos. Mínimo 3 caracteres.
                    </p>
                  </div>
                  
                  <div className="backdrop-blur-sm bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/30 rounded-lg p-2.5 flex-shrink-0">
                    <p className="text-[10px] text-[rgb(var(--text-main))] leading-relaxed">
                      <strong>Importante:</strong> Luego podrás agregar muchas más cosas y personalizar tu perfil 
                      (fotos, videos, currículum y personalizar los colores y botones a tu antojo).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Navegación entre slides */}
          <div className="mt-6 flex justify-between items-center gap-2">
            <button
              onClick={prevActo3Slide}
              disabled={currentActo3Index === 0}
              className="px-5 py-3 backdrop-blur-sm bg-white/60 border-2 border-white/50 text-[rgb(var(--text-main))] font-bold rounded-lg hover:bg-white/80 hover:border-white/70 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm min-h-[44px]"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            {currentActo3Index === acto3Slides.length - 1 ? (
              <button
                onClick={handleActo3Complete}
                disabled={!extension || extensionError !== '' || checkingExtension}
                style={{ backgroundColor: accentColor }}
                className="flex-1 px-6 py-3.5 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-base min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finalizar
                <CheckCircle size={18} />
              </button>
            ) : (
              <button
                onClick={nextActo3Slide}
                style={{ backgroundColor: accentColor }}
                className="flex-1 px-6 py-3.5 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-base min-h-[48px]"
              >
                Siguiente
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW (Desktop only) */}
      <div className="hidden lg:flex flex-1 bg-terreta-bg items-center justify-center p-8 relative">
        <div className="absolute top-8 right-8 text-xs font-bold text-terreta-secondary uppercase tracking-widest">
          Vista Previa Móvil
        </div>
        
        {/* Phone Frame */}
        <div className="w-[340px] h-[680px] bg-black rounded-[3rem] p-3 shadow-2xl border-[6px] border-gray-800 relative overflow-hidden ring-4 ring-gray-900/10">
          <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden overflow-y-auto no-scrollbar relative">
            {/* Dynamic Content */}
            <ProfileRenderer profile={previewProfile} />

            {/* Branding Badge */}
            <div className="pb-6 pt-8 text-center bg-transparent relative z-10">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest mix-blend-difference text-white/50" style={{ color: previewProfile.theme.textColor }}>
                Terreta Hub
              </span>
            </div>
          </div>
          
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>
        </div>
      </div>
    </div>
  );
  };

  // Renderizar pantalla de carga
  const renderCompleting = () => (
    <div className="w-full max-w-md mx-auto p-8 text-center">
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <Loader2 size={48} className="animate-spin mx-auto mb-6" style={{ color: accentColor }} />
        <h2 className="font-serif text-3xl text-[rgb(var(--text-main))] mb-3">
          Configurando tu perfil...
        </h2>
        <p className="text-[rgb(var(--text-secondary))] font-sans">
          Estamos preparando todo para ti
        </p>
      </div>
    </div>
  );

  // Renderizar pantalla de éxito
  const renderCompleted = () => (
    <div className="w-full max-w-md mx-auto p-8 text-center">
      <div 
        className="backdrop-blur-xl bg-white/70 rounded-3xl p-12 shadow-2xl border border-white/30"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
        }}
      >
        <div className="w-20 h-20 backdrop-blur-sm bg-green-100/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-green-200/50">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="font-serif text-3xl text-[rgb(var(--text-main))] mb-3">
          ¡Bienvenido a Terreta Hub!
        </h2>
        <p className="text-[rgb(var(--text-secondary))] font-sans mb-6">
          Tu perfil ha sido creado y publicado exitosamente
        </p>
        <div className="backdrop-blur-sm bg-white/50 rounded-lg p-4 mb-8 border border-white/40">
          <p className="text-sm text-[rgb(var(--text-secondary))] font-mono">
            www.terretahub.com/p/{completedExtension}
          </p>
        </div>
        <button
          onClick={() => navigate(`/p/${completedExtension}`)}
          style={{ backgroundColor: accentColor }}
          className="w-full px-8 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          Ver mi perfil
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Fondo orgánico con degradado tierra a cielo y textura */}
      <div 
        className="fixed inset-0"
        style={{
          background: `linear-gradient(180deg, 
            rgba(217, 119, 6, 0.15) 0%, 
            rgba(249, 246, 240, 0.95) 30%, 
            rgba(236, 248, 255, 0.85) 70%, 
            rgba(59, 130, 246, 0.1) 100%
          )`,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(217, 119, 6, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='paper' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='25' cy='25' r='1' fill='%23D97706' opacity='0.03'/%3E%3Ccircle cx='75' cy='75' r='1' fill='%233B82F6' opacity='0.03'/%3E%3Ccircle cx='50' cy='10' r='0.5' fill='%23D97706' opacity='0.02'/%3E%3Ccircle cx='10' cy='50' r='0.5' fill='%233B82F6' opacity='0.02'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23paper)'/%3E%3C/svg%3E")
          `,
          backgroundSize: '100% 100%, 100% 100%, 200px 200px',
          backgroundPosition: 'center, center, 0 0',
          backgroundRepeat: 'no-repeat, no-repeat, repeat'
        }}
      />
      
      {/* Overlay sutil para mejorar legibilidad */}
      <div className="fixed inset-0 bg-[rgb(var(--bg-main))]/40 backdrop-blur-[0.5px]" />
      
      {/* Animación de mascota - fuera del contenedor principal para que cubra toda la pantalla */}
      {currentActo === 'mascotAnimation' && (
        <MascotAnimation
          animationData={TERRE_MASCOT_ANIMATION}
          duration={5}
          text="Preparando presentación de Terreta Hub"
          onComplete={handleMascotAnimationComplete}
        />
      )}
      
      <div className={`relative min-h-screen flex items-center justify-center py-6 px-4 ${currentActo === 'acto3' ? 'items-stretch' : ''}`}>
        <div className={`w-full animate-fade-in ${currentActo === 'acto3' ? 'max-h-full h-full' : 'max-h-[90vh] overflow-hidden'}`}>
          {currentActo === 'acto1' && <div className="animate-scale-in">{renderActo1()}</div>}
          {currentActo === 'acto2' && <div className="animate-scale-in">{renderActo2()}</div>}
          {currentActo === 'acto3' && <div className="animate-scale-in h-full">{renderActo3()}</div>}
          {currentActo === 'completing' && <div className="animate-fade-in">{renderCompleting()}</div>}
          {currentActo === 'completed' && <div className="animate-scale-in">{renderCompleted()}</div>}
        </div>
      </div>
    </div>
  );
};
