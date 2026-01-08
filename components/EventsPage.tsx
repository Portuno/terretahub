import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Plus, CalendarDays, Download, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthUser, Event } from '../types';
import { downloadICSFile, openGoogleCalendar } from '../lib/calendarUtils';
import { Toast } from './Toast';
import { EventModal } from './EventModal';

interface EventsPageProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ user, onOpenAuth }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filter, user]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      
      // Cargar eventos publicados
      // Primero cargar eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('start_date', { ascending: filter !== 'past' });

      if (eventsError) {
        console.error('[EventsPage] Error loading events:', eventsError);
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      // Filtrar por fecha si es necesario
      const now = new Date();
      let filteredEvents = eventsData;
      
      if (filter === 'upcoming') {
        filteredEvents = eventsData.filter((e: any) => new Date(e.start_date) >= now);
      } else if (filter === 'past') {
        filteredEvents = eventsData.filter((e: any) => new Date(e.start_date) < now);
      }

      if (filteredEvents.length === 0) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      // Cargar información de organizadores
      const organizerIds = [...new Set(filteredEvents.map((e: any) => e.organizer_id))];
      const { data: organizersData } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .in('id', organizerIds);

      const organizersMap = new Map();
      organizersData?.forEach((org: any) => {
        organizersMap.set(org.id, org);
      });

      // Cargar conteo de asistentes y verificar si el usuario está registrado
      const eventIds = filteredEvents.map((e: any) => e.id);
      
      const { data: attendancesData } = await supabase
        .from('event_attendances')
        .select('event_id, user_id, status')
        .in('event_id', eventIds)
        .neq('status', 'cancelled');

      // Contar asistentes por evento
      const attendeeCounts = new Map<string, number>();
      const userRegistrations = new Set<string>();

      attendancesData?.forEach((attendance: any) => {
        const count = attendeeCounts.get(attendance.event_id) || 0;
        attendeeCounts.set(attendance.event_id, count + 1);
        
        if (user && attendance.user_id === user.id) {
          userRegistrations.add(attendance.event_id);
        }
      });

      // Formatear eventos
      const formattedEvents: Event[] = filteredEvents.map((e: any) => {
        const organizer = organizersMap.get(e.organizer_id);
        return {
          id: e.id,
          organizerId: e.organizer_id,
          organizer: {
            name: organizer?.name || 'Usuario',
            avatar: organizer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${organizer?.username || 'user'}`,
            username: organizer?.username || 'usuario',
          },
          title: e.title,
          description: e.description,
          location: e.location,
          locationUrl: e.location_url,
          startDate: e.start_date,
          endDate: e.end_date,
          imageUrl: e.image_url,
          category: e.category,
          isOnline: e.is_online,
          maxAttendees: e.max_attendees,
          registrationRequired: e.registration_required,
          status: e.status,
          attendeeCount: attendeeCounts.get(e.id) || 0,
          isUserRegistered: userRegistrations.has(e.id),
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error('[EventsPage] Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await supabase
        .from('event_attendances')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered',
        });

      if (error) {
        console.error('[EventsPage] Error registering:', error);
        setToastMessage('Error al registrarse al evento');
        setShowToast(true);
        return;
      }

      setToastMessage('¡Te has registrado al evento exitosamente! Puedes exportarlo a tu calendario usando los botones de exportación.');
      setShowToast(true);
      loadEvents();
    } catch (error) {
      console.error('[EventsPage] Exception registering:', error);
      setToastMessage('Error al registrarse al evento');
      setShowToast(true);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_attendances')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[EventsPage] Error cancelling registration:', error);
        setToastMessage('Error al cancelar la inscripción');
        setShowToast(true);
        return;
      }

      setToastMessage('Inscripción cancelada');
      setShowToast(true);
      loadEvents();
    } catch (error) {
      console.error('[EventsPage] Exception cancelling:', error);
      setToastMessage('Error al cancelar la inscripción');
      setShowToast(true);
    }
  };

  const handleExportToCalendar = (event: Event, method: 'download' | 'google') => {
    const calendarEvent = {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      url: window.location.origin + '/eventos',
    };

    if (method === 'download') {
      downloadICSFile(calendarEvent);
      setToastMessage('Archivo .ics descargado. Puedes importarlo a tu calendario.');
      setShowToast(true);
    } else {
      openGoogleCalendar(calendarEvent);
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

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {isCreating && user && (
        <EventModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          user={user}
          onSave={() => {
            loadEvents();
            setIsCreating(false);
          }}
        />
      )}
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-terreta-dark font-bold mb-2">
              Eventos
            </h1>
            <p className="text-terreta-dark/60">
              Descubre y participa en eventos de la comunidad Terreta Hub
            </p>
          </div>
          
          {user && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-terreta-accent hover:opacity-90 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Crear Evento
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 p-1 bg-terreta-card rounded-full border border-terreta-border w-fit">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              filter === 'upcoming'
                ? 'bg-terreta-accent text-white shadow-md'
                : 'text-terreta-dark/70 hover:text-terreta-dark hover:bg-terreta-sidebar'
            }`}
          >
            Próximos
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              filter === 'past'
                ? 'bg-terreta-accent text-white shadow-md'
                : 'text-terreta-dark/70 hover:text-terreta-dark hover:bg-terreta-sidebar'
            }`}
          >
            Pasados
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              filter === 'all'
                ? 'bg-terreta-accent text-white shadow-md'
                : 'text-terreta-dark/70 hover:text-terreta-dark hover:bg-terreta-sidebar'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays size={48} className="mx-auto mb-4 text-terreta-dark/30" />
            <p className="text-terreta-dark/60 text-lg">
              {filter === 'upcoming' 
                ? 'No hay eventos próximos programados'
                : filter === 'past'
                ? 'No hay eventos pasados'
                : 'No hay eventos disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-terreta-card rounded-lg overflow-hidden shadow-sm border border-terreta-border hover:shadow-lg transition-all"
              >
                {event.imageUrl && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-serif text-xl font-bold text-terreta-dark flex-1">
                      {event.title}
                    </h3>
                  </div>

                  {event.description && (
                    <p className="text-terreta-dark/70 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
                      <Clock size={16} />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
                        <MapPin size={16} />
                        <span>{event.isOnline ? '🌐 ' : ''}{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
                      <Users size={16} />
                      <span>
                        {event.attendeeCount} {event.attendeeCount === 1 ? 'asistente' : 'asistentes'}
                        {event.maxAttendees && ` / ${event.maxAttendees} máximo`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {event.registrationRequired && (
                      <>
                        {event.isUserRegistered ? (
                          <>
                            <button
                              onClick={() => handleCancelRegistration(event.id)}
                              className="w-full bg-terreta-sidebar hover:bg-terreta-border text-terreta-dark px-4 py-2 rounded-full font-semibold transition-all"
                            >
                              Cancelar Inscripción
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleExportToCalendar(event, 'download')}
                                className="flex-1 flex items-center justify-center gap-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark px-3 py-2 rounded-full text-sm font-semibold transition-all border border-terreta-border"
                                title="Descargar .ics"
                              >
                                <Download size={16} />
                                .ics
                              </button>
                              <button
                                onClick={() => handleExportToCalendar(event, 'google')}
                                className="flex-1 flex items-center justify-center gap-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark px-3 py-2 rounded-full text-sm font-semibold transition-all border border-terreta-border"
                                title="Abrir en Google Calendar"
                              >
                                <ExternalLink size={16} />
                                Google
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRegister(event.id)}
                            className="w-full bg-terreta-accent hover:opacity-90 text-white px-4 py-2 rounded-full font-semibold transition-all"
                          >
                            Asistir
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          duration={4000}
          variant="terreta"
        />
      )}
    </>
  );
};
