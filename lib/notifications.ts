import { supabase } from './supabase';

export const notifyProjectReview = async (input: {
  userId: string;
  projectId: string;
  projectName: string;
  approved: boolean;
}): Promise<void> => {
  const name = input.projectName.trim() || 'tu proyecto';
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    type: input.approved ? 'project_approved' : 'project_rejected',
    title: input.approved ? 'Proyecto aprobado' : 'Proyecto no publicado',
    message: input.approved
      ? `“${name}” ya está visible en la comunidad.`
      : `“${name}” volvió a borrador. Podés editarlo y enviarlo otra vez.`,
    related_id: input.projectId,
    related_type: 'project',
  });

  if (error) {
    console.error('[notifications] No se pudo crear la notificación de revisión:', error);
  }
};
