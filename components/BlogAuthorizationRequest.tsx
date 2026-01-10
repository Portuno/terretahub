import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';

interface BlogAuthorizationRequestProps {
  user: AuthUser;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

interface RequestStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export const BlogAuthorizationRequest: React.FC<BlogAuthorizationRequestProps> = ({
  user,
  onClose,
  onRequestSubmitted
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<RequestStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExistingRequest();
  }, [user.id]);

  const loadExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_authorization_requests')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading request:', error);
      } else if (data) {
        setExistingRequest({
          id: data.id,
          status: data.status,
          createdAt: data.created_at
        });
      }
    } catch (err) {
      console.error('Error loading request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (existingRequest) return; // Ya existe una solicitud

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('blog_authorization_requests')
        .insert({
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting request:', error);
        alert('Error al enviar la solicitud. Intenta nuevamente.');
        return;
      }

      setExistingRequest({
        id: data.id,
        status: data.status,
        createdAt: data.created_at
      });

      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Error al enviar la solicitud. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    if (!existingRequest) return null;
    
    switch (existingRequest.status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!existingRequest) return '';
    
    switch (existingRequest.status) {
      case 'approved':
        return 'Tu solicitud ha sido aprobada. Ya puedes escribir blogs.';
      case 'rejected':
        return 'Tu solicitud ha sido rechazada. Puedes contactar a un administrador para más información.';
      case 'pending':
        return 'Tu solicitud está pendiente de revisión. Te notificaremos cuando sea procesada.';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-terreta-card rounded-xl p-6 max-w-md w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terreta-accent mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-terreta-card rounded-xl shadow-lg border border-terreta-border max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-terreta-dark">
            Solicitar autorización para escribir blogs
          </h2>
          <button
            onClick={onClose}
            className="text-terreta-secondary hover:text-terreta-dark transition-colors"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {existingRequest ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-terreta-bg/50 rounded-lg border border-terreta-border">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-terreta-dark">
                  {getStatusText()}
                </p>
                <p className="text-xs text-terreta-secondary mt-1">
                  Solicitud enviada el {new Date(existingRequest.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {existingRequest.status === 'pending' && (
              <p className="text-sm text-terreta-secondary">
                Los administradores revisarán tu solicitud y te notificarán cuando sea procesada.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-terreta-secondary">
              Para escribir blogs en Terreta Hub, necesitas autorización de un administrador.
              Envía tu solicitud y te notificaremos cuando sea procesada.
            </p>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-terreta-accent text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Enviar solicitud</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-terreta-border">
          <button
            onClick={onClose}
            className="w-full text-sm text-terreta-secondary hover:text-terreta-dark transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
