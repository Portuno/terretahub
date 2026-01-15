import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Plus, CalendarDays, ExternalLink, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthUser, Event } from '../types';
import { openGoogleCalendar } from '../lib/calendarUtils';
import { Toast } from './Toast';
import { EventModal } from './EventModal';

interface EventsPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ user, onOpenAuth }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

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
        .select('id, organizer_id, title, slug, description, location, location_url, start_date, end_date, image_url, category, is_online, max_attendees, registration_required, status, created_at, updated_at')
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

      // Cargar informaci?n de organizadores
      const organizerIds = [...new Set(filteredEvents.map((e: any) => e.organizer_id))];
      const { data: organizersData } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .in('id', organizerIds);

      const organizersMap = new Map();
      organizersData?.forEach((org: any) => {
        organizersMap.set(org.id, org);
      });

      // Cargar conteo de asistentes y verificar si el usuario est? registrado
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
          slug: e.slug || '',
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
      // Verificar si el usuario ya est? registrado
      const { data: existingRegistration } = await supabase
        .from('event_attendances')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRegistration) {
        if (existingRegistration.status === 'cancelled') {
          // Si estaba cancelado, reactivar el registro
          const { error: updateError } = await supabase
            .from('event_attendances')
            .update({ status: 'registered' })
            .eq('id', existingRegistration.id);

          if (updateError) {
            console.error('[EventsPage] Error reactivating registration:', updateError);
            setToastMessage('Error al registrarse al evento');
            setShowToast(true);
            return;
          }

          setToastMessage('?Te has registrado al evento exitosamente! Puedes exportarlo a tu calendario usando los botones de exportaci?n.');
          setShowToast(true);
          loadEvents();
          return;
        } else {
          // Ya est? registrado
          setToastMessage('Ya est?s registrado en este evento');
          setShowToast(true);
          return;
        }
      }

      // Verificar que el evento existe y est? disponible para registro
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, status, registration_required, max_attendees')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        console.error('[EventsPage] Error loading event:', eventError);
        setToastMessage('Error al cargar informaci?n del evento');
        setShowToast(true);
        return;
      }

      if (eventData.status !== 'published') {
        setToastMessage('Este evento no est? disponible para registro');
        setShowToast(true);
        return;
      }

      if (!eventData.registration_required) {
        setToastMessage('Este evento no requiere registro');
        setShowToast(true);
        return;
      }

      // Verificar si hay cupos disponibles
      if (eventData.max_attendees) {
        const { count } = await supabase
          .from('event_attendances')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .neq('status', 'cancelled');

        if (count !== null && count >= eventData.max_attendees) {
          setToastMessage('Este evento ha alcanzado el m?ximo de asistentes');
          setShowToast(true);
          return;
        }
      }

      // Insertar nuevo registro
      const { error } = await supabase
        .from('event_attendances')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered',
        });

      if (error) {
        console.error('[EventsPage] Error registering:', error);
        
        // Manejar errores espec?ficos
        if (error.code === '23505') { // Unique violation
          setToastMessage('Ya est?s registrado en este evento');
        } else if (error.code === '42501') { // Insufficient privilege
          setToastMessage('No tienes permiso para registrarte en este evento');
        } else {
          setToastMessage('Error al registrarse al evento. Por favor, intenta nuevamente.');
        }
        setShowToast(true);
        return;
      }

      setToastMessage('?Te has registrado al evento exitosamente! Puedes exportarlo a tu calendario usando los botones de exportaci?n.');
      setShowToast(true);
      loadEvents();
    } catch (error) {
      console.error('[EventsPage] Exception registering:', error);
      setToastMessage('Error al registrarse al evento. Por favor, intenta nuevamente.');
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
        setToastMessage('Error al cancelar la inscripci?n');
        setShowToast(true);
        return;
      }

      setToastMessage('Inscripci?n cancelada');
      setShowToast(true);
      loadEvents();
    } catch (error) {
      console.error('[EventsPage] Exception cancelling:', error);
      setToastMessage('Error al cancelar la inscripci?n');
      setShowToast(true);
    }
  };

  const handleExportToCalendar = (event: Event) => {
    const eventUrl = event.slug 
      ? `${window.location.origin}/evento/${event.organizer.username}/${event.slug}`
      : `${window.location.origin}/eventos`;
    
    const calendarEvent = {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      url: eventUrl,
    };

    openGoogleCalendar(calendarEvent);
  };

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleViewEvent = (event: Event) => {
    if (event.slug) {
      navigate(`/evento/${event.organizer.username}/${event.slug}`);
    }
  };

  const handleShareEvent = async (event: Event) => {
    if (event.slug) {
      const eventUrl = `${window.location.origin}/evento/${event.organizer.username}/${event.slug}`;
      try {
        await navigator.clipboard.writeText(eventUrl);
        setToastMessage('Link del evento copiado al portapapeles');
        setShowToast(true);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        setToastMessage('Error al copiar el link');
        setShowToast(true);
      }
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

        {/* Secci?n: Invitaci?n a organizar eventos - Solo visible en filtro "Todos" */}
        {filter === 'all' && (
          <div className="bg-gradient-to-br from-terreta-accent/10 via-terreta-card to-terreta-sidebar/30 rounded-2xl p-6 md:p-8 mb-8 border border-terreta-border/50 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <h2 className="font-serif text-2xl md:text-3xl text-terreta-dark font-bold mb-3">
                  ?Tienes una idea para un evento?
                </h2>
                <p className="text-terreta-dark/80 text-base md:text-lg mb-4 leading-relaxed">
                  En Terreta Hub <strong>organizamos eventos</strong> y <strong>invitamos a todos los miembros de la comunidad</strong> a organizar sus propios eventos. 
                  Ya sea un workshop, una charla, un networking o cualquier actividad que quieras compartir, 
                  ?estamos aqu? para apoyarte!
                </p>
                <p className="text-terreta-dark/70 text-sm md:text-base mb-4">
                  Crea tu evento, comp?rtelo con la comunidad y construyamos juntos una red de conocimiento y colaboraci?n.
                </p>
                {user ? (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center gap-2 bg-terreta-accent hover:opacity-90 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <Plus size={20} />
                    Crear mi evento
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-2 bg-terreta-accent hover:opacity-90 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Inicia sesi?n para crear eventos
                  </button>
                )}
              </div>
              
              {/* Galer?a de ejemplos */}
              <div className="w-full md:w-auto flex-shrink-0">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="relative rounded-xl overflow-hidden border-2 border-terreta-border/50 shadow-md hover:shadow-lg transition-all hover:scale-105">
                    <img
                      src="/onboardevent1.png"
                      alt="Evento de la comunidad Terreta Hub - Ejemplo 1"
                      className="w-full h-32 md:h-40 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border-2 border-terreta-border/50 shadow-md hover:shadow-lg transition-all hover:scale-105">
                    <img
                      src="/onboardevent2.jpg"
                      alt="Evento de la comunidad Terreta Hub - Ejemplo 2"
                      className="w-full h-32 md:h-40 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
                <p className="text-xs text-terreta-dark/50 mt-2 text-center md:text-left">
                  Ejemplos de eventos organizados por la comunidad
                </p>
              </div>
            </div>
          </div>
        )}

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
            Pr?ximos
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
                ? 'No hay eventos pr?ximos programados'
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
                    {event.slug && (
                      <button
                        onClick={() => handleShareEvent(event)}
                        className="text-terreta-dark/60 hover:text-terreta-accent transition-colors p-1"
                        title="Compartir evento"
                      >
                        <Share2 size={18} />
                      </button>
                    )}
                  </div>

                  {event.description && (
                    <div className="mb-4">
                      <p className={`text-terreta-dark/70 text-sm ${expandedEvents.has(event.id) ? '' : 'line-clamp-2'}`}>
                        {event.description}
                      </p>
                      {event.description.length > 100 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventExpanded(event.id);
                          }}
                          className="text-terreta-accent hover:text-terreta-dark text-sm font-semibold mt-2 flex items-center gap-1"
                        >
                          {expandedEvents.has(event.id) ? (
                            <>
                              <ChevronUp size={16} />
                              Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              Ver más
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
                      <Clock size={16} />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
                        <MapPin size={16} />
                        <span>{event.isOnline ? '?? ' : ''}{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
                      <Users size={16} />
                      <span>
                        {event.attendeeCount} {event.attendeeCount === 1 ? 'asistente' : 'asistentes'}
                        {event.maxAttendees && ` / ${event.maxAttendees} m?ximo`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {event.registrationRequired && (
                      <>
                        {event.isUserRegistered ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRegistration(event.id);
                              }}
                              className="w-full bg-terreta-sidebar hover:bg-terreta-border text-terreta-dark px-4 py-2 rounded-full font-semibold transition-all"
                            >
                              Cancelar Inscripci?n
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportToCalendar(event);
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark px-4 py-2 rounded-full font-semibold transition-all border border-terreta-border"
                              title="Abrir en Google Calendar"
                            >
                              <ExternalLink size={18} />
                              Agregar a Google Calendar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegister(event.id);
                            }}
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
