import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateSlug, normalizeUrl, renderMarkdown } from '../lib/utils';
import { NotFound404 } from './NotFound404';
import { Calendar, User, Video, Image as ImageIcon, ArrowLeft, ExternalLink } from 'lucide-react';
import { useDynamicMetaTags } from '../hooks/useDynamicMetaTags';

// Helper to convert YouTube/Vimeo URLs to embed format
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // If already in embed format, return as is (but clean any extra params)
  if (url.includes('/embed/')) {
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
    return url;
  }
  
  if (url.includes('player.vimeo.com')) {
    return url;
  }
  
  // YouTube: watch?v= format - extract video ID and clean params
  if (url.includes('youtube.com/watch')) {
    const match = url.match(/[?&]v=([^&]+)/);
    if (match && match[1]) {
      const videoId = match[1].split('&')[0].split('#')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // YouTube: youtu.be/ format - extract video ID and clean params
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0]?.split('#')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // YouTube: youtube.com/v/ format
  if (url.includes('youtube.com/v/')) {
    const match = url.match(/youtube\.com\/v\/([^?&]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
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

interface ProjectFromDB {
  id: string;
  author_id: string;
  name: string;
  slogan: string | null;
  description: string;
  images: string[];
  video_url: string | null;
  website: string | null;
  categories: string[];
  technologies: string[];
  phase: string;
  status: 'draft' | 'review' | 'published';
  created_at: string;
  updated_at: string;
}

interface ProjectWithAuthor extends ProjectFromDB {
  author: {
    name: string;
    username: string;
    avatar: string;
  };
}

export const PublicProject: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not-found' | 'pending' | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!slug) {
      setError('not-found');
      setLoading(false);
      return;
    }

    loadProject();
  }, [slug]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todos los proyectos publicados
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error al cargar proyectos:', projectsError);
        setError('not-found');
        setLoading(false);
        return;
      }

      if (!projectsData || projectsData.length === 0) {
        setError('not-found');
        setLoading(false);
        return;
      }

      // Buscar el proyecto que coincida con el slug
      const matchingProject = projectsData.find((p: ProjectFromDB) => {
        const projectSlug = generateSlug(p.name);
        return projectSlug === slug;
      });

      if (!matchingProject) {
        // Verificar si existe un proyecto con ese nombre pero no está publicado
        const allProjects = projectsData as ProjectFromDB[];
        const existsButNotPublished = allProjects.find((p) => {
          const projectSlug = generateSlug(p.name);
          return projectSlug === slug && p.status !== 'published';
        });

        if (existsButNotPublished) {
          setError('pending');
          setLoading(false);
          return;
        }

        setError('not-found');
        setLoading(false);
        return;
      }

      // Verificar que esté publicado
      if (matchingProject.status !== 'published') {
        setError('pending');
        setLoading(false);
        return;
      }

      // Cargar información del autor desde profiles
      const { data: authorProfile, error: authorError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .eq('id', matchingProject.author_id)
        .single();

      if (authorError) {
        console.error('Error al cargar autor:', authorError);
        setError('not-found');
        setLoading(false);
        return;
      }

      // Intentar obtener el avatar de link_bio_profiles si existe (puede estar más actualizado)
      let finalAvatar = authorProfile?.avatar;
      if (authorProfile) {
        const { data: linkBioProfile } = await supabase
          .from('link_bio_profiles')
          .select('avatar')
          .eq('user_id', authorProfile.id)
          .maybeSingle();
        
        // Usar el avatar de link_bio_profiles si existe, sino el de profiles
        if (linkBioProfile?.avatar) {
          finalAvatar = linkBioProfile.avatar;
        }
      }

      const projectWithAuthor: ProjectWithAuthor = {
        ...matchingProject,
        author: {
          name: authorProfile?.name || 'Usuario',
          username: authorProfile?.username || 'usuario',
          avatar: finalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`,
        },
      };

      setProject(projectWithAuthor);
    } catch (err) {
      console.error('Error al cargar proyecto:', err);
      setError('not-found');
    } finally {
      setLoading(false);
    }
  };

  const projectUrl = slug ? `/proyecto/${slug}` : '/proyecto';
  const projectImageUrl =
    project?.images && project.images.length > 0 ? project.images[0] : '/logo.png';
  const baseDescription =
    project?.description ?? 'Explora proyectos innovadores de la comunidad Terreta Hub.';
  const projectDescription = project?.slogan
    ? `${project.slogan}. ${baseDescription.substring(0, 150)}...`
    : baseDescription.substring(0, 200);
  const categories = project?.categories ?? [];
  const technologies = project?.technologies ?? [];

  const structuredData = project
    ? {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': `https://terretahub.com${projectUrl}`,
        name: project.name,
        description: project.description,
        image: projectImageUrl.startsWith('http')
          ? projectImageUrl
          : `https://terretahub.com${projectImageUrl}`,
        datePublished: project.created_at,
        dateModified: project.updated_at,
        author: {
          '@type': 'Person',
          name: project.author.name,
          url: `https://terretahub.com/p/${project.author.username}`,
          image: project.author.avatar,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Terreta Hub',
          logo: {
            '@type': 'ImageObject',
            url: 'https://terretahub.com/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://terretahub.com${projectUrl}`,
        },
        keywords: [...categories, ...technologies].join(', '),
        inLanguage: 'es-ES',
        isAccessibleForFree: true,
        creativeWorkStatus: project.phase,
        category: categories.join(', '),
        ...(project.website
          ? {
              url: normalizeUrl(project.website),
            }
          : {}),
        ...(project.video_url
          ? {
              video: {
                '@type': 'VideoObject',
                embedUrl: getEmbedUrl(project.video_url),
              },
            }
          : {}),
      }
    : undefined;

  useDynamicMetaTags({
    title: project ? `${project.name} | Proyecto en Terreta Hub` : 'Proyecto | Terreta Hub',
    description: projectDescription,
    image: projectImageUrl,
    url: projectUrl,
    type: 'product',
    author: project ? `${project.author.name} (@${project.author.username})` : 'Terreta Hub',
    publishedTime: project?.created_at,
    modifiedTime: project?.updated_at,
    tags: [...categories, ...technologies],
    structuredData,
  });

  const nextImage = () => {
    if (project?.images && project.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project?.images && project.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5E8D8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A65D46] mb-4"></div>
        <p className="text-gray-600">Cargando proyecto...</p>
      </div>
    );
  }

  if (error === 'not-found') {
    return <NotFound404 variant="project-not-found" />;
  }

  if (error === 'pending') {
    return <NotFound404 variant="project-pending" />;
  }

  if (!project) {
    return <NotFound404 variant="project-not-found" />;
  }

  return (
    <div className="min-h-screen bg-[#F5E8D8] relative py-8 px-4">
      {/* Logo Button - Arriba a la izquierda */}
      <div className="fixed top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-lg hover:bg-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <img 
            src="/logo.png" 
            alt="Terreta Hub" 
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-sans text-lg text-terreta-dark font-bold tracking-tight group-hover:text-[#D97706] transition-colors">
            Terreta Hub
          </span>
        </button>
      </div>

      {/* Card Container */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Hero Section - Always show image as cover, never video */}
        {project.images && project.images.length > 0 ? (
          <div className="relative w-full h-56 bg-gray-50 overflow-hidden">
            <img
              src={project.images[currentImageIndex]}
              alt={project.name}
              className="w-full h-full object-cover"
            />
            {project.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                >
                  ←
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                >
                  →
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {project.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative w-full h-56 bg-gradient-to-br from-[#F5F0E6] to-[#EBE5DA] flex items-center justify-center">
            <ImageIcon size={56} className="text-[#D97706]/30" />
          </div>
        )}

        {/* Content - Dentro de la Card */}
        <div className="px-6 py-6">
          {/* Header Info */}
          <div className="mb-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
              <div className="flex-1">
                <h1 className="font-serif text-2xl md:text-3xl text-terreta-dark mb-1.5">{project.name}</h1>
                {project.slogan && (
                  <p className="text-base md:text-lg text-gray-600 italic">{project.slogan}</p>
                )}
              </div>
              <span className="px-3 py-1 bg-[#A65D46] text-white text-xs font-bold rounded-full whitespace-nowrap">
                {project.phase}
              </span>
            </div>

            {/* Author & Date */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-200">
              <div
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/p/${project.author.username}`)}
              >
                <img
                  src={project.author.avatar}
                  alt={project.author.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    // Si falla la carga, usar el fallback de dicebear
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author.username}`;
                  }}
                />
                <div>
                  <p className="font-bold text-sm text-terreta-dark">{project.author.name}</p>
                  <p className="text-xs text-gray-500">@{project.author.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar size={14} />
                <span>
                  {new Date(project.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h2 className="font-serif text-lg md:text-xl text-terreta-dark mb-2.5">Sobre el Proyecto</h2>
            <div className="text-gray-700 text-sm md:text-base">
              {renderMarkdown(project.description)}
            </div>
            
            {/* Video - Show video inside content, not as cover */}
            {project.video_url && (
              <div className="mb-4">
                <h3 className="font-bold text-terreta-dark mb-2 uppercase text-xs tracking-wide">
                  Video
                </h3>
                <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <iframe
                    src={getEmbedUrl(project.video_url)}
                    className="w-full h-full"
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            
            {/* Website Link */}
            {project.website && (
              <div className="mt-4">
                <a
                  href={normalizeUrl(project.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D97706] text-white rounded-lg hover:bg-[#B45309] transition-colors font-bold text-sm shadow-sm"
                >
                  <ExternalLink size={16} />
                  Visitar Sitio Web
                </a>
              </div>
            )}
          </div>

          {/* Categories & Technologies */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            {project.categories.length > 0 && (
              <div>
                <h3 className="font-bold text-terreta-dark mb-2 uppercase text-xs tracking-wide">
                  Categorías
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.technologies.length > 0 && (
              <div>
                <h3 className="font-bold text-terreta-dark mb-2 uppercase text-xs tracking-wide">
                  Tecnologías
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gallery */}
          {project.images && project.images.length > 1 && (
            <div className="mb-5">
              <h3 className="font-bold text-terreta-dark mb-2.5 uppercase text-xs tracking-wide">
                Galería
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {project.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? 'border-[#A65D46] ring-2 ring-[#A65D46]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`${project.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón Volver - Abajo a la izquierda */}
      <div className="fixed bottom-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#A65D46] text-white rounded-lg hover:bg-[#8B4A3A] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-bold text-sm"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>
    </div>
  );
};
