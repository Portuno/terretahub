import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface SectionLearningModalProps {
  isOpen: boolean;
  topicTitle: string;
  onClose: () => void;
  onComplete: () => void;
  isSubmitting?: boolean;
}

export const SectionLearningModal: React.FC<SectionLearningModalProps> = ({
  isOpen,
  topicTitle,
  onClose,
  onComplete,
  isSubmitting = false
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-terreta-dark/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Introducción de ${topicTitle}`}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-terreta-border bg-terreta-card p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-terreta-dark/70 transition-colors hover:bg-terreta-bg hover:text-terreta-dark"
          aria-label="Cerrar introducción"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-terreta-accent/10 text-terreta-accent">
          <Sparkles size={20} />
        </div>

        <h3 className="font-serif text-2xl font-bold text-terreta-dark">
          Proceso de aprendizaje
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-terreta-dark/75">
          Aquí vas a aprender sobre <span className="font-bold text-terreta-dark">{topicTitle}</span>.
        </p>
        <p className="mt-2 text-xs text-terreta-dark/60">
          Al completar esta introducción ganarás 12 Totes (solo una vez por tópico).
        </p>

        <button
          type="button"
          onClick={onComplete}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-terreta-accent px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Completar introducción de ${topicTitle}`}
        >
          {isSubmitting ? 'Completando...' : 'Completar'}
        </button>
      </div>
    </div>
  );
};
