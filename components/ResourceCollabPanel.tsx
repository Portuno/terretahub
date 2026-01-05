import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';
import { HelpCircle, Lightbulb } from 'lucide-react';

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

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
    return !hasDetails || selectedVerticals.length === 0;
  }, [details, selectedVerticals]);

  const handleSubmit = async () => {
    if (isSubmitDisabled || submitState === 'loading') return;

    setSubmitState('loading');
    setErrorMessage('');

    // Build payload - verticals is required by validation, so it should always be present
    const payload: any = {
      details: details.trim(),
      verticals: Array.isArray(selectedVerticals) ? selectedVerticals : [],
      format_tags: Array.isArray(formatTags) ? formatTags : [],
      need_types: [] as string[]
    };

    // Add optional fields
    if (user?.id) {
      payload.user_id = user.id;
    }

    if (placeholder) {
      payload.placeholder_used = placeholder;
    }

    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      payload.user_agent = navigator.userAgent;
    }

    console.log('[ResourceCollabPanel] Submitting payload:', JSON.stringify(payload, null, 2));

    try {
      const { error } = await supabase
        .from('resource_needs')
        .insert(payload);
      
      if (error) {
        console.error('[ResourceCollabPanel] Error inserting resource need:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        setSubmitState('error');
        setErrorMessage(error.message || 'No se pudo enviar tu necesidad.');
        return;
      }

      console.log('[ResourceCollabPanel] Resource need created successfully');
      setSubmitState('success');
      setDetails('');
      setSelectedVerticals([]);
      setFormatTags([]);
      rotatePlaceholder();
    } catch (err: any) {
      console.error('[ResourceCollabPanel] Exception during submit:', {
        message: err?.message,
        stack: err?.stack,
        fullError: JSON.stringify(err, null, 2)
      });
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
    <section className="w-full h-full flex flex-col gap-2 rounded-2xl bg-terreta-card border border-terreta-border p-3 shadow-lg flex-grow min-h-[calc(100vh-4rem)]">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-1 shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-terreta-accent mb-1">
            Recursos (En construcción)
          </p>
          <h2 className="text-3xl font-serif font-bold text-terreta-dark leading-tight">
            Panel de Colaboración
          </h2>
        </div>
        <p className="text-sm text-terreta-secondary max-w-xl text-right md:text-right hidden md:block pb-2">
          Siembra tu necesidad aquí para priorizar el contenido.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-3 rounded-xl bg-terreta-bg/30 p-3 shadow-inner border border-terreta-border overflow-y-auto">
        
        {/* Encapsulated Options: Verticals */}
        <div className="bg-terreta-card/80 rounded-xl p-4 shadow-sm border border-terreta-border/50 shrink-0">
            <div className="flex flex-col gap-3 relative">
              <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-terreta-dark uppercase tracking-wide">1. Vertical de Interés</p>
                  <div className="group relative">
                      <HelpCircle size={14} className="text-terreta-gold cursor-help" />
                      <div className="absolute left-full top-0 ml-2 w-48 bg-terreta-sidebar text-terreta-dark text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity border border-terreta-border">
                          Elige el sector al que pertenece tu consulta.
                      </div>
                  </div>
              </div>
              <div className="w-8 h-0.5 bg-terreta-border rounded-full"></div>
              <div className="flex flex-wrap gap-2">
                {VERTICALS.map((vertical) => {
                  const isActive = selectedVerticals.includes(vertical);
                  // Determine color based on vertical name
                  let activeClass = 'border-terreta-secondary/50 bg-terreta-bg text-terreta-dark';
                  if (vertical === 'Tecnología' || vertical === 'Salud') {
                      activeClass = 'border-emerald-500 bg-emerald-50/10 text-emerald-600 dark:text-emerald-400';
                  } else if (vertical === 'Arte & Educación' || vertical === 'Comunidad') {
                      activeClass = 'border-[#8D6E63] bg-[#FDF8F6]/10 text-[#8D6E63]'; 
                  } else {
                      activeClass = 'border-amber-500 bg-amber-50/10 text-amber-600 dark:text-amber-400';
                  }

                  const buttonClassName = isActive
                    ? `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-1 focus:ring-terreta-accent ${activeClass} shadow-sm font-semibold`
                    : 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-1 focus:ring-terreta-accent border-terreta-border text-terreta-secondary hover:border-terreta-accent/50 bg-terreta-card';

                  return (
                    <button
                      key={vertical}
                      type="button"
                      onClick={() => toggleItem(vertical, selectedVerticals, setSelectedVerticals)}
                      className={buttonClassName}
                    >
                      {vertical}
                    </button>
                  );
                })}
              </div>
            </div>
        </div>

        {/* Formats */}
        <div className="grid gap-2 shrink-0 px-1 mt-2">
          <div className="flex items-center gap-2">
               <label className="text-sm font-bold text-terreta-dark uppercase tracking-wide">2. Formatos preferidos</label>
               <div className="group relative">
                  <HelpCircle size={14} className="text-terreta-gold cursor-help" />
                   <div className="absolute left-0 bottom-6 w-48 bg-terreta-sidebar text-terreta-dark text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity border border-terreta-border">
                      ¿Cómo prefieres consumir este contenido? (PDF, Video, Taller...)
                   </div>
               </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center pb-2 border-b border-terreta-border focus-within:border-terreta-accent transition-colors">
            {formatTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-terreta-bg px-3 py-1 text-sm text-terreta-dark border border-terreta-border"
              >
                {tag}
                <button
                  type="button"
                  className="text-terreta-secondary hover:text-terreta-dark focus:outline-none font-bold ml-1"
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
                className="flex-1 min-w-[200px] bg-transparent text-base text-terreta-dark placeholder-terreta-secondary/50 outline-none py-1"
              />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 flex-1 min-h-[150px] px-1 mt-2">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-terreta-dark uppercase tracking-wide">3. Detalles</p>
                 <div className="group relative">
                  <HelpCircle size={14} className="text-terreta-gold cursor-help" />
                   <div className="absolute left-0 bottom-6 w-64 bg-terreta-sidebar text-terreta-dark text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity border border-terreta-border">
                      Cuéntanos más sobre lo que necesitas. Sé específico para que podamos ayudarte mejor.
                   </div>
               </div>
            </div>
            
            <button
              type="button"
              onClick={rotatePlaceholder}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded bg-terreta-bg/50 hover:bg-terreta-bg text-xs text-terreta-accent transition-colors border border-terreta-border"
            >
               <Lightbulb size={12} className="text-terreta-gold group-hover:text-terreta-accent" />
               <span className="font-semibold">Inspiración</span>
            </button>
          </div>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={placeholder}
            className="flex-1 w-full rounded-xl border-b-2 border-terreta-border bg-terreta-card/50 px-4 py-3 text-base text-terreta-dark placeholder-terreta-secondary/40 focus:border-terreta-accent focus:bg-terreta-card transition-all resize-none outline-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-terreta-border shrink-0">
             <div className="flex items-center gap-3 ml-auto">
                {submitState === 'success' && (
                <span className="text-xs text-emerald-600 font-bold animate-pulse">¡Recibido!</span>
                )}
                {submitState === 'error' && (
                <span className="text-xs text-red-600 font-bold">Error al enviar.</span>
                )}
                <button
                type="button"
                disabled={isSubmitDisabled || submitState === 'loading'}
                onClick={handleSubmit}
                className="rounded-lg bg-terreta-accent px-6 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transform active:scale-95"
                >
                {submitState === 'loading' ? '...' : 'Enviar'}
                </button>
             </div>
        </div>
      </div>
    </section>
  );
};
