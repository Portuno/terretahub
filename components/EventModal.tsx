import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Users, Clock, Image as ImageIcon, Globe, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthUser, Event, EventStatus } from '../types';
import { Toast } from './Toast';
import { uploadEventImageToStorage } from '../lib/eventImageUtils';
import { generateUniqueEventSlug } from '../lib/eventUtils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  event?: Event; // Si se proporciona, es modo edición
  onSave: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, user, event, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState<number | undefined>(undefined);
  const [registrationRequired, setRegistrationRequired] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (event) {
      // Modo edición
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setLocationUrl(event.locationUrl || '');
      
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
      
      setImageUrl(event.imageUrl || '');
      setSelectedImageFile(null);
      setImagePreview(event.imageUrl || null);
      setCategory(event.category || '');
      setIsOnline(event.isOnline);
      setMaxAttendees(event.maxAttendees);
      setRegistrationRequired(event.registrationRequired);
    } else {
      // Modo creación - resetear
      setTitle('');
      setDescription('');
      setLocation('');
      setLocationUrl('');
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setStartDate(tomorrow.toISOString().split('T')[0]);
      setStartTime('10:00');
      setEndDate(tomorrow.toISOString().split('T')[0]);
      setEndTime('12:00');
      
      setImageUrl('');
      setSelectedImageFile(null);
      setImagePreview(null);
      setCategory('');
      setIsOnline(false);
      setMaxAttendees(undefined);
      setRegistrationRequired(true);
    }
  }, [event, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      setToastMessage('El título es obligatorio');
      setShowToast(true);
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setToastMessage('Las fechas y horas son obligatorias');
      setShowToast(true);
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setToastMessage('La fecha de fin debe ser posterior a la de inicio');
      setShowToast(true);
      return;
    }

    setIsSaving(true);

    try {
      // Todos los eventos se crean con status 'review' para aprobación del admin
      let finalImageUrl = imageUrl.trim() || null;

      // Si hay un archivo de imagen seleccionado, subirlo primero
      if (selectedImageFile) {
        try {
          finalImageUrl = await uploadEventImageToStorage(
            user.id,
            event?.id || null,
            selectedImageFile,
            0
          );
        } catch (uploadError) {
          console.error('[EventModal] Error al subir imagen:', uploadError);
          setToastMessage('Error al subir la imagen. Intenta nuevamente.');
          setShowToast(true);
          setIsSaving(false);
          return;
        }
      }

      // Generar slug único para el evento
      const eventSlug = await generateUniqueEventSlug(
        title.trim(),
        user.username,
        user.id,
        event?.id
      );

      const eventData: any = {
        organizer_id: user.id,
        title: title.trim(),
        slug: eventSlug,
        description: description.trim() || null,
        location: location.trim() || null,
        location_url: locationUrl.trim() || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        image_url: finalImageUrl,
        category: category.trim() || null,
        is_online: isOnline,
        max_attendees: maxAttendees || null,
        registration_required: registrationRequired,
      };

      if (event) {
        // Actualizar evento existente - mantener el status actual
        // No incluir status en la actualización para mantener el estado actual
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .eq('organizer_id', user.id);

        if (error) {
          console.error('[EventModal] Error updating event:', error);
          setToastMessage('Error al actualizar el evento');
          setShowToast(true);
          setIsSaving(false);
          return;
        }

        setToastMessage('Evento actualizado exitosamente');
      } else {
        // Crear nuevo evento - todos los eventos nuevos se crean como 'draft' para revisión del admin
        const { error: insertError } = await supabase
          .from('events')
          .insert({
            ...eventData,
            status: 'draft' // Se crea como draft, el admin lo aprobará
          })
          .select()
          .single();

        if (insertError) {
          console.error('[EventModal] Error creating event:', insertError);
          setToastMessage('Error al crear el evento');
          setShowToast(true);
          setIsSaving(false);
          return;
        }

        setToastMessage('Evento creado exitosamente. Será revisado por un administrador antes de ser publicado.');
      }

      setShowToast(true);
      onSave();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('[EventModal] Exception saving event:', error);
      setToastMessage('Error al guardar el evento');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-terreta-dark/70 backdrop-blur-sm">
        <div className="bg-terreta-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-terreta-border">
          {/* Header */}
          <div className="sticky top-0 bg-terreta-card border-b border-terreta-border px-6 py-4 flex items-center justify-between z-10">
            <h2 className="font-serif text-2xl font-bold text-terreta-dark">
              {event ? 'Editar Evento' : 'Crear Evento'}
            </h2>
            <button
              onClick={onClose}
              className="text-terreta-dark/60 hover:text-terreta-dark transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-terreta-dark mb-2">
                Título del Evento *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                placeholder="Ej: Networking de Emprendedores"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-terreta-dark mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent resize-none"
                placeholder="Describe el evento..."
              />
            </div>

            {/* Fechas y Horas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-terreta-dark mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full mt-2 px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-terreta-dark mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full mt-2 px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-semibold text-terreta-dark mb-2">
                <MapPin size={16} className="inline mr-1" />
                Ubicación
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent mb-2"
                placeholder="Ej: Coworking Valencia, Calle X"
              />
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="w-4 h-4 text-terreta-accent focus:ring-terreta-accent"
                />
                <label htmlFor="isOnline" className="text-sm text-terreta-dark/70">
                  <Globe size={14} className="inline mr-1" />
                  Evento en línea
                </label>
              </div>
              {isOnline && (
                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">
                    <LinkIcon size={16} className="inline mr-1" />
                    URL del Evento (Zoom, Google Meet, etc.)
                  </label>
                  <input
                    type="url"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-semibold text-terreta-dark mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                placeholder="Ej: Networking, Workshop"
              />
            </div>

            {/* Imagen del Evento */}
            <div>
              <label className="block text-sm font-semibold text-terreta-dark mb-2">
                <ImageIcon size={16} className="inline mr-1" />
                Imagen del Evento
              </label>
              
              {/* Input de archivo oculto */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedImageFile(file);
                    setImageUrl(''); // Limpiar URL si se selecciona archivo
                    // Crear preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="event-image-input"
              />

              {/* Botón para seleccionar imagen */}
              <div className="space-y-3">
                <label
                  htmlFor="event-image-input"
                  className="block w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark cursor-pointer hover:bg-terreta-sidebar transition-colors text-center"
                >
                  {selectedImageFile ? 'Cambiar imagen' : 'Seleccionar imagen local'}
                </label>

                {/* Preview de imagen */}
                {(imagePreview || imageUrl) && (
                  <div className="relative w-full max-w-md">
                    <img
                      src={imagePreview || imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-terreta-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageFile(null);
                        setImagePreview(null);
                        setImageUrl('');
                        if (imageInputRef.current) {
                          imageInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label="Eliminar imagen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* O usar URL */}
                {!selectedImageFile && !imagePreview && (
                  <div>
                    <label className="block text-xs text-terreta-dark/60 mb-1">
                      O ingresa una URL de imagen:
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Máximo de Asistentes */}
            <div>
              <label className="block text-sm font-semibold text-terreta-dark mb-2">
                <Users size={16} className="inline mr-1" />
                Máximo de Asistentes
              </label>
              <input
                type="number"
                value={maxAttendees || ''}
                onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                placeholder="Sin límite"
              />
            </div>

            {/* Registro Requerido */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="registrationRequired"
                checked={registrationRequired}
                onChange={(e) => setRegistrationRequired(e.target.checked)}
                className="w-4 h-4 text-terreta-accent focus:ring-terreta-accent"
              />
              <label htmlFor="registrationRequired" className="text-sm text-terreta-dark/70">
                Requiere registro para asistir
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-terreta-card border-t border-terreta-border px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-terreta-sidebar hover:bg-terreta-border text-terreta-dark rounded-full font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-terreta-accent hover:opacity-90 text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : event ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          duration={3000}
          variant="terreta"
        />
      )}
    </>
  );
};
