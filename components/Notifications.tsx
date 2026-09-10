import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification as NotificationType } from '../types';
import { generateSlug } from '../lib/utils';
import { useModalA11y } from '../hooks/useModalA11y';

interface NotificationsProps {
  userId: string;
}

export const Notifications: React.FC<NotificationsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const panelRef = useModalA11y(isOpen, closePanel);

  const loadNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error al cargar notificaciones:', error);
        setLoadError('No pudimos cargar la actividad. Probá de nuevo.');
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setLoadError('No pudimos cargar la actividad. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, panelRef]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error al marcar notificación como leída:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    setIsOpen(false);

    if (!notification.related_id || !notification.related_type) {
      return;
    }

    try {
      switch (notification.related_type) {
        case 'post':
          navigate(`/agora/post/${notification.related_id}`);
          break;

        case 'project': {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('name')
            .eq('id', notification.related_id)
            .single();

          if (!projectError && projectData) {
            navigate(`/proyecto/${generateSlug(projectData.name)}`);
          } else {
            navigate('/proyectos');
          }
          break;
        }

        case 'blog': {
          const { data: blogData, error: blogError } = await supabase
            .from('blogs')
            .select('slug, author:profiles!blogs_author_id_fkey(username)')
            .eq('id', notification.related_id)
            .single();

          if (!blogError && blogData) {
            const username = (blogData.author as { username?: string } | null)?.username;
            if (username && blogData.slug) {
              navigate(`/blog/${username}/${blogData.slug}`);
            } else {
              navigate('/blogs');
            }
          } else {
            navigate('/blogs');
          }
          break;
        }

        case 'event': {
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('slug, organizer:profiles!events_organizer_id_fkey(username)')
            .eq('id', notification.related_id)
            .single();

          if (!eventError && eventData) {
            const username = (eventData.organizer as { username?: string } | null)?.username;
            if (username && eventData.slug) {
              navigate(`/evento/${username}/${eventData.slug}`);
            } else {
              navigate('/eventos');
            }
          } else {
            navigate('/eventos');
          }
          break;
        }

        default:
          if (notification.type === 'comment' || notification.type === 'mention') {
            navigate(`/agora/post/${notification.related_id}`);
          }
          break;
      }
    } catch (err) {
      console.error('Error al navegar desde notificación:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) {
        console.error('Error al marcar todas como leídas:', error);
        return;
      }

      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'mention':
        return <MessageSquare size={16} className="text-purple-500" />;
      case 'project_approved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'project_rejected':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'hace un momento';
    }
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative text-terreta-dark/60 hover:text-terreta-dark transition-colors"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-12 w-[min(24rem,calc(100vw-2rem))] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[min(600px,70vh)] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-title"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 id="notifications-title" className="font-serif text-lg text-terreta-dark">
              Actividad
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#D97706] hover:text-[#B45309] font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
              <button
                type="button"
                onClick={closePanel}
                className="text-gray-400 hover:text-terreta-dark transition-colors"
                aria-label="Cerrar notificaciones"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706]" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-sm text-gray-600 mb-3">{loadError}</p>
                <button
                  type="button"
                  onClick={loadNotifications}
                  className="text-sm font-semibold text-[#D97706]"
                >
                  Reintentar
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No hay actividad todavía</p>
                <p className="text-sm text-gray-400 mt-1">
                  Acá vas a ver menciones y cuando aprueben un proyecto tuyo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-medium ${
                              !notification.is_read
                                ? 'text-terreta-dark font-semibold'
                                : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
