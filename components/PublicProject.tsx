import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateSlug } from '../lib/utils';
import { NotFound404 } from './NotFound404';
import { Calendar, User, Video, Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface ProjectFromDB {
  id: string;
  author_id: string;
  name: string;
  slogan: string | null;
  description: string;
  images: string[];
  video_url: string | null;
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

      // Cargar información del autor
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

      const projectWithAuthor: ProjectWithAuthor = {
        ...matchingProject,
        author: {
          name: authorProfile?.name || 'Usuario',
          username: authorProfile?.username || 'usuario',
          avatar: authorProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`,
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
    <div className="min-h-screen bg-[#F5E8D8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-[#A65D46] hover:text-[#8B4A3A] transition-colors font-bold"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <a
            href="/app"
            className="font-serif text-xl text-terreta-dark font-bold"
          >
            Terreta Hub
          </a>
        </div>
      </div>

      {/* Hero Section */}
      {project.video_url ? (
        <div className="relative w-full h-96 bg-gray-900">
          <iframe
            src={project.video_url}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : project.images && project.images.length > 0 ? (
        <div className="relative w-full h-96 bg-gray-100 overflow-hidden">
          <img
            src={project.images[currentImageIndex]}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          {project.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-3 rounded-full hover:bg-white transition-colors shadow-lg"
              >
                ←
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-terreta-dark p-3 rounded-full hover:bg-white transition-colors shadow-lg"
              >
                →
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
        <div className="relative w-full h-96 bg-gradient-to-br from-[#F5F0E6] to-[#EBE5DA] flex items-center justify-center">
          <ImageIcon size={96} className="text-[#D97706]/30" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Info */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="font-serif text-4xl text-terreta-dark mb-3">{project.name}</h1>
              {project.slogan && (
                <p className="text-xl text-gray-600 italic mb-4">{project.slogan}</p>
              )}
            </div>
            <span className="px-5 py-2 bg-[#A65D46] text-white text-sm font-bold rounded-full whitespace-nowrap">
              {project.phase}
            </span>
          </div>

          {/* Author & Date */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-300">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/p/${project.author.username}`)}
            >
              <img
                src={project.author.avatar}
                alt={project.author.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-bold text-terreta-dark">{project.author.name}</p>
                <p className="text-sm text-gray-500">@{project.author.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={18} />
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
        <div className="mb-8">
          <h2 className="font-serif text-2xl text-terreta-dark mb-4">Sobre el Proyecto</h2>
          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{project.description}</p>
        </div>

        {/* Categories & Technologies */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {project.categories.length > 0 && (
            <div>
              <h3 className="font-bold text-terreta-dark mb-3 uppercase text-sm tracking-wide">
                Categorías
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.technologies.length > 0 && (
            <div>
              <h3 className="font-bold text-terreta-dark mb-3 uppercase text-sm tracking-wide">
                Tecnologías
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full"
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
          <div className="mb-8">
            <h3 className="font-bold text-terreta-dark mb-4 uppercase text-sm tracking-wide">
              Galería
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
  );
};
