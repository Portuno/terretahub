import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, FolderKanban, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthUser, Project, ProjectStatus } from '../types';
import { supabase } from '../lib/supabase';

interface AdminProjectsPanelProps {
  user: AuthUser;
}

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
  status: ProjectStatus;
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

export const AdminProjectsPanel: React.FC<AdminProjectsPanelProps> = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithAuthor | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // Cargar proyectos en estado 'review'
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'review')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error al cargar proyectos:', projectsError);
        return;
      }

      if (!projectsData) {
        setProjects([]);
        return;
      }

      // Cargar información de los autores
      const projectsWithAuthors = await Promise.all(
        projectsData.map(async (project: ProjectFromDB) => {
          const { data: authorProfile, error: authorError } = await supabase
            .from('profiles')
            .select('id, name, username, avatar')
            .eq('id', project.author_id)
            .single();

          if (authorError) {
            console.error('Error al cargar autor:', authorError);
          }

          return {
            ...project,
            author: {
              name: authorProfile?.name || 'Usuario',
              username: authorProfile?.username || 'usuario',
              avatar: authorProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`
            }
          };
        })
      );

      setProjects(projectsWithAuthors);
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (projectId: string) => {
    if (!confirm('¿Aprobar este proyecto? Se publicará en la galería.')) {
      return;
    }

    await updateProjectStatus(projectId, 'published');
  };

  const handleReject = async (projectId: string) => {
    if (!confirm('¿Rechazar este proyecto? Volverá a estado borrador.')) {
      return;
    }

    await updateProjectStatus(projectId, 'draft');
  };

  const updateProjectStatus = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      setProcessing(projectId);

      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) {
        console.error('Error al actualizar proyecto:', error);
        alert('Error al actualizar el proyecto. Intenta nuevamente.');
        return;
      }

      // Recargar proyectos
      await loadProjects();
      setSelectedProject(null);
    } catch (err) {
      console.error('Error al actualizar proyecto:', err);
      alert('Error al actualizar el proyecto. Intenta nuevamente.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97706] mb-4"></div>
        <p className="text-gray-500">Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-terreta-accent flex items-center justify-center">
            <FolderKanban className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-3xl text-terreta-dark">Panel de Administración</h2>
            <p className="text-sm text-terreta-dark/60">Gestiona proyectos pendientes de revisión</p>
          </div>
          <button
            onClick={() => navigate('/admin/eventos')}
            className="flex items-center gap-2 px-4 py-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark rounded-full font-semibold transition-all border border-terreta-border"
          >
            <CalendarDays size={18} />
            Eventos
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-terreta-dark/60">
          <Clock size={16} />
          <span className="font-bold text-terreta-accent">{projects.length}</span>
          <span>proyecto{projects.length !== 1 ? 's' : ''} pendiente{projects.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-terreta-bg rounded-full flex items-center justify-center mb-6">
            <Check className="text-terreta-accent" size={40} />
          </div>
          <h3 className="font-serif text-2xl text-terreta-dark mb-2">No hay proyectos pendientes</h3>
          <p className="max-w-md text-terreta-secondary">Todos los proyectos han sido revisados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de proyectos */}
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`bg-terreta-card border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedProject?.id === project.id
                    ? 'border-terreta-accent shadow-lg'
                    : 'border-terreta-border hover:border-terreta-secondary/30 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl text-terreta-dark mb-1">{project.name}</h3>
                    {project.slogan && (
                      <p className="text-sm text-terreta-secondary italic mb-2">{project.slogan}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase rounded-full">
                    Review
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={project.author.avatar}
                    alt={project.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-bold text-terreta-dark">{project.author.name}</p>
                    <p className="text-xs text-terreta-secondary">@{project.author.username}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {project.categories.slice(0, 3).map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-terreta-bg text-terreta-dark text-xs rounded-full border border-terreta-border"
                    >
                      {cat}
                    </span>
                  ))}
                  {project.categories.length > 3 && (
                    <span className="px-2 py-1 bg-terreta-bg text-terreta-dark text-xs rounded-full border border-terreta-border">
                      +{project.categories.length - 3}
                    </span>
                  )}
                </div>

                <p className="text-sm text-terreta-secondary line-clamp-2">{project.description}</p>
              </div>
            ))}
          </div>

          {/* Detalles del proyecto seleccionado */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            {selectedProject ? (
              <div className="bg-terreta-card border border-terreta-border rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-serif text-2xl text-terreta-dark mb-2">
                      {selectedProject.name}
                    </h3>
                    {selectedProject.slogan && (
                      <p className="text-terreta-secondary italic mb-4">{selectedProject.slogan}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-terreta-secondary hover:text-terreta-dark"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Autor */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-terreta-border">
                  <img
                    src={selectedProject.author.avatar}
                    alt={selectedProject.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-bold text-terreta-dark">{selectedProject.author.name}</p>
                    <p className="text-sm text-terreta-secondary">@{selectedProject.author.username}</p>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mb-6">
                  <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                    Descripción
                  </h4>
                  <p className="text-terreta-dark/90 leading-relaxed">{selectedProject.description}</p>
                </div>

                {/* Imágenes */}
                {selectedProject.images && selectedProject.images.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                      Imágenes
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProject.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedProject.name} ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {selectedProject.video_url && (
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                      Video
                    </h4>
                    <div className="aspect-video rounded-lg overflow-hidden bg-terreta-bg">
                      <iframe
                        src={selectedProject.video_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Categorías y Tecnologías */}
                <div className="mb-6 space-y-4">
                  {selectedProject.categories.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                        Categorías
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-terreta-bg text-terreta-dark text-sm rounded-full border border-terreta-border"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProject.technologies.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                        Tecnologías
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fase */}
                <div className="mb-6">
                  <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                    Fase
                  </h4>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-bold">
                    {selectedProject.phase}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-6 border-t border-terreta-border">
                  <button
                    onClick={() => handleApprove(selectedProject.id)}
                    disabled={processing === selectedProject.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={18} />
                    <span>Aprobar</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedProject.id)}
                    disabled={processing === selectedProject.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={18} />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-terreta-card border border-terreta-border rounded-xl p-12 text-center">
                <Eye className="text-terreta-secondary mx-auto mb-4" size={48} />
                <p className="text-terreta-secondary">Selecciona un proyecto para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

