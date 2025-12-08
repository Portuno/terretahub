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
    <section className="w-full mt-0 mb-3 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-amber-50 via-emerald-50/60 to-orange-50 p-4 shadow-lg border border-amber-100">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            Recursos (En construcción)
          </p>
          <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
            Panel de Colaboración
          </h2>
        </div>
        <p className="text-sm text-slate-700 max-w-xl text-right md:text-right hidden md:block">
          Siembra tu necesidad aquí para priorizar el contenido.
        </p>
        <p className="text-sm text-slate-700 md:hidden">
           Siembra tu necesidad aquí para priorizar el contenido.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl bg-white/90 p-4 shadow-inner border border-white/70">
        
        {/* Top Row: Type and Vertical side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">1. Tipo de Recurso</p>
              <div className="flex flex-wrap gap-1.5">
                {RESOURCE_TYPES.map((type) => {
                  const isActive = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleItem(type, selectedTypes, setSelectedTypes)}
                      className={`${badgeBase} ${isActive ? badgeActive : badgeIdle} px-2.5 py-1 text-xs`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">2. Vertical de Interés</p>
              <div className="flex flex-wrap gap-1.5">
                {VERTICALS.map((vertical) => {
                  const isActive = selectedVerticals.includes(vertical);
                  return (
                    <button
                      key={vertical}
                      type="button"
                      onClick={() => toggleItem(vertical, selectedVerticals, setSelectedVerticals)}
                      className={`${badgeBase} ${isActive ? badgeActive : badgeIdle} px-2.5 py-1 text-xs`}
                    >
                      {vertical}
                    </button>
                  );
                })}
              </div>
            </div>
        </div>

        {/* Middle Row: Formats */}
        <div className="grid gap-2">
          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide">3. Formatos preferidos</label>
          <div className="flex flex-wrap gap-2 items-center">
            {formatTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 border border-emerald-200"
              >
                {tag}
                <button
                  type="button"
                  className="text-emerald-700 hover:text-emerald-900 focus:outline-none font-bold ml-1"
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
                placeholder="Ej: videos cortos, PDF... (Enter)"
                className="flex-1 min-w-[200px] bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400 border-b border-transparent focus:border-emerald-300 transition-colors"
              />
          </div>
        </div>

        {/* Bottom Row: Details */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">4. Detalles</p>
            <button
              type="button"
              onClick={rotatePlaceholder}
              className="text-[10px] text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
               <span>Inspiración</span>
            </button>
          </div>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 resize-y"
          />
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-emerald-100/50">
            <div className="flex items-center gap-3 w-full justify-between">
             <span className="text-[10px] text-slate-400 italic hidden sm:block">
                Tu aporte construye la comunidad.
             </span>
             <div className="flex items-center gap-3 ml-auto">
                {submitState === 'success' && (
                <span className="text-xs text-emerald-700 font-bold animate-pulse">¡Recibido!</span>
                )}
                {submitState === 'error' && (
                <span className="text-xs text-red-600 font-bold">Error al enviar.</span>
                )}
                <button
                type="button"
                disabled={isSubmitDisabled || submitState === 'loading'}
                onClick={handleSubmit}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transform active:scale-95"
                >
                {submitState === 'loading' ? '...' : 'Enviar'}
                </button>
             </div>
            </div>
        </div>
      </div>
    </section>
  );
};
