import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, FolderKanban, Calendar, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProjectStatus } from '../types';
import { ProjectModal } from './ProjectModal';

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

interface ProjectsGalleryProps {
  onViewProfile?: (handle: string) => void;
  onCreateProject?: () => void;
  user?: { id: string } | null;
}

export const ProjectsGallery: React.FC<ProjectsGalleryProps> = ({ onViewProfile, onCreateProject, user }) => {
  const [projects, setProjects] = useState<ProjectWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithAuthor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // Cargar proyectos publicados
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
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

          return {
            ...project,
            author: {
              name: authorProfile?.name || 'Usuario',
              username: authorProfile?.username || 'usuario',
              avatar: finalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`
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

  // Obtener todas las categorías y tecnologías únicas
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach(project => {
      project.categories.forEach(cat => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [projects]);

  const allTechnologies = useMemo(() => {
    const techs = new Set<string>();
    projects.forEach(project => {
      project.technologies.forEach(tech => techs.add(tech));
    });
    return Array.from(techs).sort();
  }, [projects]);

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Búsqueda por texto
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchLower) ||
        (project.slogan && project.slogan.toLowerCase().includes(searchLower)) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchLower)) ||
        project.author.name.toLowerCase().includes(searchLower) ||
        project.author.username.toLowerCase().includes(searchLower);

      // Filtro por categorías
      const matchesCategories = selectedCategories.length === 0 ||
        selectedCategories.some(cat => project.categories.includes(cat));

      // Filtro por tecnologías
      const matchesTechnologies = selectedTechnologies.length === 0 ||
        selectedTechnologies.some(tech => project.technologies.includes(tech));

      // Filtro por fase
      const matchesPhase = !selectedPhase || project.phase === selectedPhase;

      return matchesSearch && matchesCategories && matchesTechnologies && matchesPhase;
    });
  }, [projects, searchQuery, selectedCategories, selectedTechnologies, selectedPhase]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleTechnologyToggle = (technology: string) => {
    setSelectedTechnologies(prev =>
      prev.includes(technology)
        ? prev.filter(t => t !== technology)
        : [...prev, technology]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedTechnologies([]);
    setSelectedPhase(null);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || selectedTechnologies.length > 0 || selectedPhase;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4"></div>
        <p className="text-terreta-secondary">Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 lg:px-4 py-4 animate-fade-in">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h3 className="font-serif text-3xl text-terreta-dark mb-2">Galería de Innovación</h3>
            <p className="text-terreta-secondary">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'proyecto encontrado' : 'proyectos encontrados'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-terreta-card border border-terreta-border rounded-lg hover:bg-terreta-bg transition-colors text-terreta-dark"
            >
              <Filter size={18} />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-terreta-accent text-white text-xs rounded-full flex items-center justify-center">
                  {[searchQuery ? 1 : 0, selectedCategories.length, selectedTechnologies.length, selectedPhase ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
            {onCreateProject && (
              <button
                onClick={onCreateProject}
                className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:brightness-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus size={20} /> <span className="hidden sm:inline">Subir Proyecto</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-terreta-secondary/50 group-focus-within:text-terreta-accent transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar proyectos por nombre, descripción, categorías, tecnologías o autor..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-terreta-border focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent outline-none transition-all bg-terreta-card shadow-sm hover:shadow-md text-terreta-dark font-sans placeholder-terreta-secondary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-terreta-secondary hover:text-terreta-dark"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-terreta-card border border-terreta-border rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-terreta-dark">Filtros</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-terreta-accent hover:text-terreta-accent/80 font-bold"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Fase */}
              <div>
                <label className="block text-sm font-bold text-terreta-dark mb-2 uppercase tracking-wide">
                  Fase del Proyecto
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Idea', 'MVP', 'Mercado Temprano', 'Escalado'].map(phase => (
                    <button
                      key={phase}
                      onClick={() => setSelectedPhase(selectedPhase === phase ? null : phase)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        selectedPhase === phase
                          ? 'bg-terreta-accent text-white'
                          : 'bg-terreta-bg text-terreta-secondary hover:bg-terreta-border'
                      }`}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorías */}
              {allCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-terreta-dark mb-2 uppercase tracking-wide">
                    Categorías
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedCategories.includes(category)
                            ? 'bg-terreta-accent text-white'
                            : 'bg-terreta-bg text-terreta-secondary hover:bg-terreta-border'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tecnologías */}
              {allTechnologies.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-terreta-dark mb-2 uppercase tracking-wide">
                    Tecnologías
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTechnologies.map(technology => (
                      <button
                        key={technology}
                        onClick={() => handleTechnologyToggle(technology)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedTechnologies.includes(technology)
                            ? 'bg-terreta-accent/80 text-white'
                            : 'bg-terreta-bg text-terreta-secondary hover:bg-terreta-border'
                        }`}
                      >
                        {technology}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-terreta-bg rounded-full flex items-center justify-center mb-6">
              <FolderKanban size={40} className="text-terreta-accent" />
            </div>
            <h4 className="font-serif text-2xl text-terreta-dark mb-2">
              {projects.length === 0 ? 'Aún no hay proyectos públicos' : 'No se encontraron proyectos'}
            </h4>
            <p className="max-w-md text-terreta-secondary mb-4">
              {projects.length === 0
                ? 'Sé el primero en compartir tu idea con la comunidad. Los proyectos aprobados aparecerán aquí.'
                : 'Intenta ajustar tus filtros de búsqueda para encontrar más proyectos.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-terreta-accent hover:text-terreta-accent/80 font-bold"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-terreta-card border border-terreta-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  setSelectedProject(project);
                  setIsModalOpen(true);
                }}
              >
                {/* Imagen principal */}
                {project.images && project.images.length > 0 ? (
                  <div className="relative h-48 bg-terreta-bg overflow-hidden">
                    <img
                      src={project.images[0]}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-terreta-card/90 backdrop-blur-sm text-terreta-accent text-xs font-bold rounded-full">
                        {project.phase}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-terreta-bg to-terreta-sidebar flex items-center justify-center">
                    <FolderKanban size={48} className="text-terreta-accent/50" />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-terreta-card/90 backdrop-blur-sm text-terreta-accent text-xs font-bold rounded-full">
                        {project.phase}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contenido */}
                <div className="p-6">
                  <h3 className="font-serif text-xl text-terreta-dark mb-2 line-clamp-1">
                    {project.name}
                  </h3>
                  {project.slogan && (
                    <p className="text-sm text-terreta-secondary italic mb-4 line-clamp-1">
                      {project.slogan}
                    </p>
                  )}

                  {/* Categorías */}
                  {project.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.categories.slice(0, 3).map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-terreta-bg text-terreta-secondary text-xs rounded-full border border-terreta-border/50"
                        >
                          {cat}
                        </span>
                      ))}
                      {project.categories.length > 3 && (
                        <span className="px-2 py-1 bg-terreta-bg text-terreta-secondary text-xs rounded-full border border-terreta-border/50">
                          +{project.categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tecnologías */}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.slice(0, 3).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-terreta-accent/10 text-terreta-accent text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-terreta-accent/10 text-terreta-accent text-xs rounded-full">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Autor y fecha */}
                  <div className="flex items-center justify-between pt-4 border-t border-terreta-border">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onViewProfile && onViewProfile(project.author.username)}
                    >
                      <img
                        src={project.author.avatar}
                        alt={project.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-xs font-bold text-terreta-dark">{project.author.name}</p>
                        <p className="text-xs text-terreta-secondary">@{project.author.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-terreta-secondary/70">
                      <Calendar size={14} />
                      <span>{new Date(project.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
        onViewProfile={onViewProfile}
      />
    </div>
  );
};
