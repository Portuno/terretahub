import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Users, Clock, Image as ImageIcon, Globe, Link as LinkIcon, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthUser, Event, EventStatus, AdmissionType } from '../types';
import { Toast } from './Toast';
import { uploadEventImageToStorage } from '../lib/eventImageUtils';
import { generateUniqueEventSlug } from '../lib/eventUtils';

const DURATION_PRESETS = [
  { label: 'Media hora', minutes: 30 },
  { label: 'Una hora', minutes: 60 },
  { label: 'Hora y media', minutes: 90 },
  { label: 'Seis horas', minutes: 360 },
] as const;

type DurationPresetKey = typeof DURATION_PRESETS[number]['minutes'] | 'custom';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  event?: Event;
  onSave: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, user, event, onSave }) => {
  const [step, setStep] = useState<1 | 2>(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [datePublic, setDatePublic] = useState(true);
  const [datePlaceholder, setDatePlaceholder] = useState('');
  const [durationPreset, setDurationPreset] = useState<DurationPresetKey>(60);
  const [durationCustomMinutes, setDurationCustomMinutes] = useState<number>(60);

  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [locationPublic, setLocationPublic] = useState(true);
  const [locationPlaceholder, setLocationPlaceholder] = useState('');

  const [maxAttendees, setMaxAttendees] = useState<number | undefined>(undefined);
  const [admissionType, setAdmissionType] = useState<AdmissionType>('pre_registration');
  const [attendeeQuestion, setAttendeeQuestion] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReviewSuccessModal, setShowReviewSuccessModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const durationMinutes = durationPreset === 'custom' ? durationCustomMinutes : durationPreset;

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setCategory(event.category || '');
      setImageUrl(event.imageUrl || '');
      setSelectedImageFile(null);
      setImagePreview(event.imageUrl || null);

      const start = new Date(event.startDate);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setDatePublic(event.datePublic ?? true);
      setDatePlaceholder(event.datePlaceholder || '');
      const mins = event.durationMinutes ?? (Math.round((new Date(event.endDate).getTime() - start.getTime()) / 60000));
      const found = DURATION_PRESETS.find((p) => p.minutes === mins);
      if (found) setDurationPreset(found.minutes);
      else setDurationPreset('custom'), setDurationCustomMinutes(mins);

      setLocation(event.location || '');
      setLocationUrl(event.locationUrl || '');
      setIsOnline(event.isOnline);
      setLocationPublic(event.locationPublic ?? true);
      setLocationPlaceholder(event.locationPlaceholder || '');

      setMaxAttendees(event.maxAttendees);
      setAdmissionType(event.admissionType ?? (event.registrationRequired ? 'pre_registration' : 'open'));
      setAttendeeQuestion(event.attendeeQuestion || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setImageUrl('');
      setSelectedImageFile(null);
      setImagePreview(null);

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split('T')[0]);
      setStartTime('10:00');
      setDatePublic(true);
      setDatePlaceholder('');
      setDurationPreset(60);
      setDurationCustomMinutes(60);

      setLocation('');
      setLocationUrl('');
      setIsOnline(false);
      setLocationPublic(true);
      setLocationPlaceholder('');

      setMaxAttendees(undefined);
      setAdmissionType('pre_registration');
      setAttendeeQuestion('');
    }
    setStep(1);
  }, [event, isOpen]);

  const validateStep1 = (): boolean => {
    if (!title.trim()) {
      setToastMessage('El título es obligatorio');
      setShowToast(true);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSave = async () => {
    if (!title.trim()) {
      setToastMessage('El título es obligatorio');
      setShowToast(true);
      return;
    }
    if (!startDate || !startTime) {
      setToastMessage('La fecha y hora de inicio son obligatorias');
      setShowToast(true);
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    setIsSaving(true);

    try {
      let finalImageUrl = imageUrl.trim() || null;
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

      const eventSlug = await generateUniqueEventSlug(
        title.trim(),
        user.username,
        user.id,
        event?.id
      );

      const eventData: Record<string, unknown> = {
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
        registration_required: admissionType === 'pre_registration',
        admission_type: admissionType,
        attendee_question: attendeeQuestion.trim() || null,
        date_public: datePublic,
        date_placeholder: datePublic ? null : (datePlaceholder.trim() || null),
        duration_minutes: durationMinutes,
        location_public: locationPublic,
        location_placeholder: locationPublic ? null : (locationPlaceholder.trim() || null),
      };

      if (event) {
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
        const { error: insertError } = await supabase
          .from('events')
          .insert({
            ...eventData,
            status: 'draft' as EventStatus,
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
        setShowReviewSuccessModal(true);
      }

      if (event) {
        setShowToast(true);
        onSave();
        setTimeout(() => onClose(), 1000);
      }
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
        <div className="bg-terreta-card rounded-lg shadow-2xl w-full max-w-2xl border border-terreta-border overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="shrink-0 bg-terreta-card border-b border-terreta-border px-6 py-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-terreta-dark">
              {event ? 'Editar Evento' : 'Crear Evento'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-terreta-dark/60 hover:text-terreta-dark transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-terreta-accent"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="shrink-0 flex border-b border-terreta-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${step === 1 ? 'bg-terreta-accent/10 text-terreta-accent border-b-2 border-terreta-accent' : 'text-terreta-dark/60 hover:text-terreta-dark'}`}
              aria-current={step === 1 ? 'step' : undefined}
            >
              Paso 1: Información general
            </button>
            <button
              type="button"
              onClick={() => step === 1 && validateStep1() && setStep(2)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${step === 2 ? 'bg-terreta-accent/10 text-terreta-accent border-b-2 border-terreta-accent' : 'text-terreta-dark/60 hover:text-terreta-dark'}`}
              aria-current={step === 2 ? 'step' : undefined}
            >
              Paso 2: Logística y admisión
            </button>
          </div>

          {/* Content — sin scroll, altura al contenido */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {step === 1 && (
              <div className="p-6 space-y-4 overflow-auto flex-1">
                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">Título del Evento *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                    placeholder="Ej: Networking de Emprendedores"
                    aria-required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent resize-none"
                    placeholder="Describe el evento..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">Categoría</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                    placeholder="Ej: Networking, Workshop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">
                    <ImageIcon size={16} className="inline mr-1" />
                    Imagen del Evento
                  </label>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedImageFile(file);
                        setImageUrl('');
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="event-image-input"
                  />
                  <label
                    htmlFor="event-image-input"
                    className="block w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark cursor-pointer hover:bg-terreta-sidebar transition-colors text-center"
                  >
                    {selectedImageFile ? 'Cambiar imagen' : 'Seleccionar imagen local'}
                  </label>
                  {(imagePreview || imageUrl) && (
                    <div className="relative w-full max-w-md mt-2">
                      <img
                        src={imagePreview || imageUrl}
                        alt="Preview"
                        className="w-full h-36 object-cover rounded-lg border border-terreta-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagePreview(null);
                          setImageUrl('');
                          if (imageInputRef.current) imageInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        aria-label="Eliminar imagen"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {!selectedImageFile && !imagePreview && (
                    <div className="mt-2">
                      <label className="block text-xs text-terreta-dark/60 mb-1">O ingresa una URL de imagen:</label>
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
            )}

            {step === 2 && (
              <div className="p-6 space-y-4 overflow-auto flex-1">
                {/* Card: Fecha, duración, ubicación */}
                <div className="rounded-xl border-2 border-terreta-border bg-terreta-bg/50 p-4 space-y-4">
                  <h3 className="font-semibold text-terreta-dark flex items-center gap-2">
                    <Calendar size={18} className="text-terreta-accent" />
                    Fecha y hora
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-terreta-dark mb-1">Día de inicio *</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-terreta-dark mb-1">Hora de inicio *</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="datePublic"
                      checked={datePublic}
                      onChange={(e) => setDatePublic(e.target.checked)}
                      className="w-4 h-4 text-terreta-accent focus:ring-terreta-accent"
                    />
                    <label htmlFor="datePublic" className="text-sm text-terreta-dark/80">
                      Fecha pública (visible para todos)
                    </label>
                  </div>
                  {!datePublic && (
                    <div>
                      <label className="block text-xs font-semibold text-terreta-dark mb-1">Texto mientras la fecha no es pública</label>
                      <input
                        type="text"
                        value={datePlaceholder}
                        onChange={(e) => setDatePlaceholder(e.target.value)}
                        className="w-full px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                        placeholder="Ej: Próximamente"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-terreta-dark mb-1">Duración</label>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_PRESETS.map((p) => (
                        <button
                          key={p.minutes}
                          type="button"
                          onClick={() => setDurationPreset(p.minutes)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${durationPreset === p.minutes ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark hover:bg-terreta-border'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDurationPreset('custom')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${durationPreset === 'custom' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark hover:bg-terreta-border'}`}
                      >
                        Personalizada
                      </button>
                    </div>
                    {durationPreset === 'custom' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={15}
                          step={15}
                          value={durationCustomMinutes}
                          onChange={(e) => setDurationCustomMinutes(Math.max(15, parseInt(e.target.value, 10) || 60))}
                          className="w-24 px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                        />
                        <span className="text-sm text-terreta-dark/70">minutos</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border-2 border-terreta-border bg-terreta-bg/50 p-4 space-y-4">
                  <h3 className="font-semibold text-terreta-dark flex items-center gap-2">
                    <MapPin size={18} className="text-terreta-accent" />
                    Ubicación
                  </h3>
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
                  {isOnline ? (
                    <div>
                      <label className="block text-xs font-semibold text-terreta-dark mb-1">URL (Zoom, Meet, etc.)</label>
                      <input
                        type="url"
                        value={locationUrl}
                        onChange={(e) => setLocationUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                        placeholder="https://..."
                      />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full mt-2 px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                        placeholder="Nombre del enlace (opcional)"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-terreta-dark mb-1">Dirección (para mapa y confirmados)</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                        placeholder="Ej: Coworking Valencia, Calle X"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="locationPublic"
                      checked={locationPublic}
                      onChange={(e) => setLocationPublic(e.target.checked)}
                      className="w-4 h-4 text-terreta-accent focus:ring-terreta-accent"
                    />
                    <label htmlFor="locationPublic" className="text-sm text-terreta-dark/80">
                      Ubicación pública
                    </label>
                  </div>
                  {!locationPublic && (
                    <div>
                      <label className="block text-xs font-semibold text-terreta-dark mb-1">Texto mientras la ubicación no es pública</label>
                      <input
                        type="text"
                        value={locationPlaceholder}
                        onChange={(e) => setLocationPlaceholder(e.target.value)}
                        className="w-full px-3 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent text-sm"
                        placeholder="Ej: Se confirmará a inscritos"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">
                    <Users size={16} className="inline mr-1" />
                    Máximo de asistentes
                  </label>
                  <input
                    type="number"
                    value={maxAttendees ?? ''}
                    onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    min={1}
                    className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent"
                    placeholder="Sin límite"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-terreta-dark mb-2">Estado de admisión</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setAdmissionType('open')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${admissionType === 'open' ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent' : 'border-terreta-border bg-terreta-bg text-terreta-dark hover:border-terreta-accent/50'}`}
                    >
                      Acceso libre
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdmissionType('pre_registration')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${admissionType === 'pre_registration' ? 'border-terreta-accent bg-terreta-accent/10 text-terreta-accent' : 'border-terreta-border bg-terreta-bg text-terreta-dark hover:border-terreta-accent/50'}`}
                    >
                      Pre-inscripción (sujeta a aprobación)
                    </button>
                  </div>
                </div>

                {admissionType === 'pre_registration' && (
                  <div>
                    <label className="block text-sm font-semibold text-terreta-dark mb-2">
                      Pregunta para el asistente (opcional)
                    </label>
                    <textarea
                      value={attendeeQuestion}
                      onChange={(e) => setAttendeeQuestion(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-terreta-bg border border-terreta-border rounded-lg text-terreta-dark focus:outline-none focus:ring-2 focus:ring-terreta-accent resize-none text-sm"
                      placeholder="Ej: Para asistir, cuéntanos cuál es tu principal interés en Real Estate"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 bg-terreta-card border-t border-terreta-border px-6 py-4 flex justify-between gap-3">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-terreta-sidebar hover:bg-terreta-border text-terreta-dark rounded-full font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-terreta-accent hover:opacity-90 text-white rounded-full font-semibold transition-all flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-terreta-sidebar hover:bg-terreta-border text-terreta-dark rounded-full font-semibold transition-all flex items-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-terreta-accent hover:opacity-90 text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : event ? 'Actualizar' : 'Crear'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: evento creado y en revisión */}
      {showReviewSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-terreta-dark/80 backdrop-blur-sm">
          <div
            className="bg-terreta-card rounded-xl shadow-2xl max-w-md w-full p-8 border border-terreta-border text-center"
            role="dialog"
            aria-labelledby="review-success-title"
            aria-describedby="review-success-desc"
          >
            <CheckCircle size={56} className="mx-auto mb-4 text-terreta-accent" aria-hidden />
            <h3 id="review-success-title" className="font-serif text-xl font-bold text-terreta-dark mb-2">
              Evento enviado a revisión
            </h3>
            <p id="review-success-desc" className="text-terreta-dark/80 mb-6">
              Tu evento fue creado y pasó a revisión. Serás notificado cuando un administrador lo publique.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowReviewSuccessModal(false);
                onSave();
                onClose();
              }}
              className="w-full px-6 py-3 bg-terreta-accent hover:opacity-90 text-white rounded-full font-semibold transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

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
