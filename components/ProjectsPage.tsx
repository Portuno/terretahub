import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsGallery } from './ProjectsGallery';
import { ProjectEditor } from './ProjectEditor';
import { AuthUser, Project } from '../types';
import { Toast } from './Toast';
import { useProfileNavigation } from '../hooks/useProfileNavigation';
import { persistProject } from '../lib/projectPersistence';
import { generateSlug } from '../lib/utils';

interface ProjectsPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ user, onOpenAuth }) => {
  const navigate = useNavigate();
  const navigateToProfile = useProfileNavigation();
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('¡Proyecto enviado!');
  const [toastSecondary, setToastSecondary] = useState(
    'Tu proyecto fue enviado y será revisado. Espera una respuesta pronto de parte de la administración.'
  );

  const handleViewProfile = (handle: string) => {
    navigateToProfile(handle);
  };

  const handleProjectSave = async (project: Project) => {
    if (!user) return;

    const result = await persistProject(user.id, project);
    if (result.error) {
      alert('Error al guardar el proyecto: ' + result.error);
      return;
    }

    if (project.status === 'draft') {
      setToastMessage('Proyecto guardado como borrador');
      setToastSecondary('Podés seguir editándolo desde tu proyecto cuando quieras.');
    } else {
      setToastMessage('¡Proyecto enviado!');
      setToastSecondary(
        'Tu proyecto fue enviado y será revisado. Espera una respuesta pronto de parte de la administración.'
      );
    }
    setShowToast(true);
    setIsCreating(false);

    if (project.name.trim()) {
      navigate(`/proyecto/${generateSlug(project.name)}`);
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
          message={toastMessage}
          secondaryMessage={toastSecondary}
          onClose={() => setShowToast(false)}
          duration={6000}
          variant="terreta"
        />
      )}
    </>
  );
};
