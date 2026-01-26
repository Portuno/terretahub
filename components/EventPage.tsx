import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Share2, Download, ExternalLink, ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthUser, Event } from '../types';
import { downloadICSFile, openGoogleCalendar } from '../lib/calendarUtils';
import { getEventStats } from '../lib/eventUtils';
import { Toast } from './Toast';
import { ShareModal } from './ShareModal';

interface EventPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const EventPage: React.FC<EventPageProps> = ({ user, onOpenAuth }) => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [stats, setStats] = useState<{
    totalRegistrations: number;
    totalReferrals: number;
    referrals: Array<{
      id: string;
      inviteeId: string;
      inviteeName: string;
      inviteeUsername: string;
      inviteeAvatar: string;
      createdAt: string;
    }>;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (username && slug) {
      loadEvent();
    }
  }, [username, slug]);

  useEffect(() => {
    // Guardar información del evento en localStorage para referidos
    if (event && !user) {
      try {
        localStorage.setItem('pending_event_referrer', JSON.stringify({
          eventId: event.id,
          organizerId: event.organizerId,
          organizerUsername: event.organizer.username
        }));
      } catch (err) {
        console.warn('[EventPage] Could not store pending event referrer:', err);
      }
    }
  }, [event, user]);

  const loadEvent = async () => {
    if (!username || !slug) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar evento por slug y username del organizador
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          organizer_id,
          title,
          slug,
          description,
          location,
          location_url,
          start_date,
          end_date,
          image_url,
          category,
          is_online,
          max_attendees,
          registration_required,
          status,
          created_at,
          updated_at
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (eventError || !eventData) {
        setError('Evento no encontrado');
        setLoading(false);
        return;
      }

      // Cargar información del organizador
      const { data: organizerData, error: organizerError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .eq('id', eventData.organizer_id)
        .single();

      if (organizerError || !organizerData) {
        setError('Error al cargar información del organizador');
        setLoading(false);
        return;
      }

      // Verificar que el username coincida
      if (organizerData.username !== username) {
        setError('Evento no encontrado');
        setLoading(false);
        return;
      }

      // Verificar si el usuario está registrado
      let isUserRegistered = false;
      if (user) {
        const { data: attendanceData } = await supabase
          .from('event_attendances')
          .select('id')
          .eq('event_id', eventData.id)
          .eq('user_id', user.id)
          .neq('status', 'cancelled')
          .maybeSingle();
        
        isUserRegistered = !!attendanceData;
      }

      // Contar asistentes
      const { count: attendeeCount } = await supabase
        .from('event_attendances')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventData.id)
        .neq('status', 'cancelled');

      const transformedEvent: Event = {
        id: eventData.id,
        organizerId: eventData.organizer_id,
        organizer: {
          id: organizerData.id,
          name: organizerData.name || 'Usuario',
          username: organizerData.username || 'usuario',
          avatar: organizerData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${organizerData.username || 'user'}`,
        },
        title: eventData.title,
        slug: eventData.slug || '',
        description: eventData.description,
        location: eventData.location,
        locationUrl: eventData.location_url,
        startDate: eventData.start_date,
        endDate: eventData.end_date,
        imageUrl: eventData.image_url,
        category: eventData.category,
        isOnline: eventData.is_online,
        maxAttendees: eventData.max_attendees,
        registrationRequired: eventData.registration_required,
        status: eventData.status,
        attendeeCount: attendeeCount || 0,
        isUserRegistered,
        createdAt: eventData.created_at,
        updatedAt: eventData.updated_at,
      };

      setEvent(transformedEvent);

      // Cargar estadísticas si el usuario es el organizador
      if (user && user.id === transformedEvent.organizerId) {
        loadStats(transformedEvent.id, transformedEvent.organizerId);
      }
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (eventId: string, organizerId: string) => {
    try {
      setLoadingStats(true);
      const eventStats = await getEventStats(eventId, organizerId);
      setStats(eventStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      // Abrir modal de autenticación con referrer del organizador
      if (event) {
        onOpenAuth(event.organizer.username);
      } else {
        onOpenAuth();
      }
      return;
    }

    if (!event) return;

    setIsRegistering(true);
    try {
      // Verificar que el evento esté publicado
      if (event.status !== 'published') {
        setToastMessage('Este evento no está disponible para registro');
        setShowToast(true);
        setIsRegistering(false);
        return;
      }

      if (!event.registrationRequired) {
        setToastMessage('Este evento no requiere registro');
        setShowToast(true);
        setIsRegistering(false);
        return;
      }

      // Verificar si ya está registrado
      const { data: existingAttendance } = await supabase
        .from('event_attendances')
        .select('id, status')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingAttendance && existingAttendance.status !== 'cancelled') {
        setToastMessage('Ya estás registrado en este evento');
        setShowToast(true);
        setIsRegistering(false);
        return;
      }

      // Verificar si hay cupos disponibles
      if (event.maxAttendees) {
        const { count } = await supabase
          .from('event_attendances')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .neq('status', 'cancelled');

        if (count !== null && count >= event.maxAttendees) {
          setToastMessage('Este evento ha alcanzado el máximo de asistentes');
          setShowToast(true);
          setIsRegistering(false);
          return;
        }
      }

      // Insertar nuevo registro
      const { error } = await supabase
        .from('event_attendances')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'registered',
        });

      if (error) {
        console.error('[EventPage] Error registering:', error);
        
        // Manejar errores específicos
        if (error.code === '23505') { // Unique violation
          setToastMessage('Ya estás registrado en este evento');
        } else if (error.code === '42501') { // Insufficient privilege
          setToastMessage('No tienes permiso para registrarte en este evento');
        } else {
          setToastMessage(`Error al registrarse al evento: ${error.message || 'Por favor, intenta nuevamente'}`);
        }
        setShowToast(true);
        setIsRegistering(false);
        return;
      }

      setToastMessage('¡Te has registrado al evento exitosamente!');
      setShowToast(true);
      loadEvent();
    } catch (error: any) {
      console.error('[EventPage] Exception registering:', error);
      setToastMessage(`Error al registrarse al evento: ${error.message || 'Por favor, intenta nuevamente'}`);
      setShowToast(true);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    try {
      const { error } = await supabase
        .from('event_attendances')
        .update({ status: 'cancelled' })
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[EventPage] Error cancelling registration:', error);
        setToastMessage('Error al cancelar la inscripción');
        setShowToast(true);
        return;
      }

      setToastMessage('Inscripción cancelada');
      setShowToast(true);
      loadEvent();
    } catch (error) {
      console.error('[EventPage] Exception cancelling:', error);
      setToastMessage('Error al cancelar la inscripción');
      setShowToast(true);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleExportToCalendar = (method: 'download' | 'google') => {
    if (!event) return;

    const eventUrl = `${window.location.origin}/evento/${event.organizer.username}/${event.slug}`;
    const calendarEvent = {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      url: eventUrl,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-terreta-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terreta-accent mx-auto mb-4"></div>
          <p className="text-terreta-dark">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-terreta-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-sans text-2xl font-bold text-terreta-dark mb-2">Evento no encontrado</h1>
          <p className="text-terreta-secondary mb-4">{error || 'El evento que buscas no existe o fue eliminado.'}</p>
          <button
            onClick={() => navigate('/eventos')}
            className="bg-terreta-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Volver a Eventos
          </button>
        </div>
      </div>
    );
  }

  const isOrganizer = user && user.id === event.organizerId;
  const formattedStartDate = formatDate(event.startDate);
  const formattedEndDate = formatDate(event.endDate);

  return (
    <div className="min-h-screen bg-terreta-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/eventos')}
          className="text-terreta-accent hover:text-terreta-dark transition-colors mb-6 text-sm font-semibold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Volver a Eventos
        </button>

        {/* Header del evento */}
        <article className="bg-terreta-card rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8 mb-6">
          {/* Categoría */}
          {event.category && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-terreta-accent/10 text-terreta-accent border border-terreta-accent/20">
                {event.category}
              </span>
            </div>
          )}

          {/* Título */}
          <h1 className="font-serif text-4xl font-bold text-terreta-dark mb-4">
            {event.title}
          </h1>

          {/* Meta información */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-terreta-border">
            <div className="flex items-center gap-3">
              <img
                src={event.organizer.avatar}
                alt={event.organizer.name}
                className="w-10 h-10 rounded-full border border-terreta-border"
              />
              <div>
                <p className="font-semibold text-sm text-terreta-dark">{event.organizer.name}</p>
                <p className="text-xs text-terreta-secondary">@{event.organizer.username}</p>
              </div>
            </div>
          </div>

          {/* Imagen del evento */}
          {event.imageUrl && (
            <div className="mb-8">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-auto rounded-lg border border-terreta-border"
              />
            </div>
          )}

          {/* Información del evento */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-terreta-dark">
              <Clock size={20} className="text-terreta-accent" />
              <div>
                <p className="font-semibold">Inicio</p>
                <p className="text-sm text-terreta-secondary">{formattedStartDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-terreta-dark">
              <Clock size={20} className="text-terreta-accent" />
              <div>
                <p className="font-semibold">Fin</p>
                <p className="text-sm text-terreta-secondary">{formattedEndDate}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-terreta-dark">
                <MapPin size={20} className="text-terreta-accent" />
                <div>
                  <p className="font-semibold">{event.isOnline ? 'Evento en línea' : 'Ubicación'}</p>
                  {event.locationUrl ? (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-terreta-accent hover:underline"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <p className="text-sm text-terreta-secondary">{event.location}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-terreta-dark">
              <Users size={20} className="text-terreta-accent" />
              <div>
                <p className="font-semibold">Asistentes</p>
                <p className="text-sm text-terreta-secondary">
                  {event.attendeeCount} {event.attendeeCount === 1 ? 'asistente' : 'asistentes'}
                  {event.maxAttendees && ` / ${event.maxAttendees} máximo`}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {event.description && (
            <div className="mb-8">
              <h2 className="font-sans text-2xl font-bold text-terreta-dark mb-4">Descripción</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-terreta-dark leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-terreta-border">
            {!user ? (
              <div className="w-full bg-terreta-accent/10 border-2 border-terreta-accent rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <UserPlus size={24} className="text-terreta-accent" />
                  <h3 className="font-serif text-xl font-bold text-terreta-dark">
                    ¿Quieres asistir a este evento?
                  </h3>
                </div>
                <p className="text-terreta-dark/80 mb-4">
                  Debes registrarte en Terreta Hub para poder asistir a este evento.
                </p>
                <button
                  onClick={() => onOpenAuth(event.organizer.username)}
                  className="bg-terreta-accent hover:opacity-90 text-white px-6 py-3 rounded-full font-bold transition-all"
                >
                  Crear cuenta e inscribirse
                </button>
              </div>
            ) : event.registrationRequired ? (
              event.isUserRegistered ? (
                <>
                  <button
                    onClick={handleCancelRegistration}
                    disabled={isRegistering}
                    className="bg-terreta-sidebar hover:bg-terreta-border text-terreta-dark px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50"
                  >
                    {isRegistering ? 'Cancelando...' : 'Cancelar Inscripción'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportToCalendar('download')}
                      className="flex items-center gap-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark px-4 py-2 rounded-full text-sm font-semibold transition-all border border-terreta-border"
                      title="Descargar .ics"
                    >
                      <Download size={18} />
                      .ics
                    </button>
                    <button
                      onClick={() => handleExportToCalendar('google')}
                      className="flex items-center gap-2 bg-terreta-card hover:bg-terreta-sidebar text-terreta-dark px-4 py-2 rounded-full text-sm font-semibold transition-all border border-terreta-border"
                      title="Abrir en Google Calendar"
                    >
                      <ExternalLink size={18} />
                      Google
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="bg-terreta-accent hover:opacity-90 text-white px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50"
                >
                  {isRegistering ? 'Registrando...' : 'Asistir al Evento'}
                </button>
              )
            ) : null}

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-terreta-bg text-terreta-secondary hover:bg-terreta-sidebar border border-terreta-border transition-colors ml-auto"
            >
              <Share2 size={18} />
              Compartir
            </button>
          </div>
        </article>

        {/* Estadísticas para el organizador */}
        {isOrganizer && (
          <div className="bg-terreta-card rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8 mb-6">
            <h2 className="font-sans text-2xl font-bold text-terreta-dark mb-6">Estadísticas del Evento</h2>
            
            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terreta-accent"></div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-terreta-bg rounded-lg p-4 border border-terreta-border">
                    <p className="text-sm text-terreta-secondary mb-1">Personas Registradas</p>
                    <p className="text-3xl font-bold text-terreta-dark">{stats.totalRegistrations}</p>
                  </div>
                  <div className="bg-terreta-bg rounded-lg p-4 border border-terreta-border">
                    <p className="text-sm text-terreta-secondary mb-1">Registros desde este Evento</p>
                    <p className="text-3xl font-bold text-terreta-accent">{stats.totalReferrals}</p>
                  </div>
                </div>

                {stats.totalReferrals > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg text-terreta-dark mb-4">
                      Personas que se registraron en Terreta Hub desde este evento
                    </h3>
                    <div className="space-y-3">
                      {stats.referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center gap-3 p-3 bg-terreta-bg rounded-lg border border-terreta-border"
                        >
                          <img
                            src={referral.inviteeAvatar}
                            alt={referral.inviteeName}
                            className="w-10 h-10 rounded-full border border-terreta-border"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-terreta-dark">{referral.inviteeName}</p>
                            <p className="text-xs text-terreta-secondary">@{referral.inviteeUsername}</p>
                          </div>
                          <p className="text-xs text-terreta-secondary">
                            {new Date(referral.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-terreta-secondary">No hay estadísticas disponibles aún.</p>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && event && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postUrl={`/evento/${event.organizer.username}/${event.slug}`}
          postContent={event.description || event.title}
          authorName={event.organizer.name}
          authorHandle={event.organizer.username}
          title={event.title}
          contentType="event"
        />
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          duration={4000}
          variant="terreta"
        />
      )}
    </div>
  );
};
