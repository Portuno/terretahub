import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsGallery } from './ProjectsGallery';
import { ProjectEditor } from './ProjectEditor';
import { AuthUser, Project } from '../types';
import { supabase } from '../lib/supabase';
import { Toast } from './Toast';
import { useProfileNavigation } from '../hooks/useProfileNavigation';

interface ProjectsPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ user, onOpenAuth }) => {
  const navigateToProfile = useProfileNavigation();
  // Simple internal state for now - could be routed /proyectos/nuevo later
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleViewProfile = (handle: string) => {
    navigateToProfile(handle);
  };

  const handleProjectSave = async (project: Project) => {
    if (!user) return;

    try {
      const projectData = {
        author_id: user.id,
        name: project.name,
        slogan: project.slogan || null,
        description: project.description,
        images: project.images || [],
        video_url: project.videoUrl || null,
        website: project.website || null,
        categories: project.categories || [],
        technologies: project.technologies || [],
        phase: project.phase,
        status: project.status
      };

      const { error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error('[ProjectsPage] Error saving project:', error);
        alert('Error al guardar el proyecto: ' + (error.message || 'Error desconocido'));
        return;
      }
      
      if (project.status !== 'draft') {
        setShowToast(true);
      } else {
        alert('Proyecto guardado como borrador exitosamente');
      }
      
      setIsCreating(false);
    } catch (err: any) {
      console.error('[ProjectsPage] Exception saving project:', err);
      alert('Error al guardar el proyecto: ' + (err.message || 'Error desconocido'));
    }
  };

  if (isCreating && user) {
    return (
      <ProjectEditor 
        user={user} 
        onCancel={() => setIsCreating(false)} 
        onSave={handleProjectSave} 
      />
    );
  }

  return (
    <>
      <ProjectsGallery 
        onViewProfile={handleViewProfile}
        onCreateProject={user ? () => setIsCreating(true) : onOpenAuth}
        user={user}
      />
      {showToast && (
        <Toast
          message="¡Proyecto enviado!"
          secondaryMessage="Tu proyecto fue enviado y será revisado. Espera una respuesta pronto de parte de la administración."
          onClose={() => setShowToast(false)}
          duration={6000}
          variant="terreta"
        />
      )}
    </>
  );
};

