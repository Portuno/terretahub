import React from 'react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-terreta-dark/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-sheet bg-terreta-card p-4 shadow-raised duration-shell"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-m-lg text-terreta-dark">{title}</h2>
          <button type="button" onClick={onClose} className="text-m-sm text-terreta-accent">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
