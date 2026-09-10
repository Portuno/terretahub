import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryStateProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  className?: string;
}

export const QueryState: React.FC<QueryStateProps> = ({
  loading = false,
  error = null,
  onRetry,
  loadingLabel = 'Cargando...',
  className = ''
}) => {
  if (!loading && !error) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {loading && !error ? (
        <>
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-terreta-accent" />
          <p className="text-terreta-secondary">{loadingLabel}</p>
        </>
      ) : (
        <>
          <AlertCircle className="mb-3 text-terreta-accent" size={28} aria-hidden />
          <p className="mb-1 font-semibold text-terreta-dark">No se pudo cargar</p>
          <p className="mb-4 max-w-md text-sm text-terreta-secondary" role="alert">
            {error || 'Algo falló al pedir los datos. Probá de nuevo.'}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full bg-terreta-accent px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw size={16} aria-hidden />
              Reintentar
            </button>
          ) : null}
        </>
      )}
    </div>
  );
};
