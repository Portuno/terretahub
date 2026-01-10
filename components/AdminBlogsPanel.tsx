import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, FileText, User } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { executeQueryWithRetry } from '../lib/supabaseHelpers';

interface AdminBlogsPanelProps {
  user: AuthUser;
}

interface AuthorizationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    email: string;
  };
}

interface BlogFromDB {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
}

export const AdminBlogsPanel: React.FC<AdminBlogsPanelProps> = ({ user }) => {
  const [requests, setRequests] = useState<AuthorizationRequest[]>([]);
  const [blogs, setBlogs] = useState<BlogFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'blogs'>('requests');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        await loadRequests();
      } else {
        await loadBlogs();
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      // Primero cargar las solicitudes
      const { data: requestsData, error: requestsError } = await executeQueryWithRetry(
        async () => await supabase
          .from('blog_authorization_requests')
          .select('id, user_id, status, created_at, updated_at')
          .order('created_at', { ascending: false }),
        'load blog authorization requests'
      );

      if (requestsError) {
        console.error('Error loading requests:', requestsError);
        setRequests([]);
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Luego cargar los perfiles de los usuarios
      const userIds = requestsData.map((req: any) => req.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setRequests([]);
        return;
      }

      // Crear un mapa de perfiles por ID
      const profilesMap = new Map();
      (profilesData || []).forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });

      // Combinar solicitudes con perfiles
      const transformedRequests: AuthorizationRequest[] = requestsData.map((req: any) => {
        const profile = profilesMap.get(req.user_id);
        return {
          id: req.id,
          user_id: req.user_id,
          status: req.status,
          created_at: req.created_at,
          updated_at: req.updated_at,
          user: {
            id: profile?.id || req.user_id,
            name: profile?.name || 'Usuario',
            username: profile?.username || 'usuario',
            avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`,
            email: profile?.email || ''
          }
        };
      });

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error loading requests:', err);
      setRequests([]);
    }
  };

  const loadBlogs = async () => {
    try {
      const { data: blogsData, error: blogsError } = await executeQueryWithRetry(
        async () => await supabase
          .from('blogs')
          .select(`
            id,
            author_id,
            title,
            slug,
            status,
            created_at,
            author:profiles!blogs_author_id_fkey (
              name,
              username,
              avatar
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        'load blogs'
      );

      if (blogsError) {
        console.error('Error loading blogs:', blogsError);
        setBlogs([]);
        return;
      }

      const transformedBlogs: BlogFromDB[] = (blogsData || []).map((blog: any) => ({
        id: blog.id,
        author_id: blog.author_id,
        title: blog.title,
        slug: blog.slug,
        status: blog.status,
        created_at: blog.created_at,
        author: {
          name: blog.author?.name || 'Usuario',
          username: blog.author?.username || 'usuario',
          avatar: blog.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.username || 'user'}`
        }
      }));

      setBlogs(transformedBlogs);
    } catch (err) {
      console.error('Error loading blogs:', err);
      setBlogs([]);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    try {
      // Actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from('blog_authorization_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Dar permiso al usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ blog_authorized: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Recargar solicitudes
      await loadRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Error al aprobar la solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('blog_authorization_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      await loadRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Error al rechazar la solicitud');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este blog?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;

      await loadBlogs();
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Error al eliminar el blog');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            <Clock size={12} />
            Pendiente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <Check size={12} />
            Aprobada
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <X size={12} />
            Rechazada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-terreta-dark mb-2">
          Panel de Administración - Blogs
        </h1>
        <p className="text-terreta-secondary">
          Gestiona solicitudes de autorización y blogs de la plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-terreta-border">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-terreta-accent text-terreta-accent'
              : 'border-transparent text-terreta-secondary hover:text-terreta-dark'
          }`}
        >
          Solicitudes ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === 'blogs'
              ? 'border-terreta-accent text-terreta-accent'
              : 'border-transparent text-terreta-secondary hover:text-terreta-dark'
          }`}
        >
          Blogs ({blogs.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4"></div>
          <p className="text-terreta-secondary">Cargando...</p>
        </div>
      ) : activeTab === 'requests' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-terreta-secondary">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay solicitudes de autorización</p>
            </div>
          ) : (
            requests.map(request => (
              <div
                key={request.id}
                className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={request.user.avatar}
                      alt={request.user.name}
                      className="w-12 h-12 rounded-full border border-terreta-border"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-terreta-dark">{request.user.name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-terreta-secondary mb-1">
                        @{request.user.username}
                      </p>
                      <p className="text-sm text-terreta-secondary mb-2">
                        {request.user.email}
                      </p>
                      <p className="text-xs text-terreta-secondary">
                        Solicitud enviada el {new Date(request.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id, request.user_id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Check size={18} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <X size={18} />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.length === 0 ? (
            <div className="text-center py-12 text-terreta-secondary">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay blogs en la plataforma</p>
            </div>
          ) : (
            blogs.map(blog => (
              <div
                key={blog.id}
                className="bg-terreta-card rounded-xl shadow-sm border border-terreta-border p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={blog.author.avatar}
                      alt={blog.author.name}
                      className="w-12 h-12 rounded-full border border-terreta-border"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-terreta-dark">{blog.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          blog.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {blog.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                      <p className="text-sm text-terreta-secondary mb-1">
                        Por {blog.author.name} (@{blog.author.username})
                      </p>
                      <p className="text-xs text-terreta-secondary">
                        Creado el {new Date(blog.created_at).toLocaleDateString('es-ES')}
                      </p>
                      <a
                        href={`/blog/${blog.author.username}/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-terreta-accent hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        <Eye size={12} />
                        Ver blog
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBlog(blog.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <X size={18} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
