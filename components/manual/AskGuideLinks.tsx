import React, { useCallback } from 'react';
import { Sparkles } from 'lucide-react';

interface AskGuideLinksProps {
  articleTitle: string;
  articleMarkdown: string;
  onAskGuide: (prompt: string) => void;
}

const MAX_CHARS_FOR_PROMPT = 6000;

const truncateForPrompt = (text: string): string => {
  const normalized = text.trim();
  if (normalized.length <= MAX_CHARS_FOR_PROMPT) return normalized;
  return `${normalized.slice(0, MAX_CHARS_FOR_PROMPT)}\n\n[...contenido truncado para caber en el prompt...]`;
};

export const AskGuideLinks: React.FC<AskGuideLinksProps> = ({
  articleTitle,
  articleMarkdown,
  onAskGuide,
}) => {
  const handleAskActionPlan = useCallback(() => {
    const md = truncateForPrompt(articleMarkdown);
    const prompt = [
      'Eres una guia practica para implementar este manual.',
      `Articulo: ${articleTitle}`,
      '',
      'Contenido del articulo (referencia principal):',
      md,
      '',
      'Ahora genera:',
      '1) un plan de accion en pasos numerados (para alguien que empieza desde cero)',
      '2) una lista corta de entregables (que debo producir)',
      '3) una checklist de validacion (con criterios claros)',
    ].join('\n');

    onAskGuide(prompt);
  }, [articleMarkdown, articleTitle, onAskGuide]);

  const handleAskChecklist = useCallback(() => {
    const md = truncateForPrompt(articleMarkdown);
    const prompt = [
      'Quiero usar este manual como base para una aplicacion practica.',
      `Articulo: ${articleTitle}`,
      '',
      'Contenido del articulo:',
      md,
      '',
      'Genera:',
      '1) un checklist accionable',
      '2) posibles riesgos/fallos comunes y como evitarlos',
      '3) 3 preguntas especificas que necesites para adaptar el plan a mi caso.',
    ].join('\n');

    onAskGuide(prompt);
  }, [articleMarkdown, articleTitle, onAskGuide]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
      <button
        type="button"
        onClick={handleAskActionPlan}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-terreta-accent/10 border border-terreta-accent/20 text-terreta-accent font-semibold hover:bg-terreta-accent/15 transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
        aria-label="Preguntar a nuestra guía: plan de acción"
      >
        <Sparkles size={18} aria-hidden />
        Preguntar a nuestra guia (plan de accion)
      </button>

      <button
        type="button"
        onClick={handleAskChecklist}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-terreta-bg border border-terreta-border text-terreta-secondary hover:bg-terreta-sidebar transition-colors focus:outline-none focus:ring-2 focus:ring-terreta-accent"
        aria-label="Preguntar a nuestra guía: checklist y riesgos"
      >
        <Sparkles size={18} aria-hidden />
        Preguntar a nuestra guia (checklist y riesgos)
      </button>
    </div>
  );
};

