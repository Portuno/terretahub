import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';
import { HandHeart, MessageSquare, X, Send, CheckCircle2 } from 'lucide-react';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

interface ResourceNeedComment {
  id: string;
  content: string;
  is_help_offer: boolean;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
  };
}

interface ResourceNeed {
  id: string;
  details: string;
  verticals: string[];
  format_tags: string[];
  created_at: string;
  user_id?: string;
  status?: string;
  author?: {
    name: string;
    avatar: string;
  };
  comments?: ResourceNeedComment[];
}

interface ResourceCollabPanelProps {
  user?: AuthUser | null;
  onOpenAuth?: (referrerUsername?: string) => void;
}

// Componente: Tarjeta de Pedido de Ayuda
const HelpRequestCard: React.FC<{ 
  request: ResourceNeed; 
  currentUser?: AuthUser | null;
  onRequestClick: (request: ResourceNeed) => void;
  onMarkResolved?: (requestId: string) => void;
}> = ({ request, currentUser, onRequestClick, onMarkResolved }) => {
  const isAuthor = currentUser?.id === request.user_id;
  const isResolved = request.status === 'resolved';

  return (
    <div 
      className={`bg-terreta-card rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border transition-all duration-300 ${
        isResolved 
          ? 'border-emerald-200/50 bg-emerald-50/20' 
          : 'border-terreta-border/50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-terreta-accent/30'
      }`}
    >
      {/* Header con estado */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {isResolved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} />
              <span className="text-xs font-bold">Resuelto</span>
            </div>
          )}
        </div>
        {isAuthor && !isResolved && onMarkResolved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkResolved(request.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
            aria-label="Marcar como Resuelto"
          >
            <CheckCircle2 size={14} />
            <span>Marcar Resuelto</span>
          </button>
        )}
      </div>

      {/* Contenido */}
      <div onClick={() => onRequestClick(request)} className="cursor-pointer">
        <p className="text-base text-terreta-dark mb-4 leading-relaxed line-clamp-3">
          {request.details}
        </p>

        {/* Tags y Verticales */}
        <div className="flex flex-wrap gap-2 mb-4">
          {request.verticals && request.verticals.length > 0 && (
            request.verticals.slice(0, 3).map((vertical) => (
              <span
                key={vertical}
                className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {vertical}
              </span>
            ))
          )}
          {request.format_tags && request.format_tags.length > 0 && (
            request.format_tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-terreta-bg text-terreta-secondary border border-terreta-border"
              >
                {tag}
              </span>
            ))
          )}
        </div>

        {/* Footer: Autor y Comentarios */}
        <div className="flex items-center justify-between pt-4 border-t border-terreta-border/30">
          {request.author && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-terreta-border/50">
                <img 
                  src={request.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.author.name}`} 
                  alt={request.author.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-terreta-secondary font-medium">
                {request.author.name}
              </span>
            </div>
          )}
          {request.comments && request.comments.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-terreta-secondary">
              <MessageSquare size={16} />
              <span className="font-medium">{request.comments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ResourceCollabPanel: React.FC<ResourceCollabPanelProps> = ({ user, onOpenAuth }) => {
  const [requests, setRequests] = useState<ResourceNeed[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showPedirAyudaModal, setShowPedirAyudaModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResourceNeed | null>(null);
  const [filterStatus, setFilterStatus] = useState<'active' | 'resolved'>('active');
  
  const [requestComments, setRequestComments] = useState<ResourceNeedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [formatTags, setFormatTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [submitState, setSubmitState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [markingResolved, setMarkingResolved] = useState<string | null>(null);

  const VERTICALS = [
    'Tecnología',
    'Arte & Educación',
    'Finanzas',
    'Legal',
    'Comunidad',
    'Salud'
  ];

  // Cargar solicitudes con filtro de status
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoadingRequests(true);
        
        console.log('Loading requests - User:', user?.id || 'Not authenticated', 'Filter:', filterStatus);
        
        // Construir query según el filtro
        let query = supabase
          .from('resource_needs')
          .select('*')
          .order('created_at', { ascending: false });

        // Filtrar por status
        if (filterStatus === 'resolved') {
          query = query.eq('status', 'resolved');
        }
        // Para 'active', cargamos todos y filtramos en el cliente

        const { data, error } = await query.limit(100);

        if (error) {
          console.error('Error loading requests:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          setRequests([]);
          return;
        }

        console.log('Loaded requests from DB:', data?.length || 0, data);
        if (data && data.length > 0) {
          console.log('Sample request:', data[0]);
          console.log('Status values:', data.map(r => ({ id: r.id, status: r.status })));
        }

        // Cargar información de autores si tienen user_id
        if (data && data.length > 0) {
          const userIds = data.filter(r => r.user_id).map(r => r.user_id);
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, name, avatar')
              .in('id', userIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            // Cargar comentarios para cada solicitud
            const requestIds = data.map(r => r.id);
            const { data: commentsData } = await supabase
              .from('resource_needs_comments')
              .select(`
                *,
                author:profiles!resource_needs_comments_author_id_fkey(id, name, avatar, username)
              `)
              .in('resource_need_id', requestIds)
              .order('created_at', { ascending: true });

            const commentsByRequest = new Map<string, ResourceNeedComment[]>();
            if (commentsData) {
              commentsData.forEach((comment: any) => {
                const requestId = comment.resource_need_id;
                if (!commentsByRequest.has(requestId)) {
                  commentsByRequest.set(requestId, []);
                }
                commentsByRequest.get(requestId)!.push({
                  id: comment.id,
                  content: comment.content,
                  is_help_offer: comment.is_help_offer,
                  created_at: comment.created_at,
                  author: {
                    id: comment.author.id,
                    name: comment.author.name,
                    avatar: comment.author.avatar,
                    username: comment.author.username
                  }
                });
              });
            }

            let requestsWithAuthors = data.map((request: any) => ({
              ...request,
              author: request.user_id ? profilesMap.get(request.user_id) : null,
              comments: commentsByRequest.get(request.id) || []
            }));

            // Filtrar en el cliente según el filtro
            // Considerar NULL o undefined como vigente (no resuelto)
            if (filterStatus === 'active') {
              requestsWithAuthors = requestsWithAuthors.filter(req => 
                !req.status || req.status !== 'resolved'
              );
            } else {
              // Para 'resolved', solo mostrar los que tienen status = 'resolved'
              requestsWithAuthors = requestsWithAuthors.filter(req => 
                req.status === 'resolved'
              );
            }

            console.log('Filtered requests:', requestsWithAuthors.length, 'for filter:', filterStatus);
            setRequests(requestsWithAuthors);
          } else {
            // Si no hay user_ids, aún así procesar los datos
            let processedRequests = data.map((request: any) => ({
              ...request,
              author: null,
              comments: []
            }));

            // Filtrar según el filtro
            if (filterStatus === 'active') {
              processedRequests = processedRequests.filter(req => 
                !req.status || req.status !== 'resolved'
              );
            } else {
              processedRequests = processedRequests.filter(req => 
                req.status === 'resolved'
              );
            }

            console.log('Processed requests (no authors):', processedRequests.length);
            setRequests(processedRequests);
          }
        } else {
          console.log('No data returned from query');
          setRequests([]);
        }
      } catch (err) {
        console.error('Exception loading requests:', err);
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadRequests();
  }, [user, filterStatus]);

  const handleRequestClick = async (request: ResourceNeed) => {
    setSelectedRequest(request);
    setRequestComments(request.comments || []);
    setCommentText('');
    
    // Cargar comentarios actualizados
    await loadRequestComments(request.id);
  };

  const loadRequestComments = async (requestId: string) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('resource_needs_comments')
        .select(`
          *,
          author:profiles!resource_needs_comments_author_id_fkey(id, name, avatar, username)
        `)
        .eq('resource_need_id', requestId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      if (data) {
        const comments: ResourceNeedComment[] = data.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          is_help_offer: comment.is_help_offer,
          created_at: comment.created_at,
          author: {
            id: comment.author.id,
            name: comment.author.name,
            avatar: comment.author.avatar,
            username: comment.author.username
          }
        }));
        setRequestComments(comments);
      }
    } catch (err) {
      console.error('Exception loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleMarkAsResolved = async (requestId: string) => {
    if (!user) return;

    try {
      setMarkingResolved(requestId);
      const { error } = await supabase
        .from('resource_needs')
        .update({ status: 'resolved' })
        .eq('id', requestId)
        .eq('user_id', user.id); // Solo el autor puede marcar como resuelto

      if (error) {
        console.error('Error marking as resolved:', error);
        return;
      }

      // Actualizar estado local
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'resolved' }
          : req
      ));

      // Si el pedido seleccionado es el que se marcó como resuelto, actualizarlo también
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'resolved' } : null);
      }
    } catch (err) {
      console.error('Exception marking as resolved:', err);
    } finally {
      setMarkingResolved(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !selectedRequest || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const { data, error } = await supabase
        .from('resource_needs_comments')
        .insert({
          resource_need_id: selectedRequest.id,
          author_id: user.id,
          content: commentText.trim(),
          is_help_offer: false // Ya no se usa pero mantenemos compatibilidad
        })
        .select(`
          *,
          author:profiles!resource_needs_comments_author_id_fkey(id, name, avatar, username)
        `)
        .single();

      if (error) {
        console.error('Error submitting comment:', error);
        return;
      }

      if (data) {
        const newComment: ResourceNeedComment = {
          id: data.id,
          content: data.content,
          is_help_offer: data.is_help_offer,
          created_at: data.created_at,
          author: {
            id: data.author.id,
            name: data.author.name,
            avatar: data.author.avatar,
            username: data.author.username
          }
        };

        setRequestComments(prev => [...prev, newComment]);
        setCommentText('');

        // Actualizar la solicitud en la lista
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, comments: [...(req.comments || []), newComment] }
            : req
        ));
      }
    } catch (err) {
      console.error('Exception submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    const exists = list.includes(value);
    setter(exists ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();

    const newTags = tagInput
      .split(/,|\n/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!newTags.length) return;

    setFormatTags((prev) => Array.from(new Set([...prev, ...newTags])));
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormatTags((prev) => prev.filter((item) => item !== tag));
  };

  const isSubmitDisabled = useMemo(() => {
    const hasDetails = details.trim().length > 12;
    return !hasDetails || selectedVerticals.length === 0;
  }, [details, selectedVerticals]);

  const handleSubmit = async () => {
    if (isSubmitDisabled || submitState === 'loading') return;

    setSubmitState('loading');
    setErrorMessage('');

    const trimmedDetails = details.trim();
    if (!trimmedDetails || trimmedDetails.length <= 12) {
      setSubmitState('error');
      setErrorMessage('Por favor, proporciona más detalles sobre tu necesidad (mínimo 12 caracteres).');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    if (trimmedDetails.length > 10000) {
      setSubmitState('error');
      setErrorMessage('El texto es demasiado largo. Por favor, reduce la descripción a menos de 10,000 caracteres.');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    if (!selectedVerticals || selectedVerticals.length === 0) {
      setSubmitState('error');
      setErrorMessage('Por favor, selecciona al menos una vertical de interés.');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    const cleanedVerticals = Array.isArray(selectedVerticals) 
      ? selectedVerticals.filter(v => v && typeof v === 'string' && v.trim().length > 0)
      : [];
    
    const cleanedFormatTags = Array.isArray(formatTags)
      ? formatTags.filter(t => t && typeof t === 'string' && t.trim().length > 0)
      : [];

    const payload: Record<string, any> = {
      details: trimmedDetails,
      verticals: cleanedVerticals,
      format_tags: cleanedFormatTags,
      status: 'new' // Estado inicial
    };

    if (user?.id) {
      payload.user_id = user.id;
    }

    try {
      const { data, error } = await supabase
        .from('resource_needs')
        .insert(payload)
        .select();
      
      if (error) {
        console.error('Error submitting request:', error);
        setSubmitState('error');
        setErrorMessage('No se pudo enviar tu necesidad. Por favor, intenta nuevamente.');
        return;
      }

      setSubmitState('success');
      setDetails('');
      setSelectedVerticals([]);
      setFormatTags([]);
      setShowPedirAyudaModal(false);
      
      // Recargar solicitudes (solo vigentes)
      const { data: newRequests } = await supabase
        .from('resource_needs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (newRequests) {
        // Filtrar solo vigentes (considerar NULL como vigente)
        const activeRequests = newRequests.filter(r => !r.status || r.status !== 'resolved');
        
        const userIds = activeRequests.filter(r => r.user_id).map(r => r.user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar')
            .in('id', userIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const requestsWithAuthors = activeRequests.map((request: any) => ({
            ...request,
            author: request.user_id ? profilesMap.get(request.user_id) : null,
            comments: []
          }));
          setRequests(requestsWithAuthors);
        } else {
          setRequests(activeRequests);
        }
      }
    } catch (err: any) {
      console.error('Exception during submit:', err);
      setSubmitState('error');
      setErrorMessage(err?.message || 'No se pudo enviar tu necesidad. Por favor, intenta nuevamente.');
    } finally {
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  // Los requests ya vienen filtrados de la query, pero aplicamos un filtro adicional por seguridad
  // Considerar NULL o undefined como vigente (no resuelto)
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      if (filterStatus === 'active') {
        return !request.status || request.status !== 'resolved';
      } else {
        return request.status === 'resolved';
      }
    });
  }, [requests, filterStatus]);

  return (
    <div className="w-full h-full flex flex-col gap-4 relative">
      {/* Header */}
      <header className="shrink-0">
        <h1 className="text-4xl font-serif font-bold text-terreta-dark leading-tight mb-2">
          L'Almoina
        </h1>
        <p className="text-base text-terreta-secondary font-medium">
          Donde la comunidad se ayuda y crece junta
        </p>
      </header>

      {/* Controles: Toggle y Botón Pedir Ayuda */}
      <div className="flex items-center justify-between shrink-0">
        {/* Toggle Vigentes/Resueltos */}
        <div className="flex items-center gap-2 bg-terreta-bg rounded-lg p-1 border border-terreta-border">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              filterStatus === 'active'
                ? 'bg-terreta-card text-terreta-dark shadow-sm'
                : 'text-terreta-secondary hover:text-terreta-dark'
            }`}
          >
            Vigentes
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              filterStatus === 'resolved'
                ? 'bg-terreta-card text-terreta-dark shadow-sm'
                : 'text-terreta-secondary hover:text-terreta-dark'
            }`}
          >
            Resueltos
          </button>
        </div>

        {/* Botón Pedir Ayuda */}
        <button
          onClick={() => {
            if (!user && onOpenAuth) {
              onOpenAuth();
            } else {
              setShowPedirAyudaModal(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          aria-label="Pedir Ayuda"
        >
          <HandHeart size={18} />
          <span>Pedir Ayuda</span>
        </button>
      </div>

      {/* Grid de Pedidos de Ayuda */}
      <div className="flex-1 overflow-y-auto pr-2">
        {loadingRequests ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terreta-accent"></div>
              <p className="mt-4 text-terreta-secondary text-sm">Cargando pedidos de ayuda...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-terreta-secondary mb-2">
                {filterStatus === 'active' 
                  ? 'Aún no hay pedidos de ayuda vigentes' 
                  : 'Aún no hay pedidos resueltos'}
              </p>
              <p className="text-sm text-terreta-secondary/70">
                {filterStatus === 'active' 
                  ? 'Sé el primero en pedir ayuda' 
                  : 'Los pedidos resueltos aparecerán aquí'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((request) => (
              <HelpRequestCard
                key={request.id}
                request={request}
                currentUser={user}
                onRequestClick={handleRequestClick}
                onMarkResolved={handleMarkAsResolved}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: Pedir Ayuda */}
      {showPedirAyudaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-terreta-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-terreta-border shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <HandHeart className="text-emerald-600" size={20} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-terreta-dark">Pedir Ayuda</h2>
              </div>
              <button
                onClick={() => {
                  setShowPedirAyudaModal(false);
                  setDetails('');
                  setSelectedVerticals([]);
                  setFormatTags([]);
                  setSubmitState('idle');
                  setErrorMessage('');
                }}
                className="text-terreta-secondary hover:text-terreta-dark transition-colors p-1 rounded-lg hover:bg-terreta-bg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Verticals */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Vertical de Interés <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {VERTICALS.map((vertical) => {
                    const isActive = selectedVerticals.includes(vertical);
                    return (
                      <button
                        key={vertical}
                        type="button"
                        onClick={() => toggleItem(vertical, selectedVerticals, setSelectedVerticals)}
                        className={`px-4 py-2 text-sm rounded-full border transition ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600'
                            : 'border-terreta-border text-terreta-secondary hover:border-terreta-accent/50 bg-terreta-card'
                        }`}
                      >
                        {vertical}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Tags */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Formatos preferidos
                </label>
                <div className="flex flex-wrap gap-2 items-center pb-2 border-b border-terreta-border">
                  {formatTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-terreta-bg px-3 py-1 text-sm text-terreta-dark border border-terreta-border"
                    >
                      {tag}
                      <button
                        type="button"
                        className="text-terreta-secondary hover:text-terreta-dark focus:outline-none font-bold ml-1"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Ej: PDF, Video... (Enter)"
                    className="flex-1 min-w-[200px] bg-transparent text-base text-terreta-dark placeholder-terreta-secondary/50 outline-none py-1"
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2 block">
                  Detalles <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Describe qué necesitas..."
                  className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all resize-none outline-none leading-relaxed min-h-[120px]"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="font-semibold mb-1">Error:</div>
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {submitState === 'success' && (
                  <span className="text-xs text-emerald-600 font-bold animate-pulse">¡Enviado!</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowPedirAyudaModal(false);
                    setDetails('');
                    setSelectedVerticals([]);
                    setFormatTags([]);
                    setSubmitState('idle');
                    setErrorMessage('');
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar transition-colors border border-terreta-border"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitDisabled || submitState === 'loading'}
                  onClick={handleSubmit}
                  className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-terreta-accent shadow-md transition hover:brightness-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {submitState === 'loading' ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalles de Solicitud */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <div 
            className="bg-terreta-card rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-terreta-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-terreta-dark">Pedido de Ayuda</h2>
                {selectedRequest.status === 'resolved' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold">Resuelto</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-terreta-secondary hover:text-terreta-dark transition-colors p-1 rounded-lg hover:bg-terreta-bg"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Información del Autor */}
            {selectedRequest.author && (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-terreta-border">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-terreta-border/50">
                  <img 
                    src={selectedRequest.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRequest.author.name}`} 
                    alt={selectedRequest.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-terreta-dark">{selectedRequest.author.name}</p>
                  <p className="text-xs text-terreta-secondary">
                    {new Date(selectedRequest.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {user?.id === selectedRequest.user_id && selectedRequest.status !== 'resolved' && (
                  <div className="ml-auto">
                    <button
                      onClick={() => {
                        if (selectedRequest.id) {
                          handleMarkAsResolved(selectedRequest.id);
                        }
                      }}
                      disabled={markingResolved === selectedRequest.id}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>Marcar como Resuelto</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Detalles Completos */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2">Detalles</h3>
              <p className="text-base text-terreta-dark leading-relaxed whitespace-pre-wrap">
                {selectedRequest.details}
              </p>
            </div>

            {/* Verticales y Formatos */}
            <div className="mb-6 space-y-4">
              {selectedRequest.verticals && selectedRequest.verticals.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2">Verticales</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.verticals.map((vertical) => (
                      <span
                        key={vertical}
                        className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {vertical}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.format_tags && selectedRequest.format_tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-2">Formatos Preferidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.format_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-terreta-bg text-terreta-secondary border border-terreta-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comentarios */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-terreta-dark uppercase tracking-wide mb-4">
                Comentarios {requestComments.length > 0 && `(${requestComments.length})`}
              </h3>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-terreta-accent"></div>
                  </div>
                ) : requestComments.length === 0 ? (
                  <p className="text-sm text-terreta-secondary text-center py-4">
                    Aún no hay comentarios. Sé el primero en responder.
                  </p>
                ) : (
                  requestComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-xl border bg-terreta-bg/50 border-terreta-border/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-terreta-border/50 flex-shrink-0">
                          <img 
                            src={comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`} 
                            alt={comment.author.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-terreta-dark">
                              {comment.author.name}
                            </span>
                            <span className="text-xs text-terreta-secondary">
                              {new Date(comment.created_at).toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-terreta-dark leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Formulario de Comentario */}
            {user ? (
              <div className="border-t border-terreta-border pt-6">
                <div className="mb-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full rounded-xl border border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all resize-none outline-none leading-relaxed min-h-[100px]"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setCommentText('');
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar transition-colors border border-terreta-border"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-terreta-accent shadow-md transition hover:brightness-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submittingComment ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Enviar Comentario</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-terreta-border pt-6 text-center">
                <p className="text-sm text-terreta-secondary mb-3">
                  Inicia sesión para comentar
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
