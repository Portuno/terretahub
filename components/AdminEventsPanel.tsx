import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, CalendarDays, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthUser, EventStatus } from '../types';
import { supabase } from '../lib/supabase';

interface AdminEventsPanelProps {
  user: AuthUser;
}

interface EventFromDB {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  start_date: string;
  end_date: string;
  image_url: string | null;
  category: string | null;
  is_online: boolean;
  max_attendees: number | null;
  registration_required: boolean;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

interface EventWithOrganizer extends EventFromDB {
  organizer: {
    name: string;
    username: string;
    avatar: string;
  };
}

export const AdminEventsPanel: React.FC<AdminEventsPanelProps> = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithOrganizer | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Cargar eventos en estado 'review'
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'review')
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error al cargar eventos:', eventsError);
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        return;
      }

      // Cargar información de los organizadores
      const organizerIds = [...new Set(eventsData.map((e: EventFromDB) => e.organizer_id))];
      const { data: organizersData } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .in('id', organizerIds);

      const organizersMap = new Map();
      organizersData?.forEach((org: any) => {
        organizersMap.set(org.id, org);
      });

      const eventsWithOrganizers: EventWithOrganizer[] = eventsData.map((event: EventFromDB) => {
        const organizer = organizersMap.get(event.organizer_id);
        return {
          ...event,
          organizer: {
            name: organizer?.name || 'Usuario',
            username: organizer?.username || 'usuario',
            avatar: organizer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${organizer?.username || 'user'}`
          }
        };
      });

      setEvents(eventsWithOrganizers);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    if (!confirm('¿Aprobar este evento? Se publicará en la sección de eventos.')) {
      return;
    }

    await updateEventStatus(eventId, 'published');
  };

  const handleReject = async (eventId: string) => {
    if (!confirm('¿Rechazar este evento? Volverá a estado borrador.')) {
      return;
    }

    await updateEventStatus(eventId, 'draft');
  };

  const updateEventStatus = async (eventId: string, newStatus: EventStatus) => {
    try {
      setProcessing(eventId);

      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) {
        console.error('Error al actualizar evento:', error);
        alert('Error al actualizar el evento. Intenta nuevamente.');
        return;
      }

      // Recargar eventos
      await loadEvents();
      setSelectedEvent(null);
    } catch (err) {
      console.error('Error al actualizar evento:', err);
      alert('Error al actualizar el evento. Intenta nuevamente.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mb-4"></div>
        <p className="text-terreta-dark/60">Cargando eventos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-terreta-accent flex items-center justify-center">
            <CalendarDays className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-3xl text-terreta-dark">Panel de Administración - Eventos</h2>
            <p className="text-sm text-terreta-dark/60">Gestiona eventos pendientes de revisión</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark rounded-full font-semibold transition-all border border-terreta-border"
          >
            <FolderKanban size={18} />
            Proyectos
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-terreta-dark/60">
          <Clock size={16} />
          <span className="font-bold text-terreta-accent">{events.length}</span>
          <span>evento{events.length !== 1 ? 's' : ''} pendiente{events.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-terreta-bg rounded-full flex items-center justify-center mb-6">
            <Check className="text-terreta-accent" size={40} />
          </div>
          <h3 className="font-serif text-2xl text-terreta-dark mb-2">No hay eventos pendientes</h3>
          <p className="max-w-md text-terreta-dark/60">Todos los eventos han sido revisados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de eventos */}
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`bg-terreta-card border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedEvent?.id === event.id
                    ? 'border-terreta-accent shadow-lg'
                    : 'border-terreta-border hover:border-terreta-dark/30 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl text-terreta-dark mb-1">{event.title}</h3>
                    {event.category && (
                      <p className="text-sm text-terreta-dark/60 mb-2">{event.category}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase rounded-full">
                    Review
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={event.organizer.avatar}
                    alt={event.organizer.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-bold text-terreta-dark">{event.organizer.name}</p>
                    <p className="text-xs text-terreta-dark/60">@{event.organizer.username}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-sm text-terreta-dark/70">
                    <Clock size={14} className="inline mr-1" />
                    {formatDate(event.start_date)}
                  </p>
                  {event.location && (
                    <p className="text-sm text-terreta-dark/70">
                      📍 {event.is_online ? '🌐 ' : ''}{event.location}
                    </p>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-terreta-dark/60 line-clamp-2">{event.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Detalles del evento seleccionado */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            {selectedEvent ? (
              <div className="bg-terreta-card border border-terreta-border rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-serif text-2xl text-terreta-dark mb-2">
                      {selectedEvent.title}
                    </h3>
                    {selectedEvent.category && (
                      <p className="text-terreta-dark/60 mb-4">{selectedEvent.category}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-terreta-dark/60 hover:text-terreta-dark"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Organizador */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-terreta-border">
                  <img
                    src={selectedEvent.organizer.avatar}
                    alt={selectedEvent.organizer.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-bold text-terreta-dark">{selectedEvent.organizer.name}</p>
                    <p className="text-sm text-terreta-dark/60">@{selectedEvent.organizer.username}</p>
                  </div>
                </div>

                {/* Fechas */}
                <div className="mb-6">
                  <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                    Fechas
                  </h4>
                  <div className="space-y-2">
                    <p className="text-terreta-dark/90">
                      <strong>Inicio:</strong> {formatDate(selectedEvent.start_date)}
                    </p>
                    <p className="text-terreta-dark/90">
                      <strong>Fin:</strong> {formatDate(selectedEvent.end_date)}
                    </p>
                  </div>
                </div>

                {/* Ubicación */}
                {selectedEvent.location && (
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                      Ubicación
                    </h4>
                    <p className="text-terreta-dark/90">
                      {selectedEvent.is_online ? '🌐 ' : '📍 '}{selectedEvent.location}
                    </p>
                    {selectedEvent.location_url && (
                      <a
                        href={selectedEvent.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terreta-accent hover:underline text-sm mt-1 block"
                      >
                        {selectedEvent.location_url}
                      </a>
                    )}
                  </div>
                )}

                {/* Descripción */}
                {selectedEvent.description && (
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                      Descripción
                    </h4>
                    <p className="text-terreta-dark/90 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Imagen */}
                {selectedEvent.image_url && (
                  <div className="mb-6">
                    <h4 className="font-bold text-sm text-terreta-dark mb-2 uppercase tracking-wide">
                      Imagen
                    </h4>
                    <img
                      src={selectedEvent.image_url}
                      alt={selectedEvent.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Detalles adicionales */}
                <div className="mb-6 space-y-2">
                  {selectedEvent.max_attendees && (
                    <p className="text-sm text-terreta-dark/70">
                      <strong>Máximo de asistentes:</strong> {selectedEvent.max_attendees}
                    </p>
                  )}
                  <p className="text-sm text-terreta-dark/70">
                    <strong>Requiere registro:</strong> {selectedEvent.registration_required ? 'Sí' : 'No'}
                  </p>
                  <p className="text-sm text-terreta-dark/70">
                    <strong>Evento en línea:</strong> {selectedEvent.is_online ? 'Sí' : 'No'}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-6 border-t border-terreta-border">
                  <button
                    onClick={() => handleApprove(selectedEvent.id)}
                    disabled={processing === selectedEvent.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={18} />
                    <span>Aprobar</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedEvent.id)}
                    disabled={processing === selectedEvent.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={18} />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-terreta-card border border-terreta-border rounded-xl p-12 text-center">
                <Eye className="text-terreta-dark/30 mx-auto mb-4" size={48} />
                <p className="text-terreta-dark/60">Selecciona un evento para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
