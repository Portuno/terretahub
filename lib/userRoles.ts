import { AuthUser } from '../types';

/**
 * Verifica si un usuario tiene rol de administrador
 */
export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Verifica si un usuario tiene permisos de administrador
 * (alias de isAdmin para claridad semántica)
 */
export const hasAdminPermissions = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

/**
 * Verifica si un usuario puede eliminar un recurso
 * (propio o si es admin)
 */
export const canDelete = (user: AuthUser | null, resourceAuthorId: string): boolean => {
  if (!user) return false;
  return user.id === resourceAuthorId || isAdmin(user);
};

/**
 * Verifica si un usuario puede editar un recurso
 * (propio o si es admin)
 */
export const canEdit = (user: AuthUser | null, resourceAuthorId: string): boolean => {
  if (!user) return false;
  return user.id === resourceAuthorId || isAdmin(user);
};

/**
 * Verifica si un usuario tiene autorización para escribir blogs
 */
export const isBlogAuthorized = (user: AuthUser | null): boolean => {
  if (!user) return false;
  // El campo blog_authorized debe estar en el perfil del usuario
  // Se verifica desde la base de datos, no desde el objeto AuthUser
  // Por ahora retornamos false, se debe verificar desde la BD
  return false; // Se actualizará cuando se cargue el perfil completo
};

/**
 * Verifica si un usuario puede editar un blog
 * (propio o si es admin)
 */
export const canEditBlog = (user: AuthUser | null, blogAuthorId: string): boolean => {
  if (!user) return false;
  return user.id === blogAuthorId || isAdmin(user);
};

/**
 * Verifica si un usuario puede eliminar un blog
 * (propio o si es admin)
 */
export const canDeleteBlog = (user: AuthUser | null, blogAuthorId: string): boolean => {
  if (!user) return false;
  return user.id === blogAuthorId || isAdmin(user);
};
