import { Project, ProjectPhase, ProjectStatus } from '../types';
import { supabase } from './supabase';
import { firstErrorMessage, validateProject } from './contentValidation';

export const mapDbProjectToProject = (row: {
  id: string;
  author_id: string;
  name: string;
  slogan: string | null;
  description: string;
  images: string[] | null;
  video_url?: string | null;
  website?: string | null;
  categories?: string[] | null;
  technologies?: string[] | null;
  phase: string;
  status: ProjectStatus;
  created_at: string;
}): Project => ({
  id: row.id,
  authorId: row.author_id,
  name: row.name || '',
  slogan: row.slogan || '',
  description: row.description || '',
  images: row.images || [],
  videoUrl: row.video_url || '',
  website: row.website || undefined,
  categories: row.categories || [],
  technologies: row.technologies || [],
  phase: row.phase as ProjectPhase,
  status: row.status,
  createdAt: row.created_at
});

export interface PersistProjectResult {
  error: string | null;
  projectId?: string;
}

const toRow = (userId: string, project: Project) => ({
  author_id: userId,
  name: project.name.trim(),
  slogan: project.slogan.trim() || null,
  description: project.description.trim(),
  images: (project.images || []).filter((img) => img && img.trim()),
  video_url: project.videoUrl?.trim() || null,
  website: project.website?.trim() || null,
  categories: project.categories || [],
  technologies: project.technologies || [],
  phase: project.phase,
  status: project.status,
  archived_at: null as string | null,
});

const withoutArchivedAt = <T extends { archived_at?: string | null }>(row: T) => {
  const next = { ...row };
  delete next.archived_at;
  return next;
};

const isMissingArchivedAtColumn = (message?: string): boolean =>
  Boolean(message && /archived_at/i.test(message));

const looksLikePersistedId = (id?: string): boolean =>
  Boolean(id && id !== 'draft' && !/^\d+$/.test(id));

export const persistProject = async (
  userId: string,
  project: Project
): Promise<PersistProjectResult> => {
  const fieldErrors = validateProject({
    name: project.name,
    slogan: project.slogan,
    description: project.description,
    images: project.images,
    status: project.status
  });

  if (Object.keys(fieldErrors).length > 0) {
    return { error: firstErrorMessage(fieldErrors) };
  }

  const row = toRow(userId, project);
  const isUpdate = looksLikePersistedId(project.id);

  if (isUpdate) {
    const updateRow = { ...row };
    delete (updateRow as { author_id?: string }).author_id;
    let { error } = await supabase
      .from('projects')
      .update(updateRow)
      .eq('id', project.id)
      .eq('author_id', userId);

    if (error && isMissingArchivedAtColumn(error.message)) {
      const retry = await supabase
        .from('projects')
        .update(withoutArchivedAt(updateRow))
        .eq('id', project.id)
        .eq('author_id', userId);
      error = retry.error;
    }

    if (error) {
      return { error: error.message || 'No se pudo guardar el proyecto.' };
    }

    return { error: null, projectId: project.id };
  }

  let insert = await supabase.from('projects').insert(row).select('id').single();

  if (insert.error && isMissingArchivedAtColumn(insert.error.message)) {
    insert = await supabase.from('projects').insert(withoutArchivedAt(row)).select('id').single();
  }

  if (insert.error) {
    return { error: insert.error.message || 'No se pudo guardar el proyecto.' };
  }

  return { error: null, projectId: insert.data?.id };
};

export const deleteOwnProject = async (userId: string, projectId: string): Promise<string | null> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('author_id', userId);

  return error ? error.message || 'No se pudo eliminar el proyecto.' : null;
};

export const withdrawProjectFromReview = async (
  userId: string,
  projectId: string
): Promise<string | null> => {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('author_id', userId)
    .eq('status', 'review');

  return error ? error.message || 'No se pudo retirar el proyecto de revisión.' : null;
};
