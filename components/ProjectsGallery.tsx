import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, FolderKanban, Calendar, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry, executeBatchedQuery } from '../lib/supabaseHelpers';
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
      
      // Optimized: Use database function that does JOIN in a single query
      // This eliminates multiple round trips and reduces payload size significantly
      // Using pagination to limit initial load (20 projects for faster initial load)
      const { data: projectsData, error: projectsError } = await executeQueryWithRetry(
        async () => await supabase.rpc('get_projects_with_authors', { 
          limit_count: 20,  // Reduced from 100 to 20 for faster initial load
          offset_count: 0 
        }),
        'load projects with authors'
      );

      if (projectsError) {
        console.error('[ProjectsGallery] Error al cargar proyectos:', projectsError);
        // Fallback to old method if function doesn't exist yet
        console.log('[ProjectsGallery] Falling back to old query method');
        await loadProjectsFallback();
        return;
      }

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // Transform the data to match the expected interface
      const projectsWithAuthors: ProjectWithAuthor[] = projectsData.map((p: any) => {
        // Asegurar que images sea siempre un array válido
        let imagesArray: string[] = [];
        if (Array.isArray(p.images)) {
          imagesArray = p.images.filter((img: any) => img != null && img !== '');
        } else if (p.images) {
          // Si no es array pero existe, intentar convertirlo
          try {
            if (typeof p.images === 'string') {
              const parsed = JSON.parse(p.images);
              imagesArray = Array.isArray(parsed) ? parsed : [];
            }
          } catch {
            imagesArray = [];
          }
        }
        
        return {
          id: p.id,
          author_id: p.author_id,
          name: p.name,
          slogan: p.slogan,
          description: p.description,
          images: imagesArray,
          video_url: p.video_url,
          website: p.website,
          categories: p.categories || [],
          technologies: p.technologies || [],
          phase: p.phase,
          status: p.status as ProjectStatus,
          created_at: p.created_at,
          updated_at: p.updated_at,
          author: {
            name: p.author_name || 'Usuario',
            username: p.author_username || 'usuario',
            avatar: p.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.author_username || 'user'}`
          }
        };
      });

      setProjects(projectsWithAuthors);
    } catch (err) {
      console.error('[ProjectsGallery] Error al cargar proyectos:', err);
      // Fallback to old method on error
      await loadProjectsFallback();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method using the old approach (in case the function doesn't exist)
  const loadProjectsFallback = async () => {
    try {
      // Cargar proyectos publicados con retry - solo campos necesarios
      const { data: projectsData, error: projectsError } = await executeQueryWithRetry(
        async () => await supabase
          .from('projects')
          .select('id, author_id, name, slogan, description, images, video_url, website, categories, technologies, phase, status, created_at, updated_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        'load projects (fallback)'
      );

      if (projectsError) {
        console.error('[ProjectsGallery] Error al cargar proyectos (fallback):', projectsError);
        setProjects([]);
        return;
      }

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // Obtener IDs únicos de autores
      const authorIds = [...new Set(projectsData.map((p: ProjectFromDB) => p.author_id))];
      
      // Optimized: Load profiles and link_bio_profiles in parallel with batching for large ID lists
      // Batching prevents timeouts when there are many author IDs
      const [profilesResult, linkBioResult] = await Promise.all([
        executeBatchedQuery(
          authorIds,
          async (batchIds) => {
            const result = await supabase
              .from('profiles')
              .select('id, name, username, avatar')
              .in('id', batchIds);
            return { data: result.data || [], error: result.error };
          },
          'load author profiles',
          50 // Batch size of 50 IDs per query
        ),
        executeBatchedQuery(
          authorIds,
          async (batchIds) => {
            const result = await supabase
              .from('link_bio_profiles')
              .select('user_id, avatar')
              .in('user_id', batchIds);
            return { data: result.data || [], error: result.error };
          },
          'load link bio avatars',
          50 // Batch size of 50 IDs per query
        )
      ]);

      const allProfiles = profilesResult.data;
      const linkBioProfiles = linkBioResult.data;

      // Crear mapas para acceso rápido
      const profilesMap = new Map<string, any>();
      (allProfiles || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const avatarsMap = new Map<string, string>();
      (linkBioProfiles || []).forEach(lbp => {
        if (lbp.avatar) {
          avatarsMap.set(lbp.user_id, lbp.avatar);
        }
      });

      // Combinar proyectos con información de autores
      const projectsWithAuthors = projectsData.map((project: ProjectFromDB) => {
        const authorProfile = profilesMap.get(project.author_id);
        const finalAvatar = avatarsMap.get(project.author_id) || authorProfile?.avatar;

        // Asegurar que images sea siempre un array válido
        let imagesArray: string[] = [];
        if (Array.isArray(project.images)) {
          imagesArray = project.images.filter((img: any) => img != null && img !== '');
        } else if (project.images) {
          try {
            if (typeof project.images === 'string') {
              const parsed = JSON.parse(project.images);
              imagesArray = Array.isArray(parsed) ? parsed : [];
            }
          } catch {
            imagesArray = [];
          }
        }

        return {
          ...project,
          images: imagesArray,
          author: {
            name: authorProfile?.name || 'Usuario',
            username: authorProfile?.username || 'usuario',
            avatar: finalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorProfile?.username || 'user'}`
          }
        };
      });

      setProjects(projectsWithAuthors);
    } catch (err) {
      console.error('[ProjectsGallery] Error en fallback:', err);
      setProjects([]);
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
                  {['Idea', 'MVP', 'Mercado Temprano', 'Escalado'].map(phase => {
                    const phaseClassName = selectedPhase === phase
                      ? 'px-4 py-2 rounded-full text-sm font-bold transition-all bg-terreta-accent text-white'
                      : 'px-4 py-2 rounded-full text-sm font-bold transition-all bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';
                    return (
                      <button
                        key={phase}
                        onClick={() => setSelectedPhase(selectedPhase === phase ? null : phase)}
                        className={phaseClassName}
                      >
                        {phase}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categorías */}
              {allCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-terreta-dark mb-2 uppercase tracking-wide">
                    Categorías
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(category => {
                      const categoryClassName = selectedCategories.includes(category)
                        ? 'px-3 py-1 rounded-full text-sm transition-all bg-terreta-accent text-white'
                        : 'px-3 py-1 rounded-full text-sm transition-all bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';
                      return (
                        <button
                          key={category}
                          onClick={() => handleCategoryToggle(category)}
                          className={categoryClassName}
                        >
                          {category}
                        </button>
                      );
                    })}
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
                    {allTechnologies.map(technology => {
                      const technologyClassName = selectedTechnologies.includes(technology)
                        ? 'px-3 py-1 rounded-full text-sm transition-all bg-terreta-accent/80 text-white'
                        : 'px-3 py-1 rounded-full text-sm transition-all bg-terreta-bg text-terreta-secondary hover:bg-terreta-border';
                      return (
                        <button
                          key={technology}
                          onClick={() => handleTechnologyToggle(technology)}
                          className={technologyClassName}
                        >
                          {technology}
                        </button>
                      );
                    })}
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
