import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

const RESOURCE_TYPES = [
  'Plantillas',
  'Coworkings',
  'Mentores',
  'Fondos',
  'Cursos',
  'Herramientas',
  'Comunidad',
  'Eventos'
];

const VERTICALS = [
  'Tecnología',
  'Arte & Educación',
  'Finanzas',
  'Legal',
  'Comunidad',
  'Salud'
];

const PLACEHOLDERS = [
  '¿Buscas específicamente un mentor con experiencia en rondas de financiación Serie A o una guía legal detallada sobre tokenización? Sé preciso con las cifras y el mercado. Si conoces un nombre que debemos contactar, ¡compártelo!',
  '¿Cuál es el desafío técnico que te detiene? ¿Estás atascado en la implementación de un agente autónomo o necesitas un workshop avanzado sobre la API de React 19? Incluye el framework o la tecnología clave.',
  'Describe el flujo de trabajo que quieres dominar: ¿Necesitas un curso de producción audiovisual para TikTok/YouTube o una mentoría para monetizar tu arte digital? ¿Qué artista o plataforma te inspira?',
  'Sé nuestro guía: ¿Te gustaría aportar tu propio conocimiento, dando una charla o un taller sobre Marketing de Contenidos? Menciona tu propuesta y el tiempo que necesitas. ¡Hacemos esto juntos!',
  '¿Buscas un espacio de coworking específico con buen café en la zona centro, o un grupo de networking exclusivo para Founders B2B? Danos la ubicación o el tipo de evento que te hace falta.',
  'Cuéntanos sobre los límites: ¿Buscas recursos sobre ética de la IA, contratos inteligentes o salud mental para emprendedores? Menciona el problema legal o de bienestar que es más urgente en tu sector.',
  'Piensa en el recurso ideal para tu yo de 2026: ¿Qué hito de crecimiento te ayudaría a alcanzar? ¿Un curso sobre el futuro del e-commerce o un acceso exclusivo a una convocatoria de fondos europea? Describe el impacto.',
  'Cuéntanos con detalle tu necesidad: ¿Buscas la guía definitiva de pitch deck, un mentor de UX o información sobre DeFi? Si tienes el nombre de un recurso que te encanta, compártelo. ¡Tu aporte prioriza nuestro trabajo!'
];

interface ResourceCollabPanelProps {
  user?: AuthUser | null;
}

export const ResourceCollabPanel: React.FC<ResourceCollabPanelProps> = ({ user }) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [formatTags, setFormatTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [placeholder, setPlaceholder] = useState<string>(PLACEHOLDERS[0]);
  const [submitState, setSubmitState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    rotatePlaceholder();
  }, []);

  const rotatePlaceholder = () => {
    const options = PLACEHOLDERS.filter((item) => item !== placeholder);
    const next = options[Math.floor(Math.random() * options.length)] || PLACEHOLDERS[0];
    setPlaceholder(next);
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
    return !hasDetails || (selectedTypes.length === 0 && selectedVerticals.length === 0);
  }, [details, selectedTypes, selectedVerticals]);

  const handleSubmit = async () => {
    if (isSubmitDisabled || submitState === 'loading') return;

    setSubmitState('loading');
    setErrorMessage('');

    const payload = {
      user_id: user?.id ?? null,
      need_types: selectedTypes,
      format_tags: formatTags,
      verticals: selectedVerticals,
      details: details.trim(),
      placeholder_used: placeholder,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };

    try {
      const { error } = await supabase.from('resource_needs').insert(payload);
      if (error) {
        setSubmitState('error');
        setErrorMessage(error.message || 'No se pudo enviar tu necesidad.');
        return;
      }

      setSubmitState('success');
      setDetails('');
      setSelectedTypes([]);
      setSelectedVerticals([]);
      setFormatTags([]);
      rotatePlaceholder();
    } catch (err: any) {
      setSubmitState('error');
      setErrorMessage(err?.message || 'No se pudo enviar tu necesidad.');
    } finally {
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  const badgeBase =
    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';
  const badgeActive = 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm';
  const badgeIdle = 'border-amber-200 text-slate-700 hover:border-emerald-500 bg-white/70';

  return (
    <section className="w-full my-3 md:my-5 flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-amber-50 via-emerald-50/60 to-orange-50 p-4 md:p-6 lg:p-7 shadow-lg border border-amber-100">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
          Recursos (En construcción)
        </p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
          Panel de Colaboración
        </h2>
        <p className="text-base md:text-lg text-slate-700">
          La sección de Recursos está en construcción, ¡pero no queremos construirla solos! Siembra tu necesidad aquí para que la comunidad nos ayude a priorizar el contenido.
        </p>
      </header>

      <div className="grid gap-5 md:gap-6 rounded-2xl bg-white/90 p-5 md:p-6 shadow-inner border border-white/70">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Paso 1: Tipo de Recurso</p>
              <p className="text-sm text-slate-600">¿Qué tipo de herramienta o apoyo necesitas?</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_TYPES.map((type) => {
              const isActive = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  role="checkbox"
                  aria-checked={isActive}
                  tabIndex={0}
                  onClick={() => toggleItem(type, selectedTypes, setSelectedTypes)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleItem(type, selectedTypes, setSelectedTypes);
                    }
                  }}
                  className={`${badgeBase} ${isActive ? badgeActive : badgeIdle}`}
                >
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          <label className="text-sm font-semibold text-emerald-800">¿Qué formatos consumes?</label>
          <div className="flex flex-wrap gap-2">
            {formatTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Quitar ${tag}`}
                  className="text-emerald-700 hover:text-emerald-900 focus:outline-none"
                  onClick={() => handleRemoveTag(tag)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleRemoveTag(tag);
                    }
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Ej: videos cortos, guías PDF, podcast, newsletters."
            aria-label="Formatos que consumes"
            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
          <p className="text-xs text-slate-500">Presiona Enter o coma para agregar cada formato.</p>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-emerald-800">¿Qué Vertical te Interesa?</p>
          <div className="flex flex-wrap gap-2">
            {VERTICALS.map((vertical) => {
              const isActive = selectedVerticals.includes(vertical);
              return (
                <button
                  key={vertical}
                  type="button"
                  role="checkbox"
                  aria-checked={isActive}
                  tabIndex={0}
                  onClick={() => toggleItem(vertical, selectedVerticals, setSelectedVerticals)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleItem(vertical, selectedVerticals, setSelectedVerticals);
                    }
                  }}
                  className={`${badgeBase} ${isActive ? badgeActive : badgeIdle}`}
                >
                  {vertical}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-800">Detalles y Colaboración</p>
            <button
              type="button"
              onClick={rotatePlaceholder}
              className="text-xs text-emerald-700 underline underline-offset-4 hover:text-emerald-900 focus:outline-none"
            >
              Actualizar placeholder
            </button>
          </div>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={placeholder}
            aria-label="Detalles y colaboración"
            className="min-h-[200px] w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-500">
            Comparte lo que necesitas y cómo quieres recibirlo. Sumamos la voz de la comunidad.
          </div>
          <div className="flex items-center gap-3">
            {submitState === 'success' && (
              <span className="text-sm text-emerald-700 font-semibold">¡Recibido! Gracias por guiar el panel.</span>
            )}
            {submitState === 'error' && (
              <span className="text-sm text-red-600 font-semibold">{errorMessage || 'Algo salió mal.'}</span>
            )}
            <button
              type="button"
              disabled={isSubmitDisabled || submitState === 'loading'}
              onClick={handleSubmit}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Enviar necesidad"
            >
              {submitState === 'loading' ? 'Enviando...' : 'Enviar necesidad'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
